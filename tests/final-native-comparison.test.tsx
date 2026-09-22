import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FinalNativeComparison } from "../src/components/FinalNativeComparison";
import * as comparison from "../src/content/final-native-comparison.mjs";

// Component state/accessibility controls use a deliberately mocked projection.
// Complete byte/schema validation is covered independently in the adapter tests.
function ready(): Extract<comparison.FinalNativeProjection, { status: "ready" }> {
  return {
    status: "ready", kind: "synthetic_test_only", captureName: "Synthetic UI controls",
    joinSha256: "1".repeat(64), sourceReceiptSha256: "2".repeat(64), retainedBytes: 1024,
    checkedArtifacts: 14, sourceExportsReported: 3, cpuSimulationsReported: 90,
    interpretation: "Retained byte integrity only; not trusted compiler provenance or native execution correctness.",
    unavailable: ["runtime physical-register values", "register lifetime or allocation proof", "native whole-kernel correctness",
      "hardware execution", "performance", "protected proof/admission", "compiler/runtime closure authentication"],
    cases: (["default", "edited"] as const).flatMap(profile => (["O0", "O3"] as const).map(optimization => ({
      id: profile + "-" + optimization, profile, optimization,
      source: "// synthetic " + profile + "\nfn choose_bits() {}\n",
      sourceSha256: "3".repeat(64), semanticSha256: "4".repeat(64), canonicalKirSha256: "5".repeat(64),
      llvm: "; synthetic uncompiled LLVM text", llvmSha256: "6".repeat(64),
      hsacoSha256: "7".repeat(64), hsacoBytes: optimization === "O0" ? 6152 : 5384,
      program: [
        { declaredInstruction: "v_xor_b32_e32", opcode: "V_XOR_B32_e32_vi", bytesHex: "0003082a",
          registers: ["VGPR4", "VGPR0", "VGPR1"], fileOffset: 96 },
        { declaredInstruction: "v_and_b32_e32", opcode: "V_AND_B32_e32_vi", bytesHex: "04050826",
          registers: ["VGPR4", "VGPR4", "VGPR2"], fileOffset: 100 },
        { declaredInstruction: profile === "default" ? "v_xor_b32_e32" : "v_or_b32_e32",
          opcode: profile === "default" ? "V_XOR_B32_e32_vi" : "V_OR_B32_e32_vi",
          bytesHex: profile === "default" ? "01090a2a" : "01090a28",
          registers: ["VGPR5", "VGPR1", "VGPR4"], fileOffset: 104 },
      ],
      staticInstructions: 3, declaredVgprHighWater: 6 as const, encodedVgprCapacity: optimization === "O0" ? 24 : 8,
      architectedVgprBoundary: 8, descriptorOffset: 0, descriptorSha256: "8".repeat(64),
      resource1: optimization === "O0" ? 2 : 0, resource3: 1,
      llvmBuildClaim: "synthetic LLVM claim", workerBuildClaim: "synthetic worker claim",
    }))),
  };
}
const props = { evidence: { synthetic: "UI-only mock" }, expectedJoinSha256: "1".repeat(64) };
beforeEach(() => { vi.spyOn(comparison, "projectFinalNativeComparison").mockImplementation(async () => ready()); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("separate final-native read-only comparison", () => {
  it("shows four cases, exact slice labels and integrity limits without requests or execution actions", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    render(<FinalNativeComparison {...props} />);
    const table = await screen.findByRole("table", { name: "Declared and encoded native resources" });
    expect(within(table).getAllByRole("button")).toHaveLength(4);
    expect(within(table).getAllByText("6")).toHaveLength(4);
    expect(within(table).getAllByText("24")).toHaveLength(2);
    expect(screen.getByText(/Synthetic test data/u)).toBeInTheDocument();
    expect(screen.getByText(/not trusted compiler provenance/u)).toBeInTheDocument();
    expect(screen.getByText(/not measured register usage, occupancy, performance/u)).toBeInTheDocument();
    expect(screen.getByText(/not new disassembly/u)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /compile|run|load|launch|apply|resume/u })).not.toBeInTheDocument();
  });
  it("switches source and final opcode together while retaining all four resource rows", async () => {
    const user = userEvent.setup(); render(<FinalNativeComparison {...props} />);
    await screen.findByRole("table", { name: "Declared and encoded native resources" });
    await user.click(screen.getByRole("button", { name: "Inspect edited O3" }));
    const selected = screen.getByRole("region", { name: "Selected final-native case" });
    expect(within(selected).getByRole("heading")).toHaveTextContent("edited O3");
    expect(within(selected).getByText("V_OR_B32_e32_vi")).toBeInTheDocument();
    expect(within(selected).getByText("01090a28")).toBeInTheDocument();
    expect(screen.getByLabelText("edited retained source").textContent).toBe("// synthetic edited\nfn choose_bits() {}\n");
    expect(screen.queryByLabelText("default retained source")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inspect edited O3" })).toHaveAttribute("aria-pressed", "true");
    expect(within(screen.getByRole("table", { name: "Declared and encoded native resources" })).getAllByRole("button")).toHaveLength(4);
  });
  it("supports native keyboard buttons without assigning runtime instruction-step semantics", async () => {
    const user = userEvent.setup(); render(<FinalNativeComparison {...props} />);
    await screen.findByRole("table", { name: "Declared and encoded native resources" });
    const button = screen.getByRole("button", { name: "Inspect default O3" }); button.focus(); await user.keyboard(" ");
    expect(button).toHaveFocus(); expect(button).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: /step|continue|breakpoint/u })).not.toBeInTheDocument();
  });
  it("clears the previous source and payload immediately when the digest changes", async () => {
    const { rerender } = render(<FinalNativeComparison {...props} />);
    await screen.findByRole("table", { name: "Declared and encoded native resources" });
    vi.mocked(comparison.projectFinalNativeComparison).mockResolvedValueOnce({ status: "invalid", detail: "Stale selected join." });
    rerender(<FinalNativeComparison {...props} expectedJoinSha256={"9".repeat(64)} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("default retained source")).not.toBeInTheDocument();
    expect(await screen.findByText(/Stale selected join/u)).toHaveAttribute("data-state", "invalid");
  });
  it("ignores late old completion after newer evidence has been refused", async () => {
    let finish!: (value: comparison.FinalNativeProjection) => void;
    const delayed = new Promise<comparison.FinalNativeProjection>(resolve => { finish = resolve; });
    vi.mocked(comparison.projectFinalNativeComparison).mockReturnValueOnce(delayed)
      .mockResolvedValueOnce({ status: "invalid", detail: "Newer evidence refused." });
    const { rerender } = render(<FinalNativeComparison {...props} />);
    rerender(<FinalNativeComparison {...props} evidence={{ changed: true }} />);
    await screen.findByText(/Newer evidence refused/u);
    await act(async () => { finish(ready()); });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText(/Newer evidence refused/u)).toBeInTheDocument();
  });
  it("shows an unavailable state instead of a synthetic substitute", async () => {
    vi.mocked(comparison.projectFinalNativeComparison).mockResolvedValueOnce({ status: "unavailable", detail: "WebCrypto unavailable." });
    render(<FinalNativeComparison {...props} />);
    expect(await screen.findByText(/WebCrypto unavailable/u)).toHaveAttribute("data-state", "unavailable");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
