import { describe, expect, it } from "vitest";
import retained from "../examples/debugger_workbench_v1.json";
import {
  projectResourceMemoryResponse,
  resourceMemoryCells,
  resourceSnapshotAnchorKey,
  RESOURCE_MEMORY_MAX_BYTES,
} from "../src/content/resource-memory-view";

// This golden is a real Rust debugger response for the retained hand-built KIR
// fill example. It is CPU evidence, and does not establish Rust source custody.
const actual = retained.memory;
const selected = actual.result.snapshot;

function withMemory(overrides: Record<string, unknown>) {
  return { ...actual, result: { ...actual.result, memory: { ...actual.result.memory, ...overrides } } };
}

describe("bounded resource memory presentation", () => {
  it("preserves the exact existing backend response and initialization bitmap", () => {
    const projection = projectResourceMemoryResponse(actual, selected);
    expect(projection.status).toBe("ready");
    if (projection.status !== "ready") throw new Error("expected retained response");
    expect(projection.anchor).toEqual(selected);
    expect(projection.memory).toEqual(actual.result.memory);
    expect(resourceMemoryCells(projection.memory, 0, 1)).toEqual([
      { byteOffset: 0, byteLength: 1, bytes: "0x11", initialized: [true] },
      { byteOffset: 1, byteLength: 1, bytes: "0x00", initialized: [true] },
      { byteOffset: 2, byteLength: 1, bytes: "0x00", initialized: [true] },
      { byteOffset: 3, byteLength: 1, bytes: "0x00", initialized: [true] },
    ]);
    expect(projection.anchor.site?.source.status).toBe("unavailable");
  });

  it("compares complete anchors independently of JSON field ordering", () => {
    expect(resourceSnapshotAnchorKey(selected)).toBe(resourceSnapshotAnchorKey({
      site: selected.site, scope: selected.scope, cursor: selected.cursor,
    }));
    expect(projectResourceMemoryResponse(actual, { ...selected, frame: 1, occurrence: 2 }).status).toBe("stale");
    expect(resourceSnapshotAnchorKey({ ...selected, frame: 1 })).toBeNull();
    expect(resourceSnapshotAnchorKey({ ...selected, occurrence: null })).toBeNull();
  });

  it.each([
    { ...selected, cursor: { ...selected.cursor, configuration_identity: "12".repeat(32) } },
    { ...selected, cursor: { ...selected.cursor, event_sequence: selected.cursor.event_sequence + 1 } },
    { ...selected, cursor: { ...selected.cursor, state_revision: selected.cursor.state_revision + 1 } },
    { ...selected, scope: { ...selected.scope, workgroup: [1, 0, 0] } },
    { ...selected, scope: { ...selected.scope, lane: 1, logical_workitem: [1, 0, 0] } },
    { ...selected, site: { ...selected.site, kir: { ...selected.site.kir, function_ordinal: 1 } } },
    { ...selected, site: { ...selected.site, source: { status: "unavailable", reason: "not_represented" } } },
  ])("rejects a stale configuration, occurrence, lane or source selection %#", (anchor) => {
    expect(projectResourceMemoryResponse(actual, anchor).status).toBe("stale");
  });

  it("rejects inconsistent session and snapshot cursors", () => {
    const response = { ...actual, session: { ...actual.session, revision: actual.session.revision + 1 } };
    expect(projectResourceMemoryResponse(response, selected).status).toBe("stale");
    expect(projectResourceMemoryResponse({ ...actual, session: { ...actual.session, state: "running" } }, selected).status).toBe("stale");
  });

  it("binds every field of synthetic source-map and helper-occurrence format fixtures", () => {
    // These invented identities exercise presentation rejection only.
    const location = {
      map_identity: "ab".repeat(32), file_identity: "cd".repeat(32),
      provenance: "caller_bound", byte_start: 20, byte_end: 40,
    };
    const sourceAnchor = {
      ...selected, frame: 3, occurrence: 4,
      site: { ...selected.site, source: { status: "resolved", location } },
    };
    const response = { ...actual, result: { ...actual.result, snapshot: sourceAnchor } };
    expect(projectResourceMemoryResponse(response, sourceAnchor).status).toBe("ready");
    for (const changed of [
      { map_identity: "ef".repeat(32) }, { file_identity: "ef".repeat(32) },
      { byte_start: 21 }, { byte_end: 41 }, { provenance: "compiler_bundle_bound" },
    ]) {
      expect(projectResourceMemoryResponse(response, {
        ...sourceAnchor, site: { ...sourceAnchor.site, source: { status: "resolved", location: { ...location, ...changed } } },
      }).status).toBe("stale");
    }
    expect(projectResourceMemoryResponse(response, { ...sourceAnchor, occurrence: 5 }).status).toBe("stale");
    expect(projectResourceMemoryResponse(response, { ...sourceAnchor, frame: 4 }).status).toBe("stale");
  });

  it("keeps synthetic generation/range cases distinct without declaring execution evidence", () => {
    const projection = projectResourceMemoryResponse(withMemory({ allocation: { ordinal: 1, generation: 7 }, byte_offset: 15 }), selected);
    expect(projection.status).toBe("ready");
    if (projection.status !== "ready") throw new Error("expected format fixture");
    expect(projection.memory.allocation.generation).toBe(7);
    expect(resourceMemoryCells(projection.memory, 0, 4)[0].byteOffset).toBe(15);
  });

  it("rejects inexact integer metadata instead of rounding identities or offsets", () => {
    expect(projectResourceMemoryResponse(withMemory({ byte_offset: Number.MAX_SAFE_INTEGER }), selected).status).toBe("invalid");
    expect(projectResourceMemoryResponse(withMemory({ allocation: { ordinal: 2 ** 53, generation: 0 } }), selected).status).toBe("invalid");
    expect(resourceSnapshotAnchorKey({ ...selected, cursor: { ...selected.cursor, event_sequence: 2 ** 53 } })).toBeNull();
    expect(resourceSnapshotAnchorKey({ ...selected, scope: { ...selected.scope, active_mask: 2 ** 63 } })).toBeNull();
  });

  it("bounds the retained response and rejects malformed initialization bits", () => {
    expect(projectResourceMemoryResponse(withMemory({ requested_bytes: RESOURCE_MEMORY_MAX_BYTES + 1 }), selected).status).toBe("invalid");
    for (const initialized of ["0xff", "0x", "1111", "0x0F"]) {
      expect(projectResourceMemoryResponse(withMemory({ availability: { ...actual.result.memory.availability, initialized } }), selected).status).toBe("invalid");
    }
    expect(projectResourceMemoryResponse(withMemory({ availability: { ...actual.result.memory.availability, bytes: "0x00" } }), selected).status).toBe("invalid");
    expect(projectResourceMemoryResponse(withMemory({ native_address: "0x1234" }), selected).status).toBe("invalid");
  });

  it("rejects coerced address spaces and missing coordinate elements", () => {
    for (const addressSpace of [["global"], { toString: () => "global" }, null, 0]) {
      expect(projectResourceMemoryResponse(withMemory({
        availability: { ...actual.result.memory.availability, address_space: addressSpace },
      }), selected).status).toBe("invalid");
    }
    const sparse = Array<number>(3);
    sparse[0] = 0;
    sparse[2] = 0;
    for (const field of ["workgroup", "logical_workitem"]) {
      const malformed = { ...selected, scope: { ...selected.scope, [field]: sparse } };
      expect(resourceSnapshotAnchorKey(malformed)).toBeNull();
      expect(projectResourceMemoryResponse(actual, malformed).status).toBe("invalid");
      expect(projectResourceMemoryResponse({
        ...actual, result: { ...actual.result, snapshot: malformed },
      }, selected).status).toBe("invalid");
    }
  });

  it("keeps missing memory unavailable and forbids hidden bytes on that response", () => {
    const projection = projectResourceMemoryResponse(withMemory({
      returned_bytes: 0, availability: { status: "unavailable", reason: "not_captured" },
    }), selected);
    expect(projection.status).toBe("ready");
    if (projection.status !== "ready") throw new Error("expected unavailable response");
    expect(resourceMemoryCells(projection.memory, 0, 1)).toEqual([]);
    expect(projectResourceMemoryResponse(withMemory({
      availability: { status: "unavailable", reason: "not_captured" },
    }), selected).status).toBe("invalid");
  });

  it("preserves a backend unavailable response without inventing a snapshot", () => {
    const response = {
      status: "unavailable", schema: actual.schema, request_id: 42,
      operation: "read_memory", session: actual.session,
      unavailable: {
        capability: "allocation_relative_memory", reason: "not_captured", state_changed: false,
        detail: "the current cursor has no captured operation memory snapshot",
      },
    };
    expect(projectResourceMemoryResponse(response, selected)).toEqual({
      status: "unavailable",
      detail: "Memory unavailable: not_captured. the current cursor has no captured operation memory snapshot",
    });
    expect(projectResourceMemoryResponse(response, {
      ...selected, cursor: { ...selected.cursor, state_revision: 8 },
    }).status).toBe("stale");
  });

  it("preserves partial final dwords and uninitialized captured storage", () => {
    const projection = projectResourceMemoryResponse(withMemory({
      byte_offset: 8, requested_bytes: 8, returned_bytes: 5,
      availability: { status: "captured", address_space: "global", bytes: "0x0001020304", initialized: "0x15", truncated: true },
    }), selected);
    if (projection.status !== "ready") throw new Error("expected bounded format fixture");
    expect(resourceMemoryCells(projection.memory, 0, 4)).toEqual([
      { byteOffset: 8, byteLength: 4, bytes: "0x00010203", initialized: [true, false, true, false] },
      { byteOffset: 12, byteLength: 1, bytes: "0x04", initialized: [true] },
    ]);
  });

  it("pages a synthetic 257-byte format fixture without dropping the last byte", () => {
    const projection = projectResourceMemoryResponse(withMemory({
      byte_offset: 100, requested_bytes: 257, returned_bytes: 257,
      availability: { status: "captured", address_space: "workgroup", bytes: `0x${"00".repeat(257)}`, initialized: `0x${"ff".repeat(32)}01`, truncated: false },
    }), selected);
    if (projection.status !== "ready") throw new Error("expected format fixture");
    expect(resourceMemoryCells(projection.memory, 0, 1)).toHaveLength(256);
    expect(resourceMemoryCells(projection.memory, 0, 4)).toHaveLength(64);
    expect(resourceMemoryCells(projection.memory, 1, 4)).toEqual([
      { byteOffset: 356, byteLength: 1, bytes: "0x00", initialized: [true] },
    ]);
    expect(resourceMemoryCells(projection.memory, 2, 1)).toEqual([]);
    expect(resourceMemoryCells(projection.memory, -1, 1)).toEqual([]);
  });

  it("rejects upgrading simulator evidence into hardware or performance evidence", () => {
    for (const truth of [
      { hardware_observed: true }, { performance_prediction: true }, { simulated: false },
      { backend: "kfd_hardware", execution_kind: "kfd_hardware", simulated: false, hardware_observed: true },
    ]) {
      expect(projectResourceMemoryResponse({ ...actual, session: { ...actual.session, ...truth } }, selected).status).toBe("unsupported");
    }
  });
});
