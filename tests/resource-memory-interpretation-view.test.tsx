import { webcrypto } from "node:crypto";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import retained from "../examples/debugger_workbench_v1.json";
import { ResourceMemoryView } from "../src/components/ResourceMemoryView";
import { ResourceMemoryInterpretationView } from "../src/components/ResourceMemoryInterpretationView";
import { projectResourceMemoryResponse } from "../src/content/resource-memory-view";
import { comparisonWindow, recordedComparison } from "./fixtures/resource-memory-comparison";
import type { MutableResourceControl } from "./fixtures/recorded-resource-import";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());
const panel = () => screen.getByRole("region", { name: "Selected dword interpretation" });
const state = () => within(panel()).getByLabelText("Memory interpretation status");
async function choose(format = "u32", order = "little") {
  const user = userEvent.setup();
  await user.selectOptions(screen.getByRole("combobox", { name: "Memory cell size" }), "4");
  await user.selectOptions(within(panel()).getByRole("combobox", { name: "Value interpretation" }), format);
  await user.selectOptions(within(panel()).getByRole("combobox", { name: "Interpretation byte order" }), order);
}
it("starts raw/unknown and requires both explicit choices for actual source-produced 469", async () => {
  const user = userEvent.setup(), recording = await recordedComparison(), { memory, checkpoint } = comparisonWindow(recording, 11);
  render(<ResourceMemoryView response={memory.response} expectedSnapshot={checkpoint.anchor} />);
  expect(within(panel()).getByRole("combobox", { name: "Value interpretation" })).toHaveValue("raw");
  expect(within(panel()).getByRole("combobox", { name: "Interpretation byte order" })).toHaveValue("unknown");
  expect(within(panel()).queryByLabelText("Interpreted scalar")).not.toBeInTheDocument();
  await user.selectOptions(screen.getByRole("combobox", { name: "Memory cell size" }), "4");
  await user.selectOptions(within(panel()).getByRole("combobox", { name: "Value interpretation" }), "u32");
  expect(state()).toHaveAttribute("data-state", "needs-order");
  await user.selectOptions(within(panel()).getByRole("combobox", { name: "Interpretation byte order" }), "little");
  expect(within(panel()).getByLabelText("Interpreted scalar")).toHaveTextContent(/^469$/u);
  expect(panel()).toHaveTextContent("0xd5010000"); expect(panel()).toHaveTextContent("0x000001d5");
  await user.selectOptions(within(panel()).getByRole("combobox", { name: "Interpretation byte order" }), "unknown");
  expect(within(panel()).queryByLabelText("Interpreted scalar")).not.toBeInTheDocument();
});
it("keyboard selection follows current LDS storage but refuses its uninitialized neighbor", async () => {
  const user = userEvent.setup(), recording = await recordedComparison("lds"), { memory, checkpoint } = comparisonWindow(recording, 13);
  render(<ResourceMemoryView response={memory.response} expectedSnapshot={checkpoint.anchor} />);
  await choose(); expect(within(panel()).getByLabelText("Interpreted scalar")).toHaveTextContent(/^2$/u);
  const cells = within(screen.getByRole("group", { name: "Captured memory cells" })).getAllByRole("button");
  cells[0].focus(); await user.keyboard("{ArrowRight}");
  expect(cells[1]).toHaveFocus(); expect(state()).toHaveAttribute("data-state", "uninitialized");
  expect(state()).toHaveTextContent("0/4 selected bytes are initialized");
  expect(within(panel()).queryByLabelText("Interpreted scalar")).not.toBeInTheDocument();
  await user.keyboard("{Home}");
  expect(within(panel()).getByLabelText("Interpreted scalar")).toHaveTextContent(/^2$/u);
});
it("synchronously removes stale values and resets choices at another checkpoint", async () => {
  const recording = await recordedComparison(), first = comparisonWindow(recording, 11), repeated = comparisonWindow(recording, 21);
  const { rerender } = render(<ResourceMemoryView response={first.memory.response} expectedSnapshot={first.checkpoint.anchor} />);
  await choose();
  rerender(<ResourceMemoryView response={first.memory.response} expectedSnapshot={repeated.checkpoint.anchor} />);
  expect(screen.queryByRole("region", { name: "Selected dword interpretation" })).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Interpreted scalar")).not.toBeInTheDocument();
  rerender(<ResourceMemoryView response={repeated.memory.response} expectedSnapshot={repeated.checkpoint.anchor} />);
  expect(within(panel()).getByRole("combobox", { name: "Value interpretation" })).toHaveValue("raw");
  expect(within(panel()).getByRole("combobox", { name: "Interpretation byte order" })).toHaveValue("unknown");
});
it("resets standalone interpretation choices on a changed response/request rather than retaining old state", async () => {
  const response = structuredClone(retained.memory), p = projectResourceMemoryResponse(response, response.result.snapshot);
  if (p.status !== "ready") throw Error("Expected actual memory");
  const selection = { anchorKey: p.anchorKey, requestId: p.requestId, allocation: p.memory.allocation, page: 0, cellBytes: 4 as const, byteOffset: 0 };
  const user = userEvent.setup(), { rerender } = render(<ResourceMemoryInterpretationView projection={p} selection={selection} />);
  await user.selectOptions(within(panel()).getByRole("combobox", { name: "Value interpretation" }), "u32");
  await user.selectOptions(within(panel()).getByRole("combobox", { name: "Interpretation byte order" }), "little");
  expect(within(panel()).getByLabelText("Interpreted scalar")).toHaveTextContent(/^17$/u);
  const next = { ...p, requestId: p.requestId + 1 };
  rerender(<ResourceMemoryInterpretationView projection={next} selection={{ ...selection, requestId: next.requestId }} />);
  expect(within(panel()).getByRole("combobox", { name: "Value interpretation" })).toHaveValue("raw");
  expect(within(panel()).queryByLabelText("Interpreted scalar")).not.toBeInTheDocument();
});
it("preserves negative zero and distinct NaN bits without claiming signaling behavior", async () => {
  const response = structuredClone(retained.memory) as MutableResourceControl;
  response.result.memory.availability.bytes = "0x00000080";
  const { rerender } = render(<ResourceMemoryView response={response} expectedSnapshot={response.result.snapshot} />);
  await choose("f32");
  expect(within(panel()).getByLabelText("Interpreted scalar")).toHaveTextContent(/^-0$/u);
  expect(panel()).toHaveTextContent("negative zero"); expect(panel()).toHaveTextContent("0x80000000");
  response.result.memory.availability.bytes = "0x0100807f";
  rerender(<ResourceMemoryView response={response} expectedSnapshot={response.result.snapshot} />);
  await choose("f32");
  expect(within(panel()).getByLabelText("Interpreted scalar")).toHaveTextContent(/^NaN$/u);
  expect(panel()).toHaveTextContent("0x7f800001"); expect(panel()).toHaveTextContent("does not establish signaling behavior");
});
it("clears the value at a partial final cell without changing viewport or byte caps", async () => {
  const response = structuredClone(retained.memory) as MutableResourceControl;
  Object.assign(response.result.memory, { requested_bytes: 257, returned_bytes: 257,
    availability: { status: "captured", address_space: "global", bytes: "0x" + "00".repeat(257), initialized: "0x" + "ff".repeat(32) + "01", truncated: false } });
  const user = userEvent.setup();
  render(<ResourceMemoryView response={response} expectedSnapshot={response.result.snapshot} />);
  await choose(); expect(within(panel()).getByLabelText("Interpreted scalar")).toHaveTextContent(/^0$/u);
  expect(within(screen.getByRole("group", { name: "Captured memory cells" })).getAllByRole("button")).toHaveLength(64);
  await user.click(screen.getByRole("button", { name: "Next window" }));
  expect(state()).toHaveAttribute("data-state", "needs-dword");
  expect(within(panel()).queryByLabelText("Interpreted scalar")).not.toBeInTheDocument();
  expect(within(screen.getByRole("group", { name: "Captured memory cells" })).getAllByRole("button")).toHaveLength(1);
});
