import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DebuggerWorkbench } from "../src/components/DebuggerWorkbench";
import { debuggerWorkbenchFixture } from "../src/content/debugger-workbench";

describe("resource checkpoint integration", () => {
  it("opens real assembly source resource pages separately from the raw-KIR timeline", async () => {
    const user = userEvent.setup();
    render(<DebuggerWorkbench fixture={debuggerWorkbenchFixture} />);
    const example = screen.getByTestId("assembly-resource-example");
    expect(within(example).queryByRole("table")).not.toBeInTheDocument();
    await user.click(within(example).getByRole("button", { name: "Open assembly resource example" }));
    expect(within(example).getByRole("table", { name: "Captured allocation inventory" })).toHaveTextContent("24");
    expect(within(example).getByRole("table", { name: "Captured memory access occurrences" })).toHaveTextContent("write committed");
    expect(within(example).getByRole("group", { name: "Captured memory cells" })).toBeInTheDocument();
    expect(within(example).getByText(/not connected to the different raw-KIR timeline/u)).toBeInTheDocument();
    expect(screen.getByTestId("resource-checkpoint-unavailable")).toBeInTheDocument();
    await user.click(within(example).getByRole("button", { name: "Close assembly resource example" }));
    expect(within(example).queryByRole("table")).not.toBeInTheDocument();
    expect(within(example).queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
  });

  it("discards the byte view when either cursor or selected lane changes", async () => {
    const user = userEvent.setup();
    render(<DebuggerWorkbench fixture={debuggerWorkbenchFixture} />);
    expect(screen.getByTestId("resource-checkpoint-unavailable")).toBeInTheDocument();
    const timeline = screen.getByRole("heading", { name: "Event timeline" }).closest("section")!;
    const checkpoint = debuggerWorkbenchFixture.events.find((event) => event.cursor === 9)!;
    await user.click(within(timeline).getByRole("button", { name: new RegExp(checkpoint.label.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u") }));
    expect(screen.getByRole("group", { name: "Captured memory cells" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Lane 1 active" }));
    expect(screen.queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Lane 0 active" }));
    expect(screen.getByRole("group", { name: "Captured memory cells" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reverse one semantic event" }));
    expect(screen.queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
  });
});
