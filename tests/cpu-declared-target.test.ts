// Synthetic client/codec negative controls, not actual backend qualification.
import { describe, expect, it } from "vitest";
import { CpuDebugSession, parseCpuCommand, type CpuBridgeReply } from "../src/lib/cpu-debug-session";
import { joinDeclaredTarget } from "../src/lib/cpu-declared-target";
import { observedBankRows, projectObservedBankRange } from "../src/lib/cpu-observed-bank";
import { targetFixture, SyntheticTargetBridge, TARGET_SELECTION } from "./fixtures/cpu-declared-target";
import { jsonResponse, SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET, type MockRow } from "./fixtures/cpu-debug-bridge";
describe("explicit same-stop declared target", () => {
  it("keeps the six-call collector unchanged and uses one additional explicitly requested command", async () => {
    const { bridge, client, collection } = await targetFixture(false);
    expect(bridge.commands.slice(-6)).toEqual(["state", "runtime", "lifecycle", "storage", "storageaccess 3 2 2", "storagememory 3 2 2 0 4"]);
    expect(bridge.commands).not.toContain("target");
    const before = bridge.commands.length, revision = collection.runtime.session.revision;
    const reply = await client.inspectDeclaredTarget(collection);
    expect(bridge.commands.slice(before)).toEqual(["target"]);
    expect(reply.session.revision).toBe(revision); expect(client.observationCollection).toBe(collection);
    expect(reply.responseBytes).toBeLessThanOrEqual(4096);
    expect(joinDeclaredTarget(collection, reply).target).toBe("gfx942:xnack-");
  });
  it("accepts only the no-argument command and refuses queries before current owner discovery", async () => {
    expect(parseCpuCommand("target").body).toEqual({ operation: "inspect_declared_target" });
    for (const text of ["target ", " target", "target gfx942", "target 32", "target\n", "target {}"])
      expect(() => parseCpuCommand(text)).toThrow();
    const bridge = new SyntheticTargetBridge(), client = new CpuDebugSession(bridge.fetch);
    await client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET); await client.command("step 4");
    await expect(client.command("target")).rejects.toMatchObject({ outcome: "not_sent" });
    expect(bridge.commands).not.toContain("target");
  });
  it.each(["gfx942:xnack-", "gfx950:xnack-"])("models one actual-row identity with the exact declared %s geometry", async gpu => {
    const { bridge, client, collection } = await targetFixture(false); bridge.gpu = gpu;
    const target = await client.inspectDeclaredTarget(collection), rows = observedBankRows(collection);
    expect(rows).toHaveLength(2); expect(rows[0].key).not.toBe(rows[1].key);
    const model = projectObservedBankRange(collection, target, rows[0].key, "0");
    expect(model.status).toBe("modeled");
    if (model.status === "modeled") { expect(model.profile.bankCount).toBe(gpu.startsWith("gfx942") ? 32 : 64); expect(model.byteLength).toBe("4"); }
    expect(projectObservedBankRange(collection, target, rows[0].key, "256").status).toBe("unavailable");
    expect(projectObservedBankRange(collection, target, "old-row", "0").status).toBe("unavailable");
  });
  it("represents raw-input target absence without guessing from logical wave width", async () => {
    const { bridge, client, collection } = await targetFixture(false); bridge.raw = true;
    const reply = await client.inspectDeclaredTarget(collection);
    expect(joinDeclaredTarget(collection, reply).availability).toBe("unavailable");
    expect(projectObservedBankRange(collection, reply, observedBankRows(collection)[0].key, "0").status).toBe("unavailable");
  });
  const mutations: [string, (row: MockRow) => void][] = [
    ["owner", row => ((row.binding as MockRow).owner as MockRow).capture_instance = "19"],
    ["cursor", row => ((row.binding as MockRow).cursor as MockRow).event_sequence = 99],
    ["hardware", row => (row.session as MockRow).hardware_observed = true],
    ["width", row => row.logical_wave_width = true],
    ["target", row => (row.target as MockRow).target = "gfx942"],
    ["provenance", row => (row.target as MockRow).provenance = "hardware"],
    ["envelope", row => (row.target as MockRow).envelope_version = 6],
    ["zero identity", row => (row.target as MockRow).envelope_identity = "0".repeat(64)],
    ["zero bytes", row => ((row.target as MockRow).admitted_module as MockRow).canonical_bytes = "0"],
    ["unknown", row => row.physical_address = "0"],
  ];
  it.each(mutations)("fails closed for wrong %s and clears earlier collection", async (_name, mutate) => {
    const { bridge, client, collection } = await targetFixture(false); bridge.targetMutate = mutate;
    await expect(client.inspectDeclaredTarget(collection)).rejects.toThrow();
    expect(client.observationCollection).toBeNull(); expect(client.ready).toBe(false);
  });
  it("refuses both advertised and streamed outer overflow before retaining a target", async () => {
    for (const advertised of [true, false]) {
      const { bridge, client, collection } = await targetFixture(false);
      bridge.targetResponse = text => jsonResponse(text + " ".repeat(4096), 200, advertised ? { "Content-Length": "8192" } : {});
      await expect(client.inspectDeclaredTarget(collection)).rejects.toThrow(); expect(client.observationCollection).toBeNull();
    }
  });
  it.each([1, 2, 3, 4, 5, 6])("joins envelope %s to only its supported original module version", async version => {
    const { bridge, client, collection } = await targetFixture(false);
    bridge.targetMutate = row => { const target = row.target as MockRow;
      target.envelope_version = version; (target.admitted_module as MockRow).wire_version = version <= 4 ? 7 : version === 5 ? 10 : 11; };
    const target = await client.inspectDeclaredTarget(collection);
    expect(joinDeclaredTarget(collection, target).envelope_version).toBe(version);
  });
  it("refuses duplicate JSON keys, BOM and malformed UTF-8 in target HTTP replies", async () => {
    const changes = [
      (text: string) => jsonResponse(text.replace('"closed":false', '"closed":false,"closed":false')),
      (text: string) => jsonResponse("\ufeff" + text),
      () => new Response(new Uint8Array([0xff]), { headers: { "Content-Type": "application/json" } }),
    ];
    for (const change of changes) {
      const { bridge, client, collection } = await targetFixture(false); bridge.targetResponse = change;
      await expect(client.inspectDeclaredTarget(collection)).rejects.toThrow(); expect(client.observationCollection).toBeNull();
    }
  });
  it("accepts a bounded unchanged refusal but never retains a previous collection", async () => {
    for (const changed of [false, true]) {
      const { bridge, client, collection } = await targetFixture(false);
      bridge.targetMutate = row => {
        row.status = "error"; delete row.binding; delete row.target; delete row.logical_wave_width;
        row.error = { stage: "session", code: "invalid_cursor", message: "synthetic refusal", state_changed: changed };
      };
      if (changed) await expect(client.inspectDeclaredTarget(collection)).rejects.toThrow();
      else expect((await client.inspectDeclaredTarget(collection)).response.status).toBe("error");
      expect(client.observationCollection).toBeNull();
    }
  });
  it("discards delayed target completion after invalidation and never restores an old collection", async () => {
    const { bridge, client, collection } = await targetFixture(false);
    let finish: ((response: Response) => void) | null = null, responseText = "";
    bridge.targetResponse = text => { responseText = text; return new Promise(resolve => { finish = resolve; }); };
    const pending = client.inspectDeclaredTarget(collection); const checked = expect(pending).rejects.toThrow();
    await Promise.resolve(); expect(client.observationCollection).toBeNull();
    client.invalidate(); expect(finish).not.toBeNull(); (finish! as (response: Response) => void)(jsonResponse(responseText));
    await checked; expect(client.observationCollection).toBeNull(); expect(client.ready).toBe(false);
  });
  it("rejects stale collection and target joins after controls or changed connection/cursor", async () => {
    const { client, collection, target } = await targetFixture();
    for (const mutate of [
      (reply: CpuBridgeReply) => ({ ...reply, connectionId: "9".repeat(64) }),
      (reply: CpuBridgeReply) => ({ ...reply, bridgeSession: "9".repeat(64) }),
      (reply: CpuBridgeReply) => ({ ...reply, session: { ...reply.session, revision: "99" } }),
    ]) expect(() => joinDeclaredTarget(collection, mutate(target!))).toThrow();
    await client.command("step 1");
    await expect(client.inspectDeclaredTarget(collection)).rejects.toMatchObject({ outcome: "not_sent" });
    expect(client.observationCollection).toBeNull();
  });
  it("keeps lifecycle generation and full invocation in row keys; rejects unavailable or oversized rows", async () => {
    const { collection, target } = await targetFixture();
    const clone = () => structuredClone(collection);
    const changes: ((row: MockRow) => void)[] = [
      row => (row.allocation as MockRow).generation = "1",
      row => (row.invocation as MockRow).global = ["1", "0", "0"],
      row => row.origin = { availability: "unavailable", reason: "not_captured" },
      row => (row.range as MockRow).byte_len = "257",
    ];
    for (const mutate of changes) {
      const changed = clone(); mutate(((changed.accesses!.response.result as MockRow).accesses as MockRow[])[0]);
      expect(observedBankRows(changed)).toEqual([]);
      expect(projectObservedBankRange(changed, target, "unused", "0").status).toBe("unavailable");
    }
    expect(collection.selection).toEqual(TARGET_SELECTION);
  });
});
