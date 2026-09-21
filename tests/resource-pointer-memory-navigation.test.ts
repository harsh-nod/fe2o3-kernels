import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { importResourceRecording, type ImportedResourceRecording } from "../src/content/recorded-resource-import";
import { projectResourceCheckpointValues } from "../src/content/resource-checkpoint-values";
import { projectResourceMemoryResponse } from "../src/content/resource-memory-view";
import { projectResourcePointerMemoryFocus, projectResourcePointerMemoryNavigation } from "../src/content/resource-pointer-memory-navigation";
import { retainedResourceExcerpt, type MutableResourceControl } from "./fixtures/recorded-resource-import";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());
const input = retainedResourceExcerpt();
const load = () => importResourceRecording(input.requests, input.responses);
const navigate = (recording: ImportedResourceRecording, key = "0:1:12", requestId?: number) =>
  projectResourcePointerMemoryNavigation(recording, recording.checkpoints[0], key, 1, requestId);
// Synthetic controls only. Positive observations below use immutable original
// paired lines; none of these edits are presented as actual capture evidence.
type Mutable<T> = T extends object ? { -readonly [Key in keyof T]: Mutable<T[Key]> } : T;
async function synthetic(): Promise<Mutable<ImportedResourceRecording>> { return structuredClone(await load()) as Mutable<ImportedResourceRecording>; }
function pointer(recording: ImportedResourceRecording) {
  const control = recording.checkpoints[0].control.response as MutableResourceControl;
  return control.result.snapshot.snapshot.values.find((value: MutableResourceControl) => value.path.root.value_ordinal === 12).availability;
}
function memory(recording: ImportedResourceRecording) {
  return (recording.checkpoints[0].memories[0].response as MutableResourceControl).result.memory;
}
async function actualFocus() {
  const recording = await load(), checkpoint = recording.checkpoints[0], result = navigate(recording);
  if (result.status !== "ready") throw new Error(result.detail);
  const projection = projectResourceMemoryResponse(checkpoint.memories[0].response, checkpoint.anchor);
  if (projection.status !== "ready") throw new Error(projection.detail);
  return { recording, result, projection };
}

it("navigates actual immutable global SSA pointers to only their current retained memory pair", async () => {
  const recording = await load();
  for (const [index, requestId] of [11, 15, 21].entries()) {
    const checkpoint = recording.checkpoints[index], values = projectResourceCheckpointValues(checkpoint);
    expect(values.status).toBe("ready");
    if (values.status !== "ready") return;
    expect(values.rows.filter(row => row.pointer).map(row => row.valueOrdinal)).toEqual(["12", "28", "29"]);
    for (const valueKey of ["0:1:12", "0:1:28", "0:1:29"]) {
      const result = projectResourcePointerMemoryNavigation(recording, checkpoint, valueKey, index + 1);
      expect(result).toMatchObject({ status: "ready", memoryIndex: 0, valueKey,
        focus: { requestId, addressSpace: "global", allocationOrdinal: "1", generation: "0", byteOffset: "0" } });
      if (result.status !== "ready") return;
      const projection = projectResourceMemoryResponse(checkpoint.memories[0].response, checkpoint.anchor);
      expect(projectResourcePointerMemoryFocus(projection, result.focus, recording.context)).toEqual({ status: "ready", page: 0, byteWithinPage: 0 });
    }
  }
  expect(input).toEqual(retainedResourceExcerpt());
});

it("does not reinterpret a scalar, unavailable row or absent SSA identity as a pointer", async () => {
  expect(navigate(await load(), "0:1:24").status).toBe("unavailable");
  expect(navigate(await load(), "0:1:999").status).toBe("unavailable");
  const recording = await synthetic();
  const value = pointer(recording); Object.keys(value).forEach(key => delete value[key]);
  Object.assign(value, { status: "unavailable", reason: "not_captured" });
  expect(navigate(recording).status).toBe("unavailable");
});

describe("synthetic negative controls, not retained observations", () => {
  it.each(["allocation", "address-space", "generation", "outside", "u64-max", "u64-overflow", "inexact-number"])("refuses %s mismatch without numeric rounding", async kind => {
    const recording = await synthetic(), value = pointer(recording);
    if (kind === "allocation") value.value.allocation.ordinal = 9_007_199_254_740_993n;
    if (kind === "address-space") value.value_type.address_space = "generic";
    if (kind === "generation") value.value.allocation.generation = 1;
    if (kind === "outside") value.value.byte_offset = 24;
    if (kind === "u64-max") value.value.byte_offset = 18_446_744_073_709_551_615n;
    if (kind === "u64-overflow") value.value.byte_offset = 18_446_744_073_709_551_616n;
    if (kind === "inexact-number") value.value.byte_offset = Number.MAX_SAFE_INTEGER + 1;
    expect(navigate(recording).status).not.toBe("ready");
  });

  it.each(["scope", "site", "frame", "occurrence", "configuration", "revision", "request"])("refuses changed %s instead of joining a different observation", async kind => {
    const recording = await synthetic(), pair = recording.checkpoints[0].memories[0];
    const response = pair.response as MutableResourceControl;
    if (kind === "scope") response.result.snapshot.scope.lane = 1;
    if (kind === "site") response.result.snapshot.site.kir.block_ordinal += 1;
    if (kind === "frame") Object.assign(response.result.snapshot, { frame: 2, occurrence: 1 });
    if (kind === "occurrence") Object.assign(response.result.snapshot, { frame: 1, occurrence: 2 });
    if (kind === "configuration") response.session.configuration_identity = "a".repeat(64);
    if (kind === "revision") response.session.revision += 1;
    if (kind === "request") (pair.request as MutableResourceControl).byte_len -= 1;
    expect(navigate(recording).status).not.toBe("ready");
  });

  it("never falls back to the equal-address earlier or later checkpoint", async () => {
    const recording = await synthetic();
    recording.checkpoints[0].memories = [];
    expect(navigate(recording).status).toBe("unavailable");
    expect(projectResourcePointerMemoryNavigation(recording, structuredClone(recording.checkpoints[1]), "0:1:12", 1).status).toBe("stale");
  });

  it("requires an explicit choice for multiple matching current windows", async () => {
    const recording = await synthetic(), checkpoint = recording.checkpoints[0];
    const duplicate = structuredClone(checkpoint.memories[0]);
    duplicate.requestId = 99;
    (duplicate.request as MutableResourceControl).request_id = 99;
    (duplicate.response as MutableResourceControl).request_id = 99;
    checkpoint.memories = [...checkpoint.memories, duplicate]; recording.pairs = [...recording.pairs, duplicate];
    expect(navigate(recording)).toMatchObject({ status: "ambiguous", windows: [{ requestId: 11, memoryIndex: 0 }, { requestId: 99, memoryIndex: 1 }] });
    expect(navigate(recording, "0:1:12", 99)).toMatchObject({ status: "ready", memoryIndex: 1, focus: { requestId: 99 } });
    expect(navigate(recording, "0:1:12", 15).status).toBe("stale");
    checkpoint.memories = [...checkpoint.memories, duplicate];
    expect(navigate(recording).status).toBe("stale");
  });

  it("distinguishes retained uninitialized storage from missing or truncated coverage", async () => {
    const recording = await synthetic(), retained = memory(recording);
    retained.availability.initialized = "0x000000";
    expect(navigate(recording).status).toBe("ready"); // Raw retained byte, not an initialized value.
    retained.returned_bytes = 4; retained.availability.bytes = "0xd5010000";
    retained.availability.initialized = "0x00"; retained.availability.truncated = true;
    pointer(recording).value.byte_offset = 4;
    expect(navigate(recording).status).toBe("unavailable");
    retained.returned_bytes = 0; retained.availability = { status: "unavailable", reason: "not_represented" };
    expect(navigate(recording).status).toBe("unavailable");
  });

  it("rejects changed capture fences, omitted membership, excessive windows and unsupported SSA tables", async () => {
    const changed = await synthetic(); changed.context.captureIdentity = "a".repeat(64);
    expect(navigate(changed).status).toBe("invalid");
    const omitted = await synthetic(); omitted.pairs = omitted.pairs.filter(pair => pair.requestId !== 11);
    expect(navigate(omitted).status).toBe("stale");
    const oversized = await synthetic(); oversized.checkpoints[0].memories = Array(129).fill(oversized.checkpoints[0].memories[0]);
    expect(navigate(oversized).status).toBe("invalid");
    const unsupported = await synthetic(); pointer(unsupported).provenance = "hardware_observation";
    expect(navigate(unsupported).status).toBe("unsupported");
  });
});

it.each(["bytes", "initialization", "context", "anchor", "request", "space"])("renderer refuses stale %s even with reused request/allocation IDs", async kind => {
  const { recording, result, projection } = await actualFocus(), changed = structuredClone(projection);
  if (changed.memory.availability.status !== "captured") throw new Error("expected captured");
  if (kind === "bytes") changed.memory.availability.bytes = "0xff" + changed.memory.availability.bytes.slice(4);
  if (kind === "initialization") changed.memory.availability.initialized = "0x000000";
  const context = { ...recording.context };
  if (kind === "context") context.target = "gfx942";
  if (kind === "anchor") changed.anchor.cursor.state_revision += 1;
  if (kind === "request") changed.requestId += 1;
  if (kind === "space") changed.memory.availability.address_space = "generic";
  expect(projectResourcePointerMemoryFocus(changed, result.focus, context).status).toBe("stale");
});

it("synthetic arithmetic controls cover viewport endpoints and u64 offsets without native-pointer claims", async () => {
  const { recording, result, projection } = await actualFocus(), changed = structuredClone(projection);
  changed.memory.byte_offset = Number.MAX_SAFE_INTEGER - 4096;
  changed.memory.requested_bytes = 4096; changed.memory.returned_bytes = 4096;
  changed.memory.availability = { status: "captured", address_space: "global", bytes: "0x" + "a5".repeat(4096), initialized: "0x" + "00".repeat(512), truncated: false };
  for (const [relative, page, byteWithinPage] of [[0, 0, 0], [255, 0, 255], [256, 1, 0], [4095, 15, 255]]) {
    const focus = { ...result.focus, memoryKey: JSON.stringify(changed.memory), byteOffset: String(BigInt(changed.memory.byte_offset) + BigInt(relative)) };
    expect(projectResourcePointerMemoryFocus(changed, focus, recording.context)).toEqual({ status: "ready", page, byteWithinPage });
  }
  for (const offset of [BigInt(changed.memory.byte_offset) - 1n, BigInt(changed.memory.byte_offset) + 4096n, 0xffff_ffff_ffff_ffffn]) {
    expect(projectResourcePointerMemoryFocus(changed, { ...result.focus, memoryKey: JSON.stringify(changed.memory), byteOffset: String(offset) }, recording.context).status).toBe("unavailable");
  }
  expect(projectResourcePointerMemoryFocus(changed, { ...result.focus, byteOffset: "18446744073709551616" }, recording.context).status).toBe("invalid");
});
