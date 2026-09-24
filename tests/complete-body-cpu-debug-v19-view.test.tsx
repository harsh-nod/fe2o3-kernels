import { webcrypto } from "node:crypto";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CompleteBodyDebugObservationV19, CompleteBodyDebugWorkbenchV19 } from "../src/components/CompleteBodyDebugV19";
import { COMPLETE_BODY_DEBUG_RETAINED_V19 } from "../src/content/complete-body-debug-v19-retained";
import * as adapter from "../src/content/complete-body-debug-v19";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it("renders actual first-event SSA values and clears them at restored entry, without network execution", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const user = userEvent.setup(); render(<CompleteBodyDebugObservationV19 input={COMPLETE_BODY_DEBUG_RETAINED_V19[1].input} />);
  const checkpoints = await screen.findByRole("combobox", { name: "Recorded V19 checkpoint" });
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  await user.selectOptions(checkpoints, "1");
  const table = screen.getByRole("table", { name: "Selected checkpoint SSA values" });
  expect(within(table).getAllByRole("row")).toHaveLength(6);
  expect(table).toHaveTextContent("0x00000013"); expect(table).toHaveTextContent("alloc#1:g0 + 0 bytes");
  expect(screen.getByText("18446744073709551615")).toBeInTheDocument();
  expect(screen.getByText(/not a reconstructed CFG/u)).toBeInTheDocument();
  expect(screen.getByText(/No hardware register capture/u)).toBeInTheDocument();
  await user.selectOptions(checkpoints, "2");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByText(/Snapshot unavailable: not_captured/u)).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
it("keeps missing metadata optional and never labels it authenticated", async () => {
  const input = COMPLETE_BODY_DEBUG_RETAINED_V19[0].input;
  render(<CompleteBodyDebugObservationV19 input={{ selector: input.selector,
    requestsUtf8: input.requestsUtf8, responsesUtf8: input.responsesUtf8 }} />);
  expect(await screen.findByText(/No export metadata supplied/u)).toBeInTheDocument();
  expect(screen.queryByText(/Declared canonical identity/u)).not.toBeInTheDocument();
});
it("resets the checkpoint when another retained session is selected", async () => {
  const user = userEvent.setup(); render(<CompleteBodyDebugWorkbenchV19 />);
  await user.selectOptions(await screen.findByRole("combobox", { name: "Recorded V19 checkpoint" }), "1");
  expect(screen.getByRole("table")).toBeInTheDocument();
  await user.selectOptions(screen.getByRole("combobox", { name: "Retained V19 command session" }), "4");
  expect(await screen.findByRole("combobox", { name: "Recorded V19 checkpoint" })).toHaveValue("0");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
it("discards stale asynchronous results and refuses a substituted profile without old values", async () => {
  const input = COMPLETE_BODY_DEBUG_RETAINED_V19[0].input, ready = await adapter.projectCompleteBodyDebugV19(input);
  let finish!: (value: adapter.CompleteBodyDebugProjectionV19) => void;
  vi.spyOn(adapter, "projectCompleteBodyDebugV19").mockReturnValueOnce(new Promise(resolve => { finish = resolve; }))
    .mockResolvedValueOnce({ status: "invalid", detail: "Replacement recording refused." });
  const { rerender } = render(<CompleteBodyDebugObservationV19 input={input} />);
  rerender(<CompleteBodyDebugObservationV19 input={{ ...input, selector: "--bundle-v5" }} />);
  expect(await screen.findByText("Replacement recording refused.")).toHaveAttribute("data-state", "invalid");
  await act(async () => { finish(ready); });
  expect(screen.queryByRole("combobox", { name: "Recorded V19 checkpoint" })).not.toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
it("reads local bounded JSONL only after explicit V19 selection and permits absent source metadata", async () => {
  const user = userEvent.setup(), input = COMPLETE_BODY_DEBUG_RETAINED_V19[1].input;
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch); render(<CompleteBodyDebugWorkbenchV19 />);
  await screen.findByRole("combobox", { name: "Recorded V19 checkpoint" });
  await user.click(screen.getByText("Display your own five-pair recording"));
  await user.upload(screen.getByLabelText("V19 request JSONL"), new File([input.requestsUtf8], "requests.jsonl", { type: "text/plain" }));
  await user.upload(screen.getByLabelText("V19 response JSONL"), new File([input.responsesUtf8], "responses.jsonl", { type: "text/plain" }));
  await user.click(screen.getByRole("button", { name: "Read local V19 recording" }));
  expect(screen.getByText(/Select --diagnostic-kir-v19 explicitly/u)).toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  await user.click(screen.getByRole("checkbox", { name: /I selected --diagnostic-kir-v19/u }));
  await user.click(screen.getByRole("button", { name: "Read local V19 recording" }));
  expect(await screen.findByText(/No export metadata supplied/u)).toBeInTheDocument();
  await user.selectOptions(screen.getByRole("combobox", { name: "Recorded V19 checkpoint" }), "1");
  expect(screen.getByRole("table")).toHaveTextContent("0x00000017");
  await user.click(screen.getByRole("button", { name: "Clear V19 recording" }));
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
it("does not retain values for null input", async () => {
  render(<CompleteBodyDebugObservationV19 input={null} />);
  expect(await screen.findByText("No V19 recording selected. No values are substituted.")).toHaveAttribute("data-state", "unavailable");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
