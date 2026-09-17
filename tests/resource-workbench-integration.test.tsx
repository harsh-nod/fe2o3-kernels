import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DebuggerWorkbench } from "../src/components/DebuggerWorkbench";
import { debuggerWorkbenchFixture } from "../src/content/debugger-workbench";

describe("resource checkpoint integration", () => {
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
