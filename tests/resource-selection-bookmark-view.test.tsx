import { webcrypto } from "node:crypto";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ResourceSelectionBookmark } from "../src/components/ResourceSelectionBookmark";
import * as bookmarks from "../src/content/resource-selection-bookmark";
import { recordedComparison } from "./fixtures/resource-memory-comparison";

const selection: bookmarks.ResourceBookmarkSelection = { checkpointRequestId: 6, pageRequestId: 7,
  memoryRequestId: 11, baseline: { checkpointRequestId: 14, memoryRequestId: 15 } };
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });
function bookmarkFile(raw: string) { return new File([raw], "saved-view.json", { type: "application/json" }); }
function region() { return screen.getByRole("region", { name: "Retained view bookmark" }); }
async function choose(user: ReturnType<typeof userEvent.setup>, raw: string) {
  await user.upload(screen.getByLabelText("View bookmark JSON"), bookmarkFile(raw));
}
it("explicitly reopens exact global and LDS views locally and reports unsaved-state boundaries", async () => {
  const user = userEvent.setup(), fetch = vi.fn(), storage = vi.spyOn(Storage.prototype, "setItem");
  vi.stubGlobal("fetch", fetch);
  for (const kind of ["global", "lds"] as const) {
    const recording = await recordedComparison(kind), restore = vi.fn();
    const chosen = kind === "global" ? selection : { checkpointRequestId: 11, pageRequestId: 14,
      memoryRequestId: 13, baseline: { checkpointRequestId: 16, memoryRequestId: 17 } };
    const view = render(<ResourceSelectionBookmark recording={recording} selection={chosen} onRestore={restore} />);
    expect(screen.getByRole("button", { name: "Reopen view bookmark" })).toBeDisabled();
    expect(region()).toHaveTextContent("not a capture or debugger command");
    expect(region()).toHaveTextContent("do not authenticate source");
    expect(region()).toHaveTextContent("16 KiB");
    expect(region()).toHaveTextContent("Pointer focus, access filters");
    const raw = bookmarks.serializeResourceSelectionBookmark(recording, chosen);
    await choose(user, raw);
    expect(restore).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Reopen view bookmark" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Exact saved view reopened");
    expect(restore).toHaveBeenCalledExactlyOnceWith(chosen);
    expect(region()).toHaveAttribute("aria-busy", "false");
    view.unmount();
  }
  expect(fetch).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled();
});
it("downloads only a bounded selection document with a fixed local filename and revokes the object URL", async () => {
  const user = userEvent.setup(), recording = await recordedComparison(), restore = vi.fn();
  let blob: Blob | undefined;
  const create = vi.fn((value: Blob) => { blob = value; return "blob:bookmark-test"; }), revoke = vi.fn();
  vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: revoke });
  const clicks: { download: string; href: string; connected: boolean }[] = [];
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    clicks.push({ download: this.download, href: this.getAttribute("href")!, connected: this.isConnected });
  });
  const view = render(<ResourceSelectionBookmark recording={recording} selection={selection} onRestore={restore} />);
  await user.click(screen.getByRole("button", { name: "Download view bookmark" }));
  expect(create).toHaveBeenCalledTimes(1); expect(blob!.size).toBeLessThanOrEqual(bookmarks.RESOURCE_BOOKMARK_MAX_BYTES);
  expect(clicks).toEqual([{ download: "fe2o3-retained-view.bookmark.json", href: "blob:bookmark-test", connected: true }]);
  expect(document.querySelector('a[download]')).not.toBeInTheDocument();
  const raw = await bookmarks.readResourceBookmarkFile(new File([blob!], "download.json"), new AbortController().signal);
  expect(bookmarks.restoreResourceSelectionBookmark(recording, raw)).toEqual(selection);
  expect(restore).not.toHaveBeenCalled();
  expect(screen.getByRole("status")).toHaveTextContent("original paired recording files separately");
  view.unmount(); expect(revoke).toHaveBeenCalledExactlyOnceWith("blob:bookmark-test");
});
it("revokes a replaced download and the timer-owned URL without requiring unmount", async () => {
  const recording = await recordedComparison(), create = vi.fn().mockReturnValueOnce("blob:one").mockReturnValueOnce("blob:two");
  const revoke = vi.fn(); vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: revoke });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  render(<ResourceSelectionBookmark recording={recording} selection={selection} onRestore={vi.fn()} />);
  vi.useFakeTimers();
  act(() => { screen.getByRole("button", { name: "Download view bookmark" }).click(); });
  act(() => { screen.getByRole("button", { name: "Download view bookmark" }).click(); });
  expect(revoke).toHaveBeenCalledWith("blob:one");
  act(() => vi.advanceTimersByTime(1000));
  expect(revoke).toHaveBeenCalledWith("blob:two"); expect(revoke).toHaveBeenCalledTimes(2);
});
it("refuses stale and malformed bookmarks without calling the atomic restore callback", async () => {
  const user = userEvent.setup(), recording = await recordedComparison(), restore = vi.fn();
  render(<ResourceSelectionBookmark recording={recording} selection={selection} onRestore={restore} />);
  const raw = bookmarks.serializeResourceSelectionBookmark(recording, selection);
  for (const bad of [raw.replace(recording.responseSha256, "b".repeat(64)), '{"schema":1,"schema":1}', "{}"]) {
    await choose(user, bad);
    await user.click(screen.getByRole("button", { name: "Reopen view bookmark" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No saved selection applied");
    expect(restore).not.toHaveBeenCalled();
  }
});
it("refuses an invalid current selection before creating any download", async () => {
  const user = userEvent.setup(), recording = await recordedComparison(), create = vi.fn();
  vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: vi.fn() });
  render(<ResourceSelectionBookmark recording={recording} selection={{ ...selection, memoryRequestId: 999 }} onRestore={vi.fn()} />);
  await user.click(screen.getByRole("button", { name: "Download view bookmark" }));
  expect(screen.getByRole("alert")).toHaveTextContent("download refused");
  expect(create).not.toHaveBeenCalled();
});
it.each(["cancel", "file", "recording", "same-byte-recording", "unmount"])("discards a pending read after %s", async kind => {
  const user = userEvent.setup(), recording = await recordedComparison(), restore = vi.fn();
  const raw = bookmarks.serializeResourceSelectionBookmark(recording, selection);
  let finish!: (value: string) => void;
  const signals: AbortSignal[] = [];
  vi.spyOn(bookmarks, "readResourceBookmarkFile").mockImplementation((_file, signal) =>
    new Promise(resolve => { finish = resolve; signals.push(signal); }));
  const view = render(<ResourceSelectionBookmark recording={recording} selection={selection} onRestore={restore} />);
  await choose(user, raw);
  await user.click(screen.getByRole("button", { name: "Reopen view bookmark" }));
  expect(region()).toHaveAttribute("aria-busy", "true");
  expect(screen.getByRole("button", { name: "Download view bookmark" })).toBeDisabled();
  if (kind === "cancel") await user.click(screen.getByRole("button", { name: "Cancel bookmark reopen" }));
  if (kind === "file") await choose(user, raw + " ");
  if (kind === "recording" || kind === "same-byte-recording") {
    const changed = kind === "recording" ? await recordedComparison("lds") : await recordedComparison();
    view.rerender(<ResourceSelectionBookmark recording={changed} selection={selection} onRestore={restore} />);
    expect(screen.getByLabelText("View bookmark JSON")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Reopen view bookmark" })).toBeDisabled();
  }
  if (kind === "unmount") view.unmount();
  expect(signals[0].aborted).toBe(true);
  await act(async () => finish(raw));
  expect(restore).not.toHaveBeenCalled();
  if (kind !== "unmount") expect(region()).toHaveAttribute("aria-busy", "false");
});
it("supports keyboard download activation with labeled controls and a bounded file input", async () => {
  const user = userEvent.setup(), recording = await recordedComparison(), create = vi.fn().mockReturnValue("blob:keyboard");
  vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  render(<ResourceSelectionBookmark recording={recording} selection={selection} onRestore={vi.fn()} />);
  const download = within(region()).getByRole("button", { name: "Download view bookmark" });
  download.focus(); await user.keyboard("{Enter}");
  expect(create).toHaveBeenCalledTimes(1);
  const input = screen.getByLabelText("View bookmark JSON");
  expect(input).toHaveAttribute("type", "file");
  expect(input).toHaveAccessibleDescription(/exact SHA-256/u);
  await user.upload(input, new File([new Uint8Array(bookmarks.RESOURCE_BOOKMARK_MAX_BYTES + 1)], "big.json",
    { type: "application/json" }));
  await user.click(screen.getByRole("button", { name: "Reopen view bookmark" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("at most 16 KiB");
});
