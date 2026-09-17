import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import retained from "../examples/debugger_workbench_v1.json";
import { ResourceMemoryView } from "../src/components/ResourceMemoryView";

const actual = retained.memory;
const selected = actual.result.snapshot;

function withMemory(overrides: Record<string, unknown>) {
  return { ...actual, result: { ...actual.result, memory: { ...actual.result.memory, ...overrides } } };
}

describe("resource memory view", () => {
  it("renders actual retained simulator bytes and honest source/register availability", () => {
    render(<ResourceMemoryView response={actual} expectedSnapshot={selected} />);
    expect(screen.getByRole("heading", { name: "Snapshot memory window" })).toBeInTheDocument();
    expect(screen.getByText("CPU replay · simulated observation")).toBeInTheDocument();
    const grid = screen.getByRole("group", { name: "Captured memory cells" });
    expect(within(grid).getAllByRole("button")).toHaveLength(4);
    expect(within(grid).getByRole("button", { name: "Byte offset 0, 1 byte, 0x11, initialized" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("unavailable · requires_authenticated_map")).toBeInTheDocument();
    expect(screen.getByText(/physical registers are unavailable/u)).toBeInTheDocument();
    expect(screen.getByText(/Capture completeness beyond the returned memory window is unavailable/u)).toBeInTheDocument();
    expect(screen.getByText(selected.cursor.configuration_identity)).toBeInTheDocument();
  });

  it("supports keyboard cell navigation and exact textual inspection", async () => {
    const user = userEvent.setup();
    render(<ResourceMemoryView response={actual} expectedSnapshot={selected} />);
    const grid = screen.getByRole("group", { name: "Captured memory cells" });
    const cells = within(grid).getAllByRole("button");
    cells[0].focus();
    await user.keyboard("{ArrowRight}");
    expect(cells[1]).toHaveFocus();
    expect(cells[1]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("table", { name: "Selected memory cell details" })).toHaveTextContent("+1");
    await user.keyboard("{End}");
    expect(cells[3]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(cells[0]).toHaveFocus();
  });

  it("renders a bounded viewport for larger synthetic layout fixtures", async () => {
    const user = userEvent.setup();
    const response = withMemory({
      requested_bytes: 257, returned_bytes: 257,
      availability: { status: "captured", address_space: "global", bytes: `0x${"00".repeat(257)}`, initialized: `0x${"ff".repeat(32)}01`, truncated: false },
    });
    render(<ResourceMemoryView response={response} expectedSnapshot={selected} />);
    expect(within(screen.getByRole("group", { name: "Captured memory cells" })).getAllByRole("button")).toHaveLength(256);
    await user.click(screen.getByRole("button", { name: "Next window" }));
    expect(within(screen.getByRole("group", { name: "Captured memory cells" })).getAllByRole("button")).toHaveLength(1);
    expect(screen.getByText("Visible allocation-relative byte range [256, 257).")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next window" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Previous window" }));
    expect(screen.getByRole("button", { name: "Previous window" })).toBeDisabled();
  });

  it("shows partial dwords and non-color initialization distinctions", async () => {
    const user = userEvent.setup();
    render(<ResourceMemoryView response={withMemory({
      requested_bytes: 8, returned_bytes: 5,
      availability: { status: "captured", address_space: "global", bytes: "0x0000000000", initialized: "0x01", truncated: true },
    })} expectedSnapshot={selected} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Memory cell size" }), "4");
    const grid = screen.getByRole("group", { name: "Captured memory cells" });
    expect(within(grid).getAllByRole("button")).toHaveLength(2);
    expect(within(grid).getByRole("button", { name: /Byte offset 4, 1 byte, 0x00, uninitialized/u })).toHaveTextContent("1 B");
    expect(screen.getByRole("status")).toHaveTextContent("Partial memory response");
    expect(screen.getByRole("table", { name: "Selected memory cell details" })).toHaveTextContent("Uninitialized · not a program value");
  });

  it("removes old cells on a stale response and resets local selection on a new anchor", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ResourceMemoryView response={actual} expectedSnapshot={selected} />);
    await user.click(screen.getByRole("button", { name: "Byte offset 3, 1 byte, 0x00, initialized" }));
    const nextAnchor = { ...selected, cursor: { ...selected.cursor, state_revision: selected.cursor.state_revision + 1 } };
    rerender(<ResourceMemoryView response={actual} expectedSnapshot={nextAnchor} />);
    expect(screen.queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("data-state", "stale");
    const nextResponse = {
      ...actual,
      session: { ...actual.session, revision: nextAnchor.cursor.state_revision, cursor: nextAnchor.cursor },
      result: { ...actual.result, snapshot: nextAnchor },
    };
    rerender(<ResourceMemoryView response={nextResponse} expectedSnapshot={nextAnchor} />);
    expect(screen.getByRole("button", { name: "Byte offset 0, 1 byte, 0x11, initialized" })).toHaveAttribute("aria-pressed", "true");
  });

  it.each(["unavailable", "redacted"])("shows %s memory without fabricating zero values", (status) => {
    render(<ResourceMemoryView response={withMemory({
      returned_bytes: 0, availability: { status, reason: status === "redacted" ? "policy" : "not_captured" },
    })} expectedSnapshot={selected} />);
    expect(screen.queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(`Memory ${status}`);
    expect(screen.getByRole("status")).toHaveTextContent("No byte values are available");
  });
});
