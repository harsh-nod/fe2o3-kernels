/** One selected row from an already guarded Resource V1 page, never a new
 * producer/schema. Numeric output is an explicitly assumed layout scenario. */
import { modelLdsByteRange, type LdsBankRangeModel } from "./lds-bank-model";
import { resourceAccessNavigation, resourceAccessPageKey, type ResourceAccessSelection } from "./resource-access-navigation";
import type { ResourceAccessProjection, ResourceAccessRow } from "./resource-access-view";

/** UI-only hypothesis, never imported target metadata or capture authority.
 * undefined retains the existing caller-context behavior; null means unknown. */
export type LdsTargetAssumption = "gfx942" | "gfx950" | null;

export type ResourceLdsBankAnalysis = {
  readonly status: "modeled";
  readonly model: Extract<LdsBankRangeModel, { status: "modeled" }>;
  readonly pageKey: string;
  readonly anchorKey: string;
  readonly contextKey: string;
  readonly selected: ResourceAccessRow;
  readonly checkpointEvent: number;
  readonly checkpointRevision: number;
  readonly partialCapture: boolean;
  readonly morePages: boolean;
  readonly targetProvenance: "caller_owned_context" | "user_hypothesis_unverified";
  readonly physicalBase: "not_represented";
  readonly alignment: "not_represented";
  readonly nativeInstruction: "not_represented";
  readonly conflictCount: "unavailable";
  readonly timing: "unavailable";
} | { readonly status: "unavailable" | "stale"; readonly detail: string };

export function projectSelectedLdsBankAnalysis(
  projection: ResourceAccessProjection, selection: ResourceAccessSelection | null, assumedBaseResidue: string,
  targetAssumption?: LdsTargetAssumption,
): ResourceLdsBankAnalysis {
  if (projection.status !== "ready" || projection.kind !== "memory_accesses") {
    return { status: "unavailable", detail: "A current guarded memory-access page is required." };
  }
  const pageKey = resourceAccessPageKey(projection);
  if (selection !== null && selection.pageKey !== pageKey) {
    return { status: "stale", detail: "The selected access belongs to another page, checkpoint, capture, target or variant." };
  }
  const selected = resourceAccessNavigation(projection, selection).selected;
  if (!selected) return { status: "unavailable", detail: "No exact retained access is selected; no neighboring access is substituted." };
  if (selected.address_space !== "workgroup") {
    return { status: "unavailable", detail: "LDS geometry applies only to the selected workgroup-space access, not global or private memory." };
  }
  if (targetAssumption === null) {
    return { status: "unavailable", detail: "No hypothetical target is selected; recorded target metadata is not inferred." };
  }
  // Selection still binds the original full context. A hypothesis cannot repair
  // stale input, change its address space, or become recorded target metadata.
  const target = targetAssumption === undefined ? projection.context.target : targetAssumption;
  const model = modelLdsByteRange(target, selected.range.byte_offset, selected.range.byte_len, assumedBaseResidue);
  if (model.status !== "modeled") return { status: "unavailable", detail: model.detail };
  return Object.freeze({
    status: "modeled", model, pageKey, anchorKey: projection.anchorKey, contextKey: projection.contextKey,
    selected, checkpointEvent: projection.anchor.cursor.event_sequence,
    checkpointRevision: projection.anchor.cursor.state_revision,
    partialCapture: projection.completeness.status === "truncated", morePages: projection.hasMorePages,
    targetProvenance: targetAssumption === undefined ? "caller_owned_context" : "user_hypothesis_unverified", physicalBase: "not_represented",
    alignment: "not_represented", nativeInstruction: "not_represented", conflictCount: "unavailable", timing: "unavailable",
  });
}
