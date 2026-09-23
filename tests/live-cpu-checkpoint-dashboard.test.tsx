// Synthetic UI/projector controls only: no server, source producer, browser or GPU execution.
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LiveCpuCheckpointDashboard, type LiveCpuCheckpointDashboardProps } from "../src/components/LiveCpuCheckpointDashboard";
import type { CpuLiveCheckpoint, CpuLiveQueryCollection, CpuLiveQuerySelection } from "../src/lib/cpu-live-query-collection";
import { projectResourceCheckpointValues } from "../src/content/resource-checkpoint-values";
import { projectResourceSourceValues } from "../src/content/resource-source-values";
import { projectResourceAccessResponse, type ResourceAccessProjectionInput } from "../src/content/resource-access-view";
import { projectResourceMemoryResponse } from "../src/content/resource-memory-view";
import { syntheticSourceValueGroup } from "./fixtures/resource-source-values";

afterEach(cleanup);
function fixture(selected = false) {
  const group = syntheticSourceValueGroup();
  const original = group.checkpoint;
  const context = { connectionId: "synthetic-live-connection", captureIdentity: null, target: null, variantIdentity: null };
  const checkpoint: CpuLiveCheckpoint = {
    anchor: original.anchor, anchorKey: original.anchorKey, context,
    control: { kind: original.control.kind, requestId: original.control.requestId,
      request: original.control.request, response: original.control.response },
    values: projectResourceCheckpointValues(original),
  };
  const page = structuredClone(group.sourcePages[0]);
  page.request.page = { limit: 16 };
  page.response.values = group.sourcePages.flatMap(value => value.response.values);
  delete page.response.next_cursor;
  const source = projectResourceSourceValues(checkpoint, group.stack, [page]);
  const session = (checkpoint.control.response as Record<string, unknown>).session;
  function resource(operation: "query_allocations" | "query_memory_accesses", requestId: number): ResourceAccessProjectionInput {
    const allocations = operation === "query_allocations";
    return { context, responseContext: context, expectedSnapshot: checkpoint.anchor,
      expectedRequest: { schema: "fe2o3-debug-resource-request-v1", request_id: requestId, expected_revision: 2,
        operation, expected_snapshot: checkpoint.anchor, page: { max_items: 16, max_scanned: 64 },
        ...(allocations ? { address_space: "global" } : { filter: { scope: { level: "dispatch" },
          allocation: { ordinal: 1, generation: 0 }, address_space: "global" } }) },
      response: { schema: "fe2o3-debug-resource-response-v1", status: "ok", request_id: requestId, operation,
        session, snapshot: checkpoint.anchor, physical_registers: "not_represented",
        page: { source_count: allocations ? 1 : 2, scanned: allocations ? 1 : 2, completeness: { status: "complete" } },
        result: allocations ? { result: "allocations", allocations: [{
          allocation: { ordinal: 1, generation: 0 }, address_space: "global", access: "read_write",
          alignment: 4, capacity_bytes: "8", snapshot_bytes_available: true, initialization_available: true,
          owning_scope: "not_represented", lifetime: "not_represented", physical_base: "not_represented",
        }] } : { result: "memory_accesses", accesses: [{
          occurrence: { record_ordinal: 0, event_sequence: 1, scope: checkpoint.anchor.scope,
            site: checkpoint.anchor.site!.kir, schedule: { identity: "workgroup_major_local_zyx_cooperative_v1", decision_ordinal: 0 } },
          allocation: { ordinal: 1, generation: 0 }, range: { byte_offset: "0", byte_len: "2" },
          address_space: "global", access: "write_committed", call_frame: "not_represented",
          operation_occurrence: "not_represented", source_association: "not_represented",
        }] } } };
  }
  const allocationsInput = resource("query_allocations", 7), accessesInput = resource("query_memory_accesses", 8);
  const memoryInput = { expectedSnapshot: checkpoint.anchor, response: {
    schema: "fe2o3-debug-response-v1", status: "ok", request_id: 9, operation: "read_memory", session,
    result: { result: "memory", snapshot: checkpoint.anchor, memory: {
      allocation: { ordinal: 1, generation: 0 }, byte_offset: 0, requested_bytes: 4, returned_bytes: 4,
      availability: { status: "captured", address_space: "global", bytes: "0x01020304", initialized: "0x05", truncated: false },
    } },
  } };
  const selection: CpuLiveQuerySelection = { ordinal: "1", generation: "0", byteOffset: "0", byteLength: "4" };
  const collection: CpuLiveQueryCollection = {
    status: selected ? "complete" : "selection_required", detail: "Synthetic same-checkpoint collection.",
    checkpoint, stack: group.stack, source, values: checkpoint.values,
    allocations: projectResourceAccessResponse(allocationsInput),
    accesses: selected ? projectResourceAccessResponse(accessesInput) : null,
    memory: selected ? projectResourceMemoryResponse(memoryInput.response, checkpoint.anchor) : null,
    allocationsInput, accessesInput: selected ? accessesInput : null, memoryInput: selected ? memoryInput : null,
    selection: selected ? selection : null, replies: [], responseBytes: 0,
  };
  if (source.status !== "ready" || collection.allocations?.status !== "ready" ||
      (selected && (collection.accesses?.status !== "ready" || collection.memory?.status !== "ready"))) {
    throw new Error("Synthetic fixture must satisfy unchanged presentation projectors");
  }
  return { checkpoint, collection, selection };
}
function props(value = fixture()): LiveCpuCheckpointDashboardProps {
  return { checkpoint: value.checkpoint, collection: value.collection, busy: false, remainingCommands: 100, onRefresh: vi.fn() };
}
async function selectWindow(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByRole("combobox", { name: "Live CPU allocation" }), "1");
  const length = screen.getByRole("textbox", { name: "Live CPU byte length" });
  await user.clear(length); await user.type(length, "4");
}

describe("live checkpoint dashboard (synthetic presentation controls)", () => {
  it("has no automatic query and supplies no table without a supported checkpoint", () => {
    const onRefresh = vi.fn();
    render(<LiveCpuCheckpointDashboard checkpoint={null} collection={fixture().collection}
      busy={false} remainingCommands={100} onRefresh={onRefresh} />);
    expect(onRefresh).not.toHaveBeenCalled();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refresh source and inventory" })).not.toBeInTheDocument();
    expect(screen.getByText(/Uncaptured watchpoint or terminal stops/)).toBeVisible();
  });
  it("requires an explicit keyboard refresh and preserves separate source and SSA tables", async () => {
    const user = userEvent.setup(), value = fixture(), input = props(value);
    const { rerender } = render(<LiveCpuCheckpointDashboard {...input} collection={null} />);
    expect(input.onRefresh).not.toHaveBeenCalled();
    const refresh = screen.getByRole("button", { name: "Refresh source and inventory" });
    refresh.focus(); await user.keyboard("{Enter}");
    expect(input.onRefresh).toHaveBeenCalledExactlyOnceWith(undefined);
    rerender(<LiveCpuCheckpointDashboard {...input} />);
    const source = screen.getByRole("table", { name: "Live checkpoint source-variable table" });
    const ssa = screen.getByRole("table", { name: "Live checkpoint SSA table" });
    expect(source).toHaveTextContent("not_represented");
    expect(within(source).getAllByRole("row")).toHaveLength(5);
    expect(within(ssa).getAllByRole("row")).toHaveLength(3);
    expect(ssa).not.toHaveTextContent("binding generation");
    expect(screen.getByText(/Binding generation below is not allocation generation/)).toBeVisible();
    expect(screen.getByText(/it is not the same anchor or a dynamic invocation identity/)).toBeVisible();
  });
  it("allows only actual inventory choices and sends a canonical bounded range explicitly", async () => {
    const user = userEvent.setup(), input = props();
    render(<LiveCpuCheckpointDashboard {...input} />);
    expect(screen.getByRole("button", { name: "Read selected allocation" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Live CPU allocation" }).querySelectorAll("option")).toHaveLength(2);
    await selectWindow(user);
    await user.click(screen.getByRole("button", { name: "Read selected allocation" }));
    expect(input.onRefresh).toHaveBeenCalledExactlyOnceWith({ ordinal: "1", generation: "0", byteOffset: "0", byteLength: "4" });
    expect(screen.queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
  });
  it("renders initialized and uninitialized bytes, then overlays historical range without moving the checkpoint", async () => {
    const user = userEvent.setup(), input = props(fixture(true));
    render(<LiveCpuCheckpointDashboard {...input} />);
    await selectWindow(user);
    expect(screen.getByRole("group", { name: "Captured memory cells" })).toBeVisible();
    expect(screen.getByRole("button", { name: /Byte offset 1, 1 byte, 0x02, uninitialized/ })).toBeVisible();
    const before = screen.getByTestId("live-query-checkpoint").textContent;
    await user.click(screen.getByRole("checkbox", { name: "Overlay selected historical access range" }));
    expect(document.querySelector('[data-access-marker="W"]')).not.toBeNull();
    expect(screen.getByTestId("live-query-checkpoint")).toHaveTextContent(before!);
    expect(input.onRefresh).not.toHaveBeenCalled();
    expect(screen.getByText(/does not restore the access event/)).toBeVisible();
  });
  it("clears memory and access views immediately when a range input changes", async () => {
    const user = userEvent.setup(), input = props(fixture(true));
    render(<LiveCpuCheckpointDashboard {...input} />);
    await selectWindow(user);
    expect(screen.getByRole("group", { name: "Captured memory cells" })).toBeInTheDocument();
    await user.clear(screen.getByRole("textbox", { name: "Live CPU byte offset" }));
    await user.type(screen.getByRole("textbox", { name: "Live CPU byte offset" }), "1");
    expect(screen.queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
    expect(screen.queryByRole("table", { name: "Captured memory access occurrences" })).not.toBeInTheDocument();
    expect(input.onRefresh).not.toHaveBeenCalled();
  });
  it("does not admit noncanonical, out-of-capacity or overflowing selection metadata", async () => {
    const user = userEvent.setup(), input = props();
    render(<LiveCpuCheckpointDashboard {...input} />);
    await selectWindow(user);
    for (const offset of ["01", "8", "9007199254740993", "18446744073709551615"]) {
      const field = screen.getByRole("textbox", { name: "Live CPU byte offset" });
      await user.clear(field); await user.type(field, offset);
      expect(screen.getByRole("button", { name: "Read selected allocation" })).toBeDisabled();
    }
    expect(input.onRefresh).not.toHaveBeenCalled();
  });
  it("clears tables during collection, lost selection, replacement connection and stale projection", () => {
    const value = fixture(), input = props(value), { rerender } = render(<LiveCpuCheckpointDashboard {...input} />);
    expect(screen.getByRole("table", { name: "Live checkpoint SSA table" })).toBeInTheDocument();
    rerender(<LiveCpuCheckpointDashboard {...input} busy />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    rerender(<LiveCpuCheckpointDashboard {...input} checkpoint={null} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    rerender(<LiveCpuCheckpointDashboard {...input} checkpoint={{ ...value.checkpoint,
      context: { ...value.checkpoint.context, connectionId: "replacement" } }} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    const values = value.collection.values;
    if (values.status !== "ready") throw new Error("Expected synthetic values");
    rerender(<LiveCpuCheckpointDashboard {...input} collection={{ ...value.collection, values: {
      ...values, anchor: { ...values.anchor, cursor: { ...values.anchor.cursor, state_revision: 3 } },
    } }} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
  it("shows unavailable or incomplete source without guessing rows and keeps SSA separate", () => {
    const input = props(), collection = input.collection!;
    render(<LiveCpuCheckpointDashboard {...input} collection={{ ...collection,
      source: { status: "unsupported", detail: "Synthetic remaining source cursor; table incomplete." } }} />);
    expect(screen.queryByRole("table", { name: "Live checkpoint source-variable table" })).not.toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Live checkpoint SSA table" })).toBeInTheDocument();
    expect(screen.getByText(/table incomplete/)).toBeVisible();
  });
  it("respects both refresh budgets and refuses inexact checkpoint metadata", async () => {
    const user = userEvent.setup(), input = props(), { rerender } = render(<LiveCpuCheckpointDashboard {...input} remainingCommands={4} />);
    await selectWindow(user);
    expect(screen.getByRole("button", { name: "Read selected allocation" })).toBeDisabled();
    rerender(<LiveCpuCheckpointDashboard {...input} remainingCommands={2} />);
    expect(screen.getByRole("button", { name: "Refresh source and inventory" })).toBeDisabled();
    const checkpoint = input.checkpoint!;
    rerender(<LiveCpuCheckpointDashboard {...input} checkpoint={{ ...checkpoint, anchor: {
      ...checkpoint.anchor, cursor: { ...checkpoint.anchor.cursor, event_sequence: Number.MAX_SAFE_INTEGER + 1 },
    } }} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refresh source and inventory" })).not.toBeInTheDocument();
  });
});
