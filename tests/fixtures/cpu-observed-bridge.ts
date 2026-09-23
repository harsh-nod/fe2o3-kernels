// Synthetic transport only: no simulator, real source, socket or allocation reuse.
import type { CpuFetch } from "../../src/lib/cpu-debug-session";
import { parseCpuObservedCommand } from "../../src/lib/cpu-observed-protocol";
import { SyntheticCpuBridge, bridgeJson, jsonResponse, syntheticSession, type MockRow } from "./cpu-debug-bridge";

export function observedInvocation(): MockRow {
  return { global: ["0", "0", "0"], workgroup: ["0", "0", "0"], local: [0, 0, 0],
    workgroup_size: [1, 1, 1], workgroup_count: ["1", "1", "1"], launch_extent: ["1", "1", "1"] };
}
const rootSite = { function_ordinal: "0", block: 4, operation: 8 };
const childSite = { function_ordinal: "1", block: 7, operation: 3 };
export function observedFrames(): MockRow {
  return { availability: "captured", frames: [
    { legacy_depth: 0, function_ordinal: "0", block: 4, next_operation: 8, activation: "1",
      operation: { state: "suspended", attempt: "5", site: rootSite }, parent: { parent: "root" } },
    { legacy_depth: 1, function_ordinal: "1", block: 7, next_operation: 4, activation: "9",
      operation: { state: "active_operation", attempt: "2", site: childSite },
      parent: { parent: "caller", activation: "1", attempt: "5", call_site: rootSite } },
  ] };
}
export function observedDescriptor(allocation = "3", generation = "2"): MockRow {
  return { identity: { allocation, storage_slot: "2", generation }, address_space: "private",
    access: "read_write", alignment: 4, byte_len: "4",
    owning_scope: { scope: "invocation", invocation: observedInvocation() },
    creation_site: { function_ordinal: "1", block: 7, operation: 0 } };
}
export class SyntheticObservedBridge {
  readonly base = new SyntheticCpuBridge();
  readonly commands: string[] = [];
  memoryWatch = false;
  ownerCapture = "17";
  mutate: ((command: string, reply: MockRow) => void) | null = null;
  fetch: CpuFetch = async (url, init) => {
    const body = JSON.parse(String(init.body)) as MockRow;
    if (!url.endsWith("/v1/command")) return this.base.fetch(url, init);
    const text = String(body.command); this.commands.push(text);
    const parsed = parseCpuObservedCommand(text);
    if (!parsed) return this.base.fetch(url, init);
    const sequence = BigInt(String(body.sequence));
    this.base.sequence = sequence;
    const session = syntheticSession(this.base.revision, this.base.event, this.base.state),
      binding = { owner: { backend_session: "1", capture_instance: this.ownerCapture }, cursor: session.cursor };
    const common = { status: "ok", request_id: sequence + 1n, session, binding,
      completeness: { status: "complete" } };
    let reply: MockRow;
    if (text === "runtime") {
      reply = { ...common, schema: "fe2o3-debug-runtime-observation-response-v1",
        invocation: observedInvocation(), frames: this.memoryWatch ?
          { availability: "unavailable", reason: "not_checkpoint" } : observedFrames(),
        origin: { availability: "available", identity: { activation: "9", attempt: "2", site: childSite } },
        allocation_watermark: { availability: "available", through_sequence: "4" },
        origin_coverage: { coverage: "complete" }, frame_coverage: { coverage: "complete" }, lifecycle_coverage: { coverage: "complete" } };
    } else {
      reply = { ...common, schema: "fe2o3-debug-resource-response-v2", operation: parsed.operation, through_sequence: "4" };
      if (text === "lifecycle") {
        const old = observedDescriptor("2", "1"), current = observedDescriptor();
        const global = { identity: { allocation: "1", storage_slot: "1", generation: "1" }, address_space: "global",
          access: "read_write", alignment: 4, byte_len: "4", owning_scope: { scope: "dispatch" } };
        reply.page = { source_count: "4", source_start: "0", scanned: 4 };
        reply.result = { result: "allocation_lifecycle", transitions: [
          { sequence: "1", descriptor: global, kind: { transition: "preexisting" } },
          { sequence: "2", descriptor: old, kind: { transition: "create" } },
          { sequence: "3", descriptor: old, kind: { transition: "release" } },
          { sequence: "4", descriptor: current, kind: { transition: "create", previous_allocation: "2" } },
        ] };
      } else if (text === "storage") {
        if (this.memoryWatch) {
          reply = { ...common, schema: "fe2o3-debug-resource-response-v2", status: "unavailable",
            operation: parsed.operation, reason: "not_checkpoint" };
        } else {
          reply.page = { source_count: "1", source_start: "0", scanned: 1 };
          reply.result = { result: "allocations", allocations: [{ descriptor: observedDescriptor(),
            snapshot_bytes_available: true, initialization_available: true }] };
        }
      } else if (text.startsWith("storageaccess ")) {
        reply.page = { source_count: this.base.event.toString(), source_start: "0", scanned: this.base.event };
        reply.result = { result: "memory_accesses", accesses: [] };
      } else {
        const range = parsed.body.range as MockRow, count = Number(range.byte_len);
        reply.result = { result: "allocation_memory", memory: { allocation: parsed.body.allocation,
          range, address_space: "private", bytes: "0x" + "12".repeat(count),
          initialized: "0x" + ((1 << count) - 1).toString(16).padStart(2, "0") } };
      }
    }
    this.mutate?.(text, reply);
    return jsonResponse(bridgeJson(this.base.connectionId, this.base.bridgeSession, sequence, reply));
  };
}
