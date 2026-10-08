// Synthetic UI controls only; actual source/HTTP/browser acceptance remains separate.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CpuObservedLifetimesView } from "../src/components/CpuObservedLifetimes";
import { LiveCpuObservedPanel } from "../src/components/LiveCpuObservedPanel";
import { CpuDebugSession } from "../src/lib/cpu-debug-session";
import { SyntheticObservedBridge } from "./fixtures/cpu-observed-bridge";
import { SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET, type MockRow } from "./fixtures/cpu-debug-bridge";
afterEach(cleanup);

async function input() {
  const bridge = new SyntheticObservedBridge(), client = new CpuDebugSession(bridge.fetch);
  await client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET); await client.command("step 1");
  return { bridge, collection: await client.collectObserved() };
}
describe("logical allocation lifetime view", () => {
  it("renders scope-separated exact bytes, exclusive endpoints and actual reuse without requests", async () => {
    const { bridge, collection } = await input(), before = bridge.commands.length;
    render(<CpuObservedLifetimesView collection={collection} />);
    const region = screen.getByRole("region", { name: "Logical storage lifetimes and byte demand" });
    const bytes = within(region).getByRole("table", { name: "Logical byte demand by address space and exact owning scope" });
    expect(bytes).toHaveAttribute("tabindex", "0");
    expect(bytes).toHaveTextContent("global"); expect(bytes).toHaveTextContent("private");
    const lifetimes = within(region).getByRole("table", { name: "Allocation lifetimes; release is the exclusive end boundary" });
    expect(lifetimes).toHaveTextContent("2 / 2 / 1");
    expect(lifetimes).toHaveTextContent("3 / 2 / 2");
    expect(lifetimes).toHaveTextContent("Preexisting; first observed at 1; creation unknown");
    expect(lifetimes).toHaveTextContent("Released at 3 (exclusive)");
    expect(lifetimes).toHaveTextContent("Live through selected watermark 4; later release unknown");
    expect(region).toHaveTextContent("not allocator capacity");
    expect(region).toHaveTextContent("no terminal release is invented");
    expect(bridge.commands).toHaveLength(before);
  });
  it("makes incomplete pages and unavailable current state readable without color", async () => {
    const { collection } = await input(), copy = structuredClone(collection);
    const response = copy.lifecycle!.response as MockRow;
    const result = response.result as MockRow;
    result.transitions = (result.transitions as MockRow[]).slice(0, 2);
    response.page = { source_count: "4", source_start: "0", scanned: 2, next_token: "more" };
    render(<CpuObservedLifetimesView collection={copy} />);
    expect(screen.getByText(/Partial lifecycle prefix: observed through 2 of selected watermark 4/)).toHaveTextContent("Current live bytes are unavailable");
    expect(screen.getAllByText(/lower bound through selection/)).toHaveLength(2);
    expect(screen.getAllByText("Open at prefix 2; state at selection unknown")).toHaveLength(2);
    expect(screen.queryByText(/Live through selected watermark/)).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Live bytes at selection" })).not.toBeInTheDocument();
  });
  it("removes the prior derived view after an incompatible selection", async () => {
    const { collection } = await input();
    const { rerender } = render(<CpuObservedLifetimesView collection={collection} />);
    expect(screen.getAllByRole("table")).toHaveLength(2);
    rerender(<CpuObservedLifetimesView collection={{ ...collection, key: "stale" }} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Invalid or incompatible");
  });
  it("shows not-queried as unavailable rather than zero bytes", async () => {
    const { collection } = await input();
    render(<CpuObservedLifetimesView collection={{ ...collection, lifecycle: null }} />);
    expect(screen.getByRole("status")).toHaveTextContent("not queried");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
  it("keeps the parent cursor/refresh hiding behavior and does not mount an action", async () => {
    const { collection } = await input(), refresh = vi.fn();
    const props = { collection, checkpoint: null, enabled: true, busy: false, remainingCommands: 200, onRefresh: refresh };
    const { rerender } = render(<LiveCpuObservedPanel {...props} />);
    expect(screen.getByRole("region", { name: "Logical storage lifetimes and byte demand" })).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
    rerender(<LiveCpuObservedPanel {...props} busy />);
    expect(screen.queryByRole("region", { name: "Logical storage lifetimes and byte demand" })).not.toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
  it("keeps legacy truncation distinct from selected-prefix completeness", async () => {
    const { collection } = await input(), copy = structuredClone(collection);
    const completeness = { status: "truncated", reason: "user_stopped", emitted_events: 1000 };
    (copy.runtime.response as MockRow).completeness = completeness;
    (copy.lifecycle!.response as MockRow).completeness = structuredClone(completeness);
    render(<CpuObservedLifetimesView collection={copy} />);
    expect(screen.getByText(/Complete lifecycle prefix through selected watermark 4/)).toHaveTextContent("Legacy capture: truncated");
    expect(screen.getByText(/Complete lifecycle prefix through selected watermark 4/)).toHaveTextContent("Neither status establishes a complete execution or a whole-run peak");
  });
});
