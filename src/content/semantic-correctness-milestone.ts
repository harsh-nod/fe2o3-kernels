import milestoneData from "../../config/semantic-correctness-milestone.json";
import { deepFreeze } from "./registry";

export type SemanticCorrectnessMilestoneStatus =
  | "integration-pending"
  | "partial-current"
  | "published-current";

interface SemanticCorrectnessMechanism {
  id: string;
  status: "integration-pending" | "planned" | "published-current";
  detail: string;
  evidence: string[];
}

interface SemanticCorrectnessMilestoneManifest {
  schema: string;
  status: SemanticCorrectnessMilestoneStatus;
  baselineCompilerCommit: string;
  baselineCompilerTree: string;
  compilerCommit: string | null;
  compilerTree: string | null;
  preloweringReportVersion: string | null;
  functionalReceiptVersion: string | null;
  sharedTheoremSha256: string | null;
  verusVersion: string | null;
  verusExecutableSha256: string | null;
  mechanisms: SemanticCorrectnessMechanism[];
  kernelLessons: string[];
  publicationRequirements: string[];
}

const milestone =
  milestoneData as unknown as SemanticCorrectnessMilestoneManifest;

const exactObject = /^[0-9a-f]{40}$/u;

function validateSemanticCorrectnessMilestone(): void {
  if (
    milestone.schema !==
      "fe2o3-semantic-correctness-tutorial-milestone-v2" ||
    (milestone.status !== "integration-pending" &&
      milestone.status !== "partial-current" &&
      milestone.status !== "published-current") ||
    !exactObject.test(milestone.baselineCompilerCommit) ||
    !exactObject.test(milestone.baselineCompilerTree) ||
    milestone.mechanisms.length !== 7 ||
    milestone.kernelLessons.length !== 11 ||
    milestone.publicationRequirements.length < 5
  ) {
    throw new Error("semantic-correctness milestone manifest is malformed");
  }

  const mechanismIds = new Set<string>();
  for (const mechanism of milestone.mechanisms) {
    if (
      !/^[a-z0-9-]+$/u.test(mechanism.id) ||
      mechanismIds.has(mechanism.id) ||
      (mechanism.status !== "integration-pending" &&
        mechanism.status !== "planned" &&
        mechanism.status !== "published-current") ||
      mechanism.detail.trim().length === 0 ||
      mechanism.evidence.some(
        (path) =>
          path.startsWith("/") ||
          path.split("/").includes("..") ||
          path.trim().length === 0,
      )
    ) {
      throw new Error("semantic-correctness mechanism is malformed");
    }
    if (
      (mechanism.status === "published-current") !==
      (mechanism.evidence.length > 0)
    ) {
      throw new Error("published semantic mechanism requires exact evidence paths");
    }
    mechanismIds.add(mechanism.id);
  }

  const published = milestone.status !== "integration-pending";
  const hasExactPublication =
    typeof milestone.compilerCommit === "string" &&
    exactObject.test(milestone.compilerCommit) &&
    typeof milestone.compilerTree === "string" &&
    exactObject.test(milestone.compilerTree) &&
    typeof milestone.preloweringReportVersion === "string" &&
    milestone.preloweringReportVersion.length > 0 &&
    typeof milestone.functionalReceiptVersion === "string" &&
    milestone.functionalReceiptVersion.length > 0 &&
    typeof milestone.sharedTheoremSha256 === "string" &&
    /^[0-9a-f]{64}$/u.test(milestone.sharedTheoremSha256) &&
    typeof milestone.verusVersion === "string" &&
    milestone.verusVersion.length > 0 &&
    typeof milestone.verusExecutableSha256 === "string" &&
    /^[0-9a-f]{64}$/u.test(milestone.verusExecutableSha256);

  if (published !== hasExactPublication) {
    throw new Error(
      "published semantic-correctness tutorials require exact compiler and evidence identities",
    );
  }
}

validateSemanticCorrectnessMilestone();

export const semanticCorrectnessMilestone = deepFreeze(milestone);

export const semanticMilestoneBoundary =
  semanticCorrectnessMilestone.status === "integration-pending"
    ? `Milestone status: integration pending. The published compiler remains ${semanticCorrectnessMilestone.baselineCompilerCommit}; the contracts below are explanatory and grant no compiler, proof, artifact, launch, or hardware authority.`
    : `Milestone status: ${semanticCorrectnessMilestone.status} at compiler ${semanticCorrectnessMilestone.compilerCommit}, with ${semanticCorrectnessMilestone.preloweringReportVersion} and consumed ${semanticCorrectnessMilestone.functionalReceiptVersion} evidence. The published gate binds its admitted safe-reference MIR, kernel MIR, and live PLIRON facts, but its source-pinned shared theorem at ${semanticCorrectnessMilestone.sharedTheoremSha256} is not a per-compilation proof. Production functional authority now requires a fresh generic composition obligation bound to each compilation. That integration and final compiler pin remain pending, so every lesson below reports its exact Incomplete, model-only, or observation-only boundary. Unsupported reference constructs, unproved narrow dynamic bounds, target IEEE values, compiler projection soundness, LLVM-or-later refinement, artifacts, launch, hardware, performance, and universal correctness remain outside the claim.`;
