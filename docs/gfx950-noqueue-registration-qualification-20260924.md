# gfx950 no-queue registration qualification — 2026-09-24 UTC

On mi350, one reviewed standalone no-queue metadata-registration process passed
at 02:34:56–02:35:00 UTC. Eight separately supervised early-refusal processes
also passed their exact controls. This follows the [registration tutorial](gfx950-noqueue-registration-v1.md);
the earlier [cold preparation](gfx950-cold-debug-preparation-v1.md) remains inactive.

The retained positive is [actual-report.json](evidence/gfx950-noqueue-20260924/actual-report.json)
with its byte-exact [actual-noqueue.jsonl](evidence/gfx950-noqueue-20260924/actual-noqueue.jsonl).
The separate [negative-report.json](evidence/gfx950-noqueue-20260924/negative-report.json)
contains the eight refusal/process observations. These files are read-only
evidence copies, not an import format or debugger session.

## Positive observation and boundary

The real process returned registered_no_queue, exit 0, no signal, 1276 stdout
bytes and empty stderr. Trap registration, mode-3 debug-runtime enable and
code-object metadata publication were acknowledged. Metadata version was 11.

The selected kernel was fe2o3_gfx950_observation_fixture, on gfx950:xnack-,
Wave64, node 2, GPU ID 39903 and unique ID 16366993098680759275. The decimal
unique ID is retained as a string, not a rounded JavaScript number.

| Input/fact | Exact value |
| --- | --- |
| Artifact bytes / SHA-256 | 5536 / d10b592732d91cf4c0d4289890fdd0a5328e84cb8208817eaabac4c62c1a34c6 |
| Trap bytes / SHA-256 | 1116 / 4ffea893ee53e018a629c19254855721882444517155251f1f45dd3519bc81fe |
| Device profile SHA-256 | 6f859b0a67f8ee2497393206930ff35bf1a9ae69d33f172106a790a0c9226667 |
| Standalone binary bytes / SHA-256 | 3672784 / 6d878b7afac83e069d3972a1f19d93229ac2f701f770827b148815ef2a717b06 |
| Mapped backing / metadata | 16384 / 5744 logical bytes, not RSS |

The supervisor used fresh exec, an empty environment, no inherited GPU FDs,
a reviewed/pinned standalone dependency closure and bounded owned process group.
The direct child was reaped and streams drained. The 77-ms child observation
is not a performance benchmark.

No queue was created; no kernel was dispatched; no physical sample or trap
execution was qualified. TMA remains zero. Cleanup was not acknowledged.
Attached-debugger acceptance was not observed. Direct-child reaping does not
prove descendant quiescence, general external-injection exclusion or driver
resource teardown. The report explicitly keeps those claims false.

The artifact is a diagnostic native fixture, not authenticated Rust source,
protected publication or compiler/source-to-GPU proof. Registration metadata
grants no queue, stop, launch or physical-register authority.

## Eight exact pre-preparation refusals

All eight exited 1 with no signal and empty stderr. Each reported
native_effects:not_attempted for debug preparation/activation; normal
read-only device admission may already have opened descriptors.

| Case | Exact phase / reason |
| --- | --- |
| Ambient environment | process_isolation_snapshot / nonisolated_environment |
| Missing activation acknowledgment | arguments / closed_grammar_and_explicit_effect_acknowledgments |
| Artifact size | artifact_file / expected_size_mismatch |
| Artifact digest | artifact_pin / sha256_mismatch |
| Kernel selection | artifact_admission / normal_kernel_selection_refused |
| Node selection | device_selection / exact_identity_or_profile_mismatch |
| GPU selection | device_selection / exact_identity_or_profile_mismatch |
| Device profile | device_selection / exact_identity_or_profile_mismatch |

The managed negative runs recorded post-exit SIGTERM/SIGKILL attempts with
group_absent; the direct children had already exited with the expected code.
Those absent-group observations are not a descendant-quiescence certificate.

## CPU gates and retained byte pins

The r7 CPU gate passed 444 library tests without engineering and 581 with
engineering-gfx950, one ignored in each run; 6 inactive-cold example tests;
14 no-queue example tests; and 32 feature-enabled documentation tests.
Both no-deps all-target KFD Clippy configurations passed with warnings denied,
followed by a successful standalone build. This is not a full-workspace,
site/browser or GPU-execution qualification.

| Retained file | Bytes | SHA-256 |
| --- | ---: | --- |
| actual-report.json | 3349 | feb5c8c215558c246b6e13bdff453090adb14941e48dcbe67d57755cb6e40b70 |
| negative-report.json | 15226 | 59f44122eef4097a1026b79c30a94a918f6d5615e71a25ee50230d14e7864dfd |
| actual-noqueue.jsonl | 1276 | 5101d4cad81b5813b3c07d0332e34fc4de97fdca495655b28f375e2b5b9004d5 |
| compiler-debug-noqueue-cpu-r2/receipt.json | 21110 | 21ec4ba76dc2d9757e2404c1d2b684cb24a4bff20f90c85f68f9f6935dc6a6b4 |
| compiler-debug-noqueue-negative-r1/receipt.json | 33309 | 00945e915dedd256d9308ddd1ba5a971954ecd84358609dd094dab077526e37b |
| compiler-debug-noqueue-actual-r1/receipt.json | 32719 | e72382f9740fdcc76d5aa085d3378e0310c638238d0ac5b38a6a4a4997856240 |

The three r7 gate receipts remain in the maintainer's
logs/phase28-resume-r7-<name>/receipt.json under
/home/harmenon/fe2o3-authoring-280-282-mi350.4VZ42zNr.
Native report originals are in phase28-gfx950-noqueue-actual-r1 and
phase28-gfx950-noqueue-negative-r1. Hashes identify retained content, not
signatures, portable source custody or transitive build attestation.

All three gates recorded unchanged source inventory: 7195 files,
107449373 bytes, SHA-256
993df5747347fc17e72b019f52ad9c910c9c1cca6016ea2b4ed1f566667082f7,
with working-tree HEAD 24702115958e1b59c1c20c71ab75f3aeaf07d6a4.
That HEAD alone is not asserted to contain the tested uncommitted changes.
Mutable main implementation links are not a replacement immutable qualification
pin. Later publication must retain this exact observation boundary.

No FE2O3_PIN, curriculum maturity, browser capability or V4/M6 milestone is
promoted by this record.

## Implementation pin and site validation

The matching implementation is [compiler commit ce6b769d](https://github.com/harsh-nod/fe2o3/commit/ce6b769d83fd82918ceee23ca6a5756bdeeb91c5),
also pushed to powderluv/fe2o3 main. The KFD implementation files match the
qualified registration tranche; unrelated pending complete-body source work is
not part of that commit. The historical working-tree source inventory above
is preserved rather than relabeled as this commit's entire tree.

The tutorial site gate passed its six focused content/evidence checks and the
full validation command: lint, type checking, 1523 unit tests, 21 authoring-lab
tests and production build. No browser route changed and no new browser or
hardware-capture qualification is claimed. The build retains its existing
large-chunk advisory.

Site receipt: logs/phase28-resume-r7-site-debug-noqueue-r1/receipt.json,
20718 bytes, SHA-256
880ad9d4c3c545f45a2dd8b3e4f1d18bf213d6ee5329cfc545b2ba0cee786914.
Its unchanged site source inventory was 803 files / 19938326 bytes,
759f53fe1532b0642ac8ed9b23ac413a15b0ec2681cc886de5c5cbe476192f51.
This implementation-pin paragraph is a subsequent documentation-only addition.

The compiler publication gate separately passed DCO, hygiene, whitespace and
repeated KFD library/example/documentation tests. Receipt:
logs/phase28-resume-r7-compiler-noqueue-publication-policies-r1/receipt.json,
22503 bytes, SHA-256
dab9619b0d3ef8038ba59258bed41644568deefa9c82977cc32e9f027b59fa5a.
