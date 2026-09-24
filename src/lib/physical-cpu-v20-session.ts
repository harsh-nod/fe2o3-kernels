/** Explicit local V20 transport. An unknown outcome is cleanup-only, never retried. */
import { digest, need, object, same, type PhysicalObservationV20, type Row } from "../content/physical-entry-debug-v20-shapes";
import { PHYSICAL_BRIDGE_V20, PHYSICAL_LIVE_LIMITS_V20 as LIMIT, PhysicalProtocolV20,
  outerSessionV20, physicalCommandV20, physicalOuterV20 } from "./physical-cpu-v20-protocol";

export class PhysicalBridgeErrorV20 extends Error {
  constructor(readonly outcome: "not_sent" | "unknown", readonly closed: boolean | null = null) {
    super(outcome === "unknown" ? "V20 query outcome unknown. Values cleared; do not retry. Disconnect before reconnecting."
      : "V20 request refused. Values cleared; no new observation is displayed.");
    this.name = "PhysicalBridgeErrorV20";
  }
}
export type PhysicalFetchV20 = (input: string, init: RequestInit) => Promise<Response>;
interface Connection { endpoint: string; secret: string; nonce: string; bridge: string | null; ready: boolean }
const CODES = ["invalid_request", "authentication_failed", "session_exists", "session_unavailable",
  "stale_session", "stale_sequence", "stale_revision", "command_refused", "resource_limit", "backend_failed", "cleanup_failed"];
const typedArrayKind = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), Symbol.toStringTag)?.get;
function byteChunk(value: unknown): value is Uint8Array {
  return ArrayBuffer.isView(value) && typedArrayKind?.call(value) === "Uint8Array";
}
function endpoint(value: string): void {
  const match = /^http:\/\/127\.0\.0\.1:([1-9][0-9]{0,4})$/u.exec(value);
  need(match && Number(match[1]) <= 65535, "Explicit loopback endpoint required.");
}
async function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) throw new PhysicalBridgeErrorV20("unknown");
  let cancel: (() => void) | undefined;
  const stopped = new Promise<never>((_, reject) => {
    cancel = () => reject(new PhysicalBridgeErrorV20("unknown"));
    signal.addEventListener("abort", cancel, { once: true });
  });
  try { return await Promise.race([promise, stopped]); }
  finally { if (cancel) signal.removeEventListener("abort", cancel); }
}
async function read(response: Response, signal: AbortSignal): Promise<string> {
  need(!response.redirected && response.type !== "opaque" && response.type !== "opaqueredirect" &&
    /^application\/json(?:;\s*charset=utf-8)?$/iu.test(response.headers.get("content-type") ?? ""), "Closed HTTP response.");
  const advertised = response.headers.get("content-length");
  need(advertised === null || (/^(?:0|[1-9][0-9]*)$/u.test(advertised) && BigInt(advertised) <= BigInt(LIMIT.responseBytes)),
    "Advertised response cap.");
  need(response.body, "Response stream required.");
  const reader = response.body.getReader(), chunks: Uint8Array[] = []; let total = 0, count = 0;
  try {
    for (;;) {
      const next = await abortable(reader.read(), signal);
      if (next.done) break;
      need(byteChunk(next.value) && ++count <= LIMIT.chunks, "Bounded byte stream required.");
      total += next.value.byteLength; need(total <= LIMIT.responseBytes, "Response byte cap.");
      chunks.push(next.value.slice());
    }
    need(total > 0 && (advertised === null || BigInt(advertised) === BigInt(total)), "Response length mismatch.");
    const bytes = new Uint8Array(total); let at = 0;
    for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.length; }
    need(!(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf), "BOM refused.");
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } finally { void reader.cancel().catch(() => {}); reader.releaseLock(); }
}
export class PhysicalCpuSessionV20 {
  private connection: Connection | null = null;
  private protocol = new PhysicalProtocolV20();
  private pending: AbortController | null = null;
  private generation = 0;
  constructor(private readonly fetcher: PhysicalFetchV20 = (input, init) => globalThis.fetch(input, init),
    private readonly clock: () => number = () => performance.now()) {}
  get ready(): boolean { return this.connection?.ready === true && this.pending === null; }
  get needsCleanup(): boolean { return this.connection !== null; }
  get hasCheckpoint(): boolean { return this.ready && this.protocol.hasCheckpoint; }
  get hasNextPage(): boolean { return this.ready && this.protocol.hasNextPage; }
  get remaining(): number { return this.ready ? Math.max(0, LIMIT.commands - this.protocol.sent) : 0; }
  invalidate(): void {
    this.generation++; this.pending?.abort(); this.pending = null; this.protocol.clear();
    if (this.connection) this.connection.ready = false;
  }
  private async exchange<T>(connection: Connection, route: string, body: Row,
    receive: (row: Row) => Promise<T>): Promise<T> {
    need(this.pending === null, "Only one request at a time.");
    const generation = ++this.generation, aborter = new AbortController(), started = this.clock();
    this.pending = aborter;
    const check = () => { const now = this.clock(); need(Number.isFinite(started) && Number.isFinite(now) &&
      now >= started && now - started < LIMIT.timeoutMs && generation === this.generation && !aborter.signal.aborted,
      "Expired or replaced V20 observation."); };
    const timer = setTimeout(() => aborter.abort(), LIMIT.timeoutMs);
    try {
      const raw = JSON.stringify(body); need(new TextEncoder().encode(raw).byteLength <= LIMIT.requestBytes, "Request cap.");
      const response = await abortable(this.fetcher(connection.endpoint + route, {
        method: "POST", mode: "cors", credentials: "omit", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer",
        headers: { "Content-Type": "application/json", "X-Fe2o3-Bridge-Token": connection.secret }, body: raw, signal: aborter.signal,
      }), aborter.signal);
      check(); const text = await read(response, aborter.signal); check();
      need(!text.includes(connection.secret), "Secret echo refused.");
      const row = physicalOuterV20(text);
      if (row.status === "error") {
        object(row, ["schema", "status", "code", "outcome", "closed"]);
        need(!response.ok && CODES.includes(String(row.code)) && (row.outcome === "not_sent" || row.outcome === "unknown")
          && typeof row.closed === "boolean", "Closed V20 error.");
        throw new PhysicalBridgeErrorV20(row.outcome, row.closed);
      }
      need(response.ok && response.status === 200, "Expected successful bounded HTTP reply.");
      const result = await receive(row); check();
      need(this.connection === connection, "Replaced V20 connection.");
      connection.ready = route !== "/v1/disconnect";
      return result;
    } catch (error) {
      aborter.abort();
      if (generation === this.generation) {
        connection.ready = false; this.protocol.clear();
        if (error instanceof PhysicalBridgeErrorV20 && error.closed === true) {
          connection.secret = ""; if (this.connection === connection) this.connection = null;
        }
      }
      throw error instanceof PhysicalBridgeErrorV20 ? error : new PhysicalBridgeErrorV20("unknown");
    } finally { clearTimeout(timer); if (this.pending === aborter) this.pending = null; }
  }
  private async observed(row: Row, connection: Connection, request: Row): Promise<PhysicalObservationV20> {
    object(row, ["schema", "status", "connection_id", "bridge_session", "sequence", "session", "response_json", "closed"]);
    same(row.status, "ok"); same(row.closed, false); same(row.connection_id, connection.nonce);
    digest(row.bridge_session); if (connection.bridge !== null) same(row.bridge_session, connection.bridge);
    same(row.sequence, String(Number(request.request_id) - 1));
    need(typeof row.response_json === "string", "Inner CLI response required.");
    const protocol = this.protocol;
    const observation = await protocol.accept(row.response_json);
    need(this.protocol === protocol && this.connection === connection && protocol.view, "Current accepted inner owner required.");
    outerSessionV20(row.session, protocol.view);
    connection.bridge = row.bridge_session as string;
    return observation;
  }
  async connect(url: string, secret: string): Promise<PhysicalObservationV20> {
    if (this.needsCleanup) throw new PhysicalBridgeErrorV20("not_sent");
    try { endpoint(url); digest(secret); need(globalThis.crypto?.getRandomValues, "Randomness required."); }
    catch { throw new PhysicalBridgeErrorV20("not_sent"); }
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(32)), x => x.toString(16).padStart(2, "0")).join("");
    digest(nonce); const connection: Connection = { endpoint: url, secret, nonce, bridge: null, ready: false };
    this.connection = connection; this.protocol = new PhysicalProtocolV20();
    const request = this.protocol.prepare(null);
    const result = await this.exchange(connection, "/v1/connect", {
      schema: PHYSICAL_BRIDGE_V20, action: "connect", connection_id: nonce,
    }, row => this.observed(row, connection, request));
    return result;
  }
  async command(text: string): Promise<PhysicalObservationV20> {
    if (!this.ready || !this.connection || !this.protocol.view) throw new PhysicalBridgeErrorV20("not_sent");
    let request: Row;
    try { request = this.protocol.prepare(physicalCommandV20(text)); }
    catch { throw new PhysicalBridgeErrorV20("not_sent"); }
    const connection = this.connection; connection.ready = false;
    const result = await this.exchange(connection, "/v1/command", {
      schema: PHYSICAL_BRIDGE_V20, action: "command", bridge_session: connection.bridge,
      sequence: String(Number(request.request_id) - 1), expected_revision: String(request.expected_revision), command: text,
    }, row => this.observed(row, connection, request));
    return result;
  }
  async disconnect(): Promise<void> {
    const connection = this.connection; this.invalidate(); if (!connection) return;
    await this.exchange(connection, "/v1/disconnect", {
      schema: PHYSICAL_BRIDGE_V20, action: "disconnect", connection_id: connection.nonce,
    }, async row => {
      object(row, ["schema", "status", "connection_id", "closed"]);
      same(row.status, "disconnected"); same(row.connection_id, connection.nonce); same(row.closed, true);
    });
    connection.secret = ""; if (this.connection === connection) this.connection = null;
  }
  dispose(): void { void this.disconnect().catch(() => {}); }
}
