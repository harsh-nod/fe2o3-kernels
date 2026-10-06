import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import native from "../examples/source_instruction_native_comparison_v1.json";
import evidence from "../examples/authored_register_demand_v1.json";
import { AuthoredRegisterDemand } from "../src/components/AuthoredRegisterDemand";
import { FinalNativeComparison } from "../src/components/FinalNativeComparison";
import * as demand from "../src/content/authored-register-demand.mjs";
const props = { nativeEvidence: native,
  expectedNativeJoin: "5230415719fa0c7c81473d5fea338d5f3a85c7a3a9a91fd55c3900e20165d162",
  demand: { evidence, expectedSha256: "39ab4d99bef9a04ac6f2f55b727b63148173ce27d7471066dde819fe264bd30e" }, profile: "default" as const, optimization: "O0" as const };
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it("renders accessible grid/ASCII and clears selection on profile or optimization replacement", async () => {
  const user = userEvent.setup(), fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const { rerender } = render(<AuthoredRegisterDemand {...props} />);
  await screen.findByRole("table", { name: "Authored value demand by logical boundary" });
  const button = screen.getByRole("button", { name: "Inspect authored value 3 scratch", exact: true });
  button.focus(); await user.keyboard(" ");
  expect(button).toHaveAttribute("aria-pressed", "true");
  await user.click(screen.getByText("Accessible authored-demand ASCII", { exact: true }));
  expect(screen.getByLabelText("Authored-demand ASCII")).toHaveTextContent("NOT physical allocation");
  rerender(<AuthoredRegisterDemand {...props} profile="edited" optimization="O3" />);
  expect(screen.getByRole("button", { name: "Inspect authored value 3 scratch", exact: true })).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByText(/Overwritten does not mean freed/u)).toBeVisible();
  expect(fetch).not.toHaveBeenCalled();
});
it("immediately removes previous rows on a changed pin and ignores late old completion", async () => {
  const ready = await demand.projectAuthoredDemand(native, props.expectedNativeJoin, evidence, props.demand.expectedSha256);
  let finish!: (result: demand.AuthoredDemandProjection) => void;
  vi.spyOn(demand, "projectAuthoredDemand").mockReturnValueOnce(new Promise(resolve => { finish = resolve; }))
    .mockResolvedValueOnce({ status: "invalid", detail: "New selected report refused." });
  const { rerender } = render(<AuthoredRegisterDemand {...props} />);
  rerender(<AuthoredRegisterDemand {...props} demand={{ evidence, expectedSha256: "1".repeat(64) }} />);
  await screen.findByText("New selected report refused.");
  await act(async () => { finish(ready); });
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByText("New selected report refused.")).toHaveAttribute("data-state", "invalid");
});
it("does not replace missing WebCrypto with synthetic rows", async () => {
  vi.stubGlobal("crypto", undefined); render(<AuthoredRegisterDemand {...props} />);
  expect(await screen.findByText(/WebCrypto unavailable/u)).toHaveAttribute("data-state", "unavailable");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});

it("removes already-visible demand immediately when its independent selected pin changes", async () => {
  const { rerender } = render(<AuthoredRegisterDemand {...props} />);
  await screen.findByRole("table", { name: "Authored value demand by logical boundary" });
  rerender(<AuthoredRegisterDemand {...props} demand={{ evidence, expectedSha256: "1".repeat(64) }} />);
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(await screen.findByText("Selected authored-demand capsule is stale.")).toHaveAttribute("data-state", "invalid");
});
it("malformed optional evidence does not hide a valid non-default native selection", async () => {
  const user = userEvent.setup();
  render(<FinalNativeComparison evidence={native} expectedJoinSha256={props.expectedNativeJoin}
    authoredDemand={{ evidence: { bytes: 2, sha256: "1".repeat(64), utf8: "{}" }, expectedSha256: "1".repeat(64) }} />);
  await screen.findByRole("table", { name: "Declared and encoded native resources" });
  await user.click(screen.getByRole("button", { name: "Inspect edited O3", exact: true }));
  await screen.findByText("Authored-demand capsule bytes changed.");
  expect(screen.getByRole("button", { name: "Inspect edited O3", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("table", { name: "Exact native instruction bytes" })).toHaveTextContent("V_OR_B32_e32_vi");
  expect(screen.queryByRole("table", { name: "Authored value demand by logical boundary" })).not.toBeInTheDocument();
});
