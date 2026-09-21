import { webcrypto } from "node:crypto";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RecordedResourceImport } from "../src/components/RecordedResourceImport";
import { ResourceMemoryView } from "../src/components/ResourceMemoryView";
import { importResourceRecording } from "../src/content/recorded-resource-import";
import { projectResourcePointerMemoryNavigation } from "../src/content/resource-pointer-memory-navigation";
import { retainedResourceExcerpt, mutateResourceLine, type MutableResourceControl } from "./fixtures/recorded-resource-import";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());
const input = retainedResourceExcerpt();
const file = (text: string, name: string) => new File([text], name, { type: "application/x-ndjson" });
const pointerName = "Show retained byte for SSA %12, function 0, frame 1";
async function importView(streams = input) {
  const user = userEvent.setup(); render(<RecordedResourceImport />);
  await user.upload(screen.getByLabelText("Requests JSONL"), file(streams.requests, "requests.jsonl"));
  await user.upload(screen.getByLabelText("Responses JSONL"), file(streams.responses, "responses.jsonl"));
  await user.click(screen.getByRole("button", { name: "Import local recording" }));
  await screen.findByRole("region", { name: "Imported checkpoint SSA and source" });
  return user;
}
const cells = () => screen.getByRole("group", { name: "Captured memory cells" });
const byte = (offset: number) => within(cells()).getByRole("button", { name: new RegExp(`^Byte offset ${offset},`, "u") });

it("links an actual SSA pointer to retained storage, supports keyboard activation and repeated explicit navigation", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const user = await importView();
  await user.click(byte(5)); expect(byte(5)).toHaveAttribute("aria-pressed", "true");
  const action = screen.getByRole("button", { name: pointerName }); action.focus(); await user.keyboard("{Enter}");
  const navigation = screen.getByRole("region", { name: "Pointer retained-memory navigation" });
  expect(navigation).toHaveAttribute("data-state", "ready");
  expect(navigation).toHaveTextContent("Retained request 11, allocation 1:g0, byte offset 0");
  expect(navigation).toHaveTextContent("Caller-supplied / unverified");
  expect(byte(0)).toHaveAttribute("aria-pressed", "true"); expect(byte(0)).toHaveFocus();
  await user.keyboard("{ArrowRight}"); expect(byte(1)).toHaveFocus(); expect(byte(1)).toHaveAttribute("aria-pressed", "true");
  await user.click(action); expect(byte(0)).toHaveFocus(); expect(byte(0)).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("table", { name: "Selected memory cell details" })).toHaveTextContent("0xd5");
  await user.selectOptions(screen.getByRole("combobox", { name: "Memory cell size" }), "4");
  expect(screen.getByRole("combobox", { name: "Memory cell size" })).toHaveFocus();
  expect(within(cells()).getAllByRole("button")).toHaveLength(6);
  const inspector = screen.getByRole("region", { name: "Selected dword interpretation" });
  await user.selectOptions(within(inspector).getByRole("combobox", { name: "Value interpretation" }), "u32");
  await user.selectOptions(within(inspector).getByRole("combobox", { name: "Interpretation byte order" }), "little");
  expect(within(inspector).getByLabelText("Interpreted scalar")).toHaveTextContent(/^469$/u);
  await user.click(action);
  const resetInspector = screen.getByRole("region", { name: "Selected dword interpretation" });
  expect(within(resetInspector).getByRole("combobox", { name: "Value interpretation" })).toHaveValue("raw");
  expect(within(resetInspector).getByRole("combobox", { name: "Interpretation byte order" })).toHaveValue("unknown");
  expect(within(resetInspector).queryByLabelText("Interpreted scalar")).not.toBeInTheDocument();
  expect(byte(0)).toHaveFocus();
  expect(fetch).not.toHaveBeenCalled();
});

it("clears pointer selection on manual windows, checkpoint changes, import replacement and reset", async () => {
  const user = await importView();
  await user.click(screen.getByRole("button", { name: pointerName }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Recorded memory window" }), "0");
  expect(screen.queryByRole("region", { name: "Pointer retained-memory navigation" })).not.toBeInTheDocument();
  for (const [index, request] of [[1, 15], [2, 21]]) {
    await user.click(screen.getByRole("button", { name: pointerName }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Imported checkpoint" }), String(index));
    expect(screen.queryByRole("region", { name: "Pointer retained-memory navigation" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: pointerName }));
    expect(screen.getByRole("region", { name: "Pointer retained-memory navigation" })).toHaveTextContent(`Retained request ${request},`);
  }
  await user.upload(screen.getByLabelText("Responses JSONL"), file(input.responses, "replacement-same-bytes.jsonl"));
  expect(screen.queryByRole("region", { name: "Pointer retained-memory navigation" })).not.toBeInTheDocument();
  expect(screen.queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Import local recording" }));
  await screen.findByRole("button", { name: pointerName });
  expect(screen.queryByRole("region", { name: "Pointer retained-memory navigation" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: pointerName }));
  await user.click(screen.getByRole("button", { name: "Reset local recording" }));
  expect(screen.queryByRole("region", { name: "Pointer retained-memory navigation" })).not.toBeInTheDocument();
});

it("synthetic outside-coverage control hides old bytes until the pointer choice is cleared", async () => {
  const responses = mutateResourceLine(input.responses, 6, row => {
    row.result.snapshot.snapshot.values.find((value: MutableResourceControl) => value.path.root.value_ordinal === 12).availability.value.byte_offset = 24;
  });
  const user = await importView({ ...input, responses });
  expect(cells()).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: pointerName }));
  expect(screen.getByRole("region", { name: "Pointer retained-memory navigation" })).toHaveAttribute("data-state", "unavailable");
  expect(screen.queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Clear pointer selection" }));
  expect(cells()).toBeInTheDocument();
});

it("synthetic multiple-window control requires an exact request choice and never defaults to the first", async () => {
  function duplicate(raw: string) {
    return raw.trimEnd().split("\n").flatMap(line => {
      const value = JSON.parse(line);
      return value.request_id === 11 ? [line, JSON.stringify({ ...value, request_id: 12 })] : [line];
    }).join("\n") + "\n";
  }
  const user = await importView({ requests: duplicate(input.requests), responses: duplicate(input.responses) });
  await user.click(screen.getByRole("button", { name: pointerName }));
  expect(screen.getByRole("region", { name: "Pointer retained-memory navigation" })).toHaveAttribute("data-state", "ambiguous");
  expect(screen.queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Use retained request 12" }));
  expect(screen.getByRole("combobox", { name: "Recorded memory window" })).toHaveValue("1");
  expect(byte(0)).toHaveFocus();
  expect(screen.getByRole("region", { name: "Pointer retained-memory navigation" })).toHaveTextContent("Retained request 12,");
});

async function componentInput() {
  const recording = await importResourceRecording(input.requests, input.responses), checkpoint = recording.checkpoints[0];
  const result = projectResourcePointerMemoryNavigation(recording, checkpoint, "0:1:12", 1);
  if (result.status !== "ready") throw new Error(result.detail);
  return { response: checkpoint.memories[0].response, expectedSnapshot: checkpoint.anchor,
    navigationFocus: result.focus, memoryContext: recording.context };
}

it.each([255, 256, 257])("synthetic viewport control synchronously selects byte %i and preserves subsequent keyboard control", async offset => {
  const props = await componentInput(), response = structuredClone(props.response) as MutableResourceControl;
  response.result.memory.requested_bytes = 512; response.result.memory.returned_bytes = 512;
  response.result.memory.availability = { status: "captured", address_space: "global", bytes: "0x" + "a5".repeat(512), initialized: "0x" + "00".repeat(64), truncated: false };
  const focus = { ...props.navigationFocus, byteOffset: String(offset), memoryKey: JSON.stringify(response.result.memory) };
  render(<ResourceMemoryView {...props} response={response} navigationFocus={focus} />);
  expect(within(cells()).getAllByRole("button")).toHaveLength(256);
  expect(byte(offset)).toHaveAttribute("aria-pressed", "true"); expect(byte(offset)).toHaveFocus();
  expect(screen.getByRole("table", { name: "Selected memory cell details" })).toHaveTextContent("Uninitialized · not a program value");
  const user = userEvent.setup(); await user.keyboard("{ArrowLeft}");
  expect(byte(offset === 256 ? 256 : offset - 1)).toHaveFocus();
});

it.each(["bytes", "initialization", "context", "missing-context", "outside", "malformed"])("renderer removes all old cells when %s changes under the same IDs", async kind => {
  const props = await componentInput(), { rerender } = render(<ResourceMemoryView {...props} />);
  expect(byte(0)).toHaveFocus();
  const response = structuredClone(props.response) as MutableResourceControl;
  let context = props.memoryContext;
  let focus = props.navigationFocus;
  if (kind === "bytes") response.result.memory.availability.bytes = "0xff" + response.result.memory.availability.bytes.slice(4);
  if (kind === "initialization") response.result.memory.availability.initialized = "0x000000";
  if (kind === "context") context = { ...context, target: "gfx942" };
  if (kind === "outside") focus = { ...focus, byteOffset: "24" };
  if (kind === "malformed") focus = { ...focus, byteOffset: "01" };
  rerender(<ResourceMemoryView {...props} response={response} navigationFocus={focus} memoryContext={kind === "missing-context" ? undefined : context} />);
  expect(screen.queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
  expect(screen.queryByRole("table", { name: "Selected memory cell details" })).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("no previous byte selection is retained");
});
