import publicationGate from "../../config/publication-gate.json";
import { currentState } from "./current-state";
import { FE2O3_PIN, type StagedEvidenceId } from "./model";
import {
  resolveProgressNarrative,
  SAFE_PROGRESS_DETAIL,
  validateProgressNarrativeRegistry,
} from "./progress-narrative-registry";
import type { ProgressNarrativeId } from "./progress-narrative-policy";
import { deepFreeze, hasOwn } from "./registry";
import {
  completedIssue94IncrementRecord,
  isStagedEvidenceId,
  protectedSlice1HardwareObservation,
  stagedEvidenceDetail,
  stagedEvidenceRecord,
  validateStagedEvidenceCatalog,
} from "./staged-evidence";

export type DeliveryGate = "complete" | "partial" | "blocked" | "planned";

export interface KernelProgress {
  id: string;
  kernel: string;
  run: DeliveryGate;
  verify: DeliveryGate;
  evidence: DeliveryGate;
  dependsOn: string[];
  next: string;
}

export const developmentCheckpointIds = deepFreeze([
  "eventual-public-main",
  "compiler-refactor-infrastructure",
  "worker-v2-ack-harness-isolation",
  "row-softmax-ordinary-source",
  "broker-durable-prepared-session",
  "generic-ci-sharding",
  "w0-host-link-closure-v1",
  "broker-v4-inert-foundation",
  "protected-service-descriptor-admission",
  "static-preexec-containment-foundation",
  "external-anchor-protocol-foundation",
  "w0b-host-link-rejection",
  "last-audited-public-baseline",
  "production-s09-rustc-invocation",
  "authenticated-verus-v2",
  "cargo-acknowledgement-repair",
  "formal-evidence-isolation-v11",
  "protected-evidence-publisher",
  "gfx942-scalar-control-flow",
  "collected-rust-scalar-admission",
  "gfx942-wave64-lds-reduction",
  "wave64-reviewed-source-structural-correspondence",
  "workgroup-sync-direct-finalization",
  "workgroup-sync-host-runtime",
  "workgroup-sync-protected-hardware",
  "row-softmax-release-checkpoint",
  "row-softmax-llvm-release",
  "flash-attention-compiler-admission",
  "flash-attention-direct-finalization",
  "flash-attention-upstream-reproducibility",
  "flash-attention-typed-runtime",
  "flash-attention-memory-proof",
  "moe-top2-compiler-admission",
  "moe-top2-direct-finalization",
  "moe-top2-typed-runtime",
  "moe-top2-memory-proof",
  "moe-expert-bounded-evidence",
  "scalar-gemm-v1",
  "scalar-gemm-proof-profile",
  "scalar-gemm-physical-effects",
  "tiled-gemm-layout-frontend",
  "tiled-gemm-source-bridge",
  "tiled-gemm-hardware-harness",
  "tiled-gemm-structural-admission",
  "tiled-gemm-lds-kernel-ir",
  "tiled-gemm-lds-verus",
  "tiled-gemm-lds-attributed-source",
  "tiled-gemm-lds-machine-inspection",
  "tiled-gemm-lds-kphase-model",
  "tiled-gemm-lds-hardware-observation",
  "tiled-gemm-lds-k32-machine-inspection",
  "tiled-gemm-lds-wg64-contract",
  "tiled-gemm-lds-grid-stride-model",
  "tiled-gemm-lds-source-ir-correspondence",
  "tiled-gemm-lds-grid-machine-inspection",
  "tiled-gemm-lds-edge-kernel-ir",
  "tiled-gemm-lds-edge-machine-inspection",
  "tiled-gemm-lds-source-model-correspondence",
  "tiled-gemm-lds-matrix-wire-v5",
  "tiled-gemm-lds-inert-worker-handoff",
  "tiled-gemm-lds-sealed-profile-registry",
] as const);

export type DevelopmentCheckpointId =
  (typeof developmentCheckpointIds)[number];

interface DevelopmentCheckpointBase {
  id: DevelopmentCheckpointId;
  name: string;
  commit: string;
  state: "public" | "acceptance" | "repair" | "queued" | "rejected";
}

export interface NarrativeDevelopmentCheckpoint
  extends DevelopmentCheckpointBase {
  kind: "narrative";
  narrativeId: ProgressNarrativeId;
  detail?: never;
  stagedEvidenceIds?: never;
}

export interface PublicationGateDevelopmentCheckpoint
  extends DevelopmentCheckpointBase {
  kind: "publication-gate";
  detail?: never;
  stagedEvidenceIds?: never;
}

export interface StagedEvidenceDevelopmentCheckpoint
  extends DevelopmentCheckpointBase {
  kind: "staged-evidence";
  detail?: never;
  stagedEvidenceIds: StagedEvidenceId[];
}

export type DevelopmentCheckpoint =
  | NarrativeDevelopmentCheckpoint
  | PublicationGateDevelopmentCheckpoint
  | StagedEvidenceDevelopmentCheckpoint;

export const progressSnapshot = {
  reviewedOn: currentState.reviewedOn,
  auditedCommit: FE2O3_PIN.commit,
  lastAuditedPublicCommit: "96b9890c3ad33ad8c6b4239a9b567728a176d65f",
  lastAuditedPublicTree: "f911f0c693238830ad6070b2674fb863857bfec1",
  eventualPublicCommit: publicationGate.requiredCommit,
  eventualPublicTree: publicationGate.requiredTree,
  publicationGate: {
    state: "deployment-gated-contained-object",
    requiredCommit: publicationGate.requiredCommit,
    requiredTree: publicationGate.requiredTree,
    requiredRefRelationship: publicationGate.requiredRefRelationship,
    requiredRefs: publicationGate.requiredRefs.map(
      ({ repository, ref }) => `${repository}@${ref}`,
    ),
    requirement:
      "Deployment requires both public refs to contain the exact required commit, whose tree must match the required tree; rewritten, deleted, or divergent histories fail closed.",
  },
  repositories: publicationGate.requiredRefs.map(
    ({ repository }) => `https://github.com/${repository}`,
  ),
  completedIssue94Increments: {
    finalizationCommit: completedIssue94IncrementRecord(
      "tiled-lds-direct-finalization-v1",
    ).commit,
    hostAdapterCommit: completedIssue94IncrementRecord(
      "tiled-lds-host-adapter-v1",
    ).commit,
    protectedLifecycleCommit: completedIssue94IncrementRecord(
      "tiled-lds-protected-lifecycle-v1",
    ).commit,
  },
  protectedLifecycle: {
    issue: 100,
    state: "bounded-protected-hardware-observed",
    stages: [
      "Joined",
      "Loaded",
      "Completed",
      "Unloaded",
    ],
    realProtectedHardwareMeasurement: true,
    target: protectedSlice1HardwareObservation.target,
    hsaXnack: protectedSlice1HardwareObservation.hsaXnack,
    outputs: protectedSlice1HardwareObservation.outputs,
    maxAbsError: protectedSlice1HardwareObservation.maxAbsError,
    marker: protectedSlice1HardwareObservation.marker,
  },
} as const;

export const tiledGemmV1Commits = {
  sourceBridge: stagedEvidenceRecord("tiled-source-bridge-v1").commit,
  hardwareEvidence: stagedEvidenceRecord("tiled-hardware-harness-v1").commit,
  structuralAdmission: stagedEvidenceRecord(
    "tiled-structural-admission-v1",
  ).commit,
  ldsKernelIr: stagedEvidenceRecord("tiled-lds-kernel-ir-v1").commit,
  ldsVerus: stagedEvidenceRecord("tiled-lds-verus-v1").commit,
  ldsAttributedSource: stagedEvidenceRecord(
    "tiled-lds-attributed-source-v1",
  ).commit,
  ldsMachineInspection: stagedEvidenceRecord(
    "tiled-lds-machine-inspection-v1",
  ).commit,
  ldsKphaseModel: stagedEvidenceRecord("tiled-lds-kphase-model-v2").commit,
  ldsHardwareObservation: stagedEvidenceRecord(
    "tiled-lds-hardware-observation-v1",
  ).commit,
  ldsK32MachineInspection: stagedEvidenceRecord(
    "tiled-lds-k32-machine-inspection-v2",
  ).commit,
  ldsWg64Contract: stagedEvidenceRecord(
    "tiled-lds-wg64-contract-v1",
  ).commit,
  ldsGridStrideModel: stagedEvidenceRecord(
    "tiled-lds-grid-stride-model-v3",
  ).commit,
  ldsSourceIrCorrespondence: stagedEvidenceRecord(
    "tiled-lds-source-ir-correspondence-v1",
  ).commit,
  ldsGridMachineInspection: stagedEvidenceRecord(
    "tiled-lds-grid-machine-inspection-v3",
  ).commit,
  ldsEdgeKernelIr: stagedEvidenceRecord(
    "tiled-lds-edge-kernel-ir-v4",
  ).commit,
  ldsEdgeMachineInspection: stagedEvidenceRecord(
    "tiled-lds-edge-machine-inspection-v4",
  ).commit,
  ldsSourceModelCorrespondence: stagedEvidenceRecord(
    "tiled-lds-source-model-correspondence-v1",
  ).commit,
  ldsMatrixWireV5: stagedEvidenceRecord("tiled-lds-matrix-wire-v5").commit,
  ldsInertWorkerHandoff: stagedEvidenceRecord(
    "tiled-lds-inert-worker-handoff-v1",
  ).commit,
  ldsSealedProfileRegistry: stagedEvidenceRecord(
    "tiled-lds-sealed-profile-registry-v1",
  ).commit,
  ldsDirectFinalization: completedIssue94IncrementRecord(
    "tiled-lds-direct-finalization-v1",
  ).commit,
  ldsHostAdapter: completedIssue94IncrementRecord(
    "tiled-lds-host-adapter-v1",
  ).commit,
  ldsProtectedLifecycle: completedIssue94IncrementRecord(
    "tiled-lds-protected-lifecycle-v1",
  ).commit,
} as const;

type DevelopmentCheckpointSpec =
  | { kind: "narrative"; narrativeId: ProgressNarrativeId }
  | { kind: "publication-gate"; commit: string }
  | {
      kind: "staged-evidence";
      commit: string;
      evidenceIds: readonly StagedEvidenceId[];
    };

const developmentCheckpointSpecs = deepFreeze({
  "eventual-public-main": {
    kind: "publication-gate",
    commit: progressSnapshot.eventualPublicCommit,
  },
  "compiler-refactor-infrastructure": {
    kind: "narrative",
    narrativeId: "progress/compiler-refactor-infrastructure",
  },
  "worker-v2-ack-harness-isolation": {
    kind: "narrative",
    narrativeId: "progress/worker-v2-ack-harness-isolation",
  },
  "row-softmax-ordinary-source": {
    kind: "narrative",
    narrativeId: "progress/row-softmax-ordinary-source",
  },
  "broker-durable-prepared-session": {
    kind: "narrative",
    narrativeId: "progress/broker-durable-prepared-session",
  },
  "generic-ci-sharding": {
    kind: "narrative",
    narrativeId: "progress/generic-ci-sharding",
  },
  "w0-host-link-closure-v1": {
    kind: "narrative",
    narrativeId: "progress/w0-host-link-closure-v1",
  },
  "broker-v4-inert-foundation": {
    kind: "narrative",
    narrativeId: "progress/broker-v4-inert-foundation",
  },
  "protected-service-descriptor-admission": {
    kind: "narrative",
    narrativeId: "progress/protected-service-descriptor-admission",
  },
  "static-preexec-containment-foundation": {
    kind: "narrative",
    narrativeId: "progress/static-preexec-containment-foundation",
  },
  "external-anchor-protocol-foundation": {
    kind: "narrative",
    narrativeId: "progress/external-anchor-protocol-foundation",
  },
  "w0b-host-link-rejection": {
    kind: "narrative",
    narrativeId: "progress/w0b-host-link-rejection",
  },
  "last-audited-public-baseline": {
    kind: "narrative",
    narrativeId: "progress/last-audited-public-baseline",
  },
  "production-s09-rustc-invocation": {
    kind: "narrative",
    narrativeId: "progress/production-s09-rustc-invocation",
  },
  "authenticated-verus-v2": {
    kind: "narrative",
    narrativeId: "progress/authenticated-verus-v2",
  },
  "cargo-acknowledgement-repair": {
    kind: "narrative",
    narrativeId: "progress/cargo-acknowledgement-repair",
  },
  "formal-evidence-isolation-v11": {
    kind: "narrative",
    narrativeId: "progress/formal-evidence-isolation-v11",
  },
  "protected-evidence-publisher": {
    kind: "narrative",
    narrativeId: "progress/protected-evidence-publisher",
  },
  "gfx942-scalar-control-flow": {
    kind: "narrative",
    narrativeId: "progress/gfx942-scalar-control-flow",
  },
  "collected-rust-scalar-admission": {
    kind: "narrative",
    narrativeId: "progress/collected-rust-scalar-admission",
  },
  "gfx942-wave64-lds-reduction": {
    kind: "narrative",
    narrativeId: "progress/gfx942-wave64-lds-reduction",
  },
  "wave64-reviewed-source-structural-correspondence": {
    kind: "narrative",
    narrativeId: "progress/wave64-reviewed-source-structural-correspondence",
  },
  "workgroup-sync-direct-finalization": {
    kind: "narrative",
    narrativeId: "progress/workgroup-sync-direct-finalization",
  },
  "workgroup-sync-host-runtime": {
    kind: "narrative",
    narrativeId: "progress/workgroup-sync-host-runtime",
  },
  "workgroup-sync-protected-hardware": {
    kind: "narrative",
    narrativeId: "progress/workgroup-sync-protected-hardware",
  },
  "row-softmax-release-checkpoint": {
    kind: "narrative",
    narrativeId: "progress/row-softmax-release-checkpoint",
  },
  "row-softmax-llvm-release": {
    kind: "narrative",
    narrativeId: "progress/row-softmax-llvm-release",
  },
  "flash-attention-compiler-admission": {
    kind: "narrative",
    narrativeId: "progress/flash-attention-compiler-admission",
  },
  "flash-attention-direct-finalization": {
    kind: "narrative",
    narrativeId: "progress/flash-attention-direct-finalization",
  },
  "flash-attention-upstream-reproducibility": {
    kind: "narrative",
    narrativeId: "progress/flash-attention-upstream-reproducibility",
  },
  "flash-attention-typed-runtime": {
    kind: "narrative",
    narrativeId: "progress/flash-attention-typed-runtime",
  },
  "flash-attention-memory-proof": {
    kind: "narrative",
    narrativeId: "progress/flash-attention-memory-proof",
  },
  "moe-top2-compiler-admission": {
    kind: "narrative",
    narrativeId: "progress/moe-top2-compiler-admission",
  },
  "moe-top2-direct-finalization": {
    kind: "narrative",
    narrativeId: "progress/moe-top2-direct-finalization",
  },
  "moe-top2-typed-runtime": {
    kind: "narrative",
    narrativeId: "progress/moe-top2-typed-runtime",
  },
  "moe-top2-memory-proof": {
    kind: "narrative",
    narrativeId: "progress/moe-top2-memory-proof",
  },
  "moe-expert-bounded-evidence": {
    kind: "narrative",
    narrativeId: "progress/moe-expert-bounded-evidence",
  },
  "scalar-gemm-v1": {
    kind: "narrative",
    narrativeId: "progress/scalar-gemm-v1",
  },
  "scalar-gemm-proof-profile": {
    kind: "narrative",
    narrativeId: "progress/scalar-gemm-proof-profile",
  },
  "scalar-gemm-physical-effects": {
    kind: "narrative",
    narrativeId: "progress/scalar-gemm-physical-effects",
  },
  "tiled-gemm-layout-frontend": {
    kind: "narrative",
    narrativeId: "progress/tiled-gemm-layout-frontend",
  },
  "tiled-gemm-source-bridge": {
    kind: "staged-evidence",
    commit: tiledGemmV1Commits.sourceBridge,
    evidenceIds: [
      "tiled-source-bridge-v1",
      "tiled-cargo-metadata-v1",
      "tiled-cargo-root-v1",
    ],
  },
  "tiled-gemm-hardware-harness": {
    kind: "staged-evidence",
    commit: tiledGemmV1Commits.hardwareEvidence,
    evidenceIds: ["tiled-hardware-harness-v1"],
  },
  "tiled-gemm-structural-admission": {
    kind: "staged-evidence",
    commit: tiledGemmV1Commits.structuralAdmission,
    evidenceIds: ["tiled-structural-admission-v1"],
  },
  "tiled-gemm-lds-kernel-ir": {
    kind: "staged-evidence",
    commit: tiledGemmV1Commits.ldsKernelIr,
    evidenceIds: ["tiled-lds-kernel-ir-v1"],
  },
  "tiled-gemm-lds-verus": {
    kind: "staged-evidence",
    commit: tiledGemmV1Commits.ldsVerus,
    evidenceIds: ["tiled-lds-verus-v1"],
  },
  "tiled-gemm-lds-attributed-source": {
    kind: "staged-evidence",
    commit: tiledGemmV1Commits.ldsAttributedSource,
    evidenceIds: ["tiled-lds-attributed-source-v1"],
  },
  "tiled-gemm-lds-machine-inspection": {
    kind: "staged-evidence",
    commit: tiledGemmV1Commits.ldsMachineInspection,
    evidenceIds: ["tiled-lds-machine-inspection-v1"],
  },
  "tiled-gemm-lds-kphase-model": {
    kind: "staged-evidence",
    commit: tiledGemmV1Commits.ldsKphaseModel,
    evidenceIds: ["tiled-lds-kphase-model-v2"],
  },
  "tiled-gemm-lds-hardware-observation": {
    kind: "staged-evidence",
    commit: tiledGemmV1Commits.ldsHardwareObservation,
    evidenceIds: ["tiled-lds-hardware-observation-v1"],
  },
  "tiled-gemm-lds-k32-machine-inspection": {
    kind: "staged-evidence",
    commit: tiledGemmV1Commits.ldsK32MachineInspection,
    evidenceIds: ["tiled-lds-k32-machine-inspection-v2"],
  },
  "tiled-gemm-lds-wg64-contract": {
    kind: "staged-evidence",
    commit: tiledGemmV1Commits.ldsWg64Contract,
    evidenceIds: ["tiled-lds-wg64-contract-v1"],
  },
  "tiled-gemm-lds-grid-stride-model": {
    kind: "staged-evidence",
    commit: tiledGemmV1Commits.ldsGridStrideModel,
    evidenceIds: ["tiled-lds-grid-stride-model-v3"],
  },
  "tiled-gemm-lds-source-ir-correspondence": {
    kind: "staged-evidence",
    commit: tiledGemmV1Commits.ldsSourceIrCorrespondence,
    evidenceIds: ["tiled-lds-source-ir-correspondence-v1"],
  },
  "tiled-gemm-lds-grid-machine-inspection": {
    kind: "staged-evidence",
    commit: tiledGemmV1Commits.ldsGridMachineInspection,
    evidenceIds: ["tiled-lds-grid-machine-inspection-v3"],
  },
  "tiled-gemm-lds-edge-kernel-ir": {
    kind: "staged-evidence",
    commit: tiledGemmV1Commits.ldsEdgeKernelIr,
    evidenceIds: ["tiled-lds-edge-kernel-ir-v4"],
  },
  "tiled-gemm-lds-edge-machine-inspection": {
    kind: "staged-evidence",
    commit: tiledGemmV1Commits.ldsEdgeMachineInspection,
    evidenceIds: ["tiled-lds-edge-machine-inspection-v4"],
  },
  "tiled-gemm-lds-source-model-correspondence": {
    kind: "staged-evidence",
    commit: tiledGemmV1Commits.ldsSourceModelCorrespondence,
    evidenceIds: ["tiled-lds-source-model-correspondence-v1"],
  },
  "tiled-gemm-lds-matrix-wire-v5": {
    kind: "staged-evidence",
    commit: tiledGemmV1Commits.ldsMatrixWireV5,
    evidenceIds: ["tiled-lds-matrix-wire-v5"],
  },
  "tiled-gemm-lds-inert-worker-handoff": {
    kind: "staged-evidence",
    commit: tiledGemmV1Commits.ldsInertWorkerHandoff,
    evidenceIds: ["tiled-lds-inert-worker-handoff-v1"],
  },
  "tiled-gemm-lds-sealed-profile-registry": {
    kind: "staged-evidence",
    commit: tiledGemmV1Commits.ldsSealedProfileRegistry,
    evidenceIds: ["tiled-lds-sealed-profile-registry-v1"],
  },
} satisfies Record<DevelopmentCheckpointId, DevelopmentCheckpointSpec>);

export const developmentCheckpoints = deepFreeze([
  {
    id: "eventual-public-main",
    kind: "publication-gate",
    name: "Published implementation snapshot (publication gated)",
    commit: progressSnapshot.eventualPublicCommit,
    state: "public",
  },
  {
    id: "compiler-refactor-infrastructure",
    kind: "narrative",
    name: "Pliron ownership and device identity at 2f7c4fd1d",
    commit: "2f7c4fd1dfef7b9056caab0880700e3da7eeef03",
    state: "public",
    narrativeId: "progress/compiler-refactor-infrastructure",
  },
  {
    id: "worker-v2-ack-harness-isolation",
    kind: "narrative",
    name: "Worker V2 ACK harness isolation",
    commit: "c703eaa271040b7c297e0d3b9ea8cc9fa470f327",
    state: "public",
    narrativeId: "progress/worker-v2-ack-harness-isolation",
  },
  {
    id: "row-softmax-ordinary-source",
    kind: "narrative",
    name: "Row-softmax ordinary attributed source",
    commit: "f4dcafb8b95345a5203a7f2c9886f9600345405f",
    state: "public",
    narrativeId: "progress/row-softmax-ordinary-source",
  },
  {
    id: "broker-durable-prepared-session",
    kind: "narrative",
    name: "Durable broker prepared-session foundation",
    commit: "7139ccfd01e0ab8b0fc521613ac4356134d2e0c5",
    state: "public",
    narrativeId: "progress/broker-durable-prepared-session",
  },
  {
    id: "generic-ci-sharding",
    kind: "narrative",
    name: "Deterministic generic CI sharding",
    commit: "5a3f057b915b0cb21c3a0ac54094fd7e5e5ce6a4",
    state: "public",
    narrativeId: "progress/generic-ci-sharding",
  },
  {
    id: "w0-host-link-closure-v1",
    kind: "narrative",
    name: "Accepted W0/G1 static host-link boundary",
    commit: "9f40bbff39156f8b5f05868377ee12a2c4f74207",
    state: "public",
    narrativeId: "progress/w0-host-link-closure-v1",
  },
  {
    id: "broker-v4-inert-foundation",
    kind: "narrative",
    name: "Inert Broker V4 protocol foundation",
    commit: "66393d3ca7a6805633ed94e12c707a6d22bdf1ad",
    state: "public",
    narrativeId: "progress/broker-v4-inert-foundation",
  },
  {
    id: "protected-service-descriptor-admission",
    kind: "narrative",
    name: "Inert protected-service descriptor admission",
    commit: "b8daeb2bc953924a424542820bed566e52d57290",
    state: "public",
    narrativeId: "progress/protected-service-descriptor-admission",
  },
  {
    id: "static-preexec-containment-foundation",
    kind: "narrative",
    name: "Accepted static pre-exec containment foundation",
    commit: "4aed8d4d394783362e289a558b6d94cc28ecda36",
    state: "public",
    narrativeId: "progress/static-preexec-containment-foundation",
  },
  {
    id: "external-anchor-protocol-foundation",
    kind: "narrative",
    name: "Bounded external anti-rollback anchor protocol",
    commit: "4639ff36c8651a859495da86ea2c75e735377440",
    state: "public",
    narrativeId: "progress/external-anchor-protocol-foundation",
  },
  {
    id: "w0b-host-link-rejection",
    kind: "narrative",
    name: "Rejected W0-B static host-link candidate",
    commit: "2e5ad53bcb20f2a46e91128a42e838d918d61581",
    state: "rejected",
    narrativeId: "progress/w0b-host-link-rejection",
  },
  {
    id: "last-audited-public-baseline",
    kind: "narrative",
    name: "Historical audited public baseline",
    commit: progressSnapshot.lastAuditedPublicCommit,
    state: "public",
    narrativeId: "progress/last-audited-public-baseline",
  },
  {
    id: "production-s09-rustc-invocation",
    kind: "narrative",
    name: "Production S09 rustc invocation capture",
    commit: progressSnapshot.lastAuditedPublicCommit,
    state: "public",
    narrativeId: "progress/production-s09-rustc-invocation",
  },
  {
    id: "authenticated-verus-v2",
    kind: "narrative",
    name: "Authenticated Verus execution V2",
    commit: "b704651757a3d46801144277e025f68153cb1ba9",
    state: "public",
    narrativeId: "progress/authenticated-verus-v2",
  },
  {
    id: "cargo-acknowledgement-repair",
    kind: "narrative",
    name: "Cargo acknowledgement repair",
    commit: "4bd1be0d6325d3946075904d653222aa9c81eebd",
    state: "public",
    narrativeId: "progress/cargo-acknowledgement-repair",
  },
  {
    id: "formal-evidence-isolation-v11",
    kind: "narrative",
    name: "Formal evidence isolation V11",
    commit: "1265afc07aed232a24dd055b56dda8d35446f577",
    state: "repair",
    narrativeId: "progress/formal-evidence-isolation-v11",
  },
  {
    id: "protected-evidence-publisher",
    kind: "narrative",
    name: "Protected evidence publisher",
    commit: "85a38372d74873cb84e2d6d55eed66fd98e5904b",
    state: "public",
    narrativeId: "progress/protected-evidence-publisher",
  },
  {
    id: "gfx942-scalar-control-flow",
    kind: "narrative",
    name: "gfx942 scalar control flow",
    commit: "54ae9ff671b041205434aec80ab2b9a5979d0fa7",
    state: "repair",
    narrativeId: "progress/gfx942-scalar-control-flow",
  },
  {
    id: "collected-rust-scalar-admission",
    kind: "narrative",
    name: "Collected Rust scalar admission",
    commit: "54ae9ff671b041205434aec80ab2b9a5979d0fa7",
    state: "repair",
    narrativeId: "progress/collected-rust-scalar-admission",
  },
  {
    id: "gfx942-wave64-lds-reduction",
    kind: "narrative",
    name: "gfx942 Wave64 bounded source-model/KIR correspondence",
    commit: "43bd2a602b2ceb5a7079f85445dacd6dc8fe73c4",
    state: "public",
    narrativeId: "progress/gfx942-wave64-lds-reduction",
  },
  {
    id: "wave64-reviewed-source-structural-correspondence",
    kind: "narrative",
    name: "Wave64 reviewed attributed-source structural correspondence",
    commit: "e874da2083c2a1eb192048ea5f88a053c28d0ee2",
    state: "public",
    narrativeId: "progress/wave64-reviewed-source-structural-correspondence",
  },
  {
    id: "workgroup-sync-direct-finalization",
    kind: "narrative",
    name: "Workgroup synchronization direct finalization",
    commit: "3d673ffb9a962d7c4b8ae7526bbe881260e19c72",
    state: "public",
    narrativeId: "progress/workgroup-sync-direct-finalization",
  },
  {
    id: "workgroup-sync-host-runtime",
    kind: "narrative",
    name: "Workgroup synchronization typed host/runtime",
    commit: "51751e48812d6428627b8d403be72d24558175b5",
    state: "public",
    narrativeId: "progress/workgroup-sync-host-runtime",
  },
  {
    id: "workgroup-sync-protected-hardware",
    kind: "narrative",
    name: "Workgroup synchronization protected gfx942 observation",
    commit: "4138e034b7ee9f457d9b63b4d54bdc623d0c8046",
    state: "public",
    narrativeId: "progress/workgroup-sync-protected-hardware",
  },
  {
    id: "row-softmax-release-checkpoint",
    kind: "narrative",
    name: "Row-softmax historical 25-pin release checkpoint",
    commit: "aca28306fe89c036dc0129349ef9ed685a43c7bb",
    state: "public",
    narrativeId: "progress/row-softmax-release-checkpoint",
  },
  {
    id: "row-softmax-llvm-release",
    kind: "narrative",
    name: "Row-softmax LLVM release pair",
    commit: "fd89390788adc5670c54ecc2517b9720f2f80113",
    state: "public",
    narrativeId: "progress/row-softmax-llvm-release",
  },
  {
    id: "flash-attention-compiler-admission",
    kind: "narrative",
    name: "FlashAttention exact compiler admission",
    commit: "bfc32b51314e75e4d619eda244e0d78573f1232c",
    state: "public",
    narrativeId: "progress/flash-attention-compiler-admission",
  },
  {
    id: "flash-attention-direct-finalization",
    kind: "narrative",
    name: "FlashAttention exact direct finalization",
    commit: "0b8ddf138d5420b90a61463ade8d612eb7101090",
    state: "public",
    narrativeId: "progress/flash-attention-direct-finalization",
  },
  {
    id: "flash-attention-upstream-reproducibility",
    kind: "narrative",
    name: "FlashAttention exact upstream LLVM machine reproducibility",
    commit: "c1aecbb11017125e84209a333d978ec6d5bdddb1",
    state: "public",
    narrativeId: "progress/flash-attention-upstream-reproducibility",
  },
  {
    id: "flash-attention-typed-runtime",
    kind: "narrative",
    name: "FlashAttention exact typed host/runtime mechanics",
    commit: "26c80737e3380cd73df21d9a8abd1838cdfa76bc",
    state: "public",
    narrativeId: "progress/flash-attention-typed-runtime",
  },
  {
    id: "flash-attention-memory-proof",
    kind: "narrative",
    name: "FlashAttention exact bounded memory/effect proof",
    commit: "182d5673327bdbf642e3328a50903a4607a1756c",
    state: "public",
    narrativeId: "progress/flash-attention-memory-proof",
  },
  {
    id: "moe-top2-compiler-admission",
    kind: "narrative",
    name: "MoE top-2 exact compiler admission",
    commit: "40e04f8e8469f37d3e9c4fcfcb23bd5ab6d1536e",
    state: "public",
    narrativeId: "progress/moe-top2-compiler-admission",
  },
  {
    id: "moe-top2-direct-finalization",
    kind: "narrative",
    name: "MoE top-2 exact direct finalization",
    commit: "8926b3f725a9cb6a15bc8f43f019af1afffc6c1c",
    state: "public",
    narrativeId: "progress/moe-top2-direct-finalization",
  },
  {
    id: "moe-top2-typed-runtime",
    kind: "narrative",
    name: "MoE top-2 exact typed host/runtime mechanics",
    commit: "b1302940e9f7bc1cdcd58709a5d716bc2404df97",
    state: "public",
    narrativeId: "progress/moe-top2-typed-runtime",
  },
  {
    id: "moe-top2-memory-proof",
    kind: "narrative",
    name: "MoE top-2 exact bounded memory/effect proof",
    commit: "d9ee4d09a97e59982b5e9ccf2e3877fff84fab5b",
    state: "public",
    narrativeId: "progress/moe-top2-memory-proof",
  },
  {
    id: "moe-expert-bounded-evidence",
    kind: "narrative",
    name: "MoE expert bounded V2 integrated checkpoint",
    commit: "43bd2a602b2ceb5a7079f85445dacd6dc8fe73c4",
    state: "public",
    narrativeId: "progress/moe-expert-bounded-evidence",
  },
  {
    id: "scalar-gemm-v1",
    kind: "narrative",
    name: "Scalar GEMM V1 vertical slice",
    commit: progressSnapshot.lastAuditedPublicCommit,
    state: "public",
    narrativeId: "progress/scalar-gemm-v1",
  },
  {
    id: "scalar-gemm-proof-profile",
    kind: "narrative",
    name: "Scalar GEMM proof profile",
    commit: "c223325ed437eebd9d382d0342cb35a01a17605e",
    state: "acceptance",
    narrativeId: "progress/scalar-gemm-proof-profile",
  },
  {
    id: "scalar-gemm-physical-effects",
    kind: "narrative",
    name: "Scalar GEMM physical-effect profile",
    commit: progressSnapshot.lastAuditedPublicCommit,
    state: "acceptance",
    narrativeId: "progress/scalar-gemm-physical-effects",
  },
  {
    id: "tiled-gemm-layout-frontend",
    kind: "narrative",
    name: "Tiled GEMM V1 layout and frontend foundations",
    commit: "286331aab8639dd3707e55cdf51a83f8854d26a5",
    state: "public",
    narrativeId: "progress/tiled-gemm-layout-frontend",
  },
  {
    id: "tiled-gemm-source-bridge",
    kind: "staged-evidence",
    name: "Tiled GEMM V1 source-authenticated compiler bridge",
    commit: tiledGemmV1Commits.sourceBridge,
    state: "acceptance",
    stagedEvidenceIds: [
      "tiled-source-bridge-v1",
      "tiled-cargo-metadata-v1",
      "tiled-cargo-root-v1",
    ],
  },
  {
    id: "tiled-gemm-hardware-harness",
    kind: "staged-evidence",
    name: "Tiled GEMM V1 guarded gfx942 hardware observation",
    commit: tiledGemmV1Commits.hardwareEvidence,
    state: "public",
    stagedEvidenceIds: ["tiled-hardware-harness-v1"],
  },
  {
    id: "tiled-gemm-structural-admission",
    kind: "staged-evidence",
    name: "Tiled GEMM V1 structural artifact admission",
    commit: tiledGemmV1Commits.structuralAdmission,
    state: "public",
    stagedEvidenceIds: ["tiled-structural-admission-v1"],
  },
  {
    id: "tiled-gemm-lds-kernel-ir",
    kind: "staged-evidence",
    name: "Tiled GEMM LDS Slice 1 Kernel IR",
    commit: tiledGemmV1Commits.ldsKernelIr,
    state: "public",
    stagedEvidenceIds: ["tiled-lds-kernel-ir-v1"],
  },
  {
    id: "tiled-gemm-lds-verus",
    kind: "staged-evidence",
    name: "Tiled GEMM LDS Slice 1 Verus model",
    commit: tiledGemmV1Commits.ldsVerus,
    state: "public",
    stagedEvidenceIds: ["tiled-lds-verus-v1"],
  },
  {
    id: "tiled-gemm-lds-attributed-source",
    kind: "staged-evidence",
    name: "Tiled GEMM LDS Slice 1 attributed source",
    commit: tiledGemmV1Commits.ldsAttributedSource,
    state: "public",
    stagedEvidenceIds: ["tiled-lds-attributed-source-v1"],
  },
  {
    id: "tiled-gemm-lds-machine-inspection",
    kind: "staged-evidence",
    name: "Tiled GEMM LDS Slice 1 machine inspection",
    commit: tiledGemmV1Commits.ldsMachineInspection,
    state: "public",
    stagedEvidenceIds: ["tiled-lds-machine-inspection-v1"],
  },
  {
    id: "tiled-gemm-lds-kphase-model",
    kind: "staged-evidence",
    name: "Tiled GEMM LDS Slice 2 K-phase proof model",
    commit: tiledGemmV1Commits.ldsKphaseModel,
    state: "public",
    stagedEvidenceIds: ["tiled-lds-kphase-model-v2"],
  },
  {
    id: "tiled-gemm-lds-hardware-observation",
    kind: "staged-evidence",
    name: "Tiled GEMM LDS Slice 1 MI300X observation",
    commit: tiledGemmV1Commits.ldsHardwareObservation,
    state: "public",
    stagedEvidenceIds: ["tiled-lds-hardware-observation-v1"],
  },
  {
    id: "tiled-gemm-lds-k32-machine-inspection",
    kind: "staged-evidence",
    name: "Tiled GEMM LDS Slice 2 K32 machine inspection",
    commit: tiledGemmV1Commits.ldsK32MachineInspection,
    state: "public",
    stagedEvidenceIds: ["tiled-lds-k32-machine-inspection-v2"],
  },
  {
    id: "tiled-gemm-lds-wg64-contract",
    kind: "staged-evidence",
    name: "Tiled GEMM LDS macro-owned WG64 contract",
    commit: tiledGemmV1Commits.ldsWg64Contract,
    state: "public",
    stagedEvidenceIds: ["tiled-lds-wg64-contract-v1"],
  },
  {
    id: "tiled-gemm-lds-grid-stride-model",
    kind: "staged-evidence",
    name: "Tiled GEMM LDS Slice 3 grid and stride model",
    commit: tiledGemmV1Commits.ldsGridStrideModel,
    state: "public",
    stagedEvidenceIds: ["tiled-lds-grid-stride-model-v3"],
  },
  {
    id: "tiled-gemm-lds-source-ir-correspondence",
    kind: "staged-evidence",
    name: "Tiled GEMM LDS attributed source-to-IR correspondence",
    commit: tiledGemmV1Commits.ldsSourceIrCorrespondence,
    state: "public",
    stagedEvidenceIds: ["tiled-lds-source-ir-correspondence-v1"],
  },
  {
    id: "tiled-gemm-lds-grid-machine-inspection",
    kind: "staged-evidence",
    name: "Tiled GEMM LDS Slice 3 LLVM/COV6 inspection",
    commit: tiledGemmV1Commits.ldsGridMachineInspection,
    state: "public",
    stagedEvidenceIds: ["tiled-lds-grid-machine-inspection-v3"],
  },
  {
    id: "tiled-gemm-lds-edge-kernel-ir",
    kind: "staged-evidence",
    name: "Tiled GEMM LDS Slice 4 edge Kernel IR",
    commit: tiledGemmV1Commits.ldsEdgeKernelIr,
    state: "public",
    stagedEvidenceIds: ["tiled-lds-edge-kernel-ir-v4"],
  },
  {
    id: "tiled-gemm-lds-edge-machine-inspection",
    kind: "staged-evidence",
    name: "Tiled GEMM LDS Slice 4 LLVM/COV6 inspection",
    commit: tiledGemmV1Commits.ldsEdgeMachineInspection,
    state: "public",
    stagedEvidenceIds: ["tiled-lds-edge-machine-inspection-v4"],
  },
  {
    id: "tiled-gemm-lds-source-model-correspondence",
    kind: "staged-evidence",
    name: "Tiled GEMM LDS Slice 1 bounded source/model correspondence",
    commit: tiledGemmV1Commits.ldsSourceModelCorrespondence,
    state: "public",
    stagedEvidenceIds: ["tiled-lds-source-model-correspondence-v1"],
  },
  {
    id: "tiled-gemm-lds-matrix-wire-v5",
    kind: "staged-evidence",
    name: "Tiled GEMM LDS canonical matrix Kernel IR wire V5",
    commit: tiledGemmV1Commits.ldsMatrixWireV5,
    state: "public",
    stagedEvidenceIds: ["tiled-lds-matrix-wire-v5"],
  },
  {
    id: "tiled-gemm-lds-inert-worker-handoff",
    kind: "staged-evidence",
    name: "Tiled GEMM LDS attributed inert Worker V2 handoff",
    commit: tiledGemmV1Commits.ldsInertWorkerHandoff,
    state: "public",
    stagedEvidenceIds: ["tiled-lds-inert-worker-handoff-v1"],
  },
  {
    id: "tiled-gemm-lds-sealed-profile-registry",
    kind: "staged-evidence",
    name: "Tiled GEMM LDS sealed exact-profile registry",
    commit: tiledGemmV1Commits.ldsSealedProfileRegistry,
    state: "public",
    stagedEvidenceIds: ["tiled-lds-sealed-profile-registry-v1"],
  },
] satisfies DevelopmentCheckpoint[]);

const checkpointKeysByKind = {
  narrative: ["commit", "id", "kind", "name", "narrativeId", "state"],
  "publication-gate": ["commit", "id", "kind", "name", "state"],
  "staged-evidence": [
    "commit",
    "id",
    "kind",
    "name",
    "stagedEvidenceIds",
    "state",
  ],
} as const;

function checkpointPolicyIssues(checkpoint: unknown): string[] {
  if (!checkpoint || typeof checkpoint !== "object") {
    return ["checkpoint is not a policy object"];
  }
  const raw = checkpoint as Record<string, unknown>;
  const rawId = raw.id;
  if (
    typeof rawId !== "string" ||
    !hasOwn(developmentCheckpointSpecs, rawId)
  ) {
    return [`unknown development checkpoint id ${String(rawId)}`];
  }
  const id = rawId as DevelopmentCheckpointId;
  const expected = developmentCheckpointSpecs[id];
  const issues: string[] = [];
  if (raw.kind !== expected.kind) {
    issues.push(`${id} must retain canonical kind ${expected.kind}`);
  }
  if (
    JSON.stringify(Object.keys(raw).sort()) !==
    JSON.stringify(checkpointKeysByKind[expected.kind])
  ) {
    issues.push(`${id} fields do not match its canonical kind`);
  }
  if (typeof raw.commit !== "string" || !/^[0-9a-f]{40}$/u.test(raw.commit)) {
    issues.push(`${id} is not pinned to an exact commit`);
  }

  if (expected.kind === "narrative") {
    if (raw.narrativeId !== expected.narrativeId) {
      issues.push(`${id} does not bind its canonical progress narrative ID`);
    }
    if (!resolveProgressNarrative(raw.narrativeId)) {
      issues.push(`${id} has no valid frozen progress narrative`);
    }
  } else if (expected.kind === "publication-gate") {
    if (raw.commit !== expected.commit) {
      issues.push(`${id} does not bind its canonical publication commit`);
    }
  } else {
    const evidenceIds = Array.isArray(raw.stagedEvidenceIds)
      ? raw.stagedEvidenceIds
      : [];
    for (const evidenceId of evidenceIds) {
      if (!isStagedEvidenceId(evidenceId)) {
        issues.push(`${id} has unknown staged evidence id ${String(evidenceId)}`);
      }
    }
    if (raw.commit !== expected.commit) {
      issues.push(`${id} does not bind its canonical staged commit`);
    }
    if (
      evidenceIds.length !== expected.evidenceIds.length ||
      evidenceIds.some(
        (evidenceId, index) => evidenceId !== expected.evidenceIds[index],
      )
    ) {
      issues.push(`${id} must contain its complete canonical staged evidence IDs`);
    }
  }
  return issues;
}

export function developmentCheckpointDetail(
  checkpoint: unknown,
): string {
  if (checkpointPolicyIssues(checkpoint).length > 0) {
    return SAFE_PROGRESS_DETAIL;
  }
  const id = (checkpoint as { id: DevelopmentCheckpointId }).id;
  const expected = developmentCheckpointSpecs[id];
  if (expected.kind === "narrative") {
    return resolveProgressNarrative(expected.narrativeId) ?? SAFE_PROGRESS_DETAIL;
  }
  if (expected.kind === "staged-evidence") {
    try {
      return stagedEvidenceDetail(expected.evidenceIds);
    } catch {
      return SAFE_PROGRESS_DETAIL;
    }
  }
  return `This published compiler baseline is publication-gated. Both harsh-nod/fe2o3@refs/heads/main and powderluv/fe2o3@refs/heads/main must contain commit ${publicationGate.requiredCommit}, and that commit must have tree ${publicationGate.requiredTree}; the deployment workflow verifies the ancestry and immutable object identities.`;
}

export const kernelProgress: KernelProgress[] = [
  {
    id: "fill",
    kernel: "Fill",
    run: "complete",
    verify: "partial",
    evidence: "partial",
    dependsOn: [],
    next: "Replace the legacy raw host boundary and bind proof, artifact, and launch identities.",
  },
  {
    id: "vecadd",
    kernel: "Typed vector addition",
    run: "complete",
    verify: "partial",
    evidence: "partial",
    dependsOn: [],
    next: "Close floating-point refinement and publish protected end-to-end evidence.",
  },
  {
    id: "scalar-map",
    kernel: "Scalar and affine maps",
    run: "partial",
    verify: "partial",
    evidence: "partial",
    dependsOn: ["source-derived control flow"],
    next: "Accept and integrate the helper control-flow candidate, connect collected kernel entries, and add typed widening arithmetic profiles.",
  },
  {
    id: "wave-collectives",
    kernel: "Wave64 reduction and scan",
    run: "partial",
    verify: "partial",
    evidence: "partial",
    dependsOn: ["source-derived control flow", "wave intrinsics"],
    next: "Join the exact source-derived Kernel IR and direct upstream LLVM/LLD finalizer to a generated host/runtime lifecycle, protected gfx942 execution, and Verus-to-machine refinement.",
  },
  {
    id: "workgroup-reduction",
    kernel: "Workgroup LDS reduction",
    run: "partial",
    verify: "partial",
    evidence: "partial",
    dependsOn: ["wave reduction", "LDS ownership epochs", "uniform barriers"],
    next: "Keep the exact protected vectors pinned while closing source-to-Kernel-IR, Kernel-IR-to-LLVM/ISA, and Verus-to-machine refinement plus profile-specific illegal-access and race-freedom evidence.",
  },
  {
    id: "scalar-gemm",
    kernel: "Dynamic strided scalar GEMM",
    run: "partial",
    verify: "partial",
    evidence: "partial",
    dependsOn: [
      "protected artifact publication and currentness",
      "complete source-to-machine refinement",
      "dynamic safe LDS/MFMA optimization",
      "comparative performance evidence",
    ],
    next: "Retain the working generic qualification route while joining its artifact to protected publication and complete refinement; optimize through generic LDS/MFMA capabilities and measure against an equivalent HIP kernel separately.",
  },
  {
    id: "tiled-gemm",
    kernel: "gfx942 BF16/F32 tiled GEMM (exact Slice 1 functional)",
    run: "partial",
    verify: "partial",
    evidence: "partial",
    dependsOn: [
      "compiler-origin-authenticated source-to-HSACO binding",
      "production proof-certificate consumption (fe2o3 #91)",
      "K-phase, grid, and edge proof extension (fe2o3 #92)",
      "MIR-to-IR and IR-to-machine safety correspondence (fe2o3 #106 and #107)",
      "protected Slice 3 and Slice 4 execution (fe2o3 #88 and #89)",
      "general dimensions, strides, tails, and coefficients (fe2o3 #90)",
      "source and Verus-to-machine refinement",
    ],
    next: "Keep the promoted exact Slice 1 source, proof command, protected host command, and measured result pinned while binding that route to authenticated compiler origin, identity-bound proof certificates, and MIR/Kernel-IR/LLVM/ISA refinement; then carry Slice 3 and Slice 4 through protected execution and generalize the exact profiles.",
  },
  {
    id: "softmax",
    kernel: "Row softmax",
    run: "partial",
    verify: "partial",
    evidence: "partial",
    dependsOn: [
      "W1 broker-owned durable replay registry and session capability",
      "protected MI300X execution",
      "source, proof, and machine refinement",
      "numerical policy",
    ],
    next: "Complete W1 with a broker-owned durable replay registry, an unforgeable move-only session capability, and exact terminal transcript consumption; then consume the staged 25-pin receipt through the protected MI300X vector matrix and join source, proof, compiler, and machine refinement evidence.",
  },
  {
    id: "flash-attention",
    kernel: "Fixed-shape forward FlashAttention",
    run: "partial",
    verify: "partial",
    evidence: "partial",
    dependsOn: [
      "W1 durable replay/session authority and protected receipt injection",
      "protected MI300X execution and numerical comparison",
      "authenticated Verus execution receipt and proof consumption",
      "compiler, OCML, and source/model-to-machine refinement",
    ],
    next: "Complete W1 with broker-owned durable replay exclusion, an unforgeable move-only session capability, exact transcript binding, and atomic terminal consumption. Then consume the bounded memory/effect proof through a non-forgeable authenticated Verus receipt, inject the exact B1/H1/N8/D16 linear artifact receipt, run the protected MI300X vectors through the typed lifecycle, compare GPU output with the independent oracle, and join compiler, OCML, logical-address, and source/model-to-machine refinement evidence.",
  },
  {
    id: "moe-routing",
    kernel: "Deterministic top-2 MoE routing",
    run: "partial",
    verify: "partial",
    evidence: "partial",
    dependsOn: [
      "W1 durable replay/session authority and protected receipt injection",
      "protected MI300X routing vectors and GPU/oracle comparison",
      "authenticated Verus execution receipt and proof consumption",
      "IEEE FP32, compiler, and model-to-machine refinement",
    ],
    next: "Complete W1 with broker-owned durable replay exclusion, an unforgeable move-only session capability, exact transcript binding, and atomic terminal consumption. Then consume the bounded memory/effect proof through a non-forgeable authenticated Verus receipt, inject the opaque T8/E4/K2/C4 artifact receipt, run protected MI300X routing vectors through the typed lifecycle, compare all seven GPU outputs with the independent oracle, and join IEEE FP32, compiler, logical-address, and model-to-machine refinement evidence.",
  },
  {
    id: "moe-experts",
    kernel: "MoE expert GEMM and combine",
    run: "partial",
    verify: "partial",
    evidence: "partial",
    dependsOn: [
      "authenticated router completion and device readback provenance",
      "logits-to-top2, route-weight, and packed-activation joins",
      "freshness and replay authority",
      "exact compiler admission and upstream LLVM/LLD finalization",
      "typed four-expert dispatch and combine runtime",
      "protected gfx942 execution and GPU/oracle comparison",
      "authenticated proof consumption and source/model-to-machine refinement",
      "BF16/F32 numerical refinement",
    ],
    next: "Promote the exact compact-plan proof and host bridge only after binding authenticated router completion/readback, logits-to-top2 selection, route weights, packed activations, and freshness/replay. Then carry the expert GEMM and combine sources through compiler admission, direct upstream LLVM/LLD finalization, typed multi-dispatch runtime, protected MI300X execution, and GPU/oracle comparison; keep grouped or persistent scheduling as a separate profile.",
  },
];

export const gateLabels: Record<
  DeliveryGate,
  { label: string; description: string }
> = {
  complete: {
    label: "Complete",
    description: "The kernel-specific gate is closed at the stated public baseline.",
  },
  partial: {
    label: "Partial",
    description: "Relevant mechanics exist, but the complete kernel gate is not closed.",
  },
  blocked: {
    label: "Blocked",
    description: "A named compiler, verifier, runtime, or kernel dependency is missing.",
  },
  planned: {
    label: "Planned",
    description: "The acceptance contract is known; implementation evidence is not yet present.",
  },
};

export function validateProgress(
  checkpoints: readonly unknown[] = developmentCheckpoints,
): string[] {
  const issues: string[] = [
    ...validateStagedEvidenceCatalog().map(
      (issue) => `staged evidence: ${issue}`,
    ),
    ...validateProgressNarrativeRegistry().map(
      (issue) => `progress narrative: ${issue}`,
    ),
  ];
  const ids = new Set<string>();
  const exactCommit = /^[0-9a-f]{40}$/;

  if (!exactCommit.test(progressSnapshot.lastAuditedPublicCommit)) {
    issues.push("last audited public commit is not an exact Git object name");
  }
  if (!exactCommit.test(progressSnapshot.lastAuditedPublicTree)) {
    issues.push("last audited public tree is not an exact Git object name");
  }
  if (!exactCommit.test(progressSnapshot.eventualPublicCommit)) {
    issues.push("eventual public commit is not an exact Git object name");
  }
  if (!exactCommit.test(progressSnapshot.eventualPublicTree)) {
    issues.push("eventual public tree is not an exact Git object name");
  }
  if (
    progressSnapshot.publicationGate.requiredCommit !==
    progressSnapshot.eventualPublicCommit
  ) {
    issues.push("publication gate does not bind the eventual public commit");
  }
  if (
    progressSnapshot.publicationGate.requiredTree !==
    progressSnapshot.eventualPublicTree
  ) {
    issues.push("publication gate does not bind the eventual public tree");
  }
  if (progressSnapshot.publicationGate.requiredRefs.length !== 2) {
    issues.push("publication gate does not require both public refs");
  }
  if (
    progressSnapshot.publicationGate.requiredRefRelationship !==
    "contains-required-commit"
  ) {
    issues.push("publication gate does not require the pinned commit as an ancestor");
  }
  const actualCheckpointIds = checkpoints.map(
    (checkpoint) => (checkpoint as Record<string, unknown>).id,
  );
  if (
    actualCheckpointIds.length !== developmentCheckpointIds.length ||
    actualCheckpointIds.some(
      (id, index) => id !== developmentCheckpointIds[index],
    )
  ) {
    issues.push("development checkpoints do not contain the exact canonical ID order");
  }
  for (const checkpoint of checkpoints) {
    issues.push(...checkpointPolicyIssues(checkpoint));
  }
  for (const kernel of kernelProgress) {
    if (ids.has(kernel.id)) issues.push(`duplicate kernel id: ${kernel.id}`);
    ids.add(kernel.id);
    if (kernel.next.trim().length === 0) {
      issues.push(`${kernel.id} has no next closure step`);
    }
    if (kernel.run === "complete" && kernel.dependsOn.length > 0) {
      issues.push(`${kernel.id} is complete but still declares dependencies`);
    }
    if (
      kernel.run === "complete" &&
      kernel.verify === "complete" &&
      kernel.evidence === "complete"
    ) {
      issues.push(
        `${kernel.id} claims unsupported run, verify, and evidence completion`,
      );
    }
  }
  return issues;
}
