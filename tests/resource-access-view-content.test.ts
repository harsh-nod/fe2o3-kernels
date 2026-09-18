import { describe, expect, it } from "vitest";
import retained from "../examples/resource_query_v6.json";
import { projectResourceAccessResponse, resourceAccessRangeLabel, type ResourceAccessProjectionInput } from "../src/content/resource-access-view";

const actual = retained.accessResponse;
const row = actual.result.accesses[0];
function input(response: unknown = actual, expectedSnapshot: unknown = retained.expectedSnapshot, expectedRequest: unknown = retained.accessRequest): ResourceAccessProjectionInput {
  return { response, expectedSnapshot, expectedRequest, context: retained.context, responseContext: retained.context };
}
function withRows(rows: unknown) {
  return { ...actual, result: { ...actual.result, accesses: rows } };
}

describe("bounded allocation and access presentation", () => {
  it("preserves actual source-produced CPU response rows paired with an independent anchor", () => {
    expect(retained.evidence.fixture_kind).toBe("actual_retained_source_produced_cpu_responses");
    expect(retained.expectedSnapshot).toEqual(retained.independentAnchorResponse.result.snapshot.snapshot.anchor);
    const access = projectResourceAccessResponse(input());
    expect(access.status).toBe("ready");
    if (access.status !== "ready" || access.kind !== "memory_accesses") throw new Error("actual access expected");
    expect(access.rows).toEqual(actual.result.accesses);
    expect(access.rows[0].occurrence.event_sequence).toBe(32);
    expect(access.rows[0].source_association).toBe("not_represented");
    expect(access.hasMorePages).toBe(true);
    expect(resourceAccessRangeLabel(access.rows[0])).toBe("[0, 4)");
    const allocation = projectResourceAccessResponse(input(retained.allocationResponse, retained.expectedSnapshot, retained.allocationRequest));
    expect(allocation.status).toBe("ready");
    if (allocation.status !== "ready" || allocation.kind !== "allocations") throw new Error("actual inventory expected");
    expect(allocation.rows).toEqual(retained.allocationResponse.result.allocations);
    expect(allocation.rows[0].capacity_bytes).toBe("24");
  });

  it("copies and freezes accepted values instead of retaining mutable caller aliases", () => {
    const original = structuredClone(input());
    const response = original.response as typeof actual;
    const projection = projectResourceAccessResponse(original);
    if (projection.status !== "ready" || projection.kind !== "memory_accesses") throw new Error("expected ready");
    response.result.accesses[0].range.byte_offset = "8";
    original.context.connectionId = "replaced";
    expect(projection.rows[0].range.byte_offset).toBe("0");
    expect(projection.context.connectionId).toBe(retained.context.connectionId);
    expect(Object.isFrozen(projection.rows[0].occurrence.scope)).toBe(true);
  });

  it.each([
    { connectionId: "new-session" }, { captureIdentity: "12".repeat(32) },
    { variantIdentity: "34".repeat(32) }, { target: "gfx1100" },
  ])("rejects changed caller-owned context %# without treating it as an attestation", (change) => {
    expect(projectResourceAccessResponse({ ...input(), context: { ...retained.context, ...change } }).status).toBe("stale");
  });

  it("rejects changed revision, source, frame and scope through the shared complete-anchor guard", () => {
    const anchor = retained.expectedSnapshot;
    for (const changed of [
      { ...anchor, cursor: { ...anchor.cursor, state_revision: anchor.cursor.state_revision + 1 } },
      { ...anchor, site: { ...anchor.site, source: { status: "unavailable", reason: "not_represented" } } },
      { ...anchor, frame: 1, occurrence: 1 },
      { ...anchor, scope: { ...anchor.scope, lane: 1, logical_workitem: [1, 0, 0] } },
    ]) expect(projectResourceAccessResponse(input(actual, changed)).status).toBe("stale");
    expect(projectResourceAccessResponse(input({ ...actual, snapshot: { ...anchor, frame: 1, occurrence: 1 } })).status).toBe("stale");
  });

  it("binds request identity, selected range, allocation and logical scope", () => {
    expect(projectResourceAccessResponse(input({ ...actual, request_id: actual.request_id + 1 })).status).toBe("stale");
    for (const filter of [
      { ...retained.accessRequest.filter, range: { byte_offset: "4", byte_len: "4" } },
      { ...retained.accessRequest.filter, allocation: { ordinal: 2, generation: 0 } },
      { ...retained.accessRequest.filter, scope: { level: "workgroup", workgroup: [1, 0, 0] } },
      { ...retained.accessRequest.filter, access: "read" },
    ]) expect(projectResourceAccessResponse(input(actual, retained.expectedSnapshot, { ...retained.accessRequest, filter })).status).toBe("invalid");
  });

  it("preserves synthetic format-only wide byte extents without Number conversion", () => {
    // These altered wire values test lossless formatting, not execution evidence.
    const changed = withRows([{ ...row, range: { byte_offset: "9007199254740993", byte_len: "4" } }]);
    const projection = projectResourceAccessResponse(input(changed));
    if (projection.status !== "ready" || projection.kind !== "memory_accesses") throw new Error("format projection expected");
    expect(resourceAccessRangeLabel(projection.rows[0])).toBe("[9007199254740993, 9007199254740997)");
    for (const offset of [0, "00", "01", "+1", "-1", "1e3", "18446744073709551616", "18446744073709551615"]) {
      expect(projectResourceAccessResponse(input(withRows([{ ...row, range: { byte_offset: offset, byte_len: "4" } }]))).status).toBe("invalid");
    }
    expect(projectResourceAccessResponse(input(withRows([{ ...row, range: { byte_offset: "0", byte_len: "0" } }]))).status).toBe("invalid");
  });

  it("rejects unsafe integer identity metadata and impossible hardware truth", () => {
    expect(projectResourceAccessResponse(input(withRows([{ ...row, allocation: { ordinal: 2 ** 53, generation: 0 } }]))).status).toBe("invalid");
    expect(projectResourceAccessResponse(input({ ...actual, session: { ...actual.session, hardware_observed: true } })).status).toBe("unsupported");
    expect(projectResourceAccessResponse(input({ ...actual, physical_registers: "captured" })).status).toBe("invalid");
    expect(projectResourceAccessResponse(input(withRows([{ ...row, occurrence: { ...row.occurrence, scope: { ...row.occurrence.scope, active_mask: 2 ** 63 } } }]))).status).toBe("invalid");
  });

  it("rejects duplicate, out-of-order, sparse, oversized and future row collections", () => {
    for (const rows of [[row, row], Array(1), Array.from({ length: 257 }, () => row),
      [{ ...row, occurrence: { ...row.occurrence, record_ordinal: 33, event_sequence: 34 } }],
      [row, { ...row, occurrence: { ...row.occurrence, record_ordinal: 30, event_sequence: 31 } }],
    ]) expect(projectResourceAccessResponse(input(withRows(rows))).status).toBe("invalid");
    const sparse = Array<number>(3);
    sparse[0] = 0;
    sparse[2] = 0;
    expect(projectResourceAccessResponse(input(withRows([{ ...row, occurrence: { ...row.occurrence, scope: { ...row.occurrence.scope, workgroup: sparse } } }]))).status).toBe("invalid");
  });

  it("rejects unknown fields, coerced address spaces and nonzero producer generations", () => {
    for (const changed of [
      { ...row, native_address: "0x1234" }, { ...row, address_space: ["global"] },
      { ...row, address_space: { toString: () => "global" } },
      { ...row, allocation: { ordinal: 1, generation: 1 } },
      { ...row, source_association: "compiler_bundle_bound" },
    ]) expect(projectResourceAccessResponse(input(withRows([changed]))).status).toBe("invalid");
  });

  it("checks page progress, requested bounds and explicit partial capture", () => {
    for (const change of [{ scanned: 257 }, { scanned: 0 }, { source_count: 1 }, { next_token: retained.accessRequest.page.token }, { next_token: "x".repeat(129) }]) {
      expect(projectResourceAccessResponse(input({ ...actual, page: { ...actual.page, ...change } })).status).toBe("invalid");
    }
    const truncated = { ...actual, page: { ...actual.page, completeness: { status: "truncated", reason: "event_limit", emitted_events: 33 } } };
    const projected = projectResourceAccessResponse(input(truncated));
    expect(projected.status).toBe("ready");
    if (projected.status === "ready") expect(projected.completeness.status).toBe("truncated");
    expect(projectResourceAccessResponse(input({ ...truncated, page: { ...truncated.page, completeness: { ...truncated.page.completeness, emitted_events: 1 } } })).status).toBe("invalid");
  });

  it("keeps empty filtered pages distinct from missing capture and error", () => {
    expect(projectResourceAccessResponse(input(withRows([]))).status).toBe("ready");
    const unavailable = { schema: actual.schema, status: "unavailable", request_id: retained.allocationRequest.request_id, operation: "query_allocations", session: actual.session, reason: "memory_byte_limit", required: "48", completeness: { status: "complete" } };
    expect(projectResourceAccessResponse(input(unavailable, retained.expectedSnapshot, retained.allocationRequest)).status).toBe("unavailable");
    const malformed = { ...unavailable, required: null };
    expect(projectResourceAccessResponse(input(malformed, retained.expectedSnapshot, retained.allocationRequest)).status).toBe("invalid");
    const error = { schema: actual.schema, status: "error", request_id: actual.request_id, operation: actual.operation, session: actual.session, error: { stage: "session", code: "invalid_cursor", message: "Cursor consumed", state_changed: false } };
    expect(projectResourceAccessResponse(input(error)).status).toBe("error");
  });
});
