# Prepare gfx950 debug resources without activating them

This engineering-only contributor walkthrough prepares **real KFD VM and mapping resources** in one externally supervised, disposable process. Unlike the [read-only artifact/device companion](gfx950-checked-artifact-v1.md), it allocates and maps the admitted kernel and reviewed trap text. It does not register or execute that trap, enable a debug runtime, publish debugger metadata, create a queue, dispatch a kernel, attach ROCgDB or capture registers.

The [dated qualification](https://github.com/harsh-nod/fe2o3/blob/main/docs/evidence/gfx950-cold-debug-preparation-20260923.md) records one actual inactive preparation and seven exact refusals on mi350. It is progress toward V4, not a hardware-cell or milestone-completion claim.

## Build the explicit engineering example

Use fe2o3's pinned Rust toolchain and the engineering feature:

~~~sh
cargo test --offline --locked -p fe2o3-kfd --features engineering-gfx950 \
  --example observe_gfx950_cold_debug_v1
cargo build --offline --locked -p fe2o3-kfd --features engineering-gfx950 \
  --example observe_gfx950_cold_debug_v1
~~~

This ordinary example calls the actual sealed cold-owner API. Its six tests are separate from the native run. The tested library gates passed 444 tests without default features and 570 with engineering-gfx950, each with one ignored; strict no-deps all-target KFD Clippy passed in both configurations. These are not a full workspace or browser qualification.

## Select actual current inputs

Use a genuine gfx950:xnack-/COV6/Wave64 artifact, its exact whole-file byte count and SHA-256, and its actual kernel entry. Never relabel a gfx942 object. The selected [diagnostic artifact fixture](https://github.com/harsh-nod/fe2o3/tree/main/tools/fe2o3-llvm-link-worker/tests/gfx950-artifact) is mechanism evidence, not authenticated Rust source or protected publication.

Use the [read-only companion](gfx950-checked-artifact-v1.md) to obtain current checked-device observation fields. Explicitly select the topology node and nonzero unique ID; retain the returned GPU ID and device-profile digest. The cold example binds independently and checks all four fields again. Historical host values are not defaults for another machine or later device configuration.

Keep a canonical absolute regular-file path. The example rejects redirected paths, wrong size/hash and changed retained file identity or bytes. The normal loader selects the kernel before opening the device. These checks are bounded snapshots, not atomic filesystem authentication.

## Run once under an external supervisor

The exact grammar is:

~~~text
observe_gfx950_cold_debug_v1 --allow-vm-mapping --retain-until-process-exit \
  ABSOLUTE_CANONICAL_HSACO_PATH BYTES SHA256 KERNEL NODE UNIQUE_ID GPU_ID DEVICE_PROFILE_SHA256
~~~

Both flags are required. They acknowledge real VM/allocation/mapping effects and process-lifetime resource retention. Unsigned numbers use canonical decimal; hashes use exactly 64 lowercase hexadecimal characters. The ELF is limited to 64 MiB and the selected kernel name to 128 UTF-8 bytes.

Give the supervisor a finite deadline, bounded stdout/stderr retention and ownership of the exact child. The measured positive used a 30-second limit and exited normally. The example itself is not a timeout, retry or cleanup service. Do not embed this one-shot path in a long-lived service or retry after a preparation failure in the same process.

Before acquiring the VM, the owner exposes an exclusive debug reservation. Plain/debug mixing and another debug reservation are refused. After VM acquisition may have begun, errors, unwind and Drop retain the actual context, original ELF, mappings and metadata until process exit and poison the gate. No public close, activation or native teardown acknowledgment exists.

## Read the result narrowly

Success exits 0 and writes one flushed JSON line of at most 4096 bytes, with schema `diagnostic-gfx950-cold-debug-preparation-v1` and status `prepared_inactive`. The actual qualified call reported:

| Field | Observed value |
| --- | --- |
| Artifact / selected entry | 5536 bytes / fe2o3_gfx950_observation_fixture |
| Mapped backing / retained metadata | 16384 / 5744 logical bytes |
| Retained trap text | 1116 bytes |
| Target / wave | gfx950:xnack- / 64 |
| Metadata version | 0 |
| Metadata publication, trap registration, runtime enable, queue, dispatch | All false |
| GPU trap execution qualified / cleanup acknowledged | Both false |

Logical byte counts are not RSS or allocator-capacity measurements. Preparation-time facts do not revalidate currentness or expose native addresses. The trap mapping's CPU-read-only protection and readback do not establish GPU write protection, TMA safety or successful handler execution.

The actual positive artifact hash was
`d10b592732d91cf4c0d4289890fdd0a5328e84cb8208817eaabac4c62c1a34c6`.
A rebuild or changed artifact must have its own complete observations; this hash does not authorize different bytes. The source, trap and binary pins are recorded in the qualification report and [public contract](https://github.com/harsh-nod/fe2o3/blob/main/docs/gfx950-cold-debug-preparation-v1.md).

This JSON is **not** a historical stopped-wave resource capture and is not accepted as live debugger state. The site adds no importer or command launcher for it. Opening this Markdown or another resource view does not run the example.

## Exercise exact early refusals

In separate processes, keep the original inputs unchanged and change one argument:

| Change | Expected phase / reason |
| --- | --- |
| Omit `--allow-vm-mapping` | arguments / closed_grammar_and_explicit_effect_acknowledgments |
| Wrong expected size | artifact_file / expected_size_mismatch |
| Wrong expected hash | artifact_pin / sha256_mismatch |
| Absent kernel name | artifact_admission / normal_kernel_selection_refused |
| Wrong node, GPU ID or device-profile hash, retaining the selected unique ID | device_selection / exact_identity_or_profile_mismatch |

The seven qualified negatives each exited 1 with empty stderr, the exact designated refusal and `native_preparation_effects:not_attempted`. A device-admission refusal on your host does not pass a later negative. Device checks can open descriptors; “not attempted” here refers to VM/mapping preparation.

A refusal after entering the cold-owner preparation boundary instead reports `possible_retained_until_process_exit`. Never treat that as clean teardown. Direct child exit and drained streams are not explicit driver resource-release acknowledgments; the qualification report preserves that distinction.

## What remains

Compatible trap registration, genuine runtime/metadata publication, queue ownership, an actual correlated stopped wave and physical register observation are separate implementation and qualification steps. Upstream trap source and redistribution notices must be retained as described by the public contract.

The first build attempt's retention-test lint and the first negative helper's invalid output filename remain in the evidence history; corrected reruns did not weaken assertions. This Markdown walkthrough changes no `FE2O3_PIN`, curriculum maturity or capability label, and claims no new full-browser run.
