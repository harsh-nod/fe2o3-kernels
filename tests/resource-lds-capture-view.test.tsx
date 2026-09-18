import { webcrypto } from "node:crypto";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import retainedUtf8 from "../examples/source_lds_resource_v1.json?raw";
import { ResourceLdsCaptureView } from "../src/components/ResourceLdsCaptureView";
import * as capture from "../src/content/resource-lds-capture";

const props = { retainedUtf8, expectedSha256: "1d1ab41c25693745d233af08f856834d123f8abbb8888f418b1cf5db4a63b494" };
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("retained LDS resource view", () => {
  it("shows actual uninitialized LDS then the reduction bytes with no backend effects", async () => {
    const user = userEvent.setup(), request = vi.fn(); vi.stubGlobal("fetch", request);
    render(<ResourceLdsCaptureView {...props} />);
    const selector = await screen.findByRole("combobox", { name: "Retained LDS checkpoint" });
    let grid = screen.getByRole("group", { name: "Captured memory cells" });
    expect(within(grid).getAllByRole("button")).toHaveLength(256);
    expect(within(grid).getByRole("button", { name: "Byte offset 0, 1 byte, 0x00, uninitialized" })).toBeInTheDocument();
    await user.selectOptions(selector, "2");
    expect(screen.getByText("15133 / 11", { selector: "strong" })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "Memory cell size" }), "4");
    grid = screen.getByRole("group", { name: "Captured memory cells" });
    expect(within(grid).getAllByRole("button")).toHaveLength(64);
    expect(within(grid).getByRole("button", { name: "Byte offset 0, 4 bytes, 0x80000000, initialized" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Captured memory access occurrences" })).toHaveTextContent("write committed");
    expect(screen.getByText(/Bundle FILE SHA-256/u)).toBeInTheDocument();
    expect(screen.getByText(/not an admitted bundle subject identity/u)).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });

  it("resets window and cell selection across checkpoints and exposes unavailable windows", async () => {
    const user = userEvent.setup();
    render(<ResourceLdsCaptureView {...props} />);
    const selector = await screen.findByRole("combobox", { name: "Retained LDS checkpoint" });
    await user.selectOptions(screen.getByRole("combobox", { name: "Captured LDS example byte window" }), "1");
    await user.click(screen.getByRole("button", { name: "Next window" }));
    expect(screen.getByText("Visible allocation-relative byte range [256, 264).")).toBeInTheDocument();
    await user.selectOptions(selector, "1");
    expect(screen.getByText(/global byte window not retained/u)).toBeInTheDocument();
    expect(screen.getByText("Visible allocation-relative byte range [0, 256).")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous window" })).toBeDisabled();
    await user.selectOptions(selector, "3");
    expect(screen.getByText(/not a post-release snapshot/u)).toBeInTheDocument();
    expect(screen.getByText(/workgroup byte window not retained/u)).toBeInTheDocument();
    const access = screen.getByRole("table", { name: "Captured memory access occurrences" });
    expect(within(access).getAllByRole("row")).toHaveLength(15);
  });

  it("immediately hides all prior cells on raw-byte or independent-pin changes", async () => {
    const { rerender } = render(<ResourceLdsCaptureView {...props} />);
    await screen.findByRole("combobox", { name: "Retained LDS checkpoint" });
    rerender(<ResourceLdsCaptureView {...props} expectedSha256={"1".repeat(64)} />);
    expect(screen.queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
    expect(await screen.findByText(/differ from the independent SHA-256 pin/u)).toHaveAttribute("data-state", "invalid");
  });

  it("cancels superseded work and ignores its late successful completion", async () => {
    const ready = await capture.projectResourceLdsCapture(props.retainedUtf8, props.expectedSha256);
    let finish!: (value: capture.ResourceLdsCaptureProjection) => void;
    const pending = new Promise<capture.ResourceLdsCaptureProjection>((resolve) => { finish = resolve; });
    const spy = vi.spyOn(capture, "projectResourceLdsCapture").mockReturnValueOnce(pending)
      .mockResolvedValueOnce({ status: "invalid", detail: "Newer input rejected." });
    const { rerender, unmount } = render(<ResourceLdsCaptureView {...props} />);
    const firstSignal = spy.mock.calls[0][2]!;
    rerender(<ResourceLdsCaptureView {...props} retainedUtf8="{}" />);
    expect(firstSignal.aborted).toBe(true);
    await screen.findByText(/Newer input rejected/u);
    await act(async () => { finish(ready); });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    const secondSignal = spy.mock.calls[1][2]!;
    unmount(); expect(secondSignal.aborted).toBe(true);
  });
});
