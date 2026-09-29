import type { CodeTab } from "./model";
import type { NarrativeRegistryEntry } from "./narrative-registry";

// Unregistered draft. Do not attach it to the lesson before the requirements
// below are met by retained public-CLI evidence at one exact compiler revision.
export const mixedTileCpuV18PublicationRequirements = [
  "Bind a public source crate, its exact displayed source, and independent per-order oracle.",
  "Qualify the same source path through both exports, metadata discovery, request construction, simulator, and debugger.",
  "Retain exact compiler/source/KIR/request identities and measured debugger hierarchy and memory responses.",
  "Replace draft command inputs with the qualified public example paths and inventory-derived requests.",
  "Add a separate qualification reference without advancing historical global or existing lesson pins.",
] as const;

export const mixedTileCpuV18FixtureEvidence = {
  compilerRef: "68ff11563da032044e03f5f5a3ac91251b257cba",
  sourceSha256: "144c3db2cd1461feaf860c103d790b98a7221d20c7fea0421459df1ad2ce171f",
  batch: "v18-e3-cli-inventory-mir0-68ff11563da032044e03f5f5a3ac91251b257cba-20260929200841-820606",
  summarySha256: "18d4d5c74c9d10675f24c6e6b6d223d2045cd19eb9f1706b9b933912936b65e9",
  blockedResponsesSha256: "735fe52851126ac3b38aefbfdef15a833f8f552c4a72a8da0e28126abcf9c78e",
  stripedResponsesSha256: "7a576be07579c3b61815051af07608467eaf1c76d2a5871d6d3aee08e36f7d46",
  sourceRoute: "production-ranked-bounds-fixture with genuine external Rust source",
  ordinaryPublicExampleQualified: false,
  inventories: 2,
  simulations: 52,
  debuggerSessions: 2,
  negativeControls: 10,
} as const;

export const mixedTileCpuV18Draft: NarrativeRegistryEntry = {
  sectionId: "mixed-tile-v18",
  title: "A masked tile with ordinary per-lane Rust",
  blocks: [
    {
      type: "callout",
      tone: "boundary",
      title: "Unpublished CPU diagnostic draft",
      text: "A genuine-source fixture completed the public export, inventory, simulator, and debugger workflow at compiler 68ff11563da032044e03f5f5a3ac91251b257cba. The ordinary standalone example-crate route remains pending. This section stays unregistered until that public example and its displayed commands are separately qualified; the fixture result is not a substitute.",
    },
    {
      type: "paragraph",
      text: "This example loads three masked u32 values per logical lane through MaskedTile1D, returns the values and validity bits to ordinary Rust, computes a wrapping weighted sum, and writes through a bounds-checked DisjointSlice using thread::index_1d(). The tile load and SIMT arithmetic belong to the same source kernel. An inactive tile element contributes zero; a lane with no active elements leaves its output untouched.",
    },
    {
      type: "table",
      headers: ["Observation order", "Input index for lane l and element j", "Meaning"],
      rows: [
        ["Blocked", "base + 3*l + j", "Each lane owns three adjacent elements, subject to checked index arithmetic and the input length."],
        ["Striped", "base + 64*j + l", "Each tile element spans the 64 logical lanes; each lane receives values from three stripes."],
      ],
    },
    {
      type: "callout",
      tone: "warning",
      title: "Different mappings can produce different answers",
      text: "The weights 3, 5, and 7 apply to the three per-lane positions. Changing the observation order changes which inputs reach those positions and which lane writes their sum. Compare each order with its own independent oracle; equal source text does not establish equivalent whole-kernel outputs. These diagnostic order choices are not a GPU launch or a general layout-equivalence theorem.",
    },
    {
      type: "steps",
      items: [
        "Build the public exporter, extractor, simulator, and debugger from one qualified compiler checkout. Export both orders from the same source path, with fresh output destinations.",
        "Read the canonical kernel IDs and parameter ABI with fe2o3-kir-sim inspect --diagnostic-kir-v18. Bind the request to the measured kernel ID, not an assumed spelling of mixed_tile_probe.",
        "Construct a request with a 64-lane workgroup, a read-only u32 input, a u64 base scalar, and a read-write u32 output. Preserve exact allocation bounds and initialization state. The exported ABI, rather than the Rust spelling usize, determines the scalar request type.",
        "Run each canonical file with its matching request and compare exact bytes, initialization bits, unchanged input, and canaries with that order's oracle.",
        "Open the same file and request in the JSONL debugger. Discover capabilities, step by operation, inspect the dispatch/workgroup/wave/lane hierarchy, and obtain allocation identities from captured logical pointer values before reading memory.",
      ],
    },
    {
      type: "table",
      headers: ["Inspection", "Question to answer", "Evidence boundary"],
      rows: [
        ["Logical scopes", "Which workgroup, logical Wave64, and lane own the captured state?", "A CPU execution hierarchy, not resident hardware waves or GPU occupancy."],
        ["Logical values", "Which values and pointer identities are captured at this operation?", "Captured KIR values, not physical registers or an authenticated Rust source map."],
        ["Allocation memory", "Which output bytes are initialized, which masked lanes remain untouched, and are the canaries unchanged?", "Measured allocation-relative bytes and initialization bits from this retained execution."],
        ["Independent oracle", "Do the output and untouched regions match the selected mapping?", "A bounded correctness observation for the input cases, not exhaustive verification or cross-order equivalence."],
      ],
    },
    {
      type: "paragraph",
      text: "Useful boundary cases include empty input, lengths around 64 and 192, a shifted base, finite-width base overflow, an output shorter than the launch, and multiple workgroups. Keep output storage initially uninitialized so an omitted write is distinguishable from a valid zero result. Canary checks cover memory around the requested view; they do not replace the simulator's bounds checks.",
    },
    {
      type: "callout",
      tone: "boundary",
      title: "Raw V18 is observation-only",
      text: "This opt-in path executes an admitted scalar diagnostic candidate on the CPU. It does not grant native artifact, GPU launch, hardware validation, performance prediction, protected compiler authentication, or source-to-KIR refinement authority. The source target is not evidence of execution on that GPU. Raw V18 currently requires Wave64 and has no authenticated source map or persisted schedule record/replay. Source stepping and register inspection must report their specific unavailable capabilities instead of inventing data.",
    },
    {
      type: "paragraph",
      text: "The retained fixture run exported both orders from the same source path into fresh files, read two public inventories, passed 52 exact-byte/initialization oracle simulations, completed two 15-command debugger sessions, and checked 10 refusal or unavailable controls. Its simulator reported amdgpu_64_little_endian_v1 with 64-bit indices, separately from the declared gfx942 source profile. Each inventory retained 15 storage-layout rows, a measured mixed_tile_probe kernel ID, and the read-only u32 slice / u64 / read-write u32 slice ABI. Metadata inspection itself reported simulator_admission=not_checked.",
    },
    {
      type: "paragraph",
      text: "At debugger revision 1, inspecting the workgroup revealed logical Wave64 and lane scopes. Captured pointers identified allocation 2 at byte offset 12 as the output view. Reading 52 bytes included three prefix canaries, eight output elements, and two suffix canaries. The output bytes initially matched the canary pattern but had clear initialization bits. After completion and one reverse operation to a retained snapshot, all eight outputs were initialized and both canary regions were unchanged. This distinguishes an unwritten output from a legitimate value without pretending to inspect physical GPU registers.",
    },
    {
      type: "table",
      headers: ["Measured fixture observation", "Blocked", "Striped"],
      rows: [
        ["Canonical identity", "575b85d985374111b3ac76a14f0bbc33102a71967adfd267d845f4ab4a6aec7b", "9337cafc22ff5e0d7b25e7b779d8d81db4facf80f939375c1ccf3bb944a460a1"],
        ["Output initialization before execution", "0xff0f000000f00f", "0xff0f000000f00f"],
        ["Output initialization after completion snapshot", "0xffffffffffff0f", "0xffffffffffff0f"],
        ["First output, hexadecimal u32", "0xffffffcc", "0x0000158c"],
      ],
    },
    {
      type: "paragraph",
      text: "The measured memory example uses the fixture's boundary-value input sequence, not the standalone README's input 1..65. Different first outputs are expected for the weighted per-lane algorithm. Both orders retained the same source and pending identity while their canonical and schedule identities differed. The public-example qualification must record its own identities and results; these hashes and transcripts must not be transferred to it.",
    },
  ],
};

export const mixedTileCpuV18DraftTabs: CodeTab[] = [
  {
    kind: "kernel",
    label: "Mixed tile source",
    language: "rust",
    explanatory: true,
    notice: "Unpublished genuine Rust source for the pending public-CLI CPU qualification. This is not a GPU execution claim.",
    code: String.raw`use fe2o3_device::{kernel, thread, DisjointSlice, KernelContext, MaskedTile1D};

#[kernel(typed, launch(required = [64, 1, 1], max = [64, 1, 1]))]
pub fn mixed_tile_probe(
    mut ctx: KernelContext<'_>,
    input: &[u32],
    base: usize,
    mut output: DisjointSlice<u32>,
) {
    let ([x, y, z], [mx, my, mz]) = ctx.with_workgroup(move |workgroup| {
        let tile = MaskedTile1D::<u32, 64, 3, _>::load_masked(&workgroup, input, base);
        tile.into_fragment().into_parts()
    });
    let x = if mx { x.wrapping_mul(3).wrapping_add(11) } else { 0 };
    let y = if my { y.wrapping_mul(5).wrapping_add(13) } else { 0 };
    let z = if mz { z.wrapping_mul(7).wrapping_add(17) } else { 0 };
    if mx || my || mz {
        if let Some(slot) = output.get_mut(thread::index_1d()) {
            *slot = x.wrapping_add(y).wrapping_add(z);
        }
    }
}`,
  },
  {
    kind: "host",
    label: "Public CLI workflow",
    language: "bash",
    explanatory: true,
    notice: "Public command syntax; the standalone example paths and inventory-derived requests remain pending qualification before publication.",
    code: String.raw`# Run from the qualified fe2o3 compiler workspace.
cargo build --locked -p rustc-codegen-fe2o3 \
  --bin fe2o3-export-sim --bin fe2o3-rustc-extract
cargo build --locked -p fe2o3-kir-sim-cli --bin fe2o3-kir-sim
cargo build --locked -p fe2o3-debug-cli --bin fe2o3-debug

# FE2O3_BIN contains these exact build outputs. KERNEL_MANIFEST and
# KERNEL_CRATE identify the same source crate for both observation orders.
# OUTPUT_DIR is fresh; EXPORT_TARGET is shared between the two exports.
for order in blocked striped; do
  "$FE2O3_BIN/fe2o3-export-sim" \
    --diagnostic-kir-v18 --diagnostic-tile-order "$order" \
    --crate "$KERNEL_CRATE" --target gfx942 \
    --target-dir "$EXPORT_TARGET" \
    --output "$OUTPUT_DIR/$order.kir" \
    -- --manifest-path "$KERNEL_MANIFEST"
done

for order in blocked striped; do
  "$FE2O3_BIN/fe2o3-kir-sim" inspect \
    --diagnostic-kir-v18 "$OUTPUT_DIR/$order.kir" \
    --output "$OUTPUT_DIR/$order.inventory.json"
done

# Pending: bind the standalone example's requests to these actual inventories.
# Do not guess kernel IDs or label the emitted u64 base as an index scalar.
for order in blocked striped; do
  "$FE2O3_BIN/fe2o3-kir-sim" \
    --diagnostic-kir-v18 "$OUTPUT_DIR/$order.kir" \
    --request "$OUTPUT_DIR/$order.request.json" \
    --output "$OUTPUT_DIR/$order.result.json"
done

"$FE2O3_BIN/fe2o3-debug" sim \
  --diagnostic-kir-v18 "$OUTPUT_DIR/blocked.kir" \
  --request "$OUTPUT_DIR/blocked.request.json" \
  --protocol jsonl --wave-width 64`,
  },
  {
    kind: "host",
    label: "Recorded CPU observations",
    language: "text",
    explanatory: true,
    notice: "Selected fields from the retained blocked fixture debugger responses at 68ff1156, not complete protocol messages or results from the pending standalone example.",
    code: String.raw`{
  "request_id": 4,
  "result": {
    "result": "scopes",
    "scopes": [
      {"scope": {"level": "workgroup", "workgroup": [0, 0, 0]}, "state": "running"},
      {"scope": {
        "level": "wave", "workgroup": [0, 0, 0], "wave": 0,
        "active_mask": 18446744073709551615, "wave_width": 64,
        "interpretation": "logical_visualization"
      }, "state": "running"}
    ]
  }
}
{
  "request_id": 10,
  "status": "unavailable",
  "unavailable": {
    "capability": "source_sites",
    "reason": "requires_authenticated_map",
    "state_changed": false,
    "detail": "source stepping requires an exact-KIR bound source map"
  }
}
{
  "request_id": 11,
  "status": "unavailable",
  "unavailable": {
    "capability": "register_values",
    "reason": "not_represented",
    "state_changed": false,
    "detail": "CPU KIR simulation does not expose hardware registers"
  }
}
{
  "request_id": 14,
  "memory": {
    "allocation": {"ordinal": 2, "generation": 0},
    "byte_offset": 0, "requested_bytes": 52, "returned_bytes": 52,
    "availability": {
      "status": "captured", "address_space": "global",
      "bytes": "0x5700d0da5700d0da5700d0daccffffffb0010080faffff7f92010000fd060080ccffffffab060080faffff7f5700d0da5700d0da",
      "initialized": "0xffffffffffff0f",
      "truncated": false
    }
  }
}`,
  },
];
