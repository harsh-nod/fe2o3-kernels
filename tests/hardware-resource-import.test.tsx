import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HistoricalHardwareResources } from "../src/components/HistoricalHardwareResources";
import * as reader from "../src/content/hardware-resource-file";
import * as hashing from "../src/content/ordered-program-observation.mjs";
import { hardwareCaptureJson as json, syntheticHardwareCapture as capture,
  syntheticHardwareUnavailable as unavailable } from "./fixtures/synthetic-hardware-resource-capture";

const selected = (name = "synthetic-hardware.json") => new File(["synthetic"], name, { type: "application/json" });
const input = () => screen.getByLabelText("Historical hardware capture (local JSON)");
async function start(user: ReturnType<typeof userEvent.setup>, name?: string) {
  await user.upload(input(), selected(name));
  await user.click(screen.getByRole("button", { name: "Import historical hardware capture" }));
}
beforeEach(() => {
  vi.spyOn(reader, "readHardwareResourceFile").mockResolvedValue(json(capture()));
  vi.spyOn(hashing, "programSha256").mockResolvedValue("1".repeat(64));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("synthetic historical hardware importer — no native capture", () => {
  it("requires an explicit local import and does not fetch on mount or selection", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup(); render(<HistoricalHardwareResources />);
    await user.upload(input(), selected());
    expect(reader.readHardwareResourceFile).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Import historical hardware capture" }));
    const table = await screen.findByRole("table", { name: "Historical hardware register values" });
    expect(table.querySelectorAll("tbody tr")).toHaveLength(4);
    expect(within(table).getByText("0xffffffffffffffff")).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: /^Redacted\s*redacted\s*absolute_target_location$/u })).toBeInTheDocument();
    expect(screen.getByText(/Historical \/ caller-supplied \/ untrusted/u)).toBeInTheDocument();
    expect(screen.getByText(/not prove a hardware observation/u)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("paginates the entire checked roster locally and clears register selection", async () => {
    vi.mocked(reader.readHardwareResourceFile).mockResolvedValue(json(capture(70)));
    const user = userEvent.setup(); render(<HistoricalHardwareResources />); await start(user);
    const table = await screen.findByRole("table", { name: "Historical hardware register values" });
    expect(table.querySelectorAll("tbody tr")).toHaveLength(64);
    await user.click(screen.getByRole("button", { name: "Inspect register s4" }));
    expect(screen.getByRole("region", { name: "Selected historical register" })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "Historical register page" }), "1");
    expect(table.querySelectorAll("tbody tr")).toHaveLength(6);
    expect(screen.queryByRole("region", { name: "Selected historical register" })).not.toBeInTheDocument();
  });
  it("clears prior rows immediately when a replacement file is chosen, including invalid replacements", async () => {
    const user = userEvent.setup(); render(<HistoricalHardwareResources />); await start(user);
    await screen.findByRole("table");
    await user.click(screen.getByRole("button", { name: "Inspect register s4" }));
    vi.mocked(reader.readHardwareResourceFile).mockResolvedValue("{}\n");
    await user.upload(input(), selected("synthetic-invalid.json"));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Import historical hardware capture" }));
    await screen.findByRole("alert");
    expect(screen.queryByRole("region", { name: "Historical target and stop binding" })).not.toBeInTheDocument();
  });
  it("displays native unavailability without manufacturing a target or register table", async () => {
    vi.mocked(reader.readHardwareResourceFile).mockResolvedValue(json(unavailable()));
    const user = userEvent.setup(); render(<HistoricalHardwareResources />); await start(user);
    await screen.findByText(/Historical capture unavailable: native_capture \/ rocgdb_spawn_failed/u);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Historical target and stop binding" })).not.toBeInTheDocument();
  });
  it("refuses stale internal stop joins without retaining the preceding data", async () => {
    const wrong = capture(); wrong.result.projection.registers.scope.stop_identity = "9".repeat(64);
    vi.mocked(reader.readHardwareResourceFile).mockResolvedValue(json(wrong));
    const user = userEvent.setup(); render(<HistoricalHardwareResources />); await start(user);
    await screen.findByRole("alert"); expect(hashing.programSha256).not.toHaveBeenCalled();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
  it("aborts and discards a late earlier file read", async () => {
    let finish!: (raw: string) => void; let signal!: AbortSignal;
    vi.mocked(reader.readHardwareResourceFile).mockImplementationOnce((_file, supplied) => {
      signal = supplied; return new Promise(resolve => { finish = resolve; });
    });
    const user = userEvent.setup(); render(<HistoricalHardwareResources />); await start(user, "synthetic-old.json");
    await start(user, "synthetic-new.json"); await screen.findByRole("table");
    await act(async () => { finish("{}\n"); });
    expect(signal.aborted).toBe(true); expect(hashing.programSha256).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("discards late digest completion after a newer file has been imported", async () => {
    let finish!: (digest: string) => void;
    vi.mocked(hashing.programSha256).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
      .mockResolvedValueOnce("2".repeat(64));
    const user = userEvent.setup(); render(<HistoricalHardwareResources />); await start(user, "synthetic-old.json");
    await start(user, "synthetic-new.json"); await screen.findByRole("table");
    await act(async () => { finish("3".repeat(64)); });
    expect(screen.getByText("2".repeat(64))).toBeInTheDocument();
    expect(screen.queryByText("3".repeat(64))).not.toBeInTheDocument();
  });
  it("cancel aborts the pending read and prevents a late result", async () => {
    let finish!: (raw: string) => void; let signal!: AbortSignal;
    vi.mocked(reader.readHardwareResourceFile).mockImplementationOnce((_file, supplied) => {
      signal = supplied; return new Promise(resolve => { finish = resolve; });
    });
    const user = userEvent.setup(); render(<HistoricalHardwareResources />); await start(user);
    await user.click(screen.getByRole("button", { name: "Cancel historical import" }));
    await act(async () => { finish(json(capture())); });
    expect(signal.aborted).toBe(true); expect(hashing.programSha256).not.toHaveBeenCalled();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
  it("unmount aborts pending work without accepting its later completion", async () => {
    let finish!: (raw: string) => void; let signal!: AbortSignal;
    vi.mocked(reader.readHardwareResourceFile).mockImplementationOnce((_file, supplied) => {
      signal = supplied; return new Promise(resolve => { finish = resolve; });
    });
    const user = userEvent.setup(), mounted = render(<HistoricalHardwareResources />); await start(user);
    mounted.unmount(); await act(async () => { finish(json(capture())); });
    expect(signal.aborted).toBe(true); expect(hashing.programSha256).not.toHaveBeenCalled();
  });
  it("reset clears local file selection, report and selected register", async () => {
    const user = userEvent.setup(); render(<HistoricalHardwareResources />); await start(user);
    await screen.findByRole("table"); await user.click(screen.getByRole("button", { name: "Inspect register s4" }));
    await user.click(screen.getByRole("button", { name: "Reset historical hardware import" }));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(input()).toHaveValue("");
    expect(screen.getByRole("button", { name: "Import historical hardware capture" })).toBeDisabled();
  });
  it("does not reflect arbitrary file-read exception contents", async () => {
    vi.mocked(reader.readHardwareResourceFile).mockRejectedValue(new Error("private path or bearer token"));
    const user = userEvent.setup(); render(<HistoricalHardwareResources />); await start(user);
    await screen.findByRole("alert");
    expect(screen.queryByText(/private path or bearer token/u)).not.toBeInTheDocument();
  });
});
