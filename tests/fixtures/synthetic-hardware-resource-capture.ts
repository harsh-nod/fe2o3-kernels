// Entirely synthetic presentation fixtures. No GPU, MI process, or source capture produced these values.
export const hardwareId = (value: number) => value.toString(16).padStart(64, "0");
type Truth = { origin: string; evidence: { kind: string; identity: string }[] };
type Cell = { status: string; value?: { encoding: string; bit_width: number; bits: string }; reason?: string; truth: Truth };
export type SyntheticRegister = {
  register_identity: string; name: string; class: string; kind: string; value: Cell;
};
const observed = (): Truth => ({ origin: "observed", evidence: [{ kind: "runtime_observation", identity: hardwareId(10) }] });
export function syntheticHardwareCapture(count = 4) {
  const scope = { stop_identity: hardwareId(3), thread: { identity: hardwareId(2) },
    wave: { identity: hardwareId(4), thread: { identity: hardwareId(2) } } };
  const registers: SyntheticRegister[] = Array.from({ length: count }, (_, index) => ({
    register_identity: hardwareId(100 + index), name: "s" + (index + 4), class: "scalar", kind: "unsigned_integer",
    value: { status: "available", value: { encoding: "bits", bit_width: 32, bits: "0000002a" }, truth: observed() },
  }));
  if (count > 1) registers[1] = { ...registers[1], name: "exec", class: "predicate",
    value: { status: "available", value: { encoding: "bits", bit_width: 64, bits: "ffffffffffffffff" }, truth: observed() } };
  if (count > 2) registers[2] = { ...registers[2], name: "pc", class: "special",
    value: { status: "redacted", reason: "absolute_target_location", truth: observed() } };
  if (count > 3) registers[3] = { ...registers[3], name: "v0", class: "vector",
    value: { status: "unavailable", reason: "unsupported", truth: { origin: "unavailable", evidence: [] } } };
  return {
    schema: "fe2o3-rocgdb-kfd-resource-capture-v1", observation_lifetime: "historical_same_stop_capture",
    result: {
      status: "captured",
      probe: { structured_mi_commands: true, direct_kfd_device_admitted: true,
        cooperative_v2_declaration: true, cooperative_v2_publication: true },
      inspection_probe: { register_names: true, register_values: true, simple_locals: true, disassembly: false, memory_bytes: false },
      locals_completion: "captured",
      projection: {
        target: "gfx942_xnack_minus_wave64", session_identity: hardwareId(1), stop_revision: 7,
        association_identity: hardwareId(5), queue_occurrence_identity: hardwareId(6),
        process_instance_identity: hardwareId(7), dispatch_identity: hardwareId(8),
        artifact: { digest: hardwareId(9), canonical_bytes: 128 },
        grid: [128, 1, 1], workgroup: [64, 1, 1], workgroup_coordinate: { x: 1, y: 0, z: 0 },
        wave_in_workgroup: 0, scope, register_evidence_identity: hardwareId(10),
        registers: { scope: structuredClone(scope), registers },
        source: { status: "unavailable", reason: "requires_authenticated_source_map" },
        isa: { status: "unavailable", reason: "requires_artifact_relative_instruction_binding" },
        memory: { status: "unavailable", reason: "requires_allocation_relative_authority" },
      },
    },
  };
}
export function syntheticHardwareUnavailable(stage = "native_capture", reason = "rocgdb_spawn_failed") {
  const { probe, inspection_probe } = syntheticHardwareCapture().result;
  return {
    schema: "fe2o3-rocgdb-kfd-resource-capture-v1", observation_lifetime: "historical_same_stop_capture",
    result: { status: "unavailable", probe, inspection_probe,
      reason: stage === "projection_not_retained" ? { stage } : { stage, reason } },
  };
}
export const hardwareCaptureJson = (value: unknown) => JSON.stringify(value) + "\n";
