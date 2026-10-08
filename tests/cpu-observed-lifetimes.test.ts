// Synthetic protocol controls, not a real source capture or hardware observation.
import { describe, expect, it } from "vitest";
import { CpuDebugSession } from "../src/lib/cpu-debug-session";
import { observedCollectionKey, type CpuObservedCollection } from "../src/lib/cpu-observed-collection";
import { projectCpuObservedLifetimes } from "../src/lib/cpu-observed-lifetimes";
import { observedDescriptor, SyntheticObservedBridge } from "./fixtures/cpu-observed-bridge";
import { SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET, type MockRow } from "./fixtures/cpu-debug-bridge";

async function input() {
  const bridge = new SyntheticObservedBridge(), client = new CpuDebugSession(bridge.fetch);
  await client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET); await client.command("step 1");
  const collection = await client.collectObserved();
  return { bridge, collection };
}
function ready(collection: CpuObservedCollection) {
  const result = projectCpuObservedLifetimes(collection);
  if (result.status !== "ready") throw new Error("Expected ready projection");
  return result;
}
function rows(collection: CpuObservedCollection): MockRow[] {
  return (collection.lifecycle!.response.result as MockRow).transitions as MockRow[];
}
function withRows(collection: CpuObservedCollection, transitions: MockRow[]): CpuObservedCollection {
  const copy = structuredClone(collection), count = String(transitions.length);
  (copy.runtime.response.allocation_watermark as MockRow).through_sequence = count;
  const response = copy.lifecycle!.response as MockRow;
  response.through_sequence = count;
  response.page = { source_count: count, source_start: "0", scanned: transitions.length };
  response.result = { result: "allocation_lifecycle", transitions };
  return copy;
}
function dispatch(allocation: string, bytes: string): MockRow {
  return { identity: { allocation, storage_slot: allocation, generation: "1" },
    address_space: "global", access: "read_write", alignment: 1, byte_len: bytes, owning_scope: { scope: "dispatch" } };
}
function transition(sequence: number, descriptor: MockRow, kind: string, previous?: string): MockRow {
  return { sequence: String(sequence), descriptor, kind: { transition: kind,
    ...(previous === undefined ? {} : { previous_allocation: previous }) } };
}

describe("observed logical allocation lifetimes", () => {
  it("preserves distinct incarnations, exclusive release, unknown preexisting creation and exact scoped demand", async () => {
    const { collection, bridge } = await input(), before = bridge.commands.length;
    const result = ready(collection);
    expect(result.completeThroughSelection).toBe(true);
    expect(result.observedThrough).toBe("4");
    expect(result.groups.map(group => [group.addressSpace, group.prefixLiveBytes, group.prefixPeakBytes])).toEqual([
      ["global", "4", "4"], ["private", "4", "4"],
    ]);
    expect(result.lifetimes.map(row => [row.allocation, row.createdSequence, row.releasedSequence, row.previousAllocation]))
      .toEqual([["1", null, null, null], ["2", "2", "3", null], ["3", "4", null, "2"]]);
    expect(bridge.commands).toHaveLength(before);
    expect(Object.isFrozen(result) && Object.isFrozen(result.lifetimes)).toBe(true);
  });
  it("uses exact BigInt arithmetic beyond Number's exact integer range", async () => {
    const { collection } = await input();
    const value = ready(withRows(collection, [transition(1, dispatch("1", "9007199254740993"), "preexisting"),
      transition(2, dispatch("2", "7"), "preexisting")]));
    expect(value.groups[0].prefixLiveBytes).toBe("9007199254741000");
    expect(value.groups[0].prefixPeakBytes).toBe("9007199254741000");
    expect(value.groups[0].peakSequence).toBe("2");
  });
  it("refuses same-scope sum overflow instead of returning a partial or clamped result", async () => {
    const { collection } = await input();
    const selected = withRows(collection, [transition(1, dispatch("1", "18446744073709551615"), "preexisting"),
      transition(2, dispatch("2", "1"), "preexisting")]);
    expect(() => ready(selected)).toThrow();
  });
  it("keeps exact workgroup scopes separate even when a real predecessor slot is reused", async () => {
    const { collection } = await input();
    const descriptor = (allocation: string, generation: string, coordinate: string) => ({
      ...observedDescriptor(allocation, generation), address_space: "workgroup",
      byte_len: "256", owning_scope: { scope: "workgroup", coordinate: [coordinate, "0", "0"],
        size: [64, 1, 1], count: ["2", "1", "1"], launch: ["128", "1", "1"] },
    });
    const a = descriptor("1", "1", "0"), b = descriptor("2", "2", "1");
    const result = ready(withRows(collection, [transition(1, a, "create"), transition(2, a, "release"),
      transition(3, b, "create", "1")]));
    expect(result.groups).toHaveLength(2);
    expect(result.groups.map(group => [group.prefixLiveBytes, group.prefixPeakBytes])).toEqual([["0", "256"], ["256", "256"]]);
    expect(result.lifetimes[1].previousAllocation).toBe("1");
    expect(result.lifetimes[0].groupKey).not.toBe(result.lifetimes[1].groupKey);
  });
  it("does not overflow by summing unrelated scopes and retains zero-byte allocations", async () => {
    const { collection } = await input();
    const privateRow = { ...observedDescriptor("2", "1"), byte_len: "18446744073709551615" };
    const zero = dispatch("3", "0");
    const result = ready(withRows(collection, [transition(1, dispatch("1", "18446744073709551615"), "preexisting"),
      transition(2, privateRow, "create"), transition(3, zero, "preexisting")]));
    expect(result.groups.map(group => group.prefixPeakBytes)).toEqual(["18446744073709551615", "18446744073709551615"]);
    expect(result.lifetimes[2].bytes).toBe("0");
  });
  it("labels a bounded first page as partial and never calls its live end state current", async () => {
    const { collection } = await input(), copy = structuredClone(collection);
    const response = copy.lifecycle!.response as MockRow;
    (response.result as MockRow).transitions = rows(copy).slice(0, 2);
    response.page = { source_count: "4", source_start: "0", scanned: 2, next_token: "opaque-prefix" };
    const result = ready(copy);
    expect(result.completeThroughSelection).toBe(false);
    expect(result.observedThrough).toBe("2");
    expect(result.selectedThrough).toBe("4");
    expect(result.lifetimes[1].releasedSequence).toBeNull();
  });
  it("separates legacy capture completeness from coverage through the selected lifecycle watermark", async () => {
    const { collection } = await input(), copy = structuredClone(collection);
    const truncated = { status: "truncated", reason: "user_stopped", emitted_events: 1000 };
    (copy.runtime.response as MockRow).completeness = truncated;
    (copy.lifecycle!.response as MockRow).completeness = structuredClone(truncated);
    const result = ready(copy);
    expect(result.captureComplete).toBe(false);
    expect(result.completeThroughSelection).toBe(true);
  });
  it("does not promote truncated lifecycle metadata into a complete selected demand view", async () => {
    const { collection } = await input(), copy = structuredClone(collection);
    (copy.runtime.response as MockRow).lifecycle_coverage = { coverage: "prefix_truncated", retained_records: "1000", reason: "transition_limit" };
    const result = ready(copy);
    expect(result.metadataCoverage).toBe("prefix_truncated");
    expect(result.completeThroughSelection).toBe(false);
  });
  it("supports an empty complete prefix without inventing an allocation or a positive peak", async () => {
    const { collection } = await input(), result = ready(withRows(collection, []));
    expect(result.completeThroughSelection).toBe(true);
    expect(result.selectedThrough).toBe("0");
    expect(result.groups).toEqual([]); expect(result.lifetimes).toEqual([]);
  });
  it("does not mutate or freeze supplied scope objects while making its result immutable", async () => {
    const { collection } = await input(), copy = structuredClone(collection);
    const scope = (rows(copy)[1].descriptor as MockRow).owning_scope;
    expect(Object.isFrozen(scope)).toBe(false);
    ready(copy);
    expect(Object.isFrozen(scope)).toBe(false);
  });
  it.each(["connection", "bridge", "owner", "cursor", "key", "watermark", "gap", "duplicate", "descriptor", "predecessor", "row-bound"])(
    "refuses %s substitution before publishing any derived rows", async (change) => {
      const { collection } = await input(), copy = structuredClone(collection);
      const reply = copy.lifecycle! as unknown as MockRow, response = reply.response as MockRow;
      const values = rows(copy);
      if (change === "connection") reply.connectionId = "different";
      if (change === "bridge") reply.bridgeSession = "different";
      if (change === "owner") ((response.binding as MockRow).owner as MockRow).capture_instance = "999";
      if (change === "cursor") ((response.binding as MockRow).cursor as MockRow).event_sequence = 999;
      if (change === "key") (copy as unknown as MockRow).key = "stale";
      if (change === "watermark") response.through_sequence = "3";
      if (change === "gap") values[2].sequence = "9";
      if (change === "duplicate") values[3] = structuredClone(values[1]);
      if (change === "descriptor") (values[2].descriptor as MockRow).byte_len = "8";
      if (change === "predecessor") (values[3].kind as MockRow).previous_allocation = "1";
      if (change === "row-bound") (response.result as MockRow).transitions = Array.from({ length: 17 }, () => values[0]);
      expect(() => ready(copy)).toThrow();
    });
  it("retains not-queried and refused states, not an empty successful demand projection", async () => {
    const { collection } = await input(), noQuery = { ...collection, lifecycle: null };
    expect(projectCpuObservedLifetimes(noQuery)).toEqual({ status: "unavailable", reason: "The lifecycle prefix was not queried." });
    const copy = structuredClone(collection), response = copy.lifecycle!.response as MockRow;
    for (const key of ["result", "page", "through_sequence"]) delete response[key];
    response.status = "unavailable"; response.reason = "work_limit";
    expect(projectCpuObservedLifetimes(copy).status).toBe("unavailable");
  });
  it("requires the exact bound collection key even if a different key could be generated", async () => {
    const { collection } = await input(), copy = structuredClone(collection);
    (copy.runtime as unknown as MockRow).connectionId = "new-connection";
    expect(observedCollectionKey(copy.runtime)).not.toBe(copy.key);
    expect(() => ready(copy)).toThrow();
  });
});
