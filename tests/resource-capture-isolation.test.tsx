import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { DebuggerWorkbench } from "../src/components/DebuggerWorkbench";
import { debuggerWorkbenchFixture } from "../src/content/debugger-workbench";

it("keeps the independent source capture fixed across raw-KIR cursor and lane changes", async () => {
  const user = userEvent.setup();
  render(<DebuggerWorkbench fixture={debuggerWorkbenchFixture} />);
  const source = screen.getByTestId("assembly-resource-example");
  await user.click(within(source).getByRole("button", { name: "Open assembly resource example" }));
  const expectedText = source.textContent;
  const assertIndependentSource = () => {
    expect(source.textContent).toBe(expectedText);
    const cells = within(source).getByRole("group", { name: "Captured memory cells" });
    expect(within(cells).getAllByRole("button")).toHaveLength(24);
    expect(within(cells).getByRole("button", { name: "Byte offset 0, 1 byte, 0xd5, initialized" })).toBeInTheDocument();
  };
  assertIndependentSource();
  expect(screen.getAllByRole("group", { name: "Captured memory cells" })).toHaveLength(1);
  const timeline = screen.getByRole("heading", { name: "Event timeline" }).closest("section")!;
  const checkpoint = debuggerWorkbenchFixture.events.find((event) => event.cursor === 9)!;
  const label = new RegExp(checkpoint.label.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u");
  await user.click(within(timeline).getByRole("button", { name: label }));
  assertIndependentSource();
  expect(screen.getAllByRole("group", { name: "Captured memory cells" })).toHaveLength(2);
  await user.click(screen.getByRole("button", { name: "Lane 1 active" }));
  assertIndependentSource();
  expect(screen.getAllByRole("group", { name: "Captured memory cells" })).toHaveLength(1);
  await user.click(screen.getByRole("button", { name: "Lane 0 active" }));
  assertIndependentSource();
  expect(screen.getAllByRole("group", { name: "Captured memory cells" })).toHaveLength(2);
  await user.click(screen.getByRole("button", { name: "Reverse one semantic event" }));
  assertIndependentSource();
  expect(screen.getAllByRole("group", { name: "Captured memory cells" })).toHaveLength(1);
  expect(screen.getByTestId("resource-checkpoint-unavailable")).toBeInTheDocument();
});
