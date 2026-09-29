import { describe, expect, it } from "vitest";
import { parseHardwareResourceExecCapture as parse } from "../src/content/hardware-resource-exec";
import { hardwareCaptureJson as json, hardwareId as id, syntheticHardwareCapture as capture,
  syntheticHardwareUnavailable as unavailable } from "./fixtures/synthetic-hardware-resource-capture";

function mask(bits: string, width = 64) {
  const value = capture();
  value.result.projection.registers.registers[1].value.value = { encoding: "bits", bit_width: width, bits };
  return value;
}
describe("synthetic historical EXEC bits — no physical-capture qualification", () => {
  it("keeps the original capture and all 64 exact immutable bit cells", () => {
    const result = parse(json(capture()));
    expect(result.capture.status).toBe("captured");
    expect(result.exec.status).toBe("ready");
    if (result.exec.status !== "ready" || result.capture.status !== "captured") throw Error("fixture");
    expect(result.exec.bindingKey).toBe(result.capture.projection.bindingKey);
    expect(result.exec.registerIdentity).toBe(id(101));
    expect(result.exec.evidenceIdentity).toBe(id(10));
    expect(result.exec.maskHex).toBe("0xffffffffffffffff");
    expect(result.exec.enabledLanes).toBe(64);
    expect(result.exec.lanes.map(cell => cell.lane)).toEqual(Array.from({ length: 64 }, (_, index) => index));
    expect(result.exec.lanes.every(cell => cell.enabled && Object.isFrozen(cell))).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.exec)).toBe(true);
    expect(Object.isFrozen(result.exec.lanes)).toBe(true);
    expect(result.capture.projection.registers[3].status).toBe("unavailable");
  });
  it("distinguishes a valid all-zero mask from unavailable data", () => {
    const result = parse(json(mask("0000000000000000")));
    expect(result.exec).toMatchObject({ status: "ready", maskHex: "0x0000000000000000", enabledLanes: 0 });
    if (result.exec.status !== "ready") throw Error("fixture");
    expect(result.exec.lanes).toHaveLength(64);
    expect(result.exec.lanes.every(cell => !cell.enabled)).toBe(true);
  });
  it("preserves high and low bits beyond Number's exact range", () => {
    const result = parse(json(mask("8000000000000001")));
    if (result.exec.status !== "ready") throw Error("fixture");
    expect(result.exec.lanes.filter(cell => cell.enabled).map(cell => cell.lane)).toEqual([0, 63]);
    expect(result.exec.enabledLanes).toBe(2);
  });
  it("checks every single-bit position without lossy integer conversion", () => {
    for (let lane = 0; lane < 64; lane++) {
      const bits = (1n << BigInt(lane)).toString(16).padStart(16, "0");
      const result = parse(json(mask(bits)));
      if (result.exec.status !== "ready") throw Error("fixture");
      expect(result.exec.maskHex).toBe("0x" + bits);
      expect(result.exec.lanes.filter(cell => cell.enabled).map(cell => cell.lane)).toEqual([lane]);
      expect(result.exec.enabledLanes).toBe(1);
    }
  });
  it("keeps alternating bit order exact", () => {
    const result = parse(json(mask("aaaaaaaaaaaaaaaa")));
    if (result.exec.status !== "ready") throw Error("fixture");
    expect(result.exec.lanes.filter(cell => cell.enabled).map(cell => cell.lane))
      .toEqual(Array.from({ length: 32 }, (_, index) => index * 2 + 1));
  });
  it("does not manufacture any mask for a native-unavailable record", () => {
    const result = parse(json(unavailable()));
    expect(result.exec).toEqual({ status: "unavailable", bindingKey: null, registerIdentity: null,
      reason: "capture_unavailable", reportedReason: "native_capture / rocgdb_spawn_failed" });
    expect(result.exec).not.toHaveProperty("lanes");
    expect(result.exec).not.toHaveProperty("maskHex");
  });
  it("keeps an empty roster unavailable, not zero", () => {
    const result = parse(json(capture(0)));
    expect(result.exec).toMatchObject({ status: "unavailable", reason: "missing_exec" });
    expect(result.exec).not.toHaveProperty("lanes");
  });
  it("does not substitute scalar or VCC bits for missing EXEC", () => {
    const value = capture(); value.result.projection.registers.registers[1].name = "vcc";
    expect(parse(json(value)).exec).toMatchObject({ status: "unavailable", reason: "missing_exec" });
  });
  it("preserves unavailable EXEC reason without inventing evidence or bit cells", () => {
    const value = capture();
    value.result.projection.registers.registers[1].value = {
      status: "unavailable", reason: "not_captured", truth: { origin: "unavailable", evidence: [] },
    };
    const result = parse(json(value));
    expect(result.exec).toMatchObject({ status: "unavailable", reason: "exec_unavailable", reportedReason: "not_captured" });
    expect(result.exec).not.toHaveProperty("lanes");
    expect(result.exec).not.toHaveProperty("evidenceIdentity");
  });
  it.each([4, 8, 32, 60])("does not pad a supported-but-non-Wave64 %s-bit predicate", width => {
    const result = parse(json(mask("0".repeat(width / 4), width)));
    expect(result.capture.status).toBe("captured");
    expect(result.exec).toMatchObject({ status: "unavailable", reason: "unsupported_exec_width" });
    expect(result.exec).not.toHaveProperty("maskHex");
  });
  it.each(["ffffffffffffffff", "0000000000000000"])("refuses ambiguous EXEC names even with duplicate mask %s", bits => {
    const value = capture(), rows = value.result.projection.registers.registers;
    const duplicate = structuredClone(rows[1]); duplicate.register_identity = id(5000);
    duplicate.value.value!.bits = bits; rows.push(duplicate);
    const result = parse(json(value));
    expect(result.capture.status).toBe("captured"); // Preserve the unchanged parser's checked roster.
    expect(result.exec).toMatchObject({ status: "unavailable", reason: "ambiguous_exec", registerIdentity: null });
    expect(result.exec).not.toHaveProperty("lanes");
  });
  it("does not reinterpret an unsupported class named exec", () => {
    const value = capture(), row = value.result.projection.registers.registers[1];
    row.class = "special";
    row.value = { status: "unavailable", reason: "unsupported", truth: { origin: "unavailable", evidence: [] } };
    expect(parse(json(value)).exec).toMatchObject({ status: "unavailable", reason: "unsupported_exec_class" });
  });
  it("finds EXEC beyond the first visible table page without dropping earlier rows", () => {
    const value = capture(70), rows = value.result.projection.registers.registers;
    const [exec] = rows.splice(1, 1); rows.push(exec);
    const result = parse(json(value));
    expect(result.exec).toMatchObject({ status: "ready", registerIdentity: id(101), enabledLanes: 64 });
    if (result.capture.status !== "captured") throw Error("fixture");
    expect(result.capture.projection.registers).toHaveLength(70);
    expect(result.capture.projection.registers[69].name).toBe("exec");
  });
  it("does not mask away reported bits using grid geometry or infer workitem coordinates", () => {
    const value = capture(); value.result.projection.grid[0] = 130; value.result.projection.workgroup_coordinate.x = 2;
    const result = parse(json(value));
    expect(result.exec).toMatchObject({ status: "ready", enabledLanes: 64 });
    expect(result.exec).not.toHaveProperty("workitems");
    expect(result.exec).not.toHaveProperty("activeWorkitems");
  });
  it("changes presentation binding with a consistently changed stop but does not authenticate it", () => {
    const a = parse(json(capture())), value = capture();
    value.result.projection.scope.stop_identity = id(7000);
    value.result.projection.registers.scope.stop_identity = id(7000);
    const b = parse(json(value));
    expect(b.exec.status).toBe("ready"); expect(b.exec.bindingKey).not.toBe(a.exec.bindingKey);
    expect(b.exec).not.toHaveProperty("authenticated");
    expect(b.exec).not.toHaveProperty("live");
  });
  it("retains the exact u64 revision and does not alias caller fixture objects", () => {
    const value = mask("8000000000000001");
    const result = parse(json(value).replace('"stop_revision":7', '"stop_revision":18446744073709551615'));
    value.result.projection.registers.registers[1].value.value!.bits = "0000000000000000";
    expect(result.exec).toMatchObject({ status: "ready", enabledLanes: 2 });
    if (result.capture.status !== "captured") throw Error("fixture");
    expect(result.capture.projection.stopRevision).toBe("18446744073709551615");
  });
  it.each(["target", "scope", "evidence", "duplicate-key", "missing-lf", "wide-mask"])(
    "retains unchanged whole-record refusal for %s", kind => {
      const value = capture();
      if (kind === "target") value.result.projection.target = "gfx950_xnack_minus_wave64";
      if (kind === "scope") value.result.projection.registers.scope.stop_identity = id(9000);
      if (kind === "evidence") value.result.projection.register_evidence_identity = id(9000);
      if (kind === "wide-mask") value.result.projection.registers.registers[1].value.value!.bits += "0";
      let raw = json(value);
      if (kind === "duplicate-key") raw = raw.replace('"schema":', '"schema":"duplicate","schema":');
      if (kind === "missing-lf") raw = raw.slice(0, -1);
      expect(() => parse(raw)).toThrow();
    });
});
