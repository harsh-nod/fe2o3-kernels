import { webcrypto } from "node:crypto";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RecordedResourceImport } from "../src/components/RecordedResourceImport";
import * as importer from "../src/content/recorded-resource-import";
import { retainedResourceExcerpt } from "./fixtures/recorded-resource-import";
import { retainedLdsImportExcerpt } from "./fixtures/recorded-lds-import";

const original = retainedResourceExcerpt();
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function file(text: string, name: string) { return new File([text], name, { type: "application/x-ndjson" }); }
async function selectFiles(user: ReturnType<typeof userEvent.setup>, response = original.responses) {
  await user.upload(screen.getByLabelText("Requests JSONL"), file(original.requests, "requests.jsonl"));
  await user.upload(screen.getByLabelText("Responses JSONL"), file(response, "responses.jsonl"));
}

async function importLds(user: ReturnType<typeof userEvent.setup>, excerpt = retainedLdsImportExcerpt()) {
  await user.upload(screen.getByLabelText("Requests JSONL"), file(excerpt.requests, "lds-requests.jsonl"));
  await user.upload(screen.getByLabelText("Responses JSONL"), file(excerpt.responses, "lds-responses.jsonl"));
  await user.click(screen.getByRole("button", { name: "Import local recording" }));
  await screen.findByRole("combobox", { name: "Imported checkpoint" });
  return excerpt;
}
async function openModel(user: ReturnType<typeof userEvent.setup>) {
  const panel = screen.getByTestId("selected-lds-bank-analysis");
  if (!panel.hasAttribute("open")) await user.click(within(panel).getByText("LDS address-pattern model — assumed layout"));
  return panel;
}

it("links actual imported LDS selection to checkpoint bytes while keeping target assumptions separate", async () => {
  const user = userEvent.setup(), fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  render(<RecordedResourceImport />); const excerpt = await importLds(user);
  const provenance = screen.getByLabelText("Local recording byte provenance").textContent;
  const target = screen.getByRole("combobox", { name: "Hypothetical target for LDS model" });
  expect(target).toHaveValue("unknown");
  expect(target).toHaveAccessibleDescription(/User hypothesis \/ unverified/u);
  await user.selectOptions(screen.getByRole("combobox", { name: "Recorded resource page" }), "1");
  await user.click(screen.getByRole("button", { name: "Select retained access event 12" }));
  const overlay = screen.getByTestId("historical-access-overlay");
  expect(overlay).toHaveAttribute("data-state", "ready");
  expect(overlay).toHaveTextContent("Historical event 12: write committed [0, 4)");
  expect(overlay).toHaveTextContent("cursor 13, revision 5");
  const cells = within(screen.getByRole("group", { name: "Captured memory cells" })).getAllByRole("button");
  expect(cells).toHaveLength(256);
  expect(cells.filter(cell => cell.dataset.accessMarker === "W")).toHaveLength(4);
  expect(cells[0]).toHaveAccessibleName("Byte offset 0, 1 byte, 0x02, initialized");
  expect(cells[4]).toHaveAccessibleName("Byte offset 4, 1 byte, 0x00, uninitialized");
  let model = await openModel(user);
  expect(within(model).queryByRole("list")).not.toBeInTheDocument();
  await user.selectOptions(target, "gfx942");
  model = await openModel(user);
  expect(within(model).getAllByRole("listitem")).toHaveLength(32);
  expect(within(model).getByText(/Original caller-owned target remains/u)).toHaveTextContent("unavailable");
  expect(screen.getByRole("combobox", { name: "Recorded resource page" })).toHaveValue("1");
  const base = within(model).getByRole("textbox");
  await user.clear(base); await user.type(base, "1");
  expect(within(model).getAllByRole("listitem")[0]).toHaveTextContent("1 words · 3 bytes");
  expect(within(model).getAllByRole("listitem")[1]).toHaveTextContent("1 words · 1 bytes");
  await user.selectOptions(target, "gfx950");
  model = await openModel(user);
  expect(within(model).getByRole("textbox")).toHaveValue("0");
  expect(within(model).getAllByRole("listitem")).toHaveLength(64);
  expect(cells[0]).toHaveAccessibleName("Byte offset 0, 1 byte, 0x02, initialized");
  expect(overlay).toHaveAttribute("data-state", "ready");
  await user.click(screen.getByRole("button", { name: "Show original paired lines" }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Original pair" }), "3");
  expect(screen.getByLabelText("Original request line").textContent).toBe(excerpt.requests.split("\n")[3] + "\n");
  expect(screen.getByLabelText("Original response line").textContent).toBe(excerpt.responses.split("\n")[3] + "\n");
  expect(screen.getByLabelText("Local recording byte provenance").textContent).toBe(provenance);
  expect(fetch).not.toHaveBeenCalled();
});

it("clears imported overlays on empty/allocation pages and resets hypotheses at reverse checkpoints", async () => {
  const user = userEvent.setup(); render(<RecordedResourceImport />); await importLds(user);
  const pages = screen.getByRole("combobox", { name: "Recorded resource page" });
  await user.selectOptions(pages, "1");
  await user.selectOptions(screen.getByRole("combobox", { name: "Hypothetical target for LDS model" }), "gfx942");
  await openModel(user);
  await user.selectOptions(pages, "2");
  expect(screen.getByTestId("historical-access-overlay")).toHaveAttribute("data-state", "no_selection");
  expect(screen.getByTestId("historical-access-overlay")).toHaveTextContent("More backend pages exist");
  expect(within(await openModel(user)).queryByRole("list")).not.toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Captured memory cells" }).querySelectorAll("[data-access-marker]")).toHaveLength(0);
  await user.selectOptions(pages, "0");
  expect(screen.queryByTestId("historical-access-overlay")).not.toBeInTheDocument();
  await user.selectOptions(pages, "1");
  expect(screen.getByTestId("historical-access-overlay")).toHaveAttribute("data-state", "ready");
  await user.selectOptions(screen.getByRole("combobox", { name: "Imported checkpoint" }), "1");
  expect(screen.getByRole("combobox", { name: "Hypothetical target for LDS model" })).toHaveValue("unknown");
  expect(screen.getByTestId("historical-access-overlay")).toHaveAttribute("data-state", "no_selection");
  expect(screen.getByTestId("historical-access-overlay")).toHaveTextContent("cursor 11, revision 6");
  const first = within(screen.getByRole("group", { name: "Captured memory cells" })).getAllByRole("button")[0];
  expect(first).toHaveAccessibleName("Byte offset 0, 1 byte, 0x00, uninitialized");
  expect(within(await openModel(user)).queryByRole("list")).not.toBeInTheDocument();
});

it("discards an imported hypothesis and highlighted range immediately on replacement and same-byte reimport", async () => {
  const user = userEvent.setup(); render(<RecordedResourceImport />); const excerpt = await importLds(user);
  await user.selectOptions(screen.getByRole("combobox", { name: "Recorded resource page" }), "1");
  await user.selectOptions(screen.getByRole("combobox", { name: "Hypothetical target for LDS model" }), "gfx950");
  expect(within(await openModel(user)).getAllByRole("listitem")).toHaveLength(64);
  await user.upload(screen.getByLabelText("Responses JSONL"), file(excerpt.responses, "same-bytes-new-file.jsonl"));
  expect(screen.queryByTestId("historical-access-overlay")).not.toBeInTheDocument();
  expect(screen.queryByTestId("selected-lds-bank-analysis")).not.toBeInTheDocument();
  expect(screen.queryByRole("combobox", { name: "Hypothetical target for LDS model" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Import local recording" }));
  expect(await screen.findByRole("combobox", { name: "Hypothetical target for LDS model" })).toHaveValue("unknown");
  expect(screen.getByRole("combobox", { name: "Recorded resource page" })).toHaveValue("0");
  expect(screen.queryByTestId("historical-access-overlay")).not.toBeInTheDocument();
  await user.selectOptions(screen.getByRole("combobox", { name: "Recorded resource page" }), "1");
  expect(within(await openModel(user)).queryByRole("list")).not.toBeInTheDocument();
});

it("shares changed event/scope selection, refuses a different allocation and resets selection on a target change", async () => {
  const user = userEvent.setup(); render(<RecordedResourceImport />);
  await importLds(user, retainedLdsImportExcerpt([27, 28, 29, 30, 31]));
  await user.selectOptions(screen.getByRole("combobox", { name: "Recorded resource page" }), "1");
  const target = screen.getByRole("combobox", { name: "Hypothetical target for LDS model" });
  await user.selectOptions(target, "gfx942");
  await user.click(screen.getByRole("button", { name: "Next retained access" }));
  expect(screen.getByRole("combobox", { name: "Selected retained access event" })).toHaveValue("28");
  expect(screen.getByTestId("historical-access-overlay")).toHaveTextContent("Historical event 28: write committed [4, 8)");
  let cells = within(screen.getByRole("group", { name: "Captured memory cells" })).getAllByRole("button");
  expect(cells[0]).not.toHaveAttribute("data-access-marker");
  expect(cells[4]).toHaveAttribute("data-access-marker", "W");
  const scope = screen.getByRole("combobox", { name: "Filter captured access rows by logical scope" });
  await user.selectOptions(scope, within(scope).getAllByRole("option")[2]);
  expect(screen.getByRole("combobox", { name: "Selected retained access event" })).toHaveValue("28");
  let model = await openModel(user);
  expect(within(model).getByText(/Selected event 28/u)).toBeInTheDocument();
  await user.clear(within(model).getByRole("textbox")); await user.type(within(model).getByRole("textbox"), "1");
  await user.selectOptions(screen.getByRole("combobox", { name: "Recorded memory window" }), "1");
  expect(screen.getByTestId("historical-access-overlay")).toHaveAttribute("data-state", "different_allocation");
  expect(screen.getByRole("group", { name: "Captured memory cells" }).querySelectorAll("[data-access-marker]")).toHaveLength(0);
  await user.selectOptions(screen.getByRole("combobox", { name: "Recorded memory window" }), "0");
  expect(screen.getByTestId("historical-access-overlay")).toHaveAttribute("data-state", "ready");
  await user.selectOptions(target, "gfx950");
  expect(screen.getByRole("combobox", { name: "Selected retained access event" })).toHaveValue("12");
  expect(screen.getByRole("combobox", { name: "Filter captured access rows by logical scope" })).toHaveValue("all");
  model = await openModel(user);
  expect(within(model).getByRole("textbox")).toHaveValue("0");
  cells = within(screen.getByRole("group", { name: "Captured memory cells" })).getAllByRole("button");
  expect(cells[0]).toHaveAttribute("data-access-marker", "W");
  expect(cells[4]).not.toHaveAttribute("data-access-marker");
  await user.selectOptions(target, "unknown");
  expect(within(await openModel(user)).queryByRole("list")).not.toBeInTheDocument();
  expect(screen.getByTestId("historical-access-overlay")).toHaveAttribute("data-state", "ready");
});

it("opens empty, never invents a capture and requires both files", () => {
  render(<RecordedResourceImport />);
  expect(screen.getByRole("button", { name: "Import local recording" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Cancel import" })).toBeDisabled();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByText(/Nothing has been imported/u)).toBeInTheDocument();
});

it("reads actual original files locally and reuses bounded memory/access views with byte provenance", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const user = userEvent.setup(); render(<RecordedResourceImport />);
  await selectFiles(user);
  await user.click(screen.getByRole("button", { name: "Import local recording" }));
  expect(await screen.findByRole("combobox", { name: "Imported checkpoint" })).toHaveValue("0");
  expect(screen.getByText(/producer, source, bundle, target and execution claims are not authenticated/u)).toBeInTheDocument();
  expect(screen.getByLabelText("Local recording byte provenance")).toHaveTextContent("requests.jsonl");
  expect(screen.getByRole("table", { name: "Captured allocation inventory" })).toBeInTheDocument();
  const cells = screen.getByRole("group", { name: "Captured memory cells" });
  expect(within(cells).getAllByRole("button")).toHaveLength(24);
  expect(within(cells).getAllByRole("button")[0]).toHaveAccessibleName("Byte offset 0, 1 byte, 0xd5, initialized");
  await user.selectOptions(screen.getByRole("combobox", { name: "Recorded resource page" }), "2");
  const accesses = screen.getByRole("table", { name: "Captured memory access occurrences" });
  expect(accesses).toHaveTextContent("write committed");
  expect(screen.getByTestId("historical-access-overlay")).toHaveAttribute("data-state", "ready");
  await user.selectOptions(screen.getByRole("combobox", { name: "Hypothetical target for LDS model" }), "gfx942");
  expect(within(await openModel(user)).getByRole("status")).toHaveTextContent("not global or private memory");
  expect(within(accesses).getAllByRole("row").length).toBeLessThanOrEqual(65);
  await user.click(screen.getByRole("button", { name: "Show original paired lines" }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Original pair" }), "5");
  expect(screen.getByLabelText("Original request line").textContent).toBe(original.requests.split("\n")[5] + "\n");
  expect(screen.getByLabelText("Original response line").textContent).toBe(original.responses.split("\n")[5] + "\n");
  expect(fetch).not.toHaveBeenCalled();
});

it("resets filters/windows on checkpoint changes; reverse values never become the repeated event's evidence", async () => {
  const user = userEvent.setup(); render(<RecordedResourceImport />); await selectFiles(user);
  await user.click(screen.getByRole("button", { name: "Import local recording" }));
  const checkpoint = await screen.findByRole("combobox", { name: "Imported checkpoint" });
  await user.selectOptions(screen.getByRole("combobox", { name: "Recorded resource page" }), "2");
  await user.selectOptions(screen.getByRole("combobox", { name: "Memory cell size" }), "4");
  await user.selectOptions(checkpoint, "1");
  expect(screen.getByRole("combobox", { name: "Recorded resource page" })).toHaveValue("0");
  expect(screen.getByRole("combobox", { name: "Memory cell size" })).toHaveValue("1");
  const cells = within(screen.getByRole("group", { name: "Captured memory cells" })).getAllByRole("button");
  expect(cells[0]).toHaveAccessibleName("Byte offset 0, 1 byte, 0xa5, initialized");
  cells[0].focus(); await user.keyboard("{ArrowRight}");
  expect(cells[1]).toHaveFocus();
  await user.selectOptions(checkpoint, "2");
  expect(screen.getByText(/request 18, event 33, revision 6/u)).toBeInTheDocument();
  expect(screen.queryByRole("combobox", { name: "Recorded resource page" })).not.toBeInTheDocument();
});

it("clears visible old data immediately on file replacement, refuses the new input and resets both selections", async () => {
  const user = userEvent.setup(); render(<RecordedResourceImport />); await selectFiles(user);
  await user.click(screen.getByRole("button", { name: "Import local recording" }));
  await screen.findByRole("combobox", { name: "Imported checkpoint" });
  await user.upload(screen.getByLabelText("Responses JSONL"), file("{}\n", "bad.jsonl"));
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Import local recording" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Import refused");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Reset local recording" }));
  expect(screen.getByLabelText("Requests JSONL")).toHaveValue("");
  expect(screen.getByLabelText("Responses JSONL")).toHaveValue("");
  expect(screen.getByLabelText("Requests JSONL")).toHaveFocus();
  expect(screen.getByRole("button", { name: "Import local recording" })).toBeDisabled();
});

it("aborts an actual pending FileReader and rejects invalid UTF-8 and oversized files before interpreting bytes", async () => {
  const controller = new AbortController();
  const abort = vi.spyOn(FileReader.prototype, "abort");
  const pending = importer.readResourceImportFile(file(original.requests, "requests.jsonl"), controller.signal);
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  expect(abort).toHaveBeenCalledOnce();
  await expect(importer.readResourceImportFile(new File([new Uint8Array([0xc3, 0x28])], "bad.jsonl"), new AbortController().signal))
    .rejects.toThrow();
  const reader = vi.spyOn(FileReader.prototype, "readAsArrayBuffer");
  await expect(importer.readResourceImportFile(
    new File([new Uint8Array(importer.RESOURCE_IMPORT_LIMITS.fileBytes + 1)], "large.jsonl"), new AbortController().signal))
    .rejects.toThrow("file_limit");
  expect(reader).not.toHaveBeenCalled();
});

it("ignores late adapter success after cancellation, a newer import, reset or unmount", async () => {
  const ready = await importer.importResourceRecording(original.requests, original.responses);
  const user = userEvent.setup();
  let resolveOld!: (result: importer.ImportedResourceRecording) => void;
  const project = vi.spyOn(importer, "importResourceRecording")
    .mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }))
    .mockResolvedValueOnce(ready);
  const view = render(<RecordedResourceImport />); await selectFiles(user);
  await user.click(screen.getByRole("button", { name: "Import local recording" }));
  await vi.waitFor(() => expect(project).toHaveBeenCalledTimes(1));
  await user.click(screen.getByRole("button", { name: "Cancel import" }));
  expect(screen.getByText(/Import cancelled/u)).toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Import local recording" }));
  await screen.findByRole("combobox", { name: "Imported checkpoint" });
  await user.selectOptions(screen.getByRole("combobox", { name: "Imported checkpoint" }), "1");
  await act(async () => { resolveOld(ready); });
  expect(screen.getByRole("combobox", { name: "Imported checkpoint" })).toHaveValue("1");
  await user.click(screen.getByRole("button", { name: "Reset local recording" }));
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  view.unmount();
});

it("cancels the in-flight reader when another file is selected or the component unmounts", async () => {
  const user = userEvent.setup();
  const signals: AbortSignal[] = [];
  vi.spyOn(importer, "readResourceImportFile").mockImplementation((_file, signal) => {
    signals.push(signal); return new Promise(() => {});
  });
  const view = render(<RecordedResourceImport />); await selectFiles(user);
  await user.click(screen.getByRole("button", { name: "Import local recording" }));
  expect(signals[0].aborted).toBe(false);
  await user.upload(screen.getByLabelText("Responses JSONL"), file(original.responses, "replacement.jsonl"));
  expect(signals[0].aborted).toBe(true);
  await user.click(screen.getByRole("button", { name: "Import local recording" }));
  expect(signals[1].aborted).toBe(false);
  view.unmount();
  expect(signals[1].aborted).toBe(true);
});
