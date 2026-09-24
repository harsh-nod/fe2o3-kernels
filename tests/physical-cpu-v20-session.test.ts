// Pure transport/protocol controls. No bridge, compiler or GPU is launched.
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PhysicalCpuSessionV20 } from "../src/lib/physical-cpu-v20-session";
import { PHYSICAL_BRIDGE_V20, physicalCommandV20, PhysicalProtocolV20 } from "../src/lib/physical-cpu-v20-protocol";
import { CpuDebugSession } from "../src/lib/cpu-debug-session";
import { parseProgramJson } from "../src/content/ordered-program-observation.mjs";
import type { Row } from "../src/content/physical-entry-debug-v20-shapes";
import { PHYSICAL_SECRET as SECRET, PHYSICAL_URL as URL, SyntheticPhysicalBridgeV20, lossless, retainedPhysical } from "./fixtures/physical-cpu-v20";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function inner(row: Row, change: (value: Row) => void) {
  const value = parseProgramJson(String(row.response_json), 65536) as Row; change(value); row.response_json = lossless(value);
}
async function ready() {
  const bridge = new SyntheticPhysicalBridgeV20(), client = new PhysicalCpuSessionV20(bridge.fetch);
  await client.connect(URL, SECRET); await client.command("seek 2181"); return { bridge, client };
}
describe("explicit V20 physical CPU bridge", () => {
  it("has no legacy command/version fallback", () => {
    for (const text of ["step", "step 0", "step 65", "seek 8194", "seek 01", "values 65", "values 0",
      "source 0 0 0", "state\nstep", "state ", "continue 1", "memory 0 257", "memory 9007199254740991 1", "runtime"])
      expect(() => physicalCommandV20(text)).toThrow();
    expect(physicalCommandV20("step 64").body).toMatchObject({ granularity: "event", count: 64 });
    expect(physicalCommandV20("memory 0 256").body.allocation).toEqual({ ordinal: 1, generation: 0 });
  });
  it("connects only after an explicit action and joins actual retained checkpoint identities", async () => {
    const bridge = new SyntheticPhysicalBridgeV20(), client = new PhysicalCpuSessionV20(bridge.fetch);
    expect(bridge.calls).toHaveLength(0);
    const first = await client.connect(URL, SECRET);
    expect(first.operation).toBe("discover_capabilities"); expect(client.hasCheckpoint).toBe(false);
    const selected = await client.command("seek 2181");
    expect(selected.anchor?.activeMask).toBe(0xffff_ffff_ffff_ffffn);
    expect(selected.anchor?.lane).toBe(0); expect(client.hasCheckpoint).toBe(true);
    await client.disconnect(); expect(client.needsCleanup).toBe(false);
  });
  it("preserves not_represented SSA and revision-bound next pages", async () => {
    const { client } = await ready();
    const all = await client.command("values 64");
    expect(all.values?.some(row => row.status === "unavailable" || JSON.stringify(row).includes("not_represented"))).toBe(true);
    expect(client.hasNextPage).toBe(false);
    const first = await client.command("values 2"); expect(first.page).toEqual({ start: 0, next: 2 });
    const second = await client.command("values next"); expect(second.page).toEqual({ start: 2, next: 4 });
    await client.command("seek 2181"); expect(client.hasNextPage).toBe(false);
    await expect(client.command("values next")).rejects.toMatchObject({ outcome: "not_sent" });
    await client.disconnect();
  });
  it("keeps output bytes and their initialization bits, clears them on unavailable", async () => {
    const { client } = await ready(), memory = await client.command("memory 0 4");
    expect(memory.memory?.allocation).toBe(1); expect(memory.memory?.cells).toHaveLength(4);
    expect(memory.memory?.cells.every(cell => cell.initialized)).toBe(true);
    const unavailable = await client.command("memory 99999 4");
    expect(unavailable.status).toBe("unavailable"); expect(unavailable.memory).toBeNull();
    expect(client.hasCheckpoint).toBe(false); expect(client.ready).toBe(true);
    await client.disconnect();
  });
  it("counts no event for end-to-last and last-to-end sentinel transitions", async () => {
    const { client } = await ready();
    expect((await client.command("seek 2753")).anchor).toBeNull();
    expect((await client.command("reverse 1")).event).toBe(2752);
    expect((await client.command("step 1")).event).toBe(2753);
    expect((await client.command("step 64")).event).toBe(2753);
    expect((await client.command("seek 0")).state).toBe("created");
    await client.disconnect();
  });
  it("refuses unknown/stale/cross-connection outer and inner fields without retry", async () => {
    const changes: ((row: Row) => void)[] = [
      row => { row.schema = "fe2o3-cpu-debug-bridge-response-v1"; },
      row => { row.connection_id = "f".repeat(64); },
      row => { row.sequence = "99"; },
      row => { row.source_authority = true; },
      row => { (row.session as Row).revision = "99"; },
      row => inner(row, value => { (value.session as Row).hardware_observed = true; }),
      row => inner(row, value => { value.request_id = 999; }),
      row => inner(row, value => { value.operation = "inspect_stack"; }),
    ];
    for (const mutate of changes) {
      const { bridge, client } = await ready(); bridge.mutate = mutate;
      const before = bridge.calls.length;
      await expect(client.command("state")).rejects.toMatchObject({ outcome: "unknown" });
      expect(client.ready).toBe(false); expect(client.needsCleanup).toBe(true); expect(bridge.calls).toHaveLength(before + 1);
      await expect(client.command("state")).rejects.toMatchObject({ outcome: "not_sent" });
      expect(bridge.calls).toHaveLength(before + 1);
      bridge.mutate = null; await client.disconnect();
    }
  });
  it("old client rejects the new outer schema and new client rejects old outer", async () => {
    const bridge = new SyntheticPhysicalBridgeV20();
    const old = new CpuDebugSession(async (url, init) => bridge.fetch(url, { ...init,
      body: JSON.stringify({ ...JSON.parse(String(init.body)), schema: PHYSICAL_BRIDGE_V20 }) }));
    await expect(old.connect(URL, SECRET)).rejects.toBeDefined(); expect(old.ready).toBe(false);
    const foreign = new SyntheticPhysicalBridgeV20(); foreign.mutate = row => { row.schema = "fe2o3-cpu-debug-bridge-response-v1"; };
    await expect(new PhysicalCpuSessionV20(foreign.fetch).connect(URL, SECRET)).rejects.toBeDefined();
  });
  it("refuses corrupt symbolic, pointer, duplicate SSA or page identities", async () => {
    for (const kind of ["symbolic", "allocation", "duplicate", "page"]) {
      const { bridge, client } = await ready();
      bridge.mutate = row => inner(row, value => {
        const result = value.result as Row, rows = result.values as Row[];
        if (kind === "symbolic") (rows.find(r => (r.availability as Row).status === "unavailable")!.availability as Row).bits = "0x00";
        else if (kind === "allocation") (((rows[0].availability as Row).value as Row).allocation as Row).ordinal = 2;
        else if (kind === "duplicate") rows[1].path = rows[0].path;
        else result.next_cursor = { query_identity: "f".repeat(64), position: rows.length };
      });
      await expect(client.command("values 64")).rejects.toBeDefined(); expect(client.hasCheckpoint).toBe(false);
    }
  });
  it("refuses wrong memory identity, init padding and same-cursor wrong scope", async () => {
    for (const kind of ["allocation", "padding", "scope"]) {
      const { bridge, client } = await ready();
      bridge.mutate = row => inner(row, value => {
        const result = value.result as Row, memory = result.memory as Row;
        if (kind === "allocation") (memory.allocation as Row).ordinal = 2;
        else if (kind === "padding") (memory.availability as Row).initialized = "0xff";
        else ((result.snapshot as Row).scope as Row).lane = 1;
      });
      await expect(client.command("memory 0 4")).rejects.toBeDefined();
    }
  });
  it("keeps secrets off URLs/bodies and uses credential-free nonredirecting HTTP", async () => {
    const { bridge, client } = await ready(); await client.command("state"); await client.disconnect();
    for (const call of bridge.calls) {
      expect(call.url).not.toContain(SECRET); expect(String(call.init.body)).not.toContain(SECRET);
      expect(new Headers(call.init.headers).get("X-Fe2o3-Bridge-Token")).toBe(SECRET);
      expect(call.init).toMatchObject({ credentials: "omit", redirect: "error", cache: "no-store", referrerPolicy: "no-referrer" });
    }
  });
  it("refuses invalid local inputs before fetch", async () => {
    const fetcher = vi.fn(); const client = new PhysicalCpuSessionV20(fetcher);
    for (const url of ["http://localhost:1", "http://127.0.0.1:01", "http://127.0.0.1:65536", URL + "/", "https://127.0.0.1:1"])
      await expect(client.connect(url, SECRET)).rejects.toMatchObject({ outcome: "not_sent" });
    await expect(client.connect(URL, "0".repeat(64))).rejects.toMatchObject({ outcome: "not_sent" });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("refuses exact/late monotonic completion, including blocked timer delivery", async () => {
    for (const elapsed of [35_000, 35_001]) {
      const bridge = new SyntheticPhysicalBridgeV20(); let now = 0;
      const client = new PhysicalCpuSessionV20(async (url, init) => { const response = await bridge.fetch(url, init); now = elapsed; return response; }, () => now);
      await expect(client.connect(URL, SECRET)).rejects.toMatchObject({ outcome: "unknown" });
      expect(bridge.calls).toHaveLength(1); expect(client.ready).toBe(false);
    }
    const bridge = new SyntheticPhysicalBridgeV20(); let now = 0;
    const client = new PhysicalCpuSessionV20(async (url, init) => { const response = await bridge.fetch(url, init); now = 34_999; return response; }, () => now);
    await client.connect(URL, SECRET); expect(client.ready).toBe(true);
  });
  it("aborts a hung read and retains only captured cleanup credentials after input replacement", async () => {
    let captured: AbortSignal | null = null;
    const fetcher = vi.fn(async (_url: string, init: RequestInit) => {
      captured = init.signal as AbortSignal; return new Promise<Response>(() => {});
    });
    const client = new PhysicalCpuSessionV20(fetcher), pending = client.connect(URL, SECRET);
    client.invalidate();
    await expect(pending).rejects.toMatchObject({ outcome: "unknown" });
    expect((captured as AbortSignal | null)?.aborted).toBe(true); expect(client.ready).toBe(false);
    expect(client.needsCleanup).toBe(true); expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("rejects oversized advertised/body data and invalid UTF-8", async () => {
    const responses = [
      () => new Response("{}", { headers: { "Content-Type": "application/json", "Content-Length": "131073" } }),
      () => new Response("x".repeat(131073), { headers: { "Content-Type": "application/json" } }),
      () => new Response(new Uint8Array([255]), { headers: { "Content-Type": "application/json" } }),
    ];
    for (const response of responses) await expect(new PhysicalCpuSessionV20(async () => response()).connect(URL, SECRET)).rejects.toBeDefined();
  });
  it("includes protocol projection in the monotonic deadline, not only stream receipt", async () => {
    const bridge = new SyntheticPhysicalBridgeV20(); let reads = 0;
    const client = new PhysicalCpuSessionV20(bridge.fetch, () => ++reads < 4 ? 0 : 35_000);
    await expect(client.connect(URL, SECRET)).rejects.toMatchObject({ outcome: "unknown" });
    expect(client.ready).toBe(false); expect(bridge.calls).toHaveLength(1);
  });
  it("refuses a second pending command and never dispatches a retry", async () => {
    const bridge = new SyntheticPhysicalBridgeV20(); let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    const client = new PhysicalCpuSessionV20(async (url, init) => {
      const response = await bridge.fetch(url, init); if (url.endsWith("/v1/command")) await held; return response;
    });
    await client.connect(URL, SECRET);
    const pending = client.command("state");
    await expect(client.command("state")).rejects.toMatchObject({ outcome: "not_sent" });
    expect(bridge.calls).toHaveLength(2); release(); await pending;
    await client.disconnect();
  });
  it("enforces cumulative command cap without increasing legacy budgets", async () => {
    const protocol = new PhysicalProtocolV20();
    protocol.prepare(null); await protocol.accept(lossless(retainedPhysical("capabilities")));
    protocol.sent = 255;
    expect(() => protocol.prepare(physicalCommandV20("state"))).toThrow();
  });
});
