# Inspect the gfx950 one-stop target without running it

This contributor lesson follows the [empty-queue lifecycle](gfx950-empty-queue-lifecycle-v1.md)
with a separate, packet-capable ownership path. **CPU/static qualification only:
the one-stop target was NOT RUN.** No GPU stop, physical sample or launch
permission follows from this lesson.

Compiler implementation commit: `a9b636ec4475a15e13187d78d53692d7e6b834e4`.
Read the pinned [compiler qualification note](https://github.com/harsh-nod/fe2o3/blob/a9b636ec4475a15e13187d78d53692d7e6b834e4/docs/gfx950-debug-one-stop-cpu-qualification-20260924.md)
for the exact source snapshots and completed root receipts. The earlier native
empty-queue run had zero publications and zero dispatches; its acceptance does
not transfer to this target or a new debugger executable.

## 1. Follow ownership, not a JSON state machine

The implemented path consumes the original cold owner into a privately boxed
fixed preparation, the same prepared packet, one in-flight owner and local
completion. It cannot be reconstructed from JSON, caller addresses, Booleans
or an empty-queue owner.

The fixed artifact is checked against its whole bytes, descriptor, ABI, segments
and 84-byte instruction sequence. A ninth allocation is intended to hold a
272-byte logical output: eight leading canary bytes, 64 u32 XOR lane results and
eight trailing canary bytes. Those are an implemented contract and oracle,
**not observed GPU output**.

The publication path is one-shot: release-publish the packet, then perform one
doorbell store. The original 60-second deadline includes the checkpoint,
debugger pauses, completion, ordered retirement and final descriptor close.
CPU tests exercise these rules; they do not show that these native operations
ran. Failure retains unresolved native custody and possible-publication facts.
Drop is not native cleanup, and cleanup is not rollback.

## 2. Identify the checkpoint's limits

The same preparation owns a 776-byte checkpoint at
`fe2o3_gfx950_one_stop_prepublication_checkpoint_v1`. Its bytes describe
the retained resources; **checkpoint bytes are not runtime authority**.
The signal base and its atomic value at base+8 remain distinct.

Before any publication effect, unsafe callers must independently establish
actual same-client pre-runtime attachment, LoadedSuccess and sole ACK,
reviewed trap/CWSR/TTMP setup, sampler exclusion, exact source/PC/resource joins
and consumed native pre-resume gates. A successful CPU test, parsed report or
breakpoint symbol does not establish those prerequisites.

This lesson supplies **no native replay command**. The future target must not
be invoked until the separately reviewed debugger, lifetime and owned-family
qualification is complete. There is no environment or JSON switch that turns
historical evidence into permission.

## 3. Read what actually passed

| Completed gate | Observed scope | Root receipt SHA-256 |
| --- | --- | --- |
| Combined CPU/static R3 | 2,057 test executions across 18 Rust result groups, selected strict Clippy and unsafe-source inventory; configurations overlap | `5b40adfaf8c6b68c7e6da997d7ac3b536c339e8ab39e36dc0d56d81624b20a54` |
| Private observer CPU R1 | 21 Rust controls, 12 Node controls, strict Clippy, CPU build and readelf checks | `7261b67fece74456763f360a16b88e12a9486d5fad0938ec56054536cbab6531` |

Both the actual first-main entry symbol and the real target-owned checkpoint
were present in the observer ELF, without dummy or dead-code substitutes.
The 4,162,064-byte PIE has SHA-256
`1ec72e9d53df21a510089951a6bba9a0167d8b7e2323e3dcd1d1ec5add3f3bdb`.
Symbol offsets are ELF observations, not runtime addresses or a ready debugger
profile. **The executable, debugger and scope were not invoked by that gate.**

The observer's build snapshot predates two unrelated Rust test-only lint fixes;
the combined gate retains its separate later snapshot. The implementation pin
does not retroactively relabel either historical build.

## 4. Keep the next exit separate

The same-client native producer still needs integration and fresh qualification:
real breakpoint retirement, bounded API queries, resume gates, actual identity
joins, loader/currentness checks and owned-family cleanup. A source-placement
or owner-state CPU test is not an actual DEBUG_TRAP observation.

No physical register or memory sample, visualization recording, new live route
or importer is provided here. For usable logical CPU recordings, see the
[separate LDS recorded debugger](physical-lds-recorded-debug-v22.md); those are
not gfx950 hardware samples. **V4 remains open** and accepted exits remain
**M1/V1/V2/U1/U2/U3 (6/18)**. No global `FE2O3_PIN`, maturity level or support
claim changes.
