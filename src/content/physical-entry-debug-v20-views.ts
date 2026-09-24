/** Closed V20 result projections. Wire u64 masks stay bigint; no invented native addresses. */
import { projectResourceScalarValues } from "./resource-checkpoint-values";
import {
  allocation, digest, kirSite, need, object, pageCursor, same, uint, vector,
  type PhysicalAnchorV20, type PhysicalMemoryV20, type Row,
} from "./physical-entry-debug-v20-shapes";
export function stop(value: unknown, sequence: number, end: number): void {
  same(value, { reason: sequence === end ? "completed" : sequence === 0 ? "entry" : "step",
    outcome: sequence === end ? "completed" : "active", exact: true });
}
export function anchor(value: unknown, session: Row): PhysicalAnchorV20 {
  const row = object(value, ["cursor", "scope", "site"]); same(row.cursor, session.cursor);
  const scope = object(row.scope, ["level", "workgroup", "wave", "lane", "logical_workitem", "active_mask", "wave_width", "interpretation"]);
  same(scope.level, "lane"); same(scope.wave, 0); same(scope.wave_width, 64); same(scope.interpretation, "logical_visualization");
  // This field is resident logical wave coverage, NOT the authored physical EXEC mask.
  same(scope.active_mask, 0xffff_ffff_ffff_ffffn);
  const workgroup = vector(scope.workgroup), global = vector(scope.logical_workitem), lane = uint(scope.lane, 63);
  need(workgroup[1] === 0 && workgroup[2] === 0 && global[1] === 0 && global[2] === 0 &&
    global[0] === workgroup[0] * 64 + lane, "Inconsistent one-dimensional logical lane.");
  const site = object(row.site, ["kir", "source"]), kir = kirSite(site.kir);
  same(site.source, { status: "unavailable", reason: "requires_authenticated_map" });
  const at = session.cursor as Row;
  return { event: uint(at.event_sequence), revision: uint(at.state_revision), workgroup, global, lane,
    activeMask: 0xffff_ffff_ffff_ffffn, block: uint(kir.block_ordinal), operation: uint((kir.point as Row).operation_ordinal) };
}
export function snapshot(value: unknown, session: Row, end: number): { raw: Row | null; observed: PhysicalAnchorV20 | null } {
  const row = object(value, ["status"], ["snapshot", "reason"]);
  if (row.status === "unavailable") {
    same(row, { status: "unavailable", reason: "not_captured" }); return { raw: null, observed: null };
  }
  same(row.status, "captured"); object(row, ["status", "snapshot"]);
  const data = object(row.snapshot, ["anchor", "stop", "values"]);
  const observed = anchor(data.anchor, session);
  need(observed.event > 0 && observed.event < end, "Capture outside recorded event range.");
  stop(data.stop, observed.event, end); same(data.values, []);
  return { raw: data.anchor as Row, observed };
}
export async function queryIdentity(configuration: string, sequence: number, revision: number): Promise<string> {
  const domain = new TextEncoder().encode("fe2o3-debug-physical-v20-ssa-page-v1\0");
  const bytes = new Uint8Array(domain.length + 32 + 16); bytes.set(domain);
  bytes.set(Uint8Array.from(configuration.match(/../gu)!.map(x => Number.parseInt(x, 16))), domain.length);
  const view = new DataView(bytes.buffer); view.setBigUint64(domain.length + 32, BigInt(sequence), true);
  view.setBigUint64(domain.length + 40, BigInt(revision), true);
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), n => n.toString(16).padStart(2, "0")).join("");
}
export async function values(result: Row, request: Row, session: Row) {
  object(result, ["result", "snapshot", "values"], ["next_cursor"]); same(result.result, "values");
  const observed = anchor(result.snapshot, session), scope = request.scope as Row;
  same(scope, { level: "lane", workgroup: observed.workgroup, wave: 0, lane: observed.lane });
  need(request.frame === undefined || request.frame === 1, "Unknown logical frame.");
  const selector = request.selector as Row;
  need(selector.selector === "all" || (selector.selector === "roots" && Array.isArray(selector.roots) &&
    selector.roots.length === 1 && selector.roots[0] === "ssa"), "Unsupported successful value selector.");
  const page = request.page as Row, limit = uint(page.limit, 64);
  const query = await queryIdentity(digest(session.configuration_identity), observed.event, observed.revision);
  const from = page.cursor === undefined ? null : pageCursor(page.cursor);
  if (from) same(from.query_identity, query);
  const start = from ? uint(from.position, 65536) : 0;
  need(Array.isArray(result.values) && result.values.length <= limit, "Invalid recorded value page length.");
  for (const raw of result.values) {
    const value = object(raw, ["path", "availability"]), path = object(value.path, ["root", "components"]);
    const root = object(path.root, ["kind", "function_ordinal", "frame", "value_ordinal"]);
    same(root.kind, "ssa"); same(root.function_ordinal, 0); same(root.frame, 1); uint(root.value_ordinal, 0xffff_ffff); same(path.components, []);
    const availability = value.availability as Row;
    if (availability.status === "unavailable") same(availability, { status: "unavailable", reason: "not_represented" });
    else {
      const type = object(availability.value_type, ["kind"], ["signed", "bits", "address_space"]);
      if (type.kind === "pointer") same(type, { kind: "pointer", address_space: "global" });
      else if (type.kind === "bool") same(type, { kind: "bool" });
      else { need(type.bits === 32 || type.bits === 64, "Unsupported V20 integer width."); same(type, { kind: "integer", signed: false, bits: type.bits }); }
      same(availability.status, "captured");
    }
  }
  const projected = projectResourceScalarValues(result.values);
  need(projected.status === "ready", "Invalid scalar, symbolic or pointer value encoding.");
  let next: number | null = null;
  if (result.next_cursor !== undefined) {
    const to = pageCursor(result.next_cursor); same(to.query_identity, query);
    next = uint(to.position, 65536); same(next, start + projected.rows.length);
    same(projected.rows.length, limit); need(next > start, "Nonprogressing value page.");
  }
  return { observed, rows: projected.rows, page: { start, next } };
}
function bytes(value: unknown, length: number): string[] {
  need(typeof value === "string" && value.length === 2 + length * 2 && /^0x[0-9a-f]*$/u.test(value), "Invalid fixed-length byte encoding.");
  return value.slice(2).match(/../gu) ?? [];
}
export function memory(result: Row, request: Row, session: Row): { observed: PhysicalAnchorV20; memory: PhysicalMemoryV20 } {
  object(result, ["result", "snapshot", "memory"]); same(result.result, "memory");
  const observed = anchor(result.snapshot, session);
  const data = object(result.memory, ["allocation", "byte_offset", "requested_bytes", "returned_bytes", "availability"]);
  same(data.allocation, request.allocation); same(data.byte_offset, request.byte_offset);
  same(data.requested_bytes, request.byte_len); same(data.returned_bytes, request.byte_len);
  const id = allocation(data.allocation); same(id.generation, 0);
  const count = uint(data.returned_bytes, 256); need(count > 0, "Empty memory result.");
  const offset = uint(data.byte_offset); need(Number.isSafeInteger(offset + count), "Memory extent overflow.");
  const availability = object(data.availability, ["status", "address_space", "bytes", "initialized", "truncated"]);
  same(availability.status, "captured"); same(availability.address_space, "global"); same(availability.truncated, false);
  const raw = bytes(availability.bytes, count), init = bytes(availability.initialized, Math.ceil(count / 8)).map(x => Number.parseInt(x, 16));
  if (count % 8) need((init[init.length - 1] >> (count % 8)) === 0, "Nonzero initialization padding.");
  return { observed, memory: { allocation: uint(id.ordinal), offset, cells: raw.map((byte, i) =>
    ({ byte, initialized: (init[Math.floor(i / 8)] & (1 << (i % 8))) !== 0 })) } };
}
