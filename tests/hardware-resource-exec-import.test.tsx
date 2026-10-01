import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HistoricalHardwareResources } from "../src/components/HistoricalHardwareResources";
import * as reader from "../src/content/hardware-resource-file";
import * as hashing from "../src/content/ordered-program-observation.mjs";
import { hardwareCaptureJson as json, hardwareId as id, syntheticHardwareCapture as capture,
  syntheticHardwareUnavailable as unavailable } from "./fixtures/synthetic-hardware-resource-capture";

function mask(bits: string) {
  const value = capture(); value.result.projection.registers.registers[1].value.value!.bits = bits; return value;
}
const input = () => screen.getByLabelText("Historical hardware capture (local JSON)");
async function start(user: ReturnType<typeof userEvent.setup>, name = "synthetic-exec.json") {
  await user.upload(input(), new File(["synthetic"], name, { type: "application/json" }));
  await user.click(screen.getByRole("button", { name: "Import historical hardware capture" }));
}
beforeEach(() => {
  vi.spyOn(reader, "readHardwareResourceFile").mockResolvedValue(json(mask("8000000000000001")));
  vi.spyOn(hashing, "programSha256").mockResolvedValue("1".repeat(64));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("synthetic historical EXEC presentation — no GPU or live request", () => {
  it("renders 64 accessible passive bits in exact low-to-high order with untrusted limits", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const diagnostics = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup(); render(<HistoricalHardwareResources />); await start(user);
    const region = await screen.findByRole("region", { name: "Historical reported EXEC mask" });
    const list = within(region).getByRole("list", { name: "Historical reported EXEC bits" });
    const cells = within(list).getAllByRole("listitem"); expect(cells).toHaveLength(64);
    expect(cells[0]).toHaveAccessibleName("Lane 0: EXEC bit set (1)");
    expect(cells[1]).toHaveAccessibleName("Lane 1: EXEC bit clear (0)");
    expect(cells[63]).toHaveAccessibleName("Lane 63: EXEC bit set (1)");
    expect(within(region).getByText("0x8000000000000001")).toBeInTheDocument();
    expect(within(region).getByText(/2 of 64 EXEC bits set/u)).toBeInTheDocument();
    expect(within(region).getByText(/Historical EXEC claim \/ caller-supplied \/ untrusted/u)).toBeInTheDocument();
    expect(within(region).getByText(/VGPR values, LDS samples, source\/PC mapping or gfx950 support/u)).toBeInTheDocument();
    expect(within(list).queryByRole("button")).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    expect(diagnostics).not.toHaveBeenCalled();
  });
  it("renders all-zero reported data as 64 disabled bits, not unavailable", async () => {
    vi.mocked(reader.readHardwareResourceFile).mockResolvedValue(json(mask("0000000000000000")));
    const user = userEvent.setup(); render(<HistoricalHardwareResources />); await start(user);
    const list = await screen.findByRole("list", { name: "Historical reported EXEC bits" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(64);
    expect(list.querySelectorAll('[data-enabled="true"]')).toHaveLength(0);
    expect(screen.queryByText(/EXEC bit view unavailable/u)).not.toBeInTheDocument();
  });
  it.each(["missing", "unavailable", "ambiguous"])("withholds bit cells for %s EXEC while keeping checked register rows", async kind => {
    const value = capture(), rows = value.result.projection.registers.registers;
    if (kind === "missing") rows[1].name = "vcc";
    if (kind === "unavailable") rows[1].value = {
      status: "unavailable", reason: "not_captured", truth: { origin: "unavailable", evidence: [] },
    };
    if (kind === "ambiguous") { const other = structuredClone(rows[1]); other.register_identity = id(9000); rows.push(other); }
    vi.mocked(reader.readHardwareResourceFile).mockResolvedValue(json(value));
    const user = userEvent.setup(); render(<HistoricalHardwareResources />); await start(user);
    await screen.findByText(/EXEC bit view unavailable/u);
    expect(screen.queryByRole("list", { name: "Historical reported EXEC bits" })).not.toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Historical hardware register values" })).toBeInTheDocument();
  });
  it("does not display an EXEC panel for an unavailable overall capture", async () => {
    vi.mocked(reader.readHardwareResourceFile).mockResolvedValue(json(unavailable()));
    const user = userEvent.setup(); render(<HistoricalHardwareResources />); await start(user);
    await screen.findByText(/Historical capture unavailable/u);
    expect(screen.queryByRole("region", { name: "Historical reported EXEC mask" })).not.toBeInTheDocument();
  });
  it("clears the prior mask on replacement and retains no bits after malformed replacement", async () => {
    const user = userEvent.setup(); render(<HistoricalHardwareResources />); await start(user);
    await screen.findByRole("list", { name: "Historical reported EXEC bits" });
    vi.mocked(reader.readHardwareResourceFile).mockResolvedValue("{}\n");
    await user.upload(input(), new File(["synthetic"], "invalid.json", { type: "application/json" }));
    expect(screen.queryByRole("region", { name: "Historical reported EXEC mask" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Import historical hardware capture" }));
    await screen.findByRole("alert");
    expect(screen.queryByRole("list", { name: "Historical reported EXEC bits" })).not.toBeInTheDocument();
  });
  it("does not restore an earlier mask when its delayed digest resolves after a replacement", async () => {
    let finish!: (digest: string) => void;
    vi.mocked(hashing.programSha256).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
      .mockResolvedValueOnce("2".repeat(64));
    const user = userEvent.setup(); render(<HistoricalHardwareResources />); await start(user, "old.json");
    vi.mocked(reader.readHardwareResourceFile).mockResolvedValue(json(mask("0000000000000000")));
    await start(user, "new.json"); await screen.findByRole("list", { name: "Historical reported EXEC bits" });
    await act(async () => { finish("3".repeat(64)); });
    const list = screen.getByRole("list", { name: "Historical reported EXEC bits" });
    expect(list.querySelectorAll('[data-enabled="true"]')).toHaveLength(0);
    expect(screen.queryByText("3".repeat(64))).not.toBeInTheDocument();
  });
  it("cancellation prevents a pending bit result from appearing", async () => {
    let finish!: (raw: string) => void;
    vi.mocked(reader.readHardwareResourceFile).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const user = userEvent.setup(); render(<HistoricalHardwareResources />); await start(user);
    await user.click(screen.getByRole("button", { name: "Cancel historical import" }));
    await act(async () => { finish(json(capture())); });
    expect(screen.queryByRole("region", { name: "Historical reported EXEC mask" })).not.toBeInTheDocument();
    expect(hashing.programSha256).not.toHaveBeenCalled();
  });
  it("reset removes the exact mask and clears the file selection", async () => {
    const user = userEvent.setup(); render(<HistoricalHardwareResources />); await start(user);
    await screen.findByRole("list", { name: "Historical reported EXEC bits" });
    await user.click(screen.getByRole("button", { name: "Reset historical hardware import" }));
    expect(screen.queryByRole("region", { name: "Historical reported EXEC mask" })).not.toBeInTheDocument();
    expect(input()).toHaveValue("");
  });
});
