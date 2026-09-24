# Complete-body Rust source qualification — 2026-09-24 UTC

On mi350, the actual Rust-source ladder passed 21 isolated compiler sessions,
384 CPU cases and 15 exact negative sessions at 03:08:30–03:09:30 UTC.
This qualifies the bounded one-block and selector-diamond examples in the
[source tutorial](complete-body-source-v19.md), not general assembly support
or completion of the authoring/debugger milestones.

| Path | Retained state at this checkpoint |
| --- | --- |
| Actual Rust → MIR36 → checked KIR19 → CPU and normal LLVM/worker handoff | Passed the source ladder below |
| Ordinary public source scripts (seven commands) | Passed four positive exports and ten exact refusals |
| Ordinary public source-debug scripts (two commands) | Passed six CPU requests and six logical forward/reverse sessions |
| Actual-source canonical executable LLVM prefix | Passed four O0/O3 native ABI/decoder cases; no functional execution |
| GPU execution, physical samples, protected finalizer, V19 website viewer | Not qualified by this record |

The public-script gate passed separately at 03:11:11–03:16:56 UTC. It is
separate from the public-driver modes exercised inside the ladder. Their names
are similar, but one result does not stand in for the other.

## Retained source evidence

The [source-ladder observation](evidence/complete-body-source-v19-20260924/source-ladder-observation.json)
records seven source cases in each of observe, LLVM export and handoff export
modes. The [supervisor receipt](evidence/complete-body-source-v19-20260924/source-ladder-receipt.json)
records command-passed, exit 0, no signal, no errors, and unchanged compiler
source inventory.

The observation copy adds one final LF for repository text conventions.
Its preceding 77,983 bytes are byte-for-byte the original; the content test
checks both the stored copy and the exact original prefix. No JSON fields or
internal bytes were reserialized. The supervisor receipt is byte-exact.

| Original retained input | Bytes | SHA-256 |
| --- | ---: | --- |
| phase28-complete-body-source-actual-r7/observation.json | 77983 | 33eaf977a1b04ef2864a0d0d7fb11f96ad009f6982c54a1d4548111923daa17b |
| compiler-source-v19-actual-r7/receipt.json | 21623 | 209cfe79d19ef1ddffefe5147119687d3cf198f19c23b61c7c5948ac3de8cbe9 |

Originals remain under the maintainer root
/home/harmenon/fe2o3-authoring-280-282-mi350.4VZ42zNr; the receipt is in
logs/phase28-resume-r7-compiler-source-v19-actual-r7.
These are read-only observations, not debugger imports or compiler owners.

Both positive observations retain actual_rustc_callback,
normal_checked_continuation, normal_worker_preparation and
same_owner_source_canonical_descriptor_entry as true. CPU use borrows the
genuine checked owner; normal descriptor preparation then consumes that owner.
The exported files do not reproduce that source custody.

## What passed

Each positive kernel passed 192 CPU cases. The combined 384 cases use grids
64/128, selectors 0/1/u32::MAX and lengths 0/1/63/64/65/127/128/129, with
distinct input values, both diamond branches, initialization checks, two-sided
canaries and unchanged source/requests. The one-block kernel has one authored
step; the diamond has four authored blocks and two steps.

For each positive, the normal public-driver LLVM bytes equal that source's
observed canonical LLVM bytes; handoff bytes also agree exactly. This is
normal compiler preparation, not completion of a native worker.

| Kernel | KIR19 bytes | Raw canonical-byte SHA-256 | Canonical identity |
| --- | ---: | --- | --- |
| assembly_one | 1019 | c11995c3bb2156e68518942df9059c9a76fca03b0b135f0c981c54a7f0a418a7 | bfed724d6bc7bec637907b30caf7403734591257b07dc848357b81048b8ce428 |
| assembly_diamond | 1185 | bfb69db4dfbbdb00955657b41165b1de62bc54e7987d0e5b10e29fc4bd4fdeaf | 457a867306d65b947317202c563147d5aa03b508c2c08fd4b9dafe1610ba30ca |

Raw-file SHA-256 and canonical identity are different fields with different
meanings. Neither authenticates source or grants compilation-resume authority.

Five negative fixtures each refused in all three modes:

| Case | Exact refusal fragment |
| --- | --- |
| Wrong launch: required **and** maximum 128×1×1 | complete body requires required and maximum 64x1x1 |
| Reserved scratch register v7 | complete body roles require distinct v8..v63 outside the reserved prefix |
| Foreign input transport | complete body marker operands differ from exact root argument order |
| Missing output on one incoming merge path | OutputNotDefined { label: Gfx942CompleteBodyLabelV1(4) } |
| Dynamic/default grid envelope | complete-body source requires an explicit finite max_grid |

The wrong-launch source is valid under the general typed-launch grammar:
required and maximum are both 128×1×1. It deliberately violates the exact
64×1×1 complete-body profile. A required-64/max-128 grammar error would not
qualify this intended refusal.

Earlier r1–r6 source-gate attempts were diagnostic failures, not accepted
positive or negative evidence. Their supervisor receipts remain alongside r7;
this successful record does not erase or relabel those attempts.

## Ordinary public command results

The seven public source commands ran through normal Cargo/rustc wrapping:
one and diamond each emitted LLVM and an inert handoff with the same executable
LLVM text; five negative cases each produced the exact refusal in both modes.
These scripts did not run CPU simulation or native LLVM generation.

The two public source-debug commands exported their own checked diagnostic
KIR19, then ran six CPU requests (three selectors for each kernel) and six
logical debugger sessions. One returned 19 for every selector; diamond returned
19/23/23 for 0/1/u32::MAX. Each CPU request checked 128 output words,
initialization and two trailing canary words in its 520-byte allocation.
Each debugger transcript discovered capabilities and observed entry → first
logical event → entry. That short replay is not a full authored-body stepping
or physical-register qualification.

The independently retained [one receipt](evidence/complete-body-source-v19-20260924/public-debug-one.json) and
[diamond receipt](evidence/complete-body-source-v19-20260924/public-debug-diamond.json) include exact output/request/response hashes.
Their raw KIR hashes are respectively
1bf48d77302689bf514f4236ede0a408cc1bfbd5be9cc2ab7fc1c8458af02965 and
b1104bbb9496044a10776fed27c00d34354a7ff41291ed7a2c5d1bdcfcdc160a.
Each separate invocation retains its own source/canonical/handoff identities;
they are not interchangeable with the ladder's identities above. Canonical
LLVM text equality does not imply identical source origins or descriptor bytes.

All ten public receipt copies below are byte-exact, including the final LF.
Raw KIR, requests, CPU results and JSONL streams remain in the original
phase28-complete-body-public-<source-or-debug>-<case>-r1 directories. The site
copies receipts, not an executable import bundle. It is not a V19 website adapter.

| Retained public receipt | Bytes | SHA-256 |
| --- | ---: | --- |
| [public-command-receipt.json](evidence/complete-body-source-v19-20260924/public-command-receipt.json) | 28269 | 7f371f02546baf4bceabd5a6e967f226cc06c9f098a861e482b23c7e715a49fc |
| [public-source-one.json](evidence/complete-body-source-v19-20260924/public-source-one.json) | 4386 | f2c95657e5fe236b8a6f6d707601903c1e42cb34865c5d59b86b34aec53fdcdc |
| [public-source-diamond.json](evidence/complete-body-source-v19-20260924/public-source-diamond.json) | 4414 | 83918bdf55d7011574d1f212406c7a165342881ab8b9f1f7a8a01c605a3ca890 |
| [public-source-wrong-launch.json](evidence/complete-body-source-v19-20260924/public-source-wrong-launch.json) | 4031 | 040c7d889f222cd29293152dd5db67814c18e8ba49b299b94a0f3093da631971 |
| [public-source-reserved-register.json](evidence/complete-body-source-v19-20260924/public-source-reserved-register.json) | 4100 | 40f441b36edfa853fd5441ae92c4566b9331d5a32688db239593630f303c1897 |
| [public-source-foreign-input.json](evidence/complete-body-source-v19-20260924/public-source-foreign-input.json) | 4070 | eb257309b97eec4adbd482d742f04e58eae2a856184a96306c865037514420f0 |
| [public-source-undefined-merge.json](evidence/complete-body-source-v19-20260924/public-source-undefined-merge.json) | 4058 | a192fbb111ed5830b1ff9fbf7691e75db64753dd1ee255444daf0e37108514d9 |
| [public-source-dynamic-grid.json](evidence/complete-body-source-v19-20260924/public-source-dynamic-grid.json) | 4045 | 22ecef16ef747409884d37acd152cf13ba01aecb26b5702cd1689621d5e3fef0 |
| [public-debug-one.json](evidence/complete-body-source-v19-20260924/public-debug-one.json) | 13010 | 68e5d4048077b0a54dda498a0c767cb28682a307dfc25658c30caf37a2043ae3 |
| [public-debug-diamond.json](evidence/complete-body-source-v19-20260924/public-debug-diamond.json) | 13114 | 34b90de169998146cd2ddba3d25de8a29752118f4f4456958d99f3276db76064 |

Native functional execution remains unqualified. No GPU was used by either public script.

## Actual-source canonical-prefix native checks

A separate supervised gate passed at 03:20:17–03:20:24 UTC. Its
[native summary](evidence/complete-body-source-v19-20260924/native-summary.json)
records four LLVM/LLD and native-decoder cases: assembly_one and
assembly_diamond, each at O0 and O3. It compiled the exact unchanged canonical
executable LLVM prefix from the actual source observation, retaining the real
source entry symbols. This was not a synthetic-name replacement.

The descriptor-bearing worker LLVM was not the input to this native gate.
The source ladder separately decoded and joined the handoff/descriptor.
Together these observations do not establish protected finalization or native
functional execution of the prepared worker artifact.

| Source entry | Optimization | HSACO bytes | HSACO SHA-256 |
| --- | --- | ---: | --- |
| assembly_one | O0 | 5720 | b97f27dc600707ae0d9604c48dfe6f74103458c83466e1a0dd80920617911db1 |
| assembly_one | O3 | 5400 | ee938d6e6d4e5a58c19a4e39aee3518bebab35bbf85ae3a6547a659cdd7b9a9f |
| assembly_diamond | O0 | 5824 | acb1d69a91d64d0a871edf541760ea285b6f05c518a454d63a4fbf3b6e14784d |
| assembly_diamond | O3 | 5440 | 48156355db65012979a156f1e6dd20c1b470f4af18b973af9e8a7fd81189b9bc |

The checker passed 138 mutation refusals, 64 entry-syntax cases and 12
entry-relation cases. The selector remained at kernarg byte 28 and destination
s22, with load-ready=true for all four rows. Exact native reports and artifacts
remain in phase28-complete-body-actual-source-native-r1; the site retains the
byte-exact 5,155-byte summary, SHA-256
f7a23e988f29451f9e173ec87c9e8cde018a7a4d6ab6c0c3ddc990d77eb51a0e.

The supervisor receipt remains at
logs/phase28-resume-r7-compiler-actual-source-native-v19-r1/receipt.json:
119755 bytes, SHA-256
45fa03e647fe675917756601e04673dd66e34cc390379a17cd8134412949bc13.
It recorded unchanged source inventory and exit 0. Its short duration is not
a performance measurement. Native compilation=true is distinct from
native_functional_execution=false and hardware_execution=false.
The harness grants no source authentication or protected-finalizer admission.

## Source, toolchain and resource boundaries

The compiler invocation used the installed nightly-2026-04-03, opt-level=3,
panic=abort, overflow-checks=on and gfx942 Wave64/xnack-off target settings.
The retained fixture source SHA-256 is
3fb330e7193918e3e587445fdc82fd5d5dd3ca664063fbc9781664a67f2bb26c.

The unchanged working source inventory contained 7208 files / 107560580 bytes,
SHA-256 217a30aed5f579381a9461007bf1f6cf729ab146cab7918f27538e01d245fee2.
The observed base HEAD was ce6b769d83fd82918ceee23ca6a5756bdeeb91c5;
HEAD alone is not asserted to contain the tested uncommitted source changes.
The [published implementation commit](https://github.com/harsh-nod/fe2o3/commit/76fe660d9ef27961ec764c5cec1b7b79e6321a33)
contains this continuation after peer integration, allocation-free cleanup and
a behavior-preserving output-module split. Its tree is
6b2b3a710dcfa00143abbe41901db28305493d16. The historical source census above
is not relabelled as the commit tree. The [compiler evidence](https://github.com/harsh-nod/fe2o3/blob/76fe660d9ef27961ec764c5cec1b7b79e6321a33/docs/evidence/complete-body-source-v19-20260924.md)
records the later complete public rerun, full core/consumer regressions, retained
policy failures/corrections and the 14 remaining new large-error lint warnings.

CPU tail protection does not weaken formal LaunchEnvelope obligations.
The authored max_grid=[2,1,1] and required/max workgroup64 imply an analysis
envelope of 128 invocations; formal launch eligibility still requires 512
output bytes. Ragged CPU slices test guarded behavior only.

The supervisor's sampled resource guards and bounded logs are not compiler
RSS accounting, descendant-quiescence proof or transitive build attestation.
Its source_authenticated and production_qualified fields remain false:
the receipt observes a command; it does not serialize compiler authority.

Native machine-code generation and static ABI/decoder checks are retained only
for the unchanged canonical executable prefix described above. No native
functional execution, GPU execution, physical VGPR/EXEC capture, source-map
export, artifact/launch authority or protected-finalizer admission is established.
The older native ABI fixture remains separate evidence, not a substitute for
this actual-source record.

No FE2O3_PIN, curriculum maturity, browser capability or milestone is promoted.
The [null-valued pending checklist](complete-body-v19-qualification-pending.json)
is retained only as a non-evidence template for future runs, not as the current
status record. Site content/type/lint/test/build gates passed: 16 focused
content tests, 1,539 full unit tests, 21 authoring-lab tests, lint, type checking
and build. The focused tests overlap the full suite. The r2 receipt is
logs/phase28-resume-r7-site-complete-body-v19-r2/receipt.json, 20,788 bytes /
6e2da4103f18c2444ff8ed30b5ddadfff1e9f825eb8181bca89f841457c9fa7b.
The earlier 15/16 content-test failure was corrected by making the unavailable
hardware boundary explicit; no assertion was relaxed. No new browser route or
browser gate is claimed by this tutorial-only publication.
