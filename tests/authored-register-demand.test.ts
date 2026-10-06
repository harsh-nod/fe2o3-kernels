import { createHash, webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import native from "../examples/source_instruction_native_comparison_v1.json";
import retained from "../examples/authored_register_demand_v1.json";
import { deriveAuthoredDemand, projectAuthoredDemand } from "../src/content/authored-register-demand.mjs";
const JOIN = "5230415719fa0c7c81473d5fea338d5f3a85c7a3a9a91fd55c3900e20165d162";
const CAPSULE = "39ab4d99bef9a04ac6f2f55b727b63148173ce27d7471066dde819fe264bd30e";
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const artifact = (utf8: string) => ({ utf8, bytes: Buffer.byteLength(utf8), sha256: hash(utf8) });
const project = (value = retained, expected = CAPSULE) => projectAuthoredDemand(native, JOIN, value, expected);
function changed(change: (value: Record<string, unknown>) => void) {
  const capsule = JSON.parse(retained.utf8), report = JSON.parse(capsule.reports[0].artifact.utf8);
  change(report); capsule.reports[0].artifact = artifact(JSON.stringify(report) + "\n");
  return artifact(JSON.stringify(capsule));
}
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe("actual retained authored demand", () => {
  it("retains both exact raw CLI artifacts rather than regenerating a positive report", async () => {
    expect(hash(retained.utf8)).toBe(CAPSULE);
    expect(Buffer.byteLength(retained.utf8)).toBe(retained.bytes);
    const capsule = JSON.parse(retained.utf8);
    expect(capsule.reports.map((x: { artifact: { bytes: number; sha256: string } }) => [x.artifact.bytes, x.artifact.sha256])).toEqual([
      [2406, "b14c01a4a61e5e6e5d5406a1019ac3be53c58ba9d003968cecd087bdb26df555"],
      [2405, "bcc3f47912315cc111b88b5429fe7deaf59d7c91b9da36bcc5da7cf7e20e345b"],
    ]);
    for (const row of capsule.reports) expect(hash(row.artifact.utf8)).toBe(row.artifact.sha256);
    expect(hash(readFileSync("examples/source_instruction_native_comparison_v1.json")))
      .toBe("0b4a9689524965929d1e9b102d7802e737e068293f74fa28d0148ab49238cc04");
    const result = await project(); expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error(result.detail);
    expect(result.cases.map(row => row.profile)).toEqual(["default", "edited"]);
    expect(result.cases[0].plan).toEqual(result.cases[1].plan);
    expect(result.cases[0].canonicalSha256).not.toBe(result.cases[1].canonicalSha256);
    expect(result.cases[0].values.map(row => row.cells.join(""))).toEqual([
      "Dr......", "Dr---r..", "D--r....", "..Drx...", "....Dr..", "......DR",
    ]);
    expect(result.cases[0].ascii.split("\n")).toHaveLength(10);
    expect(result.cases[0].ascii).not.toContain("\\n");
    expect(result.physicalAllocation).toBe(false); expect(result.hardwareExecution).toBe(false);
    expect(Object.isFrozen(result.cases[0].plan.values)).toBe(true);
  });
  it("independently derives a read-before-write oracle including duplicate operands", () => {
    const plan = deriveAuthoredDemand({ scratch: 4, output: 5, inputs: [0, 1, 2], vgpr_high_water: 6 }, [
      { instruction: "v_mov_b32_e32", output: 4, inputs: [0] },
      { instruction: "v_xor_b32_e32", output: 4, inputs: [4, 4] },
      { instruction: "v_mov_b32_e32", output: 5, inputs: [4] },
    ]);
    expect(plan.uses).toEqual([
      { at: 1, value: 0, kind: "move" }, { at: 3, value: 3, kind: "left" },
      { at: 3, value: 3, kind: "right" }, { at: 5, value: 4, kind: "move" },
      { at: 7, value: 5, kind: "region_result" },
    ]);
    expect(plan.values[3]).toEqual({ id: 3, role: "scratch", binding: 4, def: 2, last_use: 3, overwritten: 4 });
    expect(plan.values[1].last_use).toBeNull();
  });
  it("bounds maximum definitions/uses and rejects aliases, bad arity and missing definitions", () => {
    const bindings = { scratch: 62, output: 63, inputs: [0, 1, 2], vgpr_high_water: 64 };
    const steps = Array.from({ length: 16 }, (_, i) => ({ instruction: "v_or_b32_e32", output: i === 15 ? 63 : 62, inputs: [0, 1] }));
    const plan = deriveAuthoredDemand(bindings, steps);
    expect(plan.values).toHaveLength(19); expect(plan.uses).toHaveLength(33); expect(plan.result_boundary).toBe(33);
    expect(() => deriveAuthoredDemand(bindings, [...steps, steps[0]])).toThrow();
    expect(() => deriveAuthoredDemand({ ...bindings, scratch: 0 }, steps)).toThrow();
    expect(() => deriveAuthoredDemand(bindings, [{ instruction: "v_mov_b32_e32", output: 63, inputs: [62] }])).toThrow();
    expect(() => deriveAuthoredDemand(bindings, [{ instruction: "v_or_b32_e32", output: 63, inputs: [0] }])).toThrow();
    expect(() => deriveAuthoredDemand(bindings, [{ instruction: "v_mov_b32_e32", output: 62, inputs: [0] }])).toThrow();
  });
  it("refuses every stale identity and changed derived plan even when negative fixtures are rehashed", async () => {
    for (const change of [
      (r: Record<string, unknown>) => { r.canonical = { wire_version: 17, sha256: "1".repeat(64), bytes: 993 }; },
      (r: Record<string, unknown>) => { r.raw_block_id = 0; },
      (r: Record<string, unknown>) => { r.coordinate = { function_ordinal: 0, block_ordinal: 1, operation_ordinal: 0 }; },
      (r: Record<string, unknown>) => { r.input_value_ids = [8, 0, 6]; },
      (r: Record<string, unknown>) => { r.result_value_id = 12; },
      (r: Record<string, unknown>) => { r.declared_source_ids = {}; },
      (r: Record<string, unknown>) => { r.register_plan = { scratch: 5, output: 4, inputs: [0, 1, 2], vgpr_high_water: 6 }; },
      (r: Record<string, unknown>) => { r.plan = {}; },
      (r: Record<string, unknown>) => { r.hardware_execution = true; },
      (r: Record<string, unknown>) => { r.fixed_plan_bytes = 4096; },
      (r: Record<string, unknown>) => { r.boundary_convention = "hardware time"; },
    ]) {
      const negative = changed(change);
      expect((await project(negative, negative.sha256)).status).toBe("invalid");
    }
    const capsule = JSON.parse(retained.utf8);
    const report = JSON.parse(capsule.reports[0].artifact.utf8);
    report.plan.values[0].last_use = 7; report.plan.uses[0].value = 1;
    capsule.reports[0].artifact = artifact(JSON.stringify(report));
    const negative = artifact(JSON.stringify(capsule));
    expect((await project(negative, negative.sha256)).status).toBe("invalid");
  });
  it("rejects duplicate JSON, report swapping, oversized text and wrong selected pins", async () => {
    const duplicate = artifact(retained.utf8.replace('{"schema":', '{"schema":"wrong","schema":'));
    expect((await project(duplicate, duplicate.sha256)).status).toBe("invalid");
    const capsule = JSON.parse(retained.utf8);
    [capsule.reports[0].artifact, capsule.reports[1].artifact] = [capsule.reports[1].artifact, capsule.reports[0].artifact];
    const swapped = artifact(JSON.stringify(capsule));
    expect((await project(swapped, swapped.sha256)).status).toBe("invalid");
    expect((await project(artifact(" ".repeat(24577)))).status).toBe("invalid");
    expect((await project(retained, "1".repeat(64))).status).toBe("invalid");
    expect((await projectAuthoredDemand(native, "2".repeat(64), retained, CAPSULE)).status).toBe("invalid");
  });
  it("snapshots before asynchronous hashing and supplies no network fallback", async () => {
    const input = structuredClone(retained), upstream = structuredClone(native), fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const pending = projectAuthoredDemand(upstream, JOIN, input, CAPSULE);
    input.utf8 = "{}"; upstream.sourceReceipt.utf8 = "{}"; upstream.payloads.length = 0;
    expect((await pending).status).toBe("ready"); expect(fetch).not.toHaveBeenCalled();
    vi.stubGlobal("crypto", undefined); expect((await project()).status).toBe("unavailable");
  });
});
