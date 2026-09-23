import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import retained from "../examples/source_instruction_native_comparison_v1.json";
import { FINAL_NATIVE_LIMITS, projectFinalNativeComparison } from "../src/content/final-native-comparison.mjs";

const JOIN = "5230415719fa0c7c81473d5fea338d5f3a85c7a3a9a91fd55c3900e20165d162";
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { vi.unstubAllGlobals(); });

describe("role-use projection remains inside the existing final-native owner", () => {
  it("uses each actual case's checked instruction offsets without changing the capsule or caps", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const projected = await projectFinalNativeComparison(retained, JOIN);
    expect(projected.status).toBe("ready");
    if (projected.status !== "ready") throw new Error(projected.detail);
    expect(FINAL_NATIVE_LIMITS).toEqual({ artifactBytes: 262144, sourceBytes: 65536, reportBytes: 65536,
      payloadBytes: 65536, totalBytes: 2097152, payloads: 4, artifacts: 14 });
    expect(projected.cases).toHaveLength(4);
    for (const item of projected.cases) {
      expect(item.registerGrid.instructionOffsets).toEqual(item.program.map(step => step.fileOffset));
      expect(item.registerGrid.declaredHighWater).toBe(item.declaredVgprHighWater);
      expect(item.registerGrid.roles.map(role => [role.role, role.register])).toEqual([
        ["scratch", 4], ["output", 5], ["input0", 0], ["input1", 1], ["input2", 2],
      ]);
      expect(item.registerGrid.roles[0].uses).toEqual(["write", "read-write", "read"]);
      expect(item.registerGrid.roles[1].uses).toEqual(["none", "none", "write"]);
      expect(Object.isFrozen(item.registerGrid)).toBe(true);
      expect(item.registerGrid.roles.every(role => role.uses.some(use => use !== "none"))).toBe(true);
    }
    expect(projected.cases[0].hsacoSha256).not.toBe(projected.cases[2].hsacoSha256);
    expect(projected.cases[0].sourceSha256).not.toBe(projected.cases[2].sourceSha256);
    expect(projected.cases[0].registerGrid).not.toBe(projected.cases[1].registerGrid);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("never exposes a role grid when selected source, LLVM or payload identities are swapped", async () => {
    const swaps = [
      () => { const copy = structuredClone(retained);
        [copy.sources[1].artifact, copy.sources[2].artifact] = [copy.sources[2].artifact, copy.sources[1].artifact]; return copy; },
      () => { const copy = structuredClone(retained);
        [copy.llvm[0].artifact, copy.llvm[1].artifact] = [copy.llvm[1].artifact, copy.llvm[0].artifact]; return copy; },
      () => { const copy = structuredClone(retained);
        [copy.payloads[0], copy.payloads[1]] = [copy.payloads[1], copy.payloads[0]]; return copy; },
      () => { const copy = structuredClone(retained);
        copy.payloads[0].sha256 = copy.payloads[2].sha256;
        copy.payloads[0].bytes = copy.payloads[2].bytes;
        copy.payloads[0].hex = copy.payloads[2].hex; return copy; },
    ];
    for (const swap of swaps) {
      const result = await projectFinalNativeComparison(swap(), JOIN);
      expect(result.status).toBe("invalid");
      expect(result).not.toHaveProperty("cases");
    }
    const stale = await projectFinalNativeComparison(retained, "a".repeat(64));
    expect(stale.status).toBe("invalid");
    expect(stale).not.toHaveProperty("cases");
  });
});
