import { webcrypto } from "node:crypto";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RecordedWatchpointObservation } from "../src/components/RecordedWatchpointObservation";
import { importRecordedWatchpoint } from "../src/content/recorded-watchpoint-observation";
import * as bookmarks from "../src/content/watchpoint-moment-bookmark";
import requests from "./fixtures/recorded-watchpoint-requests.jsonl?raw";
import responses from "./fixtures/recorded-watchpoint-responses.jsonl?raw";

const createUrl = vi.fn(), revokeUrl = vi.fn();
beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  createUrl.mockReset().mockReturnValue("blob:watchpoint-test"); revokeUrl.mockReset();
  vi.stubGlobal("URL", { createObjectURL: createUrl, revokeObjectURL: revokeUrl });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const file = (text: string, name: string) => new File([text], name, { type: "application/json" });
const bookmarkPanel = () => screen.getByRole("region", { name: "Recorded watchpoint moment bookmark" });
async function imported(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(screen.getByLabelText("Watchpoint requests JSONL"), file(requests, "requests.jsonl"));
  await user.upload(screen.getByLabelText("Watchpoint responses JSONL"), file(responses, "responses.jsonl"));
  await user.click(screen.getByRole("button", { name: "Import watchpoint observation" }));
  await screen.findByRole("region", { name: "Recorded watchpoint moment bookmark" });
}
async function saved(moment: bookmarks.WatchpointBookmarkMoment) {
  return bookmarks.serializeWatchpointMomentBookmark(await importRecordedWatchpoint(requests, responses), moment);
}
async function reopen(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.upload(screen.getByLabelText("Watchpoint moment bookmark JSON"), file(text, "moment.json"));
  await user.click(screen.getByRole("button", { name: "Reopen moment bookmark" }));
}
function blobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error); reader.readAsText(blob);
  });
}

it("downloads an exact moment bookmark only on explicit request and revokes its URL on unmount", async () => {
  const user = userEvent.setup(), fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const storage = vi.spyOn(Storage.prototype, "setItem");
  const view = render(<RecordedWatchpointObservation />); await imported(user);
  expect(createUrl).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Download moment bookmark" }));
  await within(bookmarkPanel()).findByText(/Moment bookmark downloaded/u);
  expect(createUrl).toHaveBeenCalledTimes(1);
  const text = await blobText(createUrl.mock.calls[0][0] as Blob);
  expect(await bookmarks.restoreWatchpointMomentBookmark(await importRecordedWatchpoint(requests, responses), text)).toBe("stop");
  expect(text).not.toContain("0xd5010000");
  expect(fetch).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled();
  view.unmount(); expect(revokeUrl).toHaveBeenCalledWith("blob:watchpoint-test");
});

it("reopens an uncaptured stop from later memory without inheriting a snapshot", async () => {
  const text = await saved("stop"), user = userEvent.setup();
  render(<RecordedWatchpointObservation />); await imported(user);
  await user.click(screen.getByRole("radio", { name: "Separate later checkpoint and memory" }));
  expect(screen.getByRole("group", { name: "Captured memory cells" })).toBeInTheDocument();
  await reopen(user, text);
  await screen.findByRole("region", { name: "Uncaptured watchpoint stop" });
  expect(screen.queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Separate later captured checkpoint" })).not.toBeInTheDocument();
  expect(screen.getByRole("status", { name: "Restored watchpoint moment" })).toHaveTextContent("no debugger command");
});

it("same-moment reopen resets raw pair and cell interpretation choices", async () => {
  const text = await saved("checkpoint"), user = userEvent.setup();
  render(<RecordedWatchpointObservation />); await imported(user);
  await user.click(screen.getByRole("radio", { name: "Separate later checkpoint and memory" }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Memory cell size" }), "4");
  await user.click(screen.getByRole("button", { name: "Show selected moment's original pairs" }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Selected moment original pair" }), "1");
  await reopen(user, text);
  await screen.findByRole("status", { name: "Restored watchpoint moment" });
  expect(screen.getByRole("combobox", { name: "Memory cell size" })).toHaveValue("1");
  expect(screen.queryByRole("combobox", { name: "Selected moment original pair" })).not.toBeInTheDocument();
});

it("reopens registration separately from both stop and later memory", async () => {
  const text = await saved("registration"), user = userEvent.setup();
  render(<RecordedWatchpointObservation />); await imported(user); await reopen(user, text);
  await screen.findByRole("region", { name: "Recorded watchpoint registration" });
  expect(screen.queryByRole("region", { name: "Uncaptured watchpoint stop" })).not.toBeInTheDocument();
  expect(screen.queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
});

it("stale or oversized bookmarks refuse without changing the selected moment", async () => {
  const text = await saved("checkpoint"), user = userEvent.setup();
  render(<RecordedWatchpointObservation />); await imported(user);
  const stale = text.replace("f7184765621758f4e57a82ff603093c1d53474b8dc68eddf69debbaf2afc608c", "a".repeat(64));
  expect(stale).not.toBe(text);
  await reopen(user, stale);
  await within(bookmarkPanel()).findByRole("alert");
  expect(screen.getByRole("radio", { name: "Uncaptured watch stop" })).toBeChecked();
  await reopen(user, "x".repeat(16 * 1024 + 1));
  expect(await within(bookmarkPanel()).findByRole("alert")).toHaveTextContent("16 KiB");
  expect(screen.getByRole("radio", { name: "Uncaptured watch stop" })).toBeChecked();
});

it("late restore completion cannot survive cancel, manual moment change, or recording reset", async () => {
  for (const action of ["cancel", "moment", "reset"] as const) {
    const text = await saved("checkpoint"), user = userEvent.setup();
    const view = render(<RecordedWatchpointObservation />); await imported(user);
    let resolve!: (value: bookmarks.WatchpointBookmarkMoment) => void;
    const pending = new Promise<bookmarks.WatchpointBookmarkMoment>(done => { resolve = done; });
    const restore = vi.spyOn(bookmarks, "restoreWatchpointMomentBookmark").mockReturnValueOnce(pending);
    await reopen(user, text);
    await vi.waitFor(() => expect(restore).toHaveBeenCalledTimes(1));
    if (action === "cancel") await user.click(screen.getByRole("button", { name: "Cancel moment bookmark" }));
    else if (action === "moment") await user.click(screen.getByRole("radio", { name: "Registration and earlier inventory" }));
    else await user.click(screen.getByRole("button", { name: "Reset watchpoint observation" }));
    await act(async () => { resolve("checkpoint"); await pending; });
    expect(screen.queryByRole("region", { name: "Separate later captured checkpoint" })).not.toBeInTheDocument();
    if (action === "moment") expect(screen.getByRole("radio", { name: "Registration and earlier inventory" })).toBeChecked();
    if (action === "cancel") expect(screen.getByRole("radio", { name: "Uncaptured watch stop" })).toBeChecked();
    restore.mockRestore(); view.unmount();
  }
});

it("a cancelled late serialization never downloads a bookmark", async () => {
  const user = userEvent.setup(); render(<RecordedWatchpointObservation />); await imported(user);
  let resolve!: (value: string) => void;
  const pending = new Promise<string>(done => { resolve = done; });
  vi.spyOn(bookmarks, "serializeWatchpointMomentBookmark").mockReturnValueOnce(pending);
  await user.click(screen.getByRole("button", { name: "Download moment bookmark" }));
  await user.click(screen.getByRole("button", { name: "Reset watchpoint observation" }));
  await act(async () => { resolve("{}"); await pending; });
  expect(createUrl).not.toHaveBeenCalled();
});
