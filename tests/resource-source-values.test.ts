import { expect, it } from "vitest";
import { projectResourceSourceValues } from "../src/content/resource-source-values";
import { syntheticSourceValueGroup } from "./fixtures/resource-source-values";
import type { MutableResourceControl } from "./fixtures/recorded-resource-import";

// All groups here are synthetic controls. Fresh source-produced fixture checks
// are a separate root-owned acceptance gate and are not claimed by these tests.
type Group = ReturnType<typeof syntheticSourceValueGroup>;
const project = (group: Group) => projectResourceSourceValues(group.checkpoint, group.stack, group.sourcePages);
const first = (group: Group): MutableResourceControl => group.sourcePages[0].response.values[0];

it("presents original separate anchors and observed next-operation metadata without mutation", () => {
  const group = syntheticSourceValueGroup(), original = structuredClone(group), value = project(group);
  expect(value.status).toBe("ready"); if (value.status !== "ready") throw new Error(value.detail);
  expect(value.rows).toHaveLength(4);
  expect(value.rows[0]).toMatchObject({ name: "a", typeLabel: "u32", representation: "0xfffffff0", interpretation: "4294967280", generation: "1" });
  expect(value.rows[2]).toMatchObject({ name: "out", status: "unavailable", representation: "not_represented", generation: "0" });
  expect(value.checkpointAnchor.frame).toBeUndefined(); expect(value.checkpointAnchor.occurrence).toBeUndefined();
  expect(value.sourceAnchor.frame).toBe(1); expect(value.sourceAnchor.occurrence).toBe(1);
  expect(value.stackFrame.nextOperation).toBe(1); expect(value.checkpointAnchor.site?.kir.point).toEqual({ kind: "operation", operation_ordinal: 0 });
  expect(value.sourceRequestIds).toEqual([6, 7]); expect(group).toEqual(original);
});
it("keeps old recordings explicitly unavailable without a synthetic name table", () => {
  const { checkpoint } = syntheticSourceValueGroup();
  expect(projectResourceSourceValues(checkpoint, null, [])).toEqual({ status: "unavailable", detail: "No source-variable query was retained for this checkpoint." });
});
it("requires both the independently retained stack and source pages", () => {
  const group = syntheticSourceValueGroup();
  expect(projectResourceSourceValues(group.checkpoint, null, group.sourcePages).status).toBe("invalid");
  expect(projectResourceSourceValues(group.checkpoint, group.stack, []).status).toBe("invalid");
});
it.each([
  [{ kind: "integer", signed: false, bits: 64 }, "0xffffffffffffffff", "18446744073709551615"],
  [{ kind: "integer", signed: true, bits: 64 }, "0x8000000000000000", "-9223372036854775808"],
  [{ kind: "integer", signed: true, bits: 8 }, "0xff", "-1"],
  [{ kind: "index", bits: 64 }, "0x0020000000000001", "9007199254740993"],
  [{ kind: "bool" }, "0x0", "false"],
  [{ kind: "float", bits: 32 }, "0x7fc00001", "Raw bits only; floating-point decoding is not inferred."],
])("retains exact scalar bits and interpretation for %j", (valueType, bits, interpretation) => {
  const group = syntheticSourceValueGroup(); first(group).availability.value.value_type = valueType;
  first(group).availability.value.value = { encoding: "bits", bits };
  const value = project(group); expect(value.status).toBe("ready");
  if (value.status === "ready") expect(value.rows[0].interpretation).toBe(interpretation);
});
it("uses lossless u64 pointer identities and offsets while distinguishing storage generation", () => {
  const group = syntheticSourceValueGroup(); first(group).generation = 18446744073709551615n;
  first(group).availability.value.value_type = { kind: "pointer", address_space: "global" };
  first(group).availability.value.value = { encoding: "allocation_relative_pointer",
    allocation: { ordinal: 18446744073709551615n, generation: 0 }, byte_offset: 9007199254740993n };
  const value = project(group); expect(value.status).toBe("ready");
  if (value.status === "ready") expect(value.rows[0]).toMatchObject({ generation: "18446744073709551615",
    representation: "alloc#18446744073709551615:g0 + 9007199254740993 bytes" });
});
it.each(["not_represented", "not_captured", "optimized_out", "outside_capture_scope", "not_in_scope", "not_live", "uninitialized", "truncated", "unsupported_by_backend", "requires_authenticated_map"])("preserves %s availability without a zero value", reason => {
  const group = syntheticSourceValueGroup(); first(group).availability = { status: "value", value: { status: "unavailable", reason } };
  const value = project(group); expect(value.status).toBe("ready");
  if (value.status === "ready") expect(value.rows[0]).toMatchObject({ status: "unavailable", representation: reason, typeLabel: "Not supplied" });
});
it("does not pick an ambiguous same-name binding or equate redaction with absence", () => {
  const group = syntheticSourceValueGroup(); first(group).availability = { status: "ambiguous" };
  group.sourcePages[0].response.values[1].name = "a";
  group.sourcePages[0].response.values[1].availability = { status: "value", value: { status: "redacted", reason: "native_address" } };
  const value = project(group); expect(value.status).toBe("ready");
  if (value.status === "ready") {
    expect(value.rows[0]).toMatchObject({ name: "a", status: "ambiguous" });
    expect(value.rows[1]).toMatchObject({ name: "a", status: "redacted", representation: "native_address" });
    expect(value.rows[0].identity).not.toBe(value.rows[1].identity);
  }
});
it.each([
  ["missing frame", (x: Group) => { delete x.sourcePages[0].response.snapshot.frame; }],
  ["missing occurrence", (x: Group) => { delete x.sourcePages[0].response.snapshot.occurrence; }],
  ["different frame", (x: Group) => { x.sourcePages[0].response.snapshot.frame = 2; }],
  ["invented activation", (x: Group) => { x.sourcePages[0].response.snapshot.occurrence = 19; }],
  ["different source", (x: Group) => { x.sourcePages[0].response.snapshot.site.source.location.file_identity = "f".repeat(64); }],
  ["different source span", (x: Group) => { x.sourcePages[0].response.snapshot.site.source.location.byte_start++; }],
  ["different scope", (x: Group) => { x.sourcePages[0].response.snapshot.scope.lane++; }],
  ["different revision", (x: Group) => { x.sourcePages[0].request.expected_revision--; }],
  ["different session", (x: Group) => { x.sourcePages[0].response.session.cursor.event_sequence++; }],
  ["hardware relabel", (x: Group) => { x.sourcePages[0].response.session.hardware_observed = true; }],
  ["stale stack", (x: Group) => { x.stack.response.result.snapshot.cursor.state_revision++; }],
  ["foreign SSA frame", (x: Group) => { (x.checkpoint.control.response as MutableResourceControl).result.snapshot.snapshot.values[0].path.root.frame = 2; }],
  ["foreign SSA function", (x: Group) => { (x.checkpoint.control.response as MutableResourceControl).result.snapshot.snapshot.values[0].path.root.function_ordinal = 1; }],
])("rejects %s without retaining a partial table", (_label, mutate) => {
  const group = syntheticSourceValueGroup(); mutate(group); expect(project(group).status).toBe("stale");
});
it.each([
  ["missing stack member", (x: Group) => { x.stack.response.result.frames = []; }],
  ["extra frame", (x: Group) => { x.stack.response.result.frames.push(structuredClone(x.stack.response.result.frames[0])); }],
  ["wrong stack function", (x: Group) => { x.stack.response.result.frames[0].function_ordinal++; }],
  ["missing next operation", (x: Group) => { delete x.stack.response.result.frames[0].next_operation; }],
  ["wrong stack count", (x: Group) => { x.stack.response.result.frames[0].values.value_count++; }],
  ["partial stack", (x: Group) => { x.stack.response.result.next_cursor = { query_identity: "9".repeat(64), position: 1 }; }],
  ["wrong requested frame", (x: Group) => { x.sourcePages[0].request.frame = 2; }],
  ["prefix", (x: Group) => { x.sourcePages.pop(); }],
  ["empty continuation", (x: Group) => { x.sourcePages[1].response.values = []; }],
  ["extra post-completion page", (x: Group) => { delete x.sourcePages[0].response.next_cursor; }],
  ["duplicate identity", (x: Group) => { x.sourcePages[1].response.values[0].variable_identity = first(x).variable_identity; }],
  ["changed selector", (x: Group) => { x.sourcePages[1].request.selector = { selector: "name", name: "a" }; }],
  ["changed page limit", (x: Group) => { x.sourcePages[1].request.page.limit = 3; }],
  ["changed page query", (x: Group) => { x.sourcePages[1].request.page.cursor.query_identity = "f".repeat(64); }],
  ["changed page position", (x: Group) => { x.sourcePages[1].request.page.cursor.position++; }],
  ["foreign response schema", (x: Group) => { x.sourcePages[0].response.schema = "fe2o3-debug-response-v1"; }],
  ["unsupported response", (x: Group) => { x.sourcePages[0].response.status = "unavailable"; }],
  ["duplicate pair ID", (x: Group) => { x.sourcePages[0].requestId = 5; }],
])("refuses %s in the complete stack/source join", (_label, mutate) => {
  const group = syntheticSourceValueGroup(); mutate(group); expect(project(group).status).not.toBe("ready");
});
it.each([
  ["hardware value", (row: MutableResourceControl) => { row.availability.value.provenance = "hardware_observation"; }, "unsupported"],
  ["overwide value", (row: MutableResourceControl) => { row.availability.value.value_type.bits = 65; }, "unsupported"],
  ["zero generation capture", (row: MutableResourceControl) => { row.generation = 0; }, "invalid"],
  ["negative generation", (row: MutableResourceControl) => { row.generation = -1; }, "invalid"],
  ["unsafe generation", (row: MutableResourceControl) => { row.generation = Number.MAX_SAFE_INTEGER + 1; }, "invalid"],
  ["nul name", (row: MutableResourceControl) => { row.name = "name\u0000"; }, "invalid"],
  ["surrogate name", (row: MutableResourceControl) => { row.name = "\ud800"; }, "invalid"],
  ["overlong name", (row: MutableResourceControl) => { row.name = "界".repeat(1400); }, "invalid"],
  ["unknown reason", (row: MutableResourceControl) => { row.availability = { status: "value", value: { status: "unavailable", reason: "zero" } }; }, "invalid"],
  ["noncanonical bits", (row: MutableResourceControl) => { row.availability.value.value.bits = "0XFFFFFFF0"; }, "invalid"],
])("keeps %s out of the supported scalar table", (_label, mutate, status) => {
  const group = syntheticSourceValueGroup(); mutate(first(group)); expect(project(group).status).toBe(status);
});
it("does not silently truncate the page or row budgets", () => {
  const group = syntheticSourceValueGroup();
  expect(projectResourceSourceValues(group.checkpoint, group.stack, Array.from({ length: 33 }, () => group.sourcePages[0])).status).toBe("unsupported");
  group.sourcePages = group.sourcePages.slice(0, 1);
  const pair = group.sourcePages[0]; pair.request.page.limit = 64;
  pair.response.values = Array.from({ length: 64 }, (_, index) => ({ ...structuredClone(first(group)), variable_identity: (index + 1).toString(16).padStart(64, "0") }));
  pair.response.next_cursor = { query_identity: "9".repeat(64), position: 64 };
  const second = structuredClone(pair); second.requestId = 7; second.request.request_id = 7; second.response.request_id = 7;
  second.request.page.cursor = structuredClone(pair.response.next_cursor); delete second.response.next_cursor;
  second.response.values = [{ ...structuredClone(first(group)), variable_identity: "f".repeat(64) }];
  group.sourcePages.push(second); expect(project(group).status).toBe("unsupported");
});
it("preserves the same event under a fresh revision instead of substituting an old query", () => {
  const old = syntheticSourceValueGroup(), repeat = syntheticSourceValueGroup(2, 4);
  expect(project(repeat).status).toBe("ready");
  expect(projectResourceSourceValues(repeat.checkpoint, old.stack, old.sourcePages).status).toBe("stale");
});
