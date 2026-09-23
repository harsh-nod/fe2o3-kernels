/** One retained CPU access plus a same-owner target declaration. No lane grouping. */
import { modelLdsByteRange, type LdsBankRangeModel } from "../content/lds-bank-model";
import type { CpuBridgeReply } from "./cpu-debug-session";
import { observedCollectionKey, type CpuObservedCollection } from "./cpu-observed-collection";
import { validateObservedAccess } from "./cpu-observed-protocol";
import { joinDeclaredTarget } from "./cpu-declared-target";
import { allocationDescriptor, binding, decimal, invocation, need, object, origin, range, same, stable, storageIdentity, uint,
  type ObservedRow } from "./cpu-observed-validation";
export interface ObservedBankRow { readonly key: string; readonly row: ObservedRow; readonly label: string }
export function observedBankRows(collection: CpuObservedCollection): readonly ObservedBankRow[] {
  try {
    need(collection.selection && collection.accesses?.response.status === "ok" && collection.inventory?.response.status === "ok");
    for (const reply of [collection.runtime, collection.inventory, collection.accesses])
      need(observedCollectionKey(reply) === collection.key);
    const selected = { allocation: collection.selection.allocation, storage_slot: collection.selection.storageSlot,
      generation: collection.selection.generation };
    const result = object(collection.accesses.response.result, ["result", "accesses"]);
    need(result.result === "memory_accesses" && Array.isArray(result.accesses) && result.accesses.length <= 16);
    const descriptors = collection.allocations.map(row => allocationDescriptor(row.descriptor));
    const found = descriptors.filter(row => stable(row.identity) === stable(selected)); need(found.length === 1);
    const descriptor = found[0], scope = object(descriptor.owning_scope, ["scope"], ["coordinate", "size", "count", "launch", "invocation"]);
    need(descriptor.address_space === "workgroup" && scope.scope === "workgroup");
    object(scope, ["scope", "coordinate", "size", "count", "launch"]);
    const current = invocation(collection.runtime.response.invocation);
    same(current.workgroup, scope.coordinate); same(current.workgroup_size, scope.size);
    same(current.workgroup_count, scope.count); same(current.launch_extent, scope.launch);
    const keys = new Set<string>();
    return Object.freeze(result.accesses.map(value => {
      const row = validateObservedAccess(value); same(row.allocation, selected); need(row.address_space === "workgroup");
      const full = invocation(row.invocation), selectedRange = range(row.range), observed = origin(row.origin);
      same(full.workgroup, scope.coordinate); same(full.workgroup_size, scope.size);
      same(full.workgroup_count, scope.count); same(full.launch_extent, scope.launch);
      need(BigInt(decimal(selectedRange.byte_offset)) + BigInt(decimal(selectedRange.byte_len, 1n)) <= BigInt(decimal(descriptor.byte_len)));
      const occurrence = object(row.occurrence, ["record_ordinal", "event_sequence", "scope", "site", "schedule"]);
      need(uint(occurrence.event_sequence) <= BigInt(collection.runtime.session.cursor.event_sequence));
      need(observed.availability === "available");
      // Include full invocation, occurrence, allocation/slot/generation and actual
      // activation/attempt/raw site. Neither depth nor a source site is an ID.
      const key = collection.key + "/" + stable(row);
      need(!keys.has(key)); keys.add(key);
      const identity = storageIdentity(row.allocation), producer = object(observed.identity, ["activation", "attempt", "site"]);
      return Object.freeze({ key, row, label: "Event " + uint(occurrence.event_sequence) + " / allocation " + identity.allocation +
        " / slot " + identity.storage_slot + " / generation " + identity.generation + " / activation " + producer.activation +
        " / attempt " + producer.attempt });
    }));
  } catch { return []; }
}
export function projectObservedBankRange(collection: CpuObservedCollection, targetReply: CpuBridgeReply | null,
  selectedKey: string, baseResidue: string): LdsBankRangeModel {
  try {
    need(targetReply);
    const target = joinDeclaredTarget(collection, targetReply); need(target.availability === "declared");
    const rows = observedBankRows(collection), matches = rows.filter(row => row.key === selectedKey); need(matches.length === 1);
    const row = matches[0].row, occurrence = object(row.occurrence, ["record_ordinal", "event_sequence", "scope", "site", "schedule"]);
    const scope = object(occurrence.scope, ["level", "workgroup", "wave", "lane", "logical_workitem", "active_mask", "wave_width", "interpretation"]);
    same(scope.wave_width, targetReply.response.logical_wave_width);
    same(binding(collection.accesses!.response.binding), binding(targetReply.response.binding));
    const selected = range(row.range);
    return modelLdsByteRange(target.target, selected.byte_offset, selected.byte_len, baseResidue);
  } catch {
    return { status: "unavailable", reason: "target",
      detail: "Select one actual workgroup access and explicitly read a matching same-stop bundle target. No prior model is substituted." };
  }
}
