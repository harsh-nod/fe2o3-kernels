// Synthetic test transport ONLY. No debugger child, socket, compiler, GPU or captured provenance.
import type { CpuFetch } from "../../src/lib/cpu-debug-session";
export const SYNTHETIC_SECRET = "a".repeat(64);
export const SYNTHETIC_CONFIGURATION = "c".repeat(64);
export const SYNTHETIC_ENDPOINT = "http://127.0.0.1:48761";
export type MockRow = Record<string, unknown>;
export function lossless(value: unknown): string {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return "[" + value.map(lossless).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.entries(value)
    .map(([key, child]) => JSON.stringify(key) + ":" + lossless(child)).join(",") + "}";
  const encoded = JSON.stringify(value);
  if (encoded === undefined) throw new Error("Unsupported synthetic field");
  return encoded;
}
export function syntheticSession(revision = 0n, event = 0n, state = "created"): MockRow {
  return { backend: "cpu_kir_simulator", execution_kind: "cpu_kir_simulation", state, revision,
    configuration_identity: SYNTHETIC_CONFIGURATION,
    cursor: { configuration_identity: SYNTHETIC_CONFIGURATION, event_sequence: event, state_revision: revision },
    simulated: true, hardware_observed: false, performance_prediction: false };
}
export function bridgeJson(connectionId: string, bridgeSession: string, sequence: bigint, raw: MockRow): string {
  const session = raw.session as MockRow, cursor = session.cursor as MockRow;
  return lossless({ schema: "fe2o3-cpu-debug-bridge-response-v1", status: "ok", connection_id: connectionId,
    bridge_session: bridgeSession, sequence: sequence.toString(),
    session: { ...session, revision: String(session.revision), cursor: { ...cursor,
      event_sequence: String(cursor.event_sequence), state_revision: String(cursor.state_revision) } },
    response_json: lossless(raw), closed: false });
}
export function protocolReply(sequence: bigint, operation: string, session: MockRow, result: MockRow): MockRow {
  return { schema: "fe2o3-debug-response-v1", status: "ok", request_id: sequence + 1n, operation, session, result };
}
export function jsonResponse(text: string, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(text, { status, headers: { "Content-Type": "application/json; charset=utf-8", ...headers } });
}
export function bridgeFailure(code: string, outcome: "not_sent" | "unknown" = "unknown", closed = false): Response {
  return jsonResponse(lossless({ schema: "fe2o3-cpu-debug-bridge-response-v1", status: "error", code, outcome, closed }), 409);
}
export class SyntheticCpuBridge {
  readonly calls: { url: string; init: RequestInit; body: MockRow }[] = [];
  connectionId = ""; bridgeSession = ""; sequence = 0n; revision = 0n; event = 0n; state = "created";
  refusal = false; connections = 0;
  fetch: CpuFetch = async (url, init) => {
    const body = JSON.parse(String(init.body)) as MockRow; // Only the all-string bridge request envelope.
    this.calls.push({ url, init, body });
    if (url.endsWith("/v1/disconnect")) return jsonResponse(lossless({
      schema: "fe2o3-cpu-debug-bridge-response-v1", status: "disconnected", connection_id: body.connection_id, closed: true,
    }));
    let operation: string, result: MockRow;
    if (url.endsWith("/v1/connect")) {
      this.connectionId = String(body.connection_id); this.bridgeSession = (++this.connections).toString(16).padStart(64, "b");
      this.sequence = this.revision = this.event = 0n; this.state = "created";
      operation = "discover_capabilities"; result = { result: "capabilities", capabilities: [] };
    } else {
      this.sequence = BigInt(String(body.sequence));
      const words = String(body.command).split(" "), [name, action] = words;
      const names: Record<string, string> = { state: "get_state", stack: "inspect_stack", source: "resolve_source",
        memory: "read_memory", step: "step", reverse: "step", continue: "continue" };
      operation = names[name] ?? (action === "add" ? "set_" : action === "remove" ? "remove_" : "list_") +
        (name === "break" ? "breakpoints" : "watchpoints");
      if (this.refusal) {
        this.refusal = false;
        const raw = { schema: "fe2o3-debug-response-v1", status: "unavailable", request_id: this.sequence + 1n,
          operation, session: syntheticSession(this.revision, this.event, this.state),
          unavailable: { code: "capability_unavailable", reason: "not_captured", state_changed: false } };
        return jsonResponse(bridgeJson(this.connectionId, this.bridgeSession, this.sequence, raw));
      }
      if (name === "step" || name === "reverse" || name === "continue") {
        const movement = name === "continue" ? 3n : BigInt(action ?? "1");
        this.event += name === "reverse" ? -movement : movement; this.revision++; this.state = "stopped";
        result = { result: "control", events_advanced: movement, stop: { reason: "step", outcome: "active", exact: true },
          snapshot: { status: "unavailable", reason: "not_captured" } };
      } else if (operation.startsWith("set_") || operation.startsWith("remove_")) {
        this.revision++; result = { result: "acknowledged", accepted: 1n };
      } else if (name === "state") result = { result: "state", snapshot: { status: "unavailable", reason: "not_captured" } };
      else if (name === "stack") result = { result: "stack", snapshot: { cursor: syntheticSession(this.revision, this.event, this.state).cursor },
        frames: [], next_cursor: "synthetic-next-page-not-traversed" };
      else if (name === "source") result = { result: "source", site: {
        kir: { function_ordinal: BigInt(words[1]), block_ordinal: BigInt(words[2]), point: { kind: "operation", operation_ordinal: BigInt(words[3]) } },
        source: { status: "unavailable", reason: "requires_authenticated_map" },
      } };
      else if (name === "memory") {
        const count = Number(words[4]), initialized = Array.from({ length: Math.ceil(count / 8) },
          (_, index) => Math.min(255, (2 ** Math.min(8, count - index * 8)) - 1).toString(16).padStart(2, "0")).join("");
        result = { result: "memory", snapshot: { cursor: syntheticSession(this.revision, this.event, this.state).cursor }, memory: {
          allocation: { ordinal: BigInt(words[1]), generation: BigInt(words[2]) }, byte_offset: BigInt(words[3]),
          requested_bytes: BigInt(words[4]), returned_bytes: BigInt(words[4]),
          availability: { status: "captured", bytes: "0x" + "a5".repeat(count), initialized: "0x" + initialized },
        } };
      } else result = { result: name === "break" ? "breakpoints" : "watchpoints", [name === "break" ? "breakpoints" : "watchpoints"]: [] };
    }
    const raw = protocolReply(this.sequence, operation, syntheticSession(this.revision, this.event, this.state), result);
    return jsonResponse(bridgeJson(this.connectionId, this.bridgeSession, this.sequence, raw));
  };
}
