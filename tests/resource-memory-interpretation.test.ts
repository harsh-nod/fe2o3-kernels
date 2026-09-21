import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import retained from "../examples/debugger_workbench_v1.json";
import { interpretResourceMemoryCell, type MemoryCellSelection, type MemoryValueFormat, type MemoryByteOrder } from "../src/content/resource-memory-interpretation";
import { projectResourceMemoryResponse, resourceMemoryCells, type ResourceMemoryProjection } from "../src/content/resource-memory-view";
import { comparisonWindow, recordedComparison } from "./fixtures/resource-memory-comparison";
import type { MutableResourceControl } from "./fixtures/recorded-resource-import";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());
function selected(projection: ResourceMemoryProjection, changes: Partial<MemoryCellSelection> = {}): MemoryCellSelection {
  if (projection.status !== "ready") throw Error("Test needs a ready projection");
  return { anchorKey: projection.anchorKey, requestId: projection.requestId, allocation: projection.memory.allocation,
    page: 0, cellBytes: 4, byteOffset: projection.memory.byte_offset, ...changes };
}
/** Synthetic numeric/layout controls only; not new execution or provenance evidence. */
function numeric(bytes: string, initialized = "0x0f", extra: Record<string, unknown> = {}) {
  const response = structuredClone(retained.memory) as MutableResourceControl;
  Object.assign(response.result.memory, { byte_offset: 0, requested_bytes: (bytes.length - 2) / 2, returned_bytes: (bytes.length - 2) / 2,
    availability: { status: "captured", address_space: "global", bytes, initialized, truncated: false }, ...extra });
  return projectResourceMemoryResponse(response, structuredClone(response.result.snapshot));
}
function interpret(projection: ResourceMemoryProjection, format: MemoryValueFormat = "u32", order: MemoryByteOrder = "little",
  changes: Partial<MemoryCellSelection> = {}) {
  return interpretResourceMemoryCell(projection, selected(projection, changes), format, order);
}

describe("explicit recorded dword interpretation", () => {
  it("uses unchanged source-produced global and LDS bytes without mutating original records", async () => {
    for (const [kind, id, expected] of [["global", 11, "469"], ["lds", 13, "2"]] as const) {
      const recording = await recordedComparison(kind), before = JSON.stringify(recording), window = comparisonWindow(recording, id);
      const projection = projectResourceMemoryResponse(window.memory.response, window.checkpoint.anchor);
      expect(interpret(projection)).toMatchObject({ status: "ready", value: expected, format: "u32", byteOrder: "little" });
      expect(JSON.stringify(recording)).toBe(before);
    }
    const recording = await recordedComparison("lds"), window = comparisonWindow(recording, 17);
    const projection = projectResourceMemoryResponse(window.memory.response, window.checkpoint.anchor);
    expect(interpret(projection)).toMatchObject({ status: "uninitialized" });
    expect(interpret(projection)).not.toHaveProperty("value");
  });
  it("requires separate explicit format and byte-order choices", () => {
    const p = numeric("0xd5010000");
    expect(interpret(p, "raw", "unknown").status).toBe("raw");
    expect(interpret(p, "raw", "little").status).toBe("raw");
    expect(interpret(p, "u32", "unknown").status).toBe("needs-order");
    expect(interpret(p, "u32", "big")).toMatchObject({ status: "ready", bits: "0xd5010000", value: "3573612544" });
    expect(interpret(p)).toMatchObject({ bits: "0x000001d5", value: "469", bytes: "0xd5010000" });
    expect(interpret(p, "unknown" as MemoryValueFormat).status).toBe("invalid");
    expect(interpret(p, "u32", "native" as MemoryByteOrder).status).toBe("invalid");
  });
  it.each([
    ["0x00000000", "0", "0", "0x00000000"],
    ["0x00000080", "2147483648", "-2147483648", "0x80000000"],
    ["0xffffff7f", "2147483647", "2147483647", "0x7fffffff"],
    ["0xffffffff", "4294967295", "-1", "0xffffffff"],
  ])("checks exact signed/unsigned boundaries for %s", (bytes, unsigned, signed, bits) => {
    const p = numeric(bytes);
    expect(interpret(p, "u32")).toMatchObject({ status: "ready", value: unsigned, bits });
    expect(interpret(p, "i32")).toMatchObject({ status: "ready", value: signed, bits });
  });
  it.each([
    ["0x00000000", "0", "positive zero", "0x00000000"],
    ["0x00000080", "-0", "negative zero", "0x80000000"],
    ["0x0000803f", "1", "finite", "0x3f800000"],
    ["0x000080bf", "-1", "finite", "0xbf800000"],
    ["0x01000000", String(2 ** -149), "finite", "0x00000001"],
    ["0x0000807f", "+Infinity", "positive infinity", "0x7f800000"],
    ["0x000080ff", "-Infinity", "negative infinity", "0xff800000"],
    ["0x0100c07f", "NaN", "NaN", "0x7fc00001"],
    ["0x0100807f", "NaN", "NaN", "0x7f800001"],
    ["0x2301c0ff", "NaN", "NaN", "0xffc00123"],
  ])("preserves binary32 classification and exact original bits for %s", (bytes, value, floatClass, bits) => {
    expect(interpret(numeric(bytes), "f32")).toMatchObject({ status: "ready", value, floatClass, bits, bytes });
  });
  it("checks big-endian binary32 independently of little-endian integer reconstruction", () => {
    expect(interpret(numeric("0x3f800000"), "f32", "big")).toMatchObject({ status: "ready", value: "1", bits: "0x3f800000" });
  });
  it.each(Array.from({ length: 15 }, (_, i) => i))("refuses initialization mask %i without substituting zero", mask => {
    const p = numeric("0x00000000", "0x" + mask.toString(16).padStart(2, "0"));
    for (const format of ["u32", "i32", "f32"] as const) {
      expect(interpret(p, format)).toHaveProperty("status", "uninitialized");
      expect(interpret(p, format)).not.toHaveProperty("value");
    }
  });
  it("does not concatenate byte cells or partial final dwords", () => {
    const p = numeric("0x0000803f");
    expect(interpret(p, "f32", "little", { cellBytes: 1 }).status).toBe("needs-dword");
    for (const count of [1, 2, 3]) {
      const p = numeric("0x" + "00".repeat(count), "0x" + ((1 << count) - 1).toString(16).padStart(2, "0"));
      expect(interpret(p).status).toBe("needs-dword");
      expect(interpret(p)).not.toHaveProperty("value");
    }
  });
  it("allows only complete initialized cells within a partial window and makes no alignment claim", () => {
    const p = numeric("0xd5010000", "0x0f", { byte_offset: 3, requested_bytes: 8 });
    expect(interpret(p)).toMatchObject({ status: "ready", byteOffset: 3, value: "469", partialWindow: true });
  });
  it.each([255, 256, 257, 4096])("keeps the existing %i-byte input and 256-byte viewport bounds", count => {
    const lastBits = count % 8, init = "0x" + "ff".repeat(Math.floor(count / 8)) +
      (lastBits ? ((1 << lastBits) - 1).toString(16).padStart(2, "0") : "");
    const p = numeric("0x" + "00".repeat(count), init);
    if (p.status !== "ready") throw Error("Synthetic layout guard failed");
    const page = Math.floor((count - 1) / 256), cells = resourceMemoryCells(p.memory, page, 4);
    expect(cells.length).toBeLessThanOrEqual(64);
    expect(cells.reduce((n, c) => n + c.byteLength, 0)).toBeLessThanOrEqual(256);
    const result = interpret(p, "u32", "little", { page, byteOffset: cells.at(-1)!.byteOffset });
    expect(result.status).toBe(cells.at(-1)!.byteLength === 4 ? "ready" : "needs-dword");
    expect(interpret(p, "u32", "little", { page: page + 1, byteOffset: count }).status).toBe("stale");
  });
  it("refuses over-budget or inexact memory metadata through the unchanged response guard", () => {
    for (const p of [numeric("0x" + "00".repeat(4097), "0x" + "ff".repeat(512) + "01"),
      numeric("0x00000000", "0x0f", { byte_offset: Number.MAX_SAFE_INTEGER })]) {
      expect(p.status).not.toBe("ready");
      expect(interpretResourceMemoryCell(p, null, "u32", "little")).not.toHaveProperty("value");
    }
  });
  it("refuses stale request, allocation, generation, anchor and viewport selections", () => {
    const p = numeric("0xd5010000"), original = selected(p);
    for (const selection of [{ ...original, requestId: original.requestId + 1 }, { ...original, anchorKey: "other" },
      { ...original, allocation: { ...original.allocation, ordinal: original.allocation.ordinal + 1 } },
      { ...original, allocation: { ...original.allocation, generation: original.allocation.generation + 1 } },
      { ...original, byteOffset: 1 }, { ...original, page: 1 }]) {
      const result = interpretResourceMemoryCell(p, selection, "u32", "little");
      expect(result.status).toBe("stale"); expect(result).not.toHaveProperty("value");
    }
  });
  it.each(["source", "scope", "revision"])("preserves one-sided %s substitution refusal", async field => {
    const recording = await recordedComparison(), window = comparisonWindow(recording, 11);
    const response = structuredClone(window.memory.response) as MutableResourceControl;
    const expected = structuredClone(window.checkpoint.anchor);
    if (field === "source") response.result.snapshot.site.source.location.file_identity = "a".repeat(64);
    if (field === "scope") response.result.snapshot.scope.workgroup = [1, 0, 0];
    if (field === "revision") response.session.revision++;
    const p = projectResourceMemoryResponse(response, expected);
    expect(p.status).toBe("stale"); expect(interpretResourceMemoryCell(p, null, "u32", "little")).not.toHaveProperty("value");
  });
  it.each(["unavailable", "redacted"])("keeps %s separate from uninitialized or zero", status => {
    const p = numeric("0x", "0x", { requested_bytes: 4, returned_bytes: 0, availability: { status, reason: status === "redacted" ? "policy" : "not_captured" } });
    const result = interpretResourceMemoryCell(p, p.status === "ready" ? selected(p) : null, "u32", "little");
    expect(result.status).toBe("unavailable"); expect(result.detail).toContain(status); expect(result).not.toHaveProperty("value");
  });
});
