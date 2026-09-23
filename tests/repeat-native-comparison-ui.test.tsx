import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RepeatNativeComparison } from "../src/components/RepeatNativeComparison";
import * as comparison from "../src/content/repeat-native-comparison.mjs";
import { buildDeclaredRegisterUseGrid } from "../src/content/final-native-register-roles.mjs";

// Mocked UI/state controls only. The separate profile suites validate whole artifacts.
function ready(): Extract<comparison.RepeatNativeProjection, { status: "ready" }> {
  return {
    status: "ready", kind: "synthetic_test_only", captureName: "Synthetic repeat UI controls",
    joinSha256: "1".repeat(64), sourceReceiptSha256: "2".repeat(64), llvmReceiptSha256: "3".repeat(64),
    retainedBytes: 4096, checkedArtifacts: 23, sourceExportsReported: 4, cpuSimulationsReported: 120,
    interpretation: "Integrity only, no producer authentication.", unavailable: ["hardware execution", "performance"],
    cases: (["one", "two", "fifteen", "repeat"] as const).flatMap(label =>
      (["O0", "O3"] as const).map(optimization => {
        const repetitions = label === "one" ? 1 : label === "two" ? 2 : 15;
        const program = Array.from({ length: repetitions + 1 }, (_, index) => ({
          declaredInstruction: index === 0 ? "v_mov_b32_e32" : "v_add_u32_e32",
          opcode: index === 0 ? "V_MOV_B32_e32_vi" : "V_ADD_U32_e32_gfx9",
          bytesHex: index === 0 ? "2203427e" : "21474268",
          registers: index === 0 ? ["VGPR33", "VGPR34"] : ["VGPR33", "VGPR33", "VGPR35"],
          fileOffset: 80 + index * 4,
        }));
        return {
          id: label + "-" + optimization, label, repetitions, optimization,
          source: "// synthetic " + label + "\n", sourceSha256: "4".repeat(64), semanticSha256: "5".repeat(64),
          canonicalKirSha256: "6".repeat(64), kirFileSha256: "7".repeat(64),
          sourceInventorySha256: "8".repeat(64), sourcePreflightSha256: "9".repeat(64),
          llvm: "; synthetic " + label, llvmSha256: "a".repeat(64), reportSha256: "b".repeat(64),
          payloadPath: "/synthetic/" + label + "-" + optimization + ".hsaco",
          hsacoSha256: "c".repeat(64), hsacoBytes: 256, program,
          registerGrid: buildDeclaredRegisterUseGrid([32, 33, 34, 35, 36], program.map((item, index) => ({
            output: 33, inputs: index === 0 ? [34] : [33, 35], fileOffset: item.fileOffset,
          }))),
          staticInstructions: 100 + repetitions, declaredVgprHighWater: 37 as const,
          encodedVgprCapacity: optimization === "O0" ? 56 : 40, architectedVgprBoundary: 40,
          descriptorOffset: 0, descriptorSha256: "d".repeat(64), resource1: optimization === "O0" ? 6 : 4, resource3: 9,
          llvmBuildClaim: "synthetic LLVM", workerBuildClaim: "synthetic worker",
        };
      })),
  };
}
const props = { evidence: "synthetic UI-only mock", expectedJoinSha256: "1".repeat(64) };
beforeEach(() => { vi.spyOn(comparison, "projectRepeatNativeComparison").mockImplementation(async () => ready()); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("separate repeat-native presentation", () => {
  it("shows eight distinct cases and explicit provenance without execution or requests", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    render(<RepeatNativeComparison {...props} />);
    const table = await screen.findByRole("table", { name: "Repeat-native cases and resources" });
    expect(within(table).getAllByRole("button")).toHaveLength(8);
    expect(within(table).getAllByText("37")).toHaveLength(8);
    expect(within(table).getAllByText("56")).toHaveLength(4);
    expect(within(table).queryByText("101")).not.toBeInTheDocument();
    expect(screen.getByText(/report lists 101 static instructions in the whole entry/u)).toBeInTheDocument();
    expect(screen.getByText(/Synthetic test data/u)).toBeInTheDocument();
    expect(screen.getByText(/Content hashes are not producer authentication/u)).toBeInTheDocument();
    expect(screen.getByText(/does not rerun or independently replay/u)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /compile|run|load|launch|resume|step|continue/u })).not.toBeInTheDocument();
  });
  it("switches source and exact instruction rows with a keyboard case selection", async () => {
    const user = userEvent.setup(); render(<RepeatNativeComparison {...props} />);
    await screen.findByRole("table", { name: "Repeat-native cases and resources" });
    const button = screen.getByRole("button", { name: "Inspect repeat O3" });
    button.focus(); await user.keyboard(" ");
    const selected = screen.getByRole("region", { name: "Selected repeat-native case" });
    expect(within(selected).getByRole("heading")).toHaveTextContent("repeat O3: 15 adds, 16");
    expect(within(selected).getByRole("table", { name: "Repeat-native exact instruction bytes" })
      .querySelectorAll("tbody tr")).toHaveLength(16);
    expect(screen.getByLabelText("repeat repeat-native source").textContent).toBe("// synthetic repeat\n");
    expect(button).toHaveFocus(); expect(button).toHaveAttribute("aria-pressed", "true");
    expect(within(screen.getByRole("table", { name: "Repeat-native cases and resources" })).getAllByRole("button")).toHaveLength(8);
  });
  it("retains unused declared roles and clears role selection on a new case", async () => {
    const user = userEvent.setup(); render(<RepeatNativeComparison {...props} />);
    await screen.findByRole("button", { name: "Inspect VGPR32 scratch" });
    await user.click(screen.getByRole("button", { name: "Inspect VGPR32 scratch" }));
    expect(screen.getByText(/declared, with no explicit uses/u)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inspect VGPR36 input2" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Inspect two O3" }));
    expect(screen.getByRole("button", { name: "Inspect VGPR32 scratch" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(/No explicit use does not mean free, dead, or uninitialized/u)).toBeInTheDocument();
  });
  it("clears immediately when the independent pin changes and forwards it unchanged", async () => {
    const { rerender } = render(<RepeatNativeComparison {...props} />);
    await screen.findByRole("table", { name: "Repeat-native cases and resources" });
    vi.mocked(comparison.projectRepeatNativeComparison).mockResolvedValueOnce({ status: "invalid", detail: "Wrong fixed join pin." });
    rerender(<RepeatNativeComparison {...props} expectedJoinSha256={"9".repeat(64)} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(await screen.findByText(/Wrong fixed join pin/u)).toHaveAttribute("data-state", "invalid");
    expect(comparison.projectRepeatNativeComparison).toHaveBeenLastCalledWith(props.evidence, "9".repeat(64));
  });
  it("drops old asynchronous verification after newer evidence is refused", async () => {
    let finish!: (value: comparison.RepeatNativeProjection) => void;
    vi.mocked(comparison.projectRepeatNativeComparison)
      .mockReturnValueOnce(new Promise(resolve => { finish = resolve; }))
      .mockResolvedValueOnce({ status: "invalid", detail: "New evidence refused." });
    const { rerender } = render(<RepeatNativeComparison {...props} />);
    rerender(<RepeatNativeComparison {...props} evidence="new" />);
    await screen.findByText(/New evidence refused/u);
    await act(async () => { finish(ready()); });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
  it("resets case selection on a replacement capsule even with the same join", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<RepeatNativeComparison {...props} />);
    await screen.findByRole("button", { name: "Inspect repeat O3" });
    await user.click(screen.getByRole("button", { name: "Inspect repeat O3" }));
    rerender(<RepeatNativeComparison {...props} evidence="replacement" />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Inspect one O0" })).toHaveAttribute("aria-pressed", "true");
  });
  it("shows unavailable, never a synthetic fallback, after rejection", async () => {
    vi.mocked(comparison.projectRepeatNativeComparison).mockRejectedValueOnce(new Error("not displayed"));
    render(<RepeatNativeComparison {...props} />);
    expect(await screen.findByText(/local integrity check could not finish/u)).toHaveAttribute("data-state", "unavailable");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText("not displayed")).not.toBeInTheDocument();
  });
});
