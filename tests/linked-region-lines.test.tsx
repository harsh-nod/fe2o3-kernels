import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import evidence from "../examples/linked_region_lines_v1.json";
import native from "../examples/source_instruction_native_comparison_v1.json";
import { LinkedRegionLines } from "../src/components/LinkedRegionLines";
import { FinalNativeComparison } from "../src/components/FinalNativeComparison";
import * as linked from "../src/content/linked-region-lines.mjs";
const props = { evidence, expectedCapsuleSha256: evidence.sha256 };
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it("renders exact O0/O3 whole regions with keyboard selection and unabridged source", async () => {
  const user = userEvent.setup(), fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  render(<LinkedRegionLines {...props} />);
  const table = await screen.findByRole("table", { name: "Retained linked-line cases" });
  expect(within(table).getAllByRole("row")).toHaveLength(3);
  const button = screen.getByRole("button", { name: "Inspect linked lines O3", exact: true });
  button.focus(); await user.keyboard(" ");
  expect(button).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("table", { name: "Whole-region line coverage" })).toHaveTextContent("[0x1900, 0x1958)");
  expect(screen.getByRole("table", { name: "Whole-region line coverage" })).toHaveTextContent("[0x192c, 0x1938)");
  await user.click(screen.getByText("Exact retained source and selected whole region", { exact: true }));
  expect(screen.getByLabelText("Retained linked-line source")).toHaveTextContent("λ");
  const mark = screen.getByLabelText("Retained linked-line source").querySelector("mark");
  expect(mark?.textContent).toMatch(/^fe2o3_device::amdgpu_ordered_program!/u);
  expect(screen.getByText(/not per-instruction source attribution/u)).toBeVisible();
  expect(fetch).not.toHaveBeenCalled();
});
it("immediately clears visible rows when the independently selected pin changes", async () => {
  const { rerender } = render(<LinkedRegionLines {...props} />);
  await screen.findByRole("table", { name: "Retained linked-line cases" });
  rerender(<LinkedRegionLines {...props} expectedCapsuleSha256={"1".repeat(64)} />);
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(await screen.findByText("Selected linked-line capsule is stale.")).toHaveAttribute("data-state", "invalid");
});
it("ignores stale asynchronous completion after evidence replacement", async () => {
  const ready = await linked.projectLinkedRegionLines(evidence, evidence.sha256);
  let finish!: (value: linked.LinkedLineProjection) => void;
  vi.spyOn(linked, "projectLinkedRegionLines").mockReturnValueOnce(new Promise(resolve => { finish = resolve; }))
    .mockResolvedValueOnce({ status: "invalid", detail: "Replacement refused." });
  const { rerender } = render(<LinkedRegionLines {...props} />);
  rerender(<LinkedRegionLines {...props} expectedCapsuleSha256={"1".repeat(64)} />);
  await screen.findByText("Replacement refused.");
  await act(async () => { finish(ready); });
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByText("Replacement refused.")).toHaveAttribute("data-state", "invalid");
});
it("hides all rows without WebCrypto rather than substituting examples", async () => {
  vi.stubGlobal("crypto", undefined); render(<LinkedRegionLines {...props} />);
  expect(await screen.findByText(/WebCrypto unavailable/u)).toHaveAttribute("data-state", "unavailable");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
it("keeps the old fourteen-artifact comparison independent when the new evidence is refused", async () => {
  render(<><FinalNativeComparison evidence={native}
    expectedJoinSha256="5230415719fa0c7c81473d5fea338d5f3a85c7a3a9a91fd55c3900e20165d162" />
    <LinkedRegionLines {...props} expectedCapsuleSha256={"1".repeat(64)} /></>);
  await screen.findByRole("table", { name: "Declared and encoded native resources" });
  expect(await screen.findByText("Selected linked-line capsule is stale.")).toHaveAttribute("data-state", "invalid");
  expect(screen.queryByRole("table", { name: "Retained linked-line cases" })).not.toBeInTheDocument();
  expect(screen.getByRole("table", { name: "Exact native instruction bytes" })).toBeVisible();
});
it("starts a remounted capsule at O0 and exposes no execution controls", async () => {
  const user = userEvent.setup(), first = render(<LinkedRegionLines {...props} />);
  await screen.findByRole("table", { name: "Retained linked-line cases" });
  await user.click(screen.getByRole("button", { name: "Inspect linked lines O3", exact: true }));
  first.unmount(); render(<LinkedRegionLines {...props} />);
  expect(await screen.findByRole("button", { name: "Inspect linked lines O0", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(screen.queryByRole("button", { name: /compile|run|launch|resume/iu })).not.toBeInTheDocument();
});
