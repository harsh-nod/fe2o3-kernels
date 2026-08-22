import publicationGate from "../../config/publication-gate.json";
import stateData from "../../config/current-state.json";
import { deepFreeze } from "./registry";

export type CapabilityStatus = "active" | "partial";
export type TrackedIssueState = "open" | "closed";

export interface CurrentCapability {
  id: string;
  label: string;
  status: CapabilityStatus;
  detail: string;
  sourcePaths: string[];
}

export interface TrackedIssue {
  number: number;
  state: TrackedIssueState;
  label: string;
}

const exactObject = /^[0-9a-f]{40}$/u;

function validateCurrentState(): void {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(stateData.reviewedOn)) {
    throw new Error("current state has no exact review date");
  }
  if (!exactObject.test(stateData.plironCommit)) {
    throw new Error("current state has no exact Pliron commit");
  }
  const issueNumbers = new Set<number>();
  for (const issue of stateData.issues) {
    if (
      !Number.isSafeInteger(issue.number) ||
      issue.number <= 0 ||
      issueNumbers.has(issue.number) ||
      (issue.state !== "open" && issue.state !== "closed") ||
      issue.label.trim().length === 0
    ) {
      throw new Error("current state has an invalid tracked issue");
    }
    issueNumbers.add(issue.number);
  }
  const capabilityIds = new Set<string>();
  for (const capability of stateData.capabilities) {
    if (
      !/^[a-z0-9-]+$/u.test(capability.id) ||
      capabilityIds.has(capability.id) ||
      (capability.status !== "active" && capability.status !== "partial") ||
      capability.label.trim().length === 0 ||
      capability.detail.trim().length === 0 ||
      capability.sourcePaths.length === 0 ||
      capability.sourcePaths.some(
        (path) =>
          path.startsWith("/") ||
          path.split("/").includes("..") ||
          path.trim().length === 0,
      )
    ) {
      throw new Error("current state has an invalid compiler capability");
    }
    capabilityIds.add(capability.id);
  }
}

validateCurrentState();

export const currentState = deepFreeze({
  reviewedOn: stateData.reviewedOn,
  compilerCommit: publicationGate.requiredCommit,
  compilerTree: publicationGate.requiredTree,
  compilerShortCommit: publicationGate.requiredCommit.slice(0, 10),
  plironCommit: stateData.plironCommit,
  issues: stateData.issues as TrackedIssue[],
  capabilities: stateData.capabilities as CurrentCapability[],
});

export function trackedIssue(number: number): Readonly<TrackedIssue> {
  const issue = currentState.issues.find((candidate) => candidate.number === number);
  if (!issue) throw new Error(`issue #${number} is not in the current-state manifest`);
  return issue;
}

export function currentSourceUrl(path: string): string {
  return `https://github.com/harsh-nod/fe2o3/blob/${currentState.compilerCommit}/${path}`;
}
