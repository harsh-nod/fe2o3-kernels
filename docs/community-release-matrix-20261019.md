# Community Release Matrix: 2026-10-19

This is a documentation and retained-evidence audit, not a new execution,
proof, or performance qualification. All 56 lessons and 314 code tabs remain
in scope, including SIMT, tile, mixed, formal, megakernel, and performance work.
A source binding, a compiler check, and an observed GPU result are different
claims. An ancestor's successful run does not qualify a new compiler, runtime,
artifact or target.

## Exact Reviewed Sources

- [Compiler main at 188f388b](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/README.md), tree `610ae91bad3bea0c1c56022788d50b9e1ea247a5`.
- [Site main at 6cf26d1](https://github.com/harsh-nod/fe2o3-kernels/blob/6cf26d13423d6fb1656502961f611bc3780b285b/README.md), tree `35d09b5f15a0bbd791fe84f1b097b7a9cdee997c`.
- [Current tutorial contract](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/config/tutorial-kernel-manifest-v1.json):
  baseline unqualified, qualification `pending`.
- [Site publication baseline](https://github.com/harsh-nod/fe2o3-kernels/blob/6cf26d13423d6fb1656502961f611bc3780b285b/config/publication-gate.json) still names
  compiler `308d8fa00fa41e098b2a1a47bbfea1bc29735464`.
  [FE2O3_PIN](https://github.com/harsh-nod/fe2o3-kernels/blob/6cf26d13423d6fb1656502961f611bc3780b285b/src/content/model.ts) separately names `acb3d275`.
- [Site curriculum-contract pin](https://github.com/harsh-nod/fe2o3-kernels/blob/6cf26d13423d6fb1656502961f611bc3780b285b/config/curriculum-source-contract.json)
  names compiler `7ab5f073`; the current compiler contract retains site
  `a6359449`. These historical identities are not a coherent current-main
  execution receipt. This audit does not refresh them.

The compiler-side `2f2e4f786` test-data correction is already an ancestor of
reviewed compiler main. Its retained 257-test Python/mock-shell pass concerns
that exact older head, not kernel execution on current main.

Four earlier site commits remain outside reviewed site main:
`3472369` (fill display/source alignment), `c27afc2` (Vecadd composite versus
file provenance), `b4e4184` (separate current gfx950 pipelined source), and
`1919554` (associated link tests). Each needs independent source/evidence/pin
review before integration; this documentation patch imports none of them.

The maintained curriculum checker actually rejects these reviewed mains with
`first-fill tab 0 source/display binding differs`. An all-314-tab comparison
of common projection fields found one mismatching tab: the contract expects
552 displayed bytes from `b9378bdb`, while site main retains 680 bytes from
`f84c2a59`; displayed length, displayed digest, source commit and source digest
differ. The other 313 common projections match, which is not a full source,
compiler, semantic, or execution qualification. The failure is preserved;
no expected bytes, contract or frozen pin was refreshed to hide it.

## Counts And Meaning

| Surface | Count | What Is Established |
| --- | ---: | --- |
| Lessons / tabs | 56 / 314 | Actual site data and compiler inventory retain the full scope. |
| Executable / conceptual lessons | 46 / 10 | Curriculum roles, not pass counts. |
| Curriculum obligations | 96 pending | 46 SIMT, 46 tile, 4 mixed; zero qualified lesson pairs. |
| Registered fixture/target rows | 50 pending | 11 gfx942 and 39 gfx950. |
| Fixture simulation records | 48 pending-reconciliation, 2 pending-design | Expected inputs/oracles, not successful executions. |
| Kernel identities / variant obligations | 61 / 123 | Separate from lesson presentations. |
| Source-bound / pending identity variants | 22 / 101 | All 22 bound variants are SIMT; zero bound SIMT/tile pairs. |
| Current-main end-to-end correctness receipts joined by this audit | 0 | No joined current-source/artifact/runtime/target/output/cleanup receipt. |
| Current-main hardware correctness of registered rows | 50 unknown | Pending qualification is not evidence that a kernel can never work. |

Counts use different denominators and must not be added.
"Pending" describes a required gate; "unknown" describes unavailable execution
evidence. Neither means "unsupported." Architecture-specific features may
qualify on one documented supported GPU first. A gfx950-only receipt neither
needs an invented gfx942 pass nor establishes one.

## Retained Evidence At Its Actual Scope

| Evidence | Exact Source / Target | Permitted Reading |
| --- | --- | --- |
| [gfx942 setup claim declarations](https://github.com/harsh-nod/fe2o3-kernels/blob/6cf26d13423d6fb1656502961f611bc3780b285b/src/content/modules-0-2.ts) | Compiler baseline `308d8fa0`, gfx942 | Declared compile/smoke commands and old claim labels are inspectable; this audit has not joined an immutable current-source output/completion receipt. |
| [Advanced gfx950 campaign](https://github.com/harsh-nod/fe2o3-kernels/blob/6cf26d13423d6fb1656502961f611bc3780b285b/perf-evidence/gfx950-advanced-evidence-v1.json) | Campaign `66f94673`, kernel source `c1383e97`, MI350X / gfx950 | Historical fixed-shape measurements with input/artifact hashes, not a current KFD release receipt. |
| [Advanced gfx950 ablations](https://github.com/harsh-nod/fe2o3-kernels/blob/6cf26d13423d6fb1656502961f611bc3780b285b/perf-evidence/gfx950-advanced-ablation-evidence-v1.json) | Source `da6c108d`, tree `745526b4`, MI350X / gfx950:xnack- | Record reports independent CPU-oracle, input, canary and post-block checks for 32 HSACO files / 35 series. Preserve wins, ties and rejected variants; no transfer to new bytes. |
| [Comparator admission](https://github.com/harsh-nod/fe2o3-kernels/blob/6cf26d13423d6fb1656502961f611bc3780b285b/perf-evidence/baseline-manifest-v1.json) | Fixed profiles and named exact comparators | HIP/CK/vLLM applicability/exclusions stay explicit. Historical ROCr/HSA timestamp collection is not a new direct-KFD application qualification. |
| [Mixed-tile CPU recording](https://github.com/harsh-nod/fe2o3-kernels/blob/6cf26d13423d6fb1656502961f611bc3780b285b/examples/mixed-tile-cpu-v18/fed6998b-20261001/summary.json) | Separate retained compiler/source identities; logical CPU observations | 52 recorded simulations, 10 negative controls; `hardware_observed=false`, `full_simt_tile_pair_qualified=false`, no performance prediction. |
| [Compiler/runtime installation](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/docs/runtime-release-installation.md) | Reviewed compiler/proof-runtime/profile/policy closure required | A build or unapproved package is not an installed protected runtime or device authority. |
| [Simulator/debugger guide](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/docs/getting-started.md) | Exact admitted KIR or separately exported source bundle | CPU observations, retained sessions, source bindings and GPU evidence are distinct; no arbitrary-kernel or hardware-performance promise. |

The site's 43 `gpu-observed` claim labels are claim records, not 43
independently current-qualified kernels. Compiler/HSACO observations are not
dispatches. A helper call, emitted instruction, loaded artifact, stopped queue
envelope, counter import or mock pass is not a correct-output hardware receipt.

### Formal Assurance Boundary

The formal owner supplied this wording after reviewing retained positive,
off-by-one and runtime-refusal receipts without rerunning them:

> A retained Verus run verified 44 obligations for a projected gfx942 Wave64
> U32 index-fill dispatch implementation under its modeled entry, launch and
> memory premises. An off-by-one negative control failed as expected. This
> component proof does not establish equivalence between the actual CPU
> program and emitted GPU ISA, correct GPU hardware execution, or correctness
> of the proposed V3 readiness I/O.

The domain is a one-dimensional, workgroup-64, exclusive guarded U32 store
model with modeled ABI, extent, alignment, nonoverflow and disjointness
premises. This is not 44 kernels, a gfx950 theorem or an LDS/cooperative proof.
The negative changed the modeled value and produced 42 verified obligations /
2 errors; it was not a hardware fault experiment.

The retained private receipt SHA-256 is
`5ae1021c1f752cf6c58df91ff4e98742170d252fa75d9661bd1ef9f3f63acaec`.
It is not a publicly reproducible release receipt. A stable reviewed public
receipt/source/target join remains required; no public URL is invented here.
The [current dispatch model](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/crates/fe2o3-kernel-analysis/verus/gfx942_fill_dispatch_v1.rs)
and [wave model](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/crates/fe2o3-kernel-analysis/verus/gfx942_fill_wave_v1.rs)
are inspectable, but presence does not refresh an old run.
New readiness wire, credential, nonce, deadline and cleanup bodies need
separate exact-code review and positive/negative tests; this proof does not
verify them.

### Simulator And Debugger Availability

The assembly owner's independent current-main review finds the private
`70a7400ed1` replay-identity/example candidate unmerged. Its proposed
`cargo run --example schedule_replay_walkthrough` is not a main-runnable
onboarding command. The candidate's earlier 179/317 checks must stay tied to
their retained source, not be credited to current main. The public
[ordered-region debugger guide](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/docs/ordered-region-debugger-v1.md)
documents diagnostic V16 JSONL and smoke-script surfaces, with logical
CPU-only, physical-register and source-authority limits. Ordinary source
simulation, diagnostic assembly views and live hardware debugging are separate
capabilities, not interchangeable demonstrations.

## Every Lesson

"P" means current curriculum SIMT/tile obligations remain pending, not that the
presentation never worked at an older source. "C" is conceptual, not an
execution row. Targets are declared fixture targets, not observed GPU passes.
Source links resolve against reviewed compiler main. Shared fixtures do not
collapse distinct lessons, performance labs or independent oracles.

| Lesson | Role / tabs | Declared targets | Selected source | Current pair |
| --- | --- | --- | --- | --- |
| [How to read this guide](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/read-the-evidence) | C / 4 | not an execution row | not associated with a kernel fixture | not applicable |
| [Set up gfx942 and run the gates](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx942-setup) | C / 4 | not an execution row | not associated with a kernel fixture | not applicable |
| [Fill: one witness, one write](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/first-fill) | P / 5 | gfx942 | [examples/fill/src/lib.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/fill/src/lib.rs) | pending |
| [Vecadd: the current typed vertical slice](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/typed-vecadd) | P / 6 | gfx942 | [examples/vecadd/src/lib.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/vecadd/src/lib.rs)<br>[examples/vecadd/src/vecadd_body.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/vecadd/src/vecadd_body.rs) | pending |
| [Export and debug Rust without a GPU](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/cpu-semantic-simulation) | P / 11 | gfx942 | [examples/fill/src/lib.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/fill/src/lib.rs) | pending |
| [Verus contracts and expected failures](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/verus-contracts) | C / 4 | not an execution row | not associated with a kernel fixture | not applicable |
| [Bounds, initialization, and race freedom](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/memory-race-proof) | C / 4 | not an execution row | not associated with a kernel fixture | not applicable |
| [Compiler checks: one path, explicit boundaries](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/compiler-checks) | C / 5 | not an execution row | not associated with a kernel fixture | not applicable |
| [Reductions and scans by scope](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/reductions-scans) | P / 5 | gfx942 | [examples/wave64_collectives_v1/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/wave64_collectives_v1/src/kernel.rs) | pending |
| [LDS, barriers, and atomics](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/lds-barriers-atomics) | P / 5 | gfx942 | [examples/workgroup_sync_v1/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/workgroup_sync_v1/src/kernel.rs) | pending |
| [Dynamic GEMM end to end](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gemm-tiling) | P / 8 | gfx942 | [examples/tiled_gemm_general_v1/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/tiled_gemm_general_v1/src/kernel.rs) | pending |
| [Proving and extending the MFMA kernel](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gemm-proof-plan) | P / 5 | gfx942 | [examples/tiled_gemm_general_v1/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/tiled_gemm_general_v1/src/kernel.rs) | pending |
| [Autoresearch GEMM loop](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gemm-autoresearch) | P / 6 | gfx942 | [examples/tiled_gemm_general_v1/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/tiled_gemm_general_v1/src/kernel.rs) | pending |
| [Dynamic row softmax](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/softmax-invariant) | P / 6 | gfx942 | [examples/row_softmax_general_v1/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/row_softmax_general_v1/src/kernel.rs) | pending |
| [Dynamic FlashAttention with MFMA](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/flash-attention) | P / 6 | gfx942 | [examples/flash_attention_general_v1/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/flash_attention_general_v1/src/kernel.rs) | pending |
| [MoE routing: stable ownership](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/moe-routing) | P / 5 | gfx942 | [examples/moe_top2_v1/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/moe_top2_v1/src/kernel.rs) | pending |
| [Dynamic grouped-expert MoE with MFMA](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/moe-expert-compute) | P / 6 | gfx942 | [examples/moe_grouped_expert_general_v1/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/moe_grouped_expert_general_v1/src/kernel.rs) | pending |
| [From rustc to signed evidence](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/evidence-pipeline) | C / 4 | not an execution row | not associated with a kernel fixture | not applicable |
| [What Verus proves and what stays trusted](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/what-verus-proves) | C / 4 | not an execution row | not associated with a kernel fixture | not applicable |
| [Historical evidence archive](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/evidence-archive) | C / 4 | not an execution row | not associated with a kernel fixture | not applicable |
| [Exercise ladder](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/exercise-ladder) | C / 4 | not an execution row | not associated with a kernel fixture | not applicable |
| [Contribute a kernel without overstating it](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/contributing-kernel) | C / 4 | not an execution row | not associated with a kernel fixture | not applicable |
| [gfx950 FP4 GEMM](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-fp4-gemm) | P / 6 | gfx950 | [examples/gfx950_low_precision/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_low_precision/src/kernel.rs) | pending |
| [gfx950 FP8 GEMM](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-fp8-gemm) | P / 6 | gfx950 | [examples/gfx950_low_precision/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_low_precision/src/kernel.rs) | pending |
| [gfx950 FP4 flash attention](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-fp4-attention) | P / 6 | gfx950 | [examples/gfx950_low_precision/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_low_precision/src/kernel.rs) | pending |
| [gfx950 FP8 flash attention](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-fp8-attention) | P / 6 | gfx950 | [examples/gfx950_low_precision/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_low_precision/src/kernel.rs) | pending |
| [gfx950 advanced MoE pipeline](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-advanced-moe) | P / 7 | gfx950 | [examples/gfx950_advanced_systems/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_systems/src/kernel.rs) | pending |
| [gfx950 Kimi Delta Attention decode and chunkwise prefill](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-kda-gdn-linear-attention) | P / 7 | gfx950 | [examples/gfx950_advanced_attention/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_attention/src/kernel.rs) | pending |
| [gfx950 indexed sparse attention](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-indexed-sparse-attention) | P / 7 | gfx950 | [examples/gfx950_advanced_attention/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_attention/src/kernel.rs) | pending |
| [gfx950 DeepSeek sparse attention](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-deepseek-sparse-attention) | P / 5 | gfx950 | [examples/gfx950_advanced_attention/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_attention/src/kernel.rs) | pending |
| [gfx950 compressed hybrid attention](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-compressed-hybrid-attention) | P / 7 | gfx950 | [examples/gfx950_advanced_attention/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_attention/src/kernel.rs) | pending |
| [gfx950 AttnRes, GR, and mHC mixing](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-attnres-gr-mhc) | P / 8 | gfx950 | [examples/gfx950_advanced_attention/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_attention/src/kernel.rs) | pending |
| [gfx950 speculative and MTP verification](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-speculative-mtp-verification) | P / 7 | gfx950 | [examples/gfx950_advanced_systems/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_systems/src/kernel.rs) | pending |
| [gfx950 N-gram hash-table gather](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-ngram-embedding-gather) | P / 7 | gfx950 | [examples/gfx950_advanced_systems/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_systems/src/kernel.rs) | pending |
| [gfx950 Muon polar update](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-muon-optimizer) | P / 7 | gfx950 | [examples/gfx950_advanced_systems/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_systems/src/kernel.rs) | pending |
| [gpt-oss-120b 16-item layer-tile megakernel](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-gpt-oss-120b-megakernel) | P / 13 | gfx950 | [examples/gfx950_gpt_oss_decode/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_gpt_oss_decode/src/kernel.rs)<br>[examples/gfx950_gpt_oss_decode/src/kernel_components.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_gpt_oss_decode/src/kernel_components.rs)<br>[examples/gfx950_gpt_oss_decode/src/kernel_router_serial.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_gpt_oss_decode/src/kernel_router_serial.rs) | pending |
| [FP4 GEMM performance lab](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-fp4-gemm-performance-lab) | P / 5 | gfx950 | [examples/gfx950_low_precision/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_low_precision/src/kernel.rs) | pending |
| [FP8 GEMM performance lab](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-fp8-gemm-performance-lab) | P / 5 | gfx950 | [examples/gfx950_low_precision/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_low_precision/src/kernel.rs) | pending |
| [FP4 flash-attention performance lab](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-fp4-attention-performance-lab) | P / 5 | gfx950 | [examples/gfx950_low_precision/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_low_precision/src/kernel.rs) | pending |
| [FP8 flash-attention performance lab](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-fp8-attention-performance-lab) | P / 5 | gfx950 | [examples/gfx950_low_precision/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_low_precision/src/kernel.rs) | pending |
| [KDA decode performance lab](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-kda-decode-performance-lab) | P / 5 | gfx950 | [examples/gfx950_advanced_attention/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_attention/src/kernel.rs) | pending |
| [KDA chunkwise-prefill performance lab](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-kda-prefill-performance-lab) | P / 5 | gfx950 | [examples/gfx950_advanced_attention/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_attention/src/kernel.rs) | pending |
| [Content-sparse attention performance lab](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-content-sparse-performance-lab) | P / 5 | gfx950 | [examples/gfx950_advanced_attention/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_attention/src/kernel.rs) | pending |
| [DeepSeek sparse-attention performance lab](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-deepseek-sparse-performance-lab) | P / 5 | gfx950 | [examples/gfx950_advanced_attention/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_attention/src/kernel.rs) | pending |
| [Compressed hybrid-attention performance lab](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-compressed-hybrid-performance-lab) | P / 5 | gfx950 | [examples/gfx950_advanced_attention/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_attention/src/kernel.rs) | pending |
| [AttnRes aggregation performance lab](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-attnres-performance-lab) | P / 5 | gfx950 | [examples/gfx950_advanced_attention/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_attention/src/kernel.rs) | pending |
| [Four-branch residual performance lab](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-four-branch-residual-performance-lab) | P / 5 | gfx950 | [examples/gfx950_advanced_attention/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_attention/src/kernel.rs) | pending |
| [mHC Sinkhorn-mix performance lab](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-mhc-performance-lab) | P / 5 | gfx950 | [examples/gfx950_advanced_attention/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_attention/src/kernel.rs) | pending |
| [MoE routing performance lab](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-moe-route-performance-lab) | P / 5 | gfx950 | [examples/gfx950_advanced_systems/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_systems/src/kernel.rs) | pending |
| [Mixed FP4/FP8 expert performance lab](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-moe-expert-performance-lab) | P / 5 | gfx950 | [examples/gfx950_advanced_systems/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_systems/src/kernel.rs) | pending |
| [Expert-rank combine performance lab](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-expert-combine-performance-lab) | P / 5 | gfx950 | [examples/gfx950_advanced_systems/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_systems/src/kernel.rs) | pending |
| [Speculative transaction performance lab](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-speculative-performance-lab) | P / 5 | gfx950 | [examples/gfx950_advanced_systems/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_systems/src/kernel.rs) | pending |
| [N-gram gather performance lab](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-ngram-performance-lab) | P / 5 | gfx950 | [examples/gfx950_advanced_systems/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_systems/src/kernel.rs) | pending |
| [Gradient-shard staging performance lab](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-gradient-stage-performance-lab) | P / 5 | gfx950 | [examples/gfx950_advanced_systems/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_systems/src/kernel.rs) | pending |
| [Muon update performance lab](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-muon-performance-lab) | P / 5 | gfx950 | [examples/gfx950_advanced_systems/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_advanced_systems/src/kernel.rs) | pending |
| [GPT-OSS-120B megakernel performance lab](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-gpt-oss-megakernel-performance-lab) | P / 5 | gfx950 | [examples/gfx950_gpt_oss_decode/src/kernel.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_gpt_oss_decode/src/kernel.rs)<br>[examples/gfx950_gpt_oss_decode/src/kernel_components.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_gpt_oss_decode/src/kernel_components.rs)<br>[examples/gfx950_gpt_oss_decode/src/kernel_router_serial.rs](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/examples/gfx950_gpt_oss_decode/src/kernel_router_serial.rs) | pending |


## First Example Prerequisites

There is no supported public source-to-GPU first-run promise at the reviewed
compiler head. A clean newcomer should distinguish these two CPU exercises:

1. **Exact KIR first:** x86-64 Linux, Bash/GNU realpath, Git, rustup, the
   repository's pinned toolchain/components, disk for host-tool builds and a
   C linker. Start with the
   [documented exact-KIR fixture](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/docs/getting-started.md#run-the-exact-kir-fixture),
   whose committed expected result contains four U32 values of 17.
   This does not compile a Rust kernel or prove GPU equivalence.
2. **Ordinary Rust next:** use the separately documented default fill
   [source export](https://github.com/harsh-nod/fe2o3/blob/188f388b5879dabd740c7b4f0c46588d4bb7da3d/docs/getting-started.md#run-from-rust-source).
   Retain checkout, package/default-feature selection, toolchain,
   exporter/backend identity, request and independent expectation. The
   documented default is four F32 values of 42.5 with canary/initialization
   checks, not the U32 fixture or the U32 dispatch theorem.
3. `reference-proof` is a different selection with protected proof/runtime
   prerequisites. Do not silently substitute default fill for it. Missing
   profile, supervisor, proof runtime, unsupported MIR or stale contract is a
   blocker to report, not permission to bypass a gate.
4. HIP/HSA are not runtime fallbacks. CPU simulation needs no GPU/KFD device.
   `doctor` reports availability, not successful export, target/toolchain
   qualification or dispatch.
5. The compiler owner supplied no newly reconciled current-main gfx942/gfx950
   installation/correctness receipt for this audit. These are documented
   exercises, not a fresh clean-install rehearsal. A failed source export
   must not be relabeled as success by substituting hand-authored KIR.

A future hardware first run requires a target-matched supported feature set,
actual device/topology, reviewed compiler/helper/proof-runtime/profile/policy
closure, authenticated source-to-final-artifact joins, owned allocations,
launch/lifetime custody, complete independent output/input/canary checks,
observed completion and cleanup. Freeze source, toolchain, target, artifact,
input, oracle and receipt identities before advertising that row.

## Remaining Release Gaps

- Independently review the four outstanding site corrections and establish a
  coherent compiler/site contract join; no blanket frozen-hash refresh.
- Preserve the `cpu-semantic-simulation` mixed-source association gap and
  historical `gemm-proof-plan` migration gap until correspondence is reviewed.
- Bind genuine structured tile implementations and four mixed lesson
  obligations; ownership indexing or MFMA names alone do not establish them.
- Supply current per-target source/artifact/output receipts for the 50 fixture
  rows and full lesson pairs, negative corpora, formal obligations and cleanup.
  This audit does not run that kernel census.
- Publish reviewed formal receipts with exact domains, and separately qualify
  native lowering, hardware and I/O. Private evidence needs deliberate review
  before publication.
- Keep GPT-OSS layer-tile demonstrations separate from complete Qwen,
  GPT-OSS or DeepSeek execution. Performance and megakernel features stay in
  scope; neither a tutorial tile nor an old benchmark completes them.
- Rehearse the clean environment and first supported source example once its
  actual installation and execution prerequisites have been delivered.

No kernel, source contract, policy, maturity label or evidence pin is changed
by this page. No GPU, compiler, native, proof or model invocation was performed.
