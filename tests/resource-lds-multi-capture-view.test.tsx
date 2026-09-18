import { webcrypto } from "node:crypto";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import retainedUtf8 from "../examples/source_lds_multi_workgroup_v1.json?raw";
import { ResourceLdsMultiCaptureView } from "../src/components/ResourceLdsMultiCaptureView";
import * as capture from "../src/content/resource-lds-multi-capture";

const props = { retainedUtf8, expectedSha256: "13165393fd04bb857f80886984b0e7a31262209cc2546d117d650cc2179fe441" };
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe("retained two-workgroup LDS view", () => {
  it("links a real historical range to checkpoint storage with separate accessible markers", async () => {
    const user = userEvent.setup(), request = vi.fn(); vi.stubGlobal("fetch", request);
    render(<ResourceLdsMultiCaptureView {...props} />);
    const checkpoints = await screen.findByRole("combobox", { name: "Retained two-workgroup LDS checkpoint" });
    await user.selectOptions(checkpoints, "5");
    const cells = screen.getByRole("group", { name: "Captured memory cells" });
    const bytes = Array.from(cells.querySelectorAll("code"), (cell) => cell.textContent);
    expect(cells.querySelectorAll("[data-access-marker]")).toHaveLength(4);
    expect(screen.getByTestId("historical-access-overlay")).toHaveAttribute("data-state", "ready");
    const first = within(cells).getByRole("button", { name: "Byte offset 0, 1 byte, 0x80, initialized" });
    expect(first).toHaveAttribute("data-access-marker", "W");
    expect(first).toHaveAccessibleDescription(/Historical access over current checkpoint storage/u);
    first.focus(); await user.keyboard("{ArrowRight}");
    expect(within(cells).getAllByRole("button")[1]).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Next retained access" }));
    expect(first).not.toHaveAttribute("data-access-marker");
    expect(within(cells).getAllByRole("button")[4]).toHaveAttribute("data-access-marker", "W");
    expect(Array.from(cells.querySelectorAll("code"), (cell) => cell.textContent)).toEqual(bytes);
    expect(first).toHaveAccessibleName("Byte offset 0, 1 byte, 0x80, initialized");
    expect(screen.getByTestId("historical-access-overlay")).toHaveTextContent("cursor 31211, revision 19");
    await user.selectOptions(screen.getByRole("combobox", { name: "Memory cell size" }), "4");
    expect(within(cells).getAllByRole("button")).toHaveLength(64);
    expect(cells.querySelectorAll("[data-access-marker]")).toHaveLength(1);
    expect(cells.querySelector("[data-access-marker]")).toHaveTextContent("W · 4/4 B");
    await user.selectOptions(checkpoints, "4");
    expect(screen.getByTestId("historical-access-overlay")).toHaveAttribute("data-state", "different_allocation");
    expect(screen.getByRole("group", { name: "Captured memory cells" }).querySelectorAll("[data-access-marker]")).toHaveLength(0);
    await user.selectOptions(screen.getByRole("combobox", { name: "Two-workgroup retained access page" }), "1");
    expect(screen.getByTestId("historical-access-overlay")).toHaveAttribute("data-state", "no_selection");
    expect(screen.getByTestId("historical-access-overlay")).toHaveTextContent("More backend pages exist");
    expect(request).not.toHaveBeenCalled();
  });

  it("retains event selection across bounded viewports without painting other windows or canaries", async () => {
    const user = userEvent.setup(); render(<ResourceLdsMultiCaptureView {...props} />);
    await user.selectOptions(await screen.findByRole("combobox", { name: "Retained two-workgroup LDS checkpoint" }), "6");
    await user.selectOptions(screen.getByRole("combobox", { name: "Two-workgroup retained access page" }), "1");
    const overlay = screen.getByTestId("historical-access-overlay");
    expect(overlay).toHaveAttribute("data-state", "off_window");
    expect(overlay).toHaveTextContent("[256, 260)");
    await user.click(screen.getByRole("button", { name: "Next window" }));
    expect(overlay).toHaveAttribute("data-state", "ready");
    const cells = screen.getByRole("group", { name: "Captured memory cells" });
    expect(cells.querySelectorAll("[data-access-marker]")).toHaveLength(4);
    expect(within(cells).getAllByRole("button")).toHaveLength(256);
    await user.click(screen.getByRole("button", { name: "Next window" }));
    expect(overlay).toHaveAttribute("data-state", "off_window");
    expect(within(cells).getAllByRole("button")).toHaveLength(8);
    expect(cells.querySelectorAll("[data-access-marker]")).toHaveLength(0);
    expect(screen.getByRole("combobox", { name: "Selected retained access event" })).toHaveValue("31210");
    expect(overlay).toHaveTextContent("not at the selected access event");
  });

  it("selects only retained lanes/events without moving or replacing checkpoint memory", async () => {
    const user = userEvent.setup(), request = vi.fn(); vi.stubGlobal("fetch", request);
    render(<ResourceLdsMultiCaptureView {...props} />);
    const checkpoints = await screen.findByRole("combobox", { name: "Retained two-workgroup LDS checkpoint" });
    await user.selectOptions(checkpoints, "4");
    const cells = screen.getByRole("group", { name: "Captured memory cells" }), before = cells.textContent;
    const selected = screen.getByTestId("selected-retained-access");
    expect(selected).toHaveTextContent("Selected retained event 12");
    expect(selected).toHaveTextContent("cursor 16080, revision 15");
    const wave = screen.getByRole("combobox", { name: "Filter captured access rows by logical wave" });
    expect(within(wave).getAllByRole("option")).toHaveLength(2);
    await user.selectOptions(wave, within(wave).getAllByRole("option")[1]);
    const lanes = screen.getByRole("combobox", { name: "Filter captured access rows by logical scope" });
    expect(within(lanes).getAllByRole("option")).toHaveLength(17);
    await user.selectOptions(lanes, "Workgroup [0, 0, 0], logical wave 0, lane 1");
    expect(selected).toHaveTextContent("Selected retained event 28");
    expect(screen.getByRole("button", { name: "Previous retained access" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next retained access" })).toBeDisabled();
    await user.selectOptions(lanes, "all");
    await user.click(screen.getByRole("button", { name: "Next retained access" }));
    expect(selected).toHaveTextContent("Selected retained event 28");
    await user.click(screen.getByRole("button", { name: "Select retained access event 60" }));
    expect(screen.getByRole("combobox", { name: "Selected retained access event" })).toHaveValue("60");
    expect(cells.textContent).toBe(before);
    expect(screen.getByText("16080 / 15", { selector: "strong" })).toBeInTheDocument();
    expect(selected).toHaveTextContent("does not restore its event");
    await user.selectOptions(screen.getByRole("combobox", { name: "Two-workgroup retained access page" }), "1");
    expect(screen.getByTestId("selected-retained-access")).toHaveTextContent("No retained access is selected");
    expect(screen.getByRole("combobox", { name: "Selected retained access event" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next retained access" })).toBeDisabled();
    await user.selectOptions(screen.getByRole("combobox", { name: "Two-workgroup retained access page" }), "0");
    expect(screen.getByRole("combobox", { name: "Selected retained access event" })).toHaveValue("12");
    expect(screen.getByRole("combobox", { name: "Filter captured access rows by logical wave" })).toHaveValue("all");
    expect(request).not.toHaveBeenCalled();
  });

  it("navigates checkpoints in recorded order, retaining repeated cursors and resetting selections", async () => {
    const user = userEvent.setup(); render(<ResourceLdsMultiCaptureView {...props} />);
    await screen.findByRole("combobox", { name: "Retained two-workgroup LDS checkpoint" });
    expect(screen.getByRole("button", { name: "Previous retained checkpoint" })).toBeDisabled();
    const sequence = ["16079 / 10", "16080 / 11", "16078 / 13", "16080 / 15", "31211 / 19", "32156 / 22"];
    for (const identity of sequence) {
      screen.getByRole("button", { name: "Next retained checkpoint" }).focus();
      await user.keyboard("{Enter}");
      expect(screen.getByText(identity, { selector: "strong" })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Next retained checkpoint" })).toBeDisabled();
    await user.selectOptions(screen.getByRole("combobox", { name: "Selected retained access event" }), "15147");
    await user.click(screen.getByRole("button", { name: "Previous retained checkpoint" }));
    expect(screen.getByRole("combobox", { name: "Selected retained access event" })).toHaveValue("16090");
    expect(screen.getByText("Checkpoint 6 of 7, in capture order")).toBeInTheDocument();
  });

  it("navigates actual current, unavailable and restored windows without backend effects", async () => {
    const user = userEvent.setup(), request = vi.fn(); vi.stubGlobal("fetch", request);
    render(<ResourceLdsMultiCaptureView {...props} />);
    const selector = await screen.findByRole("combobox", { name: "Retained two-workgroup LDS checkpoint" });
    expect(within(selector).getAllByRole("option")).toHaveLength(7);
    expect(within(screen.getByRole("group", { name: "Captured memory cells" })).getAllByRole("button")).toHaveLength(256);
    await user.selectOptions(selector, "1");
    expect(screen.getByTestId("lds-multi-global-only")).toHaveTextContent("No LDS allocation appears");
    expect(screen.queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
    expect(screen.getByTestId("lds-multi-unavailable-window")).toHaveTextContent("alloc#2:g0");
    await user.selectOptions(selector, "2");
    expect(screen.getByRole("button", { name: "Byte offset 0, 1 byte, 0x00, uninitialized" })).toBeInTheDocument();
    expect(screen.getByText("16080 / 11", { selector: "strong" })).toBeInTheDocument();
    await user.selectOptions(selector, "3");
    expect(screen.getByText("16078 / 13", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByTestId("lds-multi-unavailable-window")).toHaveTextContent("alloc#3:g0");
    expect(screen.getByTestId("lds-multi-history")).toHaveTextContent("empty page does not establish empty access history");
    expect(request).not.toHaveBeenCalled();
  });

  it("separates WG0 historical rows from WG1 current inventory and bounds the rendered page", async () => {
    const user = userEvent.setup(); render(<ResourceLdsMultiCaptureView {...props} />);
    await user.selectOptions(await screen.findByRole("combobox", { name: "Retained two-workgroup LDS checkpoint" }), "4");
    const history = screen.getByTestId("lds-multi-history");
    expect(history).toHaveTextContent("WG0, alloc#2:g0");
    expect(history).toHaveTextContent("This allocation is absent from the current inventory");
    expect(screen.getByTestId("lds-multi-current-window")).toHaveTextContent("alloc#3:g0");
    expect(within(history).getAllByRole("row")).toHaveLength(17);
    await user.selectOptions(screen.getByRole("combobox", { name: "Two-workgroup retained access page" }), "1");
    expect(history).toHaveTextContent("zero matching rows");
    expect(history).toHaveTextContent("continuation token");
    expect(within(history).queryByRole("table")).not.toBeInTheDocument();
  });

  it("resets local selections, bounds dwords and shows the final global canary viewport", async () => {
    const user = userEvent.setup(); render(<ResourceLdsMultiCaptureView {...props} />);
    const selector = await screen.findByRole("combobox", { name: "Retained two-workgroup LDS checkpoint" });
    await user.selectOptions(selector, "5");
    await user.selectOptions(screen.getByRole("combobox", { name: "Memory cell size" }), "4");
    expect(within(screen.getByRole("group", { name: "Captured memory cells" })).getAllByRole("button")).toHaveLength(64);
    expect(screen.getByRole("button", { name: "Byte offset 0, 4 bytes, 0x80000000, initialized" })).toBeInTheDocument();
    await user.selectOptions(selector, "6");
    expect(screen.getByRole("combobox", { name: "Memory cell size" })).toHaveValue("1");
    expect(screen.getByText(/not a post-release snapshot/u)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next window" }));
    await user.click(screen.getByRole("button", { name: "Next window" }));
    expect(screen.getByText("Visible allocation-relative byte range [512, 520).")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Byte offset 512, 1 byte, 0xde, initialized" })).toBeInTheDocument();
    expect(within(screen.getByRole("group", { name: "Captured memory cells" })).getAllByRole("button")).toHaveLength(8);
  });

  it("immediately hides prior cells for changed raw bytes or independent pins", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ResourceLdsMultiCaptureView {...props} />);
    await user.selectOptions(await screen.findByRole("combobox", { name: "Retained two-workgroup LDS checkpoint" }), "5");
    expect(screen.getByTestId("historical-access-overlay")).toHaveAttribute("data-state", "ready");
    rerender(<ResourceLdsMultiCaptureView {...props} expectedSha256={"1".repeat(64)} />);
    expect(screen.queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("historical-access-overlay")).not.toBeInTheDocument();
    expect(await screen.findByText(/differ from the independent SHA-256 pin/u)).toHaveAttribute("data-state", "invalid");
    rerender(<ResourceLdsMultiCaptureView {...props} retainedUtf8="{}" />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await screen.findByText(/differ from the independent SHA-256 pin/u);
  });

  it("aborts superseded/unmounted work and suppresses late successful completion", async () => {
    const ready = await capture.projectResourceLdsMultiCapture(props.retainedUtf8, props.expectedSha256);
    let finish!: (value: capture.ResourceLdsMultiCaptureProjection) => void;
    const pending = new Promise<capture.ResourceLdsMultiCaptureProjection>((resolve) => { finish = resolve; });
    const spy = vi.spyOn(capture, "projectResourceLdsMultiCapture").mockReturnValueOnce(pending)
      .mockResolvedValueOnce({ status: "invalid", detail: "Newer input rejected." });
    const { rerender, unmount } = render(<ResourceLdsMultiCaptureView {...props} />), firstSignal = spy.mock.calls[0][2]!;
    rerender(<ResourceLdsMultiCaptureView {...props} retainedUtf8="{}" />); expect(firstSignal.aborted).toBe(true);
    await screen.findByText(/Newer input rejected/u); await act(async () => { finish(ready); });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    const secondSignal = spy.mock.calls[1][2]!; unmount(); expect(secondSignal.aborted).toBe(true);
  });
});
