# Follow real calls and storage lifetimes from ordinary Rust

Actual integrated source/HTTP/browser results and retained failure boundaries are
recorded in the [dated qualification](runtime-identity-storage-qualification-20260923.md).

This lab adds runtime identities to the existing [live CPU debugger](live-cpu-debugger-v1.md) and [checkpoint dashboard](live-checkpoint-dashboard-v1.md). It explains two questions a static source location cannot answer: “which invocation of this helper am I inspecting?” and “does this storage still belong to the same allocation?”

This is a CPU simulation lab. The instructions and validators alone are not a passing capture; use a retained, successful normal-source acceptance receipt from matching compiler and site checkouts. HTTP/browser behavior needs its own retained test. No physical VGPR, native ISA timing, GPU correctness proof or general source-variable reconstruction is claimed.

## 1. Start with an ordinary Rust loop and helper

The normal-export acceptance runner writes a small standalone Rust fixture with this kernel shape:

~~~rust
#[inline(never)]
fn mix(value: u32, salt: u32) -> u32 {
    (value ^ salt) & 0xffff
}

#[kernel(typed, launch(required = [64, 1, 1], max = [64, 1, 1]),
         control_flow(loop_bounds(3)))]
pub fn loop_helper(
    mut out: DisjointSlice<u32>, seed: u32, salt: u32, rounds: u32,
) {
    let trips = rounds % 4;
    let mut iteration = 0_u32;
    let mut value = seed;
    while iteration < trips {
        value = mix(value, salt ^ iteration);
        iteration += 1;
    }
    if let Some(output) = out.get_mut(thread::index_1d()) {
        *output = value;
    }
}
~~~

The complete generated file also contains #![no_std] and its device imports. Do not replace it with handwritten KIR and call that source lowering. The supported normal exporter produces Bundle V6 and retains an actual loop and helper call; the acceptance gate refuses a different topology.

Use the compiler repository's scripts/debug-runtime-observations-source-v1-smoke.mjs with explicit matching tool paths and fresh, separate export caches. Its instructions are in docs/runtime-observations-source-v1.md. The resulting requests use four active invocations, workgroup size 64, seed 0xabcd1234, salt 0x0f0f55aa, and rounds 0, 1 or 3. A buffer view exposes only the four output words; unchanged guard words surround them.

Expected output per invocation:

| Rounds | Result | Real helper activations across four invocations |
| --- | --- | --- |
| 0 | 0xabcd1234 | 0 |
| 1 | 0x0000479e | 4 |
| 3 | 0x0000479d | 12 |

Each case runs under canonical order and seed 71. Storage reuse off/on must preserve the complete execution, legacy transcript, initialization bits, output and guards.

## 2. Select an activation, not merely a depth

At a helper checkpoint, inspect the full invocation coordinates, its activation identity and the current operation attempt. The caller frame has its own activation and a suspended call attempt. The helper's parent key must match that real caller and call site.

Two visits to the same source line or static operation need not be the same execution. Two helpers occupying stack depth one need not be the same activation. Keep the capture identity, full invocation and actual activation/attempt together; do not derive identity from a stack index, source span or ordinal alone.

For the first helper operation:

1. Record the before checkpoint and both frames' available SSA values.
2. Step over forward to that exact attempt's after checkpoint. Caller values remain suspended while the child's local result changes.
3. Step over backward, then forward again. The same historical identities and values return; replay does not mint new identities.
4. Step out to the actual caller. The completed helper is no longer selectable as a current frame.
5. In the three-round case, move to the next helper call for the same full invocation. The old activation must be absent even though the frame depth is reused. Returning to the earlier checkpoint restores its historical identity.

An after checkpoint still belongs to the completed operation. A frame's next-operation cursor may already point elsewhere. Do not relabel the after record with that next instruction.

The public Rust example observe_runtime_observations_source_v1 performs these checks through the sealed capture/session API. It exposes no way to attach arbitrary metadata to a transcript or mutate the underlying legacy session.

## 3. Distinguish allocation identity from reusable storage

The second normal export uses the compiler's unchanged production-ranked-bounds-device fixture, feature/kernel workgroup_reduce_u32. It produces Bundle V5 for gfx942 and contains a real 64-element u32 workgroup-memory declaration. With grid 128, workgroup 64 and scalar input 2, each of the 128 output words must be 128.

The selected optional reuse policy caches at most 8 KiB of released exact-shape private/workgroup storage. This fixture exercises actual workgroup reuse:

~~~text
workgroup 0: create allocation A, slot S, generation 1
             release allocation A
workgroup 1: create allocation B, slot S, generation 2, previous A
~~~

A and B are distinct semantic allocations even though their underlying slot is reused. B's initial bytes are zero and its initialization mask is entirely false; prior contents do not become initialized values in a new allocation.

At B's checkpoint, querying A as a current live allocation must fail. At A's historical checkpoint, B is not yet live. Seeking A, B, A and B again must preserve exact historical descriptors and bytes without a stale watch or selection following the slot accidentally.

A lifecycle query is a prefix bound to an accepted record's watermark. A release after the final retained record is not available merely because execution has ended. This lab deliberately does not manufacture a terminal release checkpoint.

## 4. Open only the exact exported inputs

For direct JSONL debugger clients, the host opts into the bounded observed owner:

~~~sh
/ABS/MATCHING/TOOLS/fe2o3-debug sim \
  --bundle-v6 /ABS/PASSED_CAPTURE/loop-helper-v6.fe2sim \
  --request /ABS/PASSED_CAPTURE/requests/loop-rounds-3.json \
  --runtime-observations v1 --protocol jsonl --wave-width 64
~~~

For the workgroup fixture use --bundle-v5 and requests/workgroup-reduce.json. This starts the debugger protocol; it is not an interactive shell. Follow the existing live bridge setup and its private token rules when using a browser. The owner, not a browser import, chooses the program/request and observation profile.

The standard profile retains at most 65,536 origin rows/4 MiB, 65,536 checkpoint indexes plus 131,072 frame rows/24 MiB, and 65,536 lifecycle indexes plus 8,192 transitions/8 MiB. Lifecycle validation has a one-million-row scan budget. These metadata bounds are separate from ordinary transcript capture limits.

A disabled, unavailable, truncated or rejected observation is not an empty successful capture. Check both legacy transcript completeness and each independent metadata coverage. The ordinary-source acceptance runner requires all to be complete for these bounded fixtures.

## What this adds—and what it does not

The combination detects mistaken pairing of repeated calls, stale frame selection after returns, caller/callee SSA confusion, source-site ambiguity, stale allocation selection after reuse, lifetime-scope mismatches, missing initialization reset, and result or guard corruption under the selected tested inputs. Existing simulator checks remain responsible for supported bounds, initialization and scheduling failures.

This representation is logical simulator KIR, not physical AMD registers. Source editing and assembly authoring remain separate checked compiler workflows: see [lowered-kernel inspection](inspect-lowered-kernels.md), [source promotion](source-promotion-lab-v1.md) and [ordered programs](ordered-program-authoring-v1.md). A captured runtime identity does not authorize source rewriting, LLVM IR resumption, native code emission or round-tripping arbitrary machine instructions back to Rust.

The retained source census binds the exact source input and selected lowered operations for a particular run. It does not authenticate compiler execution or prove arbitrary source-variable-to-SSA ownership. Private Alloca reuse, deeply nested calls and faults have separate lower-level tests; this two-fixture lab must not be presented as ordinary-source qualification for those cases.
