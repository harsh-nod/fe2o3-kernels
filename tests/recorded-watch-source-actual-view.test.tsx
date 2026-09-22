import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecordedWatchSourceObservation } from "../src/components/RecordedWatchSourceObservation";
import { WATCH_SOURCE_FILES } from "../src/content/recorded-watch-source-observation";
import { readActualWatchSourceCapture } from "./fixtures/actual-watch-source-capture";
const actual = readActualWatchSourceCapture();
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it("renders actual unavailable/SSA-only/source-replay moments with their own derived anchors and counts", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch); const storage = vi.spyOn(Storage.prototype, "setItem");
  const user = userEvent.setup(); render(<RecordedWatchSourceObservation />);
  for (const spec of WATCH_SOURCE_FILES) await user.upload(screen.getByLabelText(spec.label, { exact: false }),
    new File([actual.files[spec.role]], spec.leaf, { type: spec.role === "receipt" ? "application/json" : "application/x-ndjson" }));
  await user.click(screen.getByRole("button", { name: "Import watch/source recording" }));
  await screen.findByText("Imported consistent local files; all provenance remains unverified.");
  const selected = () => screen.getByRole("region", { name: "Selected watch/source moment" });
  expect(selected()).toHaveAttribute("data-moment", "stop");
  expect(within(selected()).queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByTestId("watch-source-selected-anchor")).not.toHaveTextContent("Logical lane");
  await user.click(screen.getByRole("radio", { name: "Immediate post-write checkpoint — lane 0, source unavailable" }));
  expect(within(selected()).queryByRole("table", { name: "Selected checkpoint source variables" })).not.toBeInTheDocument();
  expect(within(selected()).getByRole("table", { name: "Selected checkpoint SSA values" }).querySelectorAll("tbody tr"))
    .toHaveLength(actual.immediate.response.result.snapshot.snapshot.values.length);
  const names = ["Later source checkpoint — lane 1", "Reverse pre-write checkpoint — lane 0", "Repeated later source checkpoint — lane 1"];
  for (const [i, group] of actual.groups.entries()) {
    await user.click(screen.getByRole("radio", { name: names[i] }));
    const cursor = group.summary.checkpoint_anchor.cursor, source = within(selected()).getByRole("region", { name: "Imported checkpoint source variables" });
    expect(screen.getByTestId("watch-source-selected-anchor")).toHaveTextContent("Event " + cursor.event_sequence + "; revision " + cursor.state_revision);
    expect(within(source).getByRole("table", { name: "Selected checkpoint source variables" }).querySelectorAll("tbody tr")).toHaveLength(group.sourceRows.length);
    expect(within(selected()).getByRole("table", { name: "Selected checkpoint SSA values" }).querySelectorAll("tbody tr")).toHaveLength(group.ssaRows.length);
    expect(within(source).getAllByText("not_represented")).toHaveLength(group.sourceRows.filter(r => r.availability.value.status === "unavailable").length);
    await user.click(within(selected()).getByText("Selected moment original pairs"));
    expect(screen.getByLabelText("Original watch/source request line").textContent).toBe(group.control.requestUtf8);
    expect(screen.getByLabelText("Original watch/source response line").textContent).toBe(group.control.responseUtf8);
  }
  await user.upload(screen.getByLabelText("Full session responses JSONL", { exact: false }),
    new File(["{}\n"], "synthetic-invalid.jsonl", { type: "application/x-ndjson" }));
  expect(screen.queryByRole("region", { name: "Selected watch/source moment" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Import watch/source recording" })); await screen.findByText(/file_hash/);
  expect(screen.queryByRole("table", { name: "Selected checkpoint source variables" })).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled();
});
