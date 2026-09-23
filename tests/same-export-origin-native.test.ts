import { createHash, webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { projectRepeatNativeComparison } from "../src/content/repeat-native-comparison.mjs";
import { compareOrderedOrigin, parseOrderedOriginJson, type OrderedOriginView } from "../src/content/ordered-origin-observation.mjs";

const JOIN = "7c93ef31321a2b47d470724ecc982e35571981bf3f6eef9c00861a20fb85d115";
const CAPSULE_SHA = "da03af2e891ce46a15ded574cf374a453df64404199770d9c1ba11890f67ad0d";
const HISTORICAL_JOIN = "7b13ad313fc51715c45f387ea1258e85365a2a526b66ba88002350fea04c4661";
const LABELS = ["one", "two", "fifteen", "repeat"] as const;
const ORIGINS = [
  [3035, "e833f05554e9973f911324fe62c34114dc1b5ec82ddcb4726c594d7b39e9b0ed"],
  [3115, "91c5efeaef9b07fbe537aa1f170a0998b43db8de32d7f02d237c72dfb3ae8c56"],
  [4161, "bb17f1b6803615664d1aa22941e8d807aaebf083aeb1eefe227f4f08f1afd03a"],
  [4161, "bb17f1b6803615664d1aa22941e8d807aaebf083aeb1eefe227f4f08f1afd03a"],
] as const;
const CASES = LABELS.flatMap(label => (["O0", "O3"] as const).map(optimization => ({ label, optimization })));
const capsule = readFileSync("examples/source_repeat_native_origin_comparison_v1.json", "utf8");
const rawOrigins = LABELS.map(label => readFileSync("examples/source_repeat_origin_" + label + "_v1.json", "utf8"));
const origins = rawOrigins.map(parseOrderedOriginJson);
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
async function current() {
  const projected = await projectRepeatNativeComparison(capsule, JOIN);
  if (projected.status !== "ready") throw new Error(projected.detail);
  return projected;
}
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("actual same-export origin/native retained capture", () => {
  it("pins the exact new capture and four unmodified separate sidecars, preserving the historical file", async () => {
    expect(Buffer.byteLength(capsule)).toBe(1105533); expect(hash(capsule)).toBe(CAPSULE_SHA);
    const projected = await current();
    expect(projected).toMatchObject({ checkedArtifacts: 23, retainedBytes: 966534,
      joinSha256: JOIN, sourceExportsReported: 4, cpuSimulationsReported: 120,
      sourceReceiptSha256: "39ff6cab8d3965670bcbefa57570230460da789ab4a6eed3f915f9cc24ca05ff",
      llvmReceiptSha256: "06ccf4dca4b7b959f3d0e94f0c43b8b137de094e4fda2767a6b89025fb72e1e6" });
    expect(projected.cases.map(item => item.id)).toEqual(CASES.map(item => item.label + "-" + item.optimization));
    for (const [index, raw] of rawOrigins.entries()) {
      expect(Buffer.byteLength(raw)).toBe(ORIGINS[index][0]); expect(hash(raw)).toBe(ORIGINS[index][1]);
      expect(Buffer.byteLength(raw)).toBeLessThanOrEqual(16384);
    }
    // Exact producer bytes, no newline insertion or whitespace normalization.
    expect(hash(readFileSync("examples/source_repeat_native_comparison_v1.json")))
      .toBe("366fec40482151396b5328818b30a1c00258872323ff6c9bd99ba4d1670e2578");
  });

  it.each(CASES)("joins actual $label $optimization only through all exact reported source bindings", async ({ label, optimization }) => {
    const projected = await current(), index = LABELS.indexOf(label);
    const selected = projected.cases.find(item => item.id === label + "-" + optimization)!;
    const origin = origins[index];
    expect(compareOrderedOrigin(origin, selected)).toEqual({ status: "matching_reported_identities", mismatches: [] });
    expect(selected.program).toHaveLength([2, 3, 16, 16][index]);
    expect(origin.declaredDescriptors).toHaveLength(selected.program.length);
    expect(selected.originBinding.declaredDescriptors).toEqual(origin.declaredDescriptors);
    expect(selected.encodedVgprCapacity).toBe(optimization === "O0" ? 56 : 40);
    expect(selected.declaredVgprHighWater).toBe(37);
    expect(selected.architectedVgprBoundary).toBe(40);
    expect(selected.program.map(item => item.fileOffset)).toEqual(
      Array.from({ length: selected.program.length }, (_, at) => (optimization === "O0" ? 2692 : 2348) + 4 * at));
    expect(selected.registerGrid.roles.filter(role => role.role === "scratch" || role.role === "input2")
      .every(role => role.uses.every(use => use === "none"))).toBe(true);
    expect(origin.expansionDepth).toBe(1);
    expect(origin.callSite.byte_start).toBe(351);
    expect(origin.callSite.byte_end).toBe(index < 2 ? 561 : 562);
    expect(Object.isFrozen(origin)).toBe(true);
  });

  it("refuses all eight different-count origin substitutions, without inventing different identities for repeat", async () => {
    const projected = await current();
    for (const [index, selected] of projected.cases.entries()) {
      const other = origins[index < 2 ? 1 : 0];
      const compared = compareOrderedOrigin(other, selected);
      expect(compared.status).toBe("mismatch");
      expect(compared.mismatches).toEqual(expect.arrayContaining([
        "Canonical KIR identity", "Semantic MIR identity", "Source preflight identity",
        "Declared source IDs", "Declared descriptors",
      ]));
    }
    expect(rawOrigins[2]).toBe(rawOrigins[3]);
    for (const optimization of ["O0", "O3"]) {
      const fifteen = projected.cases.find(item => item.id === "fifteen-" + optimization)!;
      const repeat = projected.cases.find(item => item.id === "repeat-" + optimization)!;
      expect(fifteen.payloadPath).not.toBe(repeat.payloadPath);
      expect(fifteen.reportSha256).not.toBe(repeat.reportSha256);
      expect(compareOrderedOrigin(origins[2], repeat).status).toBe("matching_reported_identities");
      expect(compareOrderedOrigin(origins[3], fifteen).status).toBe("matching_reported_identities");
    }
  });

  it("rejects mixing historical and same-export captures even when complete native payloads agree", async () => {
    const historical = readFileSync("examples/source_repeat_native_comparison_v1.json", "utf8");
    expect((await projectRepeatNativeComparison(capsule, HISTORICAL_JOIN)).status).toBe("invalid");
    expect((await projectRepeatNativeComparison(historical, JOIN)).status).toBe("invalid");
    const old = await projectRepeatNativeComparison(historical, HISTORICAL_JOIN);
    if (old.status !== "ready") throw new Error(old.detail);
    for (const [index, selected] of old.cases.entries())
      expect(compareOrderedOrigin(origins[Math.floor(index / 2)], selected).status).toBe("mismatch");
  });

  it("rejects unsupported target and wave width before any origin comparison", () => {
    for (const change of [{ target: "gfx1100" }, { wave_width: 32 }])
      expect(() => parseOrderedOriginJson(JSON.stringify({ ...JSON.parse(rawOrigins[0]), ...change }))).toThrow();
  });

  it("keeps identity, coordinate, descriptor and role comparisons mandatory on altered actual observations", async () => {
    const selected = (await current()).cases[0], original = origins[0];
    // Negative-only counterfeit views: these are not new compiler observations.
    const alterations: Array<[string, (value: OrderedOriginView) => OrderedOriginView]> = [
      ["Canonical KIR identity", value => ({ ...value, canonicalSha256: "0".repeat(64) })],
      ["Semantic MIR identity", value => ({ ...value, semanticSha256: "0".repeat(64) })],
      ["Source inventory identity", value => ({ ...value, sourceInventorySha256: "0".repeat(64) })],
      ["Source preflight identity", value => ({ ...value, sourcePreflightSha256: "0".repeat(64) })],
      ["Declared source IDs", value => ({ ...value, declaredSourceIds: { ...value.declaredSourceIds, statement: "0".repeat(64) } })],
      ["Canonical byte length", value => ({ ...value, canonicalBytes: value.canonicalBytes + 1 })],
      ["KIR roster coordinate", value => ({ ...value, coordinate: [0, 0, 1] })],
      ["KIR raw block", value => ({ ...value, rawBlock: value.rawBlock + 1 })],
      ["Declared descriptors", value => ({ ...value, declaredDescriptors: [8, 8] })],
      ["Declared register roles", value => ({ ...value, registerRoles: { ...value.registerRoles, scratch: 31 } })],
    ];
    for (const [axis, alter] of alterations) {
      const result = compareOrderedOrigin(alter(original), selected);
      expect(result.status).toBe("mismatch"); expect(result.mismatches).toContain(axis);
    }
    expect(compareOrderedOrigin(original, selected).status).toBe("matching_reported_identities");
  });
});
