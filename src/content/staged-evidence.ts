import {
  stagedReference,
  type Claim,
  type EvidenceKind,
  type StagedEvidenceAuthority,
  type StagedEvidenceId,
  type StagedEvidenceReference,
} from "./model";
import { deepFreeze, hasOwn, type DeepReadonly } from "./registry";

export interface StagedEvidenceAssertion {
  id: string;
  text: string;
}

export interface StagedEvidenceRecord {
  id: StagedEvidenceId;
  stageLabel: string;
  claimLabel: string;
  claim: EvidenceKind;
  authority: StagedEvidenceAuthority;
  commit: string;
  tree: string;
  commands: readonly string[];
  sourcePaths: readonly string[];
  target: string;
  assertions: readonly StagedEvidenceAssertion[];
}

export const stagedEvidenceOrder = deepFreeze([
  "tiled-source-bridge-v1",
  "tiled-cargo-metadata-v1",
  "tiled-cargo-root-v1",
  "tiled-hardware-harness-v1",
  "tiled-structural-admission-v1",
  "tiled-lds-kernel-ir-v1",
  "tiled-lds-verus-v1",
  "tiled-lds-attributed-source-v1",
  "tiled-lds-machine-inspection-v1",
  "tiled-lds-kphase-model-v2",
  "tiled-lds-hardware-observation-v1",
  "tiled-lds-k32-machine-inspection-v2",
  "tiled-lds-wg64-contract-v1",
] satisfies StagedEvidenceId[]);

const TILED_GEMM_V1_HARDWARE_COMMAND =
  "env FE2O3_RUN_GFX942_TILED_GEMM_V1_HARDWARE=1 FE2O3_GFX942_TILED_GEMM_V1_HSACO=/home/harsh/fe2o3-tiled-gemm-f494.hsaco FE2O3_GFX942_TILED_GEMM_V1_SHA256=681077be1108c57d9d887f94afdd0ec3700ed2c86d73e66d2b229d6b418d0c66 FE2O3_GFX942_TILED_GEMM_V1_KERNEL_SYMBOL=tiled_gemm_v1 FE2O3_LLVM_OBJDUMP=/opt/rocm-7.2.4/lib/llvm/bin/llvm-objdump FE2O3_LLVM_OBJDUMP_SHA256=e5bf27bb6ba178b4de94ac0d5da760b628672cd00d2ffeb40a4372fa6ad25140 cargo test --locked -p fe2o3-hsa-runtime --features hardware-test-hooks --test tiled_gemm_v1_hardware gfx942_tiled_gemm_v1_one_tile_raw_hardware_evidence -- --ignored --exact --nocapture";

const TILED_GEMM_LDS_V1_HARDWARE_COMMAND =
  "env FE2O3_RUN_GFX942_TILED_GEMM_LDS_V1_HARDWARE=1 HSA_XNACK=0 HIP_VISIBLE_DEVICES=0 ROCR_VISIBLE_DEVICES=0 FE2O3_LLC=/absolute/canonical/llc FE2O3_LLC_SHA256=<sha256> FE2O3_LLD=/absolute/canonical/ld.lld FE2O3_LLD_SHA256=<sha256> FE2O3_LLVM_OBJDUMP=/absolute/canonical/llvm-objdump FE2O3_LLVM_OBJDUMP_SHA256=<sha256> cargo test --locked -p fe2o3-hsa-runtime --features hardware-test-hooks --test tiled_gemm_lds_v1_hardware gfx942_tiled_gemm_lds_v1_observational_hardware_evidence -- --ignored --exact --nocapture";

const stagedEvidenceRecords = deepFreeze({
  "tiled-source-bridge-v1": {
    id: "tiled-source-bridge-v1",
    stageLabel: "fb75e19a source bridge",
    claimLabel: "Staged tiled source bridge",
    claim: "compiler-hsaco-observed",
    authority: "source-admission-only",
    commit: "fb75e19a73ec0a9acebb203bd9821190b0592c82",
    tree: "0a57b2b6d14121da92dbbb2d7c4f9d8b4df4ce63",
    commands: ["cargo test -p rustc-codegen-fe2o3 --lib"],
    sourcePaths: [
      "crates/rustc-codegen-fe2o3/src/collected_tiled_gemm_v1.rs",
      "crates/rustc-codegen-fe2o3/src/kernel_ir_lowering.rs",
      "crates/rustc-codegen-fe2o3/tests/fixtures/collected-tiled-gemm-v1/src/lib.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "collected-root",
        text: "Commit fb75e19a73ec0a9acebb203bd9821190b0592c82 admits one exact collected Rust root with signature A:&[u16], B:&[u16], C:&[f32], D:DisjointSlice<f32>.",
      },
      {
        id: "source-profile",
        text: "It binds exact layouts, rustc FnAbi, portable-MIR identity, compiler profile, gfx942:xnack-, COV6, WG64, zero LDS, and the 64-byte explicit plus 256-byte implicit four-slice ABI.",
      },
      {
        id: "canonical-module",
        text: "A private single-use receipt selects the canonical direct-global Kernel IR module with eight BF16 loads, four f32 loads, one BF16 MFMA, and four f32 stores; AMDGCN lowering represents the BF16 carriers with i16 loads.",
      },
      {
        id: "fragment-separation",
        text: "The older WG64 32-byte explicit and 288-byte total fragment probe remains separate.",
      },
      {
        id: "source-authority-boundary",
        text: "This source-to-canonical lowering is reviewed correspondence, not a compiler refinement proof. The Worker V2 handoff remains inert and grants no final-HSACO, publication, loading, or launch authority.",
      },
    ],
  },
  "tiled-cargo-metadata-v1": {
    id: "tiled-cargo-metadata-v1",
    stageLabel: "b904f5b6 Cargo metadata normalization",
    claimLabel: "Staged Cargo metadata normalization",
    claim: "compiler-hsaco-observed",
    authority: "source-admission-only",
    commit: "b904f5b648c7eb249d32d73db427abe72970315a",
    tree: "a5b07af23c9fcf5f04ddcad1c18a6318469e6e06",
    commands: ["cargo test -p rustc-codegen-fe2o3 --lib"],
    sourcePaths: [
      "crates/rustc-codegen-fe2o3/src/collected_tiled_gemm_v1.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "metadata-normalization",
        text: "Commit b904f5b648c7eb249d32d73db427abe72970315a normalizes Cargo-generated metadata only inside the compiler-semantic commitment.",
      },
      {
        id: "wrapper-exact-observation",
        text: "The private receipt carries that normalized compiler-semantic commitment; it does not carry normalized metadata as a separate receipt field. The managed cargo-fe2o3 wrapper separately binds the full ordered rustc argv and exact metadata observations.",
      },
    ],
  },
  "tiled-cargo-root-v1": {
    id: "tiled-cargo-root-v1",
    stageLabel: "51bd129c Cargo root normalization",
    claimLabel: "Staged Cargo root normalization",
    claim: "compiler-hsaco-observed",
    authority: "source-admission-only",
    commit: "51bd129c31b08b636545f12229f34aaa431321f2",
    tree: "8be992dee9f145c73f61bb05f0066656298a7c75",
    commands: ["cargo test -p rustc-codegen-fe2o3 --lib"],
    sourcePaths: [
      "crates/rustc-codegen-fe2o3/src/collected_tiled_gemm_v1.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "root-normalization",
        text: "Commit 51bd129c31b08b636545f12229f34aaa431321f2 normalizes only the Cargo-generated root shape in the compiler semantic commitment.",
      },
      {
        id: "root-authority-binding",
        text: "The full observed root is stored in the private receipt and length-framed into its authority commitment.",
      },
    ],
  },
  "tiled-hardware-harness-v1": {
    id: "tiled-hardware-harness-v1",
    stageLabel: "233b88f9 MI300X tile observation",
    claimLabel: "Observed direct-global tiled GEMM tile",
    claim: "gpu-observed",
    authority: "harness-only",
    commit: "233b88f9722a0072d9a5fe3b9ccdc3dbaefdc1dd",
    tree: "03129e8e3badf707007a128a3d3a98e218b0df36",
    commands: [TILED_GEMM_V1_HARDWARE_COMMAND],
    sourcePaths: [
      "crates/fe2o3-hsa-runtime/tests/tiled_gemm_v1_hardware.rs",
      "docs/tiled-gemm-v1-mi300x-observation.md",
      "docs/receipts/tiled-gemm-v1-mi300x-2026-08-14.txt",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "harness-inputs",
        text: "The ignored, opt-in one-tile gfx942:xnack- harness consumes externally supplied digest-pinned bytes and a digest-pinned observed LLVM 22 objdump.",
      },
      {
        id: "harness-static-gates",
        text: "Before dispatch it enforces COV6/WG64/320-byte metadata, one bound entry, exact disassembly coverage, one retained v_mfma_f32_16x16x16_bf16, a global store, and rejection of forbidden control and memory forms.",
      },
      {
        id: "observed-run",
        text: "At repository commit 6d35aea57b13ac24cdb05147da3b34bc410b16f4 on 2026-08-14, MI300X executed the externally supplied 6,672-byte HSACO with SHA-256 681077be1108c57d9d887f94afdd0ec3700ed2c86d73e66d2b229d6b418d0c66 under the tightened ISA admission policy; the exact test passed 1/1 in 40.92 seconds and its compact console receipt is committed.",
      },
      {
        id: "harness-runtime-checks",
        text: "The run passed a bitwise dyadic 16x16 oracle, confirmed that A/B/C inputs remained bitwise unchanged, preserved adjacent canaries, completed synchronously, retained exact executable identity, and performed terminal unload.",
      },
      {
        id: "harness-authority-boundary",
        text: "Commit 233b88f9722a0072d9a5fe3b9ccdc3dbaefdc1dd records this non-authoritative observation. The supplied artifact has zero LDS and is not source-derived by the recorded run; the harness bypasses production prerequisite authentication, does not authenticate the artifact producer or full objdump runtime, and grants no compiler, publication, protected loading, protected launch, verification, or parity authority.",
      },
    ],
  },
  "tiled-structural-admission-v1": {
    id: "tiled-structural-admission-v1",
    stageLabel: "d43f11c8 structural admission",
    claimLabel: "Staged tiled structural admission",
    claim: "compiler-hsaco-observed",
    authority: "structural-admission-only",
    commit: "d43f11c86196e4f01c9ee305ea8d19f6d8c17672",
    tree: "1396be8ff4947a16ddc6aabae7390cc376992c61",
    commands: [
      "cargo test -p fe2o3-kernel-descriptor --test tiled_gemm_v1",
      "cargo test -p fe2o3-hsaco-finalize --test worker_v2_hsaco_admission",
      "cargo test -p fe2o3-hsaco-finalize --test worker_v2_hsaco_finalization",
    ],
    sourcePaths: [
      "crates/fe2o3-kernel-descriptor/tests/tiled_gemm_v1.rs",
      "crates/fe2o3-hsaco-finalize/tests/worker_v2_hsaco_admission.rs",
      "crates/fe2o3-hsaco-finalize/tests/worker_v2_hsaco_finalization.rs",
      "crates/fe2o3-kernel-descriptor/src/tiled_gemm_v1.rs",
      "crates/fe2o3-hsaco-finalize/src/tiled_gemm_v1_artifact.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "structural-profile",
        text: "Commit d43f11c86196e4f01c9ee305ea8d19f6d8c17672 adds sealed Worker V2 structural inspection and canonical finalization for exactly one gfx942:xnack- COV6 tiled_gemm_v1 descriptor with four slices in 64 explicit bytes, a 256-byte implicit suffix, WG64, wave64, and zero LDS.",
      },
      {
        id: "structural-rejections",
        text: "It separately rejects the WG64/288-byte fragment probe, independent WG256 and 384-byte structural mutations, and descriptor, target, capability, and finalization drift.",
      },
      {
        id: "structural-body-boundary",
        text: "Adversarial tests deliberately admit arbitrary .text, so this gate does not inspect machine-body semantics, authenticate compiler origin, prove BF16 or MFMA semantics, or prove Verus results.",
      },
      {
        id: "structural-authority-boundary",
        text: "It grants no publication, loading, or launch authority; the capability schema remains V1, unknown tag 12 is rejected, and no COMGR path is added.",
      },
    ],
  },
  "tiled-lds-kernel-ir-v1": {
    id: "tiled-lds-kernel-ir-v1",
    stageLabel: "4c79c58d LDS Kernel IR",
    claimLabel: "Bounded LDS Kernel IR",
    claim: "compiler-hsaco-observed",
    authority: "kernel-ir-admission-only",
    commit: "4c79c58de1da19d9b7a22cba906f301e347c8f7c",
    tree: "164414ee43e9df53d02f3d3b53e63c7b7ff36a52",
    commands: [
      "cargo test --locked -p fe2o3-kernel-ir --test tiled_gemm_lds_v1",
    ],
    sourcePaths: [
      "crates/fe2o3-kernel-ir/src/tiled_gemm_lds_v1.rs",
      "crates/fe2o3-kernel-ir/tests/tiled_gemm_lds_v1.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "canonical-lds-graph",
        text: "Commit 4c79c58de1da19d9b7a22cba906f301e347c8f7c seals one fixed 16x16x16 BF16/BF16-to-F32 Kernel IR graph with two separate 256-element XOR4 LDS allocations, cooperative A and transposed-B staging, one acquire-release workgroup barrier, authenticated fragment reads, one zero-accumulator MFMA, and exhaustive ownership of all 256 F32 stores.",
      },
      {
        id: "kernel-ir-negative-space",
        text: "Twelve focused tests cover exact maps and reject profile, operation-order, SSA, LDS alias, extent, alignment, barrier, MFMA, output, identity, launch, and capability mutations while preserving the older zero-LDS profile as a distinct graph.",
      },
      {
        id: "kernel-ir-boundary",
        text: "This is Kernel IR admission only. It establishes neither collection from the attributed Rust source nor lowering correctness, final-artifact identity, protected runtime authority, or GPU execution.",
      },
    ],
  },
  "tiled-lds-verus-v1": {
    id: "tiled-lds-verus-v1",
    stageLabel: "97373b78 LDS Verus model",
    claimLabel: "Fixed LDS source model",
    claim: "source-model-verified",
    authority: "source-model-only",
    commit: "97373b781ac3643b1de61b4572894f7028b565b0",
    tree: "f9b874cf641887a5295d58a2313ed9d7e5cb42cf",
    commands: [
      "env VERUS=/absolute/path/to/pinned/verus cargo test --locked --manifest-path examples/tiled_gemm_v1/Cargo.toml --test lds_proof_verus",
    ],
    sourcePaths: [
      "examples/tiled_gemm_v1/tests/lds_proof_verus.rs",
      "examples/tiled_gemm_v1/run-verus.sh",
      "examples/tiled_gemm_v1/verus/lds_tiled_slice1.rs",
      "examples/tiled_gemm_v1/verus/negative/lds_epoch_wrong.rs",
      "examples/tiled_gemm_v1/verus/negative/lds_product_wrong.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "verified-obligations",
        text: "Commit 97373b781ac3643b1de61b4572894f7028b565b0 adds a pinned-runner Slice 1 model reporting 93 verified and 0 errors for global bounds, XOR4 bounds and injectivity, cooperative-write disjointness, same-epoch LDS initialization, all-lane barrier participation, disjoint C stores, and fixed-tile matrix-product correspondence.",
      },
      {
        id: "expected-rejections",
        text: "A wrong LDS epoch and a wrong product mutation are each rejected at exactly one intended proof obligation.",
      },
      {
        id: "proof-boundary",
        text: "The arithmetic theorem uses an exact-real BF16-to-F32 abstraction. It excludes IEEE rounding, NaNs, signed zero, overflow, compiler refinement, machine-code refinement, runtime behavior, and physical GPU behavior.",
      },
    ],
  },
  "tiled-lds-attributed-source-v1": {
    id: "tiled-lds-attributed-source-v1",
    stageLabel: "ee76cedc attributed Rust source",
    claimLabel: "Fail-closed attributed LDS source",
    claim: "compiler-hsaco-observed",
    authority: "source-shape-only",
    commit: "ee76cedcdc4126c69bc486a5ac12900c1c5485b1",
    tree: "cd0cec133dd5689c71c5d2795e125ea43cff4db3",
    commands: [
      "cargo test --locked --manifest-path examples/tiled_gemm_v1/Cargo.toml --test kernel_source",
    ],
    sourcePaths: [
      "examples/tiled_gemm_v1/src/kernel.rs",
      "examples/tiled_gemm_v1/tests/kernel_source.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "ordinary-attributed-rust",
        text: "Commit ee76cedcdc4126c69bc486a5ac12900c1c5485b1 expresses the fixed Slice 1 algorithm as an ordinary Rust function carrying #[kernel(typed, ...)]. Its body contains the cooperative loads, XOR4 staging, barrier, LDS fragment reads, MFMA, and four disjoint output writes without macro_rules!, raw LDS pointers, or inline assembly.",
      },
      {
        id: "fail-closed-source",
        text: "Six AST and host tests pin the exact WG64 sidecar and generated marker, prohibit a declarative macro body, and confirm that the first unsupported LDS allocation traps before output mutation.",
      },
      {
        id: "source-blockers",
        text: "The source is deliberately non-executable: source-to-LDS-Kernel-IR collection, compiler-issued LDS allocation, authenticated wave-lane construction, and barrier lowering remain open. A later macro-owned record supplies the WG64 launch contract without changing these blockers.",
      },
    ],
  },
  "tiled-lds-machine-inspection-v1": {
    id: "tiled-lds-machine-inspection-v1",
    stageLabel: "50902b6f LLVM/LLD inspection",
    claimLabel: "Upstream LLVM/LLD LDS machine shape",
    claim: "compiler-hsaco-observed",
    authority: "machine-inspection-only",
    commit: "50902b6fc4e861f4b93c40f13fb2e808b2bdc0c2",
    tree: "4bc6c5a4f46a0c7cb86cbd5542ff20f170b3f940",
    commands: [
      "cargo test --locked -p dialect-amdgcn --test tiled_gemm_lds_v1",
      "env FE2O3_LLC=/opt/rocm-7.2.4/lib/llvm/bin/llc FE2O3_LLD=/opt/rocm-7.2.4/lib/llvm/bin/ld.lld FE2O3_LLVM_OBJDUMP=/opt/rocm-7.2.4/lib/llvm/bin/llvm-objdump cargo test --locked -p fe2o3-hsaco-finalize --test tiled_gemm_lds_v1_machine upstream_llvm_lld_final_artifact_has_the_exact_slice_1_machine_shape -- --ignored --exact --nocapture",
    ],
    sourcePaths: [
      "crates/dialect-amdgcn/src/lowering.rs",
      "crates/dialect-amdgcn/tests/tiled_gemm_lds_v1.rs",
      "crates/fe2o3-hsaco-finalize/tests/tiled_gemm_lds_v1_machine.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "llvm-shape",
        text: "Commit 50902b6fc4e861f4b93c40f13fb2e808b2bdc0c2 lowers only the sealed LDS graph to an exact gfx942:xnack- LLVM profile with two distinct aligned LDS globals, eight LDS writes, eight LDS reads, one physical s_barrier, and one BF16 MFMA.",
      },
      {
        id: "final-hsaco-shape",
        text: "A focused mi300x test passed direct upstream llc and ld.lld finalization and inspection: COV6, WG64, wave64, a 1024-byte fixed group segment, zero private segment and spills, expected LDS reads and writes, exactly one s_barrier and MFMA, and no COMGR, atomic, scratch, or machine-call forms.",
      },
      {
        id: "machine-boundary",
        text: "The inspected HSACO is derived from the canonical Kernel IR test path, not collected from the attributed Rust source. This inspection has no protected publisher, load, or launch authority; a later hardware observation remains a separate evidence record.",
      },
    ],
  },
  "tiled-lds-kphase-model-v2": {
    id: "tiled-lds-kphase-model-v2",
    stageLabel: "aba53376 bounded K-phase model",
    claimLabel: "Bounded Slice 2 K-phase model",
    claim: "source-model-verified",
    authority: "source-model-only",
    commit: "aba53376b4825c730ca9e9685e274e0c334e0e32",
    tree: "e05bf2ac73f31f2fda39762520d855031ddf7419",
    commands: [
      "cargo test --locked --manifest-path examples/tiled_gemm_v1/Cargo.toml --test lds_kphase_model",
      "cargo test --locked --manifest-path examples/tiled_gemm_v1/Cargo.toml --test lds_kphase_source",
      "env VERUS=/absolute/path/to/pinned/verus cargo test --locked --manifest-path examples/tiled_gemm_v1/Cargo.toml --test lds_kphase_verus",
    ],
    sourcePaths: [
      "examples/tiled_gemm_v1/tests/lds_kphase_model.rs",
      "examples/tiled_gemm_v1/tests/lds_kphase_source.rs",
      "examples/tiled_gemm_v1/tests/lds_kphase_verus.rs",
      "examples/tiled_gemm_v1/run-verus.sh",
      "examples/tiled_gemm_v1/verus/lds_tiled_kphase.rs",
      "examples/tiled_gemm_v1/verus/negative/lds_kphase_reuse_wrong.rs",
      "examples/tiled_gemm_v1/verus/negative/lds_kphase_accumulator_reset_wrong.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "bounded-kphase-proof",
        text: "Commit aba53376b4825c730ca9e9685e274e0c334e0e32 adds a Slice 2 Verus model for one through four complete 16-wide K phases and reports 196 verified and 0 errors. It covers global bounds and depth partitioning, current-epoch LDS initialization, publish and reuse barrier convergence, no overwrite before prior reads, accumulator preservation, disjoint final C stores, and bounded matrix-product correspondence.",
      },
      {
        id: "models-and-mutations",
        text: "Executable integer event models exhaust the admitted 1-, 2-, and 4-phase cases. Source tests prohibit admit, assume, and external-body shortcuts; a missing LDS reuse epoch and an accumulator reset are each rejected at their intended proof obligation.",
      },
      {
        id: "kphase-boundary",
        text: "This Slice 2 record is proof/model evidence only. Its arithmetic uses finite BF16 values after exact widening and excludes IEEE rounding and exceptional-value semantics. The record grants no attributed multi-phase GPU source, source collection, backend, HSACO, protected runtime, or hardware authority; later backend evidence remains independent.",
      },
    ],
  },
  "tiled-lds-hardware-observation-v1": {
    id: "tiled-lds-hardware-observation-v1",
    stageLabel: "79ad2298 MI300X LDS observation",
    claimLabel: "Observed LDS Slice 1 execution",
    claim: "gpu-observed",
    authority: "harness-only",
    commit: "79ad2298619baa4138b5edbf55e0d8044295bec2",
    tree: "2b7766ec5f003b1316853376a802ada4a9999d9b",
    commands: [TILED_GEMM_LDS_V1_HARDWARE_COMMAND],
    sourcePaths: [
      "crates/fe2o3-hsa-runtime/tests/tiled_gemm_lds_v1_hardware.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "direct-upstream-toolchain",
        text: "Commit 79ad2298619baa4138b5edbf55e0d8044295bec2 adds an ignored opt-in harness that generates Slice 1 HSACO in-process from the canonical Kernel IR using separately SHA-256-pinned upstream LLVM 22 llc, ld.lld, and llvm-objdump tools. COMGR is neither invoked nor admitted.",
      },
      {
        id: "observed-campaign",
        text: "On MI300X gfx942:xnack-, zero, identity, dyadic, deterministic-random, signed-cancellation, and adversarial finite-BF16 cases checked all 1,536 outputs, unchanged A and B values, and prefix and suffix canaries around all three allocations. The exact ignored hardware test passed 1/1 in 33.72 seconds.",
      },
      {
        id: "observational-boundary",
        text: "This is observational IR-derived hardware evidence only. It does not bind the executed Kernel IR to attributed Rust source or Verus proofs and grants no Worker V2, publisher, protected load, or protected launch authority.",
      },
      {
        id: "guard-boundary",
        text: "The canaries and unchanged-value checks detect the mutations they observe; they cannot establish general illegal-memory-access detection, beyond-guard safety, value-preserving-write absence, or race freedom.",
      },
    ],
  },
  "tiled-lds-k32-machine-inspection-v2": {
    id: "tiled-lds-k32-machine-inspection-v2",
    stageLabel: "b94bd7d7 K32 backend inspection",
    claimLabel: "Upstream LLVM/LLD K32 machine shape",
    claim: "compiler-hsaco-observed",
    authority: "machine-inspection-only",
    commit: "b94bd7d78604a6b7fe12f571f84cfc5f5b29eaba",
    tree: "70867ea4d2b360773480ded0a41f68b74722b209",
    commands: [
      "cargo test --locked -p dialect-amdgcn",
      "cargo clippy --locked -p dialect-amdgcn --all-targets --all-features -- -D warnings",
      "env FE2O3_OPT=/opt/rocm-7.2.4/lib/llvm/bin/opt FE2O3_LLC=/opt/rocm-7.2.4/lib/llvm/bin/llc FE2O3_LLD=/opt/rocm-7.2.4/lib/llvm/bin/ld.lld FE2O3_LLVM_OBJDUMP=/opt/rocm-7.2.4/lib/llvm/bin/llvm-objdump FE2O3_LLVM_READOBJ=/opt/rocm-7.2.4/lib/llvm/bin/llvm-readobj cargo test --locked -p dialect-amdgcn --test tiled_gemm_lds_k32_v2 upstream_llvm_lld_final_artifact_has_the_exact_k32_machine_shape -- --ignored --exact --nocapture",
    ],
    sourcePaths: [
      "crates/dialect-amdgcn/src/lowering.rs",
      "crates/dialect-amdgcn/tests/tiled_gemm_lds_k32_v2.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "ssa-two-phase-lowering",
        text: "Commit b94bd7d78604a6b7fe12f571f84cfc5f5b29eaba lowers only the canonical K32 Slice 2 graph to a real two-trip SSA loop. It carries FP32 accumulators across both K16 phases, reuses the same two LDS tiles, retains two physical workgroup barriers, and emits one static loop-body BF16 MFMA.",
      },
      {
        id: "final-k32-machine-shape",
        text: "The focused upstream LLVM 22 opt, llc, ld.lld, llvm-readobj, and llvm-objdump final-artifact test passed. It observed COV6 gfx942:xnack-, WG64/wave64, a reused 1024-byte fixed LDS segment, zero private segment and spills, LDS reads and writes, exactly two s_barrier instructions, exactly one BF16 MFMA, and no COMGR, scratch, atomic, or machine-call forms.",
      },
      {
        id: "dialect-campaign",
        text: "The full dialect-amdgcn test campaign passed 120 tests, and strict all-targets, all-features Clippy passed with warnings denied.",
      },
      {
        id: "k32-machine-boundary",
        text: "This is backend and machine-shape evidence only. It establishes no attributed multi-phase Rust source or source collection, runtime hardware execution, protected publisher/load/launch authority, or LLVM refinement proof.",
      },
    ],
  },
  "tiled-lds-wg64-contract-v1": {
    id: "tiled-lds-wg64-contract-v1",
    stageLabel: "28099576 macro-owned WG64 contract",
    claimLabel: "Generated typed WG64 launch contract",
    claim: "compiler-hsaco-observed",
    authority: "source-admission-only",
    commit: "280995762fce8a97f72fc2acb53c0d7effd2109f",
    tree: "782bcc60e1c5e12c32c0dabfd0975304a020d0bf",
    commands: [
      "cargo test --locked -p fe2o3-macros",
      "cargo test --locked --manifest-path examples/tiled_gemm_v1/Cargo.toml --test kernel_source",
      "cargo test --locked -p rustc-codegen-fe2o3 --test collected_executable_scalar_control_flow_v2",
    ],
    sourcePaths: [
      "crates/fe2o3-macros/src/lib.rs",
      "crates/rustc-codegen-fe2o3/src/collector.rs",
      "crates/rustc-codegen-fe2o3/src/collected_tiled_gemm_v1.rs",
      "crates/rustc-codegen-fe2o3/tests/collected_executable_scalar_control_flow_v2.rs",
      "crates/rustc-codegen-fe2o3/tests/fixtures/collected-tiled-gemm-v1/src/lib.rs",
      "examples/tiled_gemm_v1/src/kernel.rs",
      "examples/tiled_gemm_v1/tests/kernel_source.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "macro-owned-contract",
        text: "Commit 280995762fce8a97f72fc2acb53c0d7effd2109f lets an ordinary general typed #[kernel] declare exact WG64 launch dimensions. The macro generates the frontend contract bytes and binds the generated host-contract identity and renamed body; tiled Slice 1 no longer carries a handwritten frontend sidecar.",
      },
      {
        id: "compatibility-and-rejection",
        text: "General typed kernels preserve required-only exact WG64 and WG256 compatibility. Existing fixed vecadd, alpha/zeta, and scalar-GEMM profiles remain WG256 and reject WG64 rather than falling back to the general profile.",
      },
      {
        id: "wg64-contract-boundary",
        text: "This closes the macro-owned #[kernel] WG64 launch-contract integration gap only. Source-to-LDS Kernel IR collection and compiler-issued LDS acquisition remain open, so the attributed source still fails closed and gains no backend, hardware-execution, or protected authority from this record.",
      },
    ],
  },
} satisfies Record<StagedEvidenceId, StagedEvidenceRecord>);

export function isStagedEvidenceId(value: unknown): value is StagedEvidenceId {
  return (
    typeof value === "string" &&
    hasOwn(stagedEvidenceRecords, value)
  );
}

export function resolveStagedEvidenceRecord(
  value: unknown,
): DeepReadonly<StagedEvidenceRecord> | undefined {
  return isStagedEvidenceId(value) ? stagedEvidenceRecords[value] : undefined;
}

export function stagedEvidenceRecord(
  id: StagedEvidenceId,
): DeepReadonly<StagedEvidenceRecord> {
  const record = resolveStagedEvidenceRecord(id);
  if (!record) throw new Error("Canonical staged evidence registry failure");
  return record;
}

export function stagedEvidenceDetail(
  ids: readonly StagedEvidenceId[],
): string {
  return ids
    .flatMap((id) => stagedEvidenceRecord(id).assertions)
    .map((assertion) => assertion.text)
    .join(" ");
}

export function stagedEvidenceRows(
  ids: readonly StagedEvidenceId[],
): string[][] {
  return ids.map((id) => {
    const record = stagedEvidenceRecord(id);
    return [record.stageLabel, stagedEvidenceDetail([id]), record.authority];
  });
}

export function stagedEvidenceReference(
  id: StagedEvidenceId,
): StagedEvidenceReference {
  const record = stagedEvidenceRecord(id);
  return stagedReference({
    evidenceId: id,
    claim: record.claim,
    authority: record.authority,
    commit: record.commit,
    tree: record.tree,
    commands: [...record.commands],
    sourcePaths: [...record.sourcePaths],
    target: record.target,
  });
}

export function stagedEvidenceClaim(id: StagedEvidenceId): Claim {
  const record = stagedEvidenceRecord(id);
  return {
    kind: record.claim,
    label: record.claimLabel,
    detail: stagedEvidenceDetail([id]),
    reference: stagedEvidenceReference(id),
  };
}

export type ParsedCargoTestCommand =
  | {
      environment: Readonly<Record<string, string>>;
      locked: boolean;
      packageName?: string;
      manifestPath?: string;
      mode: "package";
    }
  | {
      environment: Readonly<Record<string, string>>;
      locked: boolean;
      packageName?: string;
      manifestPath?: string;
      mode: "lib";
    }
  | {
      environment: Readonly<Record<string, string>>;
      locked: boolean;
      packageName?: string;
      manifestPath?: string;
      mode: "test";
      targetName: string;
      testName?: string;
      features?: string;
    };

export function parseExactCargoTestCommand(
  command: string,
): ParsedCargoTestCommand | undefined {
  const tokens = command.trim().split(/\s+/u);
  const environment: Record<string, string> = {};
  let cursor = 0;
  if (tokens[cursor] === "env") {
    cursor += 1;
    while (/^[A-Z][A-Z0-9_]*=\S+$/u.test(tokens[cursor] ?? "")) {
      const assignment = tokens[cursor];
      const separator = assignment.indexOf("=");
      const name = assignment.slice(0, separator);
      if (hasOwn(environment, name)) return undefined;
      environment[name] = assignment.slice(separator + 1);
      cursor += 1;
    }
    if (Object.keys(environment).length === 0) return undefined;
  }
  if (
    tokens[cursor] !== "cargo" ||
    tokens[cursor + 1] !== "test"
  ) {
    return undefined;
  }
  cursor += 2;
  const locked = tokens[cursor] === "--locked";
  if (locked) cursor += 1;
  let packageName: string | undefined;
  let manifestPath: string | undefined;
  if (tokens[cursor] === "-p") {
    if (!/^[a-z0-9][a-z0-9-]*$/u.test(tokens[cursor + 1] ?? "")) {
      return undefined;
    }
    packageName = tokens[cursor + 1];
  } else if (tokens[cursor] === "--manifest-path") {
    if (!/^[A-Za-z0-9_./-]+\/Cargo\.toml$/u.test(tokens[cursor + 1] ?? "")) {
      return undefined;
    }
    manifestPath = tokens[cursor + 1];
  } else {
    return undefined;
  }
  const argumentsAfterPackage = tokens.slice(cursor + 2);
  if (argumentsAfterPackage.length === 0) {
    return {
      environment,
      locked,
      packageName,
      manifestPath,
      mode: "package",
    };
  }
  if (
    argumentsAfterPackage.length === 1 &&
    argumentsAfterPackage[0] === "--lib"
  ) {
    return {
      environment,
      locked,
      packageName,
      manifestPath,
      mode: "lib",
    };
  }
  if (
    argumentsAfterPackage.length === 2 &&
    argumentsAfterPackage[0] === "--test" &&
    /^[A-Za-z0-9_]+$/u.test(argumentsAfterPackage[1] ?? "")
  ) {
    return {
      environment,
      locked,
      packageName,
      manifestPath,
      mode: "test",
      targetName: argumentsAfterPackage[1],
    };
  }
  let argumentCursor = 0;
  let features: string | undefined;
  if (argumentsAfterPackage[argumentCursor] === "--features") {
    const value = argumentsAfterPackage[argumentCursor + 1];
    if (!/^[a-z0-9][a-z0-9-]*$/u.test(value ?? "")) return undefined;
    features = value;
    argumentCursor += 2;
  }
  if (
    argumentsAfterPackage[argumentCursor] === "--test" &&
    /^[A-Za-z0-9_]+$/u.test(argumentsAfterPackage[argumentCursor + 1] ?? "") &&
    /^[A-Za-z0-9_]+$/u.test(argumentsAfterPackage[argumentCursor + 2] ?? "") &&
    argumentsAfterPackage[argumentCursor + 3] === "--" &&
    argumentsAfterPackage[argumentCursor + 4] === "--ignored" &&
    argumentsAfterPackage[argumentCursor + 5] === "--exact" &&
    argumentsAfterPackage[argumentCursor + 6] === "--nocapture" &&
    argumentsAfterPackage.length === argumentCursor + 7
  ) {
    return {
      environment,
      locked,
      packageName,
      manifestPath,
      mode: "test",
      targetName: argumentsAfterPackage[argumentCursor + 1],
      testName: argumentsAfterPackage[argumentCursor + 2],
      features,
    };
  }
  return undefined;
}

export function expectedCargoTestSourcePath(
  parsed: ParsedCargoTestCommand,
): string | undefined {
  if (parsed.mode === "lib" || parsed.mode === "package") return undefined;
  if (parsed.manifestPath) {
    const directory = parsed.manifestPath.slice(0, -"Cargo.toml".length);
    return `${directory}tests/${parsed.targetName}.rs`;
  }
  return parsed.packageName
    ? `crates/${parsed.packageName}/tests/${parsed.targetName}.rs`
    : undefined;
}

export function isExactCargoClippyCommand(command: string): boolean {
  return /^cargo clippy --locked -p [a-z0-9][a-z0-9-]* --all-targets --all-features -- -D warnings$/u.test(
    command,
  );
}

export function validateStagedEvidenceCatalog(): string[] {
  const issues: string[] = [];
  const assertionIds = new Set<string>();
  for (const id of stagedEvidenceOrder) {
    const record = stagedEvidenceRecord(id);
    if (record.id !== id) issues.push(`${id}: record id mismatch`);
    if (
      id === "tiled-hardware-harness-v1" &&
      (record.commands.length !== 1 ||
        record.commands[0] !== TILED_GEMM_V1_HARDWARE_COMMAND)
    ) {
      issues.push(`${id}: hardware replay command differs from the observed command`);
    }
    if (
      id === "tiled-lds-hardware-observation-v1" &&
      (record.commands.length !== 1 ||
        record.commands[0] !== TILED_GEMM_LDS_V1_HARDWARE_COMMAND)
    ) {
      issues.push(`${id}: LDS hardware command differs from the documented command`);
    }
    for (const command of record.commands) {
      const parsed = parseExactCargoTestCommand(command);
      if (!parsed && !isExactCargoClippyCommand(command)) {
        issues.push(`${id}: command is not a supported exact Cargo evidence command: ${command}`);
        continue;
      }
      if (!parsed) continue;
      const expectedPath = expectedCargoTestSourcePath(parsed);
      if (expectedPath && !record.sourcePaths.includes(expectedPath)) {
        issues.push(`${id}: test target source is not referenced: ${expectedPath}`);
      }
    }
    for (const assertion of record.assertions) {
      const qualifiedId = `${id}/${assertion.id}`;
      if (assertionIds.has(qualifiedId)) {
        issues.push(`${id}: duplicate assertion id ${assertion.id}`);
      }
      assertionIds.add(qualifiedId);
      if (assertion.text.trim().length === 0) {
        issues.push(`${id}: empty assertion ${assertion.id}`);
      }
    }
  }
  return issues;
}
