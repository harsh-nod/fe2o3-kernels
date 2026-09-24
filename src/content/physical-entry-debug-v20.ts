/** Bounded complete-session V20 recording adapter. It never executes a protocol request.
 * Capability/version checks are presentation checks, not canonical admission or authentication. */
import { parseProgramJson, programSha256 } from "./ordered-program-observation.mjs";
import { anchor, memory, snapshot, stop, values } from "./physical-entry-debug-v20-views";
import { capabilities, cursor, digest, freeze, need, object, request, same, session, stable, uint,
  PHYSICAL_DEBUG_LIMITS_V20 as LIMITS, PHYSICAL_DEBUG_SELECTOR_V20,
  type PhysicalDebugInputV20, type PhysicalObservationV20, type PhysicalProjectionV20, type Row,
} from "./physical-entry-debug-v20-shapes";
export { PHYSICAL_DEBUG_LIMITS_V20, PHYSICAL_DEBUG_SELECTOR_V20 } from "./physical-entry-debug-v20-shapes";
export type { PhysicalDebugInputV20, PhysicalProjectionV20, PhysicalRecordingV20 } from "./physical-entry-debug-v20-shapes";
function lines(raw: string, limit: number): string[] {
  need(typeof raw === "string" && raw.length <= LIMITS.fileBytes && new TextEncoder().encode(raw).byteLength <= LIMITS.fileBytes,
    "Each JSONL file must be at most 256 KiB.");
  need(raw.endsWith("\n") && !raw.includes("\r") && raw.charCodeAt(0) !== 0xfeff, "Expected LF JSONL with final LF and no BOM.");
  const result = raw.slice(0, -1).split("\n");
  need(result.length >= 3 && result.length <= LIMITS.pairs && result.every(s => s.trim().length > 0 &&
    s.length <= limit && new TextEncoder().encode(s).byteLength <= limit), "Incomplete, oversized or empty JSONL frames.");
  return result;
}
function response(value: unknown): Row {
  const row = object(value, ["status", "schema", "request_id", "operation", "session"], ["result", "error", "unavailable"]);
  same(row.schema, "fe2o3-debug-response-v1");
  need(row.status === "ok" || row.status === "error" || row.status === "unavailable", "Unknown response status.");
  object(row, ["status", "schema", "request_id", "operation", "session", row.status === "ok" ? "result" : row.status]);
  return row;
}
function endSequence(responses: Row[]): number {
  const ends = responses.flatMap(r => {
    if (r.status !== "ok") return [];
    const result = r.result as Row;
    return result.result === "control" && (result.stop as Row)?.reason === "completed"
      ? [uint((session(r.session).cursor as Row).event_sequence, LIMITS.records + 1)] : [];
  });
  need(ends.length > 0 && ends[0] > 0 && ends.every(n => n === ends[0]), "This viewer requires a consistent recorded completed cursor.");
  return ends[0];
}
function errorResult(r: Row, q: Row, previous: Row, end: number): string {
  const error = object(r.error, ["stage", "code", "message", "state_changed"]);
  same(error.stage, "session"); same(error.state_changed, false);
  if (q.expected_revision !== previous.revision) {
    same(error.code, "stale_revision"); same(error.message, "kir_v20_debug_stale_revision");
  } else if (error.code === "invalid_cursor") {
    same(q.operation, "seek"); const target = cursor(q.cursor);
    const foreign = target.configuration_identity !== previous.configuration_identity || target.state_revision !== previous.revision;
    need(foreign || uint(target.event_sequence) > end, "Invalid-cursor refusal has no recorded invalid cursor.");
    same(error.message, foreign ? "kir_v20_debug_foreign_or_stale_cursor" : "kir_v20_debug_cursor_out_of_range");
  } else {
    need((error.code === "resource_limit" && ["kir_v20_debug_revision_limit", "kir_v20_debug_navigation_unavailable"].includes(String(error.message))) ||
      (error.code === "response_too_large" && error.message === "kir_v20_debug_response_too_large"), "Unknown or contradictory error response.");
  }
  return "Recorded refusal: " + String(error.code) + ". State unchanged.";
}
function unavailableResult(r: Row, q: Row, previous: Row, currentAnchor: Row | null): string {
  same(q.expected_revision, previous.revision);
  const value = object(r.unavailable, ["capability", "reason", "state_changed", "detail"]);
  same(value.state_changed, false); same(value.detail, "diagnostic physical-entry V20 exposes bounded CPU observations only");
  if (q.operation === "resolve_source") {
    same(value.capability, "source_sites"); same(value.reason, "requires_authenticated_map");
  } else if (q.operation === "read_memory") {
    same(value.capability, "allocation_relative_memory"); same(value.reason, "outside_capture_scope");
  } else if (q.operation === "inspect_values") {
    same(value.capability, "kir_ssa_values");
    const selector = q.selector as Row;
    const supported = selector.selector === "all" || stable(selector) === stable({ selector: "roots", roots: ["ssa"] });
    // Backend checks capture scope/frame/page limits before selector and continuation cursor.
    const page = q.page as Row, scope = currentAnchor?.scope as Row | undefined;
    const inScope = scope && stable(q.scope) === stable({ level: "lane", workgroup: scope.workgroup, wave: 0, lane: scope.lane }) &&
      (q.frame === undefined || q.frame === 1) && uint(page.limit) <= 64;
    if (!inScope) same(value.reason, "outside_capture_scope");
    else if (!supported) same(value.reason, "not_exposed_by_backend");
    else {
      same(value.reason, "outside_capture_scope");
      // With captured scope, supported selector and legal limit, only an invalid continuation can reach this refusal.
      need(page.cursor !== undefined, "Contradictory unavailable value query.");
      // Its reason is a recorded backend statement, not an independently rerun bounds check.
    }
  } else throw new Error("Unavailable operation outside this closed recording subset.");
  return "Recorded unavailable: " + String(value.capability) + " / " + String(value.reason) + ". State unchanged.";
}
export async function projectPhysicalDebugV20(input: PhysicalDebugInputV20 | null): Promise<PhysicalProjectionV20> {
  if (input === null) return { status: "unavailable", detail: "No V20 recording selected. No previous values are shown." };
  try {
    same(input.selector, PHYSICAL_DEBUG_SELECTOR_V20);
    const requestLines = lines(input.requestsUtf8, LIMITS.requestBytes), responseLines = lines(input.responsesUtf8, LIMITS.responseBytes);
    same(requestLines.length, responseLines.length);
    const requests = requestLines.map(raw => request(parseProgramJson(raw, LIMITS.requestBytes)));
    const responses = responseLines.map(raw => response(parseProgramJson(raw, LIMITS.responseBytes)));
    const [requestSha256, responseSha256] = await Promise.all([programSha256(input.requestsUtf8), programSha256(input.responsesUtf8)]);
    if (input.expected) { same(requestSha256, digest(input.expected.requests)); same(responseSha256, digest(input.expected.responses)); }
    need(responses.some(r => (r.status === "error" && typeof (r.error as Row)?.message === "string" &&
      String((r.error as Row).message).startsWith("kir_v20_debug_")) || (r.status === "unavailable" &&
      (r.unavailable as Row)?.detail === "diagnostic physical-entry V20 exposes bounded CPU observations only")),
      "Recording has no explicit V20 diagnostic profile marker.");
    const end = endSequence(responses), first = requests[0];
    same(first.operation, "discover_capabilities"); same(first.expected_revision, 0); same(responses[0].status, "ok");
    same(requests[requests.length - 1].operation, "terminate"); same(responses[responses.length - 1].status, "ok");
    const configuration = digest(session(responses[0].session).configuration_identity);
    let previous = session(responses[0].session), previousId = 0, currentAnchor: Row | null = null;
    same(previous.revision, 0); same((previous.cursor as Row).event_sequence, 0); same(previous.state, "created");
    const records: PhysicalObservationV20[] = [], anchors = new Map<number, string>();
    const cells = new Map<string, string>(), pages = new Map<string, string>(), pageIds = new Map<string, number>();
    const pageCounts = new Map<number, number>(), pageExtents = new Map<number, number>();
    for (let i = 0; i < requests.length; i++) {
      const q = requests[i], r = responses[i], view = session(r.session), at = view.cursor as Row;
      const id = uint(q.request_id); need(id > previousId, "Repeated or reordered request identity."); previousId = id;
      same(r.request_id, id); same(r.operation, q.operation); same(view.configuration_identity, configuration);
      need(previous.state !== "terminated", "Trailing observations after termination.");
      const event = uint(at.event_sequence, end), revision = uint(view.revision), operation = String(q.operation);
      const record: PhysicalObservationV20 = {
        requestId: id, operation, label: operation === "step" ? "step " + String(q.direction) : operation,
        event, revision, state: String(view.state), status: r.status as PhysicalObservationV20["status"], detail: "",
        anchor: null, values: null, page: null, memory: null, requestUtf8: requestLines[i] + "\n", responseUtf8: responseLines[i] + "\n",
      };
      let display = record;
      if (r.status !== "ok") {
        same(view, previous);
        display = { ...record, detail: r.status === "error" ? errorResult(r, q, previous, end) :
          unavailableResult(r, q, previous, currentAnchor) };
      } else {
        same(q.expected_revision, previous.revision);
        const result = object(r.result, ["result"], ["capabilities", "stop", "snapshot", "events_advanced", "values", "next_cursor", "memory"]);
        if (operation === "step" || operation === "seek") {
          object(result, ["result", "stop", "snapshot", "events_advanced"]); same(result.result, "control");
          same(revision, uint(previous.revision) + 1);
          const before = uint((previous.cursor as Row).event_sequence);
          if (operation === "seek") {
            const target = cursor(q.cursor); same(target.configuration_identity, configuration); same(target.state_revision, previous.revision);
            same(event, target.event_sequence);
          } else same(event, q.direction === "forward" ? Math.min(end, before + uint(q.count)) : Math.max(0, before - uint(q.count)));
          same(result.events_advanced, Math.abs(Math.min(event, end - 1) - Math.min(before, end - 1)));
          stop(result.stop, event, end);
          const capture = snapshot(result.snapshot, view, end); currentAnchor = capture.raw;
          display = { ...record, anchor: capture.observed, detail: event === end ? "Recorded capture completed; no end snapshot." :
            capture.observed ? "Recorded logical event checkpoint." : "Snapshot unavailable: not_captured." };
        } else if (operation === "terminate") {
          same(result, { result: "terminated" }); same(revision, uint(previous.revision) + 1);
          same(event, (previous.cursor as Row).event_sequence); same(view.state, "terminated"); currentAnchor = null;
          display = { ...record, detail: "Recorded session terminated. No command was sent by the browser." };
        } else {
          same(view, previous);
          if (operation === "discover_capabilities") { capabilities(result); display = { ...record, detail: "Recorded V20 CPU capability roster." }; }
          else if (operation === "get_state") {
            object(result, ["result", "snapshot"]); same(result.result, "state");
            const capture = snapshot(result.snapshot, view, end); currentAnchor = capture.raw;
            display = { ...record, anchor: capture.observed, detail: capture.observed ? "Recorded state checkpoint." : "Snapshot unavailable: not_captured." };
          } else if (operation === "inspect_values" || operation === "read_memory") {
            need(currentAnchor !== null, "Query has no current captured checkpoint."); same(result.snapshot, currentAnchor);
            if (operation === "inspect_values") {
              const value = await values(result, q, view);
              const extent = value.page.start + value.rows.length;
              if (value.page.next === null) {
                if (pageCounts.has(event)) same(pageCounts.get(event), extent);
                need(extent >= (pageExtents.get(event) ?? 0), "Contradictory final value page."); pageCounts.set(event, extent);
              }
              if (pageCounts.has(event)) need(value.page.next === null ? extent === pageCounts.get(event)! : extent < pageCounts.get(event)!,
                "Value page contradicts recorded binding count.");
              pageExtents.set(event, Math.max(pageExtents.get(event) ?? 0, extent + (value.page.next === null ? 0 : 1)));
              value.rows.forEach((row, position) => {
                const slot = event + ":" + (value.page.start + position), key = event + ":" + row.key, serialized = stable(row);
                if (pages.has(slot)) same(pages.get(slot), serialized); pages.set(slot, serialized);
                if (pageIds.has(key)) same(pageIds.get(key), value.page.start + position); pageIds.set(key, value.page.start + position);
              });
              display = { ...record, anchor: value.observed, values: value.rows, page: value.page,
                detail: "Recorded SSA page only. Symbolic not_represented bindings are not numeric addresses or zero." };
            } else {
              const value = memory(result, q, view);
              value.memory.cells.forEach((cell, position) => {
                const key = event + ":" + value.memory.allocation + ":" + (value.memory.offset + position), serialized = stable(cell);
                if (cells.has(key)) same(cells.get(key), serialized); cells.set(key, serialized);
              });
              display = { ...record, anchor: value.observed, memory: value.memory, detail: "Read-only recorded logical allocation bytes." };
            }
          } else throw new Error("Unsupported successful result.");
        }
        if (operation !== "terminate") same(view.state, event === 0 ? "created" : "stopped");
      }
      if (display.anchor) {
        // Revision changes during navigation, but immutable recorded event scope/site must not.
        const { revision: ignored, ...identity } = display.anchor; void ignored;
        const encoded = stable(identity); if (anchors.has(event)) same(anchors.get(event), encoded); anchors.set(event, encoded);
        anchor(currentAnchor, view);
      }
      records.push(display); previous = view;
    }
    return freeze({ status: "ready", key: requestSha256 + ":" + responseSha256, configuration, requestSha256, responseSha256, records });
  } catch (error) {
    return { status: "invalid", detail: "V20 recording refused; no partial or previous data displayed. " +
      (error instanceof Error ? error.message.slice(0, 200) : "Invalid or unavailable local presentation.") };
  }
}
