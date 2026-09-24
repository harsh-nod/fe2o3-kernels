// @vitest-environment jsdom
import { webcrypto } from "node:crypto";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PhysicalLdsRecordingPage } from "../src/components/PhysicalLdsRecordingPage";
import { LdsRecordingView } from "../src/components/LdsRecordingView";
import * as adapter from "../src/content/physical-lds-debug-v22";
import * as loader from "../src/content/physical-lds-debug-v22-load";
import { retained } from "./support/physical-lds-recording-fixture";
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it("renders bounded index pages and both logical waves, no network", async () => {
  const r = await adapter.projectLdsRecording(retained()), fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const user = userEvent.setup(); render(<LdsRecordingView recording={r} />);
  expect(screen.getByRole("region", { name: "Logical wave 0" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Logical wave 1" })).toBeInTheDocument();
  expect(screen.getAllByRole("row").length).toBeLessThanOrEqual(70);
  await user.click(screen.getByRole("button", { name: "Jump to recorded release" }));
  expect(screen.getByText(/128 \/128 arrivals/)).toBeInTheDocument();
  const select = screen.getByRole("combobox", { name: "Recorded request" });
  const page = r.observations.findIndex(o => o.values?.length && o.rawValues?.some(v => (v.availability as { status?: string }).status === "unavailable"));
  await user.selectOptions(select, String(page));
  expect(screen.getByRole("table", { name: "Selected checkpoint SSA values" })).toBeInTheDocument();
  await user.selectOptions(select, String(r.observations.findIndex(o => o.status === "unavailable")));
  expect(screen.queryByRole("table", { name: "Selected checkpoint SSA values" })).not.toBeInTheDocument();
  expect(screen.getByText(/Previous values are not carried forward/)).toBeInTheDocument(); expect(fetch).not.toHaveBeenCalled();
});
it("clears old values immediately when any local input changes", async () => {
  const r = await adapter.projectLdsRecording(retained());
  vi.spyOn(loader, "loadLdsRecording").mockResolvedValue(retained()); vi.spyOn(adapter, "projectLdsRecording").mockResolvedValue(r);
  render(<MemoryRouter><PhysicalLdsRecordingPage /></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: /Original registers/ }));
  await screen.findByRole("region", { name: "Checked recorded CPU observations" });
  fireEvent.change(screen.getByLabelText("V22 index file"), { target: { files: [new File(["invalid"], "bad.json")] } });
  expect(screen.queryByRole("region", { name: "Checked recorded CPU observations" })).not.toBeInTheDocument();
  expect(screen.getByText(/Input replaced/)).toBeInTheDocument();
});
it("fences stale asynchronous completion after newer refusal", async () => {
  const r = await adapter.projectLdsRecording(retained()); let finish!: (r: adapter.LdsRecording) => void;
  vi.spyOn(loader, "loadLdsRecording").mockResolvedValue(retained());
  vi.spyOn(adapter, "projectLdsRecording").mockReturnValueOnce(new Promise(resolve => { finish = resolve; })).mockRejectedValueOnce(new Error("new refusal"));
  render(<MemoryRouter><PhysicalLdsRecordingPage /></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: /Original registers/ }));
  await waitFor(() => expect(adapter.projectLdsRecording).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole("button", { name: /Edited registers/ }));
  await screen.findByText(/new refusal/); await act(async () => { finish(r); });
  expect(screen.queryByRole("region", { name: "Checked recorded CPU observations" })).not.toBeInTheDocument();
  expect(screen.getByText(/new refusal/)).toBeInTheDocument();
});
it("aborts the old loader and prevents completion after clear", async () => {
  let captured: AbortSignal | undefined, resolve!: (v: ReturnType<typeof retained>) => void;
  vi.spyOn(loader, "loadLdsRecording").mockImplementation((_id, signal) => { captured = signal; return new Promise(r => { resolve = r; }); });
  const spy = vi.spyOn(adapter, "projectLdsRecording");
  render(<MemoryRouter><PhysicalLdsRecordingPage /></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: /Original registers/ }));
  fireEvent.click(screen.getByRole("button", { name: "Clear / cancel" })); expect(captured?.aborted).toBe(true);
  await act(async () => { resolve(retained()); });
  expect(screen.queryByRole("region", { name: "Checked recorded CPU observations" })).not.toBeInTheDocument();
  // Stale loading does not even enter the projection.
  expect(spy).not.toHaveBeenCalled();
});
