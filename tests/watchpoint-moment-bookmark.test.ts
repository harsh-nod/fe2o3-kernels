import { createHash, webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import requests from "./fixtures/recorded-watchpoint-requests.jsonl?raw";
import responses from "./fixtures/recorded-watchpoint-responses.jsonl?raw";
import { importRecordedWatchpoint, type RecordedWatchpointObservation } from "../src/content/recorded-watchpoint-observation";
import { WATCHPOINT_BOOKMARK_MAX_BYTES, WATCHPOINT_BOOKMARK_SCHEMA, WatchpointBookmarkError,
  serializeWatchpointMomentBookmark as save, restoreWatchpointMomentBookmark as restore,
  type WatchpointBookmarkMoment } from "../src/content/watchpoint-moment-bookmark";

// Synthetic mutation machinery only; these objects are not another producer capture.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mutable = Record<string, any>;
const moments: WatchpointBookmarkMoment[] = ["registration", "stop", "checkpoint"];
const hash = (raw: string) => createHash("sha256").update(raw).digest("hex");
function mutate(raw: string, id: number, change: (row: Mutable) => void) {
  return raw.trimEnd().split("\n").map(line => {
    const row = JSON.parse(line); if (row.request_id !== id) return line;
    change(row); return JSON.stringify(row);
  }).join("\n") + "\n";
}
function clone(data: RecordedWatchpointObservation): Mutable { return structuredClone(data); }
function asRecording(data: Mutable): RecordedWatchpointObservation {
  return data as unknown as RecordedWatchpointObservation;
}
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("exact local watchpoint moment bookmarks", () => {
  it("pins the unchanged seven real pairs and round-trips all three moments deterministically", async () => {
    expect(WATCHPOINT_BOOKMARK_MAX_BYTES).toBe(16 * 1024);
    expect(new TextEncoder().encode(requests).length).toBe(1862);
    expect(new TextEncoder().encode(responses).length).toBe(14117);
    expect(hash(requests)).toBe("f7184765621758f4e57a82ff603093c1d53474b8dc68eddf69debbaf2afc608c");
    expect(hash(responses)).toBe("4529a8186678df97fb6df4d0f306da8b93a0223d71d54600863f26a1b4dfce3f");
    const data = await importRecordedWatchpoint(requests, responses);
    expect(data.pairs.map(pair => pair.requestId)).toEqual([1, 2, 4, 5, 6, 7, 12]);
    for (const selected of moments) {
      const raw = await save(data, selected);
      expect(await save(data, selected)).toBe(raw);
      expect(new TextEncoder().encode(raw).length).toBeLessThanOrEqual(WATCHPOINT_BOOKMARK_MAX_BYTES);
      const doc = JSON.parse(raw);
      expect(Object.keys(doc).sort()).toEqual(["momentBinding", "recording", "schema", "selection", "watchpoint"]);
      expect(doc.schema).toBe(WATCHPOINT_BOOKMARK_SCHEMA);
      expect(doc.recording).toEqual({ requests: { sha256: hash(requests), bytes: 1862 },
        responses: { sha256: hash(responses), bytes: 14117 }, context: data.context });
      expect(doc.watchpoint).toEqual({ registrationRequestId: 4, listingRequestId: 5, watchpointId: 1,
        spec: data.registration.spec });
      expect(doc.selection).toEqual({ moment: selected });
      expect(await restore(data, raw)).toBe(selected);
      expect(await restore(data, " \n" + JSON.stringify(doc) + "\n")).toBe(selected);
      expect(raw).not.toContain("requestUtf8");
      expect(raw).not.toContain("responseUtf8");
      expect(raw).not.toContain("0xd5010000");
      expect(raw).not.toContain('"values"');
    }
    expect(data.pairs.map(pair => pair.requestUtf8).join("")).toBe(requests);
    expect(data.pairs.map(pair => pair.responseUtf8).join("")).toBe(responses);
    expect(Object.isFrozen(data)).toBe(true);
    expect(data.provenance).toEqual({ kind: "caller_supplied_unverified", sourceAuthentication: false,
      hardwareObserved: false, performancePrediction: false });
  });

  it("binds registration explicitly to earlier inventory, not the watchpoint stop", async () => {
    const data = await importRecordedWatchpoint(requests, responses);
    const doc = JSON.parse(await save(data, "registration"));
    expect(doc.momentBinding).toEqual({ kind: "earlier_registration_and_inventory",
      initialRequestId: 1, inventoryRequestId: 2, registrationRequestId: 4, listingRequestId: 5,
      initialAnchor: data.initial.anchor });
    expect(doc.momentBinding.initialAnchor.cursor.event_sequence).toBeLessThan(32);
    expect(doc.momentBinding.initialAnchor).not.toEqual(data.checkpoint.anchor);
    for (const missing of ["anchor", "stopRequestId", "checkpointRequestId", "memoryRequestId"])
      expect(Object.hasOwn(doc.momentBinding, missing)).toBe(false);
  });

  it("preserves uncaptured stop32/revision3 and separate later33/revision4 without synthesizing state", async () => {
    const data = await importRecordedWatchpoint(requests, responses);
    const stop = JSON.parse(await save(data, "stop")).momentBinding;
    expect(stop).toEqual({ kind: "uncaptured_watchpoint_stop", stopRequestId: 6, watchpointId: 1,
      cursor: data.stop.cursor, snapshot: { status: "unavailable", reason: "not_captured" },
      origin: { status: "unavailable", reason: "not_captured" } });
    expect(stop.cursor).toMatchObject({ event_sequence: 32, state_revision: 3 });
    for (const missing of ["anchor", "initialAnchor", "values", "memory", "source", "frame", "occurrence"])
      expect(Object.hasOwn(stop, missing)).toBe(false);
    const later = JSON.parse(await save(data, "checkpoint")).momentBinding;
    expect(later).toEqual({ kind: "separate_later_checkpoint", checkpointRequestId: 7, memoryRequestId: 12,
      anchor: data.checkpoint.anchor, belongsTo: "later_checkpoint_only" });
    expect(later.anchor.cursor).toMatchObject({ event_sequence: 33, state_revision: 4 });
  });

  it("refuses unsupported selection rather than defaulting or carrying child inspector state", async () => {
    const data = await importRecordedWatchpoint(requests, responses);
    for (const selected of ["", "later", "initial", null, undefined, 1]) {
      await expect(save(data, selected as WatchpointBookmarkMoment)).rejects.toBeInstanceOf(WatchpointBookmarkError);
      const doc = JSON.parse(await save(data, "stop")); doc.selection.moment = selected;
      await expect(restore(data, JSON.stringify(doc))).rejects.toBeInstanceOf(WatchpointBookmarkError);
    }
    for (const key of ["rawPair", "memoryCell", "interpretation", "pointer", "viewport", "comparison"]) {
      const doc = JSON.parse(await save(data, "checkpoint")); doc.selection[key] = 0;
      await expect(restore(data, JSON.stringify(doc))).rejects.toBeInstanceOf(WatchpointBookmarkError);
    }
  });

  it("joins every common hash/count/context/watchpoint field and rejects additional authority claims", async () => {
    const data = await importRecordedWatchpoint(requests, responses);
    const edits: ((doc: Mutable) => void)[] = [
      d => { d.schema += "-unknown"; }, d => { d.recording.requests.sha256 = "a".repeat(64); },
      d => { d.recording.responses.sha256 = "b".repeat(64); }, d => { d.recording.requests.bytes++; },
      d => { d.recording.responses.bytes--; }, d => { d.recording.context.connectionId += "other"; },
      d => { d.recording.context.captureIdentity = "c".repeat(64); }, d => { d.recording.context.target = "gfx942"; },
      d => { d.recording.context.variantIdentity = "other"; }, d => { d.watchpoint.registrationRequestId++; },
      d => { d.watchpoint.listingRequestId++; }, d => { d.watchpoint.watchpointId++; },
      d => { d.watchpoint.spec.allocation.ordinal++; }, d => { d.watchpoint.spec.allocation.generation++; },
      d => { d.watchpoint.spec.byte_offset++; }, d => { d.watchpoint.spec.byte_len++; },
      d => { d.watchpoint.spec.access = "read"; }, d => { d.watchpoint.spec.timing = "before_commit"; },
      d => { d.watchpoint.spec.enabled = false; }, d => { d.watchpoint.spec.client_label = "other"; },
      d => { d.sourceAuthentication = true; }, d => { d.execute = true; },
      d => { d.recording.requests.unrecognized = true; }, d => { delete d.recording.responses.bytes; },
    ];
    const raw = await save(data, "stop");
    for (const change of edits) {
      const doc = JSON.parse(raw); change(doc);
      await expect(restore(data, JSON.stringify(doc))).rejects.toBeInstanceOf(WatchpointBookmarkError);
    }
  });

  it("refuses every moment's wrong anchor, revision, identity and extra state", async () => {
    const data = await importRecordedWatchpoint(requests, responses);
    for (const selected of moments) {
      const raw = await save(data, selected);
      const first = JSON.parse(raw); first.momentBinding.kind = "other";
      await expect(restore(data, JSON.stringify(first))).rejects.toThrow(WatchpointBookmarkError);
      const extra = JSON.parse(raw); extra.momentBinding.unrecognized = true;
      await expect(restore(data, JSON.stringify(extra))).rejects.toThrow(WatchpointBookmarkError);
      for (const other of moments.filter(value => value !== selected)) {
        const swapped = JSON.parse(raw); swapped.momentBinding = JSON.parse(await save(data, other)).momentBinding;
        await expect(restore(data, JSON.stringify(swapped))).rejects.toThrow(WatchpointBookmarkError);
      }
      const doc = JSON.parse(raw);
      const anchor = selected === "registration" ? doc.momentBinding.initialAnchor :
        selected === "checkpoint" ? doc.momentBinding.anchor : null;
      if (anchor) {
        for (const edit of [
          (a: Mutable) => { a.cursor.state_revision++; }, (a: Mutable) => { a.cursor.event_sequence++; },
          (a: Mutable) => { a.cursor.configuration_identity = "d".repeat(64); }, (a: Mutable) => { a.scope.lane++; },
          (a: Mutable) => { a.scope.workgroup[0]++; }, (a: Mutable) => { a.scope.active_mask++; },
          (a: Mutable) => { a.site.source.location.map_identity = "e".repeat(64); },
          (a: Mutable) => { a.site.source.location.byte_start++; }, (a: Mutable) => { a.frame = 1; },
          (a: Mutable) => { a.occurrence = 1; },
        ]) {
          const changed = JSON.parse(raw);
          edit(selected === "registration" ? changed.momentBinding.initialAnchor : changed.momentBinding.anchor);
          await expect(restore(data, JSON.stringify(changed))).rejects.toThrow(WatchpointBookmarkError);
        }
      } else {
        for (const edit of [
          (b: Mutable) => { b.cursor.state_revision = 4; }, (b: Mutable) => { b.stopRequestId++; },
          (b: Mutable) => { b.watchpointId++; }, (b: Mutable) => { b.anchor = data.checkpoint.anchor; },
          (b: Mutable) => { b.snapshot = { status: "captured", anchor: data.checkpoint.anchor }; },
          (b: Mutable) => { b.origin = data.checkpoint.anchor.site; },
        ]) {
          const changed = JSON.parse(raw); edit(changed.momentBinding);
          await expect(restore(data, JSON.stringify(changed))).rejects.toThrow(WatchpointBookmarkError);
        }
      }
    }
  });

  it("refuses bookmarks for byte-distinct but semantically identical current recordings", async () => {
    const data = await importRecordedWatchpoint(requests, responses);
    const old = await save(data, "checkpoint");
    for (const [requestText, responseText] of [[requests.replace("{", "{ "), responses],
      [requests, responses.replace("{", "{ ")]]) {
      const changed = await importRecordedWatchpoint(requestText, responseText);
      await expect(restore(changed, old)).rejects.toThrow(WatchpointBookmarkError);
      expect(await restore(changed, await save(changed, "checkpoint"))).toBe("checkpoint");
      expect(changed.provenance.sourceAuthentication).toBe(false);
    }
  });

  it("accepts consistently renumbered synthetic claims only with their own exact bookmark", async () => {
    const data = await importRecordedWatchpoint(requests, responses);
    const old = await save(data, "registration");
    const renumber = (raw: string) => raw.trimEnd().split("\n").map(line => {
      const row = JSON.parse(line); row.request_id += 100; return JSON.stringify(row);
    }).join("\n") + "\n";
    let altered = mutate(responses, 5, row => { row.result.watchpoints[0].watchpoint_id = 9; });
    altered = mutate(altered, 6, row => { row.result.stop.watchpoint_id = 9; });
    const changed = await importRecordedWatchpoint(renumber(requests), renumber(altered));
    await expect(restore(changed, old)).rejects.toThrow(WatchpointBookmarkError);
    for (const selected of moments) {
      const raw = await save(changed, selected);
      expect(JSON.parse(raw).watchpoint.watchpointId).toBe(9);
      expect(await restore(changed, raw)).toBe(selected);
    }
    expect(changed.provenance.sourceAuthentication).toBe(false);
  });

  it("re-derives the current model instead of trusting caller-edited cached facts", async () => {
    const data = await importRecordedWatchpoint(requests, responses);
    const raw = await save(data, "stop");
    const edits: ((d: Mutable) => void)[] = [
      d => { d.requestSha256 = "f".repeat(64); }, d => { d.responseBytes++; },
      d => { d.context.connectionId += "forged"; }, d => { d.pairs[0].role = "stop"; },
      d => { d.pairs[0].line++; }, d => { d.pairs[0].request.request_id++; },
      d => { d.pairs[0].response.status = "error"; }, d => { d.pairs[0].requestUtf8 += " "; },
      d => { d.pairs[0].responseUtf8 = d.pairs[0].responseUtf8.replace("{", "{ "); },
      d => { d.initial.anchorKey += "wrong"; }, d => { d.registration.watchpointId++; },
      d => { d.registration.inventoryRow.address_space = "private"; }, d => { d.stop.cursor.state_revision++; },
      d => { d.stop.snapshot.status = "captured"; }, d => { d.checkpoint.values.push(42); },
      d => { d.memory.belongsTo = "stop"; }, d => { d.provenance.sourceAuthentication = true; },
      d => { d.pairs.reverse(); }, d => { d.pairs.pop(); }, d => { d.pairs.push(d.pairs[0]); },
    ];
    for (const edit of edits) {
      const changed = clone(data); edit(changed);
      await expect(save(asRecording(changed), "stop")).rejects.toThrow(WatchpointBookmarkError);
      await expect(restore(asRecording(changed), raw)).rejects.toThrow(WatchpointBookmarkError);
    }
  });

  it("keeps opaque u64 checkpoint values lossless without serializing them into bookmarks", async () => {
    let altered = mutate(responses, 7, row => { row.result.snapshot.snapshot.values = [42]; });
    altered = altered.replace('"values":[42]', '"values":[18446744073709551615]');
    const data = await importRecordedWatchpoint(requests, altered);
    expect(data.checkpoint.values).toEqual([18446744073709551615n]);
    for (const selected of moments) {
      const raw = await save(data, selected);
      expect(raw).not.toContain("18446744073709551615");
      expect(await restore(data, raw)).toBe(selected);
    }
  });

  it("refuses malformed, duplicate-key, unsupported-number, Unicode and over-limit documents", async () => {
    const data = await importRecordedWatchpoint(requests, responses);
    const raw = await save(data, "stop");
    const bad = ["", "null", "[]", "{}", "\ufeff" + raw, raw + "x", raw + "\ud800",
      raw.replace('"schema":', '"schema":"duplicate","schema":'),
      raw.replace('"bytes": 1862', '"bytes": -1'), raw.replace('"bytes": 1862', '"bytes": 1.5'),
      raw.replace('"bytes": 1862', '"bytes": 1e3'), raw.replace('"bytes": 1862', '"bytes": 9007199254740992'),
      raw.replace('"bytes": 1862', '"bytes": 18446744073709551615'),
      raw.replace('"stop"', '"\\ud800"'), "[".repeat(30) + "0" + "]".repeat(30),
      JSON.stringify({ ...JSON.parse(raw), extra: Array(33).fill(0) }),
      JSON.stringify({ ...JSON.parse(raw), extra: Array(32).fill(Array(32).fill(0)) }),
      " ".repeat(WATCHPOINT_BOOKMARK_MAX_BYTES + 1), "\u00e9".repeat(WATCHPOINT_BOOKMARK_MAX_BYTES / 2 + 1),
    ];
    for (const input of bad)
      await expect(restore(data, input)).rejects.toThrow(WatchpointBookmarkError);
  });

  it("bounds forged model containers, depth and accessors without reading retained getters", async () => {
    const data = await importRecordedWatchpoint(requests, responses);
    const getter = vi.fn(() => data.pairs);
    const accessor = clone(data);
    Object.defineProperty(accessor, "pairs", { enumerable: true, get: getter });
    await expect(save(asRecording(accessor), "stop")).rejects.toThrow(WatchpointBookmarkError);
    expect(getter).not.toHaveBeenCalled();
    const pairGetter = vi.fn(() => requests);
    const changed = clone(data);
    Object.defineProperty(changed.pairs[0], "requestUtf8", { enumerable: true, get: pairGetter });
    await expect(save(asRecording(changed), "stop")).rejects.toThrow(WatchpointBookmarkError);
    expect(pairGetter).not.toHaveBeenCalled();
    for (const edit of [
      (d: Mutable) => { delete d.pairs[0]; },
      (d: Mutable) => { d.checkpoint.values = Array(1025).fill(0); },
      (d: Mutable) => { d.checkpoint.values = [d]; },
      (d: Mutable) => { d.pairs[0].requestUtf8 = " ".repeat(65_538); },
      (d: Mutable) => { Object.setPrototypeOf(d.stop, Date.prototype); },
    ]) {
      const forged = clone(data); edit(forged);
      await expect(save(asRecording(forged), "stop")).rejects.toThrow(WatchpointBookmarkError);
    }
  });

  it("preserves AbortError before and after asynchronous revalidation", async () => {
    const data = await importRecordedWatchpoint(requests, responses);
    const raw = await save(data, "stop");
    const before = new AbortController(); before.abort();
    await expect(save(data, "stop", before.signal)).rejects.toMatchObject({ name: "AbortError" });
    await expect(restore(data, raw, before.signal)).rejects.toMatchObject({ name: "AbortError" });
    for (const operation of [
      (signal: AbortSignal) => save(data, "stop", signal),
      (signal: AbortSignal) => restore(data, raw, signal),
    ]) {
      const controller = new AbortController();
      const pending = operation(controller.signal); controller.abort();
      await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    }
  });

  it("requires hashing and never invokes network, storage or a file reader", async () => {
    const data = await importRecordedWatchpoint(requests, responses);
    const raw = await save(data, "checkpoint");
    const forbidden = vi.fn(() => { throw new Error("Unexpected I/O"); });
    vi.stubGlobal("fetch", forbidden);
    vi.stubGlobal("FileReader", forbidden);
    vi.stubGlobal("localStorage", { getItem: forbidden, setItem: forbidden, removeItem: forbidden });
    vi.stubGlobal("sessionStorage", { getItem: forbidden, setItem: forbidden, removeItem: forbidden });
    expect(await Promise.all(moments.map(async selected => restore(data, await save(data, selected)))))
      .toEqual(moments);
    expect(forbidden).not.toHaveBeenCalled();
    vi.stubGlobal("crypto", undefined);
    await expect(save(data, "checkpoint")).rejects.toThrow(WatchpointBookmarkError);
    await expect(restore(data, raw)).rejects.toThrow(WatchpointBookmarkError);
    expect(forbidden).not.toHaveBeenCalled();
  });
});
