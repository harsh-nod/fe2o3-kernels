import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { importResourceRecording, type ImportedResourceCheckpoint } from "../src/content/recorded-resource-import";
import { projectResourceCheckpointValues, RESOURCE_CHECKPOINT_VALUE_LIMIT } from "../src/content/resource-checkpoint-values";
import { resourceSnapshotAnchorKey } from "../src/content/resource-memory-view";
import { retainedResourceExcerpt, RETAINED_RESOURCE_VALUE_IDS, mutateResourceLine, type MutableResourceControl } from "./fixtures/recorded-resource-import";
import { retainedLdsImportExcerpt } from "./fixtures/recorded-lds-import";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());
async function checkpoints() {
  const input = retainedResourceExcerpt(RETAINED_RESOURCE_VALUE_IDS);
  return (await importResourceRecording(input.requests, input.responses)).checkpoints;
}
async function copied() { return structuredClone((await checkpoints())[1]); }
// Synthetic mutation controls only, never actual producer evidence.
function response(checkpoint: ImportedResourceCheckpoint): MutableResourceControl {
  return checkpoint.control.response as MutableResourceControl;
}
function snapshot(checkpoint: ImportedResourceCheckpoint): MutableResourceControl {
  return response(checkpoint).result.snapshot.snapshot;
}
function first(checkpoint: ImportedResourceCheckpoint): MutableResourceControl { return snapshot(checkpoint).values[0]; }

it("projects actual retained scalar/pointer observations and source spans, never register assignments", async () => {
  const entries = await checkpoints(), early = projectResourceCheckpointValues(entries[0]);
  expect(early.status).toBe("ready");
  if (early.status !== "ready") throw new Error("Expected retained checkpoint.");
  expect(early.rows).toHaveLength(3);
  const view = projectResourceCheckpointValues(entries[1]);
  expect(view.status).toBe("ready");
  if (view.status !== "ready") throw new Error("Expected retained checkpoint.");
  expect(view.rows).toHaveLength(18);
  expect(view.rows.find(row => row.valueOrdinal === "24")).toMatchObject({ key: "0:1:24", representation: "0x000001d5", interpretation: "469", typeLabel: "u32" });
  expect(view.rows.find(row => row.valueOrdinal === "25")).toMatchObject({ representation: "0x0000000000000000", interpretation: "0", typeLabel: "index64" });
  expect(view.rows.find(row => row.valueOrdinal === "27")).toMatchObject({ interpretation: "true", typeLabel: "bool" });
  expect(view.rows.find(row => row.valueOrdinal === "30")).toMatchObject({ interpretation: "1", typeLabel: "i64" });
  expect(view.rows.find(row => row.valueOrdinal === "12")).toMatchObject({ representation: "alloc#1:g0 + 0 bytes", typeLabel: "global pointer" });
  expect(view.anchor.site?.source).toMatchObject({ status: "resolved", location: { byte_start: 931, byte_end: 947, provenance: "compiler_bundle_bound" } });
});

it("keeps actual reverse/repeated revisions distinct while recovering equal retained values", async () => {
  const entries = await checkpoints(), views = entries.slice(1).map(projectResourceCheckpointValues);
  if (views.some(view => view.status !== "ready")) throw new Error("Expected retained checkpoints.");
  expect(views.map(view => view.status === "ready" && view.anchor.cursor)).toMatchObject([
    { event_sequence: 33, state_revision: 4 }, { event_sequence: 31, state_revision: 5 }, { event_sequence: 33, state_revision: 6 },
  ]);
  expect(views[2].status === "ready" && views[2].rows).toEqual(views[0].status === "ready" && views[0].rows);
  const input = retainedLdsImportExcerpt(), lds = await importResourceRecording(input.requests, input.responses);
  const view = projectResourceCheckpointValues(lds.checkpoints[0]);
  expect(view.status).toBe("ready");
  if (view.status !== "ready") throw new Error("Expected retained LDS checkpoint.");
  expect(view.rows).toHaveLength(7);
  expect(view.rows.find(row => row.valueOrdinal === "18")).toMatchObject({ typeLabel: "workgroup pointer", representation: "alloc#2:g0 + 0 bytes" });
});

it.each([
  [{ kind: "integer", signed: false, bits: 64 }, "0xffffffffffffffff", "18446744073709551615"],
  [{ kind: "integer", signed: true, bits: 64 }, "0x8000000000000000", "-9223372036854775808"],
  [{ kind: "integer", signed: true, bits: 64 }, "0x7fffffffffffffff", "9223372036854775807"],
  [{ kind: "integer", signed: true, bits: 8 }, "0xff", "-1"],
  [{ kind: "integer", signed: false, bits: 5 }, "0x1f", "31"],
  [{ kind: "index", bits: 64 }, "0x0020000000000001", "9007199254740993"],
  [{ kind: "bool" }, "0x0", "false"],
  [{ kind: "float", bits: 32 }, "0x7fc00001", "Raw bits only; no floating-point decoding."],
])("uses an independent exact scalar interpretation oracle for %j", async (valueType, bits, expected) => {
  const checkpoint = await copied();
  first(checkpoint).availability.value_type = valueType;
  first(checkpoint).availability.value = { encoding: "bits", bits };
  const view = projectResourceCheckpointValues(checkpoint);
  expect(view.status).toBe("ready");
  if (view.status !== "ready") throw new Error("Expected scalar control.");
  expect(view.rows[0].interpretation).toBe(expected);
});

it("preserves full u64 SSA identities and pointer offsets without Number conversion", async () => {
  const checkpoint = await copied();
  first(checkpoint).path.root = { kind: "ssa", function_ordinal: 9007199254740993n, frame: 18446744073709551615n, value_ordinal: 9007199254740995n };
  first(checkpoint).availability.value_type = { kind: "pointer", address_space: "global" };
  first(checkpoint).availability.value = { encoding: "allocation_relative_pointer", allocation: { ordinal: 18446744073709551615n, generation: 0 }, byte_offset: 18446744073709551615n };
  const view = projectResourceCheckpointValues(checkpoint);
  expect(view.status).toBe("ready");
  if (view.status !== "ready") throw new Error("Expected arithmetic-only control.");
  expect(view.rows[0].key).toBe("9007199254740993:18446744073709551615:9007199254740995");
  expect(view.rows[0].representation).toBe("alloc#18446744073709551615:g0 + 18446744073709551615 bytes");
});

it.each(["not_represented", "not_captured", "optimized_out", "outside_capture_scope", "not_in_scope",
  "not_live", "uninitialized", "truncated", "unsupported_by_backend", "requires_authenticated_map"])("keeps %s distinct from zero and redaction", async reason => {
  const checkpoint = await copied(); first(checkpoint).availability = { status: "unavailable", reason };
  snapshot(checkpoint).values[1].availability = { status: "redacted", reason: "native_address" };
  const view = projectResourceCheckpointValues(checkpoint);
  expect(view.status).toBe("ready");
  if (view.status !== "ready") throw new Error("Expected availability control.");
  expect(view.rows[0]).toMatchObject({ status: "unavailable", representation: reason, typeLabel: "Not supplied" });
  expect(view.rows[1]).toMatchObject({ status: "redacted", representation: "native_address" });
});

it.each(["native_address", "runtime_handle", "policy"])("retains the explicit %s redaction reason", async reason => {
  const checkpoint = await copied(); first(checkpoint).availability = { status: "redacted", reason };
  const view = projectResourceCheckpointValues(checkpoint);
  expect(view.status).toBe("ready");
  if (view.status !== "ready") throw new Error("Expected redaction control.");
  expect(view.rows[0]).toMatchObject({ status: "redacted", representation: reason });
});

it.each([
  ["overwide", (row: MutableResourceControl) => { row.availability.value_type.bits = 65; }, "unsupported"],
  ["zero width", (row: MutableResourceControl) => { row.availability.value_type.bits = 0; }, "invalid"],
  ["short hex", (row: MutableResourceControl) => { row.availability.value.bits = "0x25"; }, "invalid"],
  ["newline hex", (row: MutableResourceControl) => { row.availability.value.bits = "0x00000025\n"; }, "invalid"],
  ["bool high bit", (row: MutableResourceControl) => { row.availability.value_type = { kind: "bool" }; row.availability.value.bits = "0x2"; }, "invalid"],
  ["hardware", (row: MutableResourceControl) => { row.availability.provenance = "hardware_observation"; }, "unsupported"],
  ["reconstructed", (row: MutableResourceControl) => { row.availability.provenance = "reconstructed"; }, "unsupported"],
  ["register root", (row: MutableResourceControl) => { row.path.root = { kind: "register", name: "v0" }; }, "unsupported"],
  ["source variable root", (row: MutableResourceControl) => { row.path.root = { kind: "source_variable", name: "unverified" }; }, "unsupported"],
  ["subpath", (row: MutableResourceControl) => { row.path.components = [{ kind: "array", index: 0 }]; }, "unsupported"],
  ["aggregate", (row: MutableResourceControl) => { row.availability.value_type = { kind: "aggregate", aggregate: "array", elements: 1, byte_len: 4 }; }, "unsupported"],
  ["unknown field", (row: MutableResourceControl) => { row.availability.extra = true; }, "invalid"],
  ["unknown unavailable", (row: MutableResourceControl) => { row.availability = { status: "unavailable", reason: "pretend" }; }, "invalid"],
  ["zero frame", (row: MutableResourceControl) => { row.path.root.frame = 0; }, "invalid"],
  ["rounded identity", (row: MutableResourceControl) => { row.path.root.value_ordinal = 9007199254740992; }, "invalid"],
  ["overflow identity", (row: MutableResourceControl) => { row.path.root.value_ordinal = 18446744073709551616n; }, "invalid"],
  ["encoding mismatch", (row: MutableResourceControl) => { row.availability.value.encoding = "bytes"; }, "invalid"],
] as const)("refuses %s locally without publishing any partial rows", async (_name, mutate, status) => {
  const checkpoint = await copied(); mutate(first(checkpoint));
  const view = projectResourceCheckpointValues(checkpoint);
  expect(view.status).toBe(status); expect(view).not.toHaveProperty("rows");
});

it.each([
  ["event", (anchor: MutableResourceControl) => { anchor.cursor.event_sequence++; }],
  ["revision", (anchor: MutableResourceControl) => { anchor.cursor.state_revision++; }],
  ["configuration", (anchor: MutableResourceControl) => { anchor.cursor.configuration_identity = "a".repeat(64); }],
  ["source", (anchor: MutableResourceControl) => { anchor.site.source.location.file_identity = "b".repeat(64); }],
  ["source provenance", (anchor: MutableResourceControl) => { anchor.site.source.location.provenance = "caller_bound"; }],
  ["scope", (anchor: MutableResourceControl) => { anchor.scope.workgroup = [1, 0, 0]; }],
  ["active mask", (anchor: MutableResourceControl) => { anchor.scope.active_mask = 7; }],
  ["occurrence", (anchor: MutableResourceControl) => { anchor.frame = 2; anchor.occurrence = 1; }],
] as const)("rejects a substituted %s anchor", async (_name, mutate) => {
  const checkpoint = await copied(), expectedAnchor = structuredClone(checkpoint.anchor);
  // The importer intentionally shares the original anchor object. Detach only
  // the expected side: jointly changing caller claims is not authentication.
  mutate(expectedAnchor);
  const changed = { ...checkpoint, anchor: expectedAnchor, anchorKey: resourceSnapshotAnchorKey(expectedAnchor)! };
  expect(projectResourceCheckpointValues(changed).status).toBe("stale");
});

it("does not claim to authenticate jointly altered caller source identities", async () => {
  const checkpoint = await copied();
  snapshot(checkpoint).anchor.site.source.location.file_identity = "c".repeat(64);
  const changed = { ...checkpoint, anchorKey: resourceSnapshotAnchorKey(checkpoint.anchor)! };
  expect(projectResourceCheckpointValues(changed).status).toBe("ready");
});

it("rejects duplicate identities but keeps a different recorded frame separate", async () => {
  const checkpoint = await copied(), values = snapshot(checkpoint).values;
  values.push(structuredClone(values[0]));
  expect(projectResourceCheckpointValues(checkpoint).status).toBe("invalid");
  values.at(-1).path.root.frame = 2;
  expect(projectResourceCheckpointValues(checkpoint).status).toBe("ready");
});

it.each([
  ["generation", (pointer: MutableResourceControl) => { pointer.allocation.generation = 1; }, "unsupported"],
  ["zero allocation", (pointer: MutableResourceControl) => { pointer.allocation.ordinal = 0; }, "invalid"],
  ["negative offset", (pointer: MutableResourceControl) => { pointer.byte_offset = -1; }, "invalid"],
  ["text offset", (pointer: MutableResourceControl) => { pointer.byte_offset = "0"; }, "invalid"],
  ["overflow offset", (pointer: MutableResourceControl) => { pointer.byte_offset = 18446744073709551616n; }, "invalid"],
] as const)("refuses unsupported pointer %s", async (_name, mutate, status) => {
  const checkpoint = await copied(), pointer = snapshot(checkpoint).values[2].availability.value;
  mutate(pointer); expect(projectResourceCheckpointValues(checkpoint).status).toBe(status);
});

it("enforces the exact 64-row bound and represents an empty capture explicitly", async () => {
  const checkpoint = await copied(), template = first(checkpoint);
  snapshot(checkpoint).values = Array.from({ length: RESOURCE_CHECKPOINT_VALUE_LIMIT }, (_, index) => {
    const row = structuredClone(template); row.path.root.value_ordinal = 100 + index; return row;
  });
  expect(projectResourceCheckpointValues(checkpoint).status).toBe("ready");
  snapshot(checkpoint).values.push(template);
  expect(projectResourceCheckpointValues(checkpoint)).toMatchObject({ status: "unsupported", detail: expect.stringContaining("64-value") });
  snapshot(checkpoint).values = [];
  expect(projectResourceCheckpointValues(checkpoint)).toMatchObject({ status: "ready", rows: [] });
});

it("does not widen import acceptance or turn value display refusal into import rejection", async () => {
  const original = retainedResourceExcerpt();
  const mutated = mutateResourceLine(original.responses, 6, row => { row.result.snapshot.snapshot.values[0].availability.value.bits = "malformed"; });
  const recording = await importResourceRecording(original.requests, mutated);
  expect(projectResourceCheckpointValues(recording.checkpoints[0]).status).toBe("invalid");
  expect(recording.checkpoints[0].memories).toHaveLength(1);
  expect(recording.pairs[0].responseUtf8).toBe(mutated.split("\n")[0] + "\n");
  const checkpoint = await copied(); response(checkpoint).result.snapshot = { status: "unavailable", reason: "not_captured" };
  expect(projectResourceCheckpointValues(checkpoint).status).toBe("unsupported");
});
