/** V22 scope/value/memory projections; older wave0 validators remain unchanged. */
import { projectResourceScalarValues, type CheckpointValueRow } from "./resource-checkpoint-values";
import { allocation, digest, need, object, pageCursor, same, uint, type Row } from "./physical-entry-debug-v20-shapes";
import { stop } from "./physical-entry-debug-v20-views";
import { hashBytes } from "./physical-lds-debug-v22-framing";
import { bytes, initialized, type LdsContext } from "./physical-lds-debug-v22-input";
export interface LdsAnchor { readonly event: number; readonly revision: number; readonly local: number; readonly wave: number; readonly lane: number; readonly site: Row }
export interface LdsMemory { readonly allocation: number; readonly space: "global" | "workgroup"; readonly offset: number; readonly cells: readonly { byte: string; initialized: boolean }[] }
export interface LdsObservation {
  readonly id: number; readonly operation: string; readonly event: number; readonly revision: number;
  readonly status: "ok" | "error" | "unavailable"; readonly detail: string;
  readonly anchor: LdsAnchor | null; readonly values: readonly CheckpointValueRow[] | null; readonly rawValues: readonly Row[] | null;
  readonly page: { start: number; next: number | null } | null; readonly memory: LdsMemory | null;
  readonly requestUtf8: string; readonly responseUtf8: string;
}
export function anchorV22(value: unknown, session: Row, context: LdsContext): LdsAnchor {
  const a = object(value, ["cursor", "scope", "site"]); same(a.cursor, session.cursor);
  const cursor = session.cursor as Row, event = uint(cursor.event_sequence, context.index.records.length);
  need(event > 0, "Entry cursor has no snapshot.");
  const row = context.index.records[event - 1]; need(row.payload.kind === "checkpoint", "No snapshot on an index event row.");
  const s = object(a.scope, ["level", "workgroup", "wave", "lane", "logical_workitem", "active_mask", "wave_width", "interpretation"]);
  same(s.level, "lane"); same(s.workgroup, [0, 0, 0]); same(s.wave, row.wave); same(s.lane, row.lane);
  same(s.logical_workitem, [row.local, 0, 0]); same(s.active_mask, 0xffff_ffff_ffff_ffffn);
  same(s.wave_width, 64); same(s.interpretation, "logical_visualization");
  const site = object(a.site, ["kir", "source"]); same(site.kir, row.site);
  same(site.source, { status: "unavailable", reason: "requires_authenticated_map" });
  return { event, revision: uint(cursor.state_revision), local: row.local, wave: row.wave, lane: row.lane, site: row.site };
}
export function snapshotV22(value: unknown, session: Row, context: LdsContext): { raw: Row | null; anchor: LdsAnchor | null } {
  const r = object(value, ["status"], ["snapshot", "reason"]), event = uint((session.cursor as Row).event_sequence);
  const indexed = context.index.records[event - 1];
  if (r.status === "unavailable") {
    same(r, { status: "unavailable", reason: "not_captured" });
    need(!indexed || indexed.payload.kind !== "checkpoint", "Available indexed checkpoint was dropped.");
    return { raw: null, anchor: null };
  }
  object(r, ["status", "snapshot"]); same(r.status, "captured");
  const data = object(r.snapshot, ["anchor", "stop", "values"]); same(data.values, []);
  const a = anchorV22(data.anchor, session, context); stop(data.stop, event, context.index.records.length + 1);
  return { raw: data.anchor as Row, anchor: a };
}
export async function pageIdentityV22(configuration: string, event: number, revision: number): Promise<string> {
  const domain = new TextEncoder().encode("fe2o3-debug-physical-v22-ssa-page-v1\0");
  const bytes = new Uint8Array(domain.length + 48); bytes.set(domain);
  bytes.set(Uint8Array.from(digest(configuration).match(/../gu)!.map(x => Number.parseInt(x, 16))), domain.length);
  new DataView(bytes.buffer).setBigUint64(domain.length + 32, BigInt(event), true);
  new DataView(bytes.buffer).setBigUint64(domain.length + 40, BigInt(revision), true);
  return hashBytes(bytes);
}
export async function valuesV22(result: Row, request: Row, session: Row, context: LdsContext) {
  object(result, ["result", "snapshot", "values"], ["next_cursor"]); same(result.result, "values");
  const anchor = anchorV22(result.snapshot, session, context);
  same(request.scope, { level: "lane", workgroup: [0, 0, 0], wave: anchor.wave, lane: anchor.lane });
  need(request.frame === undefined || request.frame === 1, "Unknown frame.");
  const selector = request.selector as Row;
  need(selector.selector === "all" || (selector.selector === "roots" && Array.isArray(selector.roots) &&
    selector.roots.length === 1 && selector.roots[0] === "ssa"), "Unsupported successful selector.");
  const q = request.page as Row, limit = uint(q.limit, 64); need(limit > 0, "Empty page limit.");
  const identity = await pageIdentityV22(context.index.configuration, anchor.event, anchor.revision);
  const from = q.cursor === undefined ? null : pageCursor(q.cursor); if (from) same(from.query_identity, identity);
  const start = from ? uint(from.position, 65536) : 0;
  need(Array.isArray(result.values) && result.values.length <= limit, "SSA page bound exceeded.");
  const ids = new Set<number>(), indexed = context.index.records[anchor.event - 1];
  need(indexed.payload.kind === "checkpoint", "Missing indexed checkpoint.");
  const pending = indexed.payload.pending;
  const rawValues = result.values.map(value => {
    const row = object(value, ["path", "availability"]), p = object(row.path, ["root", "components"]);
    same(p.components, []); const root = object(p.root, ["kind", "function_ordinal", "frame", "value_ordinal"]);
    same(root.kind, "ssa"); same(root.function_ordinal, 0); same(root.frame, 1);
    const id = uint(root.value_ordinal, 767); need(!ids.has(id), "Duplicate SSA row."); ids.add(id);
    const a = object(row.availability, ["status"], ["reason", "value_type", "value", "provenance"]);
    if (a.status === "unavailable") same(a, { status: "unavailable", reason: "not_represented" });
    else {
      object(a, ["status", "value_type", "value", "provenance"]); same(a.status, "captured"); same(a.provenance, "simulated_observation");
      const t = object(a.value_type, ["kind"], ["signed", "bits", "address_space"]);
      if (t.kind === "pointer") same(t, { kind: "pointer", address_space: "global" });
      else if (t.kind === "bool") same(t, { kind: "bool" });
      else { need(t.bits === 32 || t.bits === 64, "Unsupported scalar width."); same(t, { kind: "integer", signed: false, bits: t.bits }); }
    }
    if (pending.some(p => p.value === id)) same(a, { status: "unavailable", reason: "not_represented" });
    return row;
  });
  const projected = projectResourceScalarValues(rawValues); need(projected.status === "ready", "Invalid scalar/pointer row.");
  let next: number | null = null;
  if (result.next_cursor !== undefined) {
    const p = pageCursor(result.next_cursor); same(p.query_identity, identity); next = uint(p.position, 65536);
    same(next, start + projected.rows.length); same(projected.rows.length, limit); need(next > start, "Nonprogressing page.");
  }
  return { anchor, values: projected.rows, rawValues, page: { start, next } };
}
export function memoryV22(result: Row, request: Row, session: Row, context: LdsContext): { anchor: LdsAnchor; memory: LdsMemory } {
  object(result, ["result", "snapshot", "memory"]); same(result.result, "memory");
  const anchor = anchorV22(result.snapshot, session, context);
  const m = object(result.memory, ["allocation", "byte_offset", "requested_bytes", "returned_bytes", "availability"]);
  same(m.allocation, request.allocation); same(m.byte_offset, request.byte_offset);
  same(m.requested_bytes, request.byte_len); same(m.returned_bytes, request.byte_len);
  const a = allocation(m.allocation); same(a.generation, 0); const ordinal = uint(a.ordinal);
  const catalog = context.index.allocations.find(a => a.ordinal === ordinal); need(catalog && anchor.event >= catalog.first, "Allocation not yet captured.");
  const offset = uint(m.byte_offset, catalog.bytes), count = uint(m.returned_bytes, 256);
  need(count > 0 && offset + count <= catalog.bytes, "Memory range exceeds captured allocation.");
  const v = object(m.availability, ["status", "address_space", "bytes", "initialized", "truncated"]);
  same(v.status, "captured"); same(v.address_space, catalog.space); same(v.truncated, false);
  const raw = bytes(v.bytes, count), init = initialized(v.initialized, count);
  return { anchor, memory: { allocation: ordinal, space: catalog.space, offset, cells: raw.map((byte, i) => ({ byte, initialized: init[i] })) } };
}
