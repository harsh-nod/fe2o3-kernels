import type {
  Claim,
  SourceMilestoneEvidenceReference,
  SourceMilestoneId,
} from "./model";
import { deepFreeze, hasOwn, type DeepReadonly } from "./registry";

export interface SourceMilestoneRecord {
  id: SourceMilestoneId;
  lessonId: "reductions-scans" | "lds-barriers-atomics";
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
] satisfies SourceMilestoneId[]);

const sourceMilestoneRecords = deepFreeze({
  "wave64-collectives-source-v1": {
    id: "wave64-collectives-source-v1",
    lessonId: "reductions-scans",
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
    claim: "source-model-verified",
    authority: "source-model-only",
    commit: record.commit,
    tree: record.tree,
    commands: [...record.commands],
    sourcePaths: [...record.sourcePaths],
    target: record.target,
    note: "Exact public source/model milestone; no executable GPU authority.",
  };
}

export function sourceMilestoneClaim(id: SourceMilestoneId): Claim {
  const record = sourceMilestoneRecord(id);
  return {
    kind: "source-model-verified",
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
