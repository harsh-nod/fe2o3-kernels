// Mock transport UI tests only; no real bridge, CPU process, socket or GPU is exercised.
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LiveCpuDebuggerWorkbench } from "../src/components/LiveCpuDebuggerWorkbench";
import { jsonResponse, SyntheticCpuBridge, SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET } from "./fixtures/cpu-debug-bridge";
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function enter(user: ReturnType<typeof userEvent.setup>, endpoint = SYNTHETIC_ENDPOINT, secret = SYNTHETIC_SECRET) {
  await user.type(screen.getByLabelText("Local CPU bridge address"), endpoint);
  await user.type(screen.getByLabelText("Bridge secret"), secret);
}
async function connect(bridge = new SyntheticCpuBridge()) {
  const user = userEvent.setup(); render(<LiveCpuDebuggerWorkbench fetcher={bridge.fetch} />);
  await enter(user); await user.click(screen.getByRole("button", { name: "Connect CPU debugger" }));
  await screen.findByRole("region", { name: "Current validated CPU response" }); return { user, bridge };
}
describe("opt-in live CPU debugger panel", () => {
  it.each(["Breakpoint phase", "Watchpoint access"])("gives %s an exact stable accessible label", label => {
    render(<LiveCpuDebuggerWorkbench fetcher={new SyntheticCpuBridge().fetch} />);
    const control = screen.getByRole("combobox", { name: label });
    expect(screen.getByLabelText(label, { exact: true })).toBe(control);
    expect(control).toBeDisabled();
  });
  it("sends explicitly selected breakpoint phases and watchpoint access modes", async () => {
    const { user, bridge } = await connect();
    for (const [label, value] of [["Function ordinal", "0"], ["Block roster ordinal", "0"], ["Operation ordinal", "0"],
      ["Allocation ordinal", "1"], ["Allocation generation", "0"], ["Allocation byte offset", "0"], ["Memory byte length", "4"]])
      await user.type(screen.getByLabelText(label, { exact: true }), value);
    await user.click(screen.getByRole("button", { name: "Read CPU memory" }));
    await screen.findByRole("region", { name: "Current CPU memory window" });
    await user.selectOptions(screen.getByLabelText("Breakpoint phase", { exact: true }), "after");
    expect(screen.queryByRole("region", { name: "Current validated CPU response" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Set CPU breakpoint" }));
    expect(bridge.calls.at(-1)!.body.command).toBe("break add 0 0 0 after");
    await user.selectOptions(screen.getByLabelText("Watchpoint access", { exact: true }), "read");
    expect(screen.queryByRole("region", { name: "Current validated CPU response" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Set CPU watchpoint" }));
    expect(bridge.calls.at(-1)!.body.command).toBe("watch add 1 0 0 4 read");
  });
  it("does not contact the bridge on opening, and accepts keyboard-only explicit connect", async () => {
    const bridge = new SyntheticCpuBridge(), user = userEvent.setup();
    render(<LiveCpuDebuggerWorkbench fetcher={bridge.fetch} />);
    expect(bridge.calls).toHaveLength(0); expect(screen.getByRole("button", { name: "Read CPU memory" })).toBeDisabled();
    expect(screen.getByLabelText("Bridge secret")).toHaveAttribute("type", "password");
    await enter(user); await user.keyboard("{Enter}");
    await screen.findByRole("region", { name: "Current validated CPU response" });
    expect(bridge.calls).toHaveLength(1);
    expect(screen.getByLabelText("Bridge secret")).toHaveValue("");
    expect(screen.getByText(/losslessly re-encoded by the local bridge/)).toBeVisible();
    expect(document.body.textContent).not.toContain(SYNTHETIC_SECRET);
  });
  it("sends real transport commands rather than modifying recorded fixture controls", async () => {
    const { user, bridge } = await connect();
    for (const name of ["Step CPU forward", "Step CPU reverse", "Continue CPU execution", "Read CPU stack"]) {
      await user.click(screen.getByRole("button", { name }));
      await screen.findByRole("region", { name: "Current validated CPU response" });
    }
    expect(bridge.calls.slice(1).map(call => call.body.command)).toEqual(["step 1", "reverse 1", "continue 1024", "stack"]);
    expect(screen.getByText(/Frame depth is not a dynamic activation ID/)).toBeVisible();
    expect(screen.queryByRole("button", { name: /fixture|recorded/i })).not.toBeInTheDocument();
    expect(screen.getByText(/No source body|Source resolves a location only/)).toBeVisible();
  });
  it("uses explicitly entered lossless coordinates for source, break/watch and memory", async () => {
    const { user, bridge } = await connect();
    for (const [label, value] of [["Function ordinal", "9007199254740993"], ["Block roster ordinal", "2"], ["Operation ordinal", "3"]])
      await user.type(screen.getByLabelText(label), value);
    await user.click(screen.getByRole("button", { name: "Resolve CPU source site" }));
    expect(screen.getByLabelText("Lossless CPU protocol response")).toHaveTextContent("9007199254740993");
    await user.click(screen.getByRole("button", { name: "Set CPU breakpoint" }));
    expect(screen.getByText(/backend acknowledged one filter change/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "List CPU breakpoints" }));
    await user.type(screen.getByLabelText("Breakpoint ID to remove"), "9007199254740993");
    await user.click(screen.getByRole("button", { name: "Remove CPU breakpoint" }));
    for (const [label, value] of [["Allocation ordinal", "1"], ["Allocation generation", "0"], ["Allocation byte offset", "0"], ["Memory byte length", "4"]])
      await user.type(screen.getByLabelText(label), value);
    await user.click(screen.getByRole("button", { name: "Read CPU memory" }));
    const memory = screen.getByRole("region", { name: "Current CPU memory window" });
    expect(within(memory).getByText("0xa5a5a5a5")).toBeVisible(); expect(within(memory).getByText("0x0f")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Set CPU watchpoint" }));
    await user.click(screen.getByRole("button", { name: "List CPU watchpoints" }));
    await user.type(screen.getByLabelText("Watchpoint ID to remove"), "18446744073709551615");
    await user.click(screen.getByRole("button", { name: "Remove CPU watchpoint" }));
    expect(bridge.calls.map(call => call.body.command)).toContain("watch remove 18446744073709551615");
    expect(bridge.calls.map(call => call.body.command)).toContain("break remove 9007199254740993");
  });
  it("clears old memory while pending and keeps backend unavailability explicit", async () => {
    const bridge = new SyntheticCpuBridge(); let release!: () => void; let hold = false;
    const held = new Promise<void>(resolve => { release = resolve; });
    const user = userEvent.setup();
    render(<LiveCpuDebuggerWorkbench fetcher={async (url, init) => {
      const response = await bridge.fetch(url, init); if (hold && url.endsWith("/v1/command")) await held; return response;
    }} />);
    await enter(user); await user.click(screen.getByRole("button", { name: "Connect CPU debugger" }));
    await screen.findByRole("region", { name: "Current validated CPU response" });
    for (const [label, value] of [["Allocation ordinal", "1"], ["Allocation generation", "0"],
      ["Allocation byte offset", "0"], ["Memory byte length", "4"]])
      await user.type(screen.getByLabelText(label), value);
    await user.click(screen.getByRole("button", { name: "Read CPU memory" }));
    await screen.findByRole("region", { name: "Current CPU memory window" });
    hold = true; bridge.refusal = true;
    await user.click(screen.getByRole("button", { name: "Read CPU stack" }));
    expect(screen.queryByRole("region", { name: "Current validated CPU response" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Current CPU memory window" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Step CPU forward" })).toBeDisabled();
    release(); await screen.findByRole("region", { name: "Current validated CPU response" });
    expect(screen.getByText(/backend returned unavailable/)).toBeVisible();
    expect(screen.queryByRole("region", { name: "Current CPU memory window" })).not.toBeInTheDocument();
  });
  it("retains the old cleanup endpoint/token after replacement and permits fresh connect only after cleanup", async () => {
    const { user, bridge } = await connect();
    await user.clear(screen.getByLabelText("Local CPU bridge address"));
    await user.type(screen.getByLabelText("Local CPU bridge address"), "http://127.0.0.1:48762");
    await user.type(screen.getByLabelText("Bridge secret"), "f".repeat(64));
    expect(screen.queryByRole("region", { name: "Current validated CPU response" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect CPU debugger" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Read CPU stack" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Disconnect CPU debugger" }));
    await waitFor(() => expect(within(screen.getByRole("region", { name: "Live local CPU debugger" })).getByRole("status")).toHaveTextContent("bridge confirmed cleanup"));
    const cleanupCall = bridge.calls.at(-1)!;
    expect(cleanupCall.url).toBe(SYNTHETIC_ENDPOINT + "/v1/disconnect");
    expect(new Headers(cleanupCall.init.headers).get("X-Fe2o3-Bridge-Token")).toBe(SYNTHETIC_SECRET);
    expect(screen.getByRole("button", { name: "Connect CPU debugger" })).toBeEnabled();
    expect(screen.getByLabelText("Local CPU bridge address")).toHaveFocus();
    await user.type(screen.getByLabelText("Bridge secret"), "f".repeat(64));
    await user.click(screen.getByRole("button", { name: "Connect CPU debugger" }));
    await screen.findByRole("region", { name: "Current validated CPU response" });
    expect(bridge.calls.at(-1)!.url).toBe("http://127.0.0.1:48762/v1/connect");
  });
  it("discards a late connect after Disconnect instead of restoring the old session", async () => {
    const bridge = new SyntheticCpuBridge(); let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; }), user = userEvent.setup();
    render(<LiveCpuDebuggerWorkbench fetcher={async (url, init) => {
      const response = await bridge.fetch(url, init); if (url.endsWith("/v1/connect")) await held; return response;
    }} />);
    await enter(user); await user.click(screen.getByRole("button", { name: "Connect CPU debugger" }));
    await user.click(screen.getByRole("button", { name: "Disconnect CPU debugger" }));
    await waitFor(() => expect(within(screen.getByRole("region", { name: "Live local CPU debugger" })).getByRole("status")).toHaveTextContent("bridge confirmed cleanup"));
    release(); await Promise.resolve();
    expect(screen.queryByRole("region", { name: "Current validated CPU response" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Read CPU memory" })).toBeDisabled();
  });
  it("does not persist or log the secret and clears views on malformed replies", async () => {
    const storage = vi.spyOn(Storage.prototype, "setItem"), log = vi.spyOn(console, "log"), error = vi.spyOn(console, "error");
    const bridge = new SyntheticCpuBridge(), user = userEvent.setup();
    render(<LiveCpuDebuggerWorkbench fetcher={async (url, init) =>
      url.endsWith("/v1/command") ? jsonResponse("{}") : bridge.fetch(url, init)} />);
    await enter(user); await user.click(screen.getByRole("button", { name: "Connect CPU debugger" }));
    await screen.findByRole("region", { name: "Current validated CPU response" });
    await user.click(screen.getByRole("button", { name: "Read CPU state" }));
    await waitFor(() => expect(within(screen.getByRole("region", { name: "Live local CPU debugger" })).getByRole("status")).toHaveTextContent("outcome may be unknown"));
    expect(screen.queryByRole("region", { name: "Current validated CPU response" })).not.toBeInTheDocument();
    expect(storage).not.toHaveBeenCalled();
    expect(JSON.stringify([...log.mock.calls, ...error.mock.calls])).not.toContain(SYNTHETIC_SECRET);
    expect(window.location.href).not.toContain(SYNTHETIC_SECRET);
    expect(screen.getByRole("button", { name: "Connect CPU debugger" })).toBeDisabled();
  });
});
