// @vitest-environment jsdom
import { webcrypto } from "node:crypto";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PhysicalEntryDebugObservationV20, PhysicalEntryDebugWorkbenchV20 } from "../src/components/PhysicalEntryDebugV20";
import { PHYSICAL_DEBUG_RETAINED_V20 } from "../src/content/physical-entry-debug-v20-retained";
import * as adapter from "../src/content/physical-entry-debug-v20";
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
async function ready() { return screen.findByRole("combobox", { name: "Recorded V20 observation" }); }
it("browses actual observations with keyboard controls and no network or execution", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const user = userEvent.setup(); render(<PhysicalEntryDebugWorkbenchV20 />);
  const select = await ready();
  expect(screen.getByRole("button", { name: "Previous recorded observation" })).toBeDisabled();
  const next = screen.getByRole("button", { name: "Next recorded observation" }); next.focus();
  await user.keyboard("{Enter}");
  expect(screen.getByText(/Recorded event 1, revision 1/)).toBeInTheDocument();
  await user.selectOptions(select, "7");
  const table = screen.getByRole("table", { name: "Selected V20 recorded memory bytes" });
  expect(within(table).getAllByText("Uninitialized storage — not a valid value")).toHaveLength(4);
  await user.selectOptions(select, "86");
  expect(screen.queryByRole("table", { name: "Selected V20 recorded memory bytes" })).not.toBeInTheDocument();
  expect(screen.getByRole("table", { name: "Selected checkpoint SSA values" })).toBeInTheDocument();
  expect(screen.getAllByText("not_represented").length).toBeGreaterThan(1);
  await user.selectOptions(select, "94"); // Actual stale page, not a simulated UI error.
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByText(/Recorded unavailable: kir_ssa_values \/ outside_capture_scope/)).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
it("clears old tables immediately when source inputs are replaced, refused or removed", async () => {
  const user = userEvent.setup(), input = PHYSICAL_DEBUG_RETAINED_V20[0].input;
  const view = render(<PhysicalEntryDebugObservationV20 input={input} />);
  await user.selectOptions(await ready(), "86");
  expect(screen.getByRole("table")).toBeInTheDocument();
  view.rerender(<PhysicalEntryDebugObservationV20 input={{ ...input, selector: "--diagnostic-kir-v21" }} />);
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  await screen.findByText(/V20 recording refused/);
  view.rerender(<PhysicalEntryDebugObservationV20 input={null} />);
  await screen.findByText(/No V20 recording selected/); expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
it("handles selected-session replacement without retaining prior navigation state", async () => {
  const user = userEvent.setup(); render(<PhysicalEntryDebugWorkbenchV20 />);
  await user.selectOptions(await ready(), "86");
  await user.selectOptions(screen.getByRole("combobox", { name: "Retained V20 command session" }), "2");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole("combobox", { name: "Recorded V20 observation" })).toHaveValue("0"));
  expect(screen.getByText(/Physical registers, native addresses, hardware wave state/)).toBeInTheDocument();
});
it("requires explicit V20 selection for local files and clears display before reading", async () => {
  const user = userEvent.setup(), input = PHYSICAL_DEBUG_RETAINED_V20[0].input;
  render(<PhysicalEntryDebugWorkbenchV20 />); await ready();
  await user.click(screen.getByText("Display your own complete V20 recording"));
  await user.upload(screen.getByLabelText("V20 request JSONL"), new File([input.requestsUtf8], "record.requests.jsonl"));
  await user.upload(screen.getByLabelText("V20 response JSONL"), new File([input.responsesUtf8], "record.responses.jsonl"));
  expect(screen.queryByRole("combobox", { name: "Recorded V20 observation" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Read local V20 recording" }));
  expect(screen.getByText(/Select --diagnostic-kir-v20 explicitly/)).toBeInTheDocument();
  await user.click(screen.getByRole("checkbox", { name: /I selected --diagnostic-kir-v20/ }));
  await user.click(screen.getByRole("button", { name: "Read local V20 recording" }));
  await ready();
  expect(screen.getByText(/Caller-supplied \/ unverified recording/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Clear V20 recording" }));
  await screen.findByText(/No V20 recording selected/);
});

it("discards an older asynchronous projection after a new recording is refused", async () => {
  const input = PHYSICAL_DEBUG_RETAINED_V20[0].input, observed = await adapter.projectPhysicalDebugV20(input);
  let finish!: (value: adapter.PhysicalProjectionV20) => void;
  vi.spyOn(adapter, "projectPhysicalDebugV20").mockReturnValueOnce(new Promise(resolve => { finish = resolve; }))
    .mockResolvedValueOnce({ status: "invalid", detail: "Replacement V20 recording refused." });
  const view = render(<PhysicalEntryDebugObservationV20 input={input} />);
  view.rerender(<PhysicalEntryDebugObservationV20 input={{ ...input, selector: "--diagnostic-kir-v21" }} />);
  await screen.findByText("Replacement V20 recording refused.");
  await act(async () => { finish(observed); });
  expect(screen.queryByRole("combobox", { name: "Recorded V20 observation" })).not.toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
it("renders a deliberately test-derived empty page without claiming absent bindings", async () => {
  const input = PHYSICAL_DEBUG_RETAINED_V20[0].input, observed = await adapter.projectPhysicalDebugV20(input);
  expect(observed.status).toBe("ready"); if (observed.status !== "ready") return;
  // View-only model mutation, never described as an actual capture or admitted owner.
  vi.spyOn(adapter, "projectPhysicalDebugV20").mockResolvedValue({
    ...observed, records: observed.records.map((row, i) => i === 86 ? { ...row, values: [], page: { start: 0, next: null } } : row),
  });
  const user = userEvent.setup(); render(<PhysicalEntryDebugObservationV20 input={input} />);
  await user.selectOptions(await ready(), "86");
  expect(screen.getByText(/No value rows were retained at this checkpoint/)).toBeInTheDocument();
});
