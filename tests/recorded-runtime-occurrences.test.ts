import { createHash, webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import reportUtf8 from "./fixtures/recorded-runtime-occurrences.json?raw";
import { importRecordedRuntimeOccurrences as project, RuntimeOccurrenceImportError,
  RUNTIME_OCCURRENCE_LIMITS } from "../src/content/recorded-runtime-occurrences";

// The positive fixture is actual retained producer stdout. All changed documents
// below are synthetic refusal/consistency controls, never additional executions.
const REPORT_SHA256 = "e0ab244eaf7fb0667b635dbe48408c1c51226ae5c38eb7766f1eab8aceb55c5c";
const REPORT_BYTES = 39809;
const BUNDLE_SHA256 = "73bd318be3af7bf1b98d093fc4bf95ca98ec4055b168b696d0a7a7abc5a57c75";
const hash = (raw: string) => createHash("sha256").update(raw).digest("hex");
const pins = { reportSha256: REPORT_SHA256, bundleSha256: BUNDLE_SHA256 };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mutable = Record<string, any>;
type CompactRow = [number, number, number, number[], number, number, number, number, number, number];
const original = (): Mutable => JSON.parse(reportUtf8);
function changed(edit: (value: Mutable) => void): string {
  const value = original(); edit(value); return JSON.stringify(value) + "\n";
}
function synthetic(raw: string) {
  return project(raw, { reportSha256: hash(raw), bundleSha256: BUNDLE_SHA256 });
}
function renumber(value: Mutable, index = 4) {
  const rows = value.cases[index].observation.rows;
  rows.forEach((row: CompactRow, ordinal: number) => { row[0] = ordinal; });
  value.cases[index].observation.records = rows.length;
}
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("retained ordinary-source runtime occurrences", () => {
  it("pins the actual raw report and derives all six cases and 32 helpers without inventing opt-out rows", async () => {
    expect(hash(reportUtf8)).toBe(REPORT_SHA256);
    expect(new TextEncoder().encode(reportUtf8).length).toBe(REPORT_BYTES);
    const data = await project(reportUtf8, pins);
    expect(data.reportSha256).toBe(REPORT_SHA256);
    expect(data.reportBytes).toBe(REPORT_BYTES);
    expect(data.rawUtf8).toBe(reportUtf8);
    expect(data.bundleSha256).toBe(BUNDLE_SHA256);
    expect(data.cases.map(row => [row.rounds, row.schedule])).toEqual([
      [0, "canonical"], [0, "seeded_71"], [1, "canonical"], [1, "seeded_71"],
      [3, "canonical"], [3, "seeded_71"],
    ]);
    expect(data.cases.map(row => row.helpers.length)).toEqual([0, 0, 4, 4, 12, 12]);
    expect(data.cases.map(row => row.rows.length)).toEqual([116, 116, 180, 180, 308, 308]);
    expect(data.cases.reduce((sum, row) => sum + row.rows.length, 0)).toBe(1208);
    expect(data.cases.every(row => row.rows.length <= RUNTIME_OCCURRENCE_LIMITS.rowsPerCase)).toBe(true);
    expect(data.provenance).toEqual({ kind: "caller_supplied_unverified", sourceAuthentication: false,
      compilerResumeAuthority: false, hardwareObserved: false, performancePrediction: false,
      sourceMapsAvailable: false, snapshotsAvailable: false, fullCallStacksAvailable: false,
      optOutRowsAvailable: false, producerReportsOptOutEquality: true });
    expect(Object.hasOwn(data, "optOutRows")).toBe(false);
    expect(Object.isFrozen(data)).toBe(true);
    expect(Object.isFrozen(data.cases[4].helpers[0].attemptKeys)).toBe(true);
    expect(Object.isFrozen(data.cases[0].rows[0].site)).toBe(true);
  });

  it("retains every original compact row and separates raw blocks from authoring positions", async () => {
    const data = await project(reportUtf8, pins), raw = original();
    expect(data.topology.callSite).toEqual(raw.topology.call);
    expect(data.topology.callSite).toEqual([0, 1, 1]);
    expect(data.topology.callAuthoringCoordinate).toEqual([0, 3, 1]);
    expect(data.topology.callAuthoringCoordinate).toEqual(raw.topology.call_authoring_coordinate);
    expect(data.topology.helperSites).toEqual(raw.topology.helper_sites);
    expect(data.topology.helperAuthoringCoordinates).toEqual(raw.topology.helper_authoring_coordinates);
    expect(data.identities.canonicalKirSha256).toBe(raw.canonical_kir_sha256);
    expect(data.identities.canonicalKirDigest).toBe(raw.canonical_kir_digest);
    for (const item of data.cases) {
      expect(item.rows.length).toBe(raw.cases[item.index].observation.records);
      for (const row of item.rows) {
        const originalRow = raw.cases[item.index].observation.rows[row.ordinal];
        expect([row.ordinal, row.decision, row.invocation, row.site,
          ["before_operation", "after_operation", "write_committed"].indexOf(row.phase),
          row.activation, row.attempt, row.committedWrite?.allocation ?? 0,
          row.committedWrite?.byteOffset ?? 0, row.committedWrite?.u32Bits ?? 0]).toEqual(originalRow);
        expect(Object.hasOwn(row, "source")).toBe(false);
        expect(Object.hasOwn(row, "snapshot")).toBe(false);
        expect(Object.hasOwn(row, "frame")).toBe(false);
      }
    }
  });

  it("joins each helper to exactly one caller and all three pure attempts in its invocation", async () => {
    const data = await project(reportUtf8, pins);
    for (const item of data.cases) {
      for (let invocation = 0; invocation < 4; invocation++)
        expect(item.helpers.filter(helper => helper.invocation === invocation)).toHaveLength(item.rounds);
      for (const helper of item.helpers) {
        const call = item.attempts.find(attempt => attempt.key === helper.callerAttemptKey)!;
        expect(call.invocation).toBe(helper.invocation);
        expect(call.activation).toBe(1);
        expect(call.site).toEqual(data.topology.callSite);
        expect(helper.callBeforeRow).toBe(call.beforeRow);
        expect(helper.callAfterRow).toBe(call.afterRow);
        expect(call.beforeRow).toBeLessThan(helper.firstRow);
        expect(helper.lastRow).toBeLessThan(call.afterRow);
        expect(helper.attemptKeys).toHaveLength(3);
        for (const [index, key] of helper.attemptKeys.entries()) {
          const attempt = item.attempts.find(candidate => candidate.key === key)!;
          expect(attempt.invocation).toBe(helper.invocation);
          expect(attempt.activation).toBe(helper.activation);
          expect(attempt.attempt).toBe(index + 1);
          expect(attempt.site).toEqual(data.topology.helperSites[index]);
          expect(attempt.writeRows).toEqual([]);
          expect(item.rows[attempt.beforeRow].phase).toBe("before_operation");
          expect(item.rows[attempt.afterRow].phase).toBe("after_operation");
        }
      }
    }
  });

  it("scopes repeated tokens by report, case and invocation rather than merging activations", async () => {
    const data = await project(reportUtf8, pins);
    const allKeys = data.cases.flatMap(item => [item.key, ...item.rows.map(row => row.key),
      ...item.attempts.map(attempt => attempt.key), ...item.helpers.map(helper => helper.key)]);
    expect(new Set(allKeys).size).toBe(allKeys.length);
    expect(data.cases[4].helpers.filter(helper => helper.invocation === 0)).toHaveLength(3);
    const whitespace = reportUtf8 + " ";
    await expect(project(whitespace, pins)).rejects.toThrow(RuntimeOccurrenceImportError);
    const differentBytes = await synthetic(whitespace);
    expect(differentBytes.cases[4].helpers[0].key).not.toBe(data.cases[4].helpers[0].key);
    expect(differentBytes.provenance.sourceAuthentication).toBe(false);
  });

  it("retains only actual committed-write scalars and never fabricates checkpoint memory", async () => {
    const data = await project(reportUtf8, pins);
    for (const item of data.cases) {
      const writes = item.rows.filter(row => row.phase === "write_committed");
      expect(writes).toHaveLength(4);
      expect(new Set(writes.map(row => row.invocation)).size).toBe(4);
      for (const row of writes) {
        expect(row.committedWrite).toMatchObject({ byteOffset: 4 + 4 * row.invocation, u32Bits: item.expectedWord });
        const owner = item.attempts.find(attempt => attempt.writeRows.includes(row.ordinal))!;
        expect(owner.beforeRow).toBeLessThan(row.ordinal);
        expect(row.ordinal).toBeLessThan(owner.afterRow);
      }
      for (const row of item.rows.filter(row => row.phase !== "write_committed")) expect(row.committedWrite).toBeNull();
      for (const key of ["memory", "snapshot", "source", "callStack", "registers", "outputBytes"])
        expect(Object.hasOwn(item, key)).toBe(false);
    }
  });

  it("rejects wrong pins, authority, scope, targets and unknown fields without fallback", async () => {
    for (const bad of [
      { ...pins, reportSha256: "f".repeat(64) }, { ...pins, bundleSha256: "e".repeat(64) },
      { ...pins, reportSha256: "0".repeat(64) }, { ...pins, reportSha256: REPORT_SHA256.toUpperCase() },
      { ...pins, unknown: true },
    ]) await expect(project(reportUtf8, bad)).rejects.toThrow(RuntimeOccurrenceImportError);
    const edits: ((row: Mutable) => void)[] = [
      row => { row.schema += "-other"; }, row => { row.status = "failed"; },
      row => { row.bundle_sha256 = "a".repeat(64); }, row => { row.target = "gfx950"; },
      row => { row.source_authenticated = true; }, row => { row.hardware_observed = true; },
      row => { row.compiler_resume_authority = true; }, row => { row.scope = "live"; },
      row => { row.canonical_kir_sha256 = "0".repeat(64); },
      row => { row.canonical_kir_digest = "not-an-identity"; },
      row => { row.kernel_abi_identity = 42; }, row => { row.semantic_mir_identity = ""; },
      row => { row.bundle_identity = null; }, row => { row.canonical_kir_bytes = 0; },
      row => { row.production_kir_identity = "x".repeat(513); },
      row => { row.production_kir_identity = "bad\nlineage"; }, row => { row.checkpoint = {}; },
      row => { delete row.scope; }, row => { row.topology.extra = true; },
      row => { row.cases[0].extra = true; }, row => { row.cases[0].observation.extra = true; },
    ];
    for (const edit of edits) await expect(synthetic(changed(edit))).rejects.toThrow(RuntimeOccurrenceImportError);
  });

  it("rejects wrong case/aggregate counts, canaries and opt-out comparison claims", async () => {
    const edits: ((row: Mutable) => void)[] = [
      row => { row.cases.pop(); }, row => { row.cases.push(row.cases[0]); }, row => { row.cases.reverse(); },
      row => { row.contextual_runs++; }, row => { row.opt_out_runs--; }, row => { row.helper_activations++; },
      row => { row.cases[4].rounds = 2; }, row => { row.cases[0].schedule = "canonical_other"; },
      row => { row.cases[0].invocations = 64; }, row => { row.cases[0].steps = 0; },
      row => { row.cases[0].steps = 4097; }, row => { row.cases[0].expected_word++; },
      row => { row.cases[0].full_execution_equal = false; },
      row => { row.cases[0].compact_legacy_records_equal = false; },
      row => { row.cases[0].output_bytes[0] ^= 1; }, row => { row.cases[0].output_bytes[23] ^= 1; },
      row => { row.cases[0].observation.records++; }, row => { row.cases[0].observation.global_writes--; },
      row => { row.cases[4].observation.call_attempts--; }, row => { row.cases[4].observation.helper_activations--; },
    ];
    for (const edit of edits) await expect(synthetic(changed(edit))).rejects.toThrow(RuntimeOccurrenceImportError);
  });

  it("rejects unsupported topology and runtime-to-authoring coordinate substitutions", async () => {
    const edits: ((row: Mutable) => void)[] = [
      row => { row.topology.entry = row.topology.helper; }, row => { row.topology.cycle = []; },
      row => { row.topology.cycle.push(row.topology.cycle[0]); },
      row => { row.topology.call_authoring_coordinate[0] = row.topology.helper; },
      row => { row.topology.call_authoring_coordinate[2]++; },
      row => { row.topology.call_authoring_coordinate[1] = 64; },
      row => { row.topology.helper_authoring_coordinates[1] = row.topology.helper_authoring_coordinates[0]; },
      row => { row.topology.helper_sites[1][1]++; }, row => { row.topology.helper_sites.pop(); },
      row => { row.topology.call[1] = 0xffffffff; },
    ];
    for (const edit of edits) await expect(synthetic(changed(edit))).rejects.toThrow(RuntimeOccurrenceImportError);
  });

  it("preserves a consistently changed raw BlockId as an unverified coordinate, never a source position", async () => {
    const raw = changed(value => {
      const old = value.topology.helper_sites[0][1];
      for (const site of value.topology.helper_sites) site[1] = 999;
      for (const item of value.cases) for (const row of item.observation.rows)
        if (row[3][0] === value.topology.helper && row[3][1] === old) row[3][1] = 999;
    });
    const data = await synthetic(raw);
    expect(data.topology.helperSites[0][1]).toBe(999);
    expect(data.topology.helperAuthoringCoordinates[0][1]).toBe(0);
    expect(data.provenance.sourceMapsAvailable).toBe(false);
    expect(data.provenance.sourceAuthentication).toBe(false);
  });

  it("rejects malformed rows, reused tokens, skipped attempts and foreign invocations", async () => {
    const edits: ((row: Mutable) => void)[] = [
      value => { value.cases[4].observation.rows[0][0]++; },
      value => { value.cases[4].observation.rows[0][1] = 4098; },
      value => { value.cases[4].observation.rows[0][2] = 4; },
      value => { value.cases[4].observation.rows[0][3] = [7, 1, 1]; },
      value => { value.cases[4].observation.rows[0][4] = 3; },
      value => { value.cases[4].observation.rows[0][5] = 0; },
      value => { value.cases[4].observation.rows[0][6] = 2; },
      value => { value.cases[4].observation.rows[0].push(0); },
      value => { value.cases[4].observation.rows[0] = null; },
      value => { value.cases[4].observation.rows[0][7] = 1; },
      value => { value.cases[4].observation.rows.find((row: CompactRow) => row[4] === 1)[6] = 4097; },
      value => { value.cases[4].observation.rows.find((row: CompactRow) => row[4] === 1)[3][1]++; },
      value => { value.cases[4].observation.rows.find((row: CompactRow) => row[3][0] === value.topology.helper)[5] = 1; },
      value => { value.cases[4].observation.rows.pop(); renumber(value); },
    ];
    for (const edit of edits) await expect(synthetic(changed(edit))).rejects.toThrow(RuntimeOccurrenceImportError);
  });

  it("rejects reusing one helper token for a later call even when aggregate counts remain 32", async () => {
    const raw = changed(value => {
      const rows = value.cases[4].observation.rows;
      const helperRows = rows.filter((row: CompactRow) => row[2] === 0 && row[3][0] === value.topology.helper);
      const tokens = [...new Set(helperRows.map((row: CompactRow) => row[5]))];
      expect(tokens).toHaveLength(3);
      for (const row of helperRows) if (row[5] === tokens[1]) row[5] = tokens[0];
    });
    await expect(synthetic(raw)).rejects.toThrow(RuntimeOccurrenceImportError);
  });

  it("rejects helper records outside their caller interval instead of guessing a parent", async () => {
    const raw = changed(value => {
      const rows = value.cases[4].observation.rows;
      const index = rows.findIndex((row: CompactRow) => row[2] === 0 && row[3][0] === value.topology.helper);
      const activation = rows[index][5];
      const selected = rows.filter((row: CompactRow) => row[2] === 0 && row[3][0] === value.topology.helper &&
        row[5] === activation);
      value.cases[4].observation.rows = [
        ...selected,
        ...rows.filter((row: CompactRow) => !(row[2] === 0 && row[3][0] === value.topology.helper && row[5] === activation)),
      ];
      renumber(value);
    });
    await expect(synthetic(raw)).rejects.toThrow(RuntimeOccurrenceImportError);
  });

  it("rejects missing helper operations and all changed committed-write facts", async () => {
    const edits: ((row: Mutable) => void)[] = [
      value => {
        const rows = value.cases[4].observation.rows;
        const index = rows.findIndex((row: CompactRow) => row[3][0] === value.topology.helper);
        rows.splice(index, 1); renumber(value);
      },
      ...[7, 8, 9].map(column => (value: Mutable) => {
        const row = value.cases[4].observation.rows.find((row: CompactRow) => row[4] === 2);
        row[column] = column === 7 ? 0 : row[column] ^ 1;
      }),
      value => {
        const rows = value.cases[4].observation.rows;
        const index = rows.findIndex((row: CompactRow) => row[4] === 2);
        rows.splice(index, 0, structuredClone(rows[index])); renumber(value);
      },
    ];
    for (const edit of edits) await expect(synthetic(changed(edit))).rejects.toThrow(RuntimeOccurrenceImportError);
  });

  it("refuses duplicate JSON keys, unsupported numeric forms and malformed Unicode", async () => {
    const bad = ["", "null", "[]", "{}", "\ufeff" + reportUtf8, reportUtf8 + "x", reportUtf8 + "\ud800",
      reportUtf8.replace('"schema":', '"schema":"duplicate","schema":'),
      changed(value => { value.cases[0].steps = -1; }),
      changed(value => { value.cases[0].steps = 1.5; }),
      changed(value => { value.cases[0].steps = Number.MAX_SAFE_INTEGER + 1; }),
      changed(value => { value.production_kir_identity = "\ud800"; }),
      ...[0, 10, 31, 127].map(code => changed(value => {
        value.production_kir_identity = "opaque" + String.fromCharCode(code);
      })),
      "[".repeat(30) + "0" + "]".repeat(30)];
    for (const raw of bad) await expect(synthetic(raw)).rejects.toThrow(RuntimeOccurrenceImportError);
  });

  it("enforces byte, per-case row and topology bounds before making partial observations available", async () => {
    const bad = [" ".repeat(RUNTIME_OCCURRENCE_LIMITS.reportBytes + 1),
      "\u00e9".repeat(RUNTIME_OCCURRENCE_LIMITS.reportBytes / 2 + 1),
      changed(value => { value.cases[0].observation.rows = Array(1025).fill(value.cases[0].observation.rows[0]); }),
      changed(value => { value.topology.cycle = Array.from({ length: 65 }, (_, index) => index); }),
      changed(value => { value.canonical_kir_bytes = 256 * 1024 + 1; })];
    for (const raw of bad) await expect(synthetic(raw)).rejects.toThrow(RuntimeOccurrenceImportError);
  });

  it("preserves cancellation across hashing and snapshots expected pins before yielding", async () => {
    const controller = new AbortController(); controller.abort();
    await expect(project(reportUtf8, pins, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
    const after = new AbortController();
    const pending = project(reportUtf8, pins, after.signal); after.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    const mutable = { ...pins }, work = project(reportUtf8, mutable);
    mutable.reportSha256 = "f".repeat(64); mutable.bundleSha256 = "e".repeat(64);
    expect((await work).reportSha256).toBe(REPORT_SHA256);
  });

  it("requires WebCrypto and never invokes network, storage, FileReader or source/compiler services", async () => {
    const forbidden = vi.fn(() => { throw new Error("Unexpected I/O"); });
    vi.stubGlobal("fetch", forbidden);
    vi.stubGlobal("FileReader", forbidden);
    vi.stubGlobal("localStorage", { getItem: forbidden, setItem: forbidden });
    vi.stubGlobal("sessionStorage", { getItem: forbidden, setItem: forbidden });
    expect((await project(reportUtf8, pins)).cases).toHaveLength(6);
    expect(forbidden).not.toHaveBeenCalled();
    vi.stubGlobal("crypto", undefined);
    await expect(project(reportUtf8, pins)).rejects.toThrow(RuntimeOccurrenceImportError);
    expect(forbidden).not.toHaveBeenCalled();
  });
});
