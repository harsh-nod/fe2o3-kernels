import { createHash, webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import requests from "./fixtures/recorded-watchpoint-requests.jsonl?raw";
import responses from "./fixtures/recorded-watchpoint-responses.jsonl?raw";
import { importRecordedWatchpoint, readWatchpointFile, WATCHPOINT_IMPORT_LIMITS } from "../src/content/recorded-watchpoint-observation";

// Synthetic mutation machinery only, not a DTO or a claimed additional capture.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mutable = Record<string, any>;
function mutate(raw: string, id: number, change: (row: Mutable) => void) {
  return raw.trimEnd().split("\n").map(line => {
    const value = JSON.parse(line); if (value.request_id !== id) return line;
    change(value); return JSON.stringify(value);
  }).join("\n") + "\n";
}
const hash = (raw: string) => createHash("sha256").update(raw).digest("hex");
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());

it("joins the seven unchanged real pairs without assigning later bytes or source to the stop", async () => {
  expect(new TextEncoder().encode(requests).length).toBe(1862);
  expect(new TextEncoder().encode(responses).length).toBe(14117);
  expect(hash(requests)).toBe("f7184765621758f4e57a82ff603093c1d53474b8dc68eddf69debbaf2afc608c");
  expect(hash(responses)).toBe("4529a8186678df97fb6df4d0f306da8b93a0223d71d54600863f26a1b4dfce3f");
  const data = await importRecordedWatchpoint(requests, responses);
  expect(data.pairs.map(pair => pair.requestId)).toEqual([1, 2, 4, 5, 6, 7, 12]);
  expect(data.pairs.map(pair => pair.requestUtf8).join("")).toBe(requests);
  expect(data.pairs.map(pair => pair.responseUtf8).join("")).toBe(responses);
  expect(data.registration).toMatchObject({ watchpointId: 1, spec: { allocation: { ordinal: 1, generation: 0 },
    byte_offset: 0, byte_len: 4, access: "write", timing: "after_commit" } });
  expect(data.stop).toMatchObject({ cursor: { event_sequence: 32, state_revision: 3 }, eventsAdvanced: 31,
    snapshot: { status: "unavailable", reason: "not_captured" }, origin: { status: "unavailable", reason: "not_captured" } });
  for (const missing of ["anchor", "values", "memory", "source"]) expect(Object.hasOwn(data.stop, missing)).toBe(false);
  expect(data.checkpoint.anchor.cursor).toMatchObject({ event_sequence: 33, state_revision: 4 });
  expect(data.checkpoint.anchor.site?.source.status).toBe("resolved");
  expect(data.checkpoint.anchor.frame).toBeUndefined();
  expect(data.checkpoint.anchor.occurrence).toBeUndefined();
  expect(data.memory.belongsTo).toBe("later_checkpoint_only");
  expect(data.memory.projection.anchorKey).toBe(data.checkpoint.anchorKey);
  expect(data.memory.projection.memory.availability).toEqual({ status: "captured", address_space: "global",
    bytes: "0xd5010000a5a5a5a5a5a5a5a5a5a5a5a5deadbeefcafebabe", initialized: "0xffffff", truncated: false });
  expect(data.context).toEqual({ connectionId: "local-watchpoint:" + hash(requests), captureIdentity: hash(responses),
    target: null, variantIdentity: null });
  expect(data.provenance).toEqual({ kind: "caller_supplied_unverified", sourceAuthentication: false,
    hardwareObserved: false, performancePrediction: false });
  expect(Object.isFrozen(data)).toBe(true);
  expect(Object.isFrozen(data.checkpoint.anchor.cursor)).toBe(true);
  expect(Object.isFrozen(data.pairs[0].response)).toBe(true);
  expect(Object.isFrozen(data.memory.projection.memory)).toBe(true);
});

it("does not hardcode fixture request or allocated watchpoint IDs", async () => {
  // Synthetic consistently-renumbered caller claims, not another measured run.
  const renumber = (raw: string) => raw.trimEnd().split("\n").map(line => {
    const value = JSON.parse(line); value.request_id += 100; return JSON.stringify(value);
  }).join("\n") + "\n";
  let altered = mutate(responses, 5, row => { row.result.watchpoints[0].watchpoint_id = 9; });
  altered = mutate(altered, 6, row => { row.result.stop.watchpoint_id = 9; });
  const data = await importRecordedWatchpoint(renumber(requests), renumber(altered));
  expect(data.stop.pair.requestId).toBe(106); expect(data.stop.watchpointId).toBe(9);
  expect(data.provenance.sourceAuthentication).toBe(false);
});

describe("synthetic refusals around the unchanged real observation", () => {
  it("rejects missing/extra pairs, duplicate IDs, order and request/response mismatch", async () => {
    for (const bad of [requests.slice(requests.indexOf("\n") + 1), requests + requests.split("\n")[0] + "\n",
      mutate(requests, 5, row => { row.request_id = 4; }),
      mutate(requests, 6, row => { row.operation = "step"; })]) {
      await expect(importRecordedWatchpoint(bad, responses)).rejects.toThrow();
    }
    await expect(importRecordedWatchpoint(requests, mutate(responses, 6, row => { row.request_id = 60; }))).rejects.toThrow("pair");
    await expect(importRecordedWatchpoint(requests, mutate(responses, 6, row => { row.status = "error"; }))).rejects.toThrow("pair");
  });
  it("rejects unknown envelope and nested stop/spec fields", async () => {
    for (const id of [1, 2, 4, 5, 6, 7, 12]) {
      await expect(importRecordedWatchpoint(mutate(requests, id, row => { row.unrecognized = true; }), responses)).rejects.toThrow();
      await expect(importRecordedWatchpoint(requests, mutate(responses, id, row => { row.unrecognized = true; }))).rejects.toThrow();
    }
    await expect(importRecordedWatchpoint(requests, mutate(responses, 6, row => { row.result.stop.source = "invented"; }))).rejects.toThrow();
    await expect(importRecordedWatchpoint(mutate(requests, 4, row => { row.watchpoints[0].extra = 1; }), responses)).rejects.toThrow();
  });
  it("rejects cross-session, stale revision and unsupported backend claims", async () => {
    for (const change of [
      (row: Mutable) => { row.session.configuration_identity = row.session.cursor.configuration_identity = "f".repeat(64); },
      (row: Mutable) => { row.session.revision = row.session.cursor.state_revision = 2; },
      (row: Mutable) => { row.session.cursor.state_revision = 4; },
      (row: Mutable) => { row.session.hardware_observed = true; },
    ]) await expect(importRecordedWatchpoint(requests, mutate(responses, 6, change))).rejects.toThrow();
    await expect(importRecordedWatchpoint(mutate(requests, 7, row => { row.expected_revision = 2; }), responses)).rejects.toThrow("stale");
  });
  it("requires actual inventory membership, valid capacity and complete non-token inventory", async () => {
    for (const change of [
      (row: Mutable) => { row.result.allocations[0].allocation.ordinal = 2; },
      (row: Mutable) => { row.result.allocations[0].capacity_bytes = "23"; },
      (row: Mutable) => { row.result.allocations[0].capacity_bytes = "18446744073709551616"; },
      (row: Mutable) => { row.result.allocations[0].address_space = "workgroup"; },
      (row: Mutable) => { row.page.completeness = { status: "truncated", reason: "event_limit", emitted_events: 1 }; },
    ]) await expect(importRecordedWatchpoint(requests, mutate(responses, 2, change))).rejects.toThrow("inventory");
    await expect(importRecordedWatchpoint(mutate(requests, 2, row => { row.page.token = "orphan"; }), responses)).rejects.toThrow("inventory");
  });
  it("requires the same new write/after-commit spec and zero earlier listed hits", async () => {
    for (const change of [
      (row: Mutable) => { row.watchpoints[0].allocation.generation = 1; },
      (row: Mutable) => { row.watchpoints[0].byte_offset = 4; },
      (row: Mutable) => { row.watchpoints[0].access = "read"; },
      (row: Mutable) => { row.watchpoints[0].timing = "before"; },
      (row: Mutable) => { row.watchpoints[0].enabled = false; },
    ]) await expect(importRecordedWatchpoint(mutate(requests, 4, change), responses)).rejects.toThrow("watchpoint");
    for (const change of [
      (row: Mutable) => { row.result.watchpoints[0].hit_count = 1; },
      (row: Mutable) => { row.result.watchpoints[0].watchpoint_id = 2; },
      (row: Mutable) => { row.result.watchpoints[0].spec.byte_len = 8; },
    ]) await expect(importRecordedWatchpoint(requests, mutate(responses, 5, change))).rejects.toThrow();
  });
  it("requires an exact watchpoint stop, not a fault, inferred hit or later captured snapshot", async () => {
    for (const change of [
      (row: Mutable) => { row.result.stop.reason = "fault"; },
      (row: Mutable) => { row.result.stop.exact = false; },
      (row: Mutable) => { row.result.stop.watchpoint_id = 9; },
      (row: Mutable) => { row.result.events_advanced--; },
      (row: Mutable) => { row.result.snapshot = JSON.parse(responses.trimEnd().split("\n")[5]).result.snapshot; },
    ]) await expect(importRecordedWatchpoint(requests, mutate(responses, 6, change))).rejects.toThrow();
  });
  it("refuses later memory substituted onto the uncaptured stop or changed source/scope/range", async () => {
    for (const change of [
      (row: Mutable) => { row.result.snapshot.cursor.event_sequence = 32; },
      (row: Mutable) => { row.result.snapshot.cursor.state_revision = 3; },
      (row: Mutable) => { row.result.snapshot.site.source.location.byte_start++; },
      (row: Mutable) => { row.result.snapshot.scope.lane = 1; },
      (row: Mutable) => { row.result.snapshot.frame = 1; row.result.snapshot.occurrence = 1; },
      (row: Mutable) => { row.result.memory.allocation.ordinal = 2; },
      (row: Mutable) => { row.result.memory.byte_offset = 4; },
      (row: Mutable) => { row.result.memory.availability.truncated = true; },
      (row: Mutable) => { row.result.memory.availability.initialized = "0xffff"; },
    ]) await expect(importRecordedWatchpoint(requests, mutate(responses, 12, change))).rejects.toThrow("memory");
    await expect(importRecordedWatchpoint(requests, mutate(responses, 7, row => {
      row.result.snapshot.snapshot.anchor.site.source.location.map_identity = "a".repeat(64);
    }))).rejects.toThrow("origin");
  });
  it("rejects malformed/duplicate/negative/wide-inexact/deep/oversized JSON and bad LF framing", async () => {
    for (const bad of [requests.replace('"expected_revision":0', '"expected_revision":0,"expected_revision":0'),
      requests.replace('"request_id":1', '"request_id":9007199254740993'),
      requests.replace('"expected_revision":0', '"expected_revision":-1'),
      requests.replace('"count":1', '"count":1.0'), "\ufeff" + requests,
      requests.replace("\n", "\r\n"), requests.slice(0, -1), "\n" + requests,
      requests.replace('"count":1', '"count":1,"deep":' + "[".repeat(26) + "0" + "]".repeat(26)),
      requests.replace('"count":1', '"count":1,"large":"' + "x".repeat(WATCHPOINT_IMPORT_LIMITS.lineBytes) + '"'),
      "x".repeat(WATCHPOINT_IMPORT_LIMITS.fileBytes + 1)]) {
      await expect(importRecordedWatchpoint(bad, responses)).rejects.toThrow();
    }
  });
});

it("keeps opaque wide values lossless without claiming their interpretation", async () => {
  const altered = mutate(responses, 7, row => { row.result.snapshot.snapshot.values = [42]; })
    .replace('"values":[42]', '"values":[18446744073709551615]');
  const data = await importRecordedWatchpoint(requests, altered);
  expect(data.checkpoint.values).toEqual([18446744073709551615n]);
  expect(data.checkpoint.pair.responseUtf8).toContain("18446744073709551615");
  expect(data.stop.origin.status).toBe("unavailable");
});

it("does not authenticate internally consistent changed bytes, initializedness or source claims", async () => {
  // These accepted mutations are explicitly caller claims, NOT observed executions.
  const altered = mutate(responses, 12, row => {
    row.result.memory.availability.bytes = "0x" + "00".repeat(24);
    row.result.memory.availability.initialized = "0x000000";
  });
  const data = await importRecordedWatchpoint(requests, altered);
  expect(data.responseSha256).toBe(hash(altered)); expect(data.responseSha256).not.toBe(hash(responses));
  expect(data.memory.projection.memory.availability).toMatchObject({ bytes: "0x" + "00".repeat(24), initialized: "0x000000" });
  expect(data.provenance.sourceAuthentication).toBe(false);
  expect(data.stop).not.toHaveProperty("memory");
  const map = "72f0173b256bab3adc9cd9c84d3fff40a2379e08aeb4f246dad4594c3714b2b6";
  const changedSource = await importRecordedWatchpoint(requests.replaceAll(map, "e".repeat(64)), responses.replaceAll(map, "e".repeat(64)));
  expect(changedSource.checkpoint.anchor.site?.source).toMatchObject({ status: "resolved", location: { map_identity: "e".repeat(64) } });
  expect(changedSource.provenance.sourceAuthentication).toBe(false);
  expect(changedSource.responseSha256).not.toBe(hash(responses));
});

it("honors abort before import and while bounded hashing is pending", async () => {
  const before = new AbortController(); before.abort();
  await expect(importRecordedWatchpoint(requests, responses, before.signal)).rejects.toMatchObject({ name: "AbortError" });
  const during = new AbortController(), pending = importRecordedWatchpoint(requests, responses, during.signal);
  during.abort(); await expect(pending).rejects.toMatchObject({ name: "AbortError" });
});

it("reuses capped UTF-8 file reading and cancellation without executing requests", async () => {
  const control = new AbortController();
  expect(await readWatchpointFile(new File([requests], "retained.jsonl"), control.signal)).toBe(requests);
  await expect(readWatchpointFile(new File(["x".repeat(WATCHPOINT_IMPORT_LIMITS.fileBytes + 1)], "large"), control.signal)).rejects.toThrow();
  await expect(readWatchpointFile(new File([new Uint8Array([0xff])], "invalid"), control.signal)).rejects.toThrow();
  const cancelled = new AbortController();
  const pending = readWatchpointFile(new File([responses], "retained.jsonl"), cancelled.signal);
  cancelled.abort(); await expect(pending).rejects.toMatchObject({ name: "AbortError" });
});
