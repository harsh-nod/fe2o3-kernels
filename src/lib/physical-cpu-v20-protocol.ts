/** Live V20 protocol observations only. No byte-to-source custody or execution authority. */
import { parseProgramJson } from "../content/ordered-program-observation.mjs";
import { memory, snapshot, stop, values } from "../content/physical-entry-debug-v20-views";
import { capabilities, digest, freeze, need, object, same, session, uint,
  type PhysicalObservationV20, type Row } from "../content/physical-entry-debug-v20-shapes";

export const PHYSICAL_BRIDGE_V20 = "fe2o3-physical-cpu-bridge-v20";
export const PHYSICAL_LIVE_LIMITS_V20 = Object.freeze({
  requestBytes: 4096, responseBytes: 128 * 1024, innerBytes: 65536,
  commands: 255, timeoutMs: 35_000, chunks: 4096,
});
export interface PhysicalCommandV20 { readonly text: string; readonly body: Row }
function decimal(text: string | undefined, max: number, minimum = 0): number {
  need(typeof text === "string" && /^(?:0|[1-9][0-9]*)$/u.test(text), "Canonical decimal required.");
  const value = Number(text); need(Number.isSafeInteger(value) && value >= minimum && value <= max, "Command bound.");
  return value;
}
export function physicalCommandV20(text: string): PhysicalCommandV20 {
  need(typeof text === "string" && text.length <= 128 && /^[a-z0-9]+(?: [a-z0-9]+)*$/u.test(text), "Closed V20 command.");
  const [name, ...args] = text.split(" "); let body: Row | undefined;
  if (name === "state" && args.length === 0) body = { operation: "get_state" };
  else if ((name === "step" || name === "reverse") && args.length === 1)
    body = { operation: "step", direction: name === "step" ? "forward" : "reverse",
      granularity: "event", count: decimal(args[0], 64, 1) };
  else if (name === "seek" && args.length === 1) body = { operation: "seek", sequence: decimal(args[0], 8193) };
  else if (name === "values" && args.length === 1)
    body = { operation: "inspect_values", next: args[0] === "next", limit: args[0] === "next" ? 0 : decimal(args[0], 64, 1) };
  else if (name === "memory" && args.length === 2) {
    const offset = decimal(args[0], Number.MAX_SAFE_INTEGER), length = decimal(args[1], 256, 1);
    need(Number.isSafeInteger(offset + length), "Memory extent overflow.");
    body = { operation: "read_memory", allocation: { ordinal: 1, generation: 0 }, byte_offset: offset, byte_len: length };
  }
  need(body, "Unsupported V20 command."); return freeze({ text, body });
}
function refusal(response: Row, operation: string): string {
  if (response.status === "error") {
    const row = object(response.error, ["stage", "code", "message", "state_changed"]);
    same(row.stage, "session"); same(row.state_changed, false);
    need(["invalid_cursor", "stale_revision", "resource_limit", "response_too_large", "invalid_state"].includes(String(row.code)) &&
      typeof row.message === "string" && /^kir_v20_debug_[a-z_]+$/u.test(row.message) && row.message.length <= 160,
    "Unknown physical refusal.");
    return "CPU query refused: " + row.code + ". Previous query values cleared.";
  }
  const row = object(response.unavailable, ["capability", "reason", "state_changed", "detail"]);
  same(row.state_changed, false);
  same(row.detail, "diagnostic physical-entry V20 exposes bounded CPU observations only");
  const expected: Record<string, string> = { step: "forward_step", seek: "forward_step",
    inspect_values: "kir_ssa_values", read_memory: "allocation_relative_memory" };
  same(row.capability, expected[operation]);
  need(["outside_capture_scope", "not_exposed_by_backend", "truncated"].includes(String(row.reason)), "Unknown V20 unavailability.");
  return "CPU query unavailable: " + row.reason + ". Previous query values cleared.";
}
/** One immutable observation at a time; inner tokens never come from user input. */
export class PhysicalProtocolV20 {
  view: Row | null = null;
  sent = 0;
  private pending: Row | null = null;
  private selected: Row | null = null;
  private next: Row | null = null;
  private pageLimit = 0;
  private end: number | null = null;
  private highest = 0;
  get hasCheckpoint(): boolean { return this.selected !== null; }
  get hasNextPage(): boolean { return this.next !== null; }
  clear(): void { this.pending = null; this.selected = null; this.next = null; this.pageLimit = 0; }
  prepare(command: PhysicalCommandV20 | null): Row {
    need(this.pending === null && this.sent < PHYSICAL_LIVE_LIMITS_V20.commands, "Command already pending or budget exhausted.");
    let body: Row;
    if (this.view === null) { need(command === null, "Initial discovery required."); body = { operation: "discover_capabilities" }; }
    else {
      need(command, "Explicit command required."); body = { ...command.body };
      if (body.operation === "seek") body = { operation: "seek",
        cursor: { ...(this.view.cursor as Row), event_sequence: body.sequence } };
      if (body.operation === "inspect_values") {
        need(this.selected, "Values need a captured checkpoint.");
        const scope = (this.selected.scope as Row);
        const page = body.next ? (need(this.next, "No current continuation page."),
          { limit: this.pageLimit, cursor: this.next }) : { limit: body.limit };
        body = { operation: "inspect_values", scope: { level: "lane", workgroup: scope.workgroup, wave: 0, lane: scope.lane },
          frame: 1, selector: { selector: "all" }, page };
      }
      if (body.operation === "read_memory") need(this.selected, "Memory needs a captured checkpoint.");
    }
    const request = freeze({ schema: "fe2o3-debug-request-v1", request_id: this.sent + 1,
      expected_revision: this.view?.revision ?? 0, ...body });
    this.pending = request; this.sent++; this.next = null; this.pageLimit = 0;
    if (["step", "seek", "get_state"].includes(String(body.operation))) this.selected = null;
    return request;
  }
  async accept(text: string): Promise<PhysicalObservationV20> {
    try {
      need(this.pending && new TextEncoder().encode(text).byteLength + 1 <= PHYSICAL_LIVE_LIMITS_V20.innerBytes, "No pending bounded V20 reply.");
      const request = this.pending, response = object(parseProgramJson(text, PHYSICAL_LIVE_LIMITS_V20.innerBytes),
        ["schema", "request_id", "operation", "status", "session"], ["result", "error", "unavailable"]);
      const status = response.status;
      need(status === "ok" || status === "error" || status === "unavailable", "Unknown reply status.");
      object(response, ["schema", "request_id", "operation", "status", "session", status === "ok" ? "result" : status]);
      same(response.schema, "fe2o3-debug-response-v1"); same(response.request_id, request.request_id); same(response.operation, request.operation);
      const current = session(response.session), sequence = uint((current.cursor as Row).event_sequence, 8193);
      same(current.state, sequence === 0 ? "created" : "stopped");
      const revision = uint(current.revision), operation = String(request.operation);
      let observed: PhysicalObservationV20["anchor"] = null, rows: PhysicalObservationV20["values"] = null;
      let page: PhysicalObservationV20["page"] = null, mem: PhysicalObservationV20["memory"] = null;
      let detail = "Bounded CPU observation; no kernel execution was resumed.";
      if (this.view === null) {
        same(status, "ok"); same(operation, "discover_capabilities"); same(sequence, 0); same(revision, 0);
        capabilities(response.result); detail = "V20 CPU bridge connected. No checkpoint selected.";
      } else {
        same(current.configuration_identity, this.view.configuration_identity);
        if (status !== "ok") { same(current, this.view); detail = refusal(response, operation); this.clear(); }
        else {
          const result = response.result as Row;
          if (operation === "step" || operation === "seek") {
            object(result, ["result", "stop", "events_advanced", "snapshot"]); same(result.result, "control");
            same(revision, uint(this.view.revision) + 1);
            const old = uint((this.view.cursor as Row).event_sequence);
            const stopped = object(result.stop, ["reason", "outcome", "exact"]);
            let end = this.end;
            if (stopped.reason === "completed") {
              if (end === null) { need(sequence > this.highest && sequence > 0, "End must follow observed records."); end = sequence; }
              same(sequence, end);
            }
            stop(result.stop, sequence, end ?? 8194);
            if (operation === "seek") same(sequence, (request.cursor as Row).event_sequence);
            else if (request.direction === "reverse") same(sequence, Math.max(0, old - uint(request.count)));
            else same(sequence, end === null ? old + uint(request.count) : Math.min(old + uint(request.count), end));
            const total = end === null ? 8192 : end - 1;
            same(result.events_advanced, Math.abs(Math.min(sequence, total) - Math.min(old, total)));
            const capture = snapshot(result.snapshot, current, end ?? 8193);
            if (sequence === 0 || sequence === end) need(capture.raw === null, "Sentinel has no snapshot.");
            this.selected = capture.raw; observed = capture.observed; this.end = end;
            this.highest = Math.max(this.highest, sequence === end ? 0 : sequence);
            detail = "Navigated immutable CPU observations. Cursor movement does not execute or rewind a kernel.";
          } else {
            same(current, this.view);
            if (operation === "get_state") {
              object(result, ["result", "snapshot"]); same(result.result, "state");
              const capture = snapshot(result.snapshot, current, this.end ?? 8193);
              this.selected = capture.raw; observed = capture.observed;
            } else if (operation === "inspect_values") {
              need(this.selected, "No retained current checkpoint.");
              same(result.snapshot, this.selected);
              const value = await values(result, request, current);
              const seen = new Set<number>();
              for (const raw of result.values as Row[]) {
                const root = ((raw.path as Row).root as Row), ordinal = uint(root.value_ordinal);
                need(!seen.has(ordinal), "Repeated SSA identity."); seen.add(ordinal);
                const availability = raw.availability as Row;
                if (availability.status === "captured" && (availability.value_type as Row).kind === "pointer")
                  same((availability.value as Row).allocation, { ordinal: 1, generation: 0 });
              }
              observed = value.observed; rows = value.rows; page = value.page;
              this.next = result.next_cursor ? freeze(result.next_cursor as Row) : null;
              this.pageLimit = uint((request.page as Row).limit);
            } else if (operation === "read_memory") {
              need(this.selected, "No retained current checkpoint."); same(result.snapshot, this.selected);
              const value = memory(result, request, current);
              same(value.memory.allocation, 1); observed = value.observed; mem = value.memory;
            } else throw new Error("Unsupported successful V20 reply.");
          }
        }
      }
      this.view = freeze(current); this.pending = null;
      return freeze({ requestId: uint(request.request_id), operation, label: operation, event: sequence,
        revision, state: String(current.state), status, detail, anchor: observed, values: rows, page, memory: mem,
        requestUtf8: JSON.stringify(request), responseUtf8: text });
    } catch (error) { this.clear(); throw error; }
  }
}
export function physicalOuterV20(text: string): Row {
  need(new TextEncoder().encode(text).byteLength <= PHYSICAL_LIVE_LIMITS_V20.responseBytes, "Outer reply bound.");
  const value = object(parseProgramJson(text, PHYSICAL_LIVE_LIMITS_V20.responseBytes), ["schema", "status"],
    ["connection_id", "bridge_session", "sequence", "session", "response_json", "closed", "code", "outcome"]);
  same(value.schema, PHYSICAL_BRIDGE_V20); return value;
}
export function outerSessionV20(value: unknown, inner: Row): void {
  const outer = object(value, ["backend", "execution_kind", "state", "revision", "configuration_identity",
    "cursor", "simulated", "hardware_observed", "performance_prediction"]);
  const at = object(outer.cursor, ["configuration_identity", "event_sequence", "state_revision"]);
  same(outer, { ...inner, revision: String(inner.revision), cursor: { ...(inner.cursor as Row),
    event_sequence: String((inner.cursor as Row).event_sequence), state_revision: String(inner.revision) } });
  digest(at.configuration_identity);
}
