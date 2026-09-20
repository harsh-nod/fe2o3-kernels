import { createHash, webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { importResourceRecording, RESOURCE_IMPORT_LIMITS } from "../src/content/recorded-resource-import";
import { mutateResourceLine, retainedResourceExcerpt, retainedResourceStreams, type MutableResourceControl } from "./fixtures/recorded-resource-import";
import { retainedLdsImportExcerpt } from "./fixtures/recorded-lds-import";
import { projectResourceAccessResponse } from "../src/content/resource-access-view";
import { projectResourceMemoryResponse } from "../src/content/resource-memory-view";
import { resourceMemoryAccessOverlay } from "../src/content/resource-memory-access-overlay";
import { resourceAccessNavigation } from "../src/content/resource-access-navigation";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());
const original = retainedResourceExcerpt();

it("joins unchanged imported LDS access and storage without upgrading target or original provenance", async () => {
  const excerpt = retainedLdsImportExcerpt(), recording = await importResourceRecording(excerpt.requests, excerpt.responses);
  expect(recording.pairs.map(pair => pair.requestUtf8).join("")).toBe(excerpt.requests);
  expect(recording.pairs.map(pair => pair.responseUtf8).join("")).toBe(excerpt.responses);
  expect(recording.context.target).toBeNull();
  const checkpoint = recording.checkpoints[0], pair = checkpoint.pages[1], memory = checkpoint.memories[0];
  const access = { response: pair.response, expectedRequest: pair.request, expectedSnapshot: checkpoint.anchor,
    context: recording.context, responseContext: recording.context };
  const page = projectResourceAccessResponse(access);
  if (page.status !== "ready" || page.kind !== "memory_accesses") throw new Error("Expected original LDS access");
  const selection = resourceAccessNavigation(page, null).selection;
  const storage = projectResourceMemoryResponse(memory.response, checkpoint.anchor);
  const input = { access, selection, memoryContext: recording.context };
  expect(resourceMemoryAccessOverlay(storage, input, 0)).toMatchObject({ status: "ready",
    access: { eventSequence: 12, marker: "W", start: "0", end: "4" }, overlap: { start: "0", end: "4" } });
  expect(resourceMemoryAccessOverlay(storage, { ...input, selection: { ...selection, eventSequence: 13 } }, 0).status).toBe("no_selection");
  expect(resourceMemoryAccessOverlay(storage, { ...input, memoryContext: { ...recording.context, target: "gfx942" } }, 0).status).toBe("stale");
  const reverse = recording.checkpoints[1];
  const reverseStorage = projectResourceMemoryResponse(reverse.memories[0].response, reverse.anchor);
  expect(resourceMemoryAccessOverlay(reverseStorage, input, 0).status).toBe("stale");
});

it("imports exact original pairs, preserving byte provenance and reverse/repeated-event identities", async () => {
  expect(createHash("sha256").update(retainedResourceStreams.requests).digest("hex"))
    .toBe("fef1e368e24fc3ce4e0922bd2a7ef2d54636c59e7a0231fad973b65496db72b6");
  expect(createHash("sha256").update(retainedResourceStreams.responses).digest("hex"))
    .toBe("aea9e0ffa792ae1b8cf97992bca0799b335e63c99641d1388d4ddbceb04f0845");
  const result = await importResourceRecording(original.requests, original.responses);
  expect(result.pairs).toHaveLength(12);
  expect(result.checkpoints.map(item => [item.anchor.cursor.event_sequence, item.anchor.cursor.state_revision]))
    .toEqual([[33, 4], [31, 5], [33, 6]]);
  expect(result.checkpoints[0].pages.map(item => item.requestId)).toEqual([7, 8, 9, 10]);
  expect(result.checkpoints[0].pages.find(item => item.requestId === 9)?.rowCount).toBe(1);
  expect(result.pairs.map(pair => pair.requestUtf8).join("")).toBe(original.requests);
  expect(result.pairs.map(pair => pair.responseUtf8).join("")).toBe(original.responses);
  expect(result.context.target).toBeNull();
  expect(result.context.variantIdentity).toBeNull();
  expect(result.context.captureIdentity).toBe(result.responseSha256);
  expect(Object.isFrozen(result.checkpoints[0].anchor)).toBe(true);
  expect(Object.isFrozen(result.pairs[0].response)).toBe(true);
});

it("retains lossless wide control values as uninterpreted raw data, never renderer metadata", async () => {
  // A synthetic numeric mutation is not an additional observed execution.
  const response = mutateResourceLine(original.responses, 6, value => { value.result.snapshot.snapshot.values = [42]; })
    .replace('"values":[42]', '"values":[18446744073709551615]');
  const imported = await importResourceRecording(original.requests, response);
  expect(imported.pairs[0].responseUtf8).toContain("18446744073709551615");
});

describe("synthetic rejection controls around the real positive recording", () => {
  it("refuses unpaired lengths and request IDs", async () => {
    await expect(importResourceRecording(original.requests, original.responses.split("\n").slice(1).join("\n")))
      .rejects.toThrow("unpaired");
    await expect(importResourceRecording(original.requests,
      mutateResourceLine(original.responses, 7, value => { value.request_id = 70; }))).rejects.toThrow("unpaired");
  });
  it("refuses duplicate IDs, reordered responses and missing independent anchors", async () => {
    await expect(importResourceRecording(
      mutateResourceLine(original.requests, 7, value => { value.request_id = 6; }),
      mutateResourceLine(original.responses, 7, value => { value.request_id = 6; }))).rejects.toThrow("duplicate_or_order");
    const rows = original.responses.trimEnd().split("\n"); [rows[1], rows[2]] = [rows[2], rows[1]];
    await expect(importResourceRecording(original.requests, rows.join("\n") + "\n")).rejects.toThrow("unpaired");
    const unanchored = retainedResourceExcerpt([7, 8, 9, 10, 11]);
    await expect(importResourceRecording(unanchored.requests, unanchored.responses)).rejects.toThrow("missing_anchor");
  });
  it("refuses cross-capture sessions, stale source sites and same-event wrong revisions", async () => {
    await expect(importResourceRecording(original.requests,
      mutateResourceLine(original.responses, 11, value => { value.session.configuration_identity = "f".repeat(64); })))
      .rejects.toThrow("stale_session");
    await expect(importResourceRecording(original.requests,
      mutateResourceLine(original.responses, 11, value => { value.result.snapshot.site.source.location.byte_start++; })))
      .rejects.toThrow("memory_refused");
    await expect(importResourceRecording(
      mutateResourceLine(original.requests, 21, value => { value.expected_revision = 4; }), original.responses))
      .rejects.toThrow("stale_request");
    const moved = mutateResourceLine(original.responses, 14, value => {
      value.session.configuration_identity = value.session.cursor.configuration_identity = "e".repeat(64);
      value.result.snapshot.snapshot.anchor.cursor.configuration_identity = "e".repeat(64);
    });
    await expect(importResourceRecording(original.requests, moved)).rejects.toThrow("cross_capture");
  });
  it("refuses memory allocation/generation/range/request disagreement", async () => {
    for (const change of [
      (value: MutableResourceControl) => { value.allocation.ordinal = 2; },
      (value: MutableResourceControl) => { value.byte_offset = 4; },
      (value: MutableResourceControl) => { value.byte_len = 4; },
    ]) await expect(importResourceRecording(mutateResourceLine(original.requests, 11, change), original.responses))
      .rejects.toThrow("unpaired_memory");
    await expect(importResourceRecording(
      mutateResourceLine(original.requests, 11, value => { value.allocation.generation = 1; }), original.responses))
      .rejects.toThrow("unsupported_memory");
  });
  it("refuses orphan, cross-query and reused page tokens", async () => {
    const orphan = retainedResourceExcerpt([6, 7, 9, 11]);
    await expect(importResourceRecording(orphan.requests, orphan.responses)).rejects.toThrow("stale_token");
    await expect(importResourceRecording(
      mutateResourceLine(original.requests, 9, value => { value.filter.scope = { level: "workgroup", workgroup: [0, 0, 0] }; }),
      original.responses)).rejects.toThrow("stale_token");
    await expect(importResourceRecording(
      mutateResourceLine(original.requests, 10, value => { value.page.token = "resource.1.1"; }),
      original.responses)).rejects.toThrow("stale_token");
  });
  it("refuses actual stale-error pairs and unsupported operations without skipping them", async () => {
    const stale = retainedResourceExcerpt([6, 7, 13]);
    await expect(importResourceRecording(stale.requests, stale.responses)).rejects.toThrow("response_refused");
    await expect(importResourceRecording(retainedResourceStreams.requests, retainedResourceStreams.responses))
      .rejects.toThrow();
    const q = mutateResourceLine(original.requests, 11, value => { value.operation = "execute"; });
    const r = mutateResourceLine(original.responses, 11, value => { value.operation = "execute"; });
    await expect(importResourceRecording(q, r)).rejects.toThrow("unsupported_operation");
  });
  it("refuses unknown fields, duplicate keys and inexact renderer metadata without rounding", async () => {
    await expect(importResourceRecording(
      mutateResourceLine(original.requests, 11, value => { value.future_field = true; }), original.responses))
      .rejects.toThrow("unsupported_fields");
    await expect(importResourceRecording(original.requests.replace('"request_id":6', '"request_id":6,"request_id":6'), original.responses))
      .rejects.toThrow("invalid_json");
    const wide = original.responses.replace('"active_mask":15', '"active_mask":18446744073709551615');
    await expect(importResourceRecording(original.requests, wide)).rejects.toThrow("unsupported_checkpoint");
  });
  it("refuses a different response schema and non-CPU or hardware authority claims", async () => {
    await expect(importResourceRecording(original.requests,
      mutateResourceLine(original.responses, 6, value => { value.schema = "fe2o3-debug-resource-response-v1"; })))
      .rejects.toThrow("wrong_schema");
    await expect(importResourceRecording(original.requests,
      mutateResourceLine(original.responses, 6, value => { value.session.hardware_observed = true; })))
      .rejects.toThrow("stale_session");
    await expect(importResourceRecording(original.requests,
      mutateResourceLine(original.responses, 7, value => { value.physical_registers = "captured"; })))
      .rejects.toThrow("resource_refused");
  });
  it("preserves typed unavailable memory instead of manufacturing zero storage", async () => {
    const changed = mutateResourceLine(original.responses, 11, value => {
      value.result.memory.returned_bytes = 0;
      value.result.memory.availability = { status: "unavailable", reason: "not_captured" };
    });
    const result = await importResourceRecording(original.requests, changed);
    expect(result.checkpoints[0].memories[0].responseUtf8).toContain('"status":"unavailable"');
    expect(result.checkpoints[0].memories[0].responseUtf8).not.toContain('"bytes":');
  });
  it("preserves wide decimal resource capacities without converting them to numbers", async () => {
    const changed = mutateResourceLine(original.responses, 7, value => {
      value.result.allocations[0].capacity_bytes = "18446744073709551615";
    });
    const result = await importResourceRecording(original.requests, changed);
    expect(result.pairs[1].responseUtf8).toContain('"capacity_bytes":"18446744073709551615"');
  });
  it("refuses truncated/oversized/deep/blank/BOM/CRLF inputs and empty checkpoint data", async () => {
    for (const requests of [original.requests.slice(0, -1), "\ufeff" + original.requests,
      original.requests.replace("\n", "\r\n"), original.requests + "\n",
      " ".repeat(RESOURCE_IMPORT_LIMITS.fileBytes + 1), "[[".repeat(30) + "0" + "]]".repeat(30) + "\n"]) {
      await expect(importResourceRecording(requests, original.responses)).rejects.toThrow();
    }
    const empty = retainedResourceExcerpt([6]);
    await expect(importResourceRecording(empty.requests, empty.responses)).rejects.toThrow("empty_checkpoint");
  });
  it("refuses too many paired lines before parsing or hashing them", async () => {
    await expect(importResourceRecording("{}\n".repeat(129), "{}\n".repeat(129))).rejects.toThrow("line_limit");
  });
  it("honors cancellation before parsing and after asynchronous hashing", async () => {
    const early = new AbortController(); early.abort();
    await expect(importResourceRecording(original.requests, original.responses, early.signal)).rejects.toMatchObject({ name: "AbortError" });
    const late = new AbortController();
    const pending = importResourceRecording(original.requests, original.responses, late.signal);
    late.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });
});
