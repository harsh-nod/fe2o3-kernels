/** Opt-in loopback CPU transport. No source files, executable paths or shell input. */
import { isCpuObservedCommand, parseCpuObservedCommand, requireObservedSelection, validateCpuObservedReply,
  observedOwner, type CpuObservedContext } from "./cpu-observed-protocol";
import { collectCpuObservedQueries, type CpuObservedCollection, type CpuObservedSelection } from "./cpu-observed-collection";
import { CPU_DECLARED_TARGET_BYTES, joinDeclaredTarget } from "./cpu-declared-target";
import { parseProgramJson } from "../content/ordered-program-observation.mjs";
import { CPU_LIVE_QUERY_LIMITS, captureCpuCheckpoint, collectCpuQueries, cpuQueryPair, cpuQueryRequestSchema,
  cpuResourceProjection, isCpuQueryOperation, selectCpuInventory, validateCpuQueryReply, validateCpuStack,
  type CpuLiveCheckpoint, type CpuLiveQueryCollection, type CpuLiveQueryContext, type CpuLiveQuerySelection,
} from "./cpu-live-query-collection";
import type { ResourceSourceValuePair } from "../content/resource-source-values";
import type { ResourceAccessProjection } from "../content/resource-access-view";

export const CPU_BRIDGE_LIMITS = Object.freeze({
  requestBytes: 4096, responseBytes: 1024 * 1024, protocolBytes: 256 * 1024,
  commandBytes: 1024, timeoutMs: 35_000, maxSequence: 254, readChunks: 4096,
});
const REQUEST_SCHEMA = "fe2o3-cpu-debug-bridge-request-v1";
const RESPONSE_SCHEMA = "fe2o3-cpu-debug-bridge-response-v1";
const U64 = 0xffffffffffffffffn;
// Intrinsic brand checking also accepts native byte streams from another realm.
// Calling the getter directly cannot be fooled by an own Symbol.toStringTag.
const typedArrayKind = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(Uint8Array.prototype), Symbol.toStringTag,
)?.get;
function isByteChunk(value: unknown): value is Uint8Array {
  return ArrayBuffer.isView(value) && typedArrayKind?.call(value) === "Uint8Array";
}
type Row = Record<string, unknown>;
export type CpuFetch = (input: string, init: RequestInit) => Promise<Response>;
export interface CpuSessionView {
  readonly backend: "cpu_kir_simulator";
  readonly execution_kind: "cpu_kir_simulation";
  readonly state: "created" | "running" | "stopped" | "terminated";
  readonly revision: string;
  readonly configuration_identity: string;
  readonly cursor: { readonly configuration_identity: string; readonly event_sequence: string; readonly state_revision: string };
  readonly simulated: true;
  readonly hardware_observed: false;
  readonly performance_prediction: false;
}
export interface CpuCommand {
  readonly text: string;
  readonly operation: string;
  readonly body: Readonly<Row>;
}
export interface CpuBridgeReply {
  readonly connectionId: string;
  readonly bridgeSession: string;
  readonly sequence: string;
  readonly session: CpuSessionView;
  readonly response: Readonly<Row>;
  /** Exact bridge field, losslessly re-encoded by the bridge; NOT original wire bytes. */
  readonly responseJson: string;
  /** Actual outer HTTP JSON text byte count; not a source or protocol custody claim. */
  readonly responseBytes: number;
}
export interface CpuReplyExpectation {
  readonly connectionId: string;
  readonly bridgeSession: string | null;
  readonly sequence: string;
  readonly previous: CpuSessionView | null;
  readonly command: CpuCommand;
  readonly queryContext?: CpuLiveQueryContext;
  readonly observedContext?: CpuObservedContext;
}
const CODES = ["invalid_request", "authentication_failed", "session_exists", "session_unavailable",
  "stale_session", "stale_sequence", "stale_revision", "command_refused", "resource_limit",
  "backend_failed", "cleanup_failed"] as const;
export class CpuBridgeError extends Error {
  constructor(readonly code: string, readonly outcome: "not_sent" | "unknown",
    readonly backendClosed: boolean | null = null) {
    super(outcome === "unknown"
      ? "Live CPU state cleared. Request outcome may be unknown; do not retry it. Disconnect the captured connection before reconnecting."
      : "The request was not accepted. No new live CPU values are displayed.");
    this.name = "CpuBridgeError";
  }
}
function invalid(): never { throw new CpuBridgeError("invalid_response", "unknown"); }
function requireValue(value: unknown): asserts value { if (!value) invalid(); }
function row(value: unknown): Row {
  requireValue(value !== null && typeof value === "object" && !Array.isArray(value));
  return value as Row;
}
function exact(value: unknown, fields: readonly string[]): Row {
  const result = row(value);
  requireValue(Object.keys(result).length === fields.length && fields.every(key => Object.hasOwn(result, key)));
  return result;
}
function identity(value: unknown): string {
  requireValue(typeof value === "string" && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value));
  return value;
}
export function cpuDecimal(value: unknown): string {
  if (typeof value !== "string" || !/^(?:0|[1-9][0-9]{0,19})$/u.test(value) || BigInt(value) > U64)
    throw new CpuBridgeError("invalid_input", "not_sent");
  return value;
}
function wireInteger(value: unknown): bigint {
  if (typeof value === "bigint" && value >= 0n && value <= U64) return value;
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return BigInt(value);
  invalid();
}
function numberText(value: unknown, strings: boolean): string {
  if (!strings) return wireInteger(value).toString();
  try { return cpuDecimal(value); } catch { invalid(); }
}
function key(value: unknown): string {
  if (typeof value === "bigint" || typeof value === "number") return "uint:" + wireInteger(value).toString();
  if (Array.isArray(value)) return "[" + value.map(key).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.keys(value).sort()
    .map(field => JSON.stringify(field) + ":" + key((value as Row)[field])).join(",") + "}";
  if (value === undefined) return "undefined";
  return JSON.stringify(value) ?? "undefined";
}
function same(left: unknown, right: unknown): void { requireValue(key(left) === key(right)); }
function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
}
function session(value: unknown, strings: boolean): CpuSessionView {
  const data = exact(value, ["backend", "execution_kind", "state", "revision", "configuration_identity",
    "cursor", "simulated", "hardware_observed", "performance_prediction"]);
  requireValue(data.backend === "cpu_kir_simulator" && data.execution_kind === "cpu_kir_simulation" &&
    data.simulated === true && data.hardware_observed === false && data.performance_prediction === false);
  requireValue(typeof data.state === "string" && ["created", "running", "stopped", "terminated"].includes(data.state));
  const configuration = identity(data.configuration_identity);
  const revision = numberText(data.revision, strings);
  const cursor = exact(data.cursor, ["configuration_identity", "event_sequence", "state_revision"]);
  requireValue(cursor.configuration_identity === configuration && numberText(cursor.state_revision, strings) === revision);
  return freeze({ backend: "cpu_kir_simulator", execution_kind: "cpu_kir_simulation",
    state: data.state as CpuSessionView["state"], revision, configuration_identity: configuration,
    cursor: { configuration_identity: configuration, event_sequence: numberText(cursor.event_sequence, strings), state_revision: revision },
    simulated: true, hardware_observed: false, performance_prediction: false });
}
export function cpuBridgeEndpoint(value: string): string {
  if (typeof value !== "string") throw new CpuBridgeError("invalid_endpoint", "not_sent");
  const match = /^http:\/\/127\.0\.0\.1:([1-9][0-9]{0,4})$/u.exec(value);
  if (!match || Number(match[1]) > 65535) throw new CpuBridgeError("invalid_endpoint", "not_sent");
  return value;
}
function commandNumber(value: string | undefined, min = 0n, max = U64): bigint {
  const result = BigInt(cpuDecimal(value));
  if (result < min || result > max) throw new CpuBridgeError("invalid_input", "not_sent");
  return result;
}
function site(words: string[]): Row {
  if (words.length !== 3) throw new CpuBridgeError("invalid_command", "not_sent");
  return { function_ordinal: commandNumber(words[0]), block_ordinal: commandNumber(words[1]),
    point: { kind: "operation", operation_ordinal: commandNumber(words[2]) } };
}
function memory(words: string[]): Row {
  if (words.length !== 4) throw new CpuBridgeError("invalid_command", "not_sent");
  const offset = commandNumber(words[2]), length = commandNumber(words[3], 1n, 4096n);
  if (offset + length > U64) throw new CpuBridgeError("invalid_input", "not_sent");
  return { allocation: { ordinal: commandNumber(words[0], 1n), generation: commandNumber(words[1]) },
    byte_offset: offset, byte_len: length };
}
/** Same deliberately small console subset; no help, quit, raw JSON, paths or eval. */
export function parseCpuCommand(text: string): CpuCommand {
  if (typeof text !== "string" || !/^[a-z0-9 ]+$/u.test(text) ||
      new TextEncoder().encode(text).byteLength > CPU_BRIDGE_LIMITS.commandBytes)
    throw new CpuBridgeError("invalid_command", "not_sent");
  try { const observed = parseCpuObservedCommand(text); if (observed) return observed; }
  catch { throw new CpuBridgeError("invalid_command", "not_sent"); }
  const words = text.trim().split(/ +/u), [name, ...args] = words;
  let body: Row | undefined;
  if (name === "allocations" && text === "allocations") body = { operation: "query_allocations",
    address_space: "global", page: { max_items: 16, max_scanned: 64 } };
  else if (name === "accesses" && /^accesses [1-9][0-9]{0,19} 0$/u.test(text)) body = {
    operation: "query_memory_accesses", filter: { scope: { level: "dispatch" },
      allocation: { ordinal: commandNumber(args[0], 1n), generation: 0n }, address_space: "global" },
    page: { max_items: 16, max_scanned: 64 },
  };
  else if (name === "variables" && text === "variables 1") body = { operation: "inspect_source_variables",
    scope: { level: "dispatch" }, frame: 1n, selector: { selector: "all" }, page: { limit: 16 } };
  else if (name === "state" && !args.length) body = { operation: "get_state" };
  else if (name === "stack" && !args.length) body = { operation: "inspect_stack", scope: { level: "dispatch" }, page: { limit: 16 } };
  else if (["step", "reverse", "continue"].includes(name) && args.length <= 1) {
    body = name === "continue" ? { operation: "continue", max_events: commandNumber(args[0] ?? "1024", 1n, 65536n) }
      : { operation: "step", direction: name === "reverse" ? "reverse" : "forward",
        granularity: "operation", count: commandNumber(args[0] ?? "1", 1n, 64n) };
  } else if (name === "source") body = { operation: "resolve_source", site: site(args) };
  else if (name === "memory") body = { operation: "read_memory", ...memory(args) };
  else if (["break", "watch"].includes(name)) {
    const plural = name === "break" ? "breakpoints" : "watchpoints";
    if (args.length === 1 && args[0] === "list") body = { operation: "list_" + plural, page: { limit: 16 } };
    else if (args.length === 2 && args[0] === "remove") body = {
      operation: "remove_" + plural, [name === "break" ? "breakpoint_ids" : "watchpoint_ids"]: [commandNumber(args[1], 1n)],
    };
    else if (args[0] === "add") {
      if (name === "break" && [4, 5].includes(args.length)) {
        const phase = args[4] ?? "before";
        if (!["before", "after"].includes(phase)) throw new CpuBridgeError("invalid_command", "not_sent");
        body = { operation: "set_breakpoints", breakpoints: [{ enabled: true, kind: {
          kind: "site", site: site(args.slice(1, 4)), phase: phase + "_operation",
        } }] };
      } else if (name === "watch" && [5, 6].includes(args.length)) {
        const access = args[5] ?? "write";
        if (!["read", "write", "atomic", "any"].includes(access)) throw new CpuBridgeError("invalid_command", "not_sent");
        body = { operation: "set_watchpoints", watchpoints: [{ enabled: true, ...memory(args.slice(1, 5)), access, timing: "after_commit" }] };
      }
    }
  }
  if (!body) throw new CpuBridgeError("invalid_command", "not_sent");
  return freeze({ text: words.join(" "), operation: String(body.operation), body });
}
const RESULT_TAGS: Record<string, string> = {
  discover_capabilities: "capabilities", get_state: "state", step: "control", continue: "control",
  inspect_stack: "stack", resolve_source: "source", read_memory: "memory",
  list_breakpoints: "breakpoints", list_watchpoints: "watchpoints",
  set_breakpoints: "acknowledged", remove_breakpoints: "acknowledged",
  set_watchpoints: "acknowledged", remove_watchpoints: "acknowledged",
};
const MUTATIONS = new Set(["set_breakpoints", "remove_breakpoints", "set_watchpoints", "remove_watchpoints"]);
function bindings(command: CpuCommand, result: Row, current: CpuSessionView): void {
  requireValue(result.result === RESULT_TAGS[command.operation]);
  const tag = result.result;
  let anchor: Row | undefined;
  if (tag === "state" || tag === "control") {
    const availability = row(result.snapshot);
    requireValue(typeof availability.status === "string" && ["captured", "unavailable"].includes(availability.status));
    if (availability.status === "captured") anchor = row(row(availability.snapshot).anchor);
  } else if (tag === "stack" || tag === "memory") anchor = row(result.snapshot);
  if (anchor) {
    const cursor = exact(anchor.cursor, ["configuration_identity", "event_sequence", "state_revision"]);
    same({ configuration_identity: cursor.configuration_identity, event_sequence: numberText(cursor.event_sequence, false),
      state_revision: numberText(cursor.state_revision, false) }, current.cursor);
  }
  if (tag === "acknowledged") requireValue(wireInteger(result.accepted) === 1n);
  if (tag === "control") wireInteger(result.events_advanced);
  if (tag === "source") same(row(result.site).kir, command.body.site);
  if (["stack", "breakpoints", "watchpoints"].includes(String(tag))) {
    const rows = result[tag === "stack" ? "frames" : String(tag)];
    requireValue(Array.isArray(rows) && rows.length <= 16);
  }
  if (tag === "memory") {
    const data = row(result.memory);
    same(data.allocation, command.body.allocation); same(data.byte_offset, command.body.byte_offset);
    same(data.requested_bytes, command.body.byte_len);
    const count = wireInteger(data.returned_bytes);
    requireValue(count <= wireInteger(command.body.byte_len));
    const availability = row(data.availability);
    requireValue(typeof availability.status === "string" && ["captured", "unavailable", "redacted"].includes(availability.status));
    if (availability.status === "captured") {
      for (const [field, size] of [["bytes", count], ["initialized", (count + 7n) / 8n]] as const)
        requireValue(typeof availability[field] === "string" && /^0x[0-9a-f]*$/u.test(availability[field] as string) &&
          BigInt((availability[field] as string).length) === 2n + 2n * size);
      if (count % 8n) requireValue((BigInt("0x" + (availability.initialized as string).slice(-2)) >> (count % 8n)) === 0n);
    } else requireValue(count === 0n && !Object.hasOwn(availability, "bytes") && !Object.hasOwn(availability, "initialized"));
  }
}
/** Selected correlation/binding checks, not a new complete Rust payload validator. */
export function decodeCpuBridgeReply(text: string, expected: CpuReplyExpectation): CpuBridgeReply {
  try {
    const target = expected.command.text === "target";
    if (target) requireValue(text.length <= CPU_DECLARED_TARGET_BYTES);
    const wrapper = exact(parseProgramJson(text, target ? CPU_DECLARED_TARGET_BYTES : CPU_BRIDGE_LIMITS.responseBytes),
      ["schema", "status", "connection_id", "bridge_session", "sequence", "session", "response_json", "closed"]);
    requireValue(wrapper.schema === RESPONSE_SCHEMA && wrapper.status === "ok" && wrapper.closed === false);
    requireValue(identity(wrapper.connection_id) === expected.connectionId);
    const bridgeSession = identity(wrapper.bridge_session);
    if (expected.bridgeSession !== null) requireValue(bridgeSession === expected.bridgeSession);
    requireValue(cpuDecimal(wrapper.sequence) === expected.sequence);
    requireValue(typeof wrapper.response_json === "string" && wrapper.response_json.length > 0 &&
      !/[\r\n]/u.test(wrapper.response_json));
    const response = row(parseProgramJson(wrapper.response_json, target ? CPU_DECLARED_TARGET_BYTES - 1 : CPU_BRIDGE_LIMITS.protocolBytes));
    const status = response.status;
    requireValue(status === "ok" || status === "unavailable" || status === "error");
    if (isCpuObservedCommand(expected.command)) {
      requireValue(expected.previous !== null && expected.observedContext !== undefined);
      const current = session(response.session, false);
      same(current, session(wrapper.session, true)); same(current, expected.previous);
      const reply = freeze({ connectionId: expected.connectionId, bridgeSession, sequence: expected.sequence,
        session: current, response, responseJson: wrapper.response_json,
        responseBytes: new TextEncoder().encode(text).byteLength });
      validateCpuObservedReply(expected.command, reply, expected.previous, expected.observedContext);
      return reply;
    }
    if (isCpuQueryOperation(expected.command.operation)) {
      requireValue(expected.previous !== null && expected.queryContext !== undefined);
      requireValue(response.schema === cpuQueryRequestSchema(expected.command.operation).replace("request", "response") &&
        response.operation === expected.command.operation && wireInteger(response.request_id) === BigInt(expected.sequence) + 1n);
      const current = session(response.session, false);
      same(current, session(wrapper.session, true)); same(current, expected.previous);
      const reply = freeze({ connectionId: expected.connectionId, bridgeSession, sequence: expected.sequence,
        session: current, response, responseJson: wrapper.response_json,
        responseBytes: new TextEncoder().encode(text).byteLength });
      validateCpuQueryReply(expected.command, reply, expected.previous, expected.queryContext);
      return reply;
    }
    const payload = status === "ok" ? "result" : status === "error" ? "error" : "unavailable";
    exact(response, ["schema", "status", "request_id", "operation", "session", payload]);
    requireValue(response.schema === "fe2o3-debug-response-v1" && response.operation === expected.command.operation);
    requireValue(wireInteger(response.request_id) === BigInt(expected.sequence) + 1n);
    const current = session(response.session, false);
    same(current, session(wrapper.session, true));
    const previous = expected.previous;
    if (previous) requireValue(current.configuration_identity === previous.configuration_identity);
    if (status !== "ok") {
      requireValue(previous !== null && row(response[payload]).state_changed === false); same(current, previous);
    } else {
      const result = row(response.result), operation = expected.command.operation;
      if (!previous) requireValue(operation === "discover_capabilities" && expected.sequence === "0" && current.revision === "0");
      else if (MUTATIONS.has(operation)) {
        requireValue(BigInt(previous.revision) < U64 && BigInt(current.revision) === BigInt(previous.revision) + 1n);
        requireValue(current.state === previous.state && current.cursor.event_sequence === previous.cursor.event_sequence);
      } else if (operation === "step" || operation === "continue") {
        const change = BigInt(current.revision) - BigInt(previous.revision);
        requireValue(change === 0n || change === 1n);
        if (change === 0n) same(current, previous);
        const movement = BigInt(current.cursor.event_sequence) - BigInt(previous.cursor.event_sequence);
        requireValue(expected.command.body.direction === "reverse" ? movement <= 0n : movement >= 0n);
        if (movement !== 0n) requireValue(change === 1n);
        requireValue(wireInteger(result.events_advanced) === (movement < 0n ? -movement : movement));
      } else same(current, previous);
      bindings(expected.command, result, current);
    }
    return freeze({ connectionId: expected.connectionId, bridgeSession, sequence: expected.sequence,
      session: current, response, responseJson: wrapper.response_json, responseBytes: new TextEncoder().encode(text).byteLength });
  } catch { invalid(); }
}
function decodeBridgeError(text: string): CpuBridgeError {
  try {
    const data = exact(parseProgramJson(text, CPU_BRIDGE_LIMITS.responseBytes), ["schema", "status", "code", "outcome", "closed"]);
    requireValue(data.schema === RESPONSE_SCHEMA && data.status === "error" && CODES.includes(data.code as typeof CODES[number]) &&
      typeof data.outcome === "string" && ["not_sent", "unknown"].includes(data.outcome) && typeof data.closed === "boolean");
    return new CpuBridgeError(String(data.code), data.outcome as "not_sent" | "unknown", data.closed);
  } catch { return new CpuBridgeError("invalid_response", "unknown"); }
}
async function untilAbort<T>(pending: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) throw new CpuBridgeError("cancelled", "unknown");
  let cancel: (() => void) | undefined;
  const aborted = new Promise<never>((_, reject) => {
    cancel = () => reject(new CpuBridgeError("cancelled", "unknown")); signal.addEventListener("abort", cancel, { once: true });
  });
  try { return await Promise.race([pending, aborted]); } finally { if (cancel) signal.removeEventListener("abort", cancel); }
}
async function responseText(response: Response, signal: AbortSignal,
  maxBytes: number = CPU_BRIDGE_LIMITS.responseBytes): Promise<string> {
  requireValue(!response.redirected && response.type !== "opaque" && response.type !== "opaqueredirect" &&
    /^application\/json(?:;\s*charset=utf-8)?$/iu.test(response.headers.get("content-type") ?? ""));
  const advertised = response.headers.get("content-length");
  requireValue(advertised === null || (/^(?:0|[1-9][0-9]*)$/u.test(advertised) &&
    BigInt(advertised) <= BigInt(maxBytes)));
  requireValue(response.body);
  const reader = response.body.getReader(), chunks: Uint8Array[] = [];
  let total = 0, count = 0;
  try {
    for (;;) {
      const next = await untilAbort(reader.read(), signal);
      if (next.done) break;
      requireValue(isByteChunk(next.value) && ++count <= CPU_BRIDGE_LIMITS.readChunks);
      total += next.value.byteLength;
      requireValue(total <= maxBytes);
      chunks.push(next.value.slice());
    }
    requireValue(total > 0);
    if (advertised !== null) requireValue(BigInt(advertised) === BigInt(total));
    const bytes = new Uint8Array(total); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    requireValue(!(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } finally {
    void reader.cancel().catch(() => {}); reader.releaseLock();
  }
}
interface Connection { endpoint: string; secret: string; connectionId: string; view: CpuBridgeReply | null }
export class CpuDebugSession {
  private connection: Connection | null = null;
  private pending: AbortController | null = null;
  private generation = 0;
  private checkpoint: CpuLiveCheckpoint | null = null;
  private sourceStack: ResourceSourceValuePair | null = null;
  private inventory: ResourceAccessProjection | null = null;
  private collection: CpuLiveQueryCollection | null = null;
  private collectionLease: object | null = null;
  private collectionBytes = 0;
  private observedOwner: CpuObservedContext["owner"] = null;
  private observedRuntime: CpuBridgeReply | null = null;
  private observedInventory: CpuBridgeReply | null = null;
  private observedResult: CpuObservedCollection | null = null;
  get observationCollection(): CpuObservedCollection | null { return this.observedResult; }
  private clearObserved(): void { this.observedRuntime = null; this.observedInventory = null; this.observedResult = null; }
  private observedContext(): CpuObservedContext {
    return { owner: this.observedOwner, runtime: this.observedRuntime, inventory: this.observedInventory };
  }
  get queryCheckpoint(): CpuLiveCheckpoint | null { return this.checkpoint; }
  get queryCollection(): CpuLiveQueryCollection | null { return this.collection; }
  get remainingCommands(): number {
    return this.connection?.view ? Math.max(0, CPU_BRIDGE_LIMITS.maxSequence - Number(this.connection.view.sequence)) : 0;
  }
  private clearQueries(): void {
    this.checkpoint = null; this.sourceStack = null; this.inventory = null; this.collection = null; this.clearObserved();
  }
  constructor(private readonly fetcher: CpuFetch = (input, init) => globalThis.fetch(input, init)) {}
  get needsCleanup(): boolean { return this.connection !== null; }
  get ready(): boolean { return this.connection?.view !== null && this.connection !== null && !this.pending; }
  /** Input replacement drops all live values; captured old credentials remain cleanup-only. */
  invalidate(): void {
    this.generation++; this.pending?.abort(); this.pending = null;
    this.collectionLease = null; this.clearQueries(); this.observedOwner = null;
    if (this.connection) this.connection.view = null;
  }
  private async exchange(connection: Connection, route: string, body: Row, generation: number,
    responseCap: number = CPU_BRIDGE_LIMITS.responseBytes): Promise<{ response: Response; text: string }> {
    const aborter = new AbortController(); this.pending = aborter;
    const timer = setTimeout(() => aborter.abort(), CPU_BRIDGE_LIMITS.timeoutMs);
    try {
      const serialized = JSON.stringify(body);
      requireValue(new TextEncoder().encode(serialized).byteLength <= CPU_BRIDGE_LIMITS.requestBytes);
      const response = await untilAbort(this.fetcher(connection.endpoint + route, {
        method: "POST", mode: "cors", credentials: "omit", cache: "no-store", redirect: "error",
        referrerPolicy: "no-referrer", headers: { "Content-Type": "application/json", "X-Fe2o3-Bridge-Token": connection.secret },
        body: serialized, signal: aborter.signal,
      }), aborter.signal);
      const remaining = this.collectionLease ? CPU_LIVE_QUERY_LIMITS.responseBytes - this.collectionBytes
        : CPU_BRIDGE_LIMITS.responseBytes;
      requireValue(remaining > 0);
      const text = await responseText(response, aborter.signal, Math.min(responseCap, CPU_BRIDGE_LIMITS.responseBytes, remaining));
      if (this.collectionLease) this.collectionBytes += new TextEncoder().encode(text).byteLength;
      requireValue(generation === this.generation && !aborter.signal.aborted);
      // Never turn an echoed secret into rendered raw data or a diagnostic string.
      requireValue(!text.includes(connection.secret));
      if (!response.ok) throw decodeBridgeError(text);
      requireValue(response.status === 200);
      return { response, text };
    } catch (error) {
      // Invalid headers/advertised sizes can fail before a reader exists.
      // Abort that exact fetch as well; clearing its timer must not orphan it.
      aborter.abort();
      if (generation === this.generation) {
        connection.view = null; this.clearQueries(); this.observedOwner = null;
        if (error instanceof CpuBridgeError && error.backendClosed === true) {
          connection.secret = ""; if (this.connection === connection) this.connection = null;
        }
      }
      throw error instanceof CpuBridgeError ? error : new CpuBridgeError("transport_failed", "unknown");
    } finally {
      clearTimeout(timer);
      if (this.pending === aborter) this.pending = null;
    }
  }
  async connect(endpoint: string, secret: string): Promise<CpuBridgeReply> {
    if (this.connection) throw new CpuBridgeError("cleanup_required", "not_sent");
    cpuBridgeEndpoint(endpoint);
    if (typeof secret !== "string" || !/^[0-9a-f]{64}$/u.test(secret) || /^0+$/u.test(secret))
      throw new CpuBridgeError("invalid_secret", "not_sent");
    if (!globalThis.crypto?.getRandomValues) throw new CpuBridgeError("random_unavailable", "not_sent");
    const nonce = globalThis.crypto.getRandomValues(new Uint8Array(32));
    const connectionId = Array.from(nonce, byte => byte.toString(16).padStart(2, "0")).join("");
    identity(connectionId);
    const connection: Connection = { endpoint, secret, connectionId, view: null };
    this.connection = connection; this.clearQueries(); this.observedOwner = null; const generation = ++this.generation;
    const { text } = await this.exchange(connection, "/v1/connect", {
      schema: REQUEST_SCHEMA, action: "connect", connection_id: connectionId,
    }, generation);
    try {
      const view = decodeCpuBridgeReply(text, { connectionId, bridgeSession: null, sequence: "0", previous: null,
        command: { text: "", operation: "discover_capabilities", body: { operation: "discover_capabilities" } } });
      requireValue(generation === this.generation && this.connection === connection);
      connection.view = view; return view;
    } catch (error) { connection.view = null; throw error; }
  }
  async command(text: string): Promise<CpuBridgeReply> {
    return this.sendCommand(text, null);
  }
  private async sendCommand(text: string, lease: object | null): Promise<CpuBridgeReply> {
    if (this.collectionLease !== lease) throw new CpuBridgeError("command_refused", "not_sent");
    if (!this.ready || !this.connection?.view) throw new CpuBridgeError("not_connected", "not_sent");
    const command = parseCpuCommand(text), previous = this.connection.view, connection = this.connection;
    const sequence = (BigInt(previous.sequence) + 1n).toString();
    if (BigInt(sequence) > BigInt(CPU_BRIDGE_LIMITS.maxSequence)) throw new CpuBridgeError("resource_limit", "not_sent");
    const observed = isCpuObservedCommand(command);
    if (observed) {
      try { requireObservedSelection(command, this.observedContext()); }
      catch { throw new CpuBridgeError("command_refused", "not_sent"); }
    }
    if (!observed && isCpuQueryOperation(command.operation)) {
      if (!this.checkpoint) throw new CpuBridgeError("command_refused", "not_sent");
      if (command.operation === "inspect_source_variables" && !this.sourceStack)
        throw new CpuBridgeError("command_refused", "not_sent");
      if (command.operation === "query_memory_accesses") {
        const allocation = row(row(command.body.filter).allocation);
        selectCpuInventory(this.inventory, wireInteger(allocation.ordinal).toString());
      }
    }
    if (command.operation === "step" || command.operation === "continue" || MUTATIONS.has(command.operation)) this.clearQueries();
    else this.collection = null;
    this.observedResult = null;
    if (!observed) this.clearObserved();
    const observedContext = this.observedContext();
    const queryContext = this.checkpoint ? { checkpoint: this.checkpoint, stack: this.sourceStack, inventory: this.inventory } : undefined;
    const generation = ++this.generation;
    connection.view = null;
    const result = await this.exchange(connection, "/v1/command", {
      schema: REQUEST_SCHEMA, action: "command", bridge_session: previous.bridgeSession,
      sequence, expected_revision: previous.session.revision, command: command.text,
    }, generation, command.text === "target" ? CPU_DECLARED_TARGET_BYTES : CPU_BRIDGE_LIMITS.responseBytes);
    try {
      const view = decodeCpuBridgeReply(result.text, { connectionId: connection.connectionId,
        bridgeSession: previous.bridgeSession, sequence, previous: previous.session, command, queryContext, observedContext });
      requireValue(generation === this.generation && this.connection === connection);
      connection.view = view;
      if (observed) {
        if (command.text === "runtime") {
          const owner = observedOwner(view); if (owner) this.observedOwner = owner;
          this.observedRuntime = view.response.status === "ok" ? view : null; this.observedInventory = null;
        } else if (view.response.status !== "ok") this.clearObserved();
        else if (command.text === "storage") this.observedInventory = view;
      }
      if (command.operation === "step") this.checkpoint = captureCpuCheckpoint(command, view, previous.session);
      if (this.checkpoint && command.operation === "inspect_stack") {
        this.sourceStack = null;
        if (view.response.status === "ok") {
          const pair = cpuQueryPair(command, view, previous.session, this.checkpoint);
          try { validateCpuStack(this.checkpoint, pair); this.sourceStack = pair; } catch { /* No partial frame authority. */ }
        }
      }
      if (!observed && this.checkpoint && command.operation === "query_allocations")
        this.inventory = cpuResourceProjection(this.checkpoint, cpuQueryPair(command, view, previous.session, this.checkpoint));
      return view;
    } catch (error) { connection.view = null; this.clearQueries(); this.observedOwner = null; throw error; }
  }
  async collectQueries(selection?: CpuLiveQuerySelection): Promise<CpuLiveQueryCollection> {
    if (this.collectionLease || !this.ready || !this.checkpoint)
      throw new CpuBridgeError("command_refused", "not_sent");
    // Reserve the closed profile maximum before any dispatch; no paging or fallback calls.
    const requiredCommands = selection === undefined ? 3 : 5;
    if (this.remainingCommands < requiredCommands) throw new CpuBridgeError("resource_limit", "not_sent");
    const checkpoint = this.checkpoint, lease = {};
    this.collectionLease = lease; this.collectionBytes = 0; this.collection = null; this.sourceStack = null; this.inventory = null;
    try {
      const result = await collectCpuQueries(checkpoint, selection, text => this.sendCommand(text, lease),
        () => this.collectionLease === lease && this.checkpoint === checkpoint, parseCpuCommand);
      requireValue(this.collectionLease === lease && this.checkpoint === checkpoint);
      this.collection = result; return result;
    } catch (error) { this.clearQueries(); throw error; }
    finally { if (this.collectionLease === lease) this.collectionLease = null; }
  }
  /** One explicit read; never appended to the six-call observation collector. */
  async inspectDeclaredTarget(collection: CpuObservedCollection): Promise<CpuBridgeReply> {
    if (this.collectionLease || !this.ready || !this.connection || this.observedResult !== collection)
      throw new CpuBridgeError("command_refused", "not_sent");
    const connection = this.connection;
    const reply = await this.command("target");
    try {
      requireValue(this.connection === connection && connection.view === reply && this.ready);
      if (reply.response.status === "ok") {
        joinDeclaredTarget(collection, reply);
        this.observedResult = collection;
      }
      return reply;
    } catch (error) { this.clearQueries(); throw error; }
  }
  async collectObserved(selection?: CpuObservedSelection): Promise<CpuObservedCollection> {
    if (this.collectionLease || !this.ready || !this.connection)
      throw new CpuBridgeError("command_refused", "not_sent");
    if (this.remainingCommands < (selection ? 6 : 4)) throw new CpuBridgeError("resource_limit", "not_sent");
    const connection = this.connection, lease = {};
    this.collectionLease = lease; this.collectionBytes = 0; this.collection = null; this.clearObserved();
    try {
      const result = await collectCpuObservedQueries(selection, text => this.sendCommand(text, lease),
        () => this.collectionLease === lease && this.connection === connection);
      requireValue(this.collectionLease === lease && this.connection === connection);
      this.observedResult = result; return result;
    } catch (error) { this.clearQueries(); throw error; }
    finally { if (this.collectionLease === lease) this.collectionLease = null; }
  }
  async disconnect(): Promise<void> {
    const connection = this.connection; this.invalidate();
    if (!connection) return;
    const generation = this.generation;
    const result = await this.exchange(connection, "/v1/disconnect", {
      schema: REQUEST_SCHEMA, action: "disconnect", connection_id: connection.connectionId,
    }, generation);
    try {
      const data = exact(parseProgramJson(result.text, CPU_BRIDGE_LIMITS.responseBytes), ["schema", "status", "connection_id", "closed"]);
      requireValue(data.schema === RESPONSE_SCHEMA && data.status === "disconnected" && data.closed === true &&
        data.connection_id === connection.connectionId && generation === this.generation);
      connection.secret = ""; if (this.connection === connection) this.connection = null;
    } catch { connection.view = null; invalid(); }
  }
  /** Closing this opt-in panel attempts only bounded cleanup of its captured handle. */
  dispose(): void { void this.disconnect().catch(() => {}); }
}
