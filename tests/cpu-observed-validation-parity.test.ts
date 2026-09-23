// Synthetic validator parity tests, not source execution or allocator evidence.
import { describe, expect, it } from "vitest";
import { CpuDebugSession } from "../src/lib/cpu-debug-session";
import { SyntheticObservedBridge, observedInvocation } from "./fixtures/cpu-observed-bridge";
import { SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET, type MockRow } from "./fixtures/cpu-debug-bridge";

async function connected() {
  const bridge = new SyntheticObservedBridge(), client = new CpuDebugSession(bridge.fetch);
  await client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET); await client.command("step 1");
  return { bridge, client };
}
const selection = { allocation: "3", storageSlot: "2", generation: "2", byteOffset: "0", byteLength: "4" };
function access(): MockRow {
  return { allocation: { allocation: "3", storage_slot: "2", generation: "2" },
    range: { byte_offset: "0", byte_len: "4" }, address_space: "private", access: "read",
    invocation: observedInvocation(),
    occurrence: { record_ordinal: 0, event_sequence: 1,
      scope: { level: "lane", workgroup: [0, 0, 0], wave: 0, lane: 0, logical_workitem: [0, 0, 0],
        active_mask: 1n, wave_width: 64, interpretation: "logical_visualization" },
      site: { function_ordinal: 1, block_ordinal: 0, point: { kind: "operation", operation_ordinal: 3 } },
      schedule: { identity: "workgroup_major_local_zyx_serial_v1", decision_ordinal: 0 } },
    origin: { availability: "available", identity: { activation: "9", attempt: "2",
      site: { function_ordinal: "1", block: 7, operation: 3 } } } };
}
function transitions(row: MockRow): MockRow[] { return (row.result as MockRow).transitions as MockRow[]; }
function descriptor(row: MockRow): MockRow { return row.descriptor as MockRow; }
function identity(row: MockRow): MockRow { return descriptor(row).identity as MockRow; }

describe("observed validator parity with the owned bridge", () => {
  it("requires identical capture completeness for every resource status", async () => {
    for (const unavailable of [false, true]) {
      const { bridge, client } = await connected(); bridge.memoryWatch = unavailable;
      bridge.mutate = (text, row) => {
        if (text === "storage") row.completeness = { status: "truncated", reason: "event_limit", emitted_events: 1 };
      };
      await expect(client.collectObserved()).rejects.toMatchObject({ outcome: "unknown" });
      expect(client.ready).toBe(false); expect(client.observationCollection).toBeNull();
    }
  });
  it("rejects impossible lifecycle histories rather than validating transitions independently", async () => {
    const mutations: ((rows: MockRow[]) => void)[] = [
      rows => { rows[2].descriptor = { ...descriptor(rows[2]), byte_len: "8" }; },
      rows => { rows[2].descriptor = rows[0].descriptor; },
      rows => { identity(rows[3]).generation = "4"; },
      rows => { descriptor(rows[3]).byte_len = "8"; },
      rows => { descriptor(rows[3]).alignment = 8; },
      rows => { identity(rows[3]).allocation = "2"; },
      rows => { identity(rows[3]).storage_slot = "1"; },
      rows => { identity(rows[3]).generation = "1"; rows[3].kind = { transition: "create" }; },
      rows => { rows[3].kind = { transition: "create", previous_allocation: "1" }; },
    ];
    for (const mutate of mutations) {
      const { bridge, client } = await connected();
      bridge.mutate = (text, row) => { if (text === "lifecycle") mutate(transitions(row)); };
      await expect(client.collectObserved()).rejects.toMatchObject({ outcome: "unknown" });
      expect(client.observationCollection).toBeNull();
      expect(bridge.commands.at(-1)).toBe("lifecycle");
    }
  });
  it("accepts an actual-shaped access row and joins its range and space to the inventory", async () => {
    const { bridge, client } = await connected();
    bridge.mutate = (text, row) => {
      if (text.startsWith("storageaccess ")) (row.result as MockRow).accesses = [access()];
    };
    const result = await client.collectObserved(selection);
    expect((result.accesses?.response.result as MockRow).accesses).toHaveLength(1);
    expect(bridge.commands.slice(-6)).toEqual(["state", "runtime", "lifecycle", "storage",
      "storageaccess 3 2 2", "storagememory 3 2 2 0 4"]);
  });
  it("rejects inventory-incompatible memory and access replies", async () => {
    const changes: [string, (row: MockRow) => void][] = [
      ["storageaccess", row => { row.address_space = "global"; }],
      ["storageaccess", row => { row.range = { byte_offset: "3", byte_len: "2" }; }],
      ["storagememory", row => { row.address_space = "global"; }],
      ["storagememory", row => { row.address_space = "generic"; }],
    ];
    for (const [command, mutate] of changes) {
      const { bridge, client } = await connected();
      bridge.mutate = (text, row) => {
        if (!text.startsWith(command + " ")) return;
        if (command === "storageaccess") { const entry = access(); mutate(entry); (row.result as MockRow).accesses = [entry]; }
        else mutate((row.result as MockRow).memory as MockRow);
      };
      await expect(client.collectObserved(selection)).rejects.toMatchObject({ outcome: "unknown" });
      expect(client.ready).toBe(false); expect(client.observationCollection).toBeNull();
    }
  });
  it("refuses memory before dispatch when the current inventory has no captured bytes", async () => {
    const { bridge, client } = await connected();
    bridge.mutate = (text, row) => {
      if (text !== "storage") return;
      for (const entry of (row.result as MockRow).allocations as MockRow[]) {
        entry.snapshot_bytes_available = false; entry.initialization_available = false;
      }
    };
    await client.collectObserved(); const before = bridge.commands.length;
    await expect(client.command("storagememory 3 2 2 0 4")).rejects.toMatchObject({ outcome: "not_sent" });
    expect(bridge.commands).toHaveLength(before); expect(client.ready).toBe(true);
  });
  it("does not follow either lifecycle or inventory continuation tokens", async () => {
    const { bridge, client } = await connected();
    bridge.mutate = (text, row) => {
      if (text === "runtime") (row.allocation_watermark as MockRow).through_sequence = "100";
      if (text === "lifecycle" || text === "storage") {
        row.through_sequence = "100";
        const page = row.page as MockRow; page.source_count = "100"; page.next_token = "opaque_never_followed";
      }
    };
    const result = await client.collectObserved();
    expect(result.replies).toHaveLength(4);
    expect(bridge.commands.slice(-4)).toEqual(["state", "runtime", "lifecycle", "storage"]);
  });
});
