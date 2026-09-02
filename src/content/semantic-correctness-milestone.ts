import milestoneData from "../../config/semantic-correctness-milestone.json";
import { deepFreeze } from "./registry";

export type SemanticCorrectnessMilestoneStatus =
  | "integration-pending"
  | "partial-current"
  | "published-current";

interface SemanticCorrectnessMechanism {
  id: string;
  status:
    | "integration-pending"
    | "implemented-unpinned"
    | "planned"
    | "published-current";
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
  perCompilationTemplatePath: string | null;
  perCompilationTemplateSha256: string | null;
  perCompilationGeneratedFixturePath: string | null;
  perCompilationGeneratedFixtureSha256: string | null;
  perCompilationMultiOutputFixturePath: string | null;
  perCompilationMultiOutputFixtureSha256: string | null;
  perCompilationMultiOutputSubstitutionFixturePath: string | null;
  perCompilationMultiOutputSubstitutionFixtureSha256: string | null;
  verusVersion: string | null;
  verusExecutableSha256: string | null;
  mechanisms: SemanticCorrectnessMechanism[];
  kernelLessons: string[];
  publicationRequirements: string[];
}

const milestone =
  milestoneData as unknown as SemanticCorrectnessMilestoneManifest;

const exactObject = /^[0-9a-f]{40}$/u;
const exactSha256 = /^[0-9a-f]{64}$/u;
const CURRENT_PRELOWERING_REPORT_VERSION =
  "ProductionPlironPreloweringReportV2 + ProductionMiddleEndEvidenceV5 + ProductionTotalOutputStagingReportV2 + ProductionMirPlironSemanticContractReportV1 + ProductionParallelReferenceContractReportV1 + ProductionMirPlironPerCompilationVerusReportV1";

function isRepositoryPath(path: unknown): path is string {
  return typeof path === "string" &&
    path.trim().length > 0 &&
    !path.startsWith("/") &&
    !path.split("/").includes("..");
}

function validateSemanticCorrectnessMilestone(): void {
  if (
    milestone.schema !==
      "fe2o3-semantic-correctness-tutorial-milestone-v5" ||
    (milestone.status !== "integration-pending" &&
      milestone.status !== "partial-current" &&
      milestone.status !== "published-current") ||
    !exactObject.test(milestone.baselineCompilerCommit) ||
    !exactObject.test(milestone.baselineCompilerTree) ||
    milestone.mechanisms.length !== 12 ||
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
        mechanism.status !== "implemented-unpinned" &&
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
      (mechanism.status === "published-current" ||
        mechanism.status === "implemented-unpinned") !==
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
    milestone.preloweringReportVersion === CURRENT_PRELOWERING_REPORT_VERSION &&
    typeof milestone.functionalReceiptVersion === "string" &&
    milestone.functionalReceiptVersion.length > 0 &&
    isRepositoryPath(milestone.perCompilationTemplatePath) &&
    typeof milestone.perCompilationTemplateSha256 === "string" &&
    /^[0-9a-f]{64}$/u.test(milestone.perCompilationTemplateSha256) &&
    isRepositoryPath(milestone.perCompilationGeneratedFixturePath) &&
    typeof milestone.perCompilationGeneratedFixtureSha256 === "string" &&
    exactSha256.test(
      milestone.perCompilationGeneratedFixtureSha256,
    ) &&
    isRepositoryPath(milestone.perCompilationMultiOutputFixturePath) &&
    typeof milestone.perCompilationMultiOutputFixtureSha256 === "string" &&
    exactSha256.test(milestone.perCompilationMultiOutputFixtureSha256) &&
    isRepositoryPath(
      milestone.perCompilationMultiOutputSubstitutionFixturePath,
    ) &&
    typeof milestone.perCompilationMultiOutputSubstitutionFixtureSha256 ===
      "string" &&
    exactSha256.test(
      milestone.perCompilationMultiOutputSubstitutionFixtureSha256,
    ) &&
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

export const semanticMilestoneLessonBoundary =
  semanticCorrectnessMilestone.status === "integration-pending"
    ? `Milestone status: integration pending. This lesson describes an unpinned compiler capability and grants no proof or execution authority.`
    : `Milestone status: ${semanticCorrectnessMilestone.status} at compiler ${semanticCorrectnessMilestone.compilerCommit}. Read the capability below together with its explicit fail-closed boundary.`;

export const semanticMilestoneBoundary =
  semanticCorrectnessMilestone.status === "integration-pending"
    ? `Milestone status: integration pending. The published compiler remains ${semanticCorrectnessMilestone.baselineCompilerCommit}; the contracts below are explanatory and grant no compiler, proof, artifact, launch, or hardware authority.`
    : `Milestone status: ${semanticCorrectnessMilestone.status} at compiler ${semanticCorrectnessMilestone.compilerCommit}. One generated checker replays supported exact pointwise integer and compiler-side IEEE operator-DAG formulas without a generic relation premise. PLIRON separately proves and reconciles total coverage, allocation separation, frames, schedules, and ordered-product identity; status-Checked policy staging grants no authority, and the private move-only join is the admission authority requiring both structural and formula results. Dynamic safe-slice reads are complete only for an exact identical symbolic ranked extent or an overflow-checked bounded static affine interval; unrelated independent lengths, missing assertions, unsafe intervals, and overflow fail closed. Noncanonical SCCs retain exact invariant/variant requests without formula authority. Tensor/MFMA bindings cover at most 64 sites and 64 component pairs per receipt, while tensor-component replay remains unsupported. ErrorBounded formula replay is also unsupported. Positive multi-output fixture ${semanticCorrectnessMilestone.perCompilationMultiOutputFixturePath} (${semanticCorrectnessMilestone.perCompilationMultiOutputFixtureSha256}) and substitution fixture ${semanticCorrectnessMilestone.perCompilationMultiOutputSubstitutionFixturePath} (${semanticCorrectnessMilestone.perCompilationMultiOutputSubstitutionFixtureSha256}) bind the generator boundary. Maintainers report that, on mi300x, the listed functional-refinement and Verus publication commands passed against this compiler revision using the pinned Verus executable. The website retains no immutable command transcript or run record for that qualification, so it is not independently verifiable publication evidence. Even if reproduced, it is compiler and host-proof validation only; it grants no target, artifact, launch, hardware, performance, or universal-correctness authority. Compiler extraction/projection and pass soundness, target IEEE values, LLVM-or-later refinement, target instruction arithmetic, artifacts, launch, hardware, performance, and universal correctness remain outside the claim.`;
