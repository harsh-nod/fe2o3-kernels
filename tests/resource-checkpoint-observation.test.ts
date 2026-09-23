// Synthetic DTO controls only. No imported transcript custody or executed producer claim.
import { expect, it } from "vitest";
import type { ResourceCheckpointObservation } from "../src/content/resource-checkpoint-observation";
import { projectResourceCheckpointValues } from "../src/content/resource-checkpoint-values";
import { projectResourceSourceValues } from "../src/content/resource-source-values";
import { syntheticSourceValueGroup } from "./fixtures/resource-source-values";

function neutral() {
  const group = syntheticSourceValueGroup(), original = group.checkpoint;
  const checkpoint: ResourceCheckpointObservation = {
    anchor: original.anchor, anchorKey: original.anchorKey,
    control: { kind: original.control.kind, requestId: original.control.requestId,
      request: original.control.request, response: original.control.response },
  };
  return { group, checkpoint };
}
it("projects the same source and SSA DTOs without fabricating imported JSONL metadata", () => {
  const { group, checkpoint } = neutral();
  expect(Object.keys(checkpoint)).toEqual(["anchor", "anchorKey", "control"]);
  expect(Object.keys(checkpoint.control)).toEqual(["kind", "requestId", "request", "response"]);
  expect(projectResourceCheckpointValues(checkpoint)).toEqual(projectResourceCheckpointValues(group.checkpoint));
  expect(projectResourceSourceValues(checkpoint, group.stack, group.sourcePages))
    .toEqual(projectResourceSourceValues(group.checkpoint, group.stack, group.sourcePages));
});
it("retains runtime stale-anchor rejection after the type-only refactor", () => {
  const { group, checkpoint } = neutral();
  const stale = { ...checkpoint, anchorKey: "not-the-current-anchor" };
  expect(projectResourceCheckpointValues(stale).status).toBe("stale");
  expect(projectResourceSourceValues(stale, group.stack, group.sourcePages).status).toBe("stale");
});
it("does not round inexact snapshot metadata merely because transport identity is lossless", () => {
  const { checkpoint } = neutral();
  const inexact = { ...checkpoint, anchor: { ...checkpoint.anchor,
    cursor: { ...checkpoint.anchor.cursor, event_sequence: Number.MAX_SAFE_INTEGER + 1 } } };
  expect(projectResourceCheckpointValues(inexact).status).toBe("stale");
});
