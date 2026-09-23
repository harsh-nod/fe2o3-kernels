// Synthetic transport only. No real process, socket, original JSONL or source qualification.
import type { CpuFetch } from "../../src/lib/cpu-debug-session";
import { bridgeJson, jsonResponse, lossless, protocolReply, SyntheticCpuBridge, syntheticSession, type MockRow } from "./cpu-debug-bridge";
import { syntheticSourceValueGroup } from "./resource-source-values";
export interface QueryMock {
  readonly bridge: SyntheticCpuBridge;
  readonly fetch: CpuFetch;
  change: ((response: MockRow, command: string) => void) | null;
  wait: ((command: string) => Promise<void>) | null;
}
export function syntheticQueryBridge(): QueryMock {
  const bridge = new SyntheticCpuBridge(), original = bridge.fetch;
  const mock: QueryMock = { bridge, change: null, wait: null, fetch: async (url, init) => {
    const body = JSON.parse(String(init.body)) as MockRow, command = String(body.command ?? "");
    await mock.wait?.(command);
    if (url.endsWith("/v1/connect") || url.endsWith("/v1/disconnect")) return original(url, init);
    const special = command === "stack" || command === "variables 1" || command === "allocations" ||
      command.startsWith("accesses ") || command.startsWith("memory ") || command.startsWith("step ") || command.startsWith("reverse ");
    if (!special) return original(url, init);
    bridge.calls.push({ url, init, body }); bridge.sequence = BigInt(String(body.sequence));
    const step = command.startsWith("step ") || command.startsWith("reverse ");
    if (step) { bridge.event += command.startsWith("reverse ") ? -1n : 1n; bridge.revision++; bridge.state = "stopped"; }
    const group = syntheticSourceValueGroup(Number(bridge.event), Number(bridge.revision));
    const snapshot = ((group.checkpoint.control.response as MockRow).result as MockRow).snapshot as MockRow;
    const anchor = group.checkpoint.anchor;
    // Fixtures use the actual mock connection's configuration identity, not an inferred source map.
    anchor.cursor.configuration_identity = "c".repeat(64);
    const session = syntheticSession(bridge.revision, bridge.event, bridge.state);
    let raw: MockRow;
    if (step) {
      const captured = snapshot.snapshot as MockRow;
      captured.anchor = anchor;
      raw = protocolReply(bridge.sequence, "step", session, { result: "control",
        events_advanced: 1, stop: { reason: "step", outcome: "active", exact: true },
        snapshot: { status: "captured", snapshot: captured } });
    } else if (command === "stack") {
      raw = protocolReply(bridge.sequence, "inspect_stack", session, {
        ...(group.stack.response.result as MockRow), snapshot: anchor });
    } else if (command === "variables 1") {
      raw = { schema: "fe2o3-debug-source-variable-response-v2", status: "ok", request_id: bridge.sequence + 1n,
        operation: "inspect_source_variables", session, snapshot: { ...anchor, frame: 1, occurrence: 1 },
        values: group.sourcePages.flatMap(pair => pair.response.values as unknown[]) };
    } else if (command === "allocations" || command.startsWith("accesses ")) {
      const inventory = command === "allocations";
      raw = { schema: "fe2o3-debug-resource-response-v1", status: "ok", request_id: bridge.sequence + 1n,
        operation: inventory ? "query_allocations" : "query_memory_accesses", session, snapshot: anchor,
        physical_registers: "not_represented", page: { source_count: 1, scanned: 1, completeness: { status: "complete" } },
        result: inventory ? { result: "allocations", allocations: [{ allocation: { ordinal: 1, generation: 0 },
          address_space: "global", access: "read_write", alignment: 4, capacity_bytes: "24",
          snapshot_bytes_available: true, initialization_available: true, owning_scope: "not_represented",
          lifetime: "not_represented", physical_base: "not_represented" }] }
          : { result: "memory_accesses", accesses: [] } };
    } else {
      const [, ordinal, generation, offset, length] = command.split(" "), count = Number(length);
      raw = protocolReply(bridge.sequence, "read_memory", session, { result: "memory", snapshot: anchor,
        memory: { allocation: { ordinal: BigInt(ordinal), generation: BigInt(generation) },
          byte_offset: BigInt(offset), requested_bytes: count, returned_bytes: count,
          availability: { status: "captured", address_space: "global", bytes: "0x" + "a5".repeat(count),
            initialized: "0x" + Array.from({ length: Math.ceil(count / 8) }, (_, index) =>
              ((1 << Math.min(8, count - index * 8)) - 1).toString(16).padStart(2, "0")).join(""),
            truncated: false } } });
    }
    mock.change?.(raw, command);
    return jsonResponse(bridgeJson(bridge.connectionId, bridge.bridgeSession, bridge.sequence, raw));
  } };
  return mock;
}
export function syntheticQuerySize(response: unknown): number { return new TextEncoder().encode(lossless(response)).byteLength; }
