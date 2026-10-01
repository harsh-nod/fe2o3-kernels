#!/usr/bin/env bash
set -euo pipefail

# Run from the fe2o3 compiler checkout at fed6998b1a5eaf2530e94664a1ede650382a8990.
: "${TUTORIALS:?Set TUTORIALS to the absolute fe2o3-kernels checkout path}"
repo="$PWD"
helpers="$TUTORIALS/examples/mixed-tile-cpu-v18"
recorded="${MIXED_TILE_CAPTURE_DIR:-$helpers/fed6998b-20261001}"
# For historical captures, select their directory and explicitly set an empty receipt.
receipt="${MIXED_TILE_CAPTURE_RECEIPT-$recorded/collector.receipt.json}"
capture_receipt=()
if [[ -n "$receipt" ]]; then
  capture_receipt=(--receipt "$receipt")
fi
compiler_head="$(git rev-parse HEAD)"
if ! git diff --quiet HEAD --; then
  printf '%s\n' "Capture preflight refused: tracked compiler sources differ from HEAD." >&2
  exit 1
fi
declare -A request_template result_template
for order in blocked striped; do
  # The collector maps original filenames; the historical format remains explicit.
  selected="$(python3 "$helpers/capture-files.py" "$recorded" "$order" \
    "$compiler_head" "${capture_receipt[@]}")"
  mapfile -t captured <<< "$selected"
  [[ "${#captured[@]}" == 2 ]]
  request_template[$order]="${captured[0]}"
  result_template[$order]="${captured[1]}"
done

cargo build --locked -p rustc-codegen-fe2o3 \
  --bin fe2o3-export-sim --bin fe2o3-rustc-extract
cargo build --locked -p fe2o3-kir-sim-cli --bin fe2o3-kir-sim
cargo build --locked -p fe2o3-debug-cli --bin fe2o3-debug
cargo test --locked --manifest-path examples/workgroup_sync_v1/Cargo.toml \
  --no-default-features --test mixed_tile

target_root="$(realpath -m "${CARGO_TARGET_DIR:-target}")"
tools="$target_root/debug"
export_target="$target_root/mixed-tile-cpu-export"
out="$(mktemp -d)"
for order in blocked striped; do
  "$tools/fe2o3-export-sim" \
    --diagnostic-kir-v18 --diagnostic-tile-order "$order" \
    --crate fe2o3_workgroup_sync_v1 --target gfx942 \
    --target-dir "$export_target" --output "$out/$order.kir" \
    -- --manifest-path "$repo/examples/workgroup_sync_v1/Cargo.toml" \
    --no-default-features --features mixed-tile-u32-kernel
  "$tools/fe2o3-kir-sim" inspect \
    --diagnostic-kir-v18 "$out/$order.kir" \
    --output "$out/$order.inventory.json"

  # Preserve the recorded input/canaries but discover this export's kernel ID.
  python3 - "$out/$order.inventory.json" "$out/$order.kir" \
    "${request_template[$order]}" "$out/$order.request.json" <<'PY'
import hashlib
import json
import pathlib
import sys

inventory_path, kir_path, template_path, request_path = map(pathlib.Path, sys.argv[1:])
inventory = json.loads(inventory_path.read_text())
canonical = kir_path.read_bytes()
assert inventory["schema"] == "fe2o3-kernel-inventory-v1"
assert inventory["authority"] == "observation_only"
assert inventory["simulator_admission"] == "not_checked"
assert inventory["simulated"] is False
assert inventory["kir"]["wire_version"] == 18
assert inventory["kir"]["raw_sha256"] == hashlib.sha256(canonical).hexdigest()
assert inventory["kir"]["canonical_bytes"] == len(canonical)
assert len(inventory["kernels"]) == 1
kernel = inventory["kernels"][0]
assert kernel["id"] and kernel["workgroup_size"] == [64, 1, 1]
assert kernel["request_abi"] == "entry_parameter_order" and kernel["results"] == []
parameters = kernel["parameters"]
assert [p["index"] for p in parameters] == [0, 1, 2]
for index, access in [(0, "read_only"), (2, "read_write")]:
    assert parameters[index]["type"] == {
        "kind": "slice", "address_space": "global", "access": access,
        "element": {"kind": "scalar", "type": "u32", "bits": 32},
    }
assert parameters[1]["type"] == {"kind": "scalar", "type": "u64", "bits": 64}
request = json.loads(template_path.read_text())
assert request["schema"] == "fe2o3-simulation-request-v1"
assert request["grid"] == request["workgroup"] == [64, 1, 1]
request["kernel"] = kernel["id"]
with request_path.open("x") as output:
    json.dump(request, output)
    output.write("\n")
PY
  "$tools/fe2o3-kir-sim" --diagnostic-kir-v18 "$out/$order.kir" \
    --request "$out/$order.request.json" --output "$out/$order.result.json"
  # This fixture is an independent-oracle-checked answer for this fixed input,
  # not an oracle for arbitrary replacement inputs or a cross-order comparison.
  python3 "$helpers/verify-result.py" \
    "$out/$order.inventory.json" "$out/$order.request.json" \
    "$out/$order.result.json" "${request_template[$order]}" "${result_template[$order]}"
done

# Start an interactive JSONL session; do not substitute allocation IDs from
# an older transcript for pointers discovered in this session.
"$tools/fe2o3-debug" sim --diagnostic-kir-v18 "$out/blocked.kir" \
  --request "$out/blocked.request.json" --protocol jsonl --wave-width 64
