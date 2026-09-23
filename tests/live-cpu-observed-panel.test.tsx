// Synthetic component controls only. No real capture, browser or GPU evidence.
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LiveCpuObservedPanel, type LiveCpuObservedPanelProps } from "../src/components/LiveCpuObservedPanel";
import { CpuDebugSession } from "../src/lib/cpu-debug-session";
import { SyntheticObservedBridge } from "./fixtures/cpu-observed-bridge";
import { SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET } from "./fixtures/cpu-debug-bridge";
afterEach(cleanup);
async function fixture(selected = false) {
  const bridge = new SyntheticObservedBridge(), client = new CpuDebugSession(bridge.fetch);
  await client.connect(SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET); await client.command("step 1");
  const collection = await client.collectObserved(selected ?
    { allocation: "3", storageSlot: "2", generation: "2", byteOffset: "0", byteLength: "4" } : undefined);
  const props: LiveCpuObservedPanelProps = { collection, checkpoint: null, enabled: true,
    busy: false, remainingCommands: 200, onRefresh: vi.fn() };
  return { props, client, bridge };
}
describe("observed CPU panel", () => {
  it("does not query on mount and keeps the explicit launch boundary visible", async () => {
    const refresh = vi.fn();
    render(<LiveCpuObservedPanel collection={null} checkpoint={null} enabled={true} busy={false}
      remainingCommands={200} onRefresh={refresh} />);
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByText(/browser cannot choose executable paths/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Refresh runtime and storage" }));
    expect(refresh).toHaveBeenCalledExactlyOnceWith();
  });
  it("separates real runtime identities from unavailable caller/callee values", async () => {
    const { props } = await fixture(); render(<LiveCpuObservedPanel {...props} />);
    const caller = screen.getByRole("region", { name: "Activation 1" }),
      child = screen.getByRole("region", { name: "Activation 9" });
    expect(within(caller).getByRole("heading", { name: /suspended/ })).toBeInTheDocument();
    expect(within(child).getByRole("heading", { name: /active_operation/ })).toBeInTheDocument();
    expect(within(caller).getByText(/No matching real checkpoint values/)).toBeInTheDocument();
    expect(within(child).getByText(/No matching real checkpoint values/)).toBeInTheDocument();
    expect(screen.getByText("Legacy capture completeness")).toBeInTheDocument();
    expect(screen.getByText("Allocation metadata coverage")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Actual allocation lifecycle" })).toHaveTextContent("release");
    expect(screen.getByRole("region", { name: "Current storage incarnations" })).toHaveTextContent("generation 2");
  });
  it("shows only the returned exact selection and hides old bytes immediately after input edits", async () => {
    const { props } = await fixture(true); render(<LiveCpuObservedPanel {...props} />);
    expect(screen.getByRole("region", { name: "Observed storage bytes" })).toHaveTextContent("0x12121212");
    const offset = screen.getByRole("textbox", { name: "Observed byte offset" });
    await userEvent.clear(offset); await userEvent.type(offset, "1");
    expect(screen.queryByRole("region", { name: "Observed storage bytes" })).not.toBeInTheDocument();
    expect(screen.getByText("No memory/access result matches the current selection fields.")).toBeInTheDocument();
    expect(props.onRefresh).not.toHaveBeenCalled();
  });
  it("hides all derived frame/storage rows during a control or refresh", async () => {
    const { props } = await fixture(true);
    const { rerender } = render(<LiveCpuObservedPanel {...props} />);
    expect(screen.getByRole("region", { name: "Actual runtime frames" })).toBeInTheDocument();
    rerender(<LiveCpuObservedPanel {...props} busy={true} />);
    expect(screen.queryByRole("region", { name: "Actual runtime frames" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Observed storage bytes" })).not.toBeInTheDocument();
    expect(screen.getByText(/Previous tables are hidden/)).toBeInTheDocument();
  });
  it("never displays a previous checkpoint roster at a memory-watch observation", async () => {
    const { props, client, bridge } = await fixture();
    bridge.memoryWatch = true;
    const collection = await client.collectObserved();
    render(<LiveCpuObservedPanel {...props} collection={collection} />);
    expect(screen.queryByRole("region", { name: "Activation 1" })).not.toBeInTheDocument();
    expect(screen.getByText(/No actual frame roster: not_checkpoint/)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Observed storage bytes" })).not.toBeInTheDocument();
  });
});
