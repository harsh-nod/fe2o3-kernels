import { createHash, webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { projectRepeatNativeComparison } from "../src/content/repeat-native-comparison.mjs";
const JOIN = "7c93ef31321a2b47d470724ecc982e35571981bf3f6eef9c00861a20fb85d115";
const CAPSULE_SHA = "da03af2e891ce46a15ded574cf374a453df64404199770d9c1ba11890f67ad0d";
const raw = readFileSync("examples/source_repeat_native_origin_comparison_v1.json", "utf8");
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { vi.unstubAllGlobals(); });
describe("logical def/use derived from actual retained source/native cases", () => {
  it("preserves all eight exact cases with real canonical boundary IDs and per-export raw blocks", async () => {
    expect(Buffer.byteLength(raw)).toBe(1105533);
    expect(createHash("sha256").update(raw).digest("hex")).toBe(CAPSULE_SHA);
    const result = await projectRepeatNativeComparison(raw, JOIN);
    if (result.status !== "ready") throw new Error(result.detail);
    expect(result.cases.map(item => item.id)).toEqual(["one-O0", "one-O3", "two-O0", "two-O3", "fifteen-O0", "fifteen-O3", "repeat-O0", "repeat-O3"]);
    for (const [index, item] of result.cases.entries()) {
      const group = Math.floor(index / 2), n = [1, 2, 15, 15][group], model = item.logicalLiveness;
      expect(model.inputValueIds).toEqual([[0, 4, 5], [10, 7, 6], [1, 9, 10], [1, 9, 10]][group]);
      expect(model.resultValueId).toBe(11); expect(model.coordinate).toEqual([0, 0, 0]);
      expect(model.rawBlockId).toBe([6, 2, 3, 3][group]);
      expect(model.steps.map(step => step.descriptor)).toEqual([8, ...Array(n).fill(201)]);
      expect(model.values).toHaveLength(n + 4); expect(model.boundaries).toHaveLength(n + 2);
      expect(model.peakBoundaryLive).toBe(2); expect(model.peakTransient).toBe(3);
      expect(model.liveIn).toEqual(["input0", "input1"]); expect(model.liveOut).toEqual(["definition:" + n]);
      expect(model.values[2]).toMatchObject({ role: "input2", unused: true, endBoundaryExclusive: 0 });
      expect(model.values.slice(3, -1).every(value => value.canonicalInputSsa === null && value.canonicalResultSsa === null)).toBe(true);
      expect(model.values.at(-1)).toMatchObject({ canonicalResultSsa: 11, returned: true, bornBoundary: n + 1, endBoundaryExclusive: n + 2 });
      expect(model.steps[1].reads).toEqual(["definition:0", "input1"]);
      expect(model.unavailable).toContain("Physical register lifetimes or allocator replay");
    }
    // Equal finite data is not collapsed into one observation or one selectable case.
    expect(result.cases[4].logicalLiveness).toEqual(result.cases[6].logicalLiveness);
    expect(result.cases[4].logicalLiveness).not.toBe(result.cases[6].logicalLiveness);
    expect(result.cases[4].payloadPath).not.toBe(result.cases[6].payloadPath);
    expect(result.cases[4].reportSha256).not.toBe(result.cases[6].reportSha256);
  });
  it("does not expose a logical model when the independently selected capture pin disagrees", async () => {
    const result = await projectRepeatNativeComparison(raw, "f".repeat(64));
    expect(result.status).toBe("invalid"); expect(result).not.toHaveProperty("cases");
  });
  it("keeps old 23-artifact retained input usable without changing its bytes or treating it as the newer capture", async () => {
    const old = readFileSync("examples/source_repeat_native_comparison_v1.json", "utf8");
    expect(createHash("sha256").update(old).digest("hex")).toBe("366fec40482151396b5328818b30a1c00258872323ff6c9bd99ba4d1670e2578");
    const result = await projectRepeatNativeComparison(old, "7b13ad313fc51715c45f387ea1258e85365a2a526b66ba88002350fea04c4661");
    if (result.status !== "ready") throw new Error(result.detail);
    expect(result.cases).toHaveLength(8); expect(result.cases.every(item => item.logicalLiveness.peakBoundaryLive === 2)).toBe(true);
    expect((await projectRepeatNativeComparison(old, JOIN)).status).toBe("invalid");
  });
});
