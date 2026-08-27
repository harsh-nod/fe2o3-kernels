import {
  stagedReference,
  type Claim,
  type CompletedIssue94IncrementId,
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

export interface CompletedIssue94IncrementRecord {
  id: CompletedIssue94IncrementId;
  stageLabel: string;
  authority:
    | "finalization-mechanics-only"
    | "host-preparation-only"
    | "bounded-protected-hardware-observation-only";
  commit: string;
  tree: string;
  commands: readonly string[];
  sourcePaths: readonly string[];
  target: string;
  assertions: readonly StagedEvidenceAssertion[];
}

export const RETIRED_EXACT_ROUTE_NOTICE =
  "Historical archive only: commands and source paths are reproduced at the record's exact commit. The workload-specific selectors, exact-profile finalizers, generated workload host adapters, Worker V2 ownership APIs, and workload-specific HSA tests were later removed from the unified production tree; they are not current replay commands or alternate production authority.";

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
  "tiled-lds-grid-stride-model-v3",
  "tiled-lds-source-ir-correspondence-v1",
  "tiled-lds-grid-machine-inspection-v3",
  "tiled-lds-edge-kernel-ir-v4",
  "tiled-lds-edge-machine-inspection-v4",
  "tiled-lds-source-model-correspondence-v1",
  "tiled-lds-matrix-wire-v5",
  "tiled-lds-inert-worker-handoff-v1",
  "tiled-lds-sealed-profile-registry-v1",
] satisfies StagedEvidenceId[]);

const TILED_GEMM_V1_HARDWARE_COMMAND =
  "env FE2O3_RUN_GFX942_TILED_GEMM_V1_HARDWARE=1 FE2O3_GFX942_TILED_GEMM_V1_HSACO=/home/harsh/fe2o3-tiled-gemm-f494.hsaco FE2O3_GFX942_TILED_GEMM_V1_SHA256=681077be1108c57d9d887f94afdd0ec3700ed2c86d73e66d2b229d6b418d0c66 FE2O3_GFX942_TILED_GEMM_V1_KERNEL_SYMBOL=tiled_gemm_v1 FE2O3_LLVM_OBJDUMP=/opt/rocm-7.2.4/lib/llvm/bin/llvm-objdump FE2O3_LLVM_OBJDUMP_SHA256=e5bf27bb6ba178b4de94ac0d5da760b628672cd00d2ffeb40a4372fa6ad25140 cargo test --locked -p fe2o3-hsa-runtime --features hardware-test-hooks --test tiled_gemm_v1_hardware gfx942_tiled_gemm_v1_one_tile_raw_hardware_evidence -- --ignored --exact --nocapture";

const TILED_GEMM_LDS_V1_HARDWARE_COMMAND =
  "env FE2O3_RUN_GFX942_TILED_GEMM_LDS_V1_HARDWARE=1 HSA_XNACK=0 HIP_VISIBLE_DEVICES=0 ROCR_VISIBLE_DEVICES=0 FE2O3_LLC=/absolute/canonical/llc FE2O3_LLC_SHA256=<sha256> FE2O3_LLD=/absolute/canonical/ld.lld FE2O3_LLD_SHA256=<sha256> FE2O3_LLVM_OBJDUMP=/absolute/canonical/llvm-objdump FE2O3_LLVM_OBJDUMP_SHA256=<sha256> cargo test --locked -p fe2o3-hsa-runtime --features hardware-test-hooks --test tiled_gemm_lds_v1_hardware gfx942_tiled_gemm_lds_v1_observational_hardware_evidence -- --ignored --exact --nocapture";

export const protectedSlice1HardwareObservation = deepFreeze({
  commit: "c4fcb4d980cf979c0527dfa135a7b9f4fe72a811",
  tree: "c65c6ab567409afaaef6ea39c8befcac21d47119",
  target: "gfx942:xnack-",
  hsaXnack: 0,
  workerId:
    "fe2o3-worker-v1-sha256-6c3dfd5f784b3babe140006aba57a214a897b171860928440184fa201b6f96db",
  llvmBuild:
    "upstream-llvmorg-22.1.8-ca7933e47d3a3451d81e72ac174dcb5aa28b59d1",
  marker:
    "FE2O3_PROTECTED_SLICE1_WORKER_V2_OK outputs=256 max_abs_error=0 finalizer=078e9b523164b679ff7af3b4e819ad041713c53c6841399ac7cea95090f09774 unload=df2f77ee798444a9e1fe5e27f219bdf720386eb8603a9a74fccc0df8efb3921c",
  outputs: 256,
  maxAbsError: 0,
  passed: 1,
  total: 1,
  durationSeconds: 14.36,
});

const PROTECTED_SLICE1_WORKER_V2_HARDWARE_COMMAND =
  "env FE2O3_RUN_GFX942_TILED_GEMM_LDS_SLICE1_WORKER_V2_HARDWARE=1 HSA_XNACK=0 HIP_VISIBLE_DEVICES=0 ROCR_VISIBLE_DEVICES=0 FE2O3_LDS_GEMM_V1_WORKER=/absolute/measured/fe2o3-llvm-link-worker FE2O3_LDS_GEMM_V1_WORKER_BUILD_ID=fe2o3-worker-v1-sha256-6c3dfd5f784b3babe140006aba57a214a897b171860928440184fa201b6f96db FE2O3_LDS_GEMM_V1_LLVM_BUILD_ID=upstream-llvmorg-22.1.8-ca7933e47d3a3451d81e72ac174dcb5aa28b59d1 cargo test --locked -p fe2o3-hsa-runtime --features hardware-test-hooks --test tiled_gemm_lds_slice1_worker_v2_hardware gfx942_tiled_gemm_lds_slice1_worker_v2_protected_hardware -- --ignored --exact --nocapture";

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
        text: "At commit ee76cedcdc4126c69bc486a5ac12900c1c5485b1 the source is deliberately non-executable: source-to-LDS-Kernel-IR collection, compiler-issued LDS allocation, authenticated wave-lane construction, and barrier lowering are still open. Later records first add the macro-owned WG64 contract and then authenticate the exact source to canonical IR; this record grants neither result retroactively.",
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
        text: "At commit 280995762fce8a97f72fc2acb53c0d7effd2109f this closes only the macro-owned #[kernel] WG64 launch-contract gap; source-to-LDS Kernel IR collection and compiler-issued LDS acquisition are still open. The later dc31f23eb source-correspondence record closes those bounded source/IR gaps without granting this record backend, hardware-execution, or protected authority.",
      },
    ],
  },
  "tiled-lds-grid-stride-model-v3": {
    id: "tiled-lds-grid-stride-model-v3",
    stageLabel: "5bc57587 Slice 3 grid/stride model",
    claimLabel: "Bounded Slice 3 grid and stride model",
    claim: "source-model-verified",
    authority: "source-model-only",
    commit: "5bc57587b458da6a77a0f1063e4697f846cc0946",
    tree: "165566f92afaf03eed7cea8ae2b927aca53e618c",
    commands: [
      "cargo test --locked --manifest-path examples/tiled_gemm_v1/Cargo.toml --test lds_grid_model",
      "cargo test --locked --manifest-path examples/tiled_gemm_v1/Cargo.toml --test lds_grid_source",
      "env VERUS=/absolute/path/to/pinned/verus cargo test --locked --manifest-path examples/tiled_gemm_v1/Cargo.toml --test lds_grid_verus",
    ],
    sourcePaths: [
      "examples/tiled_gemm_v1/run-verus.sh",
      "examples/tiled_gemm_v1/tests/lds_grid_model.rs",
      "examples/tiled_gemm_v1/tests/lds_grid_source.rs",
      "examples/tiled_gemm_v1/tests/lds_grid_verus.rs",
      "examples/tiled_gemm_v1/verus/lds_tiled_grid_stride.rs",
      "examples/tiled_gemm_v1/verus/negative/lds_grid_tile_mapping_wrong.rs",
      "examples/tiled_gemm_v1/verus/negative/lds_grid_stride_wrong.rs",
      "examples/tiled_gemm_v1/verus/negative/lds_grid_c_ownership_wrong.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "grid-stride-proof",
        text: "Commit 5bc57587b458da6a77a0f1063e4697f846cc0946 adds a fixed-K16 Slice 3 Verus model for positive tile-aligned M and N. It reports 101 verified and 0 errors and proves checked padded lda/ldb/ldc bounds, exact and injective workgroup-to-tile mapping, four bounded stores per lane, and global disjointness of C ownership.",
      },
      {
        id: "runner-and-mutations",
        text: "The authenticated runner now checks positive summaries of 73, 93, 196, and 101 verified obligations and requires 12 expected negative rejections. Slice 3 rejects collapsed tile mapping, undersized lda, and dropped group-x C ownership at their named proof obligations.",
      },
      {
        id: "executable-grid-model",
        text: "Ordinary executable models exhaust tile grids from 1x1 through 3x3 with representative padding combinations and also exercise a 64x48 problem with padded lda=33, ldb=79, and ldc=96.",
      },
      {
        id: "grid-stride-boundary",
        text: "Slice 3 is source-model evidence only. It grants no attributed kernel-source correspondence, backend or HSACO result, runtime hardware execution, numerical-contract proof, compiler or machine refinement, or protected authority.",
      },
    ],
  },
  "tiled-lds-source-ir-correspondence-v1": {
    id: "tiled-lds-source-ir-correspondence-v1",
    stageLabel: "dc31f23e attributed source to IR",
    claimLabel: "Authenticated attributed LDS source correspondence",
    claim: "compiler-hsaco-observed",
    authority: "source-admission-only",
    commit: "dc31f23eb2decaa91eb2f9d72ae4c70e94766564",
    tree: "092103d6daa2d8ebcd513627b7be9a3b182bfa60",
    commands: [
      "cargo test --locked --manifest-path examples/tiled_gemm_v1/Cargo.toml --test kernel_source",
      "cargo test --locked -p rustc-codegen-fe2o3 --test collected_executable_scalar_control_flow_v2",
    ],
    sourcePaths: [
      "examples/tiled_gemm_v1/src/kernel.rs",
      "examples/tiled_gemm_v1/tests/kernel_source.rs",
      "crates/rustc-codegen-fe2o3/src/collected_tiled_gemm_lds_slice1_v1.rs",
      "crates/rustc-codegen-fe2o3/tests/collected_executable_scalar_control_flow_v2.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "canonical-attributed-source",
        text: "Commit dc31f23eb2decaa91eb2f9d72ae4c70e94766564 makes ordinary #[kernel(typed, ...)] Rust the canonical Slice 1 user form. The body contains checked global indexing, compiler-issued separate BF16 LDS tiles, cooperative XOR4 staging, a uniform barrier, LDS fragment reads, one BF16 MFMA, and four disjoint C writes; it contains no macro_rules! body, raw LDS pointer, inline assembly, or helper-function lookalike.",
      },
      {
        id: "reviewed-source-ir-correspondence",
        text: "The exact attributed root, reachable portable MIR, trusted device-item identities, FnAbi, gfx942:xnack- target, WG64 launch contract, and compiler-derived two-allocation 1,024-byte LDS profile select only the verified canonical fe2o3::tiled_gemm_lds_v1 Kernel IR. Removed-barrier, A-index-drift, and same-spelling helper mutations fail before canonical IR selection.",
      },
      {
        id: "source-ir-boundary",
        text: "This is bounded reviewed source-to-IR correspondence, not a source-to-machine or compiler-refinement proof. At this checkpoint the receipt deliberately stops before descriptor construction and Worker V2, and fe2o3 issue #85 was still open. This record grants no LLVM, final-HSACO, publication, loading, launch, hardware-execution, or production authority; the later 7337a2b87 handoff record advances only the inert compiler-module boundary.",
      },
    ],
  },
  "tiled-lds-grid-machine-inspection-v3": {
    id: "tiled-lds-grid-machine-inspection-v3",
    stageLabel: "f38fe82c Slice 3 LLVM/COV6 inspection",
    claimLabel: "Exact Slice 3 upstream LLVM/LLD machine shape",
    claim: "compiler-hsaco-observed",
    authority: "machine-inspection-only",
    commit: "f38fe82ca574eff0eb273d5a793f04b0df3e00e1",
    tree: "0375b991b20dcdb934797b039120f4ac279ee8cd",
    commands: [
      "cargo test --locked -p dialect-amdgcn --test tiled_gemm_lds_grid_v1",
      "cargo clippy --locked -p dialect-amdgcn --all-targets --all-features -- -D warnings",
      "env FE2O3_OPT=/opt/rocm/llvm/bin/opt FE2O3_LLC=/opt/rocm/llvm/bin/llc FE2O3_LLD=/opt/rocm/llvm/bin/ld.lld FE2O3_LLVM_OBJDUMP=/opt/rocm/llvm/bin/llvm-objdump FE2O3_LLVM_READOBJ=/opt/rocm/llvm/bin/llvm-readobj cargo test --locked -p dialect-amdgcn --test tiled_gemm_lds_grid_v1 upstream_llvm_lld_final_artifact_has_the_exact_grid_machine_shape -- --ignored --exact --nocapture",
    ],
    sourcePaths: [
      "crates/dialect-amdgcn/src/lowering.rs",
      "crates/dialect-amdgcn/tests/tiled_gemm_lds_grid_v1.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "exact-grid-lowering",
        text: "Commit f38fe82ca574eff0eb273d5a793f04b0df3e00e1 lowers only the exact Slice 3 M=64, N=48, K=16, lda=33, ldb=79, ldc=96, 3x4-grid, WG64/wave64, 1,024-byte-LDS graph. It derives workgroup X/Y from upstream LLVM intrinsics and rejects profile, group, stride, resource, layout, MFMA, store, barrier, extra-function, and generic-lowering drift.",
      },
      {
        id: "grid-final-machine-shape",
        text: "The ignored upstream LLVM 22 opt, llc, ld.lld, llvm-objdump, and llvm-readobj inspection passed on mi300x. The final object is gfx942:xnack- COV6 with WG64, workgroup X/Y use, 1,024 bytes of LDS, LDS traffic, one barrier, one BF16 MFMA, and zero spills, scratch, calls, atomics, or COMGR.",
      },
      {
        id: "grid-machine-boundary",
        text: "This is exact Kernel-IR-to-machine-shape inspection only. It is not the attributed Slice 1 source path, an LLVM refinement proof, protected publication or execution, or a hardware numerical result; protected Slice 3 Worker V2 execution remains open in fe2o3 issue #88.",
      },
    ],
  },
  "tiled-lds-edge-kernel-ir-v4": {
    id: "tiled-lds-edge-kernel-ir-v4",
    stageLabel: "f2406353 Slice 4 edge Kernel IR",
    claimLabel: "Exact tail-safe Slice 4 Kernel IR",
    claim: "compiler-hsaco-observed",
    authority: "kernel-ir-admission-only",
    commit: "f24063534fd9c69d8c595608c75213db0570aa5e",
    tree: "8fd840624c50c25c74beb3371625a53a51956831",
    commands: [
      "cargo test --locked -p fe2o3-kernel-ir --test tiled_gemm_lds_edges_v1",
    ],
    sourcePaths: [
      "crates/fe2o3-kernel-ir/src/tiled_gemm_lds_edges_v1.rs",
      "crates/fe2o3-kernel-ir/tests/tiled_gemm_lds_edges_v1.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "exact-edge-graph",
        text: "Commit f24063534fd9c69d8c595608c75213db0570aa5e seals one exact Slice 4 M=17, N=19, K=18 graph: a 2x2 WG64/wave64 grid, two reusable aligned 512-byte XOR4 LDS tiles, two K16 phases with BF16 zero-fill tails, carried FP32 accumulators, alpha=2.0, beta=-1.0, predicated C reads and writes, and unconditional publish and reuse barriers.",
      },
      {
        id: "edge-negative-space",
        text: "Nine tests exhaustively classify valid and tail A/B/C coordinates, physical LDS ownership, and all-lane barrier participation. They reject conditional barrier bypass, removed barriers, unguarded tail or C access, phase, tail, accumulator, coefficient, ownership, target, resource, and layout drift.",
      },
      {
        id: "edge-ir-boundary",
        text: "At commit f24063534fd9c69d8c595608c75213db0570aa5e this is exact Kernel IR admission only and makes no attributed-source, lowering, final-HSACO, runtime, hardware, IEEE-754, numerical-refinement, or protected-authority claim. The later 35575cc32 machine-inspection record closes the bounded lowering gap independently; protected execution remains open in #89.",
      },
    ],
  },
  "tiled-lds-edge-machine-inspection-v4": {
    id: "tiled-lds-edge-machine-inspection-v4",
    stageLabel: "35575cc3 Slice 4 LLVM/COV6 inspection",
    claimLabel: "Exact Slice 4 upstream LLVM/LLD machine shape",
    claim: "compiler-hsaco-observed",
    authority: "machine-inspection-only",
    commit: "35575cc32cde9744078a3026b14c5e0e0066157f",
    tree: "f7f43e9d92f98144daf5f003734fc2d9b77130d9",
    commands: [
      "cargo test --locked -p dialect-amdgcn --test tiled_gemm_lds_edges_v1",
      "cargo test --locked -p dialect-amdgcn",
      "cargo clippy --locked -p dialect-amdgcn --all-targets --all-features -- -D warnings",
      "cargo test --locked -p fe2o3-kernel-ir",
      "env FE2O3_OPT=/opt/rocm/llvm/bin/opt FE2O3_LLC=/opt/rocm/llvm/bin/llc FE2O3_LLD=/opt/rocm/llvm/bin/ld.lld FE2O3_LLVM_OBJDUMP=/opt/rocm/llvm/bin/llvm-objdump FE2O3_LLVM_READOBJ=/opt/rocm/llvm/bin/llvm-readobj cargo test --locked -p dialect-amdgcn --test tiled_gemm_lds_edges_v1 upstream_llvm_lld_final_artifact_has_the_exact_edge_machine_shape -- --ignored --exact --nocapture",
    ],
    sourcePaths: [
      "crates/dialect-amdgcn/src/lowering.rs",
      "crates/dialect-amdgcn/tests/tiled_gemm_lds_edges_v1.rs",
      "crates/fe2o3-kernel-ir/src/tiled_gemm_lds_edges_v1.rs",
      "crates/fe2o3-kernel-ir/tests/tiled_gemm_lds_edges_v1.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "exact-edge-lowering",
        text: "Commit 35575cc32cde9744078a3026b14c5e0e0066157f lowers only the exact Slice 4 M=17, N=19, K=18, alpha=2.0, beta=-1.0, 2x2-grid, WG64/wave64 graph. The LLVM preserves two predicated K16 phases, BF16 zero-fill tails, carried FP32 accumulators, predicated C reads and writes, two reusable aligned 512-byte XOR4 LDS tiles, and unconditional publish/reuse barriers while rejecting profile, predicate, phase, epilogue, launch, resource, layout, MFMA, ownership, call, and generic-lowering drift.",
      },
      {
        id: "edge-final-machine-shape",
        text: "The exact ignored upstream LLVM 22 opt, llc, ld.lld, llvm-objdump, and llvm-readobj test passed on clean current-main mi300x. It observed gfx942:xnack- COV6, WG64/wave64, a 1,024-byte fixed LDS segment, zero private segment and spills, LDS traffic, exactly two static barriers, one static loop-body BF16 MFMA, and no scratch, calls, atomics, or COMGR.",
      },
      {
        id: "edge-validation-campaign",
        text: "Clean current-main validation passed the focused edge suite with 5 active tests and 1 intentional LLVM-tool ignore, the exact ignored COV6 machine test, all 129 active dialect tests with 23 intentional ignores, strict all-targets/all-features Clippy, and all 362 active Kernel IR tests with 1 intentional ignore.",
      },
      {
        id: "edge-machine-boundary",
        text: "This closes fe2o3 issue #86 for the exact IR-to-upstream-LLVM/COV6 machine-shape boundary only. It is not attributed-source lowering, compiler refinement, protected Worker V2 publication or execution, or a hardware numerical result. Source joining remains open in #85, refinement and GPU memory safety in #87, protected Slice 4 MI300X execution in #89, and generalization in #90.",
      },
    ],
  },
  "tiled-lds-source-model-correspondence-v1": {
    id: "tiled-lds-source-model-correspondence-v1",
    stageLabel: "5a45239a bounded source/model proof",
    claimLabel: "Identity-bound Slice 1 source/model correspondence",
    claim: "source-model-verified",
    authority: "source-model-only",
    commit: "5a45239aeeda3ca64cf16beb7fb1d3589e649bfe",
    tree: "1b8e2d3589082114a0bafe231d79262e6f8b22a1",
    commands: [
      "cargo test --locked --manifest-path examples/tiled_gemm_v1/Cargo.toml --test lds_source_refinement",
      "env VERUS=/home/harsh/tools/verus-0.2026.08.02/verus cargo test --locked --manifest-path examples/tiled_gemm_v1/Cargo.toml",
      "env VERUS=/home/harsh/tools/verus-0.2026.08.02/verus cargo test --locked --manifest-path examples/tiled_gemm_v1/Cargo.toml --release",
      "cargo clippy --locked --manifest-path examples/tiled_gemm_v1/Cargo.toml --all-targets --all-features -- -D warnings",
    ],
    sourcePaths: [
      "examples/tiled_gemm_v1/run-verus.sh",
      "examples/tiled_gemm_v1/tests/lds_proof_verus.rs",
      "examples/tiled_gemm_v1/tests/lds_source_refinement.rs",
      "examples/tiled_gemm_v1/verus/lds_tiled_slice1_source_refinement.rs",
      "examples/tiled_gemm_v1/verus/negative/lds_source_length_wrong.rs",
      "examples/tiled_gemm_v1/verus/negative/lds_source_publish_barrier_wrong.rs",
      "examples/tiled_gemm_v1/verus/negative/lds_source_output_owner_wrong.rs",
      "examples/tiled_gemm_v1/verus/negative/lds_source_correspondence_identity_wrong.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "bounded-source-model-proof",
        text: "Commit 5a45239aeeda3ca64cf16beb7fb1d3589e649bfe adds a bounded Slice 1 Verus source/model correspondence proof reporting 96 verified and 0 errors. It covers exact 256/256/256 lengths, initialized same-epoch LDS reads, converged publish-barrier ordering, unique C ownership, and exact correspondence among the attributed source profile, authenticated portable-MIR receipt, reviewed correspondence identity, and canonical module identity.",
      },
      {
        id: "identity-and-negative-binding",
        text: "An ordinary Rust test recomputes portable-MIR, reviewed-correspondence, and canonical-module SHA-256 identities from the real compiler and Kernel IR sources and checks source/IR operation order. Four new expected-negative fixtures reject short input, read-at-publish, output-owner collision, and one-bit portable-MIR identity drift at their named postconditions without admit, assume, or external-body shortcuts.",
      },
      {
        id: "source-model-validation-campaign",
        text: "Clean current-main mi300x validation passed 76 debug tests, 76 release tests, 7 doctests in each lane, and strict all-target/all-feature Clippy. The authenticated runner passed all six positive proof groups and rejected all 21 expected-negative fixtures.",
      },
      {
        id: "source-model-boundary",
        text: "This is identity-bound bounded source/model correspondence only. It does not prove rustc MIR-to-IR semantics, LLVM lowering, linking, emitted ISA or machine behavior, descriptor or Worker V2 integrity, certificate consumption, loading, or launch authority. Production certificate consumption is tracked in fe2o3 #91, extension through K-phase, grid, and edge profiles in #92, and semantic MIR-to-Kernel-IR refinement in #106.",
      },
    ],
  },
  "tiled-lds-matrix-wire-v5": {
    id: "tiled-lds-matrix-wire-v5",
    stageLabel: "1429ed6a canonical matrix wire V5",
    claimLabel: "Canonical bounded matrix Kernel IR wire",
    claim: "compiler-hsaco-observed",
    authority: "wire-format-only",
    commit: "1429ed6ae46e14317bb5b927c8d9cb1f66f268c7",
    tree: "0a2b79650673b2b9b42965307f2ac40d05324afe",
    commands: [
      "cargo test --locked -p fe2o3-kernel-ir --all-targets",
      "cargo clippy --locked -p fe2o3-kernel-ir --all-targets --no-deps -- -D warnings",
    ],
    sourcePaths: [
      "crates/fe2o3-kernel-ir/WIRE_FORMAT.md",
      "crates/fe2o3-kernel-ir/src/wire.rs",
      "crates/fe2o3-kernel-ir/tests/wire_v5.rs",
      "crates/fe2o3-kernel-ir/tests/fixtures/matrix_v5.hex",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "matrix-wire-fields",
        text: "Commit 1429ed6ae46e14317bb5b927c8d9cb1f66f268c7 adds canonical Kernel IR V5 bytes for matrix active lanes, convergence, every MFMA operand and profile field, LDS base/value operands, element/layout tags, and wave width.",
      },
      {
        id: "legacy-wire-closure",
        text: "V1 through V4 remain frozen and reject matrix operations. V5 rejects an unrepresentable frontend binding instead of silently omitting it, and golden, round-trip, tag, truncation, and single-byte mutation tests remain bounded and panic-free.",
      },
      {
        id: "matrix-wire-boundary",
        text: "Canonical V5 bytes establish wire identity only. They do not establish semantic verification, source correspondence, compiler or LLVM refinement, artifact authority, loading, launch, or hardware execution.",
      },
    ],
  },
  "tiled-lds-inert-worker-handoff-v1": {
    id: "tiled-lds-inert-worker-handoff-v1",
    stageLabel: "7337a2b8 attributed inert Worker V2 handoff",
    claimLabel: "Source-bound compiler descriptor and inert handoff",
    claim: "compiler-hsaco-observed",
    authority: "inert-worker-handoff-only",
    commit: "7337a2b87dffa0845d092c13399b012f884de90b",
    tree: "6dd4d922e22cf488157cc0fece17edf64df98b7c",
    commands: [
      "cargo test --locked -p rustc-codegen-fe2o3 --lib",
      "cargo test --locked -p rustc-codegen-fe2o3 --test collected_executable_scalar_control_flow_v2 tiled_gemm_lds_slice1_attributed_source_publishes_only_the_bound_worker_v2_handoff -- --exact",
      "cargo clippy --locked -p rustc-codegen-fe2o3 --all-targets --no-deps -- -D warnings",
    ],
    sourcePaths: [
      "crates/rustc-codegen-fe2o3/src/collected_tiled_gemm_lds_slice1_v1.rs",
      "crates/rustc-codegen-fe2o3/src/compiler_descriptor.rs",
      "crates/rustc-codegen-fe2o3/src/kernel_ir_codegen.rs",
      "crates/rustc-codegen-fe2o3/src/worker_v2_producer.rs",
      "crates/rustc-codegen-fe2o3/tests/collected_executable_scalar_control_flow_v2.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "source-descriptor-join",
        text: "Commit 7337a2b87dffa0845d092c13399b012f884de90b carries the authenticated attributed Slice 1 source into one exact compiler-owned descriptor for gfx942:xnack-, COV6, WG64, grid 1, two shared BF16 slices, one disjoint F32 slice, and 1,024 compiler-derived static LDS bytes.",
      },
      {
        id: "complete-handoff-identity",
        text: "The single-use Worker V2 handoff binds canonical V5 Kernel IR, source authority, descriptor bytes, resource transcript, the original pre-section upstream-LLVM body, symbol manifest, target, COV6, and compiler envelope. Descriptor, LLVM-instruction, symbol-manifest, target, resource, source, and replay mutations fail before publication.",
      },
      {
        id: "handoff-validation",
        text: "On mi300x, 380 library tests passed with 8 configured ignores; focused descriptor, receipt, publication, source-mutation, and integration tests passed; formatting and strict all-target Clippy passed.",
      },
      {
        id: "inert-handoff-boundary",
        text: "This is an inert compiler-module handoff. It authenticates no compiler origin and grants no worker, linker, final-HSACO, load, launch, hardware-execution, or production proof-certificate authority. At this checkpoint the shared protected runtime substrate remained open; later typed records separately complete #96 through #100 mechanics without strengthening this handoff record.",
      },
    ],
  },
  "tiled-lds-sealed-profile-registry-v1": {
    id: "tiled-lds-sealed-profile-registry-v1",
    stageLabel: "89ebe69b sealed Slice 1 profile registry",
    claimLabel: "Sealed exact Slice 1 compiler import",
    claim: "compiler-hsaco-observed",
    authority: "sealed-profile-registry-only",
    commit: "89ebe69bb3daf8262a485463c5fdf04cf095346f",
    tree: "c2604487ec76f337d7ada2c0319fffd02b3ce8c9",
    commands: [
      "cargo test --locked -p fe2o3-hsaco-finalize --all-targets",
      "cargo test --locked -p fe2o3-hsaco-finalize --test lds_gemm_profile_registry",
      "cargo clippy --locked -p fe2o3-hsaco-finalize --all-targets --no-deps -- -D warnings",
    ],
    sourcePaths: [
      "crates/fe2o3-hsaco-finalize/src/lds_gemm_profile_registry.rs",
      "crates/fe2o3-hsaco-finalize/src/lib.rs",
      "crates/fe2o3-hsaco-finalize/tests/lds_gemm_profile_registry.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "closed-profile-slots",
        text: "Commit 89ebe69bb3daf8262a485463c5fdf04cf095346f adds stable, disjoint Slice 1, K-phase, Grid, and Edges registry slots. Only the exact M16 N16 K16 Slice 1 manifest is enabled; the other three slots fail closed as reserved profiles.",
      },
      {
        id: "exact-slice1-import",
        text: "Slice 1 admission reconstructs canonical Kernel IR V5 and independently re-lowers it with upstream dialect-amdgcn, then requires byte-exact LLVM, compiler descriptor, source-authority, resource-transcript, target, COV6, ABI 48/304/8, grid 1, WG64, 1,024-byte LDS, and typed A/B/C effect and length bindings.",
      },
      {
        id: "fail-closed-import-tests",
        text: "Eight focused integration tests admit the deterministic canonical import and reject reserved profiles, regenerated hostile LLVM, descriptor-pin substitution, authority/resource substitution, duplicate or reordered sections, target/COV drift, and manifest drift. Clean mi300x validation passed 46 library tests with 4 configured ignores, all 8 focused tests, the full package suite, strict all-target Clippy, and the compile-fail doctest.",
      },
      {
        id: "sealed-registry-boundary",
        text: "The retained import is non-Clone and exposes no into_inner escape. It authenticates no compiler origin and grants no finalizer, Worker V2, LLVM linker, publication, load, launch, hardware, numerical, or Verus proof authority. The separately typed #97, #99, and #100 increments below complete finalization, host preparation, one-shot lifecycle mechanics, and one bounded protected hardware observation without retroactively strengthening this registry record.",
      },
    ],
  },
} satisfies Record<StagedEvidenceId, StagedEvidenceRecord>);

export const completedIssue94IncrementOrder = deepFreeze([
  "tiled-lds-direct-finalization-v1",
  "tiled-lds-host-adapter-v1",
  "tiled-lds-protected-lifecycle-v1",
] satisfies CompletedIssue94IncrementId[]);

const completedIssue94IncrementRecords = deepFreeze({
  "tiled-lds-direct-finalization-v1": {
    id: "tiled-lds-direct-finalization-v1",
    stageLabel: "bfe9dfee #97 exact direct LLVM/LLD finalization",
    authority: "finalization-mechanics-only",
    commit: "bfe9dfeeff4b7efdc0aee3af8748e84eae5acb28",
    tree: "9ae18d096c89b4fd6fdcc0649946a0796f6277d2",
    commands: [
      "cargo test --locked -p fe2o3-hsaco-finalize --test lds_gemm_finalizer",
      "env FE2O3_LDS_GEMM_V1_WORKER=/absolute/measured/fe2o3-llvm-link-worker FE2O3_LDS_GEMM_V1_WORKER_BUILD_ID=<build-id> FE2O3_LDS_GEMM_V1_LLVM_BUILD_ID=<llvm-build-id> cargo test --locked -p fe2o3-hsaco-finalize --test lds_gemm_finalizer measured_worker_produces_a_deterministic_inert_slice1_cov6_receipt -- --ignored --exact --nocapture",
    ],
    sourcePaths: [
      "crates/fe2o3-hsaco-finalize/src/lds_gemm_finalizer.rs",
      "crates/fe2o3-hsaco-finalize/src/lib.rs",
      "crates/fe2o3-hsaco-finalize/tests/lds_gemm_finalizer.rs",
      "tools/fe2o3-llvm-link-worker/src/WorkerPipeline.cpp",
      "tools/fe2o3-llvm-link-worker/tests/PipelineTests.cpp",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "exact-direct-finalizer",
        text: "Commits 6a3f7afe944dce87f355e11cba45dbb5f857dcf5, bb2c2100f7be30d7676eaf3b02952052db216404, and bfe9dfeeff4b7efdc0aee3af8748e84eae5acb28 implement, admit, and integrate the exact Slice 1 upstream LLVM target-machine plus LLD library API Worker V2 finalizer. Its public API has no COMGR, shell llc, or shell ld.lld escape hatch.",
      },
      {
        id: "exact-final-artifact-closure",
        text: "The one-shot path consumes the admitted compiler import and closes the exact gfx942:xnack- COV6 WG64 symbol, 48-byte explicit and 304-byte complete ABI, 1,024-byte LDS, zero-private-segment, and relocation-free artifact profile while retaining deterministic compiler-handoff, worker, LLVM, descriptor, and output lineage.",
      },
      {
        id: "finalization-authority-boundary",
        text: "This completes fe2o3 #97 finalization mechanics only. The inert finalized receipt authenticates no compiler origin, proves no Verus or compiler/LLVM/machine refinement result, and grants no publication, protected load, dispatch, or launch authority.",
      },
    ],
  },
  "tiled-lds-host-adapter-v1": {
    id: "tiled-lds-host-adapter-v1",
    stageLabel: "278a41af #99 exact generated host preparation",
    authority: "host-preparation-only",
    commit: "278a41afb98684e1c1e60b4fb1d474c1fd5f44d8",
    tree: "c4afa6ad88e436ad896a746c324212ca2b6314f6",
    commands: [
      "cargo test --locked -p fe2o3-host --test generated_lds_gemm",
      "cargo test --locked -p fe2o3-host --test generated_lds_gemm_ui",
      "cargo clippy --locked -p fe2o3-host --all-targets --no-deps -- -D warnings",
    ],
    sourcePaths: [
      "crates/fe2o3-host/src/generated_lds_gemm.rs",
      "crates/fe2o3-host/src/lib.rs",
      "crates/fe2o3-host/tests/generated_lds_gemm.rs",
      "crates/fe2o3-host/tests/generated_lds_gemm_ui.rs",
      "crates/fe2o3-host/tests/ui/generated_lds_gemm/adapter_cannot_clone.rs",
      "crates/fe2o3-host/tests/ui/generated_lds_gemm/input_buffers_remain_borrowed.rs",
      "crates/fe2o3-host/tests/ui/generated_lds_gemm/output_remains_uniquely_borrowed.rs",
      "crates/fe2o3-host/tests/ui/generated_lds_gemm/raw_kernarg_is_private.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "exact-generated-adapter",
        text: "Commit 278a41afb98684e1c1e60b4fb1d474c1fd5f44d8 completes fe2o3 #99 with the generated exact BF16/F32 Slice 1 host adapter: A and B are 256-element u16 BF16-bit shared read views, C is a 256-element f32 unique read/write view, A/B overlap is allowed, and any C overlap is rejected.",
      },
      {
        id: "host-abi-and-identities",
        text: "Preparation constructs the exact 48-byte explicit and 304-byte complete COV6 ABI and copies the sealed import, profile, contract, descriptor, and role-separated length identities. The compiler import borrow is then released so the non-Clone import can be consumed by #97 finalization while the three device buffers remain borrowed by the adapter.",
      },
      {
        id: "host-authority-boundary",
        text: "This is inert host preparation only. It exposes no raw kernarg, load, resolve, resource, dispatch, completion, unload, or launch operation and grants no compiler-origin, Verus, refinement, protected-execution, or source-to-HSACO authority. The later #100 record consumes this value into a fixed lifecycle without retroactively adding authority to the adapter itself.",
      },
    ],
  },
  "tiled-lds-protected-lifecycle-v1": {
    id: "tiled-lds-protected-lifecycle-v1",
    stageLabel: "c4fcb4d9 exact protected Slice 1 lifecycle observation",
    authority: "bounded-protected-hardware-observation-only",
    commit: protectedSlice1HardwareObservation.commit,
    tree: protectedSlice1HardwareObservation.tree,
    commands: [
      "cargo test --locked -p fe2o3-host --lib",
      "cargo test --locked -p fe2o3-hsa-runtime --lib",
      "cargo clippy --locked -p fe2o3-host --all-targets --no-deps -- -D warnings",
      "cargo clippy --locked -p fe2o3-hsa-runtime --all-targets --no-deps -- -D warnings",
      PROTECTED_SLICE1_WORKER_V2_HARDWARE_COMMAND,
    ],
    sourcePaths: [
      "examples/tiled_gemm_v1/src/kernel.rs",
      "crates/fe2o3-host/src/generated_lds_gemm_lifecycle.rs",
      "crates/fe2o3-host/src/generated_lds_gemm_lifecycle_tests.rs",
      "crates/fe2o3-host/src/lib.rs",
      "crates/fe2o3-hsa-runtime/src/dispatch.rs",
      "crates/fe2o3-hsa-runtime/src/lds_gemm_resource_observation.rs",
      "crates/fe2o3-hsa-runtime/src/lib.rs",
      "crates/fe2o3-hsa-runtime/src/lifecycle.rs",
      "crates/fe2o3-hsa-runtime/tests/tiled_gemm_lds_slice1_worker_v2_hardware.rs",
      "crates/fe2o3-hsa-runtime/tests/support/tiled_gemm_lds_slice1_worker_v2_runner.rs",
    ],
    target: protectedSlice1HardwareObservation.target,
    assertions: [
      {
        id: "linear-state-machine",
        text: "Commit c4fcb4d980cf979c0527dfa135a7b9f4fe72a811, tree c65c6ab567409afaaef6ea39c8befcac21d47119, is the completed exact protected Slice 1 checkpoint. The #100 private non-Clone states consume ownership in the exact order Joined -> Loaded -> Completed -> Unloaded; no state exposes finalized bytes, native handles, or a generic/raw launch operation.",
      },
      {
        id: "exact-join-and-runtime-gates",
        text: "Joined reconciles the #97 finalizer and #99 host import, profile, contract, finalized-output, descriptor, buffer, and length identities before a runtime adapter is supplied. Loaded then requires the same retained context identity, gfx942:xnack- physical device and agent, HIP ordinal, runtime instance, exact executable and tiled_gemm_lds_v1 kernel identities, 1,024-byte static LDS, zero private and dynamic segments, grid 1, WG64/wave64, and the exact 48-byte explicit plus 256-byte implicit, 304-byte complete COV6 ABI with descriptor alignment 8 and HSA staging alignment 16.",
      },
      {
        id: "completion-and-ownership",
        text: "Loaded retains the finalized artifact, executable, selected kernel, and borrowed A/B/C views through exact hidden-kernarg initialization and one synchronous dispatch. Explicit bytes must remain unchanged. Only a validated completed observation releases the joined artifact and buffer leases into Completed, which retains only terminal executable-unload authority; Unloaded is an inert identity receipt.",
      },
      {
        id: "terminal-policy",
        text: "On failure before packet publication, the production adapter cancels the prepared dispatch and releases its queue and kernarg before the selected kernel is dropped and the executable is terminally unloaded. Failures after proven quiescence and dropping Loaded or Completed also perform one checked unload. Adapter unwind, unload error, or unload-observation ambiguity aborts; a post-submit queue error or completion deadline is process-terminal and retains submitted resources because GPU quiescence is unknown rather than returning or attempting an ordinary unload.",
      },
      {
        id: "protected-hardware-observation",
        text: "The public protected route passed on mi300x gfx942 with HSA_XNACK=0 using Worker ID fe2o3-worker-v1-sha256-6c3dfd5f784b3babe140006aba57a214a897b171860928440184fa201b6f96db and LLVM build upstream-llvmorg-22.1.8-ca7933e47d3a3451d81e72ac174dcb5aa28b59d1. Its exact marker was FE2O3_PROTECTED_SLICE1_WORKER_V2_OK outputs=256 max_abs_error=0 finalizer=078e9b523164b679ff7af3b4e819ad041713c53c6841399ac7cea95090f09774 unload=df2f77ee798444a9e1fe5e27f219bdf720386eb8603a9a74fccc0df8efb3921c.",
      },
      {
        id: "measured-result",
        text: "At the pinned historical commit, the protected hardware test compared all 256 output bit patterns with the CPU reference, required A and B to remain unchanged, checked every A/B/C guard canary, and passed 1/1 in 14.36 seconds. FakeAdapter tests in crates/fe2o3-host/src/generated_lds_gemm_lifecycle_tests.rs covered identity and contract substitutions, cleanup, and process-terminal paths. That workload-specific lifecycle and test were later removed from the unified production tree.",
      },
      {
        id: "lifecycle-evidence-boundary",
        text: "This is one exact bounded Slice 1 protected hardware observation. It does not authenticate compiler origin, consume a Verus certificate, establish MIR-to-Kernel-IR or Kernel-IR-to-LLVM/ISA refinement, generally prove illegal-access or race freedom, generalize GEMM, or cover protected Slice 3 or Slice 4. The earlier observational IR-derived MI300X run remains a separate evidence layer.",
      },
    ],
  },
} satisfies Record<
  CompletedIssue94IncrementId,
  CompletedIssue94IncrementRecord
>);

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

export function completedIssue94IncrementRecord(
  id: CompletedIssue94IncrementId,
): DeepReadonly<CompletedIssue94IncrementRecord> {
  return completedIssue94IncrementRecords[id];
}

export function isCompletedIssue94IncrementId(
  value: unknown,
): value is CompletedIssue94IncrementId {
  return (
    typeof value === "string" &&
    completedIssue94IncrementOrder.some((id) => id === value)
  );
}

export function completedIssue94IncrementDetail(): string {
  return completedIssue94IncrementOrder
    .flatMap((id) => completedIssue94IncrementRecord(id).assertions)
    .map((assertion) => assertion.text)
    .join(" ");
}

function stagedEvidenceRecordDetail(
  ids: readonly StagedEvidenceId[],
): string {
  return ids
    .flatMap((id) => stagedEvidenceRecord(id).assertions)
    .map((assertion) => assertion.text)
    .join(" ");
}

export function stagedEvidenceDetail(
  ids: readonly StagedEvidenceId[],
): string {
  const detail = stagedEvidenceRecordDetail(ids);
  const historicalDetail = ids.includes("tiled-lds-sealed-profile-registry-v1")
    ? `${detail} ${completedIssue94IncrementDetail()}`
    : detail;
  return `${historicalDetail} ${RETIRED_EXACT_ROUTE_NOTICE}`;
}

export function stagedEvidenceRows(
  ids: readonly StagedEvidenceId[],
): string[][] {
  const rows = ids.map((id) => {
    const record = stagedEvidenceRecord(id);
    return [
      record.stageLabel,
      `${stagedEvidenceRecordDetail([id])} ${RETIRED_EXACT_ROUTE_NOTICE}`,
      record.authority,
    ];
  });
  if (ids.includes("tiled-lds-sealed-profile-registry-v1")) {
    rows.push(
      ...completedIssue94IncrementOrder.map((id) => {
        const record = completedIssue94IncrementRecord(id);
        return [
          record.stageLabel,
          `${record.assertions.map((assertion) => assertion.text).join(" ")} ${RETIRED_EXACT_ROUTE_NOTICE}`,
          record.authority,
        ];
      }),
    );
  }
  return rows;
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
      release: boolean;
      allTargets?: boolean;
    }
  | {
      environment: Readonly<Record<string, string>>;
      locked: boolean;
      packageName?: string;
      manifestPath?: string;
      mode: "lib";
      release: boolean;
    }
  | {
      environment: Readonly<Record<string, string>>;
      locked: boolean;
      packageName?: string;
      manifestPath?: string;
      mode: "test";
      release: boolean;
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
  let argumentsAfterPackage = tokens.slice(cursor + 2);
  const release = argumentsAfterPackage[0] === "--release";
  if (release) argumentsAfterPackage = argumentsAfterPackage.slice(1);
  const allTargets = argumentsAfterPackage[0] === "--all-targets";
  if (allTargets) argumentsAfterPackage = argumentsAfterPackage.slice(1);
  if (argumentsAfterPackage.length === 0) {
    return {
      environment,
      locked,
      packageName,
      manifestPath,
      mode: "package",
      release,
      allTargets,
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
      release,
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
      release,
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
    argumentsAfterPackage[argumentCursor + 4] === "--exact" &&
    argumentsAfterPackage.length === argumentCursor + 5
  ) {
    return {
      environment,
      locked,
      packageName,
      manifestPath,
      mode: "test",
      release,
      targetName: argumentsAfterPackage[argumentCursor + 1],
      testName: argumentsAfterPackage[argumentCursor + 2],
      features,
    };
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
      release,
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
  return /^cargo clippy --locked (?:-p [a-z0-9][a-z0-9-]*|--manifest-path [A-Za-z0-9_./-]+\/Cargo\.toml) --all-targets (?:--all-features|--no-deps) -- -D warnings$/u.test(
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
  for (const id of completedIssue94IncrementOrder) {
    const record = completedIssue94IncrementRecord(id);
    if (record.id !== id) issues.push(`${id}: record id mismatch`);
    if (!/^[0-9a-f]{40}$/u.test(record.commit)) {
      issues.push(`${id}: commit is not an exact Git object name`);
    }
    if (!/^[0-9a-f]{40}$/u.test(record.tree)) {
      issues.push(`${id}: tree is not an exact Git object name`);
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
