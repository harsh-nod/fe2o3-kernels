// Synthetic contract controls only: no source export, simulator, socket or GPU.
import { CpuDebugSession, type CpuFetch } from "../../src/lib/cpu-debug-session";
import { SyntheticObservedBridge, observedInvocation } from "./cpu-observed-bridge";
import { bridgeJson, jsonResponse, syntheticSession, SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET, type MockRow } from "./cpu-debug-bridge";
export const TARGET_SELECTION = { allocation: "3", storageSlot: "2", generation: "2", byteOffset: "0", byteLength: "4" };
export function workgroupDescriptor(row: MockRow): void {
  if (row.address_space !== "private") return;
  row.address_space = "workgroup";
  row.owning_scope = { scope: "workgroup", coordinate: ["0", "0", "0"], size: [1, 1, 1],
    count: ["1", "1", "1"], launch: ["1", "1", "1"] };
}
export function syntheticAccess(event: number): MockRow {
  return { occurrence: { record_ordinal: event - 1, event_sequence: event,
    scope: { level: "lane", workgroup: [0, 0, 0], wave: 0, lane: 0, logical_workitem: [0, 0, 0],
      active_mask: 1, wave_width: 32, interpretation: "logical_visualization" },
    site: { function_ordinal: 1, block_ordinal: 0, point: { kind: "operation", operation_ordinal: 3 } },
    schedule: { identity: "workgroup_major_local_zyx_cooperative_v1", decision_ordinal: event - 1 } },
    invocation: observedInvocation(), allocation: { allocation: "3", storage_slot: "2", generation: "2" },
    range: { byte_offset: "0", byte_len: "4" }, address_space: "workgroup", access: "write_committed",
    origin: { availability: "available", identity: { activation: "9", attempt: String(event + 1),
      site: { function_ordinal: "1", block: 7, operation: 3 } } } };
}
export class SyntheticTargetBridge {
  readonly observed = new SyntheticObservedBridge();
  readonly commands: string[] = [];
  gpu = "gfx942:xnack-";
  raw = false;
  targetMutate: ((reply: MockRow) => void) | null = null;
  targetResponse: ((text: string) => Promise<Response> | Response) | null = null;
  constructor() {
    this.observed.mutate = (command, reply) => {
      const result = reply.result as MockRow | undefined;
      if (command === "storage") for (const row of result!.allocations as MockRow[]) workgroupDescriptor(row.descriptor as MockRow);
      if (command === "lifecycle") for (const row of result!.transitions as MockRow[]) workgroupDescriptor(row.descriptor as MockRow);
      if (command.startsWith("storageaccess ")) result!.accesses = [syntheticAccess(1), syntheticAccess(2)];
      if (command.startsWith("storagememory ")) (result!.memory as MockRow).address_space = "workgroup";
    };
  }
  fetch: CpuFetch = async (url, init) => {
    const body = JSON.parse(String(init.body)) as MockRow, command = String(body.command ?? "");
    if (url.endsWith("/v1/command")) this.commands.push(command);
    if (!url.endsWith("/v1/command") || command !== "target") return this.observed.fetch(url, init);
    const base = this.observed.base, sequence = BigInt(String(body.sequence)); base.sequence = sequence;
    const session = syntheticSession(base.revision, base.event, base.state);
    const reply: MockRow = { schema: "fe2o3-debug-target-response-v1", operation: "inspect_declared_target", status: "ok",
      request_id: sequence + 1n, session, binding: { owner: { backend_session: "1", capture_instance: this.observed.ownerCapture },
        cursor: session.cursor }, logical_wave_width: 32, target: this.raw ?
        { availability: "unavailable", reason: "raw_input_has_no_declared_gpu_target" } :
        { availability: "declared", target: this.gpu, provenance: "verified_simulation_bundle", envelope_version: 5,
          envelope_identity: "d".repeat(64), subject_identity: "e".repeat(64),
          admitted_module: { wire_version: 10, sha256: "f".repeat(64), canonical_bytes: "245" } } };
    this.targetMutate?.(reply);
    const text = bridgeJson(base.connectionId, base.bridgeSession, sequence, reply);
    return this.targetResponse ? this.targetResponse(text) : jsonResponse(text);
  };
}
export async function targetFixture(queryTarget = true) {
  const bridge = new SyntheticTargetBridge(), client = new CpuDebugSession(bridge.fetch);
  await client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET); await client.command("step 4");
  const collection = await client.collectObserved(TARGET_SELECTION);
  const target = queryTarget ? await client.inspectDeclaredTarget(collection) : null;
  return { bridge, client, collection, target };
}
