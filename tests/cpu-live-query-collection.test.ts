// Pure/mock controls only; no transport server, debugger, source export or hardware.
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CpuDebugSession, parseCpuCommand } from "../src/lib/cpu-debug-session";
import { CpuLiveQueryError, collectCpuQueries, normalizeCpuQuery, validateCpuQuerySelection, validateCpuStack,
  type CpuLiveQuerySelection } from "../src/lib/cpu-live-query-collection";
import { SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET, type MockRow } from "./fixtures/cpu-debug-bridge";
import { syntheticQueryBridge } from "./fixtures/cpu-live-query";
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const selected: CpuLiveQuerySelection = { ordinal: "1", generation: "0", byteOffset: "0", byteLength: "24" };
async function ready() {
  const mock = syntheticQueryBridge(), client = new CpuDebugSession(mock.fetch);
  await client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET);
  await client.command("step 1");
  expect(client.queryCheckpoint).not.toBeNull();
  return { mock, client };
}
async function paddedQueries(finalBytes: number, advertised: boolean) {
  const mock = syntheticQueryBridge();
  const client = new CpuDebugSession(async (url, init) => {
    const reply = await mock.fetch(url, init);
    const command = String((JSON.parse(String(init.body)) as MockRow).command ?? "");
    if (!["stack", "variables 1", "allocations"].includes(command)) return reply;
    const size = command === "allocations" ? finalBytes : 800 * 1024;
    const original = new TextEncoder().encode(await reply.text());
    if (original.byteLength > size) throw new Error("Synthetic padding size is too small.");
    const bytes = new Uint8Array(size); bytes.fill(32); bytes.set(original);
    // Legal trailing JSON whitespace changes received bytes, not any DTO or inner JSON.
    return new Response(new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.subarray(0, 16 * 1024));
        controller.enqueue(bytes.subarray(16 * 1024));
        controller.close();
      },
    }), { status: 200, headers: { "Content-Type": "application/json; charset=utf-8",
      ...(advertised ? { "Content-Length": String(size) } : {}) } });
  });
  await client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET);
  await client.command("step 1");
  return { client, mock };
}
describe("closed live CPU resource/source collection", () => {
  it("admits only the exact three additive spellings without caller anchors or cursors", () => {
    expect(parseCpuCommand("allocations").operation).toBe("query_allocations");
    expect(parseCpuCommand("accesses 18446744073709551615 0").operation).toBe("query_memory_accesses");
    expect(parseCpuCommand("variables 1").operation).toBe("inspect_source_variables");
    for (const text of [" allocations", "allocations ", "allocations all", "accesses 0 0", "accesses 01 0",
      "accesses 1 1", "accesses 1 00", "accesses 1 0 token", "accesses  1 0", "variables 2", "variables 01",
      "variables  1", "variables 1 next", "accesses 18446744073709551616 0"]) expect(() => parseCpuCommand(text)).toThrow();
    expect(parseCpuCommand("  state  ").operation).toBe("get_state"); // Existing grammar remains unchanged.
  });
  it("normalizes exact metadata only and never rounds a high u64", () => {
    expect(normalizeCpuQuery({ x: 9007199254740991n, bits: "0xffffffffffffffff" }))
      .toEqual({ x: 9007199254740991, bits: "0xffffffffffffffff" });
    for (const value of [9007199254740992n, -1n, 1.5, Number.POSITIVE_INFINITY])
      expect(() => normalizeCpuQuery({ value })).toThrow(CpuLiveQueryError);
  });
  it("does not offer queries before a successful captured operation-step", async () => {
    const mock = syntheticQueryBridge(), client = new CpuDebugSession(mock.fetch);
    await client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET);
    const before = mock.bridge.calls.length;
    await expect(client.command("allocations")).rejects.toThrow();
    await expect(client.collectQueries()).rejects.toThrow();
    expect(mock.bridge.calls).toHaveLength(before);
  });
  it("collects three distinct-schema replies without fabricated original JSONL metadata", async () => {
    const { client, mock } = await ready(), checkpoint = client.queryCheckpoint;
    const result = await client.collectQueries();
    expect(result.status).toBe("selection_required"); expect(result.selection).toBeNull();
    expect(result.replies.map(reply => reply.response.schema)).toEqual([
      "fe2o3-debug-response-v1", "fe2o3-debug-source-variable-response-v2", "fe2o3-debug-resource-response-v1"]);
    expect(result.source.status).toBe("ready"); expect(result.values.status).toBe("ready");
    expect(result.allocations?.status).toBe("ready"); expect(result.memory).toBeNull(); expect(result.accesses).toBeNull();
    expect(result.checkpoint).toBe(checkpoint);
    expect(mock.bridge.calls.slice(-3).map(call => call.body.command)).toEqual(["stack", "variables 1", "allocations"]);
    expect(Object.hasOwn(result.checkpoint.control, "requestUtf8")).toBe(false);
    expect(Object.hasOwn(result.checkpoint.control, "responseUtf8")).toBe(false);
    expect(result.responseBytes).toBe(result.replies.reduce((sum, reply) => sum + reply.responseBytes, 0));
    expect(Object.isFrozen(result)).toBe(true); expect(Object.isFrozen(result.checkpoint.anchor)).toBe(true);
  });
  it("collects exactly five calls and binds selected inventory/range before accesses and memory", async () => {
    const { client, mock } = await ready();
    const result = await client.collectQueries(selected);
    expect(result.status).toBe("complete"); expect(result.selection).toEqual(selected);
    expect(mock.bridge.calls.slice(-5).map(call => call.body.command)).toEqual([
      "stack", "variables 1", "allocations", "accesses 1 0", "memory 1 0 0 24"]);
    expect(result.allocationsInput?.expectedSnapshot).toEqual(result.checkpoint.anchor);
    expect(result.accessesInput?.expectedSnapshot).toEqual(result.checkpoint.anchor);
    expect(result.memoryInput?.expectedSnapshot).toEqual(result.checkpoint.anchor);
    expect(client.remainingCommands).toBe(248);
  });
  it("refuses an absent inventory choice or capacity overflow before an access/memory dispatch", async () => {
    for (const selection of [{ ...selected, ordinal: "2" }, { ...selected, byteOffset: "4" }]) {
      const { client, mock } = await ready();
      await expect(client.collectQueries(selection)).rejects.toThrow();
      expect(mock.bridge.calls.slice(-3).map(call => call.body.command)).toEqual(["stack", "variables 1", "allocations"]);
      expect(client.queryCollection).toBeNull(); expect(client.queryCheckpoint).toBeNull();
    }
  });
  it("rejects direct accesses without the current inventory and variables without a complete current stack", async () => {
    const { client, mock } = await ready(), before = mock.bridge.calls.length;
    await expect(client.command("accesses 1 0")).rejects.toThrow();
    await expect(client.command("variables 1")).rejects.toThrow();
    expect(mock.bridge.calls).toHaveLength(before);
  });
  it("requires one complete frame and does not equate next_operation with anchor operation", async () => {
    const { client, mock } = await ready();
    const result = await client.collectQueries();
    expect(result.stack).not.toBeNull();
    expect(() => validateCpuStack(result.checkpoint, result.stack!)).not.toThrow(); // next=1, anchor=0.
    const changed = structuredClone(result.stack!);
    ((changed.response as MockRow).result as MockRow).next_cursor = "not-followed";
    expect(() => validateCpuStack(result.checkpoint, changed)).toThrow();
    expect(mock.bridge.calls.filter(call => String(call.body.command).includes("cursor"))).toHaveLength(0);
  });
  it("preserves source-variable unavailable schema and continues only other current read-only queries", async () => {
    const { client, mock } = await ready();
    mock.change = (raw, command) => {
      if (command !== "variables 1") return;
      delete raw.snapshot; delete raw.values; raw.status = "unavailable"; raw.reason = "variables_not_captured";
    };
    const result = await client.collectQueries();
    expect(result.source.status).toBe("unavailable");
    expect(result.replies[1].response.schema).toBe("fe2o3-debug-source-variable-response-v2");
    expect(result.replies[1].response.reason).toBe("variables_not_captured");
    expect(Object.hasOwn(result.replies[1].response, "unavailable")).toBe(false);
    expect(result.allocations?.status).toBe("ready");
  });
  it("refuses a nonstring source-unavailability reason without coercion", async () => {
    for (const reason of [["variables_not_captured"], { reason: "variables_not_captured" }, true, 1, null]) {
      const { client, mock } = await ready();
      mock.change = (raw, command) => {
        if (command !== "variables 1") return;
        delete raw.snapshot; delete raw.values; raw.status = "unavailable"; raw.reason = reason;
      };
      await expect(client.collectQueries()).rejects.toThrow();
      expect(client.queryCollection).toBeNull(); expect(client.queryCheckpoint).toBeNull();
    }
  });
  it("preserves resource unavailable shape and never invents an inventory", async () => {
    const { client, mock } = await ready();
    mock.change = (raw, command) => {
      if (command !== "allocations") return;
      delete raw.snapshot; delete raw.page; delete raw.result; delete raw.physical_registers;
      raw.status = "unavailable"; raw.reason = "not_captured"; raw.required = "24"; raw.completeness = { status: "complete" };
    };
    const result = await client.collectQueries(selected);
    expect(result.status).toBe("unavailable"); expect(result.allocations?.status).toBe("unavailable");
    expect(result.replies).toHaveLength(3); expect(result.accesses).toBeNull(); expect(result.memory).toBeNull();
  });
  it("preserves a real-shaped ResourceV1 error without rewriting its schema or session", async () => {
    const { client, mock } = await ready();
    mock.change = (raw, command) => {
      if (command !== "allocations") return;
      delete raw.snapshot; delete raw.page; delete raw.result; delete raw.physical_registers;
      raw.status = "error"; raw.error = { stage: "backend", code: "backend_failure",
        message: "Synthetic resource refusal.", state_changed: false };
    };
    const result = await client.collectQueries(selected);
    expect(result.status).toBe("unavailable"); expect(result.allocations?.status).toBe("error");
    expect(result.replies).toHaveLength(3); expect(result.accesses).toBeNull(); expect(result.memory).toBeNull();
    expect(result.replies[2].response.schema).toBe("fe2o3-debug-resource-response-v1");
    expect(result.replies[2].response.error).toEqual({ stage: "backend", code: "backend_failure",
      message: "Synthetic resource refusal.", state_changed: false });
    expect(client.ready).toBe(true); expect(result.replies[2].sequence).toBe("4");
  });
  it("rejects invented ResourceV1 error enums before the unchanged permissive presentation guard", async () => {
    for (const altered of [{ stage: "invented", code: "backend_failure" },
      { stage: "backend", code: "invented" }]) {
      const { client, mock } = await ready();
      mock.change = (raw, command) => {
        if (command !== "allocations") return;
        delete raw.snapshot; delete raw.page; delete raw.result; delete raw.physical_registers;
        raw.status = "error"; raw.error = { ...altered, message: "Synthetic resource refusal.", state_changed: false };
      };
      await expect(client.collectQueries()).rejects.toThrow();
      expect(client.queryCollection).toBeNull(); expect(client.queryCheckpoint).toBeNull();
      expect(client.ready).toBe(false);
    }
  });
  it("accepts exact aggregate-limit outer JSON streamed through the actual client reader", async () => {
    const remaining = 2 * 1024 * 1024 - 2 * 800 * 1024;
    const { client, mock } = await paddedQueries(remaining, true);
    const result = await client.collectQueries();
    expect(result.status).toBe("selection_required");
    expect(result.replies.map(reply => reply.responseBytes)).toEqual([800 * 1024, 800 * 1024, remaining]);
    expect(result.responseBytes).toBe(2 * 1024 * 1024);
    expect(client.ready).toBe(true); expect(mock.bridge.calls).toHaveLength(5);
  });
  it("aborts the exact aggregate-overflow fetch at either headers or streamed chunks with no next call", async () => {
    for (const advertised of [true, false]) {
      // Each individual envelope is below1MiB, but the third exceeds the remaining total.
      const { client, mock } = await paddedQueries(512 * 1024, advertised);
      await expect(client.collectQueries()).rejects.toThrow();
      expect(mock.bridge.calls).toHaveLength(5);
      const finalCall = mock.bridge.calls.at(-1)!;
      expect(finalCall.body.command).toBe("allocations");
      expect(finalCall.init.signal?.aborted).toBe(true);
      expect(client.queryCollection).toBeNull(); expect(client.queryCheckpoint).toBeNull();
      expect(client.ready).toBe(false);
      expect(mock.bridge.calls.some(call => String(call.body.command).startsWith("accesses ") ||
        String(call.body.command).startsWith("memory "))).toBe(false);
    }
  });
  it("refuses changed schema/session/full snapshot and physical claims", async () => {
    const changes = [
      (raw: MockRow) => { raw.schema = "fe2o3-debug-response-v1"; },
      (raw: MockRow) => { (raw.session as MockRow).state = "running"; },
      (raw: MockRow) => { (raw.snapshot as MockRow).frame = 1; (raw.snapshot as MockRow).occurrence = 1; },
      (raw: MockRow) => { raw.physical_registers = "available"; },
    ];
    for (const change of changes) {
      const { client, mock } = await ready();
      mock.change = (raw, command) => { if (command === "allocations") change(raw); };
      await expect(client.collectQueries()).rejects.toThrow();
      expect(client.queryCheckpoint).toBeNull(); expect(client.queryCollection).toBeNull(); expect(client.ready).toBe(false);
    }
  });
  it("rejects a nonzero allocation generation rather than implying reuse", async () => {
    const { client, mock } = await ready();
    mock.change = (raw, command) => {
      if (command === "allocations") ((((raw.result as MockRow).allocations as MockRow[])[0]).allocation as MockRow).generation = 1;
    };
    await expect(client.collectQueries()).rejects.toThrow();
    expect(client.queryCollection).toBeNull();
  });
  it("retains partial inventory/access page markers without following any token", async () => {
    const { client, mock } = await ready();
    mock.change = (raw, command) => {
      if (command !== "allocations") return;
      Object.assign(raw.page as MockRow, { source_count: 2, scanned: 1, next_token: "opaque-not-requested" });
    };
    const result = await client.collectQueries();
    expect(result.allocations?.status === "ready" && result.allocations.hasMorePages).toBe(true);
    expect(result.replies).toHaveLength(3);
    expect(mock.bridge.calls.some(call => String(call.body.command).includes("opaque-not-requested"))).toBe(false);
  });
  it("refuses wrong explicit source frame refinement and keeps no earlier values", async () => {
    const { client, mock } = await ready();
    mock.change = (raw, command) => { if (command === "variables 1") (raw.snapshot as MockRow).occurrence = 2; };
    await expect(client.collectQueries()).rejects.toThrow();
    expect(client.queryCollection).toBeNull();
  });
  it("invalidates query data on filters, continued execution and input replacement", async () => {
    for (const command of ["break add 0 0 0", "watch add 1 0 0 4", "continue 1"]) {
      const { client } = await ready();
      await client.collectQueries(); await client.command(command);
      expect(client.queryCheckpoint).toBeNull(); expect(client.queryCollection).toBeNull();
    }
    const { client } = await ready();
    await client.collectQueries(); client.invalidate();
    expect(client.queryCheckpoint).toBeNull(); expect(client.queryCollection).toBeNull();
  });
  it("preflights the shared three/five-command reservation before any collection dispatch", async () => {
    const { client, mock } = await ready();
    for (let index = 0; index < 249; index++) await client.command("state");
    expect(client.remainingCommands).toBe(4);
    const before = mock.bridge.calls.length;
    await expect(client.collectQueries(selected)).rejects.toThrow();
    expect(mock.bridge.calls).toHaveLength(before);
    await client.command("state"); await client.command("state");
    expect(client.remainingCommands).toBe(2);
    const next = mock.bridge.calls.length;
    await expect(client.collectQueries()).rejects.toThrow();
    expect(mock.bridge.calls).toHaveLength(next);
  });
  it("locks other commands during collection and clears delayed results after invalidation", async () => {
    const { client, mock } = await ready();
    let release: (() => void) | undefined;
    mock.wait = command => command === "stack" ? new Promise<void>(resolve => { release = resolve; }) : Promise.resolve();
    const pending = client.collectQueries();
    await expect(client.command("step 1")).rejects.toThrow();
    client.invalidate(); release?.();
    await expect(pending).rejects.toThrow();
    expect(client.queryCollection).toBeNull(); expect(client.queryCheckpoint).toBeNull();
  });
  it("copies user selection synchronously and enforces exact safe selection ranges", async () => {
    for (const value of [{ ...selected, generation: "1" }, { ...selected, ordinal: "9007199254740992" },
      { ...selected, byteLength: "0" }, { ...selected, byteLength: "4097" }, { ...selected, byteOffset: "01" }])
      expect(() => validateCpuQuerySelection(value as CpuLiveQuerySelection)).toThrow();
    const { client } = await ready(), input = { ...selected };
    const pending = client.collectQueries(input); input.ordinal = "2";
    const result = await pending;
    expect(result.selection?.ordinal).toBe("1");
  });
  it("shows explicit unsupported source paging instead of following or fabricating a complete page", async () => {
    const { client, mock } = await ready();
    mock.change = (raw, command) => {
      if (command !== "variables 1") return;
      const first = (raw.values as MockRow[])[0];
      raw.values = Array.from({ length: 16 }, (_, index) => ({ ...first,
        variable_identity: (index + 1).toString(16).padStart(64, "0") }));
      raw.next_cursor = { query_identity: "9".repeat(64), position: 16 };
    };
    const result = await client.collectQueries();
    expect(result.source.status).toBe("unsupported"); expect(result.replies).toHaveLength(3);
    expect(result.replies[1].response.next_cursor).toEqual({ query_identity: "9".repeat(64), position: 16 });
  });
  it("does not dispatch variables from a partial stack but can still return the current inventory", async () => {
    const { client, mock } = await ready();
    mock.change = (raw, command) => {
      if (command === "stack") (raw.result as MockRow).next_cursor = { query_identity: "9".repeat(64), position: 1 };
    };
    const result = await client.collectQueries();
    expect(result.source.status).toBe("unavailable"); expect(result.stack).toBeNull();
    expect(result.replies).toHaveLength(2);
    expect(mock.bridge.calls.slice(-2).map(call => call.body.command)).toEqual(["stack", "allocations"]);
  });
  it("independently bounds total received outer response bytes in the pure collector", async () => {
    const { client } = await ready(), baseline = await client.collectQueries();
    for (const sizes of [[1024 * 1024, 1024 * 1024 - 1, 1], [1024 * 1024, 1024 * 1024, 1]]) {
      let index = 0;
      const collected = collectCpuQueries(baseline.checkpoint, undefined, async () => {
        const reply = baseline.replies[index];
        return { ...reply, responseBytes: sizes[index++] };
      }, () => true, parseCpuCommand);
      if (sizes[1] === 1024 * 1024) await expect(collected).rejects.toThrow();
      else expect((await collected).responseBytes).toBe(2 * 1024 * 1024);
    }
  });

});
