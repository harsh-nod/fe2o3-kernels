import type {
  Claim,
  SourceMilestoneEvidenceReference,
  SourceMilestoneId,
} from "./model";
import { deepFreeze, hasOwn, type DeepReadonly } from "./registry";

export interface SourceMilestoneRecord {
  id: SourceMilestoneId;
  lessonId:
    | "gemm-tiling"
    | "gemm-proof-plan"
    | "reductions-scans"
    | "lds-barriers-atomics"
    | "flash-attention"
    | "moe-routing"
    | "moe-expert-compute";
  claim: SourceMilestoneEvidenceReference["claim"];
  authority: SourceMilestoneEvidenceReference["authority"];
  claimLabel: string;
  detail: string;
  commit: string;
  tree: string;
  commands: readonly string[];
  sourcePaths: readonly string[];
  primarySourcePath: string;
  primarySourceSha256: string;
  target: "gfx942:xnack-";
}

export const sourceMilestoneOrder = deepFreeze([
  "dynamic-gemm-executable-source-v1",
  "tiled-gemm-safe-source-v1",
  "wave64-collectives-source-v1",
  "workgroup-sync-source-v1",
  "flash-attention-source-v1",
  "flash-attention-verus-v1",
  "moe-top2-source-v1",
  "moe-top2-verus-v1",
  "moe-expert-source-v1",
  "moe-expert-verus-v1",
] satisfies SourceMilestoneId[]);

const sourceMilestoneRecords = deepFreeze({
  "dynamic-gemm-executable-source-v1": {
    id: "dynamic-gemm-executable-source-v1",
    lessonId: "gemm-tiling",
    claim: "source-tested",
    authority: "source-tested-only",
    claimLabel: "Executable dynamic GEMM source",
    detail:
      "Current public main contains an ordinary safe attributed Rust wave64 kernel with runtime M, N, K, lda, ldb, ldc, alpha, and beta; a dynamic K loop; checked 16x16 tiled ownership; BF16/F32 matrix fragments; edge zero fill; and a full epilogue. It returns KernelResult, uses ? for checked capability construction, and names the target-neutral Matrix capability. The workload-neutral compiler route lowers the exact source through semantic MIR, ranked PLIRON verification, canonical Kernel IR V7 with guarded edge loads and tensor contracts, formal memory admission, gfx942 LLVM, and HSACO. Four MI300X cases pass at zero error, the disassembly contains V_MFMA_F32_16X16X16_BF16, and the repository includes a matched direct HIP benchmark. This is qualification execution, not protected artifact publication or a claim that Fe2O3 is faster than HIP.",
    commit: "859515320d757dc32001f664bc95ce2c700b8ff5",
    tree: "82ffcda511f33038f0a1f4c59213c383eaf37476",
    commands: [
      "cargo test --locked --manifest-path examples/tiled_gemm_general_v1/Cargo.toml",
      "examples/tiled_gemm_general_v1/run-gfx942.sh",
      "examples/tiled_gemm_general_v1/run-benchmark.sh",
    ],
    sourcePaths: [
      "examples/tiled_gemm_general_v1/src/kernel.rs",
      "examples/tiled_gemm_general_v1/src/main.rs",
      "examples/tiled_gemm_general_v1/run-gfx942.sh",
      "examples/tiled_gemm_general_v1/benchmark_hip.cpp",
      "examples/tiled_gemm_general_v1/run-benchmark.sh",
      "examples/tiled_gemm_general_v1/README.md",
    ],
    primarySourcePath: "examples/tiled_gemm_general_v1/src/kernel.rs",
    primarySourceSha256:
      "844d0aadba6ce977e2d4e2d3bd0fd556c92752fe5fa543099f81e806c0b5b663",
    target: "gfx942:xnack-",
  },
  "tiled-gemm-safe-source-v1": {
    id: "tiled-gemm-safe-source-v1",
    lessonId: "gemm-proof-plan",
    claim: "source-tested",
    authority: "source-tested-only",
    claimLabel: "Current safe tiled GEMM source",
    detail:
      "Current public main contains the ordinary attributed 16x16x16 BF16/F32 tiled GEMM source with compiler-issued lane, LDS, matrix, barrier, and disjoint-output capabilities. The kernel and its reachable helpers contain no unsafe block. Source-boundary and ranked-pipeline tests cover this safe source shape, but historical proof, HSACO, and GPU observations remain pinned separately and do not transfer to this descendant source.",
    commit: "ae312f421872e1eb9885217888548d74f79c3357",
    tree: "2345f0b14dc92dcfce9d829433860f06f8f7b128",
    commands: [
      "cargo test --locked --manifest-path examples/tiled_gemm_v1/Cargo.toml",
      "cargo test --locked -p rustc-codegen-fe2o3 --test production_extraction_driver_v1 -- --ignored --exact production_collector_rejects_reachable_unsafe_rust_with_rooted_diagnostics",
      "cargo test --locked -p rustc-codegen-fe2o3 --test production_ranked_bounds_driver_v1 -- --ignored",
    ],
    sourcePaths: [
      "examples/tiled_gemm_v1/src/kernel.rs",
      "crates/rustc-codegen-fe2o3/tests/production_extraction_driver_v1.rs",
      "crates/rustc-codegen-fe2o3/tests/production_ranked_bounds_driver_v1.rs",
    ],
    primarySourcePath: "examples/tiled_gemm_v1/src/kernel.rs",
    primarySourceSha256:
      "26a5ec889bc9122d6b91b956111d690e27c0b00997793e3600caaa79b601f2a3",
    target: "gfx942:xnack-",
  },
  "wave64-collectives-source-v1": {
    id: "wave64-collectives-source-v1",
    lessonId: "reductions-scans",
    claim: "source-model-verified",
    authority: "source-model-only",
    claimLabel: "Current safe masked Wave64 source and model",
    detail:
      "Current public main contains ordinary safe attributed Rust for one fixed masked Wave64 reduction plus inclusive and exclusive scans, a checked CPU oracle, deterministic mutation tests, and the pinned Verus model. The kernel uses compiler-issued capabilities and contains no unsafe block. This source/model record grants no compiler-refinement, artifact, host-launch, runtime, or hardware authority.",
    commit: "ae312f421872e1eb9885217888548d74f79c3357",
    tree: "2345f0b14dc92dcfce9d829433860f06f8f7b128",
    commands: [
      "cargo test --locked --manifest-path examples/wave64_collectives_v1/Cargo.toml",
      "VERUS=/absolute/path/to/pinned/verus examples/wave64_collectives_v1/run-verus.sh",
    ],
    sourcePaths: [
      "examples/wave64_collectives_v1/src/kernel.rs",
      "examples/wave64_collectives_v1/src/oracle.rs",
      "examples/wave64_collectives_v1/verus/wave64_collectives_v1.rs",
    ],
    primarySourcePath: "examples/wave64_collectives_v1/src/kernel.rs",
    primarySourceSha256:
      "c649e38712232ed45c1d2f6f8a2a49405f12a5e308907b3265c2415f227803a2",
    target: "gfx942:xnack-",
  },
  "workgroup-sync-source-v1": {
    id: "workgroup-sync-source-v1",
    lessonId: "lds-barriers-atomics",
    claim: "source-model-verified",
    authority: "source-model-only",
    claimLabel: "Current safe LDS and scoped-atomic sources",
    detail:
      "Current public main contains separate ordinary safe attributed Rust files for one fixed LDS reduction and one scoped global atomic add, checked CPU oracles, deterministic mutation tests, and a pinned Verus model. Compiler-issued invocation, LDS, collective, atomic, and disjoint-output capabilities remove user unsafe without granting compiler-refinement, artifact, host-launch, runtime, or hardware authority.",
    commit: "ae312f421872e1eb9885217888548d74f79c3357",
    tree: "2345f0b14dc92dcfce9d829433860f06f8f7b128",
    commands: [
      "cargo test --locked --manifest-path examples/workgroup_sync_v1/Cargo.toml",
      "VERUS=/absolute/path/to/pinned/verus examples/workgroup_sync_v1/run-verus.sh",
    ],
    sourcePaths: [
      "examples/workgroup_sync_v1/src/kernel.rs",
      "examples/workgroup_sync_v1/src/scoped_atomic.rs",
      "examples/workgroup_sync_v1/verus/workgroup_sync_v1.rs",
    ],
    primarySourcePath: "examples/workgroup_sync_v1/src/kernel.rs",
    primarySourceSha256:
      "1a28ca6d97d180c347be41ce65377d67e44773c539aa73610808585aedf125bf",
    target: "gfx942:xnack-",
  },
  "flash-attention-source-v1": {
    id: "flash-attention-source-v1",
    lessonId: "flash-attention",
    claim: "source-tested",
    authority: "source-tested-only",
    claimLabel: "Current safe causal FlashAttention source",
    detail:
      "Current public main contains ordinary safe attributed Rust for the exact B=1, H=1, N=8, D=16 FP32 causal fused online recurrence, an independent two-pass FP64 oracle, executable proof-facing models, and deterministic mutation tests. Compiler-issued math and disjoint-output capabilities remove user unsafe. This grants no Verus, compiler-refinement, artifact, host-launch, runtime, or hardware authority.",
    commit: "ae312f421872e1eb9885217888548d74f79c3357",
    tree: "2345f0b14dc92dcfce9d829433860f06f8f7b128",
    commands: [
      "cargo test --locked --manifest-path examples/flash_attention_v1/Cargo.toml",
      "cargo test --locked --release --manifest-path examples/flash_attention_v1/Cargo.toml",
    ],
    sourcePaths: [
      "examples/flash_attention_v1/src/kernel.rs",
      "examples/flash_attention_v1/src/oracle.rs",
      "examples/flash_attention_v1/src/proof_model.rs",
    ],
    primarySourcePath: "examples/flash_attention_v1/src/kernel.rs",
    primarySourceSha256:
      "6dbaa2af88fd5edcdf0485f3da47b1319ce299422a77b99af56f9a3e77c2a421",
    target: "gfx942:xnack-",
  },
  "flash-attention-verus-v1": {
    id: "flash-attention-verus-v1",
    lessonId: "flash-attention",
    claim: "source-model-verified",
    authority: "source-model-only",
    claimLabel: "Exact causal online-attention model",
    detail:
      "Pinned Verus proves the exact B=1, H=1, N=8, D=16 causal domain, rational online max/sum/numerator recurrence, positive denominator, reference correspondence, bounded indices, and exclusive output ownership. It does not prove the exponential abstraction, IEEE FP32 or OCML behavior, Rust-source refinement, compiler lowering, machine safety, or GPU execution.",
    commit: "ae312f421872e1eb9885217888548d74f79c3357",
    tree: "2345f0b14dc92dcfce9d829433860f06f8f7b128",
    commands: [
      "VERUS=/absolute/path/to/pinned/verus examples/flash_attention_v1/run-verus.sh",
    ],
    sourcePaths: [
      "examples/flash_attention_v1/src/kernel.rs",
      "examples/flash_attention_v1/verus/flash_attention_v1.rs",
      "examples/flash_attention_v1/run-verus.sh",
    ],
    primarySourcePath:
      "examples/flash_attention_v1/verus/flash_attention_v1.rs",
    primarySourceSha256:
      "e98b9fffc6e4c2fbcc5bca0ca706ac6575f93814afecf67be73de0f2d087d467",
    target: "gfx942:xnack-",
  },
  "moe-top2-source-v1": {
    id: "moe-top2-source-v1",
    lessonId: "moe-routing",
    claim: "source-tested",
    authority: "source-tested-only",
    claimLabel: "Current safe deterministic MoE top-2 source",
    detail:
      "Current public main contains ordinary safe attributed Rust for exact T8/E4/K2/C4 finite-FP32 routing, lower-expert tie breaking, stable-prefix capacity dropping, exclusive offsets, permutation, inverse mapping, and sentinel tails. An independent oracle, debug/release tests, a 6,561-case bounded corpus, executable proof-facing models, and hostile mutations are public. Compiler-issued disjoint-output capabilities remove user unsafe. This grants no Verus, compiler-refinement, artifact, host-launch, runtime, or hardware authority.",
    commit: "ae312f421872e1eb9885217888548d74f79c3357",
    tree: "2345f0b14dc92dcfce9d829433860f06f8f7b128",
    commands: [
      "cargo test --locked --manifest-path examples/moe_top2_v1/Cargo.toml",
      "cargo test --locked --release --manifest-path examples/moe_top2_v1/Cargo.toml",
    ],
    sourcePaths: [
      "examples/moe_top2_v1/src/kernel.rs",
      "examples/moe_top2_v1/src/oracle.rs",
      "examples/moe_top2_v1/src/proof_model.rs",
    ],
    primarySourcePath: "examples/moe_top2_v1/src/kernel.rs",
    primarySourceSha256:
      "0260f144150e6fee7d9bd6a3d919e99ded0e43666509770f6e6186f5100fee25",
    target: "gfx942:xnack-",
  },
  "moe-top2-verus-v1": {
    id: "moe-top2-verus-v1",
    lessonId: "moe-routing",
    claim: "source-model-verified",
    authority: "source-model-only",
    claimLabel: "Exact deterministic top-2 routing model",
    detail:
      "Pinned Verus proves the exact T8/E4/K2/C4 mathematical routing model: total top-2 order, requested and admitted counts, capacity, exclusive scans, stable dropping, unique bounded slots, permutation/inverse round trips, and sentinel tails. It does not prove IEEE FP32 selection, Rust-source refinement, compiler lowering, machine safety, race freedom, or GPU execution.",
    commit: "ae312f421872e1eb9885217888548d74f79c3357",
    tree: "2345f0b14dc92dcfce9d829433860f06f8f7b128",
    commands: [
      "VERUS=/absolute/path/to/pinned/verus examples/moe_top2_v1/run-verus.sh",
    ],
    sourcePaths: [
      "examples/moe_top2_v1/src/kernel.rs",
      "examples/moe_top2_v1/verus/moe_top2_v1.rs",
      "examples/moe_top2_v1/run-verus.sh",
    ],
    primarySourcePath: "examples/moe_top2_v1/verus/moe_top2_v1.rs",
    primarySourceSha256:
      "aee6c405f3e95be25bf0575a419ff6591153fce7ff9e950f7d3e5889188e354c",
    target: "gfx942:xnack-",
  },
  "moe-expert-source-v1": {
    id: "moe-expert-source-v1",
    lessonId: "moe-expert-compute",
    claim: "source-tested",
    authority: "source-tested-only",
    claimLabel: "Current safe host-scheduled MoE expert source",
    detail:
      "Current public main contains ordinary safe attributed Rust for one exact 16x16x16 BF16/F32 expert GEMM and deterministic top-2 combine. Compiler-issued lane, LDS, matrix, barrier, math, and disjoint-output capabilities remove user unsafe. The host model and independent direct oracle retain their bounded source-tested authority; no compiler refinement, finalizer, runtime, protected GPU, numerical-refinement, or performance authority is granted.",
    commit: "ae312f421872e1eb9885217888548d74f79c3357",
    tree: "2345f0b14dc92dcfce9d829433860f06f8f7b128",
    commands: [
      "cargo test --locked --manifest-path examples/moe_expert_v1/Cargo.toml --all-targets",
      "cargo test --locked --release --manifest-path examples/moe_expert_v1/Cargo.toml --all-targets",
    ],
    sourcePaths: [
      "examples/moe_expert_v1/src/kernel.rs",
      "examples/moe_expert_v1/src/pipeline.rs",
      "examples/moe_expert_v1/src/oracle.rs",
    ],
    primarySourcePath: "examples/moe_expert_v1/src/kernel.rs",
    primarySourceSha256:
      "aabf48081ef9e027c0e5520300a435cdeb830df5081dafcf719dc7159e804c81",
    target: "gfx942:xnack-",
  },
  "moe-expert-verus-v1": {
    id: "moe-expert-verus-v1",
    lessonId: "moe-expert-compute",
    claim: "source-model-verified",
    authority: "source-model-only",
    claimLabel: "Exact MoE expert memory/effect model",
    detail:
      "Pinned Verus proves 15 fixed T8/E4/K2/C4 expert-pipeline obligations covering route, activation, weight, expert-tile, compact-output, and combined-output index bounds; padding separation; disjoint logical write owners; inverse-slot admission; and host phase order. Six named mutations fail. It proves no numerical correctness, Rust/compiler/LLVM/ISA refinement, machine memory safety, generalized race freedom, or GPU execution.",
    commit: "ae312f421872e1eb9885217888548d74f79c3357",
    tree: "2345f0b14dc92dcfce9d829433860f06f8f7b128",
    commands: [
      "VERUS=/absolute/path/to/pinned/verus examples/moe_expert_v1/run-verus.sh",
    ],
    sourcePaths: [
      "examples/moe_expert_v1/src/kernel.rs",
      "examples/moe_expert_v1/verus/moe_expert_memory_v1.rs",
      "examples/moe_expert_v1/run-verus.sh",
    ],
    primarySourcePath:
      "examples/moe_expert_v1/verus/moe_expert_memory_v1.rs",
    primarySourceSha256:
      "617e6741c5f1415a8e792e5e36e3526c04ba18903438e3af178bb107766383d1",
    target: "gfx942:xnack-",
  },
} satisfies Record<SourceMilestoneId, SourceMilestoneRecord>);

export function isSourceMilestoneId(value: unknown): value is SourceMilestoneId {
  return typeof value === "string" && hasOwn(sourceMilestoneRecords, value);
}

export function sourceMilestoneRecord(
  id: SourceMilestoneId,
): DeepReadonly<SourceMilestoneRecord> {
  return sourceMilestoneRecords[id];
}

export function sourceMilestoneReference(
  id: SourceMilestoneId,
): SourceMilestoneEvidenceReference {
  const record = sourceMilestoneRecord(id);
  return {
    scope: "source-milestone",
    evidenceId: record.id,
    claim: record.claim,
    authority: record.authority,
    commit: record.commit,
    tree: record.tree,
    commands: [...record.commands],
    sourcePaths: [...record.sourcePaths],
    target: record.target,
    note: "Exact public source milestone; no executable GPU authority.",
  };
}

export function sourceMilestoneClaim(id: SourceMilestoneId): Claim {
  const record = sourceMilestoneRecord(id);
  return {
    kind: record.claim,
    label: record.claimLabel,
    detail: record.detail,
    reference: sourceMilestoneReference(id),
  };
}

export function validateSourceMilestoneCatalog(): string[] {
  const exactObject = /^[0-9a-f]{40}$/u;
  const exactDigest = /^[0-9a-f]{64}$/u;
  const issues: string[] = [];
  for (const id of sourceMilestoneOrder) {
    const record = sourceMilestoneRecord(id);
    if (!exactObject.test(record.commit) || !exactObject.test(record.tree)) {
      issues.push(`${id}: source milestone lacks exact commit/tree`);
    }
    if (!exactDigest.test(record.primarySourceSha256)) {
      issues.push(`${id}: source milestone lacks exact source SHA-256`);
    }
    if (!record.sourcePaths.includes(record.primarySourcePath)) {
      issues.push(`${id}: primary source is not included in evidence paths`);
    }
    if (record.commands.length === 0 || record.sourcePaths.length === 0) {
      issues.push(`${id}: source milestone evidence is incomplete`);
    }
  }
  return issues;
}
