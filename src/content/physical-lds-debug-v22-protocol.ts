/** Closed V22 JSONL presentation. Never sends or evaluates a request. */
import { parseProgramJson } from "./ordered-program-observation.mjs";
import { allocation, capabilities, digest, freeze, kirSite, need, object, pageCursor, same, stable, uint, vector, type Row } from "./physical-entry-debug-v20-shapes";
import { stop } from "./physical-entry-debug-v20-views";
import { aborted, boundedText, LDS_LIMITS as L } from "./physical-lds-debug-v22-framing";
import { type LdsContext } from "./physical-lds-debug-v22-input";
import { memoryV22, pageIdentityV22, snapshotV22, valuesV22, type LdsAnchor, type LdsObservation } from "./physical-lds-debug-v22-views";
function cursor(value: unknown): Row {
  const c = object(value, ["configuration_identity", "event_sequence", "state_revision"]);
  digest(c.configuration_identity); uint(c.event_sequence); uint(c.state_revision); return c;
}
function request(value: unknown): Row {
  const base = ["schema", "request_id", "expected_revision", "operation"];
  const q = object(value, base, ["direction", "granularity", "count", "cursor", "scope", "frame", "selector", "page", "allocation", "byte_offset", "byte_len", "site"]);
  same(q.schema, "fe2o3-debug-request-v1"); need(uint(q.request_id) > 0, "Zero request ID."); uint(q.expected_revision);
  switch (q.operation) {
    case "discover_capabilities": case "get_state": case "terminate": object(q, base); break;
    case "step":
      object(q, [...base, "direction", "granularity", "count"]); same(q.granularity, "event");
      need(q.direction === "forward" || q.direction === "reverse", "Unknown direction."); need(uint(q.count, 16384) > 0, "Empty step."); break;
    case "seek": object(q, [...base, "cursor"]); cursor(q.cursor); break;
    case "resolve_source": object(q, [...base, "site"]); kirSite(q.site); break;
    case "read_memory":
      object(q, [...base, "allocation", "byte_offset", "byte_len"]); allocation(q.allocation);
      uint(q.byte_offset); need(uint(q.byte_len, 65536) > 0, "Empty memory query."); break;
    case "inspect_values": {
      object(q, [...base, "scope", "selector", "page"], ["frame"]);
      const s = object(q.scope, ["level", "workgroup", "wave", "lane"]); same(s.level, "lane"); vector(s.workgroup); uint(s.wave); uint(s.lane, 63);
      if (q.frame !== undefined) uint(q.frame);
      const selector = object(q.selector, ["selector"], ["roots"]);
      if (selector.selector === "all") object(selector, ["selector"]);
      else {
        same(selector.selector, "roots"); object(selector, ["selector", "roots"]);
        need(Array.isArray(selector.roots) && selector.roots.length === 1 && ["ssa", "register", "source_variable"].includes(String(selector.roots[0])), "Unsupported selector.");
      }
      const p = object(q.page, ["limit"], ["cursor"]); need(uint(p.limit, 65536) > 0, "Empty page.");
      if (p.cursor !== undefined) pageCursor(p.cursor); break;
    }
    default: throw new Error("Unknown recording operation.");
  }
  return q;
}
function session(value: unknown, context: LdsContext): Row {
  const s = object(value, ["backend", "execution_kind", "state", "revision", "configuration_identity", "cursor", "simulated", "hardware_observed", "performance_prediction"]);
  same(s.backend, "cpu_kir_simulator"); same(s.execution_kind, "cpu_kir_simulation");
  need(["created", "stopped", "terminated"].includes(String(s.state)), "Unknown state.");
  uint(s.revision); same(s.configuration_identity, context.index.configuration);
  const c = cursor(s.cursor); same(c.configuration_identity, s.configuration_identity); same(c.state_revision, s.revision);
  uint(c.event_sequence, context.index.records.length + 1);
  same(s.simulated, true); same(s.hardware_observed, false); same(s.performance_prediction, false); return s;
}
function lines(raw: string, cap: number): string[] {
  boundedText(raw, L.jsonlBytes); need(raw.endsWith("\n") && !raw.includes("\r") && !raw.startsWith("\ufeff"), "Expected LF JSONL.");
  const rows = raw.slice(0, -1).split("\n");
  need(rows.length >= 3 && rows.length <= L.pairs, "JSONL pair bound.");
  rows.forEach(s => boundedText(s, cap)); return rows;
}
function error(r: Row, q: Row, previous: Row, end: number): string {
  const e = object(r.error, ["stage", "code", "message", "state_changed"]); same(e.stage, "session"); same(e.state_changed, false);
  if (q.expected_revision !== previous.revision) {
    same(e.code, "stale_revision"); same(e.message, "kir_v22_debug_stale_revision");
  } else if (e.code === "invalid_cursor") {
    same(q.operation, "seek"); const c = cursor(q.cursor);
    const foreign = c.configuration_identity !== previous.configuration_identity || c.state_revision !== previous.revision;
    need(foreign || uint(c.event_sequence) > end, "Unjustified invalid cursor.");
    same(e.message, foreign ? "kir_v22_debug_foreign_or_stale_cursor" : "kir_v22_debug_cursor_out_of_range");
  } else {
    need((e.code === "resource_limit" && ["kir_v22_debug_revision_limit", "kir_v22_debug_navigation_unavailable"].includes(String(e.message))) ||
      (e.code === "response_too_large" && e.message === "kir_v22_debug_response_too_large"), "Unknown error.");
  }
  return "Recorded refusal: " + String(e.code) + "; state unchanged.";
}
async function unavailable(r: Row, q: Row, previous: Row, a: LdsAnchor | null, context: LdsContext): Promise<string> {
  same(q.expected_revision, previous.revision);
  const u = object(r.unavailable, ["capability", "reason", "state_changed", "detail"]);
  same(u.state_changed, false); same(u.detail, "diagnostic physical-LDS-exchange V22 exposes bounded CPU observations only");
  if (q.operation === "resolve_source") { same(u.capability, "source_sites"); same(u.reason, "requires_authenticated_map"); }
  else if (q.operation === "read_memory") {
    same(u.capability, "allocation_relative_memory"); same(u.reason, "outside_capture_scope");
    const id = allocation(q.allocation), allocation_ = context.index.allocations.find(v => v.ordinal === id.ordinal);
    need(!a || !allocation_ || id.generation !== 0 || a.event < allocation_.first || uint(q.byte_len) > 256 ||
      uint(q.byte_offset) + uint(q.byte_len) > allocation_.bytes, "Contradictory memory refusal.");
  } else if (q.operation === "inspect_values") {
    same(u.capability, "kir_ssa_values");
    const p = q.page as Row, selector = q.selector as Row;
    const inScope = a && stable(q.scope) === stable({ level: "lane", workgroup: [0, 0, 0], wave: a.wave, lane: a.lane }) &&
      (q.frame === undefined || q.frame === 1) && uint(p.limit) <= 64;
    const supported = selector.selector === "all" || stable(selector) === stable({ selector: "roots", roots: ["ssa"] });
    if (!inScope) same(u.reason, "outside_capture_scope");
    else if (!supported) same(u.reason, "not_exposed_by_backend");
    else {
      same(u.reason, "outside_capture_scope"); need(p.cursor !== undefined, "Unjustified page refusal.");
      const page = pageCursor(p.cursor), actual = await pageIdentityV22(context.index.configuration, a.event, a.revision);
      // A matching identity may still name a position beyond the captured binding set.
      need(page.query_identity !== actual || uint(page.position) > 0, "Unjustified initial-page refusal.");
    }
  } else throw new Error("Unavailable operation outside closed profile.");
  return "Recorded unavailable: " + String(u.capability) + " / " + String(u.reason) + "; state unchanged.";
}
export async function ldsProtocol(context: LdsContext, signal?: AbortSignal): Promise<readonly LdsObservation[]> {
  const qs = lines(context.requestsUtf8, L.requestBytes), rs = lines(context.responsesUtf8, L.responseBytes); same(qs.length, rs.length);
  const requests = qs.map(s => request(parseProgramJson(s, L.requestBytes)));
  const responses = rs.map(s => {
    const r = object(parseProgramJson(s, L.responseBytes), ["status", "schema", "request_id", "operation", "session"], ["result", "error", "unavailable"]);
    need(["ok", "error", "unavailable"].includes(String(r.status)), "Unknown response.");
    object(r, ["status", "schema", "request_id", "operation", "session", r.status === "ok" ? "result" : String(r.status)]);
    same(r.schema, "fe2o3-debug-response-v1"); return r;
  });
  same(requests[0].operation, "discover_capabilities"); same(responses[0].status, "ok");
  same(requests.at(-1)!.operation, "terminate"); same(responses.at(-1)!.status, "ok");
  let previous = session(responses[0].session, context), id = 0, currentRaw: Row | null = null, current: LdsAnchor | null = null;
  same(previous.revision, 0); same((previous.cursor as Row).event_sequence, 0); same(previous.state, "created");
  const end = context.index.records.length + 1, records: LdsObservation[] = [];
  const cells = new Map<string, string>(), slots = new Map<string, string>(), ids = new Map<string, number>();
  const counts = new Map<number, number>(), extents = new Map<number, number>();
  let valueRows = 0, memoryCells = 0, completed = false;
  for (let i = 0; i < requests.length; i++) {
    aborted(signal);
    const q = requests[i], r = responses[i], view = session(r.session, context), at = view.cursor as Row;
    need(uint(q.request_id) > id && previous.state !== "terminated", "Reordered or trailing request."); id = uint(q.request_id);
    same(r.request_id, id); same(r.operation, q.operation);
    const event = uint(at.event_sequence), revision = uint(view.revision), operation = String(q.operation);
    const record: LdsObservation = { id, operation, event, revision, status: r.status as LdsObservation["status"], detail: "",
      anchor: null, values: null, rawValues: null, page: null, memory: null, requestUtf8: qs[i] + "\n", responseUtf8: rs[i] + "\n" };
    let display: LdsObservation;
    if (r.status !== "ok") {
      same(view, previous);
      display = { ...record, detail: r.status === "error" ? error(r, q, previous, end) : await unavailable(r, q, previous, current, context) };
    } else {
      same(q.expected_revision, previous.revision);
      const result = object(r.result, ["result"], ["capabilities", "stop", "snapshot", "events_advanced", "values", "next_cursor", "memory"]);
      if (operation === "step" || operation === "seek") {
        object(result, ["result", "stop", "snapshot", "events_advanced"]); same(result.result, "control"); same(revision, uint(previous.revision) + 1);
        const before = uint((previous.cursor as Row).event_sequence);
        if (operation === "seek") { const target = cursor(q.cursor); same(target.configuration_identity, context.index.configuration); same(target.state_revision, previous.revision); same(event, target.event_sequence); }
        else same(event, q.direction === "forward" ? Math.min(end, before + uint(q.count)) : Math.max(0, before - uint(q.count)));
        same(result.events_advanced, Math.abs(Math.min(event, end - 1) - Math.min(before, end - 1))); stop(result.stop, event, end);
        const snapshot = snapshotV22(result.snapshot, view, context); currentRaw = snapshot.raw; current = snapshot.anchor;
        if (event === end) completed = true;
        display = { ...record, anchor: current, detail: current ? "Recorded logical checkpoint." : "No captured snapshot at this cursor." };
      } else if (operation === "terminate") {
        same(result, { result: "terminated" }); same(revision, uint(previous.revision) + 1); same(event, (previous.cursor as Row).event_sequence);
        same(view.state, "terminated"); currentRaw = null; current = null; display = { ...record, detail: "Recorded termination; browser sent no command." };
      } else {
        same(view, previous);
        if (operation === "discover_capabilities") { capabilities(result); display = { ...record, detail: "Recorded CPU capabilities; no hardware observation." }; }
        else if (operation === "get_state") {
          object(result, ["result", "snapshot"]); same(result.result, "state");
          const s = snapshotV22(result.snapshot, view, context); currentRaw = s.raw; current = s.anchor; display = { ...record, anchor: current, detail: "Recorded state." };
        } else if (operation === "inspect_values" || operation === "read_memory") {
          need(currentRaw !== null, "Query without captured checkpoint."); same(result.snapshot, currentRaw);
          if (operation === "inspect_values") {
            const v = await valuesV22(result, q, view, context), extent = v.page.start + v.values.length;
            valueRows += v.values.length; need(valueRows <= L.valueRows, "Aggregate SSA page bound.");
            if (v.page.next === null) { if (counts.has(event)) same(counts.get(event), extent); need(extent >= (extents.get(event) ?? 0), "Contradictory final page."); counts.set(event, extent); }
            if (counts.has(event)) need(v.page.next === null ? extent === counts.get(event)! : extent < counts.get(event)!, "Contradictory page count.");
            extents.set(event, Math.max(extents.get(event) ?? 0, extent + (v.page.next === null ? 0 : 1)));
            v.rawValues.forEach((row, j) => {
              const slot = event + ":" + (v.page.start + j), key = event + ":" + ((row.path as Row).root as Row).value_ordinal, text = stable(row);
              if (slots.has(slot)) same(slots.get(slot), text); slots.set(slot, text);
              if (ids.has(key)) same(ids.get(key), v.page.start + j); ids.set(key, v.page.start + j);
            });
            display = { ...record, ...v, detail: "Recorded SSA page. Symbolic/pending values are not numeric zero or addresses." };
          } else {
            const v = memoryV22(result, q, view, context); memoryCells += v.memory.cells.length; need(memoryCells <= L.memoryCells, "Aggregate memory bound.");
            v.memory.cells.forEach((cell, j) => { const key = event + ":" + v.memory.allocation + ":" + (v.memory.offset + j), text = stable(cell); if (cells.has(key)) same(cells.get(key), text); cells.set(key, text); });
            display = { ...record, ...v, detail: "Recorded allocation-relative bytes; no physical address." };
          }
        } else throw new Error("Unsupported successful operation.");
      }
      if (operation !== "terminate") same(view.state, event === 0 ? "created" : "stopped");
    }
    records.push(display); previous = view;
  }
  need(completed, "Recording lacks completed cursor."); aborted(signal); return freeze(records);
}
