import { describe, expect, it, vi } from "vitest";
import { HARDWARE_RESOURCE_LIMITS, parseHardwareResourceCapture } from "../src/content/hardware-resource-capture";
import { hardwareCaptureJson as json, hardwareId as id, syntheticHardwareCapture as capture,
  syntheticHardwareUnavailable as unavailable } from "./fixtures/synthetic-hardware-resource-capture";

type Fixture = ReturnType<typeof capture>;
const parse = (value: unknown) => parseHardwareResourceCapture(json(value));
describe("synthetic historical hardware capture parser — not GPU qualification", () => {
  it("preserves reported exact bindings, opaque bits and unavailable/redacted rows", () => {
    const result = parse(capture()); expect(result.status).toBe("captured");
    if (result.status !== "captured") throw Error("fixture failed");
    expect(result.projection.scope).toEqual({ stopIdentity: id(3), threadIdentity: id(2), waveIdentity: id(4) });
    expect(result.projection.artifact).toEqual({ digest: id(9), canonicalBytes: "128" });
    expect(result.projection.registers.map(row => [row.name, row.status, row.representation])).toEqual([
      ["s4", "available", "0x0000002a"], ["exec", "available", "0xffffffffffffffff"],
      ["pc", "redacted", "Redacted"], ["v0", "unavailable", "Unavailable"],
    ]);
    expect(result.projection.registers[1].bitWidth).toBe(64);
    expect(Object.isFrozen(result.projection.registers[0])).toBe(true);
    expect(Object.isFrozen(result.projection.scope)).toBe(true);
  });
  it.each([0, 1024])("accepts the complete bounded %s-row roster without truncation", count => {
    const result = parse(capture(count)); expect(result.status).toBe("captured");
    if (result.status === "captured") expect(result.projection.registers).toHaveLength(count);
  });
  it("keeps u64 revision/artifact length exactly, without Number conversion", () => {
    const result = parseHardwareResourceCapture(json(capture())
      .replace('"stop_revision":7', '"stop_revision":18446744073709551615')
      .replace('"canonical_bytes":128', '"canonical_bytes":9007199254740993'));
    if (result.status !== "captured") throw Error("fixture failed");
    expect(result.projection.stopRevision).toBe("18446744073709551615");
    expect(result.projection.artifact.canonicalBytes).toBe("9007199254740993");
  });
  it("does not authenticate a consistently changed artifact or session claim", () => {
    const changed = capture(); changed.result.projection.session_identity = id(99);
    changed.result.projection.artifact.digest = id(98);
    const a = parse(capture()), b = parse(changed);
    expect(b.status).toBe("captured");
    if (a.status === "captured" && b.status === "captured") expect(a.projection.bindingKey).not.toBe(b.projection.bindingKey);
  });
  it("preserves explicit unavailable locals completion without inventing locals rows", () => {
    const value = capture(); value.result.inspection_probe.simple_locals = false; value.result.locals_completion = "command_unavailable";
    expect(parse(value)).toMatchObject({ status: "captured", localsCompletion: "command_unavailable" });
  });
  it("accepts a partial edge workgroup only when the Wave64 ordinal begins inside it", () => {
    const value = capture(); value.result.projection.grid[0] = 130; value.result.projection.workgroup_coordinate.x = 2;
    expect(parse(value).status).toBe("captured");
    value.result.projection.wave_in_workgroup = 1; expect(() => parse(value)).toThrow();
  });
  const mutations: [string, (value: Fixture) => void][] = [
    ["schema", v => { v.schema = "fe2o3-rocgdb-kfd-native-response-v5"; }],
    ["live lifetime", v => { v.observation_lifetime = "live"; }],
    ["unknown top key", v => { Object.assign(v, { authority: true }); }],
    ["unknown projection key", v => { Object.assign(v.result.projection, { source_text: "invented" }); }],
    ["wrong target", v => { v.result.projection.target = "gfx950_xnack_minus_wave64"; }],
    ["zero identity", v => { v.result.projection.dispatch_identity = "0".repeat(64); }],
    ["uppercase identity", v => { v.result.projection.dispatch_identity = "A".repeat(64); }],
    ["zero revision", v => { v.result.projection.stop_revision = 0; }],
    ["empty artifact", v => { v.result.projection.artifact.canonical_bytes = 0; }],
    ["scope lane", v => { Object.assign(v.result.projection.scope, { lane: null }); }],
    ["register lane", v => { Object.assign(v.result.projection.registers.registers[0], { lane: 0 }); }],
    ["wave/thread mismatch", v => { v.result.projection.scope.wave.thread.identity = id(99); }],
    ["snapshot stop substitution", v => { v.result.projection.registers.scope.stop_identity = id(99); }],
    ["snapshot wave substitution", v => { v.result.projection.registers.scope.wave.identity = id(99); }],
    ["evidence substitution", v => { v.result.projection.register_evidence_identity = id(99); }],
    ["zero grid", v => { v.result.projection.grid[1] = 0; }],
    ["workgroup exceeds grid", v => { v.result.projection.workgroup[0] = 129; }],
    ["workgroup volume", v => { v.result.projection.grid = [2048, 1, 1]; v.result.projection.workgroup = [1025, 1, 1]; v.result.projection.workgroup_coordinate.x = 0; }],
    ["out of grid", v => { v.result.projection.workgroup_coordinate.x = 2; }],
    ["coordinate multiplication overflow", v => { v.result.projection.workgroup_coordinate.x = 0xffffffff; }],
    ["out of wave", v => { v.result.projection.wave_in_workgroup = 1; }],
    ["oversized roster", v => { const rows = v.result.projection.registers.registers; while (rows.length < 1025) rows.push(structuredClone(rows[0])); }],
    ["duplicate register", v => { v.result.projection.registers.registers[1].register_identity = v.result.projection.registers.registers[0].register_identity; }],
    ["empty name", v => { v.result.projection.registers.registers[0].name = ""; }],
    ["wide UTF-8 name", v => { v.result.projection.registers.registers[3].name = "é".repeat(65); }],
    ["control name", v => { v.result.projection.registers.registers[0].name = "s4\n"; }],
    ["noninteger interpretation", v => { v.result.projection.registers.registers[0].kind = "allocation_relative_pointer"; }],
    ["vector bits", v => { v.result.projection.registers.registers[0].class = "vector"; }],
    ["special bits", v => { v.result.projection.registers.registers[0].class = "special"; }],
    ["bad scalar name", v => { v.result.projection.registers.registers[0].name = "s"; }],
    ["invented observed origin", v => { v.result.projection.registers.registers[0].value.truth.origin = "proved"; }],
    ["extra evidence", v => { v.result.projection.registers.registers[0].value.truth.evidence.push({ kind: "artifact", identity: id(88) }); }],
    ["wide bits", v => { v.result.projection.registers.registers[0].value.value!.bit_width = 68; }],
    ["non-nibble width", v => { v.result.projection.registers.registers[0].value.value!.bit_width = 31; }],
    ["uppercase bits", v => { v.result.projection.registers.registers[0].value.value!.bits = "0000002A"; }],
    ["wrong bit length", v => { v.result.projection.registers.registers[0].value.value!.bits = "2a"; }],
    ["redacted non-PC", v => { v.result.projection.registers.registers[2].name = "v4"; }],
    ["changed redaction", v => { v.result.projection.registers.registers[2].value.reason = "policy"; }],
    ["unavailable with evidence", v => { v.result.projection.registers.registers[3].value.truth.evidence.push({ kind: "runtime_observation", identity: id(10) }); }],
    ["unsupported class misclassified", v => { v.result.projection.registers.registers[3].value.reason = "not_captured"; }],
    ["source boundary", v => { v.result.projection.source.reason = "not_captured"; }],
    ["ISA boundary", v => { v.result.projection.isa.reason = "not_captured"; }],
    ["memory boundary", v => { v.result.projection.memory.status = "available"; }],
    ["missing native probe", v => { v.result.probe.direct_kfd_device_admitted = false; }],
    ["missing register probe", v => { v.result.inspection_probe.register_values = false; }],
    ["locals contradiction", v => { v.result.inspection_probe.simple_locals = false; }],
  ];
  it.each(mutations)("rejects %s without a partial view", (_name, change) => {
    const value = capture(); change(value); expect(() => parse(value)).toThrow();
  });
  it.each([
    ["duplicate key", () => json(capture()).replace('"schema":', '"schema":"duplicate","schema":')],
    ["missing LF", () => json(capture()).slice(0, -1)], ["multiple LF", () => json(capture()) + "\n"],
    ["CRLF", () => json(capture()).slice(0, -1) + "\r\n"], ["BOM", () => "\ufeff" + json(capture())],
    ["second record", () => json(capture()) + "{}\n"],
    ["fractional number", () => json(capture()).replace('"stop_revision":7', '"stop_revision":7.5')],
    ["u64 overflow", () => json(capture()).replace('"stop_revision":7', '"stop_revision":18446744073709551616')],
    ["quoted numeric revision", () => json(capture()).replace('"stop_revision":7', '"stop_revision":"7"')],
    ["escaped lone surrogate", () => json(capture()).replace('"name":"s4"', '"name":"\\ud800"')],
  ] as const)("rejects malformed %s", (_name, raw) => { expect(() => parseHardwareResourceCapture(raw())).toThrow(); });
  it.each(["x".repeat(HARDWARE_RESOURCE_LIMITS.fileBytes + 1), "€".repeat(700000) + "\n", "\ud800\n"])(
    "refuses raw overbound/invalid UTF-8 before TextEncoder", raw => {
      const encode = vi.spyOn(TextEncoder.prototype, "encode");
      try { expect(() => parseHardwareResourceCapture(raw)).toThrow(); expect(encode).not.toHaveBeenCalled(); }
      finally { encode.mockRestore(); }
    });
  it("preserves unavailable native output without displaying a projection", () => {
    const value = unavailable(); value.result.probe.structured_mi_commands = false;
    expect(parse(value)).toMatchObject({ status: "unavailable", stage: "native_capture", reason: "rocgdb_spawn_failed" });
  });
  it.each([
    ["register_inspection", "backend_rejected", true, true],
    ["register_inspection", "machine_command_unavailable", false, true],
    ["register_inspection", "not_captured", false, true],
    ["locals_inspection", "backend_rejected", true, true],
    ["locals_inspection", "machine_command_unavailable", true, false],
    ["locals_inspection", "not_captured", true, false],
    ["projection_not_retained", "", true, false],
  ] as const)("preserves unavailable %s/%s with the exact probes", (stage, reason, registers, locals) => {
    const value = unavailable(stage, reason); value.result.inspection_probe.register_values = registers;
    value.result.inspection_probe.simple_locals = locals; expect(parse(value).status).toBe("unavailable");
  });
  it.each([
    ["register_inspection", "machine_command_unavailable", true, true, true],
    ["register_inspection", "backend_rejected", false, true, true],
    ["locals_inspection", "backend_rejected", true, false, true],
    ["locals_inspection", "machine_command_unavailable", true, true, true],
    ["projection_not_retained", "", false, true, true],
    ["register_inspection", "not_captured", true, true, false],
    ["native_capture", "unknown", true, true, true],
  ] as const)("refuses contradictory unavailable %s/%s", (stage, reason, registers, locals, native) => {
    const value = unavailable(stage, reason); value.result.inspection_probe.register_values = registers;
    value.result.inspection_probe.simple_locals = locals; value.result.probe.direct_kfd_device_admitted = native;
    expect(() => parse(value)).toThrow();
  });
});
