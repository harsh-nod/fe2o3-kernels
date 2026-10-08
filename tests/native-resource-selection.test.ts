import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import native from "../examples/source_instruction_native_comparison_v1.json";
import demand from "../examples/authored_register_demand_v1.json";
import { projectFinalNativeComparison } from "../src/content/final-native-comparison.mjs";
import { projectAuthoredDemand } from "../src/content/authored-register-demand.mjs";
import { matchesNativeInstruction, selectNativeInstruction, selectedDemandBoundaries, selectedRegisterInstruction } from "../src/content/native-resource-selection.mjs";
const JOIN = "5230415719fa0c7c81473d5fea338d5f3a85c7a3a9a91fd55c3900e20165d162";
const CAPSULE = "39ab4d99bef9a04ac6f2f55b727b63148173ce27d7471066dde819fe264bd30e";
async function projections() {
  const n = await projectFinalNativeComparison(native, JOIN);
  const d = await projectAuthoredDemand(native, JOIN, demand, CAPSULE);
  if (n.status !== "ready" || d.status !== "ready") throw new Error("Original fixture refused");
  return { n, d, row: n.cases[0], model: d.cases[0] };
}
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { vi.unstubAllGlobals(); });
describe("exact retained static selection", () => {
  it("links every actual native row and its independently parsed demand boundaries", async () => {
    const { n, d } = await projections();
    for (const row of n.cases) for (let i = 0; i < row.program.length; i++) {
      const selection = selectNativeInstruction(n, row.id, i, row.program[i].fileOffset);
      expect(selection).not.toBeNull(); expect(Object.isFrozen(selection)).toBe(true);
      expect(matchesNativeInstruction(selection, n, row)).toBe(true);
      expect(selectedRegisterInstruction(selection, row.registerGrid)).toBe(i);
      const model = d.cases.find(item => item.profile === row.profile)!;
      expect(selectedDemandBoundaries(selection, d, model)).toMatchObject({
        read: 2 * i + 1, write: 2 * i + 2, capsuleSha256: CAPSULE, reportSha256: model.reportSha256,
      });
    }
  });
  it("keeps whole-kernel machine counts distinct from the three-row selected region", async () => {
    const { n } = await projections();
    for (const row of n.cases) {
      expect(row.program).toHaveLength(3);
      expect(row.staticInstructions).toBe(row.optimization === "O0" ? 105 : 21);
      expect(selectNativeInstruction(n, row.id, 0, row.program[0].fileOffset)).not.toBeNull();
    }
  });
  it("retains separate read-old/write-new scratch versions, not a physical live interval", async () => {
    const { n, d, row, model } = await projections();
    const selected = selectNativeInstruction(n, row.id, 1, row.program[1].fileOffset);
    const link = selectedDemandBoundaries(selected, d, model);
    expect(link).toMatchObject({ read: 3, write: 4, readValueIds: [3, 2], writeValueIds: [4] });
    expect(link?.readValueIds).not.toContain(4); expect(link?.writeValueIds).not.toContain(3);
    expect(Object.isFrozen(link?.readValueIds)).toBe(true);
  });
  it("rejects foreign ordinal/offset pairs and unbounded/noninteger selections", async () => {
    const { n, row } = await projections();
    for (const ordinal of [-1, 3, 16, NaN, Infinity, 0.5]) expect(selectNativeInstruction(n, row.id, ordinal, row.program[0].fileOffset)).toBeNull();
    for (const offset of [-1, NaN, Infinity, row.program[1].fileOffset, row.program[0].fileOffset + 1]) expect(selectNativeInstruction(n, row.id, 0, offset)).toBeNull();
    expect(selectNativeInstruction(n, "foreign", 0, row.program[0].fileOffset)).toBeNull();
  });
  it("rejects copied tokens and replacement objects even when all bytes/offsets agree", async () => {
    const { n, row } = await projections(), second = await projections();
    const selection = selectNativeInstruction(n, row.id, 0, row.program[0].fileOffset)!;
    expect(matchesNativeInstruction({ ...selection }, n, row)).toBe(false);
    expect(matchesNativeInstruction(selection, second.n, second.row)).toBe(false);
    expect(matchesNativeInstruction(selection, n, { ...row })).toBe(false);
    expect(selectedRegisterInstruction(selection, { ...row.registerGrid })).toBeNull();
  });
  it("does not carry default/O0 selection into an edited or O3 case", async () => {
    const { n, d, row } = await projections();
    const selection = selectNativeInstruction(n, row.id, 0, row.program[0].fileOffset);
    for (const other of n.cases.slice(1)) {
      expect(matchesNativeInstruction(selection, n, other)).toBe(false);
      expect(selectedRegisterInstruction(selection, other.registerGrid)).toBeNull();
    }
    expect(selectedDemandBoundaries(selection, d, d.cases[1])).toBeNull();
  });
  it("requires the exact current source, semantic, canonical, code and descriptor identities", async () => {
    const { n, row } = await projections();
    for (const field of ["sourceSha256", "semanticSha256", "canonicalKirSha256", "llvmSha256", "hsacoSha256", "descriptorSha256"] as const) {
      const copy = structuredClone(n), current = copy.cases[0];
      const selection = selectNativeInstruction(copy, current.id, 0, current.program[0].fileOffset);
      Object.assign(current, { [field]: "0".repeat(64) });
      expect(matchesNativeInstruction(selection, copy, current)).toBe(false);
    }
    const selection = selectNativeInstruction(n, row.id, 0, row.program[0].fileOffset);
    expect(matchesNativeInstruction(selection, { ...n, joinSha256: "0".repeat(64) }, row)).toBe(false);
  });
  it("requires independent demand joins and exact model membership", async () => {
    const { n, d, row, model } = await projections();
    const selection = selectNativeInstruction(n, row.id, 0, row.program[0].fileOffset);
    expect(selectedDemandBoundaries(selection, { ...d, nativeJoinSha256: "0".repeat(64) }, model)).toBeNull();
    expect(selectedDemandBoundaries(selection, { ...d, sourceReceiptSha256: "0".repeat(64) }, model)).toBeNull();
    expect(selectedDemandBoundaries(selection, d, { ...model })).toBeNull();
    for (const change of [{ canonicalSha256: "0".repeat(64) }, { profile: "edited" as const },
      { plan: { ...model.plan, steps: 2 } }, { boundaries: [0, 1] }]) {
      const changed = { ...model, ...change };
      expect(selectedDemandBoundaries(selection, { ...d, cases: [changed, d.cases[1]] }, changed)).toBeNull();
    }
  });
  it("does not issue tokens for duplicate cases, undercounted kernels or mismatched program/grid offsets", async () => {
    const { n, row } = await projections();
    expect(selectNativeInstruction({ ...n, cases: [row, row] }, row.id, 0, row.program[0].fileOffset)).toBeNull();
    const bad = { ...row, staticInstructions: 2 };
    expect(selectNativeInstruction({ ...n, cases: [bad] }, row.id, 0, row.program[0].fileOffset)).toBeNull();
    const grid = { ...row, registerGrid: { ...row.registerGrid, instructionOffsets: [1, 2, 3] } };
    expect(selectNativeInstruction({ ...n, cases: [grid] }, row.id, 0, row.program[0].fileOffset)).toBeNull();
  });
  it("supplies no selection for unavailable/invalid evidence and no network fallback", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    for (const status of ["unavailable", "invalid"] as const) expect(selectNativeInstruction({ status, detail: "refused" }, "default-O0", 0, 0)).toBeNull();
    const { d, model, row } = await projections();
    expect(selectedDemandBoundaries(null, d, model)).toBeNull();
    expect(selectedRegisterInstruction(null, row.registerGrid)).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
