import { webcrypto } from "node:crypto";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RecordedResourceImport } from "../src/components/RecordedResourceImport";
import * as importer from "../src/content/recorded-resource-import";
import { retainedResourceExcerpt } from "./fixtures/recorded-resource-import";

const original = retainedResourceExcerpt();
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function file(text: string, name: string) { return new File([text], name, { type: "application/x-ndjson" }); }
async function selectFiles(user: ReturnType<typeof userEvent.setup>, response = original.responses) {
  await user.upload(screen.getByLabelText("Requests JSONL"), file(original.requests, "requests.jsonl"));
  await user.upload(screen.getByLabelText("Responses JSONL"), file(response, "responses.jsonl"));
}

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
