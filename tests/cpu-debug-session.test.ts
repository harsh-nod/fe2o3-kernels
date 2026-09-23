// Pure/mock controls, not a live-process/socket or browser qualification.
import { webcrypto } from "node:crypto";
import { runInNewContext } from "node:vm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CpuBridgeError, CpuDebugSession, CPU_BRIDGE_LIMITS, cpuBridgeEndpoint, cpuDecimal,
  decodeCpuBridgeReply, parseCpuCommand, type CpuReplyExpectation } from "../src/lib/cpu-debug-session";
import { bridgeFailure, bridgeJson, jsonResponse, lossless, protocolReply, SyntheticCpuBridge,
  syntheticSession, SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET } from "./fixtures/cpu-debug-bridge";
const CONNECTION = "d".repeat(64), BRIDGE = "e".repeat(64);
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function discovery() {
  return bridgeJson(CONNECTION, BRIDGE, 0n, protocolReply(0n, "discover_capabilities", syntheticSession(), { result: "capabilities", capabilities: [] }));
}
const discoverExpected: CpuReplyExpectation = { connectionId: CONNECTION, bridgeSession: null, sequence: "0", previous: null,
  command: { text: "", operation: "discover_capabilities", body: { operation: "discover_capabilities" } } };
function mutate(raw: string, change: (data: Record<string, unknown>) => void): string {
  const data = JSON.parse(raw) as Record<string, unknown>; change(data); return JSON.stringify(data);
}
function mutateInner(raw: string, change: (data: Record<string, unknown>) => void): string {
  return mutate(raw, data => { const inner = JSON.parse(String(data.response_json)); change(inner); data.response_json = JSON.stringify(inner); });
}
describe("CPU loopback bridge transport and lossless correlation", () => {
  it("admits only canonical explicit IPv4 loopback endpoint and exact u64 decimal inputs", () => {
    expect(cpuBridgeEndpoint(SYNTHETIC_ENDPOINT)).toBe(SYNTHETIC_ENDPOINT);
    for (const endpoint of ["http://localhost:1", "https://127.0.0.1:1", "http://127.0.0.1", "http://127.0.0.1:01",
      "http://127.0.0.1:65536", "http://127.0.0.1:1/", "http://127.0.0.1:1?secret=a", "http://x@127.0.0.1:1",
      "http://127.1:1", "http://[::1]:1", " http://127.0.0.1:1"])
      expect(() => cpuBridgeEndpoint(endpoint)).toThrow();
    expect(() => cpuBridgeEndpoint([SYNTHETIC_ENDPOINT] as unknown as string)).toThrow();
    for (const value of ["0", "9007199254740993", "18446744073709551615"]) expect(cpuDecimal(value)).toBe(value);
    for (const value of ["01", "-1", "1e3", "1.0", "18446744073709551616", true, 1, ["1"]]) expect(() => cpuDecimal(value)).toThrow();
  });
  it("constructs the exact closed console subset without converting IDs through Number", () => {
    const rows = [
      ["state", "get_state"], ["stack", "inspect_stack"], ["step 64", "step"], ["reverse 1", "step"],
      ["continue 65536", "continue"], ["source 9007199254740993 2 3", "resolve_source"],
      ["memory 18446744073709551615 9007199254740993 0 4096", "read_memory"],
      ["break add 0 7 1 before", "set_breakpoints"], ["break list", "list_breakpoints"],
      ["break remove 9007199254740993", "remove_breakpoints"], ["watch add 1 0 0 4 atomic", "set_watchpoints"],
      ["watch list", "list_watchpoints"], ["watch remove 18446744073709551615", "remove_watchpoints"],
    ];
    for (const [text, operation] of rows) expect(parseCpuCommand(text).operation).toBe(operation);
    expect((parseCpuCommand("break remove 9007199254740993").body.breakpoint_ids as bigint[])[0]).toBe(9007199254740993n);
    for (const text of ["help", "quit", "eval x", "source /tmp/a", "state\nquit", "step 65", "reverse 0", "continue 65537",
      "memory 0 0 0 4", "memory 1 0 18446744073709551615 1", "watch add 1 0 0 4097 write",
      "watch add 1 0 0 4 execute", "break add 0 0 0 during", "break remove 01", "state;pwd", "stack extra"])
      expect(() => parseCpuCommand(text)).toThrow();
  });
  it("joins exact connect wrapper and frozen CPU-only session", () => {
    const result = decodeCpuBridgeReply(discovery(), discoverExpected);
    expect(result.session.revision).toBe("0"); expect(result.response.request_id).toBe(1);
    expect(Object.isFrozen(result)).toBe(true); expect(Object.isFrozen(result.session.cursor)).toBe(true);
    expect(result.responseJson.endsWith("\n")).toBe(false);
  });
  it("preserves high u64 revision/cursor fields in both response views and checks exact movement", () => {
    const previousWire = syntheticSession(9007199254740993n, 18446744073709551613n, "stopped");
    const previous = { ...previousWire, revision: "9007199254740993", cursor: {
      configuration_identity: "c".repeat(64), event_sequence: "18446744073709551613", state_revision: "9007199254740993",
    } } as CpuReplyExpectation["previous"];
    const raw = protocolReply(1n, "step", syntheticSession(9007199254740994n, 18446744073709551614n, "stopped"),
      { result: "control", events_advanced: 1n, snapshot: { status: "unavailable", reason: "not_captured" } });
    const text = bridgeJson(CONNECTION, BRIDGE, 1n, raw);
    const result = decodeCpuBridgeReply(text, { connectionId: CONNECTION, bridgeSession: BRIDGE, sequence: "1", previous, command: parseCpuCommand("step 1") });
    expect(result.session.revision).toBe("9007199254740994");
    expect(result.session.cursor.event_sequence).toBe("18446744073709551614");
    expect((result.response.session as Record<string, unknown>).revision).toBe(9007199254740994n);
  });
  it("accepts actual foreign-realm Uint8Array stream chunks without widening the byte contract", async () => {
    const bridge = new SyntheticCpuBridge(); let observed = 0;
    const client = new CpuDebugSession(async (url, init) => {
      const reply = await bridge.fetch(url, init);
      const bytes = runInNewContext("new Uint8Array(bytes)", {
        bytes: Array.from(new TextEncoder().encode(await reply.text())),
      }) as Uint8Array;
      expect(bytes instanceof Uint8Array).toBe(false);
      expect(ArrayBuffer.isView(bytes)).toBe(true); observed++;
      return new Response(new ReadableStream<Uint8Array>({
        start(controller) { controller.enqueue(bytes); controller.close(); },
      }), { status: reply.status, headers: reply.headers });
    });
    await client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET);
    await client.command("state"); expect(client.ready).toBe(true);
    await client.disconnect(); expect(client.needsCleanup).toBe(false);
    expect(observed).toBe(3);
  });
  it("refuses other byte views and spoofed Uint8Array tags before committing any response", async () => {
    const spoofed = new Uint16Array([123]);
    Object.defineProperty(spoofed, Symbol.toStringTag, { value: "Uint8Array" });
    const invalidChunks: unknown[] = [new DataView(new ArrayBuffer(4)), new Int8Array([123]),
      new Uint8ClampedArray([123]), new Uint16Array([123]), spoofed,
      { [Symbol.toStringTag]: "Uint8Array", byteLength: 1, 0: 123 }];
    for (const chunk of invalidChunks) {
      let signal: AbortSignal | undefined;
      const client = new CpuDebugSession(async (_url, init) => {
        signal = init.signal as AbortSignal;
        return new Response(new ReadableStream<Uint8Array>({
          start(controller) { controller.enqueue(chunk as Uint8Array); controller.close(); },
        }), { headers: { "Content-Type": "application/json" } });
      });
      await expect(client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET)).rejects.toMatchObject({ code: "invalid_response" });
      expect(signal?.aborted).toBe(true); expect(client.ready).toBe(false);
      expect(client.needsCleanup).toBe(true);
    }
  });
  it("rejects stale/cross-session/wrong-operation, false hardware and coerced enum envelopes", () => {
    const raw = discovery();
    const changes = [
      (v: Record<string, unknown>) => { v.connection_id = "f".repeat(64); },
      (v: Record<string, unknown>) => { v.sequence = "1"; },
      (v: Record<string, unknown>) => { v.closed = true; },
      (v: Record<string, unknown>) => { v.source_authentication = true; },
      (v: Record<string, unknown>) => { (v.session as Record<string, unknown>).revision = 0; },
      (v: Record<string, unknown>) => { (v.session as Record<string, unknown>).state = ["created"]; },
    ];
    for (const change of changes) expect(() => decodeCpuBridgeReply(mutate(raw, change), discoverExpected)).toThrow();
    for (const change of [
      (v: Record<string, unknown>) => { v.operation = "get_state"; },
      (v: Record<string, unknown>) => { v.request_id = 2; },
      (v: Record<string, unknown>) => { (v.session as Record<string, unknown>).hardware_observed = true; },
      (v: Record<string, unknown>) => { (v.session as Record<string, unknown>).state = ["created"]; },
    ]) expect(() => decodeCpuBridgeReply(mutateInner(raw, change), discoverExpected)).toThrow();
    expect(() => decodeCpuBridgeReply(raw.replace('"status":"ok"', '"status":"ok","status":"ok"'), discoverExpected)).toThrow();
  });
  it("supports one validated command at a time and keeps all commands/header secrets off URLs and bodies", async () => {
    const bridge = new SyntheticCpuBridge(), fetcher = vi.fn(bridge.fetch), client = new CpuDebugSession(fetcher);
    await client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET);
    await client.command("step 1"); await client.command("reverse 1"); await client.command("continue 4");
    await client.command("break add 0 1 2 before"); await client.command("break list"); await client.command("break remove 1");
    await client.command("watch add 1 0 0 4 write"); await client.command("watch list"); await client.command("watch remove 1");
    await client.command("source 0 1 2"); await client.command("stack"); await client.command("memory 1 0 0 4");
    bridge.refusal = true; const unavailable = await client.command("memory 1 0 0 4");
    expect(unavailable.response.status).toBe("unavailable"); expect(client.ready).toBe(true);
    for (const { url, init } of bridge.calls) {
      expect(url).not.toContain(SYNTHETIC_SECRET); expect(String(init.body)).not.toContain(SYNTHETIC_SECRET);
      expect(new Headers(init.headers).get("X-Fe2o3-Bridge-Token")).toBe(SYNTHETIC_SECRET);
      expect(init).toMatchObject({ credentials: "omit", redirect: "error", cache: "no-store", referrerPolicy: "no-referrer" });
    }
    await client.disconnect(); expect(client.needsCleanup).toBe(false);
    await client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET); expect(bridge.connections).toBe(2);
    expect(bridge.calls.filter(call => call.url.endsWith("/v1/connect"))[0].body.connection_id)
      .not.toBe(bridge.calls.filter(call => call.url.endsWith("/v1/connect"))[1].body.connection_id);
    await client.disconnect();
  });
  it("refuses a second in-flight command without sending or replacing the first request", async () => {
    const bridge = new SyntheticCpuBridge(); let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    const client = new CpuDebugSession(async (url, init) => {
      const response = await bridge.fetch(url, init);
      if (url.endsWith("/v1/command")) await held;
      return response;
    });
    await client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET);
    const pending = client.command("step 1");
    await expect(client.command("state")).rejects.toMatchObject({ code: "not_connected", outcome: "not_sent" });
    expect(bridge.calls.map(call => call.body.action)).toEqual(["connect", "command"]);
    expect(client.ready).toBe(false);
    release(); const reply = await pending;
    expect(reply.sequence).toBe("1"); expect(reply.session.revision).toBe("1"); expect(client.ready).toBe(true);
    await client.disconnect();
  });
  it("rejects enum-shape mutations in snapshot/memory availability and bridge errors", async () => {
    for (const command of ["state", "memory 1 0 0 4"]) {
      const bridge = new SyntheticCpuBridge();
      const client = new CpuDebugSession(async (url, init) => {
        const response = await bridge.fetch(url, init);
        if (!url.endsWith("/v1/command")) return response;
        return jsonResponse(mutateInner(await response.text(), raw => {
          const result = raw.result as Record<string, unknown>;
          const target = command === "state" ? result.snapshot : (result.memory as Record<string, unknown>).availability;
          (target as Record<string, unknown>).status = [(target as Record<string, unknown>).status];
        }));
      });
      await client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET);
      await expect(client.command(command)).rejects.toBeInstanceOf(CpuBridgeError); expect(client.ready).toBe(false);
      await client.disconnect();
    }
    const bridge = new SyntheticCpuBridge(), client = new CpuDebugSession(async (url, init) => {
      if (url.endsWith("/v1/command")) return jsonResponse(lossless({ schema: "fe2o3-cpu-debug-bridge-response-v1",
        status: "error", code: "backend_failed", outcome: ["unknown"], closed: true }), 500);
      return bridge.fetch(url, init);
    });
    await client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET);
    await expect(client.command("state")).rejects.toMatchObject({ code: "invalid_response", backendClosed: null });
    expect(client.needsCleanup).toBe(true); await client.disconnect();
  });
  it("aborts the exact fetch when invalid headers refuse before a body reader is acquired", async () => {
    const refusedHeaders: Record<string, string>[] = [{ "Content-Type": "text/plain" },
      { "Content-Length": String(CPU_BRIDGE_LIMITS.responseBytes + 1) }];
    for (const headers of refusedHeaders) {
      let signal: AbortSignal | undefined;
      const unread = new ReadableStream<Uint8Array>({ start() {} });
      const client = new CpuDebugSession(async (_url, init) => {
        signal = init.signal as AbortSignal;
        return new Response(unread, { headers: { "Content-Type": "application/json", ...headers } });
      });
      await expect(client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET)).rejects.toBeInstanceOf(CpuBridgeError);
      expect(signal?.aborted).toBe(true); expect(client.ready).toBe(false); expect(client.needsCleanup).toBe(true);
    }
  });
  it("bounds streamed bytes and refuses malformed UTF8 without committing state", async () => {
    for (const bytes of [new Uint8Array(CPU_BRIDGE_LIMITS.responseBytes + 1), new Uint8Array([0xff])]) {
      let signal: AbortSignal | undefined;
      const client = new CpuDebugSession(async (_url, init) => {
        signal = init.signal as AbortSignal; return new Response(bytes, { headers: { "Content-Type": "application/json" } });
      });
      await expect(client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET)).rejects.toBeInstanceOf(CpuBridgeError);
      expect(signal?.aborted).toBe(true); expect(client.ready).toBe(false);
    }
  });
  it("preserves captured cleanup credentials after lost connect/input replacement and discards late replies", async () => {
    const bridge = new SyntheticCpuBridge(); let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    const client = new CpuDebugSession(async (url, init) => {
      const response = await bridge.fetch(url, init); if (url.endsWith("/v1/connect")) await held; return response;
    });
    const pending = client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET); const rejected = expect(pending).rejects.toBeInstanceOf(CpuBridgeError);
    client.invalidate(); expect(client.ready).toBe(false);
    await client.disconnect(); release(); await rejected;
    expect(client.needsCleanup).toBe(false); expect(client.ready).toBe(false);
    const connect = bridge.calls[0], cleanup = bridge.calls[1];
    expect(cleanup.url).toBe(SYNTHETIC_ENDPOINT + "/v1/disconnect");
    expect(cleanup.body.connection_id).toBe(connect.body.connection_id);
    expect(new Headers(cleanup.init.headers).get("X-Fe2o3-Bridge-Token")).toBe(SYNTHETIC_SECRET);
  });
  it("times out even when a mock ignores abort, never retries, and retains cleanup handle", async () => {
    vi.useFakeTimers(); let signal: AbortSignal | undefined;
    const fetcher = vi.fn((_url: string, init: RequestInit) => { signal = init.signal as AbortSignal; return new Promise<Response>(() => {}); });
    const client = new CpuDebugSession(fetcher);
    const pending = client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET);
    const rejected = expect(pending).rejects.toMatchObject({ outcome: "unknown" });
    await vi.advanceTimersByTimeAsync(CPU_BRIDGE_LIMITS.timeoutMs); await rejected;
    expect(signal?.aborted).toBe(true); expect(fetcher).toHaveBeenCalledTimes(1);
    expect(client.needsCleanup).toBe(true); expect(client.ready).toBe(false);
    await expect(client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET)).rejects.toMatchObject({ code: "cleanup_required" });
  });
  it("rejects all-zero secret without transport and never renders a reflected secret", async () => {
    const fetcher = vi.fn(async () => jsonResponse("{}"));
    await expect(new CpuDebugSession(fetcher).connect(SYNTHETIC_ENDPOINT, "0".repeat(64))).rejects.toMatchObject({ code: "invalid_secret" });
    expect(fetcher).not.toHaveBeenCalled();
    const bridge = new SyntheticCpuBridge(), client = new CpuDebugSession(async (url, init) => {
      const response = await bridge.fetch(url, init);
      return jsonResponse(mutate(await response.text(), data => { data.secret_echo = SYNTHETIC_SECRET; }));
    });
    const failure = await client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET).catch(error => error as Error);
    expect(String(failure)).not.toContain(SYNTHETIC_SECRET); expect(client.ready).toBe(false);
  });
  it("checks source, stack and memory result bindings independently of envelope correlation", () => {
    const previous = decodeCpuBridgeReply(discovery(), discoverExpected).session;
    const anchor = { cursor: syntheticSession().cursor };
    const base = { result: "memory", snapshot: anchor, memory: {
      allocation: { ordinal: 1, generation: 0 }, byte_offset: 0, requested_bytes: 4, returned_bytes: 4,
      availability: { status: "captured", bytes: "0xa5a5a5a5", initialized: "0x0f" },
    } };
    const observe = (command: string, result: Record<string, unknown>) => {
      const request = parseCpuCommand(command);
      return decodeCpuBridgeReply(bridgeJson(CONNECTION, BRIDGE, 1n, protocolReply(1n, request.operation, syntheticSession(), result)),
        { connectionId: CONNECTION, bridgeSession: BRIDGE, sequence: "1", previous, command: request });
    };
    expect(observe("memory 1 0 0 4", base).response.status).toBe("ok");
    const changes = [
      (data: typeof base) => { data.memory.allocation.ordinal = 2; },
      (data: typeof base) => { data.memory.allocation.generation = 1; },
      (data: typeof base) => { data.memory.byte_offset = 1; },
      (data: typeof base) => { data.memory.requested_bytes = 5; },
      (data: typeof base) => { data.memory.returned_bytes = 5; },
      (data: typeof base) => { data.memory.availability.initialized = "0xff"; },
      (data: typeof base) => { data.memory.availability.bytes = "0xa5"; },
      (data: typeof base) => { data.memory.availability.status = "redacted"; data.memory.returned_bytes = 0; },
    ];
    for (const change of changes) {
      const data = JSON.parse(lossless(base)) as typeof base; change(data);
      expect(() => observe("memory 1 0 0 4", data)).toThrow();
    }
    expect(() => observe("stack", { result: "stack", snapshot: anchor, frames: Array.from({ length: 17 }, () => ({})) })).toThrow();
    expect(() => observe("stack", { result: "stack", snapshot: { cursor: syntheticSession(0n, 1n).cursor }, frames: [] })).toThrow();
    expect(() => observe("source 0 1 2", { result: "source", site: {
      kir: { function_ordinal: 1, block_ordinal: 1, point: { kind: "operation", operation_ordinal: 2 } },
    } })).toThrow();
  });
  it("rejects coherent read-only drift, wrong reverse movement and changing refusal state", () => {
    const previous = decodeCpuBridgeReply(discovery(), discoverExpected).session;
    const control = { result: "control", events_advanced: 1, snapshot: { status: "unavailable", reason: "not_captured" } };
    const cases = [
      { command: "state", raw: protocolReply(1n, "get_state", syntheticSession(1n), { result: "state",
        snapshot: { status: "unavailable", reason: "not_captured" } }) },
      { command: "reverse 1", raw: protocolReply(1n, "step", syntheticSession(1n, 1n, "stopped"), control) },
      { command: "step 1", raw: protocolReply(1n, "step", syntheticSession(1n, 1n, "stopped"), { ...control, events_advanced: 2 }) },
      { command: "state", raw: { schema: "fe2o3-debug-response-v1", status: "unavailable", request_id: 2,
        operation: "get_state", session: syntheticSession(), unavailable: { reason: "not_captured", state_changed: true } } },
    ];
    for (const item of cases) expect(() => decodeCpuBridgeReply(bridgeJson(CONNECTION, BRIDGE, 1n, item.raw),
      { connectionId: CONNECTION, bridgeSession: BRIDGE, sequence: "1", previous, command: parseCpuCommand(item.command) })).toThrow();
  });
  it("treats malformed cleanup as unknown, and confirmed closed errors never preserve live authority", async () => {
    const bridge = new SyntheticCpuBridge(), client = new CpuDebugSession(async (url, init) => {
      if (url.endsWith("/v1/disconnect")) return jsonResponse(lossless({ schema: "fe2o3-cpu-debug-bridge-response-v1",
        status: "disconnected", connection_id: "f".repeat(64), closed: true }));
      return bridge.fetch(url, init);
    });
    await client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET);
    await expect(client.disconnect()).rejects.toMatchObject({ outcome: "unknown" }); expect(client.needsCleanup).toBe(true);
    const closed = new CpuDebugSession(async () => bridgeFailure("backend_failed", "unknown", true));
    await expect(closed.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET)).rejects.toMatchObject({ backendClosed: true });
    expect(closed.needsCleanup).toBe(false); expect(closed.ready).toBe(false);
  });
});
