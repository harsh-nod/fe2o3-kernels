/** Bounded, read-only logical lifetimes from the existing observed CPU replies.
 * No allocator-capacity, physical layout, whole-run peak or execution authority. */
import type { CpuObservedCollection } from "./cpu-observed-collection";
import { observedCollectionKey } from "./cpu-observed-collection";
import { observedOwner, parseCpuObservedCommand, validateCpuObservedReply } from "./cpu-observed-protocol";
import { allocationDescriptor, decimal, frozen, need, object, OBSERVED_U64, same, stable,
  storageIdentity, type ObservedRow } from "./cpu-observed-validation";

export interface CpuObservedLifetime {
  readonly allocation: string;
  readonly storageSlot: string;
  readonly generation: string;
  readonly groupKey: string;
  readonly bytes: string;
  readonly firstObservedSequence: string;
  /** null means preexisting: its actual creation was not observed. */
  readonly createdSequence: string | null;
  readonly releasedSequence: string | null;
  readonly previousAllocation: string | null;
}
export interface CpuObservedLifetimeGroup {
  readonly key: string;
  readonly addressSpace: string;
  readonly scope: ObservedRow;
  readonly prefixLiveBytes: string;
  readonly prefixPeakBytes: string;
  readonly peakSequence: string | null;
  readonly prefixLiveAllocations: number;
}
export type CpuObservedLifetimes =
  | { readonly status: "unavailable"; readonly reason: string }
  | { readonly status: "ready"; readonly key: string; readonly selectedThrough: string;
      readonly observedThrough: string; readonly completeThroughSelection: boolean;
      readonly captureComplete: boolean; readonly metadataCoverage: string;
      readonly groups: readonly CpuObservedLifetimeGroup[]; readonly lifetimes: readonly CpuObservedLifetime[] };

interface MutableGroup {
  key: string; addressSpace: string; scope: ObservedRow;
  live: bigint; peak: bigint; peakSequence: string | null; count: number;
}
interface MutableLifetime {
  allocation: string; storageSlot: string; generation: string; groupKey: string; bytes: string;
  firstObservedSequence: string; createdSequence: string | null; releasedSequence: string | null;
  previousAllocation: string | null;
}

/** Reuses the existing closed reply validator before deriving any displayed facts.
 * At most the existing 16 first-page rows are visited; no fetch, paging or polling. */
export function projectCpuObservedLifetimes(collection: CpuObservedCollection): CpuObservedLifetimes {
  const runtime = collection.runtime;
  need(collection.key === observedCollectionKey(runtime));
  const runtimeCommand = parseCpuObservedCommand("runtime");
  need(runtimeCommand);
  const owner = observedOwner(runtime);
  validateCpuObservedReply(runtimeCommand, runtime, runtime.session, { owner, runtime: null, inventory: null });
  if (runtime.response.status !== "ok")
    return frozen({ status: "unavailable", reason: "No available runtime observation at this selection." });
  const lifecycle = collection.lifecycle;
  if (!lifecycle) return frozen({ status: "unavailable", reason: "The lifecycle prefix was not queried." });
  need(lifecycle.connectionId === runtime.connectionId && lifecycle.bridgeSession === runtime.bridgeSession);
  same(lifecycle.session, runtime.session);
  const command = parseCpuObservedCommand("lifecycle");
  need(command);
  validateCpuObservedReply(command, lifecycle, runtime.session, { owner, runtime, inventory: null });
  if (lifecycle.response.status !== "ok")
    return frozen({ status: "unavailable", reason: "The selected lifecycle query is unavailable or refused." });

  const response = lifecycle.response;
  const page = object(response.page, ["source_count", "source_start", "scanned"], ["next_token"]);
  const result = object(response.result, ["result", "transitions"]);
  need(Array.isArray(result.transitions) && result.transitions.length <= 16);
  const selectedThrough = decimal(response.through_sequence);
  const observedThrough = String(result.transitions.length);
  const coverage = object(runtime.response.lifecycle_coverage, ["coverage"], ["retained_records", "reason"]);
  const completeThroughSelection = !Object.hasOwn(page, "next_token") &&
    observedThrough === selectedThrough && coverage.coverage === "complete";
  const capture = object(runtime.response.completeness, ["status"], ["reason", "emitted_events", "dropped_events"]);
  const groups = new Map<string, MutableGroup>();
  const lifetimes: MutableLifetime[] = [];
  const live = new Map<string, MutableLifetime>();
  for (const item of result.transitions) {
    const transition = object(item, ["sequence", "descriptor", "kind"]);
    const descriptor = allocationDescriptor(transition.descriptor);
    const id = storageIdentity(descriptor.identity);
    const kind = object(transition.kind, ["transition"], ["previous_allocation"]);
    const sequence = decimal(transition.sequence, 1n);
    const allocation = decimal(id.allocation, 1n);
    const bytes = decimal(descriptor.byte_len);
    const scope = structuredClone(descriptor.owning_scope) as ObservedRow;
    const groupKey = stable({ address_space: descriptor.address_space, owning_scope: scope });
    let group = groups.get(groupKey);
    if (!group) {
      group = { key: groupKey, addressSpace: String(descriptor.address_space), scope,
        live: 0n, peak: 0n, peakSequence: null, count: 0 };
      groups.set(groupKey, group);
    }
    if (kind.transition === "release") {
      const prior = live.get(allocation);
      need(prior && prior.groupKey === groupKey && prior.bytes === bytes && prior.releasedSequence === null);
      need(group.live >= BigInt(bytes) && group.count > 0);
      group.live -= BigInt(bytes); group.count -= 1;
      prior.releasedSequence = sequence; live.delete(allocation);
    } else {
      need(!live.has(allocation));
      const next = group.live + BigInt(bytes);
      // The producer's quantities are u64 bytes. Refuse aggregate overflow, do
      // not wrap, use Number, clamp, or return a partially accumulated view.
      need(next <= OBSERVED_U64);
      group.live = next; group.count += 1;
      if (next > group.peak) { group.peak = next; group.peakSequence = sequence; }
      const lifetime: MutableLifetime = { allocation, storageSlot: decimal(id.storage_slot, 1n),
        generation: decimal(id.generation, 1n), groupKey, bytes, firstObservedSequence: sequence,
        createdSequence: kind.transition === "preexisting" ? null : sequence, releasedSequence: null,
        previousAllocation: Object.hasOwn(kind, "previous_allocation") ? decimal(kind.previous_allocation, 1n) : null };
      lifetimes.push(lifetime); live.set(allocation, lifetime);
    }
  }
  return frozen({ status: "ready", key: collection.key, selectedThrough, observedThrough,
    completeThroughSelection, captureComplete: capture.status === "complete",
    metadataCoverage: String(coverage.coverage),
    groups: [...groups.values()].sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0).map(group => ({
      key: group.key, addressSpace: group.addressSpace, scope: group.scope,
      prefixLiveBytes: String(group.live), prefixPeakBytes: String(group.peak),
      peakSequence: group.peakSequence, prefixLiveAllocations: group.count,
    })), lifetimes });
}
