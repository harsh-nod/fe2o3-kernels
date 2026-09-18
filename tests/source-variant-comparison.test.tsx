import { webcrypto } from "node:crypto";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import retained from "../examples/ordinary_bitwise_promotion_v1.json";
import { SourceVariantComparison } from "../src/components/SourceVariantComparison";
import * as comparison from "../src/content/source-variant-comparison";

const props = { evidence: retained, expectedReceiptSha256: "908100a406d336cfc5bc28b6c584e5830293a951cf7b3e8f9245130520603142" };
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("retained actual source comparison", () => {
  it("shows exact source and qualified CPU cases without compilation or requests", async () => {
    const request = vi.fn(); vi.stubGlobal("fetch", request);
    render(<SourceVariantComparison {...props} />);
    const results = await screen.findByRole("table", { name: "Independent CPU case comparison" });
    expect(within(results).getAllByText("469 each")).toHaveLength(2);
    expect(within(results).getByText("0 each")).toBeInTheDocument();
    expect(screen.getByLabelText("Original ordinary Rust exact source").textContent).toBe(retained.variants[0].source.utf8);
    expect(screen.getByText(/compiler commit pin and qualified release pin are unavailable/u)).toBeInTheDocument();
    expect(screen.getByText(/not producer authentication/u)).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /compile|run|launch|apply/u })).not.toBeInTheDocument();
  });

  it("switches variants without carrying a selected SSA operation across snapshots", async () => {
    const user = userEvent.setup();
    render(<SourceVariantComparison {...props} />);
    await screen.findByRole("table", { name: "Independent CPU case comparison" });
    await user.click(screen.getByRole("button", { name: "Inspect operation 0:0:4" }));
    expect(screen.getByRole("region", { name: "Selected operation detail" })).toHaveTextContent("binary");
    await user.click(screen.getByRole("tab", { name: "Unchanged generated helper" }));
    expect(screen.queryByRole("region", { name: "Selected operation detail" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("No operation selected");
    expect(screen.getByLabelText("Unchanged generated helper exact source").textContent).toBe(retained.variants[1].source.utf8);
    expect(screen.getByLabelText("Unchanged generated helper exact source")).toHaveTextContent("fe2o3_device::amdgpu_asm!");
    await user.click(screen.getByRole("button", { name: "Inspect operation 1:0:0" }));
    expect(screen.getByRole("region", { name: "Selected operation detail" })).toHaveTextContent("v_or_b32");
    await user.click(screen.getByRole("tab", { name: "Edited OR to AND helper" }));
    expect(screen.queryByRole("region", { name: "Selected operation detail" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Edited OR to AND helper exact source").textContent).toBe(retained.variants[2].source.utf8);
  });

  it("supports keyboard tabs and keeps only the selected variant's operations", async () => {
    const user = userEvent.setup();
    render(<SourceVariantComparison {...props} />);
    await screen.findByRole("table", { name: "Independent CPU case comparison" });
    screen.getByRole("tab", { name: "Original ordinary Rust" }).focus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Edited OR to AND helper" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Edited OR to AND helper" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("table", { name: "Original ordinary Rust retained operations" })).not.toBeInTheDocument();
    await user.keyboard("{Home}{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Unchanged generated helper" })).toHaveFocus();
  });

  it("immediately removes prior source on a changed capture selection", async () => {
    const { rerender } = render(<SourceVariantComparison {...props} />);
    await screen.findByRole("table", { name: "Independent CPU case comparison" });
    rerender(<SourceVariantComparison {...props} expectedReceiptSha256={"1".repeat(64)} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Original ordinary Rust exact source")).not.toBeInTheDocument();
    expect(await screen.findByText(/selected capture receipt is stale/u)).toHaveAttribute("data-state", "invalid");
  });

  it("ignores an old asynchronous completion after newer input was rejected", async () => {
    const actual = await comparison.projectSourceVariantComparison(retained, props.expectedReceiptSha256);
    let finish!: (value: comparison.SourceVariantComparisonProjection) => void;
    const delayed = new Promise<comparison.SourceVariantComparisonProjection>((resolve) => { finish = resolve; });
    vi.spyOn(comparison, "projectSourceVariantComparison").mockReturnValueOnce(delayed)
      .mockResolvedValueOnce({ status: "invalid", detail: "Newer selection rejected." });
    const { rerender } = render(<SourceVariantComparison {...props} />);
    rerender(<SourceVariantComparison {...props} evidence={{}} />);
    await screen.findByText(/Newer selection rejected/u);
    await act(async () => { finish(actual); });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText(/Newer selection rejected/u)).toBeInTheDocument();
  });
});
