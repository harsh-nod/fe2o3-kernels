import { webcrypto } from "node:crypto";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RecordedWatchpointObservation } from "../src/components/RecordedWatchpointObservation";
import * as importer from "../src/content/recorded-watchpoint-observation";
import requests from "./fixtures/recorded-watchpoint-requests.jsonl?raw";
import responses from "./fixtures/recorded-watchpoint-responses.jsonl?raw";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const file = (text: string, name: string) => new File([text], name, { type: "application/x-ndjson" });
const originalLine = (raw: string, requestId: number) => {
  const rows = raw.split("\n").filter(line => line && JSON.parse(line).request_id === requestId);
  if (rows.length !== 1 || !raw.endsWith("\n")) throw new Error("Exact retained LF-terminated fixture required.");
  return rows[0] + "\n";
};
async function selectFiles(user: ReturnType<typeof userEvent.setup>, response = responses, responseName = "watch-responses.jsonl") {
  await user.upload(screen.getByLabelText("Watchpoint requests JSONL"), file(requests, "watch-requests.jsonl"));
  await user.upload(screen.getByLabelText("Watchpoint responses JSONL"), file(response, responseName));
}
async function imported(user: ReturnType<typeof userEvent.setup>) {
  await selectFiles(user);
  await user.click(screen.getByRole("button", { name: "Import watchpoint observation" }));
  return screen.findByRole("radio", { name: "Uncaptured watch stop" });
}
async function later(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("radio", { name: "Separate later checkpoint and memory" }));
  return screen.getByRole("region", { name: "Separate later captured checkpoint" });
}
async function raw(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Show selected moment's original pairs" }));
  return screen.getByRole("combobox", { name: "Selected moment original pair" });
}

it("starts empty with both local files required and no invented observation", () => {
  render(<RecordedWatchpointObservation />);
  expect(screen.getByRole("button", { name: "Import watchpoint observation" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Cancel watchpoint import" })).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("No watchpoint observation is displayed");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
});

it("imports actual seven pairs and defaults to the uncaptured stop without later state or side effects", async () => {
  const user = userEvent.setup(), fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const storage = vi.spyOn(Storage.prototype, "setItem");
  render(<RecordedWatchpointObservation />);
  expect(await imported(user)).toBeChecked();
  const stop = screen.getByRole("region", { name: "Uncaptured watchpoint stop" });
  expect(stop).toHaveTextContent("Request 6 reports watchpoint 1 at event 32, revision 3");
  expect(stop).toHaveTextContent("Outcome: active; exact stop: yes");
  expect(stop).toHaveTextContent("unavailable / not_captured");
  const table = within(stop).getByRole("table", { name: "Unavailable at the watchpoint stop" });
  expect(within(table).getAllByRole("row")).toHaveLength(7);
  expect(within(table).getAllByText("Unavailable — not captured")).toHaveLength(6);
  expect(screen.queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
  expect(screen.queryByText(/byte range \[931, 947\)/u)).not.toBeInTheDocument();
  expect(screen.queryByText(/0xd5010000/u)).not.toBeInTheDocument();
  expect(screen.getByText(/not capture admission, producer authentication/u)).toBeInTheDocument();
  expect(screen.getByLabelText("Watchpoint recording byte provenance")).toHaveTextContent("watch-requests.jsonl");
  expect(screen.getByLabelText("Watchpoint recording byte provenance")).toHaveTextContent("watch-responses.jsonl");
  expect(screen.getByText(/All 7 original pairs/u)).toBeInTheDocument();
  const pairs = await raw(user);
  expect(within(pairs).getAllByRole("option")).toHaveLength(1);
  expect(pairs).toHaveTextContent("request 6");
  expect(screen.getByLabelText("Original watchpoint request line").textContent).toBe(originalLine(requests, 6));
  expect(screen.getByLabelText("Original watchpoint response line").textContent).toBe(originalLine(responses, 6));
  expect(stop).not.toHaveTextContent("931");
  expect(fetch).not.toHaveBeenCalled();
  expect(storage).not.toHaveBeenCalled();
});

it("shows registration and earlier inventory without attributing earlier or later bytes to the stop", async () => {
  const user = userEvent.setup(); render(<RecordedWatchpointObservation />); await imported(user);
  await user.click(screen.getByRole("radio", { name: "Registration and earlier inventory" }));
  const registration = screen.getByRole("region", { name: "Recorded watchpoint registration" });
  expect(registration).toHaveTextContent("Request 4 registers the watchpoint; request 5 lists it");
  expect(registration).toHaveTextContent("request 1, event 1, revision 1");
  expect(registration).toHaveTextContent("source-first-write");
  expect(registration).toHaveTextContent("alloc#1:g0");
  expect(registration).toHaveTextContent("Offset 0; length 4 bytes");
  expect(registration).toHaveTextContent("24 bytes · global");
  expect(registration).toHaveTextContent("write / after_commit");
  expect(screen.queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
  const pairs = await raw(user);
  expect(within(pairs).getAllByRole("option")).toHaveLength(4);
  await user.selectOptions(pairs, "3");
  expect(screen.getByLabelText("Original watchpoint request line").textContent).toBe(originalLine(requests, 5));
  expect(screen.getByLabelText("Original watchpoint response line").textContent).toBe(originalLine(responses, 5));
  expect(pairs).not.toHaveTextContent("request 7");
  expect(pairs).not.toHaveTextContent("request 12");
});

it("requires explicit later selection, reuses captured memory, and keeps exact raw evidence within that moment", async () => {
  const user = userEvent.setup(); render(<RecordedWatchpointObservation />); await imported(user);
  const checkpoint = await later(user);
  expect(checkpoint).toHaveTextContent("Selected request 7: event 33, revision 4");
  expect(checkpoint).toHaveTextContent("Memory request 12 belongs only to this later checkpoint");
  expect(checkpoint).toHaveTextContent("Frame: unavailable; occurrence: unavailable");
  expect(checkpoint).toHaveTextContent("byte range [931, 947)");
  expect(checkpoint).toHaveTextContent("not the watch-stop origin");
  const cells = within(screen.getByRole("group", { name: "Captured memory cells" })).getAllByRole("button");
  expect(cells).toHaveLength(24);
  expect(cells[0]).toHaveAccessibleName("Byte offset 0, 1 byte, 0xd5, initialized");
  expect(cells[1]).toHaveAccessibleName("Byte offset 1, 1 byte, 0x01, initialized");
  const pairs = await raw(user);
  expect(within(pairs).getAllByRole("option")).toHaveLength(2);
  expect(screen.getByLabelText("Original watchpoint response line").textContent).toBe(originalLine(responses, 7));
  await user.selectOptions(pairs, "1");
  expect(screen.getByLabelText("Original watchpoint request line").textContent).toBe(originalLine(requests, 12));
  expect(screen.getByLabelText("Original watchpoint response line").textContent).toBe(originalLine(responses, 12));
  await user.click(screen.getByRole("radio", { name: "Uncaptured watch stop" }));
  expect(screen.queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Original watchpoint response line")).not.toBeInTheDocument();
  expect(screen.queryByText(/byte range \[931, 947\)/u)).not.toBeInTheDocument();
  expect(screen.getByRole("table", { name: "Unavailable at the watchpoint stop" })).toBeInTheDocument();
  expect(within(await raw(user)).getAllByRole("option")).toHaveLength(1);
});

it("supports keyboard moment and memory navigation while resetting later-only selections", async () => {
  const user = userEvent.setup(); render(<RecordedWatchpointObservation />);
  const stop = await imported(user); stop.focus();
  await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("radio", { name: "Separate later checkpoint and memory" })).toBeChecked();
  let cells = within(screen.getByRole("group", { name: "Captured memory cells" })).getAllByRole("button");
  cells[0].focus(); await user.keyboard("{ArrowRight}");
  expect(cells[1]).toHaveFocus();
  await user.selectOptions(screen.getByRole("combobox", { name: "Memory cell size" }), "4");
  expect(screen.getByRole("combobox", { name: "Memory cell size" })).toHaveValue("4");
  await user.click(screen.getByRole("radio", { name: "Uncaptured watch stop" }));
  expect(screen.queryByRole("combobox", { name: "Memory cell size" })).not.toBeInTheDocument();
  await later(user);
  expect(screen.getByRole("combobox", { name: "Memory cell size" })).toHaveValue("1");
  cells = within(screen.getByRole("group", { name: "Captured memory cells" })).getAllByRole("button");
  expect(cells[0]).toHaveAttribute("aria-pressed", "true");
});

it("clears old later bytes immediately on file replacement, then refuses invalid data and resets focus", async () => {
  const user = userEvent.setup(); render(<RecordedWatchpointObservation />); await imported(user); await later(user);
  await user.upload(screen.getByLabelText("Watchpoint responses JSONL"), file("{}\n", "bad.jsonl"));
  expect(screen.queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Import watchpoint observation" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Import refused");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Reset watchpoint observation" }));
  expect(screen.getByLabelText("Watchpoint requests JSONL")).toHaveValue("");
  expect(screen.getByLabelText("Watchpoint responses JSONL")).toHaveValue("");
  expect(screen.getByLabelText("Watchpoint requests JSONL")).toHaveFocus();
  expect(screen.getByRole("button", { name: "Import watchpoint observation" })).toBeDisabled();
});

it("same-byte reimport starts at the uncaptured stop and does not revive prior raw or memory selection", async () => {
  const user = userEvent.setup(); render(<RecordedWatchpointObservation />); await imported(user);
  await later(user); await raw(user);
  await user.upload(screen.getByLabelText("Watchpoint responses JSONL"), file(responses, "replacement.jsonl"));
  expect(screen.queryByLabelText("Original watchpoint response line")).not.toBeInTheDocument();
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Import watchpoint observation" }));
  expect(await screen.findByRole("radio", { name: "Uncaptured watch stop" })).toBeChecked();
  expect(screen.queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Original watchpoint response line")).not.toBeInTheDocument();
});

it("ignores late parser success after cancellation and a newer successful import", async () => {
  const ready = await importer.importRecordedWatchpoint(requests, responses);
  let resolveOld!: (value: importer.RecordedWatchpointObservation) => void;
  const parse = vi.spyOn(importer, "importRecordedWatchpoint")
    .mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; })).mockResolvedValueOnce(ready);
  const user = userEvent.setup(); render(<RecordedWatchpointObservation />); await selectFiles(user);
  await user.click(screen.getByRole("button", { name: "Import watchpoint observation" }));
  await vi.waitFor(() => expect(parse).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("button", { name: "Import watchpoint observation" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Cancel watchpoint import" }));
  expect(screen.getByRole("status")).toHaveTextContent("Import cancelled");
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Import watchpoint observation" }));
  await screen.findByRole("radio", { name: "Uncaptured watch stop" });
  await later(user);
  await act(async () => { resolveOld(ready); });
  expect(screen.getByRole("radio", { name: "Separate later checkpoint and memory" })).toBeChecked();
  expect(screen.getByRole("group", { name: "Captured memory cells" })).toBeInTheDocument();
});

it("aborts pending readers on replacement, cancellation and unmount", async () => {
  const signals: AbortSignal[] = [];
  vi.spyOn(importer, "readWatchpointFile").mockImplementation((_file, signal) => {
    signals.push(signal); return new Promise(() => {});
  });
  const user = userEvent.setup(), view = render(<RecordedWatchpointObservation />); await selectFiles(user);
  await user.click(screen.getByRole("button", { name: "Import watchpoint observation" }));
  expect(signals[0].aborted).toBe(false);
  await user.upload(screen.getByLabelText("Watchpoint responses JSONL"), file(responses, "new.jsonl"));
  expect(signals[0].aborted).toBe(true);
  await user.click(screen.getByRole("button", { name: "Import watchpoint observation" }));
  await user.click(screen.getByRole("button", { name: "Cancel watchpoint import" }));
  expect(signals[1].aborted).toBe(true);
  await user.click(screen.getByRole("button", { name: "Import watchpoint observation" }));
  expect(signals[2].aborted).toBe(false);
  view.unmount();
  expect(signals[2].aborted).toBe(true);
});

it("reset and cleared file selection prevent a late completed projection from resurfacing", async () => {
  const ready = await importer.importRecordedWatchpoint(requests, responses);
  let resolve!: (value: importer.RecordedWatchpointObservation) => void;
  const parse = vi.spyOn(importer, "importRecordedWatchpoint")
    .mockImplementation(() => new Promise(done => { resolve = done; }));
  const user = userEvent.setup(); render(<RecordedWatchpointObservation />); await selectFiles(user);
  await user.click(screen.getByRole("button", { name: "Import watchpoint observation" }));
  await vi.waitFor(() => expect(parse).toHaveBeenCalledOnce());
  await user.click(screen.getByRole("button", { name: "Reset watchpoint observation" }));
  await act(async () => { resolve(ready); });
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Import watchpoint observation" })).toBeDisabled();
  await selectFiles(user);
  fireEvent.change(screen.getByLabelText("Watchpoint responses JSONL"), { target: { files: [] } });
  expect(screen.getByRole("button", { name: "Import watchpoint observation" })).toBeDisabled();
});

it("renders untrusted filenames as text and bounds parser error messages", async () => {
  const user = userEvent.setup(); render(<RecordedWatchpointObservation />);
  await selectFiles(user, responses, "<img src=x onerror=alert(1)>.jsonl");
  await user.click(screen.getByRole("button", { name: "Import watchpoint observation" }));
  await screen.findByRole("radio", { name: "Uncaptured watch stop" });
  expect(screen.getByLabelText("Watchpoint recording byte provenance")).toHaveTextContent("<img src=x onerror=alert(1)>.jsonl");
  expect(document.querySelector("img")).not.toBeInTheDocument();
  vi.spyOn(importer, "importRecordedWatchpoint").mockRejectedValueOnce(new Error("x".repeat(2000)));
  await user.click(screen.getByRole("button", { name: "Import watchpoint observation" }));
  expect((await screen.findByRole("alert")).textContent!.length).toBeLessThanOrEqual("Import refused. ".length + 384);
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
});
