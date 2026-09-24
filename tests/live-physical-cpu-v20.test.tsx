// @vitest-environment jsdom
// Synthetic HTTP around retained CLI fields; no process, listener or native qualification.
import { webcrypto } from "node:crypto";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LivePhysicalCpuDebugV20 } from "../src/components/LivePhysicalCpuDebugV20";
import { SyntheticPhysicalBridgeV20, PHYSICAL_URL, PHYSICAL_SECRET, lossless } from "./fixtures/physical-cpu-v20";
import { parseProgramJson } from "../src/content/ordered-program-observation.mjs";
import type { Row } from "../src/content/physical-entry-debug-v20-shapes";
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function enter(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("V20 bridge endpoint"), PHYSICAL_URL);
  await user.type(screen.getByLabelText("V20 bridge token"), PHYSICAL_SECRET);
  await user.click(screen.getByRole("checkbox", { name: /I selected the local diagnostic-kir-v20/ }));
}
async function connect(bridge = new SyntheticPhysicalBridgeV20()) {
  const user = userEvent.setup(); render(<LivePhysicalCpuDebugV20 fetcher={bridge.fetch} />);
  await enter(user); await user.click(screen.getByRole("button", { name: "Connect V20 CPU bridge" }));
  await screen.findByRole("region", { name: "Current V20 live CPU observation" }); return { user, bridge };
}
async function select(user: ReturnType<typeof userEvent.setup>) {
  const field = screen.getByLabelText("V20 event cursor"); await user.clear(field); await user.type(field, "2181");
  await user.click(screen.getByRole("button", { name: "Seek V20 observation" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Read V20 SSA values" })).toBeEnabled());
}
it("opens without network traffic, requires explicit profile and labels keyboard controls", async () => {
  const bridge = new SyntheticPhysicalBridgeV20(), user = userEvent.setup();
  render(<LivePhysicalCpuDebugV20 fetcher={bridge.fetch} />);
  expect(bridge.calls).toHaveLength(0);
  expect(screen.getByRole("button", { name: "Connect V20 CPU bridge" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Read V20 output bytes" })).toBeDisabled();
  expect(screen.getByLabelText("V20 bridge token")).toHaveAttribute("type", "password");
  await enter(user);
  screen.getByRole("button", { name: "Connect V20 CPU bridge" }).focus(); await user.keyboard("{Enter}");
  await screen.findByRole("region", { name: "Current V20 live CPU observation" });
  expect(bridge.calls).toHaveLength(1); expect(screen.getByLabelText("V20 bridge token")).toHaveValue("");
  expect(document.body.textContent).not.toContain(PHYSICAL_SECRET);
});
it("renders actual symbolic unavailability and current logical page without register claims", async () => {
  const { user } = await connect(); await select(user);
  const page = screen.getByLabelText("V20 SSA page size"); await user.clear(page); await user.type(page, "64");
  await user.click(screen.getByRole("button", { name: "Read V20 SSA values" }));
  await screen.findByRole("table", { name: "Selected checkpoint SSA values" });
  expect(screen.getAllByText("not_represented").length).toBeGreaterThan(0);
  expect(screen.getByText(/Resident mask.*is not authored physical EXEC/)).toBeVisible();
  expect(screen.getByRole("button", { name: "Next V20 SSA page" })).toBeDisabled();
});
it("shows exact current output bytes/init and replaces them with unavailable instead of stale memory", async () => {
  const { user } = await connect(); await select(user);
  const count = screen.getByLabelText("V20 output byte count"); await user.clear(count); await user.type(count, "4");
  await user.click(screen.getByRole("button", { name: "Read V20 output bytes" }));
  const table = await screen.findByRole("table", { name: "Current V20 output bytes" });
  expect(within(table).getAllByText("Initialized observed byte")).toHaveLength(4);
  const offset = screen.getByLabelText("V20 output byte offset"); await user.clear(offset); await user.type(offset, "99999");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Read V20 output bytes" }));
  await screen.findByText(/CPU query unavailable: outside_capture_scope/);
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Read V20 SSA values" })).toBeDisabled();
});
it("keeps empty SSA pages explicit in a deliberately synthetic test response", async () => {
  const bridge = new SyntheticPhysicalBridgeV20(), { user } = await connect(bridge); await select(user);
  bridge.mutate = outer => {
    const value = parseProgramJson(String(outer.response_json), 65536) as Row;
    const result = value.result as Row; result.values = []; delete result.next_cursor; outer.response_json = lossless(value);
  };
  await user.click(screen.getByRole("button", { name: "Read V20 SSA values" }));
  await screen.findByText(/No value rows were retained at this checkpoint/);
  expect(screen.getByRole("button", { name: "Next V20 SSA page" })).toBeDisabled();
});
it("drops prior values on input replacement while cleanup still targets captured endpoint", async () => {
  const { user, bridge } = await connect(); await select(user);
  await user.click(screen.getByRole("button", { name: "Read V20 SSA values" }));
  await screen.findByRole("table", { name: "Selected checkpoint SSA values" });
  await user.type(screen.getByLabelText("V20 bridge endpoint"), "0");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Connect V20 CPU bridge" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Disconnect V20 CPU bridge" }));
  await screen.findByText("Disconnected after owned bridge cleanup.");
  expect(bridge.calls.at(-1)?.url).toBe(PHYSICAL_URL + "/v1/disconnect");
});
it("clears pending rows and discards a delayed response after connection invalidation", async () => {
  const bridge = new SyntheticPhysicalBridgeV20(); let hold = false, release!: () => void;
  const delayed = new Promise<void>(resolve => { release = resolve; });
  const user = userEvent.setup(); render(<LivePhysicalCpuDebugV20 fetcher={async (url, init) => {
    const response = await bridge.fetch(url, init); if (hold && url.endsWith("/v1/command")) await delayed; return response;
  }} />);
  await enter(user); await user.click(screen.getByRole("button", { name: "Connect V20 CPU bridge" }));
  await screen.findByRole("region", { name: "Current V20 live CPU observation" }); await select(user);
  hold = true; await user.click(screen.getByRole("button", { name: "Read V20 SSA values" }));
  expect(screen.queryByRole("region", { name: "Current V20 live CPU observation" })).not.toBeInTheDocument();
  await user.type(screen.getByLabelText("V20 bridge endpoint"), "0");
  await act(async () => release());
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Read V20 SSA values" })).toBeDisabled();
  expect(screen.getByText(/Disconnect the captured old connection/)).toBeVisible();
});
it("unknown transport outcomes are visible and no automatic retry is made", async () => {
  const { user, bridge } = await connect(); await select(user);
  bridge.mutate = row => { row.sequence = "999"; };
  const calls = bridge.calls.length;
  await user.click(screen.getByRole("button", { name: "Read V20 state" }));
  await screen.findByText(/V20 query outcome unknown/);
  expect(bridge.calls).toHaveLength(calls + 1);
  expect(screen.getByRole("button", { name: "Read V20 state" })).toBeDisabled();
  expect(screen.queryByRole("region", { name: "Current V20 live CPU observation" })).not.toBeInTheDocument();
});
