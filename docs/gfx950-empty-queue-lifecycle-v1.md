# Follow the gfx950 empty-queue lifecycle

This contributor lesson shows what an empty debug queue establishes—and what
still separates it from a debugger visualization. One supervised native run on
mi350 created and retired an empty queue, with **zero valid packet publications**
and **zero doorbell stores**. No kernel was dispatched and no GPU wave stopped.

Compiler implementation commit: `634ec52439fb6ae8329d0cc6ba52be41fdee3739`.
This pins the implementation and documentation, not a transfer of historical
native qualification; it does not change the site's FE2O3_PIN.
Read the [compiler qualification note](https://github.com/harsh-nod/fe2o3/blob/634ec52439fb6ae8329d0cc6ba52be41fdee3739/docs/gfx950-debug-empty-queue-qualification-20260924.md)
for the exact retained observations and remaining boundaries.

## 1. Keep the three owners distinct

Start with the [inactive preparation](gfx950-cold-debug-preparation-v1.md)
and [no-queue registration](gfx950-noqueue-registration-v1.md) lessons. Their
existing commands and results have not changed.

| Boundary | What it owns or observes | What it cannot do |
| --- | --- | --- |
| Runtime-enable-returned owner | Actual retained kernel, trap, metadata and local runtime return | Assert same-client acknowledgment or exclude a sampler |
| Empty-queue owner | One actual queue and its backing, with no packet publisher | Dispatch, store a doorbell, sample a wave or reconstruct ownership from JSON |
| Local-release result | Ordered native teardown and accounting returned; descriptors closed last | Prove external process-family cleanup or authorize reuse |

A failure or unwind retains unresolved backing rather than retrying cleanup.
Drop is not native cleanup. The unsafe entry requires exclusive caller lifetime,
including after failure or Drop, and a reviewed disposable-process supervisor.
A flag, /proc snapshot or successful diagnostic line does not establish that
lifetime. Do not run the private observer casually with cargo run, reuse a GPU
process or substitute a profiler/preload wrapper. This lesson intentionally
provides **no native replay command**.

## 2. Read the actual local and family evidence separately

Open the unchanged [local observation](evidence/gfx950-empty-queue-20260924/local-observation.json)
and [local summary](evidence/gfx950-empty-queue-20260924/local-summary.json).
These are read-only historical files, not a debugger-session import format.

The actual status is `local_retired`; the final zero-GPU-FD fence is true.
Queue backing is 190,296,064 bytes. The 16,384-byte kernel/trap mappings plus
queue backing and a 4,096-byte allocation give the separately reported
190,316,544 projected native bytes. Projected logical bytes additionally include
the original ELF and retained metadata; these counts are not RSS.

Now compare the [inner cleanup receipt](evidence/gfx950-empty-queue-20260924/inner-cleanup.json)
and [outer family relation](evidence/gfx950-empty-queue-20260924/outer-family.json).
The observer itself correctly keeps `family_cleanup_established:false`.
The separate family checks establish exact process/start/pidfd identity,
same-PID exec, inherited credentials including render group 993, manager
InvocationID, terminal receipt/ACK, wait/reap/ECHILD, EOF and empty scope.
Both cleanup layers completed with no kills or expired deadline; the scope
was not-found afterward. Manager emptiness alone is not cleanup proof, and
cleanup is not rollback or general injection/sampler exclusion.

The nonce `7681acb99c0cf507a8453e9900493bb6` is not the manager generation
`495f03a776b04065aba6219bd24cb329`. The copied outer relation still requires
the completed runner receipt; none of these JSON files is authority.

## 3. Separate debugger startup from a real GPU stop

The newly built stopped-wave debugger passed fresh batch startup. Its
[historical marker](evidence/gfx950-empty-queue-20260924/startup-qualified.json)
keeps debugger/runtime acceptance and physical capture false, and requires
closure review. The observed startup included 104 initial Python modules plus
eight collector-added modules; complete import history remains unavailable.
This does not transfer the older no-queue runtime-observer acceptance.

There is no actual DEBUG_TRAP stop, GPU-thread-qualified register query,
physical SGPR/VGPR/AGPR/EXEC capture or GPU memory sample in this lesson.
For usable logical CPU views, see the separate
[LDS recorded debugger](physical-lds-recorded-debug-v22.md); those gfx942 CPU
records are not gfx950 hardware observations. No live adapter or importer is
added here.

## 4. Inspect the future one-stop artifact without launching it

The independent ordinary LLVM/LLD worker produced byte-identical O0/O3 artifacts.
Read the retained [O0 report](evidence/gfx950-empty-queue-20260924/one-stop-O0-report.json)
and [O3 report](evidence/gfx950-empty-queue-20260924/one-stop-O3-report.json).
The CPU/static gate passed 13 Node controls, two positive artifacts, four input
refusals and 166 artifact-mutation refusals. Input controls are synthetic LLVM
controls, not authenticated Rust-source tests.

The gfx950:xnack-/Wave64/COV6 entry is 16 instructions / 84 bytes; its 1,068
prefetch-padding bytes are checked separately, not counted as authored operations.
Actual metadata reports a 264-byte, align-8 kernarg segment: one explicit output
pointer plus thirteen hidden arguments. LDS/private memory, AGPRs and spills
are zero. Static register capacities are not physical register samples.

The single `s_trap 3` is at entry+76, followed by normal termination at entry+80.
Entry+80 is only the source-derived future WAVE_INFO_PC expectation:
`observed_wave_info_pc:null` and `native_expected_pc_authorized:false`.
The proposed output has eight leading canary bytes, 256 payload bytes and eight
trailing canary bytes in a 4,096-byte page. It was **not allocated or observed**
by the static gate. Do not turn expected values into recorded GPU output.

For contributor reproduction, follow the bounded CPU-only build/check commands
in the compiler's [fixture README](https://github.com/harsh-nod/fe2o3/blob/634ec52439fb6ae8329d0cc6ba52be41fdee3739/tools/fe2o3-llvm-link-worker/tests/gfx950-one-stop-fixture/README.md)
using a reviewed pinned SDK and fresh output paths. The report checker alone
does not validate a completed outer receipt. No GDB, KFD or GPU execution is
needed by that fixture. The empty-queue run used a different 5,536-byte observer
artifact, not this 5,312-byte future one-stop artifact.

## Retained gate pins and remaining work

| Completed root gate | Bytes | SHA-256 |
| --- | ---: | --- |
| Empty-queue actual | 441904 | `0d3efc22d6577f8b0d9ae901340131f24c5b878b1ac4494c19d67ad9cd3f8e8b` |
| Fresh stopped-wave-debugger startup | 142401 | `2fe2986f3e1fd3bb3ff2c9b96366949d8c1bd1411741e912425f04226c6a3dae` |
| One-stop CPU/static | 101665 | `ea06a78526d13469c3c0be5ee727ce96f4491c9899015474593635539f0e699d` |

The three root receipts are retained under the corresponding
`phase28-resume-r13-compiler-*` log directories. Hashes identify historical bytes;
they are not signatures, live state, source custody or authorization.

An owned packet, exact runtime ACK/TTMP/CWSR and sampler-exclusion evidence,
actual dispatch, same-client current GPU stop, and bounded physical read/capture
remain separate work. No queue publication, protected artifact admission,
curriculum maturity or milestone acceptance is promoted. **V4 remains open**;
original accepted exits remain **M1/V1/V2/U1/U2/U3 (6/18)**.
