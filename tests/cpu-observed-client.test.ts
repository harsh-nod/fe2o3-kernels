// Synthetic strict-contract/client controls; not ordinary-source execution evidence.
import { describe, expect, it } from "vitest";
import { CpuDebugSession, parseCpuCommand } from "../src/lib/cpu-debug-session";
import { stable } from "../src/lib/cpu-observed-validation";
import { SyntheticObservedBridge } from "./fixtures/cpu-observed-bridge";
import { SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET, type MockRow } from "./fixtures/cpu-debug-bridge";

export async function observedClient() {
  const bridge = new SyntheticObservedBridge(), client = new CpuDebugSession(bridge.fetch);
  await client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET); await client.command("step 1");
  return { bridge, client };
}
describe("closed observed CPU client", () => {
  it("accepts only bounded canonical closed observed commands", () => {
    expect(parseCpuCommand("runtime").operation).toBe("inspect_current_record");
    expect(parseCpuCommand("storage").operation).toBe("query_allocations");
    expect(parseCpuCommand("storagememory 3 2 2 0 4").body.allocation).toEqual({ allocation: "3", storage_slot: "2", generation: "2" });
    for (const text of ["storage all", "runtime ", "storageaccess 3 0 2", "storageaccess 03 2 2",
      "storagememory 3 2 2 0 4097", "storagememory 3 2 2 18446744073709551615 2"])
      expect(() => parseCpuCommand(text)).toThrow();
  });
  it("collects four actual typed mock replies without paging and keeps independent coverages", async () => {
    const { bridge, client } = await observedClient();
    const result = await client.collectObserved();
    expect(bridge.commands.slice(-4)).toEqual(["state", "runtime", "lifecycle", "storage"]);
    expect(result.replies).toHaveLength(4); expect(result.frames).toHaveLength(2); expect(result.allocations).toHaveLength(1);
    expect(client.observationCollection).toBe(result); expect(result.responseBytes).toBeGreaterThan(0);
    expect(result.runtime.response.origin_coverage).toEqual({ coverage: "complete" });
    expect(result.runtime.response.completeness).toEqual({ status: "complete" });
  });
  it("rechecks the exact triple before requesting access and initialized bytes", async () => {
    const { bridge, client } = await observedClient();
    const result = await client.collectObserved({ allocation: "3", storageSlot: "2", generation: "2", byteOffset: "0", byteLength: "4" });
    expect(bridge.commands.slice(-6)).toEqual(["state", "runtime", "lifecycle", "storage", "storageaccess 3 2 2", "storagememory 3 2 2 0 4"]);
    const memory = (result.memory?.response.result as MockRow).memory as MockRow;
    expect(memory.bytes).toBe("0x12121212"); expect(memory.initialized).toBe("0x0f");
    const before = bridge.commands.length;
    await expect(client.command("storagememory 3 2 1 0 4")).rejects.toMatchObject({ outcome: "not_sent" });
    expect(bridge.commands).toHaveLength(before);
  });
  it("clears runtime and inventory on control/filter changes but rejects an owner rebind", async () => {
    const { bridge, client } = await observedClient(); await client.collectObserved();
    await client.command("step 1"); expect(client.observationCollection).toBeNull();
    await expect(client.command("storage")).rejects.toMatchObject({ outcome: "not_sent" });
    bridge.ownerCapture = "18";
    await expect(client.collectObserved()).rejects.toMatchObject({ outcome: "unknown" });
    expect(client.ready).toBe(false); expect(client.observationCollection).toBeNull();
  });
  it("retains an actual origin/lifecycle at a memory watch but no checkpoint frame or bytes", async () => {
    const { bridge, client } = await observedClient(); bridge.memoryWatch = true;
    const result = await client.collectObserved();
    expect(result.frames).toEqual([]); expect(result.lifecycle?.response.status).toBe("ok");
    expect(result.inventory?.response.status).toBe("unavailable"); expect(result.memory).toBeNull();
    expect(result.runtime.response.frames).toEqual({ availability: "unavailable", reason: "not_checkpoint" });
  });
  it("refuses cross-invocation, fabricated frame identities, invalid coverage and wrong generation", async () => {
    const changes: [string, (row: MockRow) => void][] = [
      ["runtime", row => { (row.invocation as MockRow).global = ["1", "0", "0"]; }],
      ["runtime", row => { (((row.frames as MockRow).frames as MockRow[])[1]).activation = "1"; }],
      ["runtime", row => { row.origin_coverage = { coverage: "disabled" }; }],
      ["runtime", row => { ((row.binding as MockRow).cursor as MockRow).event_sequence = 99; }],
      ["runtime", row => { row.physical_registers = []; }],
      ["storage", row => { const allocations = (row.result as MockRow).allocations as MockRow[];
        ((allocations[0].descriptor as MockRow).identity as MockRow).generation = "0"; }],
      ["lifecycle", row => { const transitions = (row.result as MockRow).transitions as MockRow[];
        transitions[3].sequence = "5"; }],
    ];
    for (const [command, mutate] of changes) {
      const { bridge, client } = await observedClient();
      bridge.mutate = (text, row) => { if (text === command) mutate(row); };
      await expect(client.collectObserved()).rejects.toMatchObject({ outcome: "unknown" });
      expect(client.ready).toBe(false); expect(client.observationCollection).toBeNull();
    }
  });
  it("does not silently mix memory from another slot or accept nonzero mask padding", async () => {
    for (const change of ["slot", "mask"]) {
      const { bridge, client } = await observedClient();
      bridge.mutate = (text, row) => {
        if (!text.startsWith("storagememory ")) return;
        const memory = (row.result as MockRow).memory as MockRow;
        if (change === "slot") (memory.allocation as MockRow).storage_slot = "7";
        else memory.initialized = "0xff";
      };
      await expect(client.collectObserved({ allocation: "3", storageSlot: "2", generation: "2", byteOffset: "0", byteLength: "4" }))
        .rejects.toMatchObject({ outcome: "unknown" });
    }
  });
  it("keeps legacy generation-zero commands and schemas unchanged", async () => {
    const { client } = await observedClient();
    expect(parseCpuCommand("memory 3 0 0 4").body.allocation).toEqual({ ordinal: 3n, generation: 0n });
    const reply = await client.command("memory 3 0 0 4");
    expect(reply.response.schema).toBe("fe2o3-debug-response-v1");
    expect(stable(reply.session.cursor)).toContain("event_sequence");
  });
});
