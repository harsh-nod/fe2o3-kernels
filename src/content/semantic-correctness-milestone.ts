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
  perCompilationTemplateSha256: string | null;
  perCompilationGeneratedFixtureSha256: string | null;
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
      "fe2o3-semantic-correctness-tutorial-milestone-v4" ||
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
    typeof milestone.preloweringReportVersion === "string" &&
    milestone.preloweringReportVersion.length > 0 &&
    typeof milestone.functionalReceiptVersion === "string" &&
    milestone.functionalReceiptVersion.length > 0 &&
    typeof milestone.perCompilationTemplateSha256 === "string" &&
    /^[0-9a-f]{64}$/u.test(milestone.perCompilationTemplateSha256) &&
    typeof milestone.perCompilationGeneratedFixtureSha256 === "string" &&
    /^[0-9a-f]{64}$/u.test(
      milestone.perCompilationGeneratedFixtureSha256,
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

const implementedUnpinnedMechanisms = semanticCorrectnessMilestone.mechanisms
  .filter((mechanism) => mechanism.status === "implemented-unpinned")
  .map((mechanism) => mechanism.id)
  .join(", ");

export const semanticMilestoneBoundary =
  semanticCorrectnessMilestone.status === "integration-pending"
    ? `Milestone status: integration pending. The published compiler remains ${semanticCorrectnessMilestone.baselineCompilerCommit}; the contracts below are explanatory and grant no compiler, proof, artifact, launch, or hardware authority.`
    : `Milestone status: ${semanticCorrectnessMilestone.status} at compiler ${semanticCorrectnessMilestone.compilerCommit}, with ${semanticCorrectnessMilestone.preloweringReportVersion} and consumed ${semanticCorrectnessMilestone.functionalReceiptVersion} evidence. For an admitted reference-bound compilation, production derives and reconciles the semantic contract, derives and validates the strict parallel contract, and runs a generated per-compilation Verus conditional-lemma checker before KIR lowering. The production report cryptographically binds that check and the retained receipts outside the Verus lemma; it is not one whole-kernel theorem. The template ${semanticCorrectnessMilestone.perCompilationTemplateSha256} and generated fixture ${semanticCorrectnessMilestone.perCompilationGeneratedFixtureSha256} identify the published mechanism; cached fixtures pass, but mi300x lacks the required root-owned /opt runtime, so no referenced production compile has completed this gate. The catalog also records implemented-unpinned mechanisms (${implementedUnpinnedMechanisms}); their paths do not become evidence for this pinned compiler object until the publication gate repins the final integrated commit and tree. Those extensions prove compiler-bound one-dimensional safe-slice reads, canonical unit-step dynamic-loop termination, and separated multiple-output products only under their exact retained evidence. Unsupported multidimensional or raw-pointer reads, noncanonical loops, unsupported tensor arithmetic, lesson-specific numerical receipts, target IEEE and transcendental values, compiler extraction/projection and pass soundness, LLVM-or-later refinement, artifacts, launch, hardware, performance, and universal correctness remain outside the claim. ErrorBounded authority requires an independently imported claim-specific receipt over canonical-true full output coverage; automatic requests fail closed. Cooperative-tensor layout and convergence are structurally checked, but functional tensor arithmetic fails closed at FE2O3-PARALLEL-013 until typed tensor SSA def-use/result-to-output binding and claim-specific receipts exist.`;
