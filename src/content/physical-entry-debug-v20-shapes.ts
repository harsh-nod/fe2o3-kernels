/** Presentation only: no KIR admission, source custody, physical-register or execution authority. */
import type { CheckpointValueRow } from "./resource-checkpoint-values";
export const PHYSICAL_DEBUG_SELECTOR_V20 = "--diagnostic-kir-v20";
export const PHYSICAL_DEBUG_LIMITS_V20 = Object.freeze({
  fileBytes: 256 * 1024, requestBytes: 8192, responseBytes: 65536, pairs: 256, records: 8192, page: 64, memoryBytes: 256,
});
export interface PhysicalDebugInputV20 {
  readonly selector: string; readonly requestsUtf8: string; readonly responsesUtf8: string;
  readonly expected?: { readonly requests: string; readonly responses: string };
}
export interface PhysicalAnchorV20 {
  readonly event: number; readonly revision: number; readonly workgroup: readonly number[];
  readonly lane: number; readonly global: readonly number[]; readonly activeMask: bigint;
  readonly block: number; readonly operation: number;
}
export interface PhysicalMemoryV20 {
  readonly allocation: number; readonly offset: number;
  readonly cells: readonly { readonly byte: string; readonly initialized: boolean }[];
}
export interface PhysicalObservationV20 {
  readonly requestId: number; readonly operation: string; readonly label: string;
  readonly event: number; readonly revision: number; readonly state: string;
  readonly status: "ok" | "error" | "unavailable"; readonly detail: string;
  readonly anchor: PhysicalAnchorV20 | null; readonly values: readonly CheckpointValueRow[] | null;
  readonly page: { readonly start: number; readonly next: number | null } | null;
  readonly memory: PhysicalMemoryV20 | null;
  readonly requestUtf8: string; readonly responseUtf8: string;
}
export interface PhysicalRecordingV20 {
  readonly status: "ready"; readonly key: string; readonly configuration: string;
  readonly requestSha256: string; readonly responseSha256: string; readonly records: readonly PhysicalObservationV20[];
}
export type PhysicalProjectionV20 = PhysicalRecordingV20 | { readonly status: "invalid" | "unavailable"; readonly detail: string };
export type Row = Record<string, unknown>;
export function need(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(message); }
export function object(value: unknown, required: readonly string[], optional: readonly string[] = []): Row {
  need(value !== null && typeof value === "object" && !Array.isArray(value), "Expected an object.");
  const row = value as Row;
  need(required.every(k => Object.hasOwn(row, k)) && Object.keys(row).every(k => required.includes(k) || optional.includes(k)),
    "Missing or unsupported fields.");
  return row;
}
export function uint(value: unknown, max = Number.MAX_SAFE_INTEGER): number {
  need(typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= max, "Integer outside presentation bounds.");
  return value;
}
export function digest(value: unknown): string {
  need(typeof value === "string" && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value), "Invalid identity.");
  return value;
}
export function stable(value: unknown): string {
  if (typeof value === "bigint") return "u64:" + value.toString();
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  if (value !== null && typeof value === "object") return "{" + Object.keys(value).sort()
    .map(k => JSON.stringify(k) + ":" + stable((value as Row)[k])).join(",") + "}";
  return JSON.stringify(value) ?? "undefined";
}
export function same(a: unknown, b: unknown): void { need(stable(a) === stable(b), "Recorded fields or identities disagree."); }
export function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
export function vector(value: unknown): number[] {
  need(Array.isArray(value) && value.length === 3, "Expected a three-component coordinate.");
  return value.map(n => uint(n, 0xffff_ffff));
}
export function cursor(value: unknown): Row {
  const row = object(value, ["configuration_identity", "event_sequence", "state_revision"]);
  digest(row.configuration_identity); uint(row.event_sequence, PHYSICAL_DEBUG_LIMITS_V20.records + 1); uint(row.state_revision);
  return row;
}
export function pageCursor(value: unknown): Row {
  const row = object(value, ["query_identity", "position"]);
  digest(row.query_identity); uint(row.position, 65536); return row;
}
export function kirSite(value: unknown): Row {
  const row = object(value, ["function_ordinal", "block_ordinal", "point"]);
  same(row.function_ordinal, 0); uint(row.block_ordinal, 0xffff_ffff);
  const point = object(row.point, ["kind", "operation_ordinal"]);
  same(point.kind, "operation"); uint(point.operation_ordinal, 4096); return row;
}
export function laneScope(value: unknown): Row {
  const row = object(value, ["level", "workgroup", "wave", "lane"]);
  same(row.level, "lane"); vector(row.workgroup); same(row.wave, 0); uint(row.lane, 63); return row;
}
export function allocation(value: unknown): Row {
  const row = object(value, ["ordinal", "generation"]); need(uint(row.ordinal) > 0, "Invalid allocation ordinal.");
  uint(row.generation); return row;
}
export function request(value: unknown): Row {
  const basic = ["schema", "request_id", "expected_revision", "operation"];
  need(value !== null && typeof value === "object", "Missing request.");
  const operation = (value as Row).operation;
  let row: Row;
  switch (operation) {
    case "discover_capabilities": case "get_state": case "terminate": row = object(value, basic); break;
    case "step":
      row = object(value, [...basic, "direction", "granularity", "count"]);
      need(row.direction === "forward" || row.direction === "reverse", "Unknown step direction.");
      same(row.granularity, "event"); need(uint(row.count, 8192) > 0, "Invalid event count."); break;
    case "seek": row = object(value, [...basic, "cursor"]); cursor(row.cursor); break;
    case "read_memory":
      row = object(value, [...basic, "allocation", "byte_offset", "byte_len"]);
      allocation(row.allocation); uint(row.byte_offset); uint(row.byte_len); break;
    case "inspect_values": {
      row = object(value, [...basic, "scope", "selector", "page"], ["frame"]); laneScope(row.scope);
      if (row.frame !== undefined) uint(row.frame);
      const selector = object(row.selector, ["selector"], ["roots"]);
      if (selector.selector === "all") same(selector, { selector: "all" });
      else {
        same(selector.selector, "roots"); need(Array.isArray(selector.roots) && selector.roots.length === 1 &&
          ["ssa", "source_variable", "register"].includes(selector.roots[0]), "Unsupported value selector.");
      }
      const page = object(row.page, ["limit"], ["cursor"]); need(uint(page.limit, 65535) > 0, "Invalid page size.");
      if (page.cursor !== undefined) pageCursor(page.cursor); break;
    }
    case "resolve_source": row = object(value, [...basic, "site"]); kirSite(row.site); break;
    default: throw new Error("Unsupported operation in this recorded V20 subset.");
  }
  same(row.schema, "fe2o3-debug-request-v1"); need(uint(row.request_id) > 0, "Invalid request identity.");
  uint(row.expected_revision); return row;
}
export function session(value: unknown): Row {
  const row = object(value, ["backend", "execution_kind", "state", "revision", "configuration_identity", "cursor",
    "simulated", "hardware_observed", "performance_prediction"]);
  same(row.backend, "cpu_kir_simulator"); same(row.execution_kind, "cpu_kir_simulation");
  same(row.simulated, true); same(row.hardware_observed, false); same(row.performance_prediction, false);
  digest(row.configuration_identity); uint(row.revision);
  const at = cursor(row.cursor); same(at.configuration_identity, row.configuration_identity); same(at.state_revision, row.revision);
  need(row.state === (at.event_sequence === 0 ? "created" : "stopped") || row.state === "terminated", "Invalid session state.");
  return row;
}
const AVAILABLE = ["kir_sites", "forward_step", "reverse_step", "kir_ssa_values", "allocation_relative_memory"];
const NAMES = ["hierarchy_inspection", "kir_sites", "source_sites", "call_stack", "breakpoints", "watchpoints",
  "forward_step", "reverse_step", "pause", "deterministic_replay", "kir_ssa_values", "source_variable_values",
  "register_values", "allocation_relative_memory", "semantic_trace", "hardware_wave_state", "kfd_dispatch_control"];
export function capabilities(value: unknown): void {
  const row = object(value, ["result", "capabilities"]); same(row.result, "capabilities");
  need(Array.isArray(row.capabilities) && row.capabilities.length === NAMES.length, "Unsupported capability roster.");
  const seen = new Set<string>();
  for (const value of row.capabilities) {
    const cap = object(value, ["name", "availability"], ["reason"]);
    need(typeof cap.name === "string" && NAMES.includes(cap.name) && !seen.has(cap.name), "Unknown or repeated capability.");
    seen.add(cap.name);
    same(cap, AVAILABLE.includes(cap.name) ? { name: cap.name, availability: "available" } :
      { name: cap.name, availability: "unavailable", reason: ["source_sites", "source_variable_values"].includes(cap.name)
        ? "requires_authenticated_map" : "not_exposed_by_backend" });
  }
}
