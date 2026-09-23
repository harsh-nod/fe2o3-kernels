# Check a gfx950 artifact without launching it

This contributor walkthrough checks one exact artifact against a genuinely
checked MI350 device. It does not load the artifact, launch a kernel, attach
ROCgDB, capture registers or advance a debugger cursor.

The [qualification record](https://github.com/harsh-nod/fe2o3/blob/main/docs/evidence/gfx950-checked-artifact-20260923.md)
records one actual positive and six refusals on mi350. V4 remains open: real
same-stop register capture needs additional runtime/trap support.

## Build the observer

From fe2o3 containing the example, use its pinned Rust toolchain:

~~~sh
cargo test --offline --locked -p fe2o3-debug-cli \
  --example observe_gfx950_checked_artifact_v1
cargo build --offline --locked -p fe2o3-debug-cli \
  --example observe_gfx950_checked_artifact_v1
~~~

RocgdbCheckedGfx950ArtifactV1 borrows a genuine mutable checked device and
immutable bytes/name. Its inspect/revalidate methods fence device currentness
around descriptor inspection. No raw-device or execution conversion exists.

## Select real inputs

Use an actual gfx950:xnack-/Wave64 HSACO; retain its whole byte count and
SHA-256 from its producer. A filename, target string or matching hash alone
is not source authentication. Never relabel a gfx942 object.

A [diagnostic-only native fixture](https://github.com/harsh-nod/fe2o3/tree/main/tools/fe2o3-llvm-link-worker/tests/gfx950-artifact)
uses the existing pinned worker. It is not an alternate source frontend or
protected publication path. The tested artifact was 5,536 bytes,
SHA-256 d10b592732d91cf4c0d4289890fdd0a5328e84cb8208817eaabac4c62c1a34c6,
with kernel fe2o3_gfx950_observation_fixture. A rebuild needs its own exact
observations; these numbers do not authorize different bytes.

Select the current KFD topology node and nonzero unique ID explicitly. The
observer binds by unique ID and checks the node, without selecting GPU zero
or assuming an ordinal is a durable identity. Other driver, partition,
firmware or XNACK profiles can refuse.

## Make one explicit observation

~~~text
observe_gfx950_checked_artifact_v1 HSACO BYTES SHA256 KERNEL NODE UNIQUE_ID LOAD_BASE
~~~

Invoke the built executable with a canonical absolute artifact path. Integers
use unsigned decimal, with no leading zeroes or hexadecimal prefix. SHA-256
is 64 lowercase hex characters. Artifact size is bounded at 64 MiB; the example
bounds kernel names at 128 UTF-8 bytes.

LOAD_BASE is a caller-selected arithmetic input. The tested value was 65536.
No code is loaded there; output labels it caller_admission_only. Never present
it as an observed GPU load address.

Success returns one bounded JSON line with result.status=observed, exact
artifact/device observations, two revalidations, and false queue, dispatch,
attach and physical_registers fields. Retained files are rechecked by metadata
and exact bytes; this is not atomic filesystem or continuous-currentness proof.

Binding opens owned KFD/render/reset-observation descriptors. It does not set
XNACK, explicitly acquire a VM, allocate GPU memory or create a queue.

## Negative exercises

Keep the original file unchanged; change one argument per call:

| Change | Expected refusal |
| --- | --- |
| One hash digit | artifact_pin / sha256_mismatch |
| Expected byte count | artifact_file / expected_size_mismatch |
| Node, retaining the actual unique ID | device_selection / node_or_unique_id_mismatch |
| Absent kernel name | companion_inspection / kernel_selection |
| Base 18446744073709551615 for the nonzero fixture entry | companion_inspection / code_binding |
| Separately pinned real gfx942 artifact and actual kernel name | companion_inspection / artifact_target |

Refusal exits nonzero with no success observation. If your machine refuses
device admission, that does not pass a later artifact negative. Do not weaken
the device profile to make an exercise succeed.

Twelve example tests also cover symlinks, same-byte inode replacement, changed
content, growth/truncation, link metadata and canonical grammar. The initial
replacement test found an error-phase bug; its corrected rerun is separately
recorded instead of erasing the failed run.

## Debugger relationship

This record is an input observation, not a historical register-stop capture.
The site does not import it as one. Existing historical hardware views and
[logical instruction lifetimes](ordered-role-liveness-v1.md) retain their own
formats and evidence. Browser import, hover or selection never runs this command.

This Markdown walkthrough does not change the curriculum compiler pin, promote
a lesson maturity label or close M4/V4/V5.
