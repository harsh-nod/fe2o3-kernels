import reader from "../src/content/linked-region-line-reader.mjs?raw";
import { createHash, webcrypto } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import evidence from "../examples/linked_region_lines_v1.json";
import { LINKED_LINE_LIMITS, projectLinkedRegionLines } from "../src/content/linked-region-lines.mjs";
import { LinkedLineBytes } from "../src/content/linked-region-line-reader.mjs";
type Row = { role: string; path: string; bytes: number; sha256: string; encoding: "utf8" | "hex"; data: string };
type Capsule = { schema: string; provenance: Record<string, unknown>; records: Row[] };
const hash = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const pack = (value: Capsule | string) => { const utf8 = typeof value === "string" ? value : JSON.stringify(value);
  return { utf8, bytes: Buffer.byteLength(utf8), sha256: hash(utf8) }; };
const clone = (): Capsule => JSON.parse(evidence.utf8) as Capsule;
const row = (c: Capsule, role: string) => { const result = c.records.find(r => r.role === role); if (!result) throw Error(role); return result; };
function rewrite(c: Capsule, name: string, data: string) {
  const r = row(c, name), b = Buffer.from(data, r.encoding === "hex" ? "hex" : "utf8");
  r.data = data; r.bytes = b.length; r.sha256 = hash(b);
}
async function refused(c: Capsule | string) { const v = pack(c); expect((await projectLinkedRegionLines(v, v.sha256)).status).toBe("invalid"); }
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it("replays all sixteen genuine artifacts and both exact whole-region intervals", async () => {
  const result = await projectLinkedRegionLines(evidence, evidence.sha256);
  expect(result.status).toBe("ready"); if (result.status !== "ready") return;
  expect(result.checkedArtifacts).toBe(16); expect(result.span.line).toBe(7); expect(result.span.column).toBe(20);
  expect(result.cases.map(c => [c.optimization, c.region.begin_va, c.region.end_va, c.region.begin_file_offset]))
    .toEqual([["O0", 6788, 6800, 2692], ["O3", 6444, 6456, 2348]]);
  expect(result.cases.map(c => [c.coverage[0].row_begin_va, c.coverage[0].row_end_va])).toEqual([[6668, 6812], [6400, 6488]]);
  expect(result.sourceSha256).toBe("8c8f82fe6b05a49b2195a18bde0811213e7f0a3677e5e0968083ab887daa3e29");
  expect(result.source).toContain("λ"); expect(result.span.file_identity).not.toBe(result.sourceSha256);
  expect(result.hardwareExecution).toBe(false); expect(result.runtimeAddress).toBe(false);
});
it("checks the browser byte adapter including nonzero subarray offsets and u64 width", () => {
  const b = new LinkedLineBytes([99, 0x34, 0x12, 0, 0, 0, 0, 0, 0, 0]);
  const s = b.subarray(1); expect(s).toBeInstanceOf(LinkedLineBytes);
  expect(s.readUInt16LE(0)).toBe(0x1234); expect(s.readUInt32LE(0)).toBe(0x1234);
  expect(s.readBigUInt64LE(0)).toBe(0x1234n); expect(s.subarray(0, 2).toString("hex")).toBe("3412");
  expect(() => s.readUInt32LE(s.length - 1)).toThrow();
});
it("refuses wrong selected capsule and stale bytes", async () => {
  expect((await projectLinkedRegionLines(evidence, "1".repeat(64))).status).toBe("invalid");
  expect((await projectLinkedRegionLines({ ...evidence, utf8: evidence.utf8 + " " }, evidence.sha256)).status).toBe("invalid");
});
it("refuses duplicate and unknown capsule keys", async () => {
  await refused(evidence.utf8.replace('{"schema":', '{"schema":"duplicate","schema":'));
  const c = clone(); await refused({ ...c, extra: true } as Capsule);
});
it("refuses missing, duplicated and reordered artifact duties", async () => {
  const c = clone(); c.records.pop(); await refused(c);
  const d = clone(); d.records[3] = { ...d.records[2] }; await refused(d);
  const e = clone(); [e.records[6], e.records[11]] = [e.records[11], e.records[6]]; await refused(e);
});
it("refuses authority substitutions", async () => {
  for (const key of ["producer_authenticated", "hardware_execution", "launch_authority"]) {
    const c = clone(); c.provenance[key] = true; await refused(c);
  }
});
it("refuses capsule cap plus one and wrong byte extent", async () => {
  const utf8 = " ".repeat(LINKED_LINE_LIMITS.capsuleBytes + 1);
  expect((await projectLinkedRegionLines(pack(utf8), hash(utf8))).status).toBe("invalid");
  expect((await projectLinkedRegionLines({ ...evidence, bytes: evidence.bytes - 1 }, evidence.sha256)).status).toBe("invalid");
});
it("refuses aggregate raw extent before hashing", async () => {
  const c = clone(); row(c, "source").bytes = LINKED_LINE_LIMITS.totalRawBytes; row(c, "source").data = "x".repeat(LINKED_LINE_LIMITS.totalRawBytes);
  await refused(c);
});
it("refuses malformed hex, odd length and oversized ELF", async () => {
  for (const data of ["gg", "0", "00".repeat(LINKED_LINE_LIMITS.elfBytes + 1)]) {
    const c = clone(); row(c, "O0_elf").data = data; row(c, "O0_elf").bytes = Math.floor(data.length / 2); await refused(c);
  }
});
it("refuses invalid Unicode and changed source content", async () => {
  const c = clone(); row(c, "source").data = "\ud800"; await refused(c);
  const d = clone(); rewrite(d, "source", row(d, "source").data.replace("selected", "selectee")); await refused(d);
});
it("refuses substituted LLVM and sidecar source/canonical/coordinate identities", async () => {
  const c = clone(); rewrite(c, "llvm", row(c, "llvm").data + "\n"); await refused(c);
  for (const key of ["source_bytes", "canonical"]) {
    const d = clone(), e = JSON.parse(row(d, "expected").data); e[key].sha256 = "1".repeat(64); rewrite(d, "expected", JSON.stringify(e)); await refused(d);
  }
  const d = clone(), e = JSON.parse(row(d, "expected").data); e.kir_site.block_id++; rewrite(d, "expected", JSON.stringify(e)); await refused(d);
});
it("refuses changed observer flags and optimization order", async () => {
  const c = clone(), o = JSON.parse(row(c, "report").data); o.hardware_executed = true; rewrite(c, "report", JSON.stringify(o)); await refused(c);
  const d = clone(), p = JSON.parse(row(d, "report").data); p.cases.reverse(); rewrite(d, "report", JSON.stringify(p)); await refused(d);
});
it("refuses swapped O0/O3 ELF payloads even when each row is rehashed", async () => {
  const c = clone(), a = row(c, "O0_elf").data, b = row(c, "O3_elf").data;
  rewrite(c, "O0_elf", b); rewrite(c, "O3_elf", a); await refused(c);
});
it("refuses ELF corruption and file-offset/VA substitution", async () => {
  const c = clone(), b = Buffer.from(row(c, "O0_elf").data, "hex"); b[0] = 0; rewrite(c, "O0_elf", b.toString("hex")); await refused(c);
  const d = clone(), o = JSON.parse(row(d, "report").data); o.cases[0].entry_file_offset = 6656; rewrite(d, "report", JSON.stringify(o)); await refused(d);
});
it("refuses missing OpIndex and nonzero OpIndex", async () => {
  const c = clone(); rewrite(c, "O0_line_stdout", row(c, "O0_line_stdout").data.replace("OpIndex", "Missing")); await refused(c);
  const d = clone(); rewrite(d, "O0_line_stdout", row(d, "O0_line_stdout").data.replace(/(0x[0-9a-f]+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+)0/u, (_match, prefix: string) => prefix + "1")); await refused(d);
});
it("refuses changed line table geometry, source column and incomplete coverage", async () => {
  const changes = [(s: string) => s.replace(/max_ops_per_inst:\s*1/u, "max_ops_per_inst: 2"),
    (s: string) => s.replace(/(\s7\s+)20(\s)/gu, (_match, prefix: string, suffix: string) => prefix + "19" + suffix),
    (s: string) => s.replace(/0x0000000000001a9c/u, "0x0000000000001a84")];
  for (const change of changes) { const c = clone(), s = row(c, "O0_line_stdout").data;
    const changed = change(s); expect(changed).not.toBe(s); rewrite(c, "O0_line_stdout", changed); await refused(c); }
});
it("refuses diagnostics in either required EOF stream and missing verify completion", async () => {
  for (const name of ["O0_verify_stderr", "O3_line_stderr"]) { const c = clone(); rewrite(c, name, "error"); await refused(c); }
  const c = clone(); rewrite(c, "O0_verify_stdout", "verification started\n"); await refused(c);
});
it("refuses false source postflight and old-source substitution", async () => {
  const c = clone(), p = JSON.parse(row(c, "pair").data); p.observations[1].observation.source_rechecked_after_line_export = false;
  rewrite(c, "pair", JSON.stringify(p)); await refused(c);
  const d = clone(), a = JSON.parse(row(d, "expected").data); a.scenario = "default"; rewrite(d, "expected", JSON.stringify(a)); await refused(d);
});
it("refuses altered accepted coverage and hidden acceptance fields", async () => {
  const c = clone(), a = JSON.parse(row(c, "acceptance").data); a.cases[0].coverage[0].end_va--; rewrite(c, "acceptance", JSON.stringify(a)); await refused(c);
  const d = clone(), b = JSON.parse(row(d, "acceptance").data); b.extra = true; rewrite(d, "acceptance", JSON.stringify(b)); await refused(d);
});
it("refuses wrong original selected paths, accounting and source association", async () => {
  const c = clone(); row(c, "O0_elf").path += ".other"; await refused(c);
  const d = clone(), a = JSON.parse(row(d, "acceptance").data); a.read_accounting.reserved_content_plus_eof--; rewrite(d, "acceptance", JSON.stringify(a)); await refused(d);
  const e = clone(); row(e, "source").path += ".other"; await refused(e);
  const f = clone(), b = JSON.parse(row(f, "acceptance").data); b.read_accounting.read_calls = 0; rewrite(f, "acceptance", JSON.stringify(b)); await refused(f);
});
it("copies all caller-controlled bytes before async hashing and keeps concurrent calls separate", async () => {
  const input = { ...evidence }; const pending = projectLinkedRegionLines(input, input.sha256);
  input.utf8 = "{}"; input.bytes = 2;
  const [a, b] = await Promise.all([pending, projectLinkedRegionLines(evidence, evidence.sha256)]);
  expect(a.status).toBe("ready"); expect(b.status).toBe("ready");
});
it("reports missing crypto without synthetic data", async () => {
  vi.stubGlobal("crypto", undefined); expect((await projectLinkedRegionLines(evidence, evidence.sha256)).status).toBe("unavailable");
});
it("performs no fetch and exposes deeply frozen observations", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const result = await projectLinkedRegionLines(evidence, evidence.sha256);
  expect(result.status).toBe("ready"); expect(fetch).not.toHaveBeenCalled();
  if (result.status === "ready") { expect(Object.isFrozen(result.cases[0].coverage[0])).toBe(true); expect(Object.isFrozen(result.sourceIdentity)).toBe(true); }
});

it("retains the exact export-custody literal and replays the genuine accepted record", async () => {
  const accepted = JSON.parse(row(clone(), "acceptance").data);
  const literal = "root-selected same-owner export evidence; not reconstructed by this parser";
  expect(accepted.source_custody).toBe(literal);
  expect(reader).toContain("source_custody:'" + literal + "'");
  expect(reader).not.toContain("source_custody:'root-selected same-owner evidence;");
  expect((await projectLinkedRegionLines(evidence, evidence.sha256)).status).toBe("ready");
});
