# Author a two-wave LDS exchange

Compiler implementation: [851f508787](https://github.com/harsh-nod/fe2o3/commit/851f508787bd6ec02caf267e9211eb7bac0ef616), published to both compiler main branches. The public source-wrapper matrix, public CPU
recording interface and browser viewer have passed their separate qualification
gates below. This lesson does not change FE2O3_PIN, maturity labels or milestone
closure; these bounded observations do not establish GPU execution.

The [global-copy lesson](physical-global-copy-source-v21.md) loads one value and
stores it. This distinct V22 profile adds a typed static LDS frame, explicit
local-memory completion and workgroup publication. It is not arbitrary assembly
or a general synchronization language.

## 1. Follow the data across both waves

The complete compiler fixture is
crates/rustc-codegen-fe2o3/tests/fixtures/production-extraction-device/src/physical_lds_exchange_v22.rs.
Its full-file SHA256 is
cafa481d9e6a7a780c27921f276476bbded31b03ed40067c48b87204d028f870.
It contains two positive layouts and seventeen negative variants.

Here is its complete one-layout function, with the original feature selector.
The module imports DisjointSlice, amdgpu_physical_lds_exchange and kernel from
fe2o3_device. No instruction has been omitted from this function:

    #[cfg(feature = "physical-lds-exchange-one-v22")]
    #[kernel(typed, launch(required=[128,1,1], max=[128,1,1], max_grid=[1,1,1]))]
    pub fn physical_lds_exchange_one(input: &[u32], output: DisjointSlice<u32>) {
        amdgpu_physical_lds_exchange! {
            gfx942_xnack_off_wave64;
            input=input; output=output;
            lds=static_u32_frame(0, 512, 4, 1);
            label(0);
            s_load_dwordx2(s_pair(8), kernarg, 0);
            s_load_dwordx2(s_pair(10), kernarg, 8);
            s_load_dwordx2(s_pair(12), kernarg, 16);
            s_load_dwordx2(s_pair(14), kernarg, 24);
            s_waitcnt_lgkmcnt0();
            s_lshl_b32(s(16), s(2), 7);
            v_add_u32_e32(v(2), s(16), v(0));
            v_mov_b32_e32(v(3), zero);
            v_mov_b32_e32(v(4), s(9));
            v_lshlrev_b64(v_pair(6), v_pair(2), 2);
            v_add_co_u32_e32(v(6), s(8), v(6));
            v_addc_co_u32_e32(v(7), v(4), v(7));
            global_load_dword(v(8), v_pair(6));
            s_waitcnt_vmcnt0();
            v_lshlrev_b32(v(16), v(0), 2);
            ds_write_b32(v(16), v(8));
            s_waitcnt_lgkmcnt0();
            s_barrier();
            v_xor_b32_e32(v(17), v(0), 64);
            v_lshlrev_b32(v(17), v(17), 2);
            ds_read_b32(v(18), v(17));
            s_waitcnt_lgkmcnt0();
            v_mov_b32_e32(v(5), s(13));
            v_lshlrev_b64(v_pair(10), v_pair(2), 2);
            v_add_co_u32_e32(v(10), s(12), v(10));
            v_addc_co_u32_e32(v(11), v(5), v(11));
            v_cmp_gt_u64_e32(s_pair(14), v_pair(2));
            s_and_saveexec_b64(s_pair(18));
            global_store_dword(v_pair(10), v(18));
            s_waitcnt_vmcnt0();
            s_mov_b64_exec(s_pair(18));
            s_endpgm0();
        }
    }

The target is gfx942:xnack-, Wave64, code-object version 6. Exactly one
workgroup has 128 invocations: two full waves. Invocation x writes input[x] to
LDS[x], waits, participates in the barrier, then reads LDS[x xor 64]. Its output
comes from the corresponding lane in the other wave.

The typed frame is offset 0, 512 bytes, alignment 4 and publication epoch 1.
It is not a dummy source parameter, an arbitrary frontend LLVM attribute or
invented M0 source SSA. The verified frame derives the backend reservation.
There remain two logical slices and four native pointer/length components at
kernarg offsets 0/8/16/24.

The registers variant changes loaded/write data v8 to v22, local write address
v16 to v24, peer address v17 to v25 and peer result v18 to v26. Uses must change
consistently. The importer constructs actual register SSA, not detached LLVM
string substitutions.

## 2. Completion is not publication

The global load result is pending until its VM wait. LDS write completion needs
the LGKM wait, but that alone does not publish all lanes' writes. The workgroup
barrier is separate. The peer read is pending until its own LGKM wait, and the
store must consume that exact ready result.

All 128 input reads and LDS participants precede output masking. Empty output
does not excuse invalid/uninitialized input or a missing participant. Scalar
waits, saved-EXEC restore and termination still execute when the store mask is
zero. Pointer halves and carry have symbolic allocation provenance in the CPU
model; they are not fabricated numeric GPU addresses or sampled VCC.

This publication step is LDS-only. It does not establish global-memory
happens-before, a general race theorem or actual hardware barrier behavior.

## 3. Choose diagnostic export or normal checked continuation

These commands need the matching compiler checkout, its pinned
nightly-2026-04-03, existing offline dependencies and fresh absolute outputs.
Their separate public-wrapper matrix passed all six shards and the aggregate:

    export RUSTC=/absolute/pinned/nightly/bin/rustc
    export FE2O3_PHYSICAL_LDS_EXCHANGE_BIN_DIR_V22=/absolute/build/debug
    node scripts/physical-lds-exchange-source-v22.mjs one /absolute/new-lds-diagnostic
    node scripts/physical-lds-exchange-checked-v22.mjs one /absolute/new-lds-checked

The first command follows real Rust/MIR39 ownership to pre-ranked KIR22 and
exports canonical-v22.bin, unchanged canonical.ll and a native-observation
sidecar under diagnostic/. The second uses separate normal LLVM and inert
handoff selectors, producing canonical.ll and handoff-v2.bin. Neither wrapper
runs CPU simulation, native compilation or a GPU.

The normal path retains actual source/canonical ownership through mandatory
ranked/formal checks, exact source/compiler ABI, descriptor preparation and
same-ledger emission. The authored one-block SSA/CFG stays executable; the
ranked graph is a conditional safety projection, not another executable or an
assembly-to-Rust decompiler.

LLVM remains in the pipeline. Its kernel shell carries the authored body as
side-effecting assembly followed by unreachable, while LLVM produces ordinary
objects, descriptor and metadata. Static LDS reservation derives from the
verified frame, not a diagnostic reader repairing the LLVM text.

Separate source sessions may have different canonical/descriptor identities
even when LLVM matches. Join a diagnostic relation only to its own producer's
outputs. Reading bytes or hashes cannot recreate source custody.

## 4. Keep runtime conditions visible

The complete typed report retains all four kernarg reads and their wait, the
full-EXEC input load/readiness, output mask/store/wait/restore, LDS frame, write
completion, workgroup publication and peer-read completion. Keeping only global
accesses would lose necessary conditions.

Input requires 128 readable initialized u32 elements. Both global formal minima
remain 512 bytes, with input/output disjointness. The kernarg prefix must stay
live/readable/immutable, at least 32 bytes aligned to 8, and disjoint from output.
All 128 invocations must participate. Clean reports do not establish these
conditions for detached host allocations.

Conditional 128-element ranked views do not replace the executable mask or claim
the real dynamic lengths equal 128. Under exactly one workgroup, local_x equals
global_id; (local_x + 64) % 128 equals local_x xor 64 for every admitted lane.
Loaded and peer-read values remain opaque for safety analysis. CPU short-tail
tests exercise masks, not relaxed formal host-allocation admission.

## 5. Try a precise incorrect edit

Both wrapper commands accept the same negative cases:

| Case group | Expected boundary |
| --- | --- |
| wrong-launch, dynamic-grid | exact workgroup 128 / maximum grid 1 |
| frame-base/size/alignment/epoch | exact static_u32_frame(0,512,4,1) |
| missing-write-wait/barrier/read-wait/vm | earlier block/operation count for a removed row |
| wrong-peer, wrong-lds-address | xor-64 and local write address lineage |
| wrong-store, wrong-carry | ready peer result and pointer high provenance |
| foreign-input | actual root argument transport, not a panic substitute |
| foreign-marker, mixed-marker | closed helper/marker census |

Same-count canonical/formal mutations separately isolate waits and publication.
Removed-row examples honestly stop at the earlier count boundary. Every negative
requires its exact diagnostic and absent extraction output, not an arbitrary
compiler failure.

## 6. Separate the completed observations

The root-run source ladder completed 38 sessions, 64 CPU positives, 12 CPU
refusals, two barrier observations and 34 source refusals. The normal ladder
completed 57 sessions, 64 CPU positives, 12 CPU refusals, 51 source refusals,
142 actual-owner ABI mutations and eight budget denials.

Specialized CPU capture used two newly authenticated sessions, four captures
and eight refusals. It observed three allocations, two waves, 128 barrier
arrivals and one release, plus global/LDS pending-to-ready transitions.
Two generic-debug attempts refused with zero records. Reverse navigation was
observational, not resumed GPU execution or hidden state repair.

The separate unchanged-source native matrix covered both layouts at O0/O3.
Each had 32 instructions / 168 entry bytes, no executable setup/tail, seventeen
metadata arguments, 512 static LDS bytes and no scratch. It rejected sixteen
exact input mutations and 280 native mutations. O0/O3 HSACO bytes matched per
layout: 5,592 bytes for one, 5,648 for registers. Static descriptor VGPR
capacities were 24/32, and SGPR capacity 32; these are not physical samples.

Retained observation SHA256 values:

- Source: f27f7a09778a5b55e0cb44b1bf913085b9c7428681cd6189c5b0d7bc984dd243.
- Normal: d2baf19b2687508230e27dffd98ce85d4fd0d23d27627817fec7c95c5d931760.
- Capture: 19236639cf8e72c2cb15cbfba58ee52ade8cd613277ee507759fa1064598d76b.
- Static native: 45311b9538f5293c39e2ed2f0fcff3c2bfa49b9e6b4df11a706546a4c3d34c48.

These are historical root-run observations, not tests rerun by this lesson's
author. The exact native input was not transformed to add an LDS attribute.

## 7. Inspect the actual CPU recording

The separate public-wrapper qualification passed 38 commands / 57 stages,
including six positive stages and 51 exact negative stages across 19 source
variants. Its aggregate report is 6,880 bytes, SHA-256
ff49f53944d9e546cd738b0f38848ff2fc815e45b9ab460720ef6f35a7240aca.
The completed aggregate gate is 198,803 bytes, SHA-256
b45982a59e72ae557b5f3c02265f437ce470b7a9709df0a7a15fbd2f77274624.
Fresh source sessions retain their own identities, not the earlier source R7
identities.

Follow the [recorded debugging lesson](physical-lds-recorded-debug-v22.md) or
open [the LDS viewer](https://harsh-nod.github.io/fe2o3-kernels/#/debugger/lds-cpu-recording-v22).
The two built-ins use actual sourceR7-derived recordings from the separate
public CLI R3 gate: six sessions, 96 transactional refusals, 13 bootstrap
refusals and eight byte-exact legacy stream replays. These are not recordings
from the fresh wrapper matrix above. Nothing is synthesized to fill missing
physical registers or memory observations.

The viewer passed 53 focused unit tests and eight browser tests with no retries.
The browser checks cover both bundled recordings, light/dark layouts, two
viewport projects, local four-file import/replacement/clear, malformed input
refusal and unavailable decompression. The full-site regression passed 1,876 unit tests in 131 files, 21 authoring-lab
tests and 212 browser tests with zero retries. Its completed gate is 26,636 bytes,
SHA-256 b64d942c812ec325dc89a28179f077d2697261b573de9ef7ec4b7037abadb2ca.
Publication remains a separate step.

## Remaining boundaries

Static gfx942 native inspection is not GPU execution on MI350 or another device.
No physical register capture, protected artifact admission, runtime-condition
discharge or launch authority is established. General LDS programs, multiple
epochs, divergent barriers, loops, atomics and independently outstanding memory
schedules remain outside this finite profile. Broader memory/synchronization
and hardware-debugger milestones remain open.
