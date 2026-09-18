# Author and inspect a fixed-register region

This draft is a hands-on companion to the compiler's
[closed-region walkthrough](https://github.com/harsh-nod/fe2o3/blob/codex/assembly-authoring-swarm-20260917/docs/ordered-region-authoring-v1.md).
Use that implementation branch and its pinned toolchain. The branch is not the
site's qualified release pin. This document adds no lesson route, capture manifest,
publication pin or maturity claim.

The ordinary compiler and debugger CLIs do not yet support this V16 region path.
The working exercise is an opt-in compiler test over actual Rust source, followed
by a separate unauthenticated native-code observation. No GPU is required or run.

## Start with real Rust

Open the complete
[ordered-region fixture](https://github.com/harsh-nod/fe2o3/blob/codex/assembly-authoring-swarm-20260917/crates/rustc-codegen-fe2o3/tests/fixtures/production-extraction-device/src/ordered_region_v31.rs).
It declares a typed kernel with required workgroup size `64x1x1`, scalar `u32`
inputs, and a checked `DisjointSlice<u32>` output write. Its compute region is:

```rust
let a = amdgpu_asm!(v_mov_b32(a));
let value = amdgpu_ordered_region! {
    gfx942_xnack_off_wave64;
    scratch(32);
    out(33);
    in(34) = a;
    in(35) = b;
    in(36) = c;
    xor_add_u32_e32;
};
```

This excerpt is not a standalone kernel. Keep the fixture's imports, launch
contract, manifest and ordinary output code. The five physical roles mean:

| Role | Register | Meaning inside this one region |
| --- | --- | --- |
| Scratch | `v32` | Receives `a ^ b`; clobbered |
| Output | `v33` | Receives wrapping sum; early-clobber output |
| Inputs | `v34`, `v35`, `v36` | Carry `a`, `b`, `c` |

The exact internal sequence is `v_xor_b32_e32 v32, v34, v35`, then
`v_add_u32_e32 v33, v32, v36`. Each data expression is evaluated once. All five
bindings must be distinct literals in `0..64`; they are not general allocator
handles. Calling the source marker on the host panics rather than simulating it.

The region is NoMemory, reads EXEC, and has no implicit register writes. Its
internal order and unused-result retention do not make it a memory fence or
freeze unrelated instructions. It is allowed only once, unconditionally, in
one direct `gfx942:xnack-` wave64 root before conditional source edges.

## Run the source exercise

Run from the companion compiler checkout, not this website checkout. Install/configure
the repository's pinned `nightly-2026-04-03` toolchain and required components first;
the offline test assumes dependencies are already cached. Serialize Cargo builds.
Choose an existing writable directory outside the checkout with at least 40 GiB
free plus host-build room; replace the absolute example path:

```sh
ordered_run=$(mktemp -d -p /absolute/qualification-storage fe2o3-ordered.XXXXXXXX)
ordered_rustc=$(rustup which --toolchain nightly-2026-04-03 rustc)
RUSTC="$ordered_rustc" CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 \
CARGO_PROFILE_DEV_DEBUG=0 RUST_TEST_THREADS=1 \
FE2O3_TEST_ORDERED_REGION_OUTPUT_V31="$ordered_run/source" \
cargo +nightly-2026-04-03 test -p rustc-codegen-fe2o3 --lib \
  --locked --offline actual_ordered_region_source_ladder -- \
  --ignored --exact \
  production_rustc_driver_v1::gfx942_ordered_region_qualification_v31_tests::actual_ordered_region_source_ladder \
  --nocapture
```

The fresh `source` directory must not already exist. The harness runs six real
callbacks, checks current source bytes and compiler-derived identities, and
retains invocation records, actual stdout/stderr and `observation.json`.

Compare `ordered-region-v31` with `ordered-region-unused-v31`. The first stores
`(a ^ b).wrapping_add(c)`; the second stores `a`, but still retains the region.
Each variant has six arithmetic cases across 64 logical invocations, with
unchanged canaries. Open each positive directory's `canonical-v16.bin` and
`observation.ll`; the binary is an observation, not a debugger resume token.

Now read the four negative rows. Aliasing scratch/output, using runtime `a as u8`
as a physical binding, placing the region behind a conditional edge, and declaring
a required `32x1x1` workgroup must each produce its specific source-profile refusal.
A generic crash, timeout or unsupported later operation does not count as success.
Do not modify retained reports to make a comparison pass.

## Know which level you are observing

The actual source callback produces semantic MIR V31 and one genuine canonical
KIR V16 owner. A `cfg(test)` continuation retains the original compiler bindings;
it is not the shipping protected-admission route. The same owner feeds both the
CPU simulator and complete-module LLVM generation.

The CPU result is one atomic logical operation. There is no simulated physical
`v32` value to inspect between XOR and ADD. The browser's existing
[memory-resource walkthrough](resource-memory-windows.md) uses different CPU
captures and must not be presented as this region's physical-register debugger.

LLVM remains part of compilation: one `asm sideeffect` call carries both
instructions and the fixed constraints. Ordinary Rust control flow and stores
remain ordinary LLVM. The initial V16 header uses the reviewed worker layout;
no captured LLVM is edited to satisfy the worker.

For final-instruction observation, follow the compiler walkthrough's pinned
native-build prerequisites and run its shipped scripts:

```sh
node scripts/assembly-region-worker-prototype.mjs \
  --llvm-root /absolute/llvm-prefix \
  --llvm-build-id-file /absolute/reviewed-llvm-build-id.txt \
  --zstd-include-dir /absolute/zstd-include \
  --zstd-library /absolute/libzstd.so \
  --output "$ordered_run/native-build"
node scripts/assembly-region-source-machine-observation.mjs \
  --source-run "$ordered_run/source" \
  --native-build-run "$ordered_run/native-build" \
  --output "$ordered_run/machine"
```

Supply the reviewed package inputs, not arbitrary LLVM installations or invented
build-ID text. The second script consumes the unchanged LLVM bytes, validates the
fresh build and retained source records, and inspects O0/O3 output for used/unused
results. The engineering run passed all four cases: exact contiguous e32 pair,
physical operands, EXEC read/no implicit writes, and sufficient VGPR capacity.
Native reports separately identify compiler-owned boundary instructions.

The binding high-water is 37, not a claim that the whole kernel uses 37 VGPRs.
Observed descriptor capacity was 56 at O0 and 40 at O3; the reported architected
VGPR boundary was 40. Capacity, actual usage, lifetimes and occupancy are different
facts. This static inspection proves neither GPU results nor performance, and
its retained hash joins are not source authentication or protected publication.

## Preview the authored plan beside logical values

The standalone development preview uses the genuine retained
`ordered-region-source-v31-r5` source ladder and its two debugger observation
sidecars. In this website checkout, install the pinned dependencies with
`npm ci`, then run `npm run dev -- --host 127.0.0.1`. Open
`http://127.0.0.1:5173/fe2o3-kernels/drafts/ordered-region-observation.html`,
adjusting the port if Vite prints a different one.
This HTML entry is a development-only draft, not a published lesson route or
part of the normal production build.

1. Keep **Used region result**, request case 1, and logical lane index 0 selected.
   The left table shows the five authored bindings, `v32` through `v36`.
   The right table shows the three actual logical SSA inputs before the entire
   region. All are zero: zero is a retained value, not unavailable data.
2. Select **After whole region**. The retained logical result is zero. No
   physical `v33` contents or intermediate `v32` contents have been observed.
3. Select request case 6 and lane index 63, then select **After whole region**.
   The retained result is `0x0000002e (46)`. The display selects a serialized
   lane result; it does not calculate a replacement result or scratch value.
4. Switch to **Unused region result**. Case, lane and phase reset. These are
   different compilations with different canonical and sidecar identities,
   despite sharing the same whole source-file hash. The retained region result
   is not an observation of the kernel's output-buffer bytes.

Both variants retain six request cases with 64 logical lanes each. Only the
selected lane's before/after whole-region pair is rendered. Its record indices
are indices in that private CPU capture, not debugger cursor revisions. The
sidecars do not serialize workgroup/wave coordinates, source-span coordinates,
or individual XOR/ADD instruction checkpoints. Canonical roster coordinates,
raw KIR block IDs and semantic coordinates are shown as separate identifiers;
matching numbers in another compilation do not establish correspondence.

Independent hashes pin the exact ladder and sidecar bytes, and the display
checks their canonical, semantic and source associations. Changed or malformed
inputs clear the prior plan and values. These checks cannot recreate the private
compiler-owner and immutable-request borrows. They are not source authentication,
detached-transcript admission, production resume or artifact authority. The
producer's truncation and value-limit controls are summaries, not additional
displayable checkpoints.

Physical VGPR/SGPR/AGPR values, scratch and EXEC contents, live ranges, occupancy,
and final-artifact mapping remain explicitly unavailable. Selecting a case,
lane or phase neither fetches another capture nor moves an existing debugger
session. The separate fresh `ordered-region-source-machine-join-r5` observed all
four O0/O3 used/unused final-machine cases; it does not supply physical runtime
values or attach a final artifact to this browser view.

## What this draft does not complete

The source qualification run `ordered-region-source-v31-r4` and final native join
`ordered-region-source-machine-join-r1` are earlier working-tree development observations.
That backend library run passed 754 tests with seven explicit ignores; the
source ladder was executed separately. These results do not attest a released
compiler commit or change this site's publication manifest. The fresh r5 source
and browser observations above are also working-tree observations, not release
qualification.

Unsupported profiles include helper/multiple/looped/divergent regions, partial
waves, SGPRs, tuples/inouts/aliases, other instruction sequences, authored memory
or synchronization, matrix instructions, gfx950 and whole-kernel assembly. General
register allocation/liveness, live physical debugger views, source promotion and
reverse Rust regeneration, persistent recipes, full proofs and final production
admission remain open. Read [inspect lowered kernels](inspect-lowered-kernels.md)
for the separate supported snapshot/draft workflow; it does not resume V16.

This is partial work toward [#280](https://github.com/harsh-nod/fe2o3/issues/280),
[#281](https://github.com/harsh-nod/fe2o3/issues/281), and
[#282](https://github.com/harsh-nod/fe2o3/issues/282), not a replacement for any of
their original milestones.
