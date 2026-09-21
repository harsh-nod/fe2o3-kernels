# Lab: a guarded assembly body with a compiler-owned ABI

Experimental contributor exercise for Linux, Node.js 22 or newer, gfx942:xnack-,
Wave64 and workgroup 64×1×1. It supplements the
[instruction-edit lab](public-authoring-inspector-lab-v1.md), but uses the
self-contained setup below rather than that lab's older compiler pin.

Compiler reference: [`c60cd746e63b34b9072a493744d73b87ed1defc3`](https://github.com/harsh-nod/fe2o3/commit/c60cd746e63b34b9072a493744d73b87ed1defc3),
now public on canonical main. The helper and its imports are separately pinned
to public website commit
[`61ff37ac4fea140ccd046b145637b597be7c6645`](https://github.com/harsh-nod/fe2o3-kernels/commit/61ff37ac4fea140ccd046b145637b597be7c6645).
These are this experiment's pins, not the curriculum's `FE2O3_PIN`.

**Fresh source/CPU/LLVM reproduction passed on 2026-09-21.** A bounded maintainer
run on `mi350` used these public compiler/helper pins, one ordinary host build,
three fresh source worktrees, all 96 independent CPU cases and both exact
lowering refusals. It checked 6,924 output words, 52,992 backing bytes, 25,296
unchanged guard/tail bytes and 13,056 invocations, including initialization.
The run reused its host target and offline dependency cache; it does not
establish the clean-target resource cost of the public recipe below.
See the [fresh reproduction record][fresh] for scope and the retained pre-build
preflight failure. The [older source/CPU/native evidence][evidence] remains a
separate historical result, not a new native or GPU-execution claim.

The positive export retained these distinct observed identity domains:

- Raw V17 file (1,017 bytes): `bd8ac1ad4de837952f207bc650f83063e044830c88dee662b7819f4c6be4d066`.
- Typed canonical identity: `b838c1a6aca2333e403074f5652de49e24d45d4c071730ae2e23f43eff714320`.
- Diagnostic LLVM (2,180 bytes): `1524ac60f31913838a29f245459816c2e2051562589774964c725718816bf79f`.

These are observations of that run, not signatures, source authentication or
permission to continue compilation from a saved snapshot. All three source
variants had distinct raw and canonical identities. The retained supervisor
receipt is 519,308 bytes, SHA-256
`efd0ae47b808bd2aa243264acf774b87dd01a597655b92a9a4d3d301fa95a2f1`;
that private task receipt is not needed to execute this public lab.

## 1. Start with the complete source

The [committed fixture][source] has no leading identity instruction.
Its three instructions implement bit selection; Rust supplies a checked slice write.

```rust
//! Fresh-source fixture body for the EXISTING production-extraction fixture.
//! The runner applies this file to its OWN source-only checkout's
//! src/ordered_program_v32.rs, keeping the existing manifest/device dependency.
//! It is not a second simulator kernel or a source-authority serialization.
use fe2o3_device::{DisjointSlice, amdgpu_ordered_program, kernel, thread};
#[kernel(typed, launch(required = [64, 1, 1], max = [64, 1, 1]))]
pub fn ordered_u32_program(mut output: DisjointSlice<u32>, a: u32, b: u32, c: u32) {
    let value = amdgpu_ordered_program! {
        gfx942_xnack_off_wave64;
        scratch(32); out(33); in(34) = a; in(35) = b; in(36) = c;
        xor(scratch, input0, input1);
        and(scratch, scratch, input2);
        xor(out, input1, scratch);
    };
    let index = thread::index_1d();
    if let Some(element) = output.get_mut(index) {
        *element = value;
    }
}
```

The five declared roles are distinct. This diagnostic reserves v0..v7; it does
not let authors choose all physical ABI registers or arbitrary memory effects.

## 2. Export fresh source, then inspect the LLVM boundary

Use a dedicated Bash shell with ordinary rustup proxies on PATH, Git, Node.js
22 or newer, and the installed `nightly-2026-04-03` toolchain including
`rustc-dev` and `rust-src`. Offline dependencies must include both the repository
lockfiles and the pinned toolchain's standard-library lockfile. Install missing
prerequisites separately; a missing package or loader dependency is a setup
failure, not a compiler refusal. Use a clean environment without compiler
wrappers, injected `RUSTFLAGS`/`CARGO_ENCODED_RUSTFLAGS` or unrelated
`FE2O3_*` settings.

Start in an existing website Git checkout. Set `lab_git` and `lab_storage` to
existing absolute directories; both pinned commits must already be available
in their respective repositories. Review configured and traditional Git
post-checkout hooks before creating worktrees. The commands use ordinary
worktree creation without disabling hooks; unexpected hooks or source changes
require review. Original checkouts are not edited.

Create fresh source/build/output paths and retain failures. Use two Cargo jobs,
at least 40 GiB free disk and 64 GiB available RAM, plus enough separately
budgeted build space. The shell commands do not supervise resources or time;
see the limits below. Do not reuse a failed run directory.

```bash
set -euo pipefail
set -C
umask 077
lab_site_git=$(pwd -P)
lab_site_commit=61ff37ac4fea140ccd046b145637b597be7c6645
lab_commit=c60cd746e63b34b9072a493744d73b87ed1defc3
lab_git=/absolute/existing/fe2o3
lab_storage=/absolute/existing/qualification-storage
lab_root=$(mktemp -d -p "$lab_storage" fe2o3-guarded-body.XXXXXXXX)
lab_site="$lab_root/site-tools"
lab_repo="$lab_root/compiler"
git -C "$lab_site_git" worktree add --detach "$lab_site" "$lab_site_commit"
git -C "$lab_git" worktree add --detach "$lab_repo" "$lab_commit"
test "$(git -C "$lab_site" rev-parse HEAD)" = "$lab_site_commit"
test "$(git -C "$lab_repo" rev-parse HEAD)" = "$lab_commit"
test -z "$(git -C "$lab_site" status --porcelain=v1 --untracked-files=all)"
test -z "$(git -C "$lab_repo" status --porcelain=v1 --untracked-files=all)"

export RUSTUP_TOOLCHAIN=nightly-2026-04-03
lab_rustup_proxy_dir=$(dirname "$(command -v rustup)")
export PATH="$lab_rustup_proxy_dir:$PATH"
lab_rustc=$(rustup which --toolchain nightly-2026-04-03 rustc)
CARGO=$(rustup which --toolchain nightly-2026-04-03 cargo)
export CARGO
export CARGO_TARGET_DIR="$lab_root/host-target"
export CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0
unset RUSTC LD_LIBRARY_PATH
mkdir -m 700 -- "$CARGO_TARGET_DIR"
"$lab_rustc" -vV > "$lab_root/rustc-version.txt"
grep -Fx 'release: 1.96.0-nightly' "$lab_root/rustc-version.txt"
grep -Fx 'commit-hash: 55e86c996809902e8bbad512cfb4d2c18be446d9' \
  "$lab_root/rustc-version.txt"
lab_sysroot=$("$lab_rustc" --print sysroot)

cd "$lab_repo"
"$CARGO" build --offline --locked --lib \
  --bin fe2o3-export-sim --bin fe2o3-rustc-extract --bin fe2o3-kir-sim \
  --example inspect_diagnostic_ordered_program_v17 \
  --example diagnostic_source_body_gfx942 \
  -p rustc-codegen-fe2o3 -p fe2o3-kir-sim-cli -p fe2o3-amdgcn-model \
  > "$lab_root/host-build.stdout" 2> "$lab_root/host-build.stderr"
lab_bin="$CARGO_TARGET_DIR/debug"

# The ordinary host build above has no RUSTC/LD override.
# These explicit paths are for the diagnostic commands below.
export RUSTC="$lab_rustc"
export LD_LIBRARY_PATH="$lab_sysroot/lib:$lab_bin"
```

The selected artifacts are pinned rustc/Cargo and the newly built exporter,
its sibling `fe2o3-rustc-extract` and `librustc_codegen_fe2o3.so`,
the simulator, inspector and body emitter. The matching `librustc_driver`
and LLVM libraries are loader dependencies. Version strings and Git pins are
not complete compiler/dependency authentication. Keep the build logs; these
commands reuse your offline dependency cache, rather than rebuilding its origin.

The next commands create a separate source-only worktree at the same compiler
commit, install the complete 910-byte fixture into one existing leaf, and check
its bytes and complete change list. Its manifest, lock and device dependency
remain unchanged. The public shell uses `cp` plus byte checks; this does not
require the private task runner or an agent's `apply_patch` executable.

```bash
body_helper="$lab_site/examples/guarded-assembly-body/lab.mjs"
body_run="$lab_root/guarded-body"
body_fixture=crates/rustc-codegen-fe2o3/tests/fixtures/production-extraction-device
body_template_relative=crates/fe2o3-amdgcn-model/examples/diagnostic_source_body_gfx942/source.rs
body_template="$lab_repo/$body_template_relative"
body_source="$lab_root/guarded-body-source"
git -C "$lab_git" worktree add --detach "$body_source" "$lab_commit"
test "$(git -C "$body_source" rev-parse HEAD)" = "$lab_commit"
test -z "$(git -C "$body_source" status --porcelain=v1 --untracked-files=all)"
test "$(sha256sum "$body_source/$body_fixture/src/ordered_program_v32.rs" | cut -d ' ' -f 1)" = \
  7d219f07461b8eb75d8981b01f680f1b4fa59bee6314b2eff5c501778ed99f31
git -C "$lab_repo" diff --exit-code "$lab_commit" -- "$body_template_relative"
test "$(wc -c < "$body_template")" -eq 910
test "$(sha256sum "$body_template" | cut -d ' ' -f 1)" = \
  3e4e61dc53c57beb6bd7de7e626c03d7f8136d96dc0bb4df16d858f5d2f22958
cp -- "$body_template" "$body_source/$body_fixture/src/ordered_program_v32.rs"
cmp -- "$body_template" "$body_source/$body_fixture/src/ordered_program_v32.rs"
test "$(git -C "$body_source" status --porcelain=v1 --untracked-files=all)" = \
  " M $body_fixture/src/ordered_program_v32.rs"
git -C "$body_source" diff --no-ext-diff -- \
  "$body_fixture/src/ordered_program_v32.rs" > "$lab_root/source.diff"
node "$body_helper" prepare "$body_run"
(
  cd "$body_source"
  "$lab_bin/fe2o3-export-sim" --diagnostic-kir-v17 \
  --crate fe2o3_production_extraction_fixture --target gfx942 \
  --output "$body_run/source-body.kir" --target-dir "$body_run/device" -- \
  --manifest-path "$body_source/$body_fixture/Cargo.toml" \
  -p fe2o3-production-extraction-fixture --lib --no-default-features \
  --features ordered-program-v32 --offline
) > "$body_run/export.stdout" 2> "$body_run/export.stderr"
"$lab_bin/examples/inspect_diagnostic_ordered_program_v17" \
  "$body_run/source-body.kir" "$body_run/case-87-request.json" \
  > "$body_run/inspection.json" 2> "$body_run/inspection.stderr"
"$lab_bin/examples/diagnostic_source_body_gfx942" "$body_run/source-body.kir" \
  > "$body_run/source-body.ll" 2> "$body_run/source-body-identities.txt"
sha256sum "$body_run/source-body.kir" "$body_run/source-body.ll" \
  "$body_run/export.stderr" "$body_run/source-body-identities.txt" \
  > "$body_run/identity-files.sha256"
```

The path is Rust → verified V17 → LLVM function plus constrained assembly →
separately qualified native compilation. LLVM is **not bypassed**: it owns
argument loading, system inputs and global-index computation. The assembly unit
owns arithmetic, addresses, bounds masking, store, wait and exit.
Inspect fresh V17 IDs with the existing inspector; preserve raw-file SHA,
typed canonical identity and LLVM SHA separately. They are not authentication.
The exporter stderr records source-inventory/preflight observations; emitter
stderr records canonical, raw-KIR and LLVM identities. The checksum list above
records those files separately. It does not parse or join their claimed IDs.

## 3. Check behavior before trusting an instruction choice

Run the normal CPU simulator on that same export, not a hand-built substitute.
Independently expect `((a & c) | (b & ~c))` reduced to u32; `(19,23,42)` gives 23.
Use six triples: `(0,0,0)`, `(0xffffffff,0,1)`, `(0xffffffff,1,2)`,
`(0x80000000,0,0x80000000)`, `(0xaaaa5555,0x5555aaaa,19)`, `(19,23,42)`.
For lengths 0,1,63,64,65,127,128,129, set
`g = max(64, ceil(length/64)*64)` and repeat with `g+64` invocations.

For each request, let `G` be its actual launch count (`g` or `g+64`); use `8+4*G`
backing bytes initially `a5` and initialization bits clear. Place the slice at byte 4.
Check every active word/init bit; every guard/inactive byte stays `a5` and
uninitialized. The [guarded-body helper](../examples/guarded-assembly-body/lab.mjs)
creates these 96 requests and checks the results with independent BigInt
bit-selection arithmetic. It never runs the compiler or simulator, constructs
KIR, or authenticates caller-selected files. The older lab's six fixed-length
cases are a different exercise.

Run this Bash loop against the same fresh export; never reuse a failed output
directory. Case 87 above is the 64-element, 64-invocation representative request.

```bash
for body_case in {01..96}; do
  "$lab_bin/fe2o3-kir-sim" --diagnostic-kir-v17 "$body_run/source-body.kir" \
    --request "$body_run/case-$body_case-request.json" \
    --output "$body_run/case-$body_case-result.json" \
    > "$body_run/case-$body_case.stdout" 2> "$body_run/case-$body_case.stderr"
done
node "$body_helper" check "$body_run" \
  > "$body_run/check.stdout" 2> "$body_run/check.stderr"
```

The expected totals are 6,924 output words, 52,992 backing bytes, 25,296 unchanged
guard/tail bytes and 13,056 invocations, with exact initialization bits. The
helper joins declared result identities to the selected inspection and reports
the raw KIR SHA separately. Its raw-file check is length/hash observation,
not proof that a result came from those exact bytes; same-size substitution
needs additional input custody. These are CPU checks, not native output
equivalence. The [logical debugger](ordered-program-debugger-v1.md)
observes one CPU program operation, not per-instruction physical scratch states.
In particular, `check` does not read exporter stderr, source-inventory IDs,
LLVM bytes or emitter stderr. A successful helper check must not be described
as a verified source-to-LLVM identity join.

## 4. Learn from the native boundary

The historical [standalone native experiment][native] consumed its own retained
LLVM using pinned LLVM/LLD and unchanged worker checks, not an alternate
production artifact route. Its O0/O3 reports include the compiler prologue and
exact 12-instruction tail, with
288 kernarg bytes including 256 hidden bytes. Observed VGPR capacity 40 covering
high-water 37 is not an occupancy proof.

Native object reproduction and hardware execution are **out of scope for this
public lab**. The link above is follow-up documentation for the historical
standalone diagnostic, not another required step or an available public
supervisor. Its pinned package, input/link measurements and resource supervision
are not supplied by the tutorial helper. Completing sections 2, 3 and 5 means
source export, CPU checks and diagnostic LLVM/refusals only—not a new native
compilation result. No private task paths or unpublished tools are prerequisites.

- Pointer-high uses typed v4: a scalar input plus VCC broke the e32 carry's constant-bus rule.
- Relevant e32 VCC operands are implicit in MC; do not invent explicit decoded registers.
- `global_store_dword v[2:3], v33, off` matches the verified global pointer; `off` disables scalar addressing.
- EXEC is restored even for an empty mask inside the opaque unit; omitting its clobber is not general advice.

## 5. Try the two real source refusals

In separate fresh copies, change `scratch(32)` to `scratch(4)`, or add one unused
u32 parameter. For the supported profile, require normal export to succeed;
diagnostic lowering must then return exit 1 and empty LLVM stdout, with respectively
`program collides with diagnostic ABI scratch` or
`expected writable global u32 slice and three u32 arguments`.
A build failure, timeout or syntax error is not the intended refusal.

The following Bash sequence makes each one-line change in a separate fresh
source worktree. `git apply --unidiff-zero` uses the exact fixture line and old
text, not a broad replacement. Export must succeed under `set -e`; only the
emitter's expected exit 1 is captured and then checked. Keep both failures.

```bash
for body_variant in scratch-v4 unused-u32-abi; do
  body_negative="$lab_root/guarded-body-$body_variant"
  mkdir -- "$body_negative"
  body_negative_source="$body_negative/source"
  git -C "$lab_git" worktree add --detach "$body_negative_source" "$lab_commit"
  test "$(git -C "$body_negative_source" rev-parse HEAD)" = "$lab_commit"
  test -z "$(git -C "$body_negative_source" status --porcelain=v1 --untracked-files=all)"
  test "$(sha256sum "$body_negative_source/$body_fixture/src/ordered_program_v32.rs" | cut -d ' ' -f 1)" = \
    7d219f07461b8eb75d8981b01f680f1b4fa59bee6314b2eff5c501778ed99f31
  cp -- "$body_template" "$body_negative_source/$body_fixture/src/ordered_program_v32.rs"
  cmp -- "$body_template" "$body_negative_source/$body_fixture/src/ordered_program_v32.rs"
  case "$body_variant" in
    scratch-v4)
      body_hunk='@@ -10 +10 @@'
      body_old='        scratch(32); out(33); in(34) = a; in(35) = b; in(36) = c;'
      body_new='        scratch(4); out(33); in(34) = a; in(35) = b; in(36) = c;'
      body_reason='program collides with diagnostic ABI scratch' ;;
    unused-u32-abi)
      body_hunk='@@ -7 +7 @@'
      body_old='pub fn ordered_u32_program(mut output: DisjointSlice<u32>, a: u32, b: u32, c: u32) {'
      body_new='pub fn ordered_u32_program(mut output: DisjointSlice<u32>, a: u32, b: u32, c: u32, _unused: u32) {'
      body_reason='expected writable global u32 slice and three u32 arguments' ;;
  esac
  printf '%s\n' "--- a/$body_fixture/src/ordered_program_v32.rs" \
    "+++ b/$body_fixture/src/ordered_program_v32.rs" "$body_hunk" \
    "-$body_old" "+$body_new" | git -C "$body_negative_source" apply --unidiff-zero
  test "$(git -C "$body_negative_source" status --porcelain=v1 --untracked-files=all)" = \
    " M $body_fixture/src/ordered_program_v32.rs"
  git -C "$body_negative_source" diff --no-ext-diff -- \
    "$body_fixture/src/ordered_program_v32.rs" > "$body_negative/source.diff"
  (
    cd "$body_negative_source"
    "$lab_bin/fe2o3-export-sim" --diagnostic-kir-v17 \
    --crate fe2o3_production_extraction_fixture --target gfx942 \
    --output "$body_negative/source-body.kir" --target-dir "$body_negative/device" -- \
    --manifest-path "$body_negative_source/$body_fixture/Cargo.toml" \
    -p fe2o3-production-extraction-fixture --lib --no-default-features \
    --features ordered-program-v32 --offline
  ) > "$body_negative/export.stdout" 2> "$body_negative/export.stderr"
  body_status=0
  "$lab_bin/examples/diagnostic_source_body_gfx942" "$body_negative/source-body.kir" \
    > "$body_negative/source-body.ll" 2> "$body_negative/refusal.stderr" || body_status=$?
  test "$body_status" -eq 1
  test ! -s "$body_negative/source-body.ll"
  printf '%s\n' "diagnostic source-body refused: $body_reason" | \
    cmp - "$body_negative/refusal.stderr"
  sha256sum "$body_negative/source-body.kir" "$body_negative/refusal.stderr" \
    > "$body_negative/identity-files.sha256"
done
```

## Limits and evidence boundaries

Keep two Cargo jobs, 40 GiB free disk and 64 GiB available RAM. The maintainer
reproduction used an explicitly reviewed **48 GiB total task-directory cap**,
including tools, repositories, dependencies, targets and logs. That is a
task-specific accounting envelope, not repository policy, a measured minimum
for this fresh lab, or a promise these shell commands will fit. The commands
above do not enforce disk/RAM/time/log supervision; select and monitor a bounded
local run budget, stop on exhaustion and retain the failure. The successful
shared-target reproduction is not a clean-build timing or resource benchmark.

Do not confuse that outer task cap with the public commands' own bounds:

- `diagnostic_source_body_gfx942` accepts at most 64 KiB of input and emits at
  most 16 KiB of LLVM. Its canonical-admission budget is 64 MiB storage and
  2^26 work units, including a 2^20 profile-work charge; these are not a
  whole-process RAM limit or seconds.
- The helper's named `prepare` and `check` commands retain their own limits:
  4 KiB per request, 8 KiB inspection, 64 KiB per result and KIR file, and an
  8 MiB aggregate checked-input budget. They do not supervise compilation.
- The linked historical native experiment has its own 20 GiB accounting
  envelope, 256 MiB new-output cap and documented configure/build/request
  deadlines. This lab does not invoke it or change those limits.

The three successful exports must have distinct raw hashes and typed canonical
identities. Keep each export's source diff, stderr, inspection/results (positive
only), LLVM or exact refusal, and hashes together. A refusal is not permission
to continue through a different profile. The shell's checksum files and helper
do not themselves verify the full source/raw/canonical/LLVM join; a retained
qualification must check each identity domain against the actual fresh bytes.

Valid allocation/alignment, address representability and launch remain premises.
Native compilation establishes neither GPU output nor race/hazard freedom.
Edit Rust and recompile: no general assembly-to-Rust lifting, lossless round-trip,
saved-IR continuation or whole-kernel physical ABI control is supplied.
This closes no original milestone and changes no curriculum manifest,
`FE2O3_PIN`, publication baseline or maturity label.

[evidence]: https://github.com/harsh-nod/fe2o3/blob/c60cd746e63b34b9072a493744d73b87ed1defc3/docs/evidence/source-body-abi-20260920.md
[source]: https://github.com/harsh-nod/fe2o3/blob/c60cd746e63b34b9072a493744d73b87ed1defc3/crates/fe2o3-amdgcn-model/examples/diagnostic_source_body_gfx942/source.rs
[native]: https://github.com/harsh-nod/fe2o3/blob/c60cd746e63b34b9072a493744d73b87ed1defc3/tools/fe2o3-llvm-link-worker/tests/source-body-abi/README.md
[fresh]: https://github.com/harsh-nod/fe2o3/issues/271#issuecomment-5754999990
