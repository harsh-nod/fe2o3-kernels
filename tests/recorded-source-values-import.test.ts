import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { importResourceRecording } from "../src/content/recorded-resource-import";
import { projectResourceSourceValues } from "../src/content/resource-source-values";
import { retainedResourceExcerpt } from "./fixtures/recorded-resource-import";
import { encodeSyntheticSourcePairs, syntheticSourceImportPairs } from "./fixtures/recorded-source-values-integration";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());
const importPairs = async (pairs = syntheticSourceImportPairs()) => {
  const raw = encodeSyntheticSourcePairs(pairs);
  return importResourceRecording(raw.requests, raw.responses);
};
const project = (checkpoint: Awaited<ReturnType<typeof importPairs>>["checkpoints"][number]) =>
  projectResourceSourceValues(checkpoint, checkpoint.sourceStack ?? null, checkpoint.sourceVariables ?? []);

it("keeps the actual legacy resource excerpt byte-identical and source variables explicitly unavailable", async () => {
  const raw = retainedResourceExcerpt(), recording = await importResourceRecording(raw.requests, raw.responses);
  expect(recording.pairs).toHaveLength(12);
  expect(recording.pairs.map(pair => pair.requestUtf8).join("")).toBe(raw.requests);
  expect(recording.pairs.map(pair => pair.responseUtf8).join("")).toBe(raw.responses);
  for (const checkpoint of recording.checkpoints) {
    expect(checkpoint.sourceStack).toBeUndefined();
    expect(checkpoint.sourceVariables ?? []).toEqual([]);
    expect(project(checkpoint).status).toBe("unavailable");
    expect(checkpoint.memories.length + checkpoint.pages.length).toBeGreaterThan(0);
  }
});

describe("synthetic source-variable/resource importer integration, not producer evidence", () => {
  it("retains original pair text and both distinct anchors across forward/reverse/repeated checkpoints", async () => {
    const raw = encodeSyntheticSourcePairs(syntheticSourceImportPairs());
    const recording = await importResourceRecording(raw.requests, raw.responses);
    expect(recording.pairs).toHaveLength(15);
    expect(recording.pairs.map(pair => pair.requestUtf8).join("")).toBe(raw.requests);
    expect(recording.pairs.map(pair => pair.responseUtf8).join("")).toBe(raw.responses);
    expect(recording.checkpoints.map(checkpoint => [checkpoint.anchor.cursor.event_sequence,
      checkpoint.anchor.cursor.state_revision])).toEqual([[3, 2], [1, 3], [3, 4]]);
    expect(recording.context.target).toBeNull();
    expect(recording.context.variantIdentity).toBeNull();
    for (const checkpoint of recording.checkpoints) {
      expect(checkpoint.sourceStack?.kind).toBe("stack");
      expect(checkpoint.sourceVariables?.map(pair => pair.kind)).toEqual(["source_variables", "source_variables"]);
      expect(checkpoint.pages).toHaveLength(0); expect(checkpoint.memories).toHaveLength(1);
      const projection = project(checkpoint);
      expect(projection.status).toBe("ready");
      if (projection.status !== "ready") throw new Error(projection.detail);
      expect(projection.checkpointAnchor).not.toHaveProperty("frame");
      expect(projection.checkpointAnchor).not.toHaveProperty("occurrence");
      expect(projection.sourceAnchor).toEqual({ ...checkpoint.anchor, frame: 1, occurrence: 1 });
      expect(projection.rows.map(row => [row.name, row.status, row.generation])).toEqual([
        ["a", "captured", "1"], ["b", "captured", "1"],
        ["out", "unavailable", "0"], ["result", "unavailable", "0"],
      ]);
      expect(Object.isFrozen(checkpoint.sourceVariables)).toBe(true);
      expect(Object.isFrozen(checkpoint.sourceVariables?.[0].response)).toBe(true);
    }
    expect(recording.checkpoints[0].anchorKey).not.toBe(recording.checkpoints[2].anchorKey);
  });

  it("refuses source-only, stack-only, missing-first-page and missing-final-page groups without dropping rows", async () => {
    for (const omitted of [[5], [6, 7], [6], [7]]) {
      const pairs = syntheticSourceImportPairs().filter(pair => !omitted.includes(pair.request.request_id));
      await expect(importPairs(pairs)).rejects.toThrow("source_values_refused");
    }
  });

  it("requires real retained resource data even when a complete synthetic source group is present", async () => {
    const pairs = syntheticSourceImportPairs().filter(pair => pair.request.operation !== "read_memory");
    await expect(importPairs(pairs)).rejects.toThrow("empty_checkpoint");
  });

  it("refuses a duplicate stack rather than substituting its later frame", async () => {
    const pairs = syntheticSourceImportPairs();
    pairs[2] = structuredClone(pairs[1]);
    pairs[2].request.request_id = pairs[2].response.request_id = 6;
    await expect(importPairs(pairs)).rejects.toThrow("duplicate_stack");
  });

  it("refuses failed source responses and cross-session/revision data before source presentation", async () => {
    const failed = syntheticSourceImportPairs(); failed[2].response.status = "error";
    await expect(importPairs(failed)).rejects.toThrow("response_refused");
    const session = syntheticSourceImportPairs(); session[2].response.session.hardware_observed = true;
    await expect(importPairs(session)).rejects.toThrow("stale_session");
    const revision = syntheticSourceImportPairs(); revision[2].request.expected_revision--;
    await expect(importPairs(revision)).rejects.toThrow("stale_request");
  });

  it("rejects a partial group at an earlier checkpoint even if later checkpoints have complete groups", async () => {
    const pairs = syntheticSourceImportPairs().filter(pair => pair.request.request_id !== 7);
    expect(pairs.filter(pair => pair.request.operation === "step")).toHaveLength(3);
    await expect(importPairs(pairs)).rejects.toThrow("source_values_refused");
  });

  it("refuses schema/selector/page/query/identity mutations instead of normalizing them", async () => {
    const controls = [
      (pairs: ReturnType<typeof syntheticSourceImportPairs>) => { pairs[2].request.schema = "fe2o3-debug-request-v1"; },
      (pairs: ReturnType<typeof syntheticSourceImportPairs>) => { pairs[2].request.selector = { selector: "name", name: "a" }; },
      (pairs: ReturnType<typeof syntheticSourceImportPairs>) => { pairs[3].request.page.cursor.query_identity = "a".repeat(64); },
      (pairs: ReturnType<typeof syntheticSourceImportPairs>) => { pairs[3].request.page.limit = 1; },
      (pairs: ReturnType<typeof syntheticSourceImportPairs>) => { pairs[2].response.next_cursor.position = 1; },
      (pairs: ReturnType<typeof syntheticSourceImportPairs>) => {
        pairs[3].response.values[0].variable_identity = pairs[2].response.values[0].variable_identity;
      },
      (pairs: ReturnType<typeof syntheticSourceImportPairs>) => { pairs[2].request.future_field = true; },
      (pairs: ReturnType<typeof syntheticSourceImportPairs>) => { pairs[1].response.result.next_page = "unsupported"; },
    ];
    for (const change of controls) {
      const pairs = syntheticSourceImportPairs(); change(pairs);
      await expect(importPairs(pairs)).rejects.toThrow("source_values_refused");
    }
  });

  it("does not equate framed source anchors, unframed checkpoints, other source sites or stack frames", async () => {
    const controls = [
      (pairs: ReturnType<typeof syntheticSourceImportPairs>) => { delete pairs[2].response.snapshot.frame; },
      (pairs: ReturnType<typeof syntheticSourceImportPairs>) => { delete pairs[2].response.snapshot.occurrence; },
      (pairs: ReturnType<typeof syntheticSourceImportPairs>) => { pairs[2].response.snapshot.occurrence = 2; },
      (pairs: ReturnType<typeof syntheticSourceImportPairs>) => { pairs[2].response.snapshot.site.source.location.byte_start++; },
      (pairs: ReturnType<typeof syntheticSourceImportPairs>) => { pairs[1].response.result.snapshot.frame = 1; },
      (pairs: ReturnType<typeof syntheticSourceImportPairs>) => { pairs[1].response.result.frames[0].frame = 2; },
      (pairs: ReturnType<typeof syntheticSourceImportPairs>) => { pairs[1].response.result.frames[0].values.value_count++; },
    ];
    for (const change of controls) {
      const pairs = syntheticSourceImportPairs(); change(pairs);
      await expect(importPairs(pairs)).rejects.toThrow("source_values_refused");
    }
  });

  it("preserves wide generation integers losslessly without changing selected file text", async () => {
    const raw = encodeSyntheticSourcePairs(syntheticSourceImportPairs());
    const responses = raw.responses.replace('"generation":1,"availability"', '"generation":18446744073709551615,"availability"');
    expect(responses).not.toBe(raw.responses);
    const recording = await importResourceRecording(raw.requests, responses), projection = project(recording.checkpoints[0]);
    expect(projection.status).toBe("ready");
    if (projection.status !== "ready") throw new Error(projection.detail);
    expect(projection.rows[0].generation).toBe("18446744073709551615");
    expect(recording.pairs.map(pair => pair.responseUtf8).join("")).toBe(responses);
  });
});
