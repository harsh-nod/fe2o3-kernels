import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import retained from "../examples/resource_query_v6.json";
import { ResourceAccessView } from "../src/components/ResourceAccessView";

const props = { response: retained.accessResponse, expectedSnapshot: retained.expectedSnapshot, expectedRequest: retained.accessRequest, context: retained.context, responseContext: retained.context };

describe("resource access view", () => {
  it("renders actual source-produced CPU access facts without asserting physical execution", () => {
    render(<ResourceAccessView {...props} />);
    expect(screen.getByRole("heading", { name: "Captured resource observations" })).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Captured memory access occurrences" });
    expect(table).toHaveTextContent("32 / 31");
    expect(table).toHaveTextContent("write committed");
    expect(table).toHaveTextContent("[0, 4)");
    expect(table).toHaveTextContent("Workgroup [0, 0, 0], logical wave 0, lane 0");
    expect(screen.getByText(/More backend pages exist/u)).toBeInTheDocument();
    expect(screen.getByText(/physical registers, bank conflicts, and GPU timing are unavailable/u)).toBeInTheDocument();
    expect(screen.getByText(/Context fields are stale-state fences, not backend attestations/u)).toBeInTheDocument();
  });

  it("renders the real allocation capacity and permissions as checkpoint facts", () => {
    render(<ResourceAccessView {...props} response={retained.allocationResponse} expectedRequest={retained.allocationRequest} />);
    const table = screen.getByRole("table", { name: "Captured allocation inventory" });
    expect(table).toHaveTextContent("alloc#1:g0");
    expect(table).toHaveTextContent("read write");
    expect(within(table).getByText("24")).toBeInTheDocument();
    expect(table).toHaveTextContent("Bytes and initialization captured");
  });

  it("immediately removes previous rows on changed snapshot or connection", () => {
    const { rerender } = render(<ResourceAccessView {...props} />);
    rerender(<ResourceAccessView {...props} context={{ ...retained.context, connectionId: "replacement" }} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("data-state", "stale");
    rerender(<ResourceAccessView {...props} expectedSnapshot={{ ...retained.expectedSnapshot, cursor: { ...retained.expectedSnapshot.cursor, state_revision: 100 } }} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("data-state", "stale");
  });

  it("shows lossless large ranges for explicitly synthetic display-only values", () => {
    const row = retained.accessResponse.result.accesses[0];
    const response = { ...retained.accessResponse, result: { ...retained.accessResponse.result, accesses: [{ ...row, range: { byte_offset: "9007199254740993", byte_len: "4" } }] } };
    render(<ResourceAccessView {...props} response={response} />);
    expect(screen.getByRole("table")).toHaveTextContent("[9007199254740993, 9007199254740997)");
  });

  it("paginates and filters only bounded synthetic captured-page layout rows", async () => {
    // Layout-only rows; never retained or described as executed observations.
    const user = userEvent.setup();
    const row = retained.accessResponse.result.accesses[0];
    const anchor = { ...retained.expectedSnapshot, cursor: { ...retained.expectedSnapshot.cursor, event_sequence: 100 } };
    const rows = Array.from({ length: 65 }, (_, index) => ({ ...row, occurrence: { ...row.occurrence, record_ordinal: index, event_sequence: index + 1, scope: { ...row.occurrence.scope, lane: index % 2, logical_workitem: [index % 2, 0, 0] } } }));
    const response = { ...retained.accessResponse, snapshot: anchor, session: { ...retained.accessResponse.session, cursor: anchor.cursor }, page: { source_count: 100, scanned: 100, completeness: { status: "complete" } }, result: { result: "memory_accesses", accesses: rows } };
    const request = { ...retained.accessRequest, expected_snapshot: anchor, page: { max_items: 256, max_scanned: 256 } };
    render(<ResourceAccessView {...props} response={response} expectedSnapshot={anchor} expectedRequest={request} />);
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(65);
    await user.click(screen.getByRole("button", { name: "Next rows" }));
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Next rows" })).toBeDisabled();
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter captured access rows by logical scope" }), "Workgroup [0, 0, 0], logical wave 0, lane 1");
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(33);
    expect(screen.getByRole("button", { name: "Previous rows" })).toBeDisabled();
    expect(screen.getByText(/Rows 1–32 of 32 in this captured page/u)).toBeInTheDocument();
  });

  it("labels an empty page and truncated capture without inventing activity", () => {
    const response = { ...retained.accessResponse, page: { ...retained.accessResponse.page, completeness: { status: "truncated", reason: "resident_limit", emitted_events: 33 } }, result: { result: "memory_accesses", accesses: [] } };
    render(<ResourceAccessView {...props} response={response} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText(/Partial retained capture: resident_limit/u)).toBeInTheDocument();
    expect(screen.getByText(/No matching rows in this captured page/u)).toBeInTheDocument();
    expect(screen.getByText(/More backend pages exist/u)).toBeInTheDocument();
  });
});
