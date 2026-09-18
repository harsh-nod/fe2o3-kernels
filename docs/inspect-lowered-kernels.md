# Inspect the real lowering of a Rust kernel

This draft implementation-preview tutorial covers bounded inspection, six typed
integer instructions and explicit new text candidates. It does not claim that
complete assembly regions, explicit physical
registers, source replacement, schedule recipes, or production source round-trips
are complete. It does not change the shared curriculum's publication pins.

Use the companion compiler implementation branch
`codex/assembly-authoring-swarm-20260917`; this is a development reference, not
the site's qualified release pin. Run commands from its compiler checkout with
the pinned Rust toolchain and Node.js installed.

## Build and reproduce

```sh
cargo build --locked -p rustc-codegen-fe2o3 \
  --bin fe2o3-rustc-extract --bin fe2o3-export-sim
cargo build --locked -p fe2o3-source-isa-observation --bin fe2o3-author \
  -p fe2o3-kir-sim-cli --bin fe2o3-kir-sim \
  -p fe2o3-debug-cli --bin fe2o3-debug
authoring_run=$(mktemp -d)
node scripts/authoring-v6-smoke.mjs "$authoring_run/capture"
```

The script requires a new output directory. It compiles the actual
`examples/fill/src/lib.rs` through the ordinary source exporter, producing a
Bundle V6 with the exact canonical KIR V11 body and embedded Source Map V2.
There is no separately authored simulator kernel.

The Rust algorithm is ordinary typed source:

```rust
pub fn fill(mut out: DisjointSlice<f32>) {
    let idx = thread::index_1d();
    let Some(value) = out.get_mut(idx) else {
        return;
    };
    *value = 42.5;
}
```

The real source file also carries its existing kernel/launch attribute and
imports; do not substitute this abbreviated display for the complete fixture.

## Read the snapshot and select an operation

```sh
target/debug/fe2o3-author inspect < "$authoring_run/capture/fill-v6.fe2sim"
```

If `CARGO_TARGET_DIR` is set, use that directory's `debug/fe2o3-author` instead.
The summary identifies the exact bundle, canonical KIR, target, source map and
source-lineage receipts. Wide byte lengths are decimal strings. Compiler policy
and final-machine identity remain explicitly unavailable at this export stage.

Open `operations.json` from the capture. In the initial source example there are
eight operations. The first is the logical index intrinsic, tied to bytes
198..216 of `examples/fill/src/lib.rs`; the next reads the slice length. Scalar
operation details, operand/result types and all retained source origins remain
separate from physical registers and machine instruction encodings.

`selector.json` names one actual operation by exact bundle/KIR/target and
function/block/operation coordinates. `region.json` reports its typed live-ins
and live-outs. Coordinates are immutable-snapshot ordinals, not anchors that
survive arbitrary recompilation. The headless command can repeat that selection:

```sh
target/debug/fe2o3-author select \
  --selector "$(tr -d '\n' < "$authoring_run/capture/selector.json")" \
  < "$authoring_run/capture/fill-v6.fe2sim"
```

Inspection does not edit source, execute a snapshot, build, or launch a kernel.
Pages are limited to 64 operations, and selections must be contiguous within one
block. The containing function's uses and terminators determine live-outs.

## Negative exercises and the current ownership boundary

The script changes the selector's KIR identity and requires a normal stale-input
error with no output candidate. Read `stale-selection.txt`: a prior snapshot is
not permission to edit or resume a different executable.

It also attempts to materialize the selected index intrinsic and requires an
unsupported-operation error, retained in `unsupported-promotion.txt`. This is
intentional: the materializer accepts only u32 `BitAnd`/`BitOr`/`BitXor` and
already represented, validated u32 vector-integer ISA operations. It must not
pretend that an ordinary intrinsic or memory operation has an exact assembly
representation. Supporting diagnostic bitwise text is not by itself a tested
source-promotion round-trip; the separate actual-source exercise below tests
one concrete integration.

For that admitted diagnostic subset, `materialize` can emit typed
`fe2o3_device::amdgpu_asm!` Rust with explicit live-in parameters and live-out
tuple results. Generated text is a draft, not an authenticated source edit.
The real source exporter now admits the six closed gfx942 u32 markers through
semantic MIR V30. A generated draft still needs explicit integration and fresh
compilation: text generation does not show that it compiled, proved equivalent,
or acquired physical registers. Complete promotion and final artifact
qualification remain open.

Future promotion must create reviewed source and pass normal rustc/importer,
typing, effects, resource and final-admission checks with fresh identities. A
retained high-level source copy is useful for restoration but does not absorb
later assembly edits automatically. CPU replay order is not a compiler schedule
recipe, and this preview does not implement recipe replay.

## Inspect real typed-instruction source

The companion compiler fixture is
`crates/rustc-codegen-fe2o3/tests/fixtures/assembly-authoring-v30/src/lib.rs`.
Use that complete source, adjacent standalone manifest and local lockfile, not
this abbreviated display of its compute chain:

```rust
let moved = amdgpu_asm!(v_mov_b32(a));
let moved_again = amdgpu_asm!(v_mov_b32(moved));
let sum = amdgpu_asm!(v_add_u32(moved_again, b));
let difference = amdgpu_asm!(v_sub_u32(sum, b));
let toggled = amdgpu_asm!(v_xor_b32(difference, b));
let low = amdgpu_asm!(v_and_b32(toggled, 255));
let result = amdgpu_asm!(v_or_b32(low, 256));
```

The actual file also contains the typed kernel attribute, required 64-lane
workgroup, imports and checked `DisjointSlice<u32>` write. Its `edited` feature
uses 512 instead of 256 for the final OR: a deliberately different computation,
not a claimed schedule-only optimization. After building the tools above, run
from the companion compiler checkout:

```sh
assembly_run=$(mktemp -d)
node scripts/assembly-authoring-v30-smoke.mjs "$assembly_run/capture"
```

This actual-source smoke exports both variants, observes all six instructions,
and requires seven distinct static occurrence references. The two moves share
a mnemonic but must have different statement identities. For the overflow case
`a = 0xfffffff0`, `b = 0x25`, the independent CPU oracle requires four output
words of 469 for the base and 725 for the edited variant, with two unchanged
canary words. Hardware observation remains false.

Read `base-operations.json` and `edited-operations.json` before their selectors
and drafts. Each selector binds its own bundle, target and canonical KIR; do not
reuse baseline coordinates as edited-program anchors. The source references
identify compiler-observed MIR/source origins, not raw file hashes or independent
source authentication. The generated `base-draft.rs` and `edited-draft.rs` have
explicit live-in parameters and tuple outputs for the final OR. Review their
parameter binding before considering a source replacement. This smoke retains
but does not compile those generated drafts. Correspondence, final ranked
verification, final machine inspection and protected artifact admission are
separate checks, not established by this CPU exercise.

## Recompile the generated helper, then change one instruction

The previous smoke retains diagnostic drafts without compiling them. A separate
exercise takes that exact source-produced baseline and materializes its selected
OR again, now as the named helper `assembly_promoted_region`:

```sh
roundtrip_run=$(mktemp -d)
node scripts/assembly-source-roundtrip-smoke.mjs \
  "$assembly_run/capture" "$roundtrip_run/capture"
```

The script creates two new standalone source crates. In the known fixture only,
it explicitly replaces the final result expression with
`assembly_promoted_region(low, 256).0` and appends the complete generated helper.
The no-edit candidate keeps `v_or_b32`; the edited candidate changes that one
helper marker to `v_and_b32`. The original source is never modified. This is an
explicit fixture-specific integration, not automatic variable substitution or
a generic source replacement capability.

Both candidates have passed fresh Rust source export. Their retained KIR
contains the helper call and seven assembly operations, with distinct function
references for the root and generated helper. For the same overflow test case,
independent CPU checks require four words of 469 with the unchanged helper and
four words of 0 after the OR-to-AND edit. The two canary words remain unchanged.
The changed output is intentional, not evidence of a semantics-preserving edit.

Read `generated-helper.rs`, both `*-source-change.json` files and the complete
`no-edit-source/src/lib.rs` and `edited-instruction-source/src/lib.rs` files.
Compare those diffs before inspecting their fresh bundles, operations and
simulation results. `receipt.json` records source hashes, fresh bundle/KIR/
semantic-MIR/preflight identities and independent case checks. The script also
verifies that the original source is unchanged. No compiler resumes from the
edited diagnostic snapshot.

This qualifies the exercised source-admission and CPU case, not universal
equivalence, final ranked verification, protected artifacts, final machine
instructions, physical registers or hardware execution. Ordinary-Rust bitwise
promotion is separate; this exercise starts with typed-instruction source.

## Start from an ordinary Rust expression

Use the complete companion fixture
`crates/rustc-codegen-fe2o3/tests/fixtures/ordinary-bitwise-promotion-v1/src/lib.rs`
and its adjacent standalone manifest and local lockfile. Its compute starts as
ordinary Rust, without ISA markers:

```rust
let low = (a ^ b) & 255;
let result = low | 256;
```

After building the same tools, run:

```sh
bitwise_run=$(mktemp -d)
node scripts/ordinary-bitwise-promotion-smoke.mjs "$bitwise_run/capture"
```

The baseline export retains three ordinary bitwise operations. The script
selects the unique u32 `Binary/BitOr` with its exact bundle/KIR/target coordinate;
its mnemonic and assembly source reference remain null. Review
`ordinary-operations.json` and `ordinary-selector.json` before
`generated-helper.rs`: choosing an ISA spelling for a draft does not relabel
the original graph as assembly.

The generated helper is explicitly integrated into a new source crate by
replacing only the known fixture's final OR with
`bitwise_promoted_region(low, 256).0`. A second candidate changes that helper's
`v_or_b32` marker to `v_and_b32`. Review both `*-source-change.json` files and
complete candidate sources. The outer XOR/AND remain ordinary Rust; fresh KIR
contains the helper call and exactly one selected assembly operation, with no
old OR expression left as an executable fallback. The original source remains
unchanged.

This exercise has passed all three fresh Rust exports. For `a = 0xfffffff0` and
`b = 0x25`, four independent output words are 469 for both the ordinary baseline
and unchanged helper, then 0 for the deliberate instruction edit; both canaries
remain unchanged. Bundle, canonical KIR, semantic-MIR and preflight identities
are distinct for every variant. Read `receipt.json` alongside the actual
simulation results. This checks one differential CPU case and source-admission
path, not universal equivalence, generic source reconstruction, final ranked
verification, protected artifact admission or GPU execution.

## Review a proposal and create a new source file

For a supported selection with one unambiguous source span, use the exact bundle
and selector from that run. Compute the original file's SHA-256 independently;
the displayed source-map file identity is not that content hash:

```sh
target/debug/fe2o3-author preview-helper-insertion \
  --selector 'EXACT_SELECTOR_JSON' --helper compute \
  --source src/kernel.rs --expected-source-sha256 EXACT_SOURCE_SHA256 \
  < kernel-v6.fe2sim > reviewed-proposal.json
```

Review `draft_helper.source`, `inserted_source`, the exact selector, EOF range,
and before/after hashes. The proposed diff preserves every original byte and
appends a complete named helper; it does not infer variable substitutions or
replace the selected expression. Hash the exact compact JSON, including its
final newline, then explicitly request:

```sh
target/debug/fe2o3-author create-source-candidate \
  --selector 'EXACT_SELECTOR_JSON' --helper compute \
  --source src/kernel.rs --expected-source-sha256 EXACT_SOURCE_SHA256 \
  --expected-proposal-sha256 EXACT_REVIEWED_PROPOSAL_SHA256 \
  --candidate src/kernel_candidate.rs < kernel-v6.fe2sim
```

The command regenerates the private proposal; saved JSON is not write authority.
It reads only the explicit source path, never a source-map display label. Linux
`O_TMPFILE` and procfs support are required. Unsafe paths, symlink parents,
nonregular/oversized source, changed bytes, changed proposals and every existing
destination reject. Publication exposes a fully written new file without
replacing the original or an existing candidate.

The receipt is diagnostic JSON, not proof of valid Rust or semantic promotion.
Checks cover retained descriptors and parent/name bindings at a point in time,
not an atomic source compare-and-swap or paths immune to ancestor moves. A
post-publication failure may leave the candidate in place; no automatic undo is
performed. Review and integrate the file into the correct source root, choose
an explicit kernel variant or replacement, and freshly compile ordinary source.
Appending an unused helper does not complete that workflow.

This remains a draft companion tutorial. No curriculum inventory, release pin,
publication status, production proof, physical-register promise or GPU badge is
changed by these commands.

## Separate execution evidence from inspection

The same script runs the source-produced bundle through CPU simulation, checks
four independent 42.5f32 little-endian output words, and checks two untouched
canary words. It retains the request, simulation result and a source-bound
debugger memory checkpoint. These are deterministic CPU observations, not GPU
execution or timing evidence, and they grant no proof/load/launch authority.

The initial measured source checkpoint is retained separately in
[`examples/source_resource_checkpoint_v1.json`](../examples/source_resource_checkpoint_v1.json):
cursor 17, revision 3, one committed 42.5f32 output word and both untouched canary
words. Its independent step anchor and memory response are exercised through the
same resource component tests. The wrapper is a tutorial artifact, not an
authoritative capture decoder or a protected compiler attestation.

For the resource-view semantics and stale-cursor exercise, continue with
[Inspect a retained memory window](resource-memory-windows.md). Its interactive
raw-KIR checkpoint is a separate capture; do not mix its cursor or identities
with this Rust-source session.
