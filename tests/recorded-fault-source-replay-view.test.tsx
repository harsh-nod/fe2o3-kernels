// Actual ordinary-source retained bytes. UI mutations and delayed delivery are
// synthetic controls, not new captures or browser/performance qualification.
import { createHash, webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecordedFaultSourceReplay } from "../src/components/RecordedFaultSourceReplay";
import { FAULT_SOURCE_FILES, type FaultSourceFileRole, type FaultSourceFiles } from "../src/content/recorded-fault-source-replay";
const PINS: Readonly<Record<FaultSourceFileRole, readonly [number, string]>> = {
  receipt: [19683, "c60587e9d5d47d689efecb020133b4d670da2f620780e37644fd9738c6af9488"],
  requests: [10184, "0f9ad2fdd8b084504a022ce859e308d9e6579be03ad12b1eecf01f78a0668e1e"],
  responses: [69406, "9c569caee68dd88d42aa12f36c5ea8a011cf5a4d034d8d6640addc423cdd5c22"],
  diagnostic: [504, "91c3b2ba7237afca178616723db569e901b5eecee342dca86c1e19d81d71684f"],
};
function actualFiles(): FaultSourceFiles {
  const files = {} as Record<FaultSourceFileRole, string>;
  for (const spec of FAULT_SOURCE_FILES) {
    const bytes = readFileSync(resolve("examples/source-fault-replay-v2", spec.leaf));
    expect(bytes.length, spec.leaf).toBe(PINS[spec.role][0]);
    expect(createHash("sha256").update(bytes).digest("hex"), spec.leaf).toBe(PINS[spec.role][1]);
    files[spec.role] = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    expect(Buffer.byteLength(files[spec.role])).toBe(bytes.length);
  }
  return files;
}
const actual = actualFiles(); // A missing or changed actual fixture fails; never skipped.
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function upload(user: ReturnType<typeof userEvent.setup>, files: FaultSourceFiles = actual) {
  for (const spec of FAULT_SOURCE_FILES)
    await user.upload(screen.getByLabelText(spec.label, { exact: false }),
      new File([files[spec.role]], spec.leaf, { type: "text/plain" }));
}
async function imported() {
  const user = userEvent.setup(); render(<RecordedFaultSourceReplay />); await upload(user);
  await user.click(screen.getByRole("button", { name: "Import fault/source recording" }));
  await screen.findByText("Imported consistent retained files; full-run claims and provenance remain unverified.");
  return user;
}
function moment() { return screen.getByRole("region", { name: "Selected fault/source moment" }); }
function radio(label: string) { return screen.getByRole("radio", { name: label }); }
describe("actual retained fault/source panel", () => {
  it("defaults to the uncaptured terminal, with no prior source, SSA, memory or inferred fault range", async () => {
    await imported();
    expect(moment()).toHaveAttribute("data-moment", "fault");
    expect(screen.getByTestId("fault-source-selected-anchor")).toHaveTextContent("Event 22; revision 2.");
    expect(screen.getByTestId("fault-source-selected-anchor")).not.toHaveTextContent("Logical lane");
    expect(within(moment()).getByText(/Source variables, SSA values, stack and memory are unavailable/)).toBeVisible();
    expect(within(moment()).queryByRole("table")).not.toBeInTheDocument();
    expect(within(moment()).queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Separate standalone diagnostic" })).toHaveTextContent("separate execution");
    expect(screen.getByText(/The prose message is not parsed/)).toBeVisible();
    expect(screen.getByText(/Caller-supplied \/ unverified/)).toBeVisible();
  });
  it("displays distinct actual source/SSA observations and initialization, then synchronously clears on returning to fault", async () => {
    const user = await imported(); await user.click(radio("Prior captured checkpoint"));
    expect(moment()).toHaveAttribute("data-moment", "prior");
    expect(screen.getByTestId("fault-source-selected-anchor")).toHaveTextContent("Event 21; revision 3. Logical lane 0");
    const source = within(moment()).getByRole("region", { name: "Imported checkpoint source variables" });
    const ssa = within(moment()).getByRole("region", { name: "Imported checkpoint SSA and source" });
    expect(within(source).getByRole("table", { name: "Selected checkpoint source variables" })).toBeVisible();
    expect(within(ssa).getByRole("table", { name: "Selected checkpoint SSA values" })).toBeVisible();
    expect(source).not.toContainElement(ssa);
    expect(within(source).getAllByText("not_represented")).toHaveLength(4);
    await user.selectOptions(screen.getByLabelText("Memory cell size"), "1");
    const cells = within(moment()).getByRole("group", { name: "Captured memory cells" });
    expect(cells).toBeVisible();
    expect(within(cells).getAllByRole("button").some(button => button.getAttribute("aria-label")?.includes("uninitialized"))).toBe(true);
    expect(within(moment()).getByText(/No Rust source body was imported or fetched/)).toBeVisible();
    await user.click(radio("Terminal fault — values unavailable"));
    expect(within(moment()).queryByRole("table")).not.toBeInTheDocument();
    expect(within(moment()).queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Memory window at selected checkpoint")).not.toBeInTheDocument();
  });
  it("navigates an SSA pointer only to an already-retained byte and resets selection across moments", async () => {
    const user = await imported(); await user.click(radio("Prior captured checkpoint"));
    const ssa = within(moment()).getByRole("region", { name: "Imported checkpoint SSA and source" });
    const pointers = within(ssa).getAllByRole("button", { name: /Show retained byte for SSA/ });
    expect(pointers.length).toBeGreaterThan(0);
    await user.click(pointers[0]);
    expect(within(moment()).getByText(/not a dereference or fault-range attribution/)).toBeVisible();
    await user.selectOptions(screen.getByLabelText("Memory window at selected checkpoint"), "2");
    await user.click(radio("Repeated prior checkpoint"));
    expect(screen.getByLabelText("Memory window at selected checkpoint")).toHaveValue("0");
    expect(within(moment()).queryByText(/Selected the already-retained byte/)).not.toBeInTheDocument();
  });
  it("compares repeated original storage under different revisions and exposes the stale refusal without values", async () => {
    const user = await imported(); await user.click(radio("Repeated prior checkpoint"));
    expect(screen.getByTestId("fault-source-selected-anchor")).toHaveTextContent("Event 21; revision 5.");
    expect(within(moment()).getByText(/error \/ stale_revision, state_changed=false/)).toBeVisible();
    await user.selectOptions(screen.getByLabelText("Baseline retained memory window"), "15");
    const comparison = screen.getByRole("region", { name: "Retained memory checkpoint comparison" });
    expect(within(comparison).getByText(/0 storage-byte differences; 0 initialization differences/)).toBeVisible();
    expect(within(comparison).getByRole("group", { name: "Compared memory cells" })).toBeVisible();
    await user.click(radio("Final failed completion — values unavailable"));
    expect(screen.getByTestId("fault-source-selected-anchor")).toHaveTextContent("Event 22; revision 7.");
    expect(within(moment()).getByText(/Completed \/ Failed/)).toBeVisible();
    expect(within(moment()).queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Compared memory cells" })).not.toBeInTheDocument();
  });
  it("preserves raw LF bytes and resets raw selection on moment change", async () => {
    const user = await imported();
    await user.click(within(moment()).getByText("Selected moment original pairs"));
    expect(screen.getByLabelText("Original fault/source request line").textContent).toBe(actual.requests.split("\n")[2] + "\n");
    await user.selectOptions(screen.getByLabelText("Original pair for selected fault moment"), "4");
    expect(screen.getByLabelText("Original fault/source response line").textContent).toBe(actual.responses.split("\n")[6] + "\n");
    await user.click(radio("Prior captured checkpoint"));
    await user.click(within(moment()).getByText("Selected moment original pairs"));
    expect(screen.getByLabelText("Original pair for selected fault moment")).toHaveValue("0");
    expect(screen.getByLabelText("Original fault/source request line").textContent).toBe(actual.requests.split("\n")[7] + "\n");
    await user.click(screen.getByText("Original standalone diagnostic"));
    expect(screen.getByLabelText("Original standalone diagnostic bytes").textContent).toBe(actual.diagnostic);
  });
  it("never fetches paths or persists selected files and labels all unimported run claims unchecked", async () => {
    const fetch = vi.fn(() => Promise.reject(new Error("No network"))); vi.stubGlobal("fetch", fetch);
    const storage = vi.spyOn(Storage.prototype, "setItem");
    const user = await imported(); await user.click(radio("Prior captured checkpoint"));
    await user.click(screen.getByText("Selected file hashes and receipt"));
    expect(screen.getByLabelText("Original fault/source receipt").textContent).toBe(actual.receipt);
    expect(screen.getByText(/claims are not independently verified here/)).toBeVisible();
    expect(fetch).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /execute|continue|reverse|step/i })).not.toBeInTheDocument();
  });
  it("removes old values immediately on file replacement, refuses bad imports and fully resets file selection", async () => {
    const user = await imported(); await user.click(radio("Prior captured checkpoint"));
    const receipt = screen.getByLabelText("Fault capture receipt JSON", { exact: false });
    await user.upload(receipt, new File(["{}"], "wrong.json", { type: "application/json" }));
    expect(screen.queryByRole("region", { name: "Selected fault/source moment" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Import fault/source recording" }));
    await screen.findByText(/Missing or unsupported fields/);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset fault/source files" }));
    expect(receipt).toHaveFocus();
    for (const spec of FAULT_SOURCE_FILES) expect(screen.getByLabelText(spec.label, { exact: false })).toHaveValue("");
    expect(screen.getByRole("button", { name: "Import fault/source recording" })).toBeDisabled();
  });
  it("rejects malformed UTF-8 file bytes without hashing lossy replacement text", async () => {
    const user = userEvent.setup(); render(<RecordedFaultSourceReplay />); await upload(user);
    await user.upload(screen.getByLabelText("Fault capture receipt JSON", { exact: false }),
      new File([new Uint8Array([0xc3, 0x28])], "invalid.json", { type: "application/json" }));
    await user.click(screen.getByRole("button", { name: "Import fault/source recording" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel fault/source import" })).toBeDisabled());
    expect(screen.getByRole("status").textContent).not.toBe("");
    expect(screen.queryByRole("region", { name: "Selected fault/source moment" })).not.toBeInTheDocument();
  });
  it("ignores a captured late FileReader callback after cancellation and allows a fresh import", async () => {
    const user = userEvent.setup(); render(<RecordedFaultSourceReplay />); await upload(user);
    const readers: FileReader[] = [];
    const read = vi.spyOn(FileReader.prototype, "readAsArrayBuffer").mockImplementation(function (this: FileReader) { readers.push(this); });
    await user.click(screen.getByRole("button", { name: "Import fault/source recording" }));
    expect(readers).toHaveLength(1);
    const reader = readers[0], late = reader.onload;
    await user.click(screen.getByRole("button", { name: "Cancel fault/source import" }));
    expect(screen.getByRole("status")).toHaveTextContent("Import cancelled.");
    Object.defineProperty(reader, "result", { configurable: true, value: new TextEncoder().encode(actual.receipt).buffer });
    late?.call(reader, new ProgressEvent("load") as ProgressEvent<FileReader>);
    await waitFor(() => expect(screen.queryByRole("region", { name: "Selected fault/source moment" })).not.toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent("Import cancelled.");
    read.mockRestore();
    await user.click(screen.getByRole("button", { name: "Import fault/source recording" }));
    await screen.findByText("Imported consistent retained files; full-run claims and provenance remain unverified.");
    expect(moment()).toHaveAttribute("data-moment", "fault");
  });
  it("does not resurrect a result delivered after reset during asynchronous hashing", async () => {
    const user = userEvent.setup(); render(<RecordedFaultSourceReplay />); await upload(user);
    let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
    const original = webcrypto.subtle.digest.bind(webcrypto.subtle); let calls = 0, finished = 0;
    vi.spyOn(webcrypto.subtle, "digest").mockImplementation(async (algorithm, data) => {
      calls++; await gate; const result = await original(algorithm, data); finished++; return result;
    });
    await user.click(screen.getByRole("button", { name: "Import fault/source recording" }));
    await waitFor(() => expect(calls).toBe(4));
    await user.click(screen.getByRole("button", { name: "Reset fault/source files" }));
    release();
    await waitFor(() => expect(finished).toBe(4));
    await waitFor(() => expect(screen.getByRole("button", { name: "Import fault/source recording" })).toBeDisabled());
    expect(screen.queryByRole("region", { name: "Selected fault/source moment" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).not.toHaveTextContent("Imported consistent");
  });
});
