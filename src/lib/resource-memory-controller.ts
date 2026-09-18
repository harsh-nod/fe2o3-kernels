import {
  projectResourceMemoryResponse,
  resourceSnapshotAnchorKey,
  RESOURCE_MEMORY_MAX_BYTES,
  type ResourceMemoryProjection,
  type ResourceSnapshotAnchor,
} from "../content/resource-memory-view";

export const RESOURCE_MEMORY_MAX_REQUESTS = 256;
export const RESOURCE_MEMORY_MAX_DETAIL_LENGTH = 256;

/** Caller-owned selection fences, not backend attestations or wire fields. */
export interface ResourceMemoryContext {
  connectionId: string;
  captureIdentity: string | null;
  target: string | null;
  variantIdentity: string | null;
}

export interface ResourceMemorySelection {
  context: ResourceMemoryContext;
  snapshot: ResourceSnapshotAnchor;
  allocation: { ordinal: number; generation: number };
  byteOffset: number;
  byteLength: number;
}

/** The existing DebugRequestV1::ReadMemory shape. No new wire authority. */
export interface ResourceMemoryRequest {
  operation: "read_memory";
  schema: "fe2o3-debug-request-v1";
  request_id: number;
  expected_revision: number;
  allocation: { ordinal: number; generation: number };
  byte_offset: number;
  byte_len: number;
}

export interface ResourceMemoryTicket {
  readonly generation: number;
  readonly request: Readonly<ResourceMemoryRequest>;
  readonly signal: AbortSignal;
}

interface Completion {
  selection: ResourceMemorySelection;
  request: Readonly<ResourceMemoryRequest>;
  response: unknown;
  projection: ResourceMemoryProjection;
}

export type ResourceMemoryState =
  | { status: "idle"; selection: ResourceMemorySelection | null }
  | {
      status: "pending";
      selection: ResourceMemorySelection;
      request: Readonly<ResourceMemoryRequest>;
      generation: number;
    }
  // Ready means this entire requested window was captured at the bound CPU
  // snapshot. It makes no statement about current hardware or other ranges.
  | (Completion & { status: "ready" })
  | (Completion & { status: "unavailable"; detail: string })
  | {
      status: "cancelled" | "error" | "disconnected";
      selection: ResourceMemorySelection | null;
      detail: string;
    };

export interface ResourceMemoryController {
  getState(): ResourceMemoryState;
  /** Explicit selection changes invalidate pending and completed results. */
  select(selection: unknown): ResourceMemoryState;
  /** Use the owning debugger session's shared request-ID allocator. */
  begin(requestId: unknown): ResourceMemoryTicket | null;
  /** Returns false for obsolete, forged, or already completed tickets. */
  receive(ticket: ResourceMemoryTicket, response: unknown): boolean;
  fail(ticket: ResourceMemoryTicket, detail: unknown): boolean;
  cancel(): ResourceMemoryState;
  disconnect(): ResourceMemoryState;
}

type ObjectValue = Record<string, unknown>;

function record(value: unknown): value is ObjectValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: unknown, keys: string[]): value is ObjectValue {
  return record(value) && Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key));
}

function integer(value: unknown, minimum = 0): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum;
}

function digest(value: unknown): boolean {
  return typeof value === "string" && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value);
}

function token(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_.:/+-]{1,128}$/u.test(value);
}

function validSelection(value: unknown): value is ResourceMemorySelection {
  if (!exactKeys(value, ["context", "snapshot", "allocation", "byteOffset", "byteLength"]) ||
      !exactKeys(value.context, ["connectionId", "captureIdentity", "target", "variantIdentity"]) ||
      !token(value.context.connectionId) ||
      !(value.context.captureIdentity === null || digest(value.context.captureIdentity)) ||
      !(value.context.variantIdentity === null || digest(value.context.variantIdentity)) ||
      !(value.context.target === null || token(value.context.target)) ||
      resourceSnapshotAnchorKey(value.snapshot) === null ||
      !exactKeys(value.allocation, ["ordinal", "generation"]) ||
      !integer(value.allocation.ordinal, 1) || !integer(value.allocation.generation) ||
      !integer(value.byteOffset) || !integer(value.byteLength, 1) ||
      value.byteLength > RESOURCE_MEMORY_MAX_BYTES ||
      !integer(value.byteOffset + value.byteLength)) return false;
  return true;
}

/** Only used after closed, bounded selection/response guards have succeeded. */
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value).forEach((child) => freeze(child));
    Object.freeze(value);
  }
  return value;
}

function copy<T>(value: T): T {
  return freeze(structuredClone(value));
}

function failureDetail(value: unknown): string {
  return typeof value === "string" && value.length > 0 &&
    value.length <= RESOURCE_MEMORY_MAX_DETAIL_LENGTH &&
    !Array.from(value).some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
    ? value
    : "Memory query failed; the transport detail was absent, malformed, or too long.";
}

/**
 * A one-request, one-result controller. It performs no I/O: the owner explicitly
 * sends the returned read_memory request using its existing admitted transport.
 * At most 256 requests can be issued per controller. No history cache is kept.
 * select(null) clears selection; disconnect clears it and invalidates all work.
 * Reconnection requires an explicit select, with the new caller connection ID.
 */
export function createResourceMemoryController(): ResourceMemoryController {
  let state: ResourceMemoryState = freeze({ status: "idle", selection: null });
  let selection: ResourceMemorySelection | null = null;
  let pending: { ticket: ResourceMemoryTicket; abort: AbortController } | null = null;
  let issued = 0;
  let lastRequestId = 0;

  function invalidate(): void {
    const previous = pending;
    pending = null;
    // Clear the live ticket before notifying transport cancellation handlers.
    previous?.abort.abort();
  }

  function error(detail: string): void {
    invalidate();
    state = freeze({ status: "error", selection, detail });
  }

  function current(ticket: ResourceMemoryTicket): boolean {
    return pending !== null && ticket === pending.ticket && !pending.abort.signal.aborted;
  }

  return {
    getState: () => state,

    select(value) {
      invalidate();
      if (value === null) {
        selection = null;
        state = freeze({ status: "idle", selection });
      } else if (!validSelection(value)) {
        selection = null;
        state = freeze({ status: "error", selection, detail: "Invalid or oversized memory selection; no request was issued." });
      } else {
        selection = copy(value);
        state = freeze({ status: "idle", selection });
      }
      return state;
    },

    begin(requestId) {
      // Starting a request always removes any earlier bytes, even on rejection.
      invalidate();
      if (selection === null) {
        error("Select an exact stopped snapshot and memory range before requesting bytes.");
        return null;
      }
      if (!integer(requestId, 1) || requestId <= lastRequestId) {
        error("Request ID must be a new, strictly increasing, exactly representable positive integer.");
        return null;
      }
      if (issued >= RESOURCE_MEMORY_MAX_REQUESTS) {
        error("Memory query request budget exhausted; create a new controller with the session's continuing request-ID allocator.");
        return null;
      }
      const request: ResourceMemoryRequest = copy({
        operation: "read_memory",
        schema: "fe2o3-debug-request-v1",
        request_id: requestId,
        expected_revision: selection.snapshot.cursor.state_revision,
        allocation: { ...selection.allocation },
        byte_offset: selection.byteOffset,
        byte_len: selection.byteLength,
      });
      issued += 1;
      lastRequestId = requestId;
      const abort = new AbortController();
      const ticket: ResourceMemoryTicket = Object.freeze({ generation: issued, request, signal: abort.signal });
      pending = { ticket, abort };
      state = freeze({ status: "pending", selection, request, generation: issued });
      return ticket;
    },

    receive(ticket, response) {
      if (!current(ticket) || selection === null) return false;
      if (!record(response) || response.request_id !== ticket.request.request_id) {
        error("Memory response request ID does not match the active request.");
        return true;
      }
      const projected = projectResourceMemoryResponse(response, selection.snapshot);
      if (projected.status !== "ready" && projected.status !== "unavailable") {
        error(failureDetail(projected.detail));
        return true;
      }
      if (projected.status === "ready") {
        const memory = projected.memory;
        if (memory.allocation.ordinal !== selection.allocation.ordinal ||
            memory.allocation.generation !== selection.allocation.generation ||
            memory.byte_offset !== selection.byteOffset || memory.requested_bytes !== selection.byteLength) {
          error("Memory response allocation, generation, or requested byte range does not match the active selection.");
          return true;
        }
      }
      // The accepted wire shape is bounded before it is copied or retained.
      const storedResponse = copy(response);
      const projection = projectResourceMemoryResponse(storedResponse, selection.snapshot);
      const completion = { selection, request: ticket.request, response: storedResponse, projection };
      pending = null;
      if (projection.status === "ready" && projection.memory.availability.status === "captured" &&
          projection.memory.returned_bytes === selection.byteLength && !projection.memory.availability.truncated) {
        state = freeze({ ...completion, status: "ready" });
      } else {
        const detail = projection.status === "unavailable" ? projection.detail
          : projection.status === "ready" && projection.memory.availability.status !== "captured"
            ? `Memory ${projection.memory.availability.status}: ${projection.memory.availability.reason}.`
            : "The response is bound to this request but does not capture the entire requested memory window.";
        state = freeze({ ...completion, status: "unavailable", detail: failureDetail(detail) });
      }
      return true;
    },

    fail(ticket, detail) {
      if (!current(ticket)) return false;
      error(failureDetail(detail));
      return true;
    },

    cancel() {
      invalidate();
      state = freeze({ status: "cancelled", selection, detail: "Memory query cancelled. No prior bytes remain selected." });
      return state;
    },

    disconnect() {
      invalidate();
      selection = null;
      state = freeze({ status: "disconnected", selection, detail: "Debugger connection closed. Select a new connection and snapshot before querying." });
      return state;
    },
  };
}
