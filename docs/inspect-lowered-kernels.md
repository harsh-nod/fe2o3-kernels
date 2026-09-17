# Inspect the real lowering of a Rust kernel

This implementation-preview tutorial covers the read-only first slice of
multi-level authoring. It is not a claim that assembly regions, explicit physical
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
intentional: the initial materializer accepts only already represented,
validated u32 vector-integer ISA operations. It must not pretend that an ordinary
intrinsic or memory operation has an exact assembly representation.

For that admitted diagnostic subset, `materialize` can emit typed
`fe2o3_device::amdgpu_asm!` Rust with explicit live-in parameters and live-out
tuple results. Generated text is a draft, not an authenticated source edit.
The production frontend still rejects those assembly markers; the source
application/re-admission milestone remains open. Do not claim the draft has been
compiled, proved equivalent, or assigned physical registers.

Future promotion must create reviewed source and pass normal rustc/importer,
typing, effects, resource and final-admission checks with fresh identities. A
retained high-level source copy is useful for restoration but does not absorb
later assembly edits automatically. CPU replay order is not a compiler schedule
recipe, and this preview does not implement recipe replay.

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
