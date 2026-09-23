import { parseProgramJson } from "./ordered-program-observation.mjs";

export const HARDWARE_RESOURCE_LIMITS = Object.freeze({
  fileBytes: 2 * 1024 * 1024, registers: 1024, visibleRows: 64, nameBytes: 128, valueBits: 64,
});
type RecordValue = Record<string, unknown>;
export type HardwareRegister = Readonly<{
  identity: string; name: string; registerClass: string; status: "available" | "redacted" | "unavailable";
  representation: string; bitWidth: number | null; reason: string | null; evidenceIdentity: string | null;
}>;
export type HardwareScope = Readonly<{ stopIdentity: string; threadIdentity: string; waveIdentity: string }>;
export type HardwareProjection = Readonly<{
  target: "gfx942_xnack_minus_wave64"; sessionIdentity: string; stopRevision: string;
  associationIdentity: string; queueOccurrenceIdentity: string; processInstanceIdentity: string;
  dispatchIdentity: string; artifact: Readonly<{ digest: string; canonicalBytes: string }>;
  grid: readonly number[]; workgroup: readonly number[]; coordinate: readonly number[];
  waveInWorkgroup: number; scope: HardwareScope; registerEvidenceIdentity: string;
  registers: readonly HardwareRegister[]; bindingKey: string;
}>;
export type HardwareCapture = Readonly<{
  status: "captured"; probe: Readonly<Record<string, boolean>>; inspectionProbe: Readonly<Record<string, boolean>>;
  localsCompletion: "captured" | "command_unavailable"; projection: HardwareProjection; bytes: number;
}> | Readonly<{
  status: "unavailable"; probe: Readonly<Record<string, boolean>>; inspectionProbe: Readonly<Record<string, boolean>>;
  stage: string; reason: string; bytes: number;
}>;
const U64 = 0xffffffffffffffffn;
const PROBE = ["structured_mi_commands", "direct_kfd_device_admitted", "cooperative_v2_declaration", "cooperative_v2_publication"];
const INSPECTION = ["register_names", "register_values", "simple_locals", "disassembly", "memory_bytes"];
const NATIVE_REASONS = ["rocgdb_spawn_failed", "structured_commands_unavailable", "direct_kfd_device_unavailable",
  "target_launch_failed", "cooperative_telemetry_unavailable", "target_exited_before_publication",
  "native_publication_not_observed", "gpu_stopped_state_unavailable", "correlation_rejected"];
const VALUE_REASONS = ["unsupported", "backend_not_connected", "session_not_stopped", "not_observed", "not_captured",
  "optimized_out", "outside_capture_scope", "truncated", "capture_budget_exhausted", "authenticated_binding_required",
  "allocation_unknown", "policy_redacted"];
function check(ok: unknown, detail: string): asserts ok { if (!ok) throw new Error(detail); }
function keys(value: unknown, fields: readonly string[]): RecordValue {
  check(value !== null && typeof value === "object" && !Array.isArray(value), "Expected a closed object.");
  const record = value as RecordValue;
  check(Object.keys(record).length === fields.length && fields.every(key => Object.hasOwn(record, key)),
    "Missing or unexpected capture fields.");
  return record;
}
function choice(value: unknown, choices: readonly string[]): string {
  check(typeof value === "string" && choices.includes(value), "Unsupported capture profile."); return value;
}
function identity(value: unknown): string {
  check(typeof value === "string" && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value),
    "Invalid nonzero opaque identity."); return value;
}
function uint(value: unknown, max: bigint = U64, min = 0n): bigint {
  check(typeof value === "bigint" || (typeof value === "number" && Number.isSafeInteger(value)),
    "Inexact or nonnumeric unsigned integer.");
  const result = BigInt(value); check(result >= min && result <= max, "Unsigned integer outside capture bounds."); return result;
}
function u32(value: unknown, min = 0): number { return Number(uint(value, 0xffffffffn, BigInt(min))); }
function vector(value: unknown, min = 0): number[] {
  check(Array.isArray(value) && value.length === 3, "Expected exactly three geometry coordinates.");
  return value.map(item => u32(item, min));
}
function flags(value: unknown, names: readonly string[]): Readonly<Record<string, boolean>> {
  const record = keys(value, names), result: Record<string, boolean> = {};
  for (const name of names) { check(typeof record[name] === "boolean", "Probe flag is not boolean."); result[name] = record[name] === true; }
  return Object.freeze(result);
}
/** Count exact UTF-8 before a TextEncoder or JSON allocation. */
function rawBytes(raw: unknown): number {
  check(typeof raw === "string" && raw.length > 0 && raw.length <= HARDWARE_RESOURCE_LIMITS.fileBytes,
    "Capture exceeds its 2 MiB input bound.");
  check(raw.charCodeAt(0) !== 0xfeff, "Capture has a UTF-8 BOM.");
  let bytes = 0;
  for (const point of raw) {
    const code = point.codePointAt(0)!;
    check(code < 0xd800 || code > 0xdfff, "Capture contains invalid Unicode.");
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
    check(bytes <= HARDWARE_RESOURCE_LIMITS.fileBytes, "Capture exceeds its 2 MiB input bound.");
  }
  check(raw.endsWith("\n") && raw.indexOf("\n") === raw.length - 1 && !raw.includes("\r"),
    "Expected one JSON record and its final LF.");
  return bytes;
}
function scope(value: unknown): HardwareScope {
  const record = keys(value, ["stop_identity", "thread", "wave"]);
  const thread = identity(keys(record.thread, ["identity"]).identity);
  const wave = keys(record.wave, ["identity", "thread"]);
  check(identity(keys(wave.thread, ["identity"]).identity) === thread, "Wave/thread binding mismatch.");
  return Object.freeze({ stopIdentity: identity(record.stop_identity), threadIdentity: thread, waveIdentity: identity(wave.identity) });
}
function observed(value: unknown, evidence: string): void {
  const truth = keys(value, ["origin", "evidence"]);
  check(truth.origin === "observed" && Array.isArray(truth.evidence) && truth.evidence.length === 1,
    "Register is not backed by one reported observation.");
  const reference = keys(truth.evidence[0], ["kind", "identity"]);
  check(reference.kind === "runtime_observation" && identity(reference.identity) === evidence,
    "Register observation identity mismatch.");
}
function unavailableTruth(value: unknown): void {
  const truth = keys(value, ["origin", "evidence"]);
  check(truth.origin === "unavailable" && Array.isArray(truth.evidence) && truth.evidence.length === 0,
    "Unavailable register has invented evidence.");
}
function register(value: unknown, evidence: string): HardwareRegister {
  const row = keys(value, ["register_identity", "name", "class", "kind", "value"]);
  const id = identity(row.register_identity);
  check(typeof row.name === "string" && row.name.length > 0 && row.name.length <= HARDWARE_RESOURCE_LIMITS.nameBytes &&
    !/\p{Cc}/u.test(row.name) &&
    new TextEncoder().encode(row.name).length <= HARDWARE_RESOURCE_LIMITS.nameBytes, "Invalid register name.");
  const name = row.name, registerClass = choice(row.class, ["scalar", "vector", "predicate", "special"]);
  check(row.kind === "unsigned_integer", "Unsupported register interpretation.");
  const availableClass = (registerClass === "scalar" && /^s[0-9]+$/u.test(name)) ||
    (registerClass === "predicate" && ["exec", "vcc", "scc"].includes(name));
  check(row.value !== null && typeof row.value === "object", "Missing register availability.");
  const status = choice((row.value as RecordValue).status, ["available", "redacted", "unavailable"]);
  if (status === "available") {
    const cell = keys(row.value, ["status", "value", "truth"]); check(availableClass, "Unsupported available register class.");
    observed(cell.truth, evidence);
    const bits = keys(cell.value, ["encoding", "bit_width", "bits"]), width = u32(bits.bit_width, 1);
    check(bits.encoding === "bits" && width <= 64 && width % 4 === 0 && typeof bits.bits === "string" &&
      bits.bits.length === width / 4 && /^[0-9a-f]+$/u.test(bits.bits), "Malformed or wide register bits.");
    return Object.freeze({ identity: id, name, registerClass, status, representation: "0x" + bits.bits,
      bitWidth: width, reason: null, evidenceIdentity: evidence });
  }
  const cell = keys(row.value, ["status", "reason", "truth"]);
  if (status === "redacted") {
    check(["pc", "pc_all"].includes(name) && cell.reason === "absolute_target_location", "Unsupported redaction.");
    observed(cell.truth, evidence);
    return Object.freeze({ identity: id, name, registerClass, status, representation: "Redacted",
      bitWidth: null, reason: "absolute_target_location", evidenceIdentity: evidence });
  }
  unavailableTruth(cell.truth);
  const reason = choice(cell.reason, VALUE_REASONS);
  check(availableClass || reason === "unsupported", "Unsupported register must remain unavailable.");
  return Object.freeze({ identity: id, name, registerClass, status: "unavailable", representation: "Unavailable",
    bitWidth: null, reason, evidenceIdentity: null });
}
function projection(value: unknown): HardwareProjection {
  const data = keys(value, ["target", "session_identity", "stop_revision", "association_identity",
    "queue_occurrence_identity", "process_instance_identity", "dispatch_identity", "artifact", "grid", "workgroup",
    "workgroup_coordinate", "wave_in_workgroup", "scope", "register_evidence_identity", "registers", "source", "isa", "memory"]);
  check(data.target === "gfx942_xnack_minus_wave64", "Unsupported checked target claim.");
  const artifact = keys(data.artifact, ["digest", "canonical_bytes"]);
  const grid = vector(data.grid, 1), workgroup = vector(data.workgroup, 1);
  const coordinateValue = keys(data.workgroup_coordinate, ["x", "y", "z"]);
  const coordinate = [coordinateValue.x, coordinateValue.y, coordinateValue.z].map(item => u32(item));
  const waveInWorkgroup = u32(data.wave_in_workgroup);
  let declared = 1n, actual = 1n;
  for (let axis = 0; axis < 3; axis++) {
    const g = BigInt(grid[axis]), w = BigInt(workgroup[axis]), start = BigInt(coordinate[axis]) * w;
    check(w <= g && start <= 0xffffffffn && start < g, "Invalid workgroup geometry.");
    declared *= w; actual *= w < g - start ? w : g - start;
    check(declared <= 0xffffffffn && actual <= 0xffffffffn, "Geometry product exceeds u32.");
  }
  check(declared <= 1024n && BigInt(waveInWorkgroup) * 64n < actual, "Wave is outside the actual workgroup.");
  const selectedScope = scope(data.scope), snapshot = keys(data.registers, ["scope", "registers"]);
  check(JSON.stringify(scope(snapshot.scope)) === JSON.stringify(selectedScope), "Register snapshot scope is stale or substituted.");
  const evidence = identity(data.register_evidence_identity);
  check(Array.isArray(snapshot.registers) && snapshot.registers.length <= HARDWARE_RESOURCE_LIMITS.registers,
    "Register roster exceeds 1,024 rows.");
  const registers = snapshot.registers.map(item => register(item, evidence));
  check(new Set(registers.map(item => item.identity)).size === registers.length, "Duplicate register identity.");
  for (const [field, reason] of [["source", "requires_authenticated_source_map"],
    ["isa", "requires_artifact_relative_instruction_binding"], ["memory", "requires_allocation_relative_authority"]]) {
    const unavailable = keys(data[field], ["status", "reason"]);
    check(unavailable.status === "unavailable" && unavailable.reason === reason, "Unavailable boundary was replaced.");
  }
  const binding = {
    target: "gfx942_xnack_minus_wave64" as const, sessionIdentity: identity(data.session_identity),
    stopRevision: uint(data.stop_revision, U64, 1n).toString(), associationIdentity: identity(data.association_identity),
    queueOccurrenceIdentity: identity(data.queue_occurrence_identity), processInstanceIdentity: identity(data.process_instance_identity),
    dispatchIdentity: identity(data.dispatch_identity),
    artifact: Object.freeze({ digest: identity(artifact.digest), canonicalBytes: uint(artifact.canonical_bytes, U64, 1n).toString() }),
    grid: Object.freeze(grid), workgroup: Object.freeze(workgroup), coordinate: Object.freeze(coordinate),
    waveInWorkgroup, scope: selectedScope, registerEvidenceIdentity: evidence,
  };
  return Object.freeze({ ...binding, bindingKey: JSON.stringify(binding), registers: Object.freeze(registers) });
}
function inspectionFailure(reason: unknown, supported: boolean): string {
  const code = choice(reason, ["machine_command_unavailable", "backend_rejected", "not_captured"]);
  check(code === "not_captured" || (code === "machine_command_unavailable" ? !supported : supported),
    "Inspection failure contradicts its registry probe."); return code;
}
/** Structure and internal consistency only. An imported claim never becomes a live process owner. */
export function parseHardwareResourceCapture(raw: string): HardwareCapture {
  const bytes = rawBytes(raw);
  const data = keys(parseProgramJson(raw, HARDWARE_RESOURCE_LIMITS.fileBytes), ["schema", "observation_lifetime", "result"]);
  check(data.schema === "fe2o3-rocgdb-kfd-resource-capture-v1" &&
    data.observation_lifetime === "historical_same_stop_capture", "Unsupported historical capture schema.");
  check(data.result !== null && typeof data.result === "object", "Missing capture result.");
  const status = choice((data.result as RecordValue).status, ["captured", "unavailable"]);
  const result = keys(data.result, status === "captured" ?
    ["status", "probe", "inspection_probe", "locals_completion", "projection"] :
    ["status", "probe", "inspection_probe", "reason"]);
  const probe = flags(result.probe, PROBE), inspectionProbe = flags(result.inspection_probe, INSPECTION);
  const nativeReady = PROBE.every(name => probe[name]), registersReady = inspectionProbe.register_names && inspectionProbe.register_values;
  if (status === "captured") {
    check(nativeReady && registersReady, "Captured result lacks required probe support.");
    const locals = choice(result.locals_completion, ["captured", "command_unavailable"]);
    check((locals === "captured") === inspectionProbe.simple_locals, "Locals completion contradicts its probe.");
    return Object.freeze({ status, probe, inspectionProbe, localsCompletion: locals as "captured" | "command_unavailable",
      projection: projection(result.projection), bytes });
  }
  check(result.reason !== null && typeof result.reason === "object", "Missing unavailable reason.");
  const stage = choice((result.reason as RecordValue).stage,
    ["native_capture", "register_inspection", "locals_inspection", "projection_not_retained"]);
  const unavailable = keys(result.reason, stage === "projection_not_retained" ? ["stage"] : ["stage", "reason"]);
  if (stage !== "native_capture") check(nativeReady, "Post-native failure lacks required probe support.");
  let reason: string;
  if (stage === "native_capture") reason = choice(unavailable.reason, NATIVE_REASONS);
  else if (stage === "register_inspection") reason = inspectionFailure(unavailable.reason, registersReady);
  else {
    check(registersReady, "Post-register failure lacks required register support.");
    reason = stage === "projection_not_retained" ? "projection_not_retained" :
      inspectionFailure(unavailable.reason, inspectionProbe.simple_locals);
  }
  return Object.freeze({ status: "unavailable", probe, inspectionProbe, stage, reason, bytes });
}
