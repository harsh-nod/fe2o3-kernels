import { createHash, webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FINAL_NATIVE_LIMITS } from "../src/content/final-native-comparison.mjs";
import { REPEAT_NATIVE_LIMITS, copyRepeatNativeEvidence, projectRepeatNativeComparison } from "../src/content/repeat-native-comparison.mjs";
import { repeatFixture, type MutableRepeatCapsule } from "./fixtures/repeat-native-synthetic.mjs";
const H = (value: string) => createHash("sha256").update(value).digest("hex");
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { vi.unstubAllGlobals(); });
const project = async (fixture = repeatFixture()) => projectRepeatNativeComparison(fixture.capsule, fixture.joinSha256);
const ready = async () => {
  const result = await project();
  if (result.status !== "ready") throw new Error(result.detail);
  return result;
};
function replaceText(capsule: MutableRepeatCapsule, index: number, value: string) {
  const a = capsule.artifacts[index];
  a.bytes = Buffer.byteLength(value); a.sha256 = H(value); a.chunks = [];
  for (let at = 0; at < value.length; at += 65536) a.chunks.push(value.slice(at, at + 65536));
}
describe("separate bounded repeat-native selected-artifact projection", () => {
  it("retains all eight distinct cases and unused declared roles without claiming liveness", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const result = await ready();
    expect(result.kind).toBe("synthetic_test_only");
    expect(result.checkedArtifacts).toBe(23);
    expect(result.cases.map(c => c.id)).toEqual(["one-O0", "one-O3", "two-O0", "two-O3",
      "fifteen-O0", "fifteen-O3", "repeat-O0", "repeat-O3"]);
    expect(result.cases.map(c => c.program.length)).toEqual([2, 2, 3, 3, 16, 16, 16, 16]);
    for (const item of result.cases) {
      expect(item.declaredVgprHighWater).toBe(37);
      expect(item.architectedVgprBoundary).toBe(40);
      expect(item.encodedVgprCapacity).toBe(item.optimization === "O0" ? 56 : 40);
      expect(item.registerGrid.roles.map(row => [row.role, row.register])).toEqual([
        ["scratch", 32], ["output", 33], ["input0", 34], ["input1", 35], ["input2", 36],
      ]);
      expect(item.registerGrid.instructionOffsets).toEqual(item.program.map(s => s.fileOffset));
      expect(item.registerGrid.roles[0].uses.every(use => use === "none")).toBe(true);
      expect(item.registerGrid.roles[4].uses.every(use => use === "none")).toBe(true);
      expect(item.registerGrid.roles[1].uses).toEqual(["write", ...Array(item.repetitions).fill("read-write")]);
      expect(item.registerGrid.roles[2].uses).toEqual(["read", ...Array(item.repetitions).fill("none")]);
      expect(item.registerGrid.roles[3].uses).toEqual(["none", ...Array(item.repetitions).fill("read")]);
      expect(item.registerGrid.interpretation).toBe("static_explicit_instruction_uses_only");
      expect(Object.isFrozen(item.registerGrid.roles[0].uses)).toBe(true);
    }
    expect(result.cases[4].hsacoSha256).toBe(result.cases[6].hsacoSha256);
    expect(result.cases[4].payloadPath).not.toBe(result.cases[6].payloadPath);
    expect(result.cases[4].id).not.toBe(result.cases[6].id);
    expect(result.cases[4].reportSha256).not.toBe(result.cases[6].reportSha256);
    expect(result.unavailable).toContain("Physical values and register lifetimes");
    expect(result.unavailable).toContain("Replay of the full producer input census or CPU runs");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("accepts its explicit JSON transport, copies before await, and leaves old limits untouched", async () => {
    const fixture = repeatFixture(), encoded = JSON.stringify(fixture.capsule);
    expect((await projectRepeatNativeComparison(encoded, fixture.joinSha256)).status).toBe("ready");
    const pending = project(fixture);
    fixture.capsule.artifacts[0].chunks[0] = "changed after invocation";
    expect((await pending).status).toBe("ready");
    expect(FINAL_NATIVE_LIMITS).toEqual({ artifactBytes: 262144, sourceBytes: 65536, reportBytes: 65536,
      payloadBytes: 65536, totalBytes: 2097152, payloads: 4, artifacts: 14 });
    expect(REPEAT_NATIVE_LIMITS).toEqual({ chunkBytes: 65536, receiptBytes: 524288, artifactBytes: 65536,
      totalBytes: 2097152, outerBytes: 4194304, artifacts: 23, payloads: 8 });
  });
  it("bounds chunks before reassembly while supporting a receipt larger than the old per-string limit", () => {
    const { capsule } = repeatFixture();
    replaceText(capsule, 0, " ".repeat(262145));
    const copied = copyRepeatNativeEvidence(capsule);
    expect(copied.artifacts[0].chunks).toHaveLength(5);
    expect(copied.artifacts[0].bytes).toBe(262145);
    expect(Object.isFrozen(copied.artifacts[0].chunks)).toBe(true);
    // Only the envelope is inspected here; whitespace is not a positive receipt.
  });
  it("refuses per-chunk, per-artifact, aggregate and outer budgets independently", () => {
    const { capsule } = repeatFixture();
    const oversizedChunk = structuredClone(capsule);
    oversizedChunk.artifacts[0].chunks[0] = "x".repeat(65537);
    expect(() => copyRepeatNativeEvidence(oversizedChunk)).toThrow();
    const oversizedReceipt = structuredClone(capsule); oversizedReceipt.artifacts[0].bytes = 524289;
    expect(() => copyRepeatNativeEvidence(oversizedReceipt)).toThrow();
    const oversizedLeaf = structuredClone(capsule); oversizedLeaf.artifacts[3].bytes = 65537;
    expect(() => copyRepeatNativeEvidence(oversizedLeaf)).toThrow();
    const total = structuredClone(capsule);
    total.artifacts.forEach((a, index) => {
      const bytes = index < 3 ? 524288 : 65536;
      a.bytes = bytes; a.chunks = Array(index < 3 ? 8 : index >= 15 ? 2 : 1).fill(index >= 15 ? "ab".repeat(32768) : "x".repeat(65536));
    });
    expect(() => copyRepeatNativeEvidence(total)).toThrow(/total artifact cap/u);
    const outer = structuredClone(capsule);
    for (let index = 0; index < 3; index++) replaceText(outer, index, "\0".repeat(524288));
    expect(() => copyRepeatNativeEvidence(outer)).toThrow(/outer JSON cap/u);
    expect(() => copyRepeatNativeEvidence(" ".repeat(4194305))).toThrow();
  });
  it("rejects sparse/extra/reordered rosters, invalid Unicode, empty chunks and noncanonical hex", () => {
    const fixture = repeatFixture();
    for (const change of [
      (c: MutableRepeatCapsule) => { c.artifacts.reverse(); },
      (c: MutableRepeatCapsule) => { c.artifacts.push(c.artifacts[0]); },
      (c: MutableRepeatCapsule) => { delete c.artifacts[0]; },
      (c: MutableRepeatCapsule) => { c.artifacts[0].chunks[0] = "\ud800"; },
      (c: MutableRepeatCapsule) => { c.artifacts[0].chunks.push(""); },
      (c: MutableRepeatCapsule) => { c.artifacts[15].chunks = ["0"]; },
      (c: MutableRepeatCapsule) => { c.artifacts[15].chunks = ["AB"]; },
      (c: MutableRepeatCapsule) => { c.artifacts[0].path = "/synthetic/../receipt.json"; },
      (c: MutableRepeatCapsule) => { c.schema = "fe2o3-final-native-comparison-example-v1"; },
    ]) {
      const copy = structuredClone(fixture.capsule); change(copy);
      expect(() => copyRepeatNativeEvidence(copy)).toThrow();
    }
    expect(() => copyRepeatNativeEvidence('{"schema":1,"schema":2}')).toThrow();
  });
  it("refuses changed whole bytes, stale joins and source/LLVM/O0-O3 substitutions without a partial grid", async () => {
    const fixture = repeatFixture();
    const stale = await projectRepeatNativeComparison(fixture.capsule, "f".repeat(64));
    expect(stale.status).toBe("invalid"); expect(stale).not.toHaveProperty("cases");
    for (const [left, right] of [[3, 4], [7, 8], [15, 16], [19, 21]]) {
      const copy = structuredClone(fixture.capsule), a = copy.artifacts[left], b = copy.artifacts[right];
      [a.bytes, b.bytes] = [b.bytes, a.bytes]; [a.sha256, b.sha256] = [b.sha256, a.sha256];
      [a.chunks, b.chunks] = [b.chunks, a.chunks];
      // fifteen/repeat payload bytes intentionally match: swap their paths too to test invocation identity.
      if (left === 19) [a.path, b.path] = [b.path, a.path];
      const result = await projectRepeatNativeComparison(copy, fixture.joinSha256);
      expect(result.status).toBe("invalid"); expect(result).not.toHaveProperty("cases");
    }
    const changed = structuredClone(fixture.capsule); changed.artifacts[0].chunks[0] += " ";
    const result = await projectRepeatNativeComparison(changed, fixture.joinSha256);
    expect(result.status).toBe("invalid"); expect(result).not.toHaveProperty("cases");
  });
  it.each([
    ["sourceReceipt", ["variants", 0, "repetitions"], 2],
    ["sourceReceipt", ["variants", 0, "simulations", 0, "expected_word"], 42],
    ["sourceReceipt", ["source_authentication"], true],
    ["llvmReceipt", ["variants", 0, "source_sha256"], "e".repeat(64)],
    ["llvmReceipt", ["variants", 0, "report", "register_plan"], [32, 33, 34, 35, 37]],
    ["report/one", ["target"], "gfx950:xnack-"],
    ["report/one", ["hardware_execution"], true],
    ["report/one", ["cases", 0, "machine_observation", "program", 1, "file_offset"], 88],
    ["report/one", ["cases", 0, "machine_observation", "program", 0, "register_operands"], ["VGPR33", "VGPR36"]],
    ["report/one", ["cases", 0, "machine_observation", "program", 0, "implicit_writes"], ["EXEC"]],
    ["report/one", ["cases", 0, "machine_observation", "program", 0, "mc_flags"], 1],
    ["report/one", ["cases", 0, "machine_observation", "descriptor", "compute_pgm_rsrc1"], 4],
    ["report/one", ["cases", 0, "machine_observation", "descriptor", "vgpr_capacity"], 64],
    ["report/one", ["cases", 0, "machine_observation", "descriptor", "file_offset"], 64],
    ["report/one", ["cases", 0, "machine_observation", "boundary_value_or_lifetime_proof"], true],
    ["report/one", ["cases", 0, "machine_observation", "llvm_sha256"], "e".repeat(64)],
    ["join", ["fresh_native_invocations"], 3],
    ["join", ["native", 3, "label"], "fifteen"],
    ["join", ["source_capture", "inode"], "99"],
    ["join", ["llvm_variants", 0, "canonical_identity"], "e".repeat(64)],
  ] as const)("rejects coherently rehashed %s field edits at %j", async (role, path, value) => {
    const fixture = repeatFixture([{ role, path, value }]), result = await project(fixture);
    expect(result.status).toBe("invalid"); expect(result).not.toHaveProperty("cases");
  });
  it("retains the shared parser's inner string, array and duplicate-key refusals after reassembly", async () => {
    for (const [body, detail] of [
      [JSON.stringify({ blob: "x".repeat(262145) }), "JSON string limit exceeded."],
      [JSON.stringify({ rows: Array(1025).fill(0) }), "Array limit exceeded."],
      ['{"schema":1,"schema":2}', "Duplicate key or object limit."],
    ]) {
      const fixture = repeatFixture(); replaceText(fixture.capsule, 0, body);
      const result = await project(fixture);
      expect(result).toEqual({ status: "invalid", detail });
    }
  });
  it("reports missing hashing capability without claiming a checked projection", async () => {
    const fixture = repeatFixture(); vi.stubGlobal("crypto", undefined);
    expect(await project(fixture)).toEqual({ status: "unavailable", detail: "WebCrypto SHA-256 is unavailable." });
  });
});
