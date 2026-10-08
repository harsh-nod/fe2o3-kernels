import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import native from "../examples/source_instruction_native_comparison_v1.json";
import evidence from "../examples/authored_register_demand_v1.json";
import { FinalNativeComparison } from "../src/components/FinalNativeComparison";
import * as demand from "../src/content/authored-register-demand.mjs";
const props = { evidence: native, expectedJoinSha256: "5230415719fa0c7c81473d5fea338d5f3a85c7a3a9a91fd55c3900e20165d162",
  authoredDemand: { evidence, expectedSha256: "39ab4d99bef9a04ac6f2f55b727b63148173ce27d7471066dde819fe264bd30e" } };
const nativeTable = () => screen.getByRole("table", { name: "Exact native instruction bytes" });
const roleTable = () => screen.getByRole("table", { name: "Declared VGPR roles by retained instruction" });
const demandTable = () => screen.getByRole("table", { name: "Authored value demand by logical boundary" });
const marked = (table: HTMLElement) => table.querySelectorAll('[data-static-selected="true"]');
async function ready() { await screen.findByRole("table", { name: "Authored value demand by logical boundary" }); }
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it("links keyboard native selection to exact static uses and versioned read/write cells", async () => {
  const user = userEvent.setup(), fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  render(<FinalNativeComparison {...props} />); await ready();
  const button = within(nativeTable()).getAllByRole("button")[1];
  expect(button).toHaveAccessibleName("Select static instruction 2 at file offset 2696");
  button.focus(); await user.keyboard(" ");
  expect(button).toHaveFocus(); expect(button).toHaveAttribute("aria-pressed", "true");
  expect(marked(nativeTable())).toHaveLength(1); expect(marked(roleTable())).toHaveLength(6);
  expect(marked(demandTable())).toHaveLength(5); // 2 headers, 2 old operand versions, 1 new definition.
  expect(within(roleTable()).getByText("Selected static instruction")).toBeVisible();
  expect(within(demandTable()).getByText("Selected read boundary").closest("th")).toHaveTextContent("Boundary 3");
  expect(within(demandTable()).getByText("Selected write boundary").closest("th")).toHaveTextContent("Boundary 4");
  expect(screen.getByLabelText("Selected authored boundary identities")).toHaveTextContent("b14c01a4a61e5e6e5d5406a1019ac3be53c58ba9d003968cecd087bdb26df555");
  expect(screen.getByText(/not execution stepping/u)).toBeVisible(); expect(fetch).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: /step|continue|breakpoint|launch/u })).not.toBeInTheDocument();
});
it("clears shared selection without losing independent register/value inspection", async () => {
  const user = userEvent.setup(); render(<FinalNativeComparison {...props} />); await ready();
  await user.click(within(nativeTable()).getAllByRole("button")[1]);
  const role = screen.getByRole("button", { name: "Inspect VGPR4 scratch" });
  const value = screen.getByRole("button", { name: "Inspect authored value 3 scratch", exact: true });
  await user.click(role); await user.click(value);
  await user.click(screen.getByRole("button", { name: "Clear static instruction selection" }));
  for (const table of [nativeTable(), roleTable(), demandTable()]) expect(marked(table)).toHaveLength(0);
  expect(role).toHaveAttribute("aria-pressed", "true"); expect(value).toHaveAttribute("aria-pressed", "true");
});
it("clears all shared highlights across both case dimensions", async () => {
  const user = userEvent.setup(); render(<FinalNativeComparison {...props} />); await ready();
  for (const name of ["Inspect default O3", "Inspect edited O3", "Inspect default O0"]) {
    await user.click(within(nativeTable()).getAllByRole("button")[0]);
    await user.click(screen.getByRole("button", { name })); await ready();
    for (const table of [nativeTable(), roleTable(), demandTable()]) expect(marked(table)).toHaveLength(0);
  }
});
it("drops selection immediately on same-byte native object replacement", async () => {
  const user = userEvent.setup(), { rerender } = render(<FinalNativeComparison {...props} />); await ready();
  await user.click(within(nativeTable()).getAllByRole("button")[0]);
  rerender(<FinalNativeComparison {...props} evidence={structuredClone(native)} />);
  expect(screen.queryByRole("table")).not.toBeInTheDocument(); await ready();
  for (const table of [nativeTable(), roleTable(), demandTable()]) expect(marked(table)).toHaveLength(0);
});
it("clears native/role selection too when the independent demand object or pin changes", async () => {
  const user = userEvent.setup(), { rerender } = render(<FinalNativeComparison {...props} />); await ready();
  await user.click(within(nativeTable()).getAllByRole("button")[0]);
  const replacement = { evidence: structuredClone(evidence), expectedSha256: props.authoredDemand.expectedSha256 };
  rerender(<FinalNativeComparison {...props} authoredDemand={replacement} />);
  expect(marked(nativeTable())).toHaveLength(0); expect(marked(roleTable())).toHaveLength(0);
  expect(screen.queryByRole("table", { name: "Authored value demand by logical boundary" })).not.toBeInTheDocument();
  await ready(); await user.click(within(nativeTable()).getAllByRole("button")[0]);
  rerender(<FinalNativeComparison {...props} authoredDemand={{ ...replacement, expectedSha256: "9".repeat(64) }} />);
  expect(marked(nativeTable())).toHaveLength(0); expect(marked(roleTable())).toHaveLength(0);
  await screen.findByText("Selected authored-demand capsule is stale.");
  rerender(<FinalNativeComparison {...props} />); await ready();
  for (const table of [nativeTable(), roleTable(), demandTable()]) expect(marked(table)).toHaveLength(0);
});
it("does not restore an old demand highlight after replacement refuses and late completion arrives", async () => {
  const valid = await demand.projectAuthoredDemand(native, props.expectedJoinSha256, evidence, props.authoredDemand.expectedSha256);
  let finish!: (result: demand.AuthoredDemandProjection) => void;
  vi.spyOn(demand, "projectAuthoredDemand").mockReturnValueOnce(new Promise(resolve => { finish = resolve; }))
    .mockResolvedValueOnce({ status: "invalid", detail: "Replacement refused." });
  const user = userEvent.setup(), { rerender } = render(<FinalNativeComparison {...props} />);
  await screen.findByRole("table", { name: "Exact native instruction bytes" });
  await user.click(within(nativeTable()).getAllByRole("button")[0]);
  rerender(<FinalNativeComparison {...props} authoredDemand={{ evidence: {}, expectedSha256: "0".repeat(64) }} />);
  await screen.findByText("Replacement refused."); await act(async () => { finish(valid); });
  expect(screen.queryByRole("table", { name: "Authored value demand by logical boundary" })).not.toBeInTheDocument();
  expect(marked(nativeTable())).toHaveLength(0); expect(marked(roleTable())).toHaveLength(0);
});
it("keeps valid native selection useful when optional demand is absent", async () => {
  const user = userEvent.setup(); render(<FinalNativeComparison evidence={native} expectedJoinSha256={props.expectedJoinSha256} />);
  await screen.findByRole("table", { name: "Exact native instruction bytes" });
  await user.click(within(nativeTable()).getAllByRole("button")[2]);
  expect(marked(roleTable())).toHaveLength(6);
  expect(screen.queryByRole("table", { name: "Authored value demand by logical boundary" })).not.toBeInTheDocument();
});
