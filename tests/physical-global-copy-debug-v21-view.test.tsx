// @vitest-environment jsdom
import { webcrypto } from "node:crypto";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PhysicalGlobalCopyObservationV21, PhysicalGlobalCopyWorkbenchV21 } from "../src/components/PhysicalGlobalCopyDebugV21";
import { PHYSICAL_COPY_RETAINED_V21 } from "../src/content/physical-global-copy-debug-v21-retained";
import * as adapter from "../src/content/physical-global-copy-debug-v21";
import * as importer from "../src/content/recorded-resource-import";
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
async function ready() { return screen.findByRole("combobox", { name: "Recorded V21 observation" }); }
it("browses real pending/ready/reverse observations and separate allocations without network", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const user = userEvent.setup(); render(<PhysicalGlobalCopyWorkbenchV21 />); const select = await ready();
  expect(screen.getByRole("button", { name: "Previous V21 observation" })).toBeDisabled();
  const next = screen.getByRole("button", { name: "Next V21 observation" }); next.focus(); await user.keyboard("{Enter}");
  expect(screen.getByText(/Recorded event 1, revision 1/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Recorded pending value" }));
  expect(screen.getByLabelText("Selected V21 loaded SSA readiness")).toHaveTextContent("Unavailable — not_represented");
  await user.click(screen.getByRole("button", { name: "Recorded ready value" }));
  expect(screen.getByLabelText("Selected V21 loaded SSA readiness")).toHaveTextContent("Captured u32 0x80000001");
  await user.click(screen.getByRole("button", { name: "Recorded reverse to pending" }));
  expect(screen.getByLabelText("Selected V21 loaded SSA readiness")).toHaveTextContent("Unavailable — not_represented");
  await user.click(screen.getByRole("button", { name: "Recorded final input" }));
  expect(screen.getByRole("heading", { name: "Read-only input observation" })).toBeInTheDocument();
  expect(screen.queryByRole("table", { name: "Selected checkpoint SSA values" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Recorded final output" }));
  expect(screen.getByRole("heading", { name: "Writable output observation" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Read-only input observation" })).not.toBeInTheDocument();
  expect(within(screen.getByRole("table", { name: "Selected V21 recorded memory bytes" })).getAllByRole("row")).toHaveLength(257);
  await user.selectOptions(select, "31"); // Actual stale continuation response.
  expect(screen.getByText(/Recorded unavailable: kir_ssa_values \/ outside_capture_scope/)).toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  await user.selectOptions(select, "20"); // Actual stale revision refusal.
  expect(screen.getByText(/Recorded refusal: stale_revision/)).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
it("displays original/register-edited and zero/partial extents as declared labels, not source custody", async () => {
  const user = userEvent.setup(); render(<PhysicalGlobalCopyWorkbenchV21 />); await ready();
  await user.selectOptions(screen.getByRole("combobox", { name: "Retained V21 command session" }), "3");
  await ready();
  expect(screen.getByRole("region", { name: "V21 declared recording origin" })).toHaveTextContent("physical-global-copy-registers-v21");
  expect(screen.getByText(/does not prove source custody/)).toBeInTheDocument();
  for (const [index, words] of [["4", "0"], ["5", "33"]]) {
    await user.selectOptions(screen.getByRole("combobox", { name: "Retained V21 command session" }), index);
    await ready();
    expect(screen.getByRole("region", { name: "V21 independently checked recording facts" })).toHaveTextContent(words + " copied words");
    const premise = screen.getByRole("region", { name: "V21 declared profile premise" });
    expect(premise).toHaveTextContent("declared V21 profile requires all 128 resident logical lanes");
    expect(premise).toHaveTextContent("does not observe an access trace for every lane");
    expect(screen.getByRole("region", { name: "V21 independently checked recording facts" }))
      .not.toHaveTextContent("all 128 resident logical lanes");
  }
});
it("clears tables synchronously when input is replaced, rejected or removed", async () => {
  const input = PHYSICAL_COPY_RETAINED_V21[0].input, user = userEvent.setup();
  const view = render(<PhysicalGlobalCopyObservationV21 input={input} />); await ready();
  await user.click(screen.getByRole("button", { name: "Recorded ready value" }));
  expect(screen.getByRole("table")).toBeInTheDocument();
  view.rerender(<PhysicalGlobalCopyObservationV21 input={{ containerUtf8: "{}" }} />);
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  await screen.findByText(/V21 recording refused/);
  view.rerender(<PhysicalGlobalCopyObservationV21 input={null} />);
  await screen.findByText(/No V21 recording selected/);
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
it("requires explicit local profile and refuses oversized files before any FileReader", async () => {
  const user = userEvent.setup(), read = vi.spyOn(importer, "readResourceImportFile");
  render(<PhysicalGlobalCopyWorkbenchV21 />); await ready();
  await user.click(screen.getByText("Display your own complete V21 recording"));
  await user.upload(screen.getByLabelText("V21 recording container"), new File([" ".repeat(262145)], "oversize.json"));
  await user.click(screen.getByRole("button", { name: "Read local V21 recording" }));
  expect(screen.getByText(/explicitly select --diagnostic-kir-v21/)).toBeInTheDocument();
  await user.click(screen.getByRole("checkbox", { name: /I selected --diagnostic-kir-v21/ }));
  await user.click(screen.getByRole("button", { name: "Read local V21 recording" }));
  expect(screen.getByText(/refused before reading/)).toBeInTheDocument();
  expect(read).not.toHaveBeenCalled(); expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
it("imports one bounded unverified container and supports clearing it", async () => {
  const user = userEvent.setup(); render(<PhysicalGlobalCopyWorkbenchV21 />); await ready();
  await user.click(screen.getByText("Display your own complete V21 recording"));
  await user.upload(screen.getByLabelText("V21 recording container"), new File([PHYSICAL_COPY_RETAINED_V21[0].input.containerUtf8], "record.json"));
  await user.click(screen.getByRole("checkbox", { name: /I selected --diagnostic-kir-v21/ }));
  await user.click(screen.getByRole("button", { name: "Read local V21 recording" }));
  await ready(); expect(screen.getByText(/Caller-supplied \/ unverified recording/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Clear V21 recording" }));
  await screen.findByText(/No V21 recording selected/);
});
it("selecting local clears the bundled notice as well as the current recording", async () => {
  const user = userEvent.setup(); render(<PhysicalGlobalCopyWorkbenchV21 />); await ready();
  await user.selectOptions(screen.getByRole("combobox", { name: "Retained V21 command session" }), "local");
  expect(screen.getByText("Local unverified container selected; no recording loaded.")).toBeInTheDocument();
  expect(screen.queryByText("Bundled actual qualified CLI output. No new kernel execution.")).not.toBeInTheDocument();
  expect(screen.queryByRole("combobox", { name: "Recorded V21 observation" })).not.toBeInTheDocument();
});
it("resubmitting a selected local file replaces a later bundle selection and notice", async () => {
  const user = userEvent.setup(); render(<PhysicalGlobalCopyWorkbenchV21 />); await ready();
  await user.click(screen.getByText("Display your own complete V21 recording"));
  await user.upload(screen.getByLabelText("V21 recording container"),
    new File([PHYSICAL_COPY_RETAINED_V21[0].input.containerUtf8], "local-one.json"));
  await user.click(screen.getByRole("checkbox", { name: /I selected --diagnostic-kir-v21/ }));
  const choice = screen.getByRole("combobox", { name: "Retained V21 command session" });
  await user.selectOptions(choice, "3"); await ready();
  expect(choice).toHaveValue("3");
  expect(screen.getByRole("region", { name: "V21 declared recording origin" }))
    .toHaveTextContent("physical-global-copy-registers-v21");
  await user.click(screen.getByRole("button", { name: "Read local V21 recording" }));
  expect(choice).toHaveValue("local"); await ready();
  expect(screen.getByText("Caller-supplied / unverified recording. Declared source and locator metadata are not authenticated.")).toBeInTheDocument();
  expect(screen.queryByText("Bundled actual qualified CLI output. No new kernel execution.")).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: "V21 declared recording origin" }))
    .toHaveTextContent("physical-global-copy-one-v21");
});
it("discards late completion of an older projection after a new refusal", async () => {
  const input = PHYSICAL_COPY_RETAINED_V21[0].input, observed = await adapter.projectPhysicalCopyDebugV21(input);
  let finish!: (value: adapter.PhysicalCopyProjectionV21) => void;
  vi.spyOn(adapter, "projectPhysicalCopyDebugV21").mockReturnValueOnce(new Promise(resolve => { finish = resolve; }))
    .mockResolvedValueOnce({ status: "invalid", detail: "Replacement V21 refused." });
  const view = render(<PhysicalGlobalCopyObservationV21 input={input} />);
  view.rerender(<PhysicalGlobalCopyObservationV21 input={{ containerUtf8: "{}" }} />);
  await screen.findByText("Replacement V21 refused.");
  await act(async () => { finish(observed); });
  expect(screen.queryByRole("combobox", { name: "Recorded V21 observation" })).not.toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
it("renders a deliberately view-only empty page without substituting loaded values", async () => {
  const input = PHYSICAL_COPY_RETAINED_V21[0].input, observed = await adapter.projectPhysicalCopyDebugV21(input);
  expect(observed.status).toBe("ready"); if (observed.status !== "ready") return;
  // This mutation is a UI-only test double; it is not a retained real recording.
  vi.spyOn(adapter, "projectPhysicalCopyDebugV21").mockResolvedValue({
    ...observed, records: observed.records.map((r, i) => i === observed.facts.readyQuery
      ? { ...r, values: [], page: { start: 0, next: null } } : r),
  });
  const user = userEvent.setup(); render(<PhysicalGlobalCopyObservationV21 input={input} />); await ready();
  await user.click(screen.getByRole("button", { name: "Recorded ready value" }));
  expect(screen.getByText(/No value rows were retained at this checkpoint/)).toBeInTheDocument();
  expect(screen.getByText(/declared loaded SSA is not in this selected page/)).toBeInTheDocument();
});
it("resets selected observation on recording replacement", async () => {
  const user = userEvent.setup(); render(<PhysicalGlobalCopyWorkbenchV21 />); await ready();
  await user.click(screen.getByRole("button", { name: "Recorded ready value" }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Retained V21 command session" }), "1");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole("combobox", { name: "Recorded V21 observation" })).toHaveValue("0"));
});
