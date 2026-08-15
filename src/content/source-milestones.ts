import type {
  Claim,
  SourceMilestoneEvidenceReference,
  SourceMilestoneId,
} from "./model";
import { deepFreeze, hasOwn, type DeepReadonly } from "./registry";

export interface SourceMilestoneRecord {
  id: SourceMilestoneId;
  lessonId: "reductions-scans" | "lds-barriers-atomics" | "flash-attention";
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
  "wave64-collectives-source-v1",
  "workgroup-sync-source-v1",
  "flash-attention-source-v1",
] satisfies SourceMilestoneId[]);

const sourceMilestoneRecords = deepFreeze({
  "wave64-collectives-source-v1": {
    id: "wave64-collectives-source-v1",
    lessonId: "reductions-scans",
    claim: "source-model-verified",
    authority: "source-model-only",
    claimLabel: "Exact masked Wave64 source and model",
    detail:
      "Public Phase A contains ordinary attributed Rust for one fixed masked Wave64 reduction plus inclusive and exclusive scans, a checked CPU oracle, deterministic mutation tests, and a pinned Verus model. It grants no compiler-profile, artifact, host-launch, runtime, or hardware authority.",
    commit: "d592ecee1154ca39daf1f9b1c2e02ab462e6c5f8",
    tree: "cdec8448a300aa71d17565ca50fd4d893932f602",
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
      "01ac1365b0fdfe91cdc8f7cf6a14ae5acbea41528103ec3de5fe6d895261625e",
    target: "gfx942:xnack-",
  },
  "workgroup-sync-source-v1": {
    id: "workgroup-sync-source-v1",
    lessonId: "lds-barriers-atomics",
    claim: "source-model-verified",
    authority: "source-model-only",
    claimLabel: "Exact typed LDS and scoped-atomic sources",
    detail:
      "Public Phase A contains separate ordinary attributed Rust files for one fixed LDS reduction and one scoped global atomic add, checked CPU oracles, deterministic mutation tests, and a pinned Verus model. DeviceGlobalMutPtr, exclusive GlobalMut host admission, and exact linear DynamicLds encode source-level capabilities without granting compiler-profile, artifact, host-launch, runtime, or hardware authority.",
    commit: "d592ecee1154ca39daf1f9b1c2e02ab462e6c5f8",
    tree: "cdec8448a300aa71d17565ca50fd4d893932f602",
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
      "3e7ec081c7958288f9d997d40e6f41a7faabc56a3add734099cd1777443b2983",
    target: "gfx942:xnack-",
  },
  "flash-attention-source-v1": {
    id: "flash-attention-source-v1",
    lessonId: "flash-attention",
    claim: "source-tested",
    authority: "source-tested-only",
    claimLabel: "Exact causal FlashAttention Phase A source",
    detail:
      "Public Phase A contains ordinary attributed Rust for the exact B=1, H=1, N=8, D=16 FP32 causal fused online recurrence, an independent two-pass FP64 oracle, executable proof-facing models, and deterministic mutation tests. It grants no Verus, compiler-profile, artifact, host-launch, runtime, or hardware authority.",
    commit: "5d4313bcda3479e6c77ce93350ca3428729fdbc0",
    tree: "9a7fcd78675c6fe793d8e8c1f697be052b962583",
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
      "2b00a64e43e69c416e70080e013edf90e861fef94ee66441da93d2c11b3e8f17",
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
