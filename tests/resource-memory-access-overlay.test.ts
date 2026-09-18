import { describe, expect, it } from "vitest";
import retained from "../examples/source_lds_multi_workgroup_v1.json";
import { projectResourceAccessResponse } from "../src/content/resource-access-view";
import { resourceAccessNavigation } from "../src/content/resource-access-navigation";
import { resourceMemoryAccessOverlay, resourceMemoryAccessCell, type ResourceMemoryAccessOverlayInput } from "../src/content/resource-memory-access-overlay";
import { projectResourceMemoryResponse, resourceMemoryCells } from "../src/content/resource-memory-view";

function fixture(checkpoint = 5, accessPage = 0, memoryWindow = 0) {
  const stop = structuredClone(retained.checkpoints[checkpoint]), pair = stop.accessPages[accessPage];
  const memory = stop.memories[memoryWindow].response;
  const input: ResourceMemoryAccessOverlayInput = { memoryContext: { ...retained.context }, selection: null,
    access: { response: pair.response, expectedRequest: pair.request, expectedSnapshot: stop.expectedSnapshot,
      context: retained.context, responseContext: retained.context } };
  return { stop, pair, memory, input,
    view: (page = 0) => resourceMemoryAccessOverlay(projectResourceMemoryResponse(memory, stop.expectedSnapshot), input, page) };
}
function select(input: ResourceMemoryAccessOverlayInput) {
  const page = projectResourceAccessResponse(input.access);
  if (page.status !== "ready" || page.kind !== "memory_accesses") throw new Error("Expected retained access page");
  return resourceAccessNavigation(page, null).selection;
}

describe("historical access over current checkpoint storage", () => {
  it("joins the real WG1 write range without changing storage or initialization", () => {
    const f = fixture(), original = structuredClone(f.memory), overlay = f.view();
    expect(overlay.status).toBe("ready");
    expect(overlay.access).toEqual({ eventSequence: 16090, marker: "W", kind: "write_committed", start: "0", end: "4" });
    expect(overlay.overlap).toEqual({ start: "0", end: "4" });
    const projected = projectResourceMemoryResponse(f.memory, f.stop.expectedSnapshot);
    if (projected.status !== "ready") throw new Error("Expected captured memory");
    const cells = resourceMemoryCells(projected.memory, 0, 1);
    expect(cells.filter((cell) => resourceMemoryAccessCell(overlay, cell))).toHaveLength(4);
    expect(resourceMemoryAccessCell(overlay, cells[4])).toBeNull();
    expect(f.memory).toEqual(original);
    expect(overlay.historyNotice).toContain("Unmarked bytes do not establish no activity");
  });

  it("does not paint real WG0 history onto WG1 allocation 3 or fill an empty continuation page", () => {
    const wrong = fixture(4), empty = fixture(4, 1);
    expect(wrong.view().status).toBe("different_allocation");
    expect(wrong.view().access?.eventSequence).toBe(12);
    expect(wrong.view().overlap).toBeNull();
    expect(empty.view().status).toBe("no_selection");
    expect(empty.view().historyNotice).toContain("More backend pages exist");
    expect(empty.view().access).toBeNull();
  });

  it("keeps a real global access off-window until its existing byte viewport is selected", () => {
    const f = fixture(6, 1);
    expect(f.view(0).status).toBe("off_window");
    expect(f.view(1).overlap).toEqual({ start: "256", end: "260" });
    expect(f.view(2).status).toBe("off_window");
    expect(f.view(2).access).toEqual(f.view(1).access);
    expect(f.view(3).status).toBe("invalid");
    expect(f.view(-1).status).toBe("invalid");
    expect(f.view(0.5).status).toBe("invalid");
  });

  it.each(["connectionId", "captureIdentity", "target", "variantIdentity"] as const)("rejects changed memory %s", (field) => {
    const f = fixture(); f.input.memoryContext[field] = field.endsWith("Identity") ? "12".repeat(32) : "other-context";
    expect(f.view().status).toBe("stale"); expect(f.view().overlap).toBeNull();
  });

  it("does not collapse missing or undefined context fields into an explicit null", () => {
    const f = fixture();
    f.input.access.context = { ...retained.context, target: null };
    f.input.access.responseContext = { ...retained.context, target: null };
    f.input.memoryContext.target = null;
    expect(f.view().status).toBe("ready");
    Object.defineProperty(f.input.memoryContext, "target", { value: undefined });
    expect(f.view().status).toBe("stale");
    Reflect.deleteProperty(f.input.memoryContext, "target");
    expect(f.view().status).toBe("stale");
    Object.assign(f.input.memoryContext, { target: null, extra: "not-a-context-field" });
    expect(f.view().status).toBe("stale");
  });

  it("compares source, frame, occurrence, scope and every cursor field, not just event sequence", () => {
    const f = fixture(), anchor = f.stop.expectedSnapshot;
    const changed = [
      { ...anchor, cursor: { ...anchor.cursor, state_revision: anchor.cursor.state_revision + 1 } },
      { ...anchor, cursor: { ...anchor.cursor, event_sequence: anchor.cursor.event_sequence + 1 } },
      { ...anchor, cursor: { ...anchor.cursor, configuration_identity: "12".repeat(32) } },
      { ...anchor, scope: { ...anchor.scope, wave: 1 } },
      { ...anchor, frame: 1, occurrence: 2 },
      { ...anchor, site: { ...anchor.site, source: { status: "unavailable", reason: "not_represented" } } },
    ];
    for (const expectedSnapshot of changed) {
      const memory = projectResourceMemoryResponse(f.memory, expectedSnapshot);
      expect(resourceMemoryAccessOverlay(memory, f.input, 0).overlap).toBeNull();
    }
    // Both responses independently valid, but for different complete anchors.
    const memoryResponse = { ...f.memory, result: { ...f.memory.result, snapshot: changed[4] } };
    const memory = projectResourceMemoryResponse(memoryResponse, changed[4]);
    expect(memory.status).toBe("ready");
    expect(resourceMemoryAccessOverlay(memory, f.input, 0).status).toBe("stale");
  });

  it("rejects stale page selections, changed contents under a reused request ID and unobserved events/scopes", () => {
    const f = fixture(); f.input.selection = select(f.input);
    expect(f.view().status).toBe("ready");
    f.pair.response.result.accesses[0].range.byte_offset = "2";
    expect(f.view().status).toBe("stale");
    f.input.selection = { ...select(f.input), eventSequence: 13 };
    expect(f.view().status).toBe("no_selection");
    f.input.selection = { ...select(f.input), scopeKey: "unobserved-lane" };
    expect(f.view().status).toBe("no_selection");
    f.input.selection = { ...select(f.input), waveKey: "unobserved-wave" };
    expect(f.view().status).toBe("no_selection");
  });

  it("keeps generation and address-space mismatches separate, and unavailable bytes unavailable", () => {
    const f = fixture(); f.memory.result.memory.allocation.generation = 1;
    expect(f.view().status).toBe("different_allocation");
    f.memory.result.memory.allocation.generation = 0;
    f.memory.result.memory.availability.address_space = "global";
    expect(f.view().status).toBe("different_space");
    const unavailable = { ...f.memory, result: { ...f.memory.result, memory: { ...f.memory.result.memory,
      returned_bytes: 0, availability: { status: "unavailable", reason: "not_captured" } } } };
    expect(resourceMemoryAccessOverlay(projectResourceMemoryResponse(unavailable, f.stop.expectedSnapshot), f.input, 0).status).toBe("unavailable");
  });

  it("handles synthetic partial dword and viewport-edge ranges without extending the original access", () => {
    // Format-only mutations; these are not additional backend observations.
    const f = fixture(); Object.assign(f.pair.response.result.accesses[0].range, { byte_offset: "2", byte_len: "3" });
    const overlay = f.view();
    expect(resourceMemoryAccessCell(overlay, { byteOffset: 0, byteLength: 4 })).toEqual({ marker: "W", byteCount: 2 });
    expect(resourceMemoryAccessCell(overlay, { byteOffset: 4, byteLength: 1 })).toEqual({ marker: "W", byteCount: 1 });
    expect(resourceMemoryAccessCell(overlay, { byteOffset: 5, byteLength: 1 })).toBeNull();
    Object.assign(f.pair.response.result.accesses[0].range, { byte_offset: "255", byte_len: "4" });
    expect(f.view().overlap).toEqual({ start: "255", end: "256" });
    expect(f.view().access?.end).toBe("259");
  });

  it("uses canonical u64 BigInt ranges without rounding, coercion or hidden overflow", () => {
    const f = fixture(); Object.assign(f.pair.response.result.accesses[0].range, { byte_offset: "9007199254740993", byte_len: "4" });
    expect(f.view().status).toBe("off_window"); expect(f.view().access?.start).toBe("9007199254740993");
    for (const range of [
      { byte_offset: "01", byte_len: "4" }, { byte_offset: "-1", byte_len: "4" },
      { byte_offset: "0", byte_len: "0" }, { byte_offset: "18446744073709551615", byte_len: "1" },
      { byte_offset: "18446744073709551616", byte_len: "4" },
    ]) {
      Object.assign(f.pair.response.result.accesses[0].range, range);
      expect(f.view().overlap).toBeNull(); expect(f.view().status).toBe("unavailable");
    }
  });

  it("preserves independent read/write/atomic markers and partial-capture notices", () => {
    const f = fixture();
    for (const [kind, marker] of [["read", "R"], ["write_committed", "W"], ["atomic_read", "AR"], ["atomic_write_committed", "AW"], ["atomic_read_write_committed", "AR/W"]]) {
      f.pair.response.result.accesses[0].access = kind;
      expect(f.view().access?.marker).toBe(marker);
    }
    f.input.access.response = { ...f.pair.response, page: { ...f.pair.response.page,
      completeness: { status: "truncated", reason: "event_limit", emitted_events: f.pair.response.page.source_count } } };
    expect(f.view().historyNotice).toContain("Partial retained capture");
  });
});
