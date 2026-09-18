import { describe, expect, it } from "vitest";
import retained from "../examples/debugger_workbench_v1.json";
import type { ResourceSnapshotAnchor } from "../src/content/resource-memory-view";
import {
  createResourceMemoryController,
  RESOURCE_MEMORY_MAX_DETAIL_LENGTH,
  RESOURCE_MEMORY_MAX_REQUESTS,
  type ResourceMemorySelection,
  type ResourceMemoryTicket,
} from "../src/lib/resource-memory-controller";

// The exact retained backend response is KIR-produced CPU evidence. Mutations
// below are transport/selection format tests, not new execution qualification.
const actual = retained.memory;

function selection(): ResourceMemorySelection {
  return {
    context: {
      connectionId: "retained-fill-session-1",
      captureIdentity: retained.source.protocol_responses_sha256,
      target: null,
      variantIdentity: null,
    },
    snapshot: structuredClone(actual.result.snapshot) as ResourceSnapshotAnchor,
    allocation: { ...actual.result.memory.allocation },
    byteOffset: actual.result.memory.byte_offset,
    byteLength: actual.result.memory.requested_bytes,
  };
}

function ticketOrThrow(ticket: ResourceMemoryTicket | null): ResourceMemoryTicket {
  if (!ticket) throw new Error("expected a bounded explicit query ticket");
  return ticket;
}

function responseAt(requestId: number, chosen = selection()) {
  return {
    ...structuredClone(actual),
    request_id: requestId,
    session: {
      ...actual.session,
      revision: chosen.snapshot.cursor.state_revision,
      configuration_identity: chosen.snapshot.cursor.configuration_identity,
      cursor: { ...chosen.snapshot.cursor },
    },
    result: { ...actual.result, snapshot: structuredClone(chosen.snapshot) },
  };
}

describe("exact asynchronous memory query controller", () => {
  it("issues only the existing read_memory query and accepts its actual retained response", () => {
    const controller = createResourceMemoryController();
    expect(controller.getState()).toEqual({ status: "idle", selection: null });
    controller.select(selection());
    expect(controller.getState().status).toBe("idle");
    const ticket = ticketOrThrow(controller.begin(12));
    expect(ticket.request).toEqual({
      operation: "read_memory", schema: "fe2o3-debug-request-v1", request_id: 12,
      expected_revision: 6, allocation: { ordinal: 1, generation: 0 }, byte_offset: 0, byte_len: 4,
    });
    expect(controller.getState().status).toBe("pending");
    expect(ticket.signal.aborted).toBe(false);
    expect(controller.receive(ticket, actual)).toBe(true);
    const state = controller.getState();
    expect(state.status).toBe("ready");
    if (state.status !== "ready") throw new Error("expected captured CPU memory");
    expect(state.response).toEqual(actual);
    expect(state.selection.context.target).toBeNull();
    expect(state.projection.status).toBe("ready");
    expect(controller.receive(ticket, actual)).toBe(false);
    expect(controller.getState()).toBe(state);
  });

  it.each([
    ["cursor", (value: ResourceMemorySelection) => { value.snapshot.cursor.event_sequence += 1; }],
    ["revision", (value: ResourceMemorySelection) => { value.snapshot.cursor.state_revision += 1; }],
    ["configuration", (value: ResourceMemorySelection) => { value.snapshot.cursor.configuration_identity = "ab".repeat(32); }],
    ["connection", (value: ResourceMemorySelection) => { value.context.connectionId = "replacement-session"; }],
    ["capture", (value: ResourceMemorySelection) => { value.context.captureIdentity = "ab".repeat(32); }],
    ["target", (value: ResourceMemorySelection) => { value.context.target = "gfx942:xnack-"; }],
    ["variant", (value: ResourceMemorySelection) => { value.context.variantIdentity = "ab".repeat(32); }],
    ["allocation", (value: ResourceMemorySelection) => { value.allocation.ordinal += 1; }],
    ["allocation generation", (value: ResourceMemorySelection) => { value.allocation.generation += 1; }],
    ["range offset", (value: ResourceMemorySelection) => { value.byteOffset += 4; }],
    ["range length", (value: ResourceMemorySelection) => { value.byteLength += 4; }],
    ["lane", (value: ResourceMemorySelection) => {
      if (value.snapshot.scope.level !== "lane") throw new Error("expected lane");
      value.snapshot.scope.lane = 1;
      value.snapshot.scope.logical_workitem = [1, 0, 0];
    }],
    ["workgroup", (value: ResourceMemorySelection) => {
      if (value.snapshot.scope.level === "dispatch") throw new Error("expected workgroup scope");
      value.snapshot.scope.workgroup = [1, 0, 0];
    }],
    ["occurrence", (value: ResourceMemorySelection) => { value.snapshot.frame = 1; value.snapshot.occurrence = 2; }],
  ] as const)("invalidates old completions after a %s selection change", (_, change) => {
    const controller = createResourceMemoryController();
    controller.select(selection());
    const old = ticketOrThrow(controller.begin(12));
    const next = selection();
    change(next);
    controller.select(next);
    expect(old.signal.aborted).toBe(true);
    expect(controller.getState().status).toBe("idle");
    expect(controller.receive(old, actual)).toBe(false);
    expect(controller.fail(old, "late transport failure")).toBe(false);
    expect(controller.getState().status).toBe("idle");
  });

  it("rejects reverse navigation to the same event with a newer revision and session", () => {
    const controller = createResourceMemoryController();
    controller.select(selection());
    const original = ticketOrThrow(controller.begin(12));
    const reverse = selection();
    reverse.snapshot.cursor.state_revision = 8;
    reverse.context.connectionId = "reverse-replay-session-2";
    controller.select(reverse);
    const current = ticketOrThrow(controller.begin(13));
    expect(controller.receive(original, actual)).toBe(false);
    expect(controller.receive(current, responseAt(13, reverse))).toBe(true);
    expect(controller.getState().status).toBe("ready");
    expect(controller.getState().selection?.snapshot.cursor.event_sequence).toBe(9);
    expect(controller.getState().selection?.snapshot.cursor.state_revision).toBe(8);
  });

  it("keeps the newer result when promises resolve out of order", async () => {
    const controller = createResourceMemoryController();
    controller.select(selection());
    const first = ticketOrThrow(controller.begin(12));
    let resolveFirst: (value: unknown) => void = () => { throw new Error("missing resolver"); };
    const firstResponse = new Promise<unknown>((resolve) => { resolveFirst = resolve; });
    const firstCompletion = firstResponse.then((response) => controller.receive(first, response));
    const second = ticketOrThrow(controller.begin(13));
    expect(first.signal.aborted).toBe(true);
    expect(controller.receive(second, responseAt(13))).toBe(true);
    const newer = controller.getState();
    resolveFirst(actual);
    expect(await firstCompletion).toBe(false);
    expect(controller.getState()).toBe(newer);
  });

  it("rejects copied tickets and mismatched request IDs without exposing bytes", () => {
    const controller = createResourceMemoryController();
    controller.select(selection());
    const ticket = ticketOrThrow(controller.begin(12));
    expect(controller.receive({ ...ticket }, actual)).toBe(false);
    expect(controller.getState().status).toBe("pending");
    expect(controller.receive(ticket, responseAt(13))).toBe(true);
    expect(controller.getState().status).toBe("error");
    expect(controller.getState()).not.toHaveProperty("response");
    expect(controller.receive(ticket, actual)).toBe(false);
  });

  it.each([
    { allocation: { ordinal: 2, generation: 0 } },
    { allocation: { ordinal: 1, generation: 1 } },
    { byte_offset: 4 },
    { requested_bytes: 8 },
  ])("rejects a same-snapshot response for a different allocation or range %#", (change) => {
    const controller = createResourceMemoryController();
    controller.select(selection());
    const ticket = ticketOrThrow(controller.begin(12));
    controller.receive(ticket, {
      ...actual, result: { ...actual.result, memory: { ...actual.result.memory, ...change } },
    });
    expect(controller.getState().status).toBe("error");
    expect(controller.getState()).not.toHaveProperty("response");
  });

  it("copies caller-owned selections and accepted responses, and freezes tickets/state", () => {
    const controller = createResourceMemoryController();
    const chosen = selection();
    controller.select(chosen);
    chosen.byteOffset = 100;
    chosen.snapshot.cursor.state_revision = 100;
    chosen.context.connectionId = "mutated-session";
    const ticket = ticketOrThrow(controller.begin(12));
    expect(ticket.request.byte_offset).toBe(0);
    expect(ticket.request.expected_revision).toBe(6);
    expect(() => { ticket.request.allocation.generation = 99; }).toThrow(TypeError);
    const response = structuredClone(actual);
    controller.receive(ticket, response);
    response.result.memory.availability.bytes = "0xffffffff";
    response.result.snapshot.scope.lane = 3;
    const state = controller.getState();
    expect(state.status).toBe("ready");
    if (state.status !== "ready") throw new Error("expected response");
    expect(state.response).toEqual(actual);
    expect(() => { state.selection.byteOffset = 200; }).toThrow(TypeError);
    expect(state.selection.context.connectionId).toBe("retained-fill-session-1");
  });

  it("cancels and disconnects explicitly, ignoring late completion and failure", () => {
    const controller = createResourceMemoryController();
    controller.select(selection());
    const cancelled = ticketOrThrow(controller.begin(12));
    let lateAccepted = true;
    cancelled.signal.addEventListener("abort", () => { lateAccepted = controller.receive(cancelled, actual); });
    controller.cancel();
    expect(cancelled.signal.aborted).toBe(true);
    expect(lateAccepted).toBe(false);
    expect(controller.getState().status).toBe("cancelled");
    const disconnected = ticketOrThrow(controller.begin(13));
    controller.disconnect();
    expect(disconnected.signal.aborted).toBe(true);
    expect(controller.getState()).toMatchObject({ status: "disconnected", selection: null });
    expect(controller.fail(disconnected, "late failure")).toBe(false);
    expect(controller.receive(disconnected, responseAt(13))).toBe(false);
    expect(controller.begin(14)).toBeNull();
  });

  it("clears previous bytes immediately when selecting or starting another query", () => {
    const controller = createResourceMemoryController();
    controller.select(selection());
    controller.receive(ticketOrThrow(controller.begin(12)), actual);
    const next = ticketOrThrow(controller.begin(13));
    expect(controller.getState().status).toBe("pending");
    expect(controller.getState()).not.toHaveProperty("response");
    controller.receive(next, responseAt(13));
    controller.select(null);
    expect(controller.getState()).toEqual({ status: "idle", selection: null });
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53, "12", "1".repeat(1000)])("rejects invalid request ID %#", (requestId) => {
    const controller = createResourceMemoryController();
    controller.select(selection());
    expect(controller.begin(requestId)).toBeNull();
    expect(controller.getState().status).toBe("error");
  });

  it("rejects repeated IDs and limits total requests without retaining a history", () => {
    const controller = createResourceMemoryController();
    controller.select(selection());
    ticketOrThrow(controller.begin(12));
    expect(controller.begin(12)).toBeNull();
    expect(controller.begin(11)).toBeNull();
    for (let index = 1; index < RESOURCE_MEMORY_MAX_REQUESTS; index += 1) {
      ticketOrThrow(controller.begin(12 + index));
    }
    expect(controller.begin(12 + RESOURCE_MEMORY_MAX_REQUESTS)).toBeNull();
    expect(controller.getState().status).toBe("error");
    expect(controller.getState()).not.toHaveProperty("response");
  });

  it("rejects malformed/oversized queries and clears an existing selection", () => {
    for (const changed of [
      { byteLength: 4097 }, { byteLength: 0 }, { byteOffset: Number.MAX_SAFE_INTEGER },
      { allocation: { ordinal: 1, generation: 2 ** 53 } },
      { context: { ...selection().context, connectionId: "a".repeat(129) } },
      { context: { ...selection().context, target: "gfx942\n" } },
      { context: { ...selection().context, variantIdentity: "00".repeat(32) } },
      { context: { ...selection().context, captureIdentity: "short" } },
      { compile: true },
    ]) {
      const controller = createResourceMemoryController();
      controller.select(selection());
      const previous = ticketOrThrow(controller.begin(12));
      controller.select({ ...selection(), ...changed });
      expect(previous.signal.aborted).toBe(true);
      expect(controller.getState()).toMatchObject({ status: "error", selection: null });
      expect(controller.begin(13)).toBeNull();
    }
  });

  it.each(["unavailable", "redacted", "partial", "truncated"])("retains %s as unavailable for the complete requested window", (kind) => {
    const controller = createResourceMemoryController();
    controller.select(selection());
    const ticket = ticketOrThrow(controller.begin(12));
    const memory = kind === "unavailable" || kind === "redacted" ? {
      ...actual.result.memory, returned_bytes: 0,
      availability: { status: kind, reason: kind === "redacted" ? "policy" : "not_captured" },
    } : kind === "partial" ? {
      ...actual.result.memory, returned_bytes: 1,
      availability: { ...actual.result.memory.availability, bytes: "0x11", initialized: "0x01", truncated: false },
    } : { ...actual.result.memory, availability: { ...actual.result.memory.availability, truncated: true } };
    expect(controller.receive(ticket, { ...actual, result: { ...actual.result, memory } })).toBe(true);
    expect(controller.getState().status).toBe("unavailable");
    expect(controller.getState()).toHaveProperty("response");
  });

  it("accepts request-bound backend unavailability without inventing bytes or a snapshot", () => {
    const controller = createResourceMemoryController();
    controller.select(selection());
    const ticket = ticketOrThrow(controller.begin(12));
    controller.receive(ticket, {
      status: "unavailable", schema: actual.schema, request_id: 12,
      operation: actual.operation, session: actual.session,
      unavailable: { capability: "allocation_relative_memory", reason: "not_captured", state_changed: false, detail: "No captured memory at this checkpoint." },
    });
    expect(controller.getState().status).toBe("unavailable");
  });

  it("bounds transport failures and never retains failed response data", () => {
    for (const detail of ["Disconnected", "x".repeat(10000), { message: "error" }, "bad\nmessage", null]) {
      const controller = createResourceMemoryController();
      controller.select(selection());
      const ticket = ticketOrThrow(controller.begin(12));
      expect(controller.fail(ticket, detail)).toBe(true);
      const state = controller.getState();
      expect(state.status).toBe("error");
      if (state.status !== "error") throw new Error("expected error state");
      expect(state.detail.length).toBeLessThanOrEqual(RESOURCE_MEMORY_MAX_DETAIL_LENGTH);
      expect(state).not.toHaveProperty("response");
      expect(ticket.signal.aborted).toBe(true);
    }
  });
});
