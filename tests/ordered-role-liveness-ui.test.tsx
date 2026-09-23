import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrderedRoleLiveness } from "../src/components/OrderedRoleLiveness";
import { buildOrderedRoleLiveness } from "../src/content/ordered-role-liveness.mjs";
const model = () => buildOrderedRoleLiveness({ descriptors: [8, 201], inputValueIds: [10, 20, 30],
  resultValueId: 40, coordinate: [0, 1, 2], rawBlockId: 9 });
afterEach(() => { vi.unstubAllGlobals(); });
describe("synthetic logical-liveness presentation controls", () => {
  it("shows logical intervals, exact boundary mappings and independent pressure measures without fetch", () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    render(<OrderedRoleLiveness model={model()} selectionIdentity="synthetic-one-O0" caseLabel="synthetic one O0" />);
    const table = screen.getByRole("table", { name: "Logical version lifetimes and uses" });
    expect(screen.getByRole("region", { name: "Logical version table scroll area" })).toHaveAttribute("tabindex", "0");
    expect(table.querySelectorAll("tbody tr")).toHaveLength(5);
    expect(within(table).getByText("Input %10")).toBeInTheDocument();
    expect(within(table).getByText("Result %40")).toBeInTheDocument();
    expect(within(table).getByText("Unavailable — analysis version only")).toBeInTheDocument();
    expect(within(table).getByText("Unused region input")).toBeInTheDocument();
    expect(screen.getByTestId("logical-boundary-peak")).toHaveTextContent(/^2$/u);
    expect(screen.getByTestId("logical-transient-peak")).toHaveTextContent(/^3$/u);
    expect(screen.getByText(/not physical VGPR lifetimes/u)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("selects a definition's exact operand occurrence and highlights only its live boundary", async () => {
    const user = userEvent.setup();
    render(<OrderedRoleLiveness model={model()} selectionIdentity="synthetic-one-O0" caseLabel="synthetic one O0" />);
    await user.click(screen.getByRole("button", { name: "Inspect logical output after instruction 1" }));
    const selected = screen.getByRole("region", { name: "Selected logical value" });
    expect(selected).toHaveTextContent("instruction 2, operand 1");
    const panel = screen.getByRole("region", { name: "Finite-region logical liveness" });
    expect(panel.querySelectorAll('[data-selected-live="true"]')).toHaveLength(1);
    expect(panel.querySelector('[data-boundary="1"]')).toHaveAttribute("data-selected-live", "true");
    await user.click(screen.getByRole("button", { name: "Inspect logical output after instruction 1" }));
    expect(screen.queryByRole("region", { name: "Selected logical value" })).not.toBeInTheDocument();
  });
  it("clears on a changed full selection and does not resurrect when the previous case returns", async () => {
    const user = userEvent.setup(), shared = model();
    const view = render(<OrderedRoleLiveness model={shared} selectionIdentity="same-source-O0" caseLabel="synthetic one O0" />);
    await user.click(screen.getByRole("button", { name: "Inspect logical input0 entry" }));
    view.rerender(<OrderedRoleLiveness model={shared} selectionIdentity="same-source-O3" caseLabel="synthetic one O3" />);
    expect(screen.queryByRole("region", { name: "Selected logical value" })).not.toBeInTheDocument();
    view.rerender(<OrderedRoleLiveness model={shared} selectionIdentity="same-source-O0" caseLabel="synthetic one O0" />);
    expect(screen.queryByRole("region", { name: "Selected logical value" })).not.toBeInTheDocument();
  });
  it("does not present a selection against a different immutable model", async () => {
    const user = userEvent.setup();
    const view = render(<OrderedRoleLiveness model={model()} selectionIdentity="synthetic" caseLabel="synthetic" />);
    await user.click(screen.getByRole("button", { name: "Inspect logical input0 entry" }));
    view.rerender(<OrderedRoleLiveness model={model()} selectionIdentity="synthetic" caseLabel="synthetic replacement" />);
    expect(screen.queryByRole("region", { name: "Selected logical value" })).not.toBeInTheDocument();
  });
});
