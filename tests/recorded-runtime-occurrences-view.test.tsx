import { webcrypto } from "node:crypto";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RecordedRuntimeOccurrences } from "../src/components/RecordedRuntimeOccurrences";
import * as model from "../src/content/recorded-runtime-occurrences";
import { RUNTIME_OCCURRENCE_REFERENCE } from "../src/content/recorded-runtime-occurrence-reference";
import raw from "./fixtures/recorded-runtime-occurrences.json?raw";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const file = (text = raw, name = "occurrences.json") => new File([text], name, { type: "application/json" });
const projected = () => model.importRecordedRuntimeOccurrences(raw, RUNTIME_OCCURRENCE_REFERENCE);
async function imported(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(screen.getByLabelText("Occurrence report JSON"), file());
  await user.click(screen.getByRole("button", { name: "Import recorded occurrences" }));
  return screen.findByRole("combobox", { name: "Recorded occurrence case" });
}
const row = () => screen.getByRole("region", { name: "Selected recorded row" });

it("starts empty with explicit local-file, import and cancellation controls", () => {
  render(<RecordedRuntimeOccurrences />);
  expect(screen.getByRole("button", { name: "Import recorded occurrences" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Cancel occurrence import" })).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("No runtime occurrence is displayed");
  expect(screen.getByText(/at most 512 KiB/u)).toBeInTheDocument();
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Selected recorded row" })).not.toBeInTheDocument();
});

it("imports exact retained bytes, defaults to the zero-round truth, and has no network or storage effects", async () => {
  const user = userEvent.setup(), fetch = vi.fn(), storage = vi.spyOn(Storage.prototype, "setItem");
  vi.stubGlobal("fetch", fetch);
  render(<RecordedRuntimeOccurrences />);
  const cases = await imported(user);
  expect(cases).toHaveValue("0");
  expect(within(cases).getAllByRole("option")).toHaveLength(6);
  expect(screen.getByLabelText("Helper occurrence count")).toHaveTextContent("0 helper activations");
  expect(screen.getByLabelText("Helper occurrence count")).toHaveTextContent("No helper activation was recorded");
  expect(screen.getByRole("combobox", { name: "Logical invocation (report-local)" })).toHaveValue("0");
  expect(row()).toHaveTextContent("Before operation");
  expect(screen.getByLabelText("Filtered row count")).toHaveTextContent("original ordinal 0");
  expect(screen.getByLabelText("Runtime occurrence byte provenance")).toHaveTextContent(RUNTIME_OCCURRENCE_REFERENCE.reportSha256);
  expect(screen.getByLabelText("Runtime occurrence byte provenance")).toHaveTextContent(RUNTIME_OCCURRENCE_REFERENCE.bundleSha256);
  const unavailable = screen.getByRole("region", { name: "Unavailable occurrence facts" });
  expect(unavailable).toHaveTextContent("Opt-out equality is a producer-reported claim only");
  expect(unavailable).toHaveTextContent("Opt-out rows are absent");
  expect(unavailable).toHaveTextContent("authenticated session IDs");
  expect(fetch).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled();
});

it("selects repeated helper activation and exact attempts, scrubs phases, and keeps the DOM to one row", async () => {
  const user = userEvent.setup(), data = await projected();
  render(<RecordedRuntimeOccurrences />); await imported(user);
  await user.selectOptions(screen.getByRole("combobox", { name: "Recorded occurrence case" }), "4");
  expect(screen.getByLabelText("Helper occurrence count")).toHaveTextContent("3 helper activations");
  const helper = data.cases[4].helpers.find(item => item.invocation === 0)!;
  await user.selectOptions(screen.getByRole("combobox", { name: "Activation (report-local)" }), String(helper.activation));
  expect(screen.getByLabelText("Selected helper caller interval")).toHaveTextContent(
    "inside caller rows " + helper.callBeforeRow + " through " + helper.callAfterRow);
  await user.selectOptions(screen.getByRole("combobox", { name: "Operation attempt (report-local)" }), helper.attemptKeys[0]);
  expect(screen.getByLabelText("Filtered row count")).toHaveTextContent("Filtered row 1 of 2");
  expect(row()).toHaveTextContent("Before operation");
  await user.click(screen.getByRole("button", { name: "Show selected row projection" }));
  expect(screen.getByLabelText("Selected row projection")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Next recorded row" }));
  expect(row()).toHaveTextContent("After operation");
  expect(screen.queryByLabelText("Selected row projection")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next recorded row" })).toBeDisabled();
  expect(screen.getAllByRole("region", { name: "Selected recorded row" })).toHaveLength(1);
  await user.selectOptions(screen.getByRole("combobox", { name: "Recorded row phase" }), "write_committed");
  expect(screen.getByLabelText("Filtered row count")).toHaveTextContent("No recorded row matches");
  expect(screen.queryByRole("region", { name: "Selected recorded row" })).not.toBeInTheDocument();
});

it("keeps the actual raw BlockId and authoring roster coordinate distinct in call rows", async () => {
  const user = userEvent.setup(), data = await projected();
  render(<RecordedRuntimeOccurrences />); await imported(user);
  await user.selectOptions(screen.getByRole("combobox", { name: "Recorded occurrence case" }), "4");
  const call = data.cases[4].attempts.find(item => item.invocation === 0 &&
    item.site.every((value, index) => value === data.topology.callSite[index]))!;
  await user.selectOptions(screen.getByRole("combobox", { name: "Operation attempt (report-local)" }), call.key);
  expect(within(row()).getByLabelText("Selected row facts")).toHaveTextContent("0 / 1 / 1");
  expect(within(row()).getByLabelText("Selected row facts")).toHaveTextContent("0 / 3 / 1");
  await user.click(screen.getByRole("button", { name: "Show selected row projection" }));
  const projection = JSON.parse(screen.getByLabelText("Selected row projection").textContent!);
  expect(projection.row).toEqual(data.cases[4].rows[call.beforeRow]);
  expect(projection.authoringRosterCoordinate).toEqual([0, 3, 1]);
  expect(screen.getByText(/Generated selected-row projection, not the original/u)).toBeInTheDocument();
});

it("filters actual seeded committed writes by invocation without fabricating a checkpoint", async () => {
  const user = userEvent.setup(), data = await projected();
  render(<RecordedRuntimeOccurrences />); await imported(user);
  await user.selectOptions(screen.getByRole("combobox", { name: "Recorded occurrence case" }), "3");
  await user.selectOptions(screen.getByRole("combobox", { name: "Logical invocation (report-local)" }), "3");
  await user.selectOptions(screen.getByRole("combobox", { name: "Recorded row phase" }), "write_committed");
  const expected = data.cases[3].rows.find(item => item.invocation === 3 && item.phase === "write_committed")!;
  expect(screen.getByLabelText("Filtered row count")).toHaveTextContent("Filtered row 1 of 1; original ordinal " + expected.ordinal);
  expect(row()).toHaveTextContent("0x0000479e");
  expect(row()).toHaveTextContent("byte offset 16");
  expect(row()).toHaveTextContent("not a checkpoint or memory snapshot");
  expect(row()).toHaveTextContent("Unavailable — no recorded site mapping");
  await user.selectOptions(screen.getByRole("combobox", { name: "Logical invocation (report-local)" }), "0");
  expect(screen.getByRole("combobox", { name: "Recorded row phase" })).toHaveValue("all");
  expect(screen.getByRole("combobox", { name: "Activation (report-local)" })).toHaveValue("all");
});

it("shows the full original file verbatim and resets all selections on same-byte reimport", async () => {
  const user = userEvent.setup(); render(<RecordedRuntimeOccurrences />); await imported(user);
  await user.selectOptions(screen.getByRole("combobox", { name: "Recorded occurrence case" }), "5");
  await user.selectOptions(screen.getByRole("combobox", { name: "Logical invocation (report-local)" }), "2");
  await user.click(screen.getByRole("button", { name: "Show original occurrence report" }));
  expect(screen.getByLabelText("Original occurrence report").textContent).toBe(raw);
  await user.click(screen.getByRole("button", { name: "Import recorded occurrences" }));
  expect(await screen.findByRole("combobox", { name: "Recorded occurrence case" })).toHaveValue("0");
  expect(screen.getByRole("combobox", { name: "Logical invocation (report-local)" })).toHaveValue("0");
  expect(screen.queryByLabelText("Original occurrence report")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Filtered row count")).toHaveTextContent("original ordinal 0");
  await user.upload(screen.getByLabelText("Occurrence report JSON"), file(raw, "same-bytes-new-file.json"));
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Import recorded occurrences" }));
  expect(await screen.findByRole("combobox", { name: "Recorded occurrence case" })).toHaveValue("0");
});

it("clears stale data before refusing replacement bytes and resets selection and focus", async () => {
  const user = userEvent.setup(); render(<RecordedRuntimeOccurrences />); await imported(user);
  await user.upload(screen.getByLabelText("Occurrence report JSON"), file("{}\n", "wrong.json"));
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Import recorded occurrences" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Import refused");
  expect(screen.queryByRole("region", { name: "Selected recorded row" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Reset recorded occurrences" }));
  expect(screen.getByLabelText("Occurrence report JSON")).toHaveValue("");
  expect(screen.getByLabelText("Occurrence report JSON")).toHaveFocus();
  expect(screen.getByRole("button", { name: "Import recorded occurrences" })).toBeDisabled();
});

it("refuses oversize files before reading and rejects malformed UTF-8 or a BOM", async () => {
  const user = userEvent.setup(); render(<RecordedRuntimeOccurrences />);
  const read = vi.spyOn(FileReader.prototype, "readAsArrayBuffer");
  fireEvent.change(screen.getByLabelText("Occurrence report JSON"), { target: {
    files: [new File([new Uint8Array(512 * 1024 + 1)], "large.json", { type: "application/json" })],
  } });
  await user.click(screen.getByRole("button", { name: "Import recorded occurrences" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("at most 512 KiB");
  expect(read).not.toHaveBeenCalled();
  for (const bytes of [new Uint8Array([0xff]), new Uint8Array([0xef, 0xbb, 0xbf, 0x7b, 0x7d])]) {
    fireEvent.change(screen.getByLabelText("Occurrence report JSON"), { target: {
      files: [new File([bytes], "invalid.json", { type: "application/json" })],
    } });
    await user.click(screen.getByRole("button", { name: "Import recorded occurrences" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Import refused");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  }
});

it("cancels the actual pending FileReader rather than only hiding its result", async () => {
  let aborts = 0;
  class PendingReader {
    static LOADING = 1;
    readyState = 0;
    result: ArrayBuffer | null = null;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onabort: (() => void) | null = null;
    readAsArrayBuffer() { this.readyState = 1; }
    abort() { aborts++; this.readyState = 2; this.onabort?.(); }
  }
  vi.stubGlobal("FileReader", PendingReader);
  const user = userEvent.setup(); render(<RecordedRuntimeOccurrences />);
  await user.upload(screen.getByLabelText("Occurrence report JSON"), file());
  await user.click(screen.getByRole("button", { name: "Import recorded occurrences" }));
  await user.click(screen.getByRole("button", { name: "Cancel occurrence import" }));
  expect(aborts).toBe(1);
  expect(screen.getByRole("status")).toHaveTextContent("Import cancelled");
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
});

it("ignores a cancelled parser's late success after a newer import and selection", async () => {
  const ready = await projected();
  let resolveOld!: (value: model.RecordedRuntimeOccurrences) => void;
  const parse = vi.spyOn(model, "importRecordedRuntimeOccurrences")
    .mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }))
    .mockResolvedValueOnce(ready);
  const user = userEvent.setup(); render(<RecordedRuntimeOccurrences />);
  await user.upload(screen.getByLabelText("Occurrence report JSON"), file());
  await user.click(screen.getByRole("button", { name: "Import recorded occurrences" }));
  await waitFor(() => expect(parse).toHaveBeenCalledTimes(1));
  const signal = parse.mock.calls[0][2]!;
  await user.click(screen.getByRole("button", { name: "Cancel occurrence import" }));
  expect(signal.aborted).toBe(true);
  await user.click(screen.getByRole("button", { name: "Import recorded occurrences" }));
  const cases = await screen.findByRole("combobox", { name: "Recorded occurrence case" });
  await user.selectOptions(cases, "4");
  await act(async () => { resolveOld(ready); await Promise.resolve(); });
  expect(cases).toHaveValue("4");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("reset ignores a late parser failure and leaves no previous selection", async () => {
  let rejectOld!: (error: Error) => void;
  const parse = vi.spyOn(model, "importRecordedRuntimeOccurrences")
    .mockImplementationOnce(() => new Promise((_, reject) => { rejectOld = reject; }));
  const user = userEvent.setup(); render(<RecordedRuntimeOccurrences />);
  await user.upload(screen.getByLabelText("Occurrence report JSON"), file());
  await user.click(screen.getByRole("button", { name: "Import recorded occurrences" }));
  await waitFor(() => expect(parse).toHaveBeenCalledTimes(1));
  await user.click(screen.getByRole("button", { name: "Reset recorded occurrences" }));
  await act(async () => { rejectOld(new Error("old rejected import")); await Promise.resolve(); });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Reset complete");
});

it("unmount aborts pending parser work and discards its later resolution", async () => {
  const ready = await projected();
  let resolveOld!: (value: model.RecordedRuntimeOccurrences) => void;
  const parse = vi.spyOn(model, "importRecordedRuntimeOccurrences")
    .mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
  const user = userEvent.setup(), view = render(<RecordedRuntimeOccurrences />);
  await user.upload(screen.getByLabelText("Occurrence report JSON"), file());
  await user.click(screen.getByRole("button", { name: "Import recorded occurrences" }));
  await waitFor(() => expect(parse).toHaveBeenCalledTimes(1));
  const signal = parse.mock.calls[0][2]!;
  view.unmount(); expect(signal.aborted).toBe(true);
  await act(async () => { resolveOld(ready); await Promise.resolve(); });
});
