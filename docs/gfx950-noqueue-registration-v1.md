# Register gfx950 debugger metadata without creating a queue

This engineering-only step follows [inactive cold preparation](gfx950-cold-debug-preparation-v1.md).
It consumes real retained kernel/trap custody, registers the trap, enables the
debug-metadata runtime profile and publishes one code-object entry. It creates
**no queue**, performs **no dispatch** and captures **no physical sample**.

One supervised registration and eight exact early refusals passed on mi350;
the [2026-09-24 UTC evidence note](gfx950-noqueue-registration-qualification-20260924.md)
retains the exact observations. This is not attached-debugger acceptance,
trap/TMA execution qualification, cleanup acknowledgment or V4 completion.

## Build and review the standalone program

Use a matching fe2o3 checkout with its pinned Rust toolchain:

~~~sh
cargo test --offline --locked -p fe2o3-kfd --features engineering-gfx950 \
  --example observe_gfx950_debug_metadata_noqueue_v1
cargo test --offline --locked -p fe2o3-kfd --features engineering-gfx950 --doc
cargo build --offline --locked -p fe2o3-kfd --features engineering-gfx950 \
  --example observe_gfx950_debug_metadata_noqueue_v1
~~~

The [standalone source](https://github.com/harsh-nod/fe2o3/tree/main/crates/fe2o3-kfd/examples/gfx950_debug_noqueue_v1)
calls an **unsafe consuming API**. Safety requires one disposable process with
no foreign KFD/ROCr runtime or queue, and exclusion of concurrent or future
runtime/queue creation and external code injection until process exit—even after
owner Drop. The supervisor must review and pin the executable, loader and complete
dependency closure. Flags and /proc snapshots do not prove that condition.

The qualified binary needed only the reviewed libc, libgcc_s and loader.
Other runtime dependencies, executable anonymous mappings, unexpected GPU FDs
or an unsupported library layout must refuse; do not add wildcard allowances.

## Give exact inputs to an external supervisor

Obtain current device identity from the [read-only companion](gfx950-checked-artifact-v1.md).
Select an actual gfx950:xnack-/COV6/Wave64 artifact and its exact canonical
absolute path, byte count, SHA-256 and kernel name. Retain the independently
checked node, nonzero unique ID, GPU ID and device-profile digest. Historical
host values in the evidence note are not defaults for your machine.

The supervisor must fresh-exec the standalone binary with an empty environment,
close all unrelated inherited FDs (in particular, **no foreign GPU FDs**), own the
process group, bound time and output, and terminate/reap after observation.
The observer accepts only an empty environment or exact LANG/LC_ALL=C or C.UTF-8.
A nonempty /etc/ld.so.preload refuses. Do not use cargo run, a profiler/preload
wrapper, a reused GPU process or a long-lived service.

The exact command **inside that supervisor contract** is:

~~~text
/usr/bin/env -i /absolute/bin/observe_gfx950_debug_metadata_noqueue_v1 \
  --allow-vm-mapping \
  --retain-until-process-exit \
  --acknowledge-isolated-noqueue-activation \
  ABSOLUTE_CANONICAL_HSACO_PATH BYTES SHA256 KERNEL NODE UNIQUE_ID GPU_ID DEVICE_PROFILE_SHA256
~~~

env -i alone does not close inherited GPU FDs, establish process isolation,
provide a deadline, or reap the child. It is not a complete supervisor.
Use fresh output paths and retain both process exit and complete bounded streams.
The measured qualification used a 20-second child deadline and 8-MiB stream
caps; the observer itself emits at most one 4096-byte final JSON record.
Runtime enable may block while a debugger handles its runtime event.

## Interpret the one-shot result

Require exit 0, empty stderr, schema diagnostic-gfx950-debug-metadata-noqueue-v1
and status registered_no_queue. The retained positive reported:

| Fact | Observation |
| --- | --- |
| Metadata version | 11 |
| Trap registration / runtime enable / metadata publication | true / true / true |
| Queue creation / dispatch / trap execution qualified | false / false / false |
| Kernel artifact / trap text | 5536 / 1116 bytes |
| Mapped backing / retained metadata | 16384 / 5744 logical bytes |
| Cleanup acknowledged | false |

Logical byte counts are not RSS or allocator capacity. The code-object list and
every pointee remain retained with the actual native mappings; success does not
show that a debugger accepted or consumed them. **Attached-debugger acceptance
was not observed.** TMA is zero and remains unqualified for sampling execution.

An error after preparation may report possible_retained_until_process_exit.
There is no rollback, retry, runtime-disable or trap-clear acknowledgment.
Do not retry in the same process or infer cleanup from a successful JSON line.
The supervisor observed direct-child exit/reaping, not a driver cleanup
acknowledgment, descendant quiescence proof or general injection-exclusion proof.

The older observe_gfx950_cold_debug_v1 command remains **inactive**: metadata
version 0, no trap registration, runtime enable or publication. This separate
successor does not change its behavior or transfer evidence between commands.

This tutorial adds no browser importer, command launcher, stopped-wave view,
physical-register visualization, GPU execution evidence, FE2O3_PIN change,
curriculum maturity promotion or milestone-completion claim.
