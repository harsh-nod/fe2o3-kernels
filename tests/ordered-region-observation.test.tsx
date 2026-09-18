import { webcrypto } from "node:crypto";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OrderedRegionObservation } from "../src/components/OrderedRegionObservation";
import { ORDERED_REGION_RETAINED_INPUT as retained } from "../src/content/ordered-region-retained-input";
import * as projection from "../src/content/ordered-region-observation";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe("actual r5 authored-role and logical-value view", () => {
  it("separates five authored roles from logical values, zero, unavailable physical state and source coordinates", async () => {
    const request = vi.fn(); vi.stubGlobal("fetch", request);
    const user = userEvent.setup(); render(<OrderedRegionObservation input={retained} />);
    const plan = await screen.findByRole("table", { name: "Authored physical role bindings" });
    expect(within(plan).getAllByRole("row")).toHaveLength(6);
    expect(within(plan).getByText("v32")).toBeInTheDocument();
    const logical = screen.getByRole("table", { name: "Selected logical SSA checkpoint values" });
    expect(within(logical).getAllByText("0x00000000 (0)")).toHaveLength(3);
    expect(logical).not.toHaveTextContent("v32"); expect(logical).toHaveTextContent("Not provided for this phase");
    await user.click(screen.getByRole("radio", { name: "After whole region" }));
    expect(within(logical).getAllByText("0x00000000 (0)")).toHaveLength(1);
    expect(within(logical).getAllByText("Not retained separately for this phase")).toHaveLength(3);
    expect(screen.getByText(/raw KIR block ID 8 is a separate identifier/u)).toHaveTextContent("0:1:0");
    expect(screen.getByText(/final-artifact mapping:/u)).toHaveTextContent("unavailable");
    expect(screen.getByText(/private compiler-owner/u)).toHaveTextContent("not detached-transcript admission");
    expect(screen.queryByRole("button", { name: /compile|launch|apply|resume/u })).not.toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });

  it("browses only real cases/lanes and resets phase, lane and request selection across compilations", async () => {
    const user = userEvent.setup(); render(<OrderedRegionObservation input={retained} />);
    const cases = await screen.findByRole("combobox", { name: "Retained CPU request case" });
    expect(within(cases).getAllByRole("option")).toHaveLength(6);
    await user.selectOptions(cases, "5");
    const lanes = screen.getByRole("combobox", { name: "Retained logical lane index" });
    expect(within(lanes).getAllByRole("option")).toHaveLength(64);
    await user.selectOptions(lanes, "63");
    screen.getByRole("radio", { name: "After whole region" }).focus(); await user.keyboard(" ");
    expect(screen.getByTestId("ordered-region-logical-selection")).toHaveTextContent("Case 6 · logical lane index 63 · after");
    expect(screen.getByRole("table", { name: "Selected logical SSA checkpoint values" })).toHaveTextContent("0x0000002e (46)");
    await user.selectOptions(lanes, "1"); expect(screen.getByRole("radio", { name: "Before whole region" })).toBeChecked();
    await user.selectOptions(screen.getByRole("combobox", { name: "Source compilation feature" }), "1");
    expect(screen.getByRole("combobox", { name: "Retained CPU request case" })).toHaveValue("0");
    expect(screen.getByRole("combobox", { name: "Retained logical lane index" })).toHaveValue("0");
    expect(screen.getByRole("radio", { name: "Before whole region" })).toBeChecked();
    expect(screen.getByRole("table", { name: "Selected logical SSA checkpoint values" })).not.toHaveTextContent("0x0000002e");
    expect(screen.getByRole("table", { name: "Authored physical role bindings" })).toHaveTextContent("v32");
    expect(screen.getAllByRole("table")).toHaveLength(2);
    expect(screen.getAllByRole("row")).toHaveLength(11);
  });

  it("immediately removes prior plan and values for changed capture bytes/pins", async () => {
    const user = userEvent.setup(), { rerender } = render(<OrderedRegionObservation input={retained} />);
    await user.selectOptions(await screen.findByRole("combobox", { name: "Retained CPU request case" }), "5");
    await user.click(screen.getByRole("radio", { name: "After whole region" }));
    rerender(<OrderedRegionObservation input={{ ...retained, expectedSourceLadderSha256: "1".repeat(64) }} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(await screen.findByText(/Source ladder bytes differ/u)).toHaveAttribute("data-state", "invalid");
    rerender(<OrderedRegionObservation input={retained} />);
    expect(await screen.findByRole("combobox", { name: "Retained CPU request case" })).toHaveValue("0");
    expect(screen.getByRole("radio", { name: "Before whole region" })).toBeChecked();
  });

  it("suppresses late successful projection after replacement or unmount", async () => {
    const ready = await projection.projectOrderedRegionObservation(retained);
    let finish!: (value: projection.OrderedRegionObservationProjection) => void;
    const pending = new Promise<projection.OrderedRegionObservationProjection>(resolve => { finish = resolve; });
    vi.spyOn(projection, "projectOrderedRegionObservation").mockReturnValueOnce(pending)
      .mockResolvedValueOnce({ status: "invalid", detail: "Newer capture rejected." });
    const { rerender, unmount } = render(<OrderedRegionObservation input={retained} />);
    rerender(<OrderedRegionObservation input={{ ...retained }} />);
    await screen.findByText(/Newer capture rejected/u);
    await act(async () => { finish(ready); });
    expect(screen.queryByRole("table")).not.toBeInTheDocument(); unmount();
  });

  it("shows a truthful empty draft when no retained input is supplied", async () => {
    render(<OrderedRegionObservation input={null} />);
    expect(await screen.findByText(/No retained source observation supplied/u)).toHaveAttribute("data-state", "unavailable");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
