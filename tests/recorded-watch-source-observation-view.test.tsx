// Synthetic UI controls only. This is not evidence of a debugger capture or browser qualification.
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecordedWatchSourceObservation } from "../src/components/RecordedWatchSourceObservation";
import { WATCH_SOURCE_FILES, type WatchSourceFiles } from "../src/content/recorded-watch-source-observation";
import { syntheticWatchSourceFiles } from "./fixtures/recorded-watch-source-observation";
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
async function upload(files: WatchSourceFiles, user: ReturnType<typeof userEvent.setup>) {
  for (const spec of WATCH_SOURCE_FILES) await user.upload(screen.getByLabelText(spec.label, { exact: false }),
    new File([files[spec.role]], spec.leaf, { type: spec.role === "receipt" ? "application/json" : "application/x-ndjson" }));
}
async function imported() {
  const files = await syntheticWatchSourceFiles(), user = userEvent.setup();
  render(<RecordedWatchSourceObservation />); await upload(files, user);
  await user.click(screen.getByRole("button", { name: "Import watch/source recording" }));
  await screen.findByText("Imported consistent local files; all provenance remains unverified.");
  return { files, user };
}
function moment() { return screen.getByRole("region", { name: "Selected watch/source moment" }); }
describe("read-only watch/source panel — synthetic controls", () => {
  it("opens on the uncaptured stop and never substitutes later source, SSA, memory or lane", async () => {
    await imported();
    expect(moment()).toHaveAttribute("data-moment", "stop");
    expect(within(moment()).getByText(/Source variables, SSA values, memory, source location, frame and logical scope/)).toBeVisible();
    expect(within(moment()).queryByRole("table")).not.toBeInTheDocument();
    expect(within(moment()).queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
    expect(screen.getByTestId("watch-source-selected-anchor")).not.toHaveTextContent("Logical lane");
    expect(screen.getByText(/Caller-supplied \/ unverified/)).toBeVisible();
  });
  it("shows immediate lane-0 SSA and memory without a source-variable table", async () => {
    const { user } = await imported();
    await user.click(screen.getByRole("radio", { name: "Immediate post-write checkpoint — lane 0, source unavailable" }));
    expect(moment()).toHaveAttribute("data-moment", "immediate");
    expect(screen.getByTestId("watch-source-selected-anchor")).toHaveTextContent("Event 11; revision 4. Logical lane 0");
    expect(within(moment()).getByText(/Its retained stack has no next_operation/)).toBeVisible();
    expect(within(moment()).queryByRole("table", { name: "Selected checkpoint source variables" })).not.toBeInTheDocument();
    expect(within(moment()).getByRole("table", { name: "Selected checkpoint SSA values" })).toBeVisible();
    expect(within(moment()).getByRole("group", { name: "Captured memory cells" })).toBeVisible();
  });
  it("keeps later/reverse/repeated actual scope, source variables and SSA tables distinct", async () => {
    const { user } = await imported();
    const cases = [
      ["Later source checkpoint — lane 1", "post", "Event 12; revision 5. Logical lane 1"],
      ["Reverse pre-write checkpoint — lane 0", "reverse", "Event 9; revision 6. Logical lane 0"],
      ["Repeated later source checkpoint — lane 1", "repeat", "Event 12; revision 7. Logical lane 1"],
    ];
    for (const [label, selected, expected] of cases) {
      await user.click(screen.getByRole("radio", { name: label }));
      expect(moment()).toHaveAttribute("data-moment", selected);
      expect(screen.getByTestId("watch-source-selected-anchor")).toHaveTextContent(expected);
      const source = within(moment()).getByRole("region", { name: "Imported checkpoint source variables" });
      const ssa = within(moment()).getByRole("region", { name: "Imported checkpoint SSA and source" });
      expect(within(source).getByRole("table", { name: "Selected checkpoint source variables" })).toBeVisible();
      expect(within(ssa).getByRole("table", { name: "Selected checkpoint SSA values" })).toBeVisible();
      expect(source).not.toContainElement(ssa);
      expect(within(source).getAllByText("not_represented")).toHaveLength(2);
      expect(within(moment()).getByText(/Frame 1 is static stack depth/)).toBeVisible();
    }
    await user.click(screen.getByRole("radio", { name: "Uncaptured watch stop — scope unavailable" }));
    expect(within(moment()).queryByRole("table")).not.toBeInTheDocument();
  });
  it("retains exact selected-moment original lines and resets raw selection on moment changes", async () => {
    const { user, files } = await imported();
    await user.click(within(moment()).getByText("Selected moment original pairs"));
    const requests = files.fullRequests.split("\n"), responses = files.fullResponses.split("\n");
    expect(screen.getByLabelText("Original watch/source request line").textContent).toBe(requests[4] + "\n");
    await user.selectOptions(screen.getByLabelText("Original pair for selected moment"), "1");
    expect(screen.getByLabelText("Original watch/source response line").textContent).toBe(responses[5] + "\n");
    await user.click(screen.getByRole("radio", { name: "Later source checkpoint — lane 1" }));
    await user.click(within(moment()).getByText("Selected moment original pairs"));
    expect(screen.getByLabelText("Original pair for selected moment")).toHaveValue("0");
    expect(screen.getByLabelText("Original watch/source request line").textContent).toBe(requests[10] + "\n");
  });
  it("does not fetch, execute commands or persist imports, and labels unchecked receipt claims", async () => {
    const fetch = vi.fn(() => Promise.reject(new Error("No network allowed"))); vi.stubGlobal("fetch", fetch);
    const storage = vi.spyOn(Storage.prototype, "setItem");
    const { user, files } = await imported();
    await user.click(screen.getByRole("radio", { name: "Later source checkpoint — lane 1" }));
    await user.click(screen.getByText("Selected file hashes and receipt"));
    expect(screen.getByLabelText("Original watch/source receipt").textContent).toBe(files.receipt);
    expect(screen.getByText(/selected-input and stage-output claims are not verified/)).toBeVisible();
    expect(fetch).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /execute|continue|step|reverse/i })).not.toBeInTheDocument();
  });
  it("clears old values immediately on replacement, refusal and reset", async () => {
    const { user } = await imported();
    await user.click(screen.getByRole("radio", { name: "Later source checkpoint — lane 1" }));
    expect(within(moment()).getByRole("table", { name: "Selected checkpoint source variables" })).toBeVisible();
    const receipt = screen.getByLabelText("Capture receipt JSON", { exact: false });
    await user.upload(receipt, new File(["{}"], "wrong.json", { type: "application/json" }));
    expect(screen.queryByRole("region", { name: "Selected watch/source moment" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Import watch/source recording" }));
    await screen.findByText(/Missing or unsupported fields/);
    expect(screen.queryByRole("table", { name: "Selected checkpoint source variables" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset watch/source files" }));
    expect(receipt).toHaveFocus();
    for (const spec of WATCH_SOURCE_FILES) expect(screen.getByLabelText(spec.label, { exact: false })).toHaveValue("");
    expect(screen.getByRole("button", { name: "Import watch/source recording" })).toBeDisabled();
  });
  it("cancels a pending local read and ignores its old generation", async () => {
    const files = await syntheticWatchSourceFiles(), user = userEvent.setup();
    render(<RecordedWatchSourceObservation />); await upload(files, user);
    vi.spyOn(FileReader.prototype, "readAsArrayBuffer").mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: "Import watch/source recording" }));
    expect(screen.getByRole("button", { name: "Cancel watch/source import" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Cancel watch/source import" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Import cancelled."));
    expect(screen.queryByRole("region", { name: "Selected watch/source moment" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel watch/source import" })).toBeDisabled();
  });
});
