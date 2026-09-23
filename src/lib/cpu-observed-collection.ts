/** Independent explicit first-page collection; no automatic polling or paging. */
import type { CpuBridgeReply } from "./cpu-debug-session";
import { observedFrames, observedInventoryRows } from "./cpu-observed-protocol";
import { binding, decimal, frozen, need, object, range, same, stable, type ObservedRow } from "./cpu-observed-validation";
export const CPU_OBSERVED_LIMITS = Object.freeze({ calls: 6, responseBytes: 2 * 1024 * 1024, memoryBytes: 4096 });
export interface CpuObservedSelection {
  readonly allocation: string; readonly storageSlot: string; readonly generation: string;
  readonly byteOffset: string; readonly byteLength: string;
}
export interface CpuObservedCollection {
  readonly key: string;
  readonly runtime: CpuBridgeReply;
  readonly inventory: CpuBridgeReply | null;
  readonly lifecycle: CpuBridgeReply | null;
  readonly accesses: CpuBridgeReply | null;
  readonly memory: CpuBridgeReply | null;
  readonly selection: CpuObservedSelection | null;
  readonly frames: readonly ObservedRow[];
  readonly allocations: readonly ObservedRow[];
  readonly replies: readonly CpuBridgeReply[];
  readonly responseBytes: number;
}
export function observedCollectionKey(reply: CpuBridgeReply): string {
  return reply.connectionId + ":" + reply.bridgeSession + ":" + stable(reply.session) + ":" +
    (Object.hasOwn(reply.response, "binding") ? stable(binding(reply.response.binding)) : "unavailable");
}
export function validateObservedSelection(value: CpuObservedSelection): CpuObservedSelection {
  object(value, ["allocation", "storageSlot", "generation", "byteOffset", "byteLength"]);
  decimal(value.allocation, 1n); decimal(value.storageSlot, 1n); decimal(value.generation, 1n);
  range({ byte_offset: value.byteOffset, byte_len: value.byteLength });
  need(BigInt(value.byteLength) <= 4096n); return frozen({ ...value });
}
export async function collectCpuObservedQueries(selection: CpuObservedSelection | undefined,
  send: (text: string) => Promise<CpuBridgeReply>, current: () => boolean): Promise<CpuObservedCollection> {
  const selected = selection ? validateObservedSelection(selection) : null;
  const replies: CpuBridgeReply[] = []; let bytes = 0;
  let first: CpuBridgeReply | null = null;
  const receive = async (command: string) => {
    need(current() && replies.length < CPU_OBSERVED_LIMITS.calls);
    const reply = await send(command); need(current());
    need(Number.isSafeInteger(reply.responseBytes) && reply.responseBytes > 0);
    bytes += reply.responseBytes; need(bytes <= CPU_OBSERVED_LIMITS.responseBytes);
    if (first) {
      need(reply.connectionId === first.connectionId && reply.bridgeSession === first.bridgeSession);
      same(reply.session, first.session);
    } else first = reply;
    replies.push(reply); return reply;
  };
  // State supplies an accepted current anchor even at a genuine Memory watch
  // stop. It does not make that stop into a checkpoint or fabricate frame values.
  const state = await receive("state"); need(state.response.status === "ok");
  const runtime = await receive("runtime");
  let inventory: CpuBridgeReply | null = null, lifecycle: CpuBridgeReply | null = null,
    accesses: CpuBridgeReply | null = null, memory: CpuBridgeReply | null = null;
  if (runtime.response.status === "ok") {
    const watermark = object(runtime.response.allocation_watermark, ["availability"], ["through_sequence", "reason"]);
    if (watermark.availability === "available") {
      lifecycle = await receive("lifecycle");
      if (lifecycle.response.status === "ok") inventory = await receive("storage");
      if (selected && inventory?.response.status === "ok") {
        const match = observedInventoryRows(inventory).find(row => {
          const descriptor = object(row.descriptor, ["identity", "address_space", "access", "alignment", "byte_len", "owning_scope"], ["creation_site"]),
            id = object(descriptor.identity, ["allocation", "storage_slot", "generation"]);
          return id.allocation === selected.allocation && id.storage_slot === selected.storageSlot && id.generation === selected.generation &&
            BigInt(selected.byteOffset) + BigInt(selected.byteLength) <= BigInt(decimal(descriptor.byte_len));
        });
        need(match);
        const tuple = [selected.allocation, selected.storageSlot, selected.generation].join(" ");
        accesses = await receive("storageaccess " + tuple);
        if (accesses.response.status === "ok")
          memory = await receive("storagememory " + tuple + " " + selected.byteOffset + " " + selected.byteLength);
      }
    }
  }
  need(current());
  return frozen({ key: observedCollectionKey(runtime), runtime, inventory, lifecycle, accesses, memory,
    selection: selected, frames: runtime.response.status === "ok" ? observedFrames(runtime) : [],
    allocations: observedInventoryRows(inventory), replies, responseBytes: bytes });
}
