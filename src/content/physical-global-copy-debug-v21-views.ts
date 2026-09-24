/** Closed V21 SSA page domain. Neutral V20 scalar/anchor checks are reused, not its profile admission. */
import { projectResourceScalarValues } from "./resource-checkpoint-values";
import { anchor } from "./physical-entry-debug-v20-views";
import { digest, need, object, pageCursor, same, uint, type Row } from "./physical-entry-debug-v20-shapes";
export async function queryIdentityV21(configuration: string, sequence: number, revision: number): Promise<string> {
  const domain = new TextEncoder().encode("fe2o3-debug-physical-v21-ssa-page-v1\0");
  const bytes = new Uint8Array(domain.length + 32 + 16); bytes.set(domain);
  bytes.set(Uint8Array.from(configuration.match(/../gu)!.map(x => Number.parseInt(x, 16))), domain.length);
  const view = new DataView(bytes.buffer); view.setBigUint64(domain.length + 32, BigInt(sequence), true);
  view.setBigUint64(domain.length + 40, BigInt(revision), true);
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), n => n.toString(16).padStart(2, "0")).join("");
}
export async function valuesV21(result: Row, request: Row, session: Row) {
  object(result, ["result", "snapshot", "values"], ["next_cursor"]); same(result.result, "values");
  const observed = anchor(result.snapshot, session), scope = request.scope as Row;
  same(scope, { level: "lane", workgroup: observed.workgroup, wave: 0, lane: observed.lane });
  need(request.frame === undefined || request.frame === 1, "Unknown logical frame.");
  const selector = request.selector as Row;
  need(selector.selector === "all" || (selector.selector === "roots" && Array.isArray(selector.roots) &&
    selector.roots.length === 1 && selector.roots[0] === "ssa"), "Unsupported successful value selector.");
  const page = request.page as Row, limit = uint(page.limit, 64);
  const query = await queryIdentityV21(digest(session.configuration_identity), observed.event, observed.revision);
  const from = page.cursor === undefined ? null : pageCursor(page.cursor);
  if (from) same(from.query_identity, query);
  const start = from ? uint(from.position, 65536) : 0;
  need(Array.isArray(result.values) && result.values.length <= limit, "Invalid recorded value page length.");
  for (const raw of result.values) {
    const value = object(raw, ["path", "availability"]), path = object(value.path, ["root", "components"]);
    const root = object(path.root, ["kind", "function_ordinal", "frame", "value_ordinal"]);
    same(root.kind, "ssa"); same(root.function_ordinal, 0); same(root.frame, 1); uint(root.value_ordinal, 767); same(path.components, []);
    const availability = value.availability as Row;
    if (availability.status === "unavailable") same(availability, { status: "unavailable", reason: "not_represented" });
    else {
      const type = object(availability.value_type, ["kind"], ["signed", "bits", "address_space"]);
      if (type.kind === "pointer") same(type, { kind: "pointer", address_space: "global" });
      else if (type.kind === "bool") same(type, { kind: "bool" });
      else { need(type.bits === 32 || type.bits === 64, "Unsupported V21 integer width."); same(type, { kind: "integer", signed: false, bits: type.bits }); }
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
