import { webcrypto } from "node:crypto";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RecordedResourceImport } from "../src/components/RecordedResourceImport";
import { ResourceCheckpointValuesView } from "../src/components/ResourceCheckpointValuesView";
import { importResourceRecording } from "../src/content/recorded-resource-import";
import { retainedResourceExcerpt, RETAINED_RESOURCE_VALUE_IDS, mutateResourceLine } from "./fixtures/recorded-resource-import";

const input = retainedResourceExcerpt(RETAINED_RESOURCE_VALUE_IDS);
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());
const file = (text: string, name: string) => new File([text], name, { type: "application/x-ndjson" });

it("shows actual checkpoint values/source and clears them synchronously when the checkpoint changes", async () => {
  const recording = await importResourceRecording(input.requests, input.responses), user = userEvent.setup();
  const { rerender } = render(<ResourceCheckpointValuesView checkpoint={recording.checkpoints[1]} />);
  const region = screen.getByRole("region", { name: "Imported checkpoint SSA and source" });
  expect(region).toHaveAttribute("data-state", "ready");
  expect(within(region).getByRole("table")).toHaveAccessibleName("Selected checkpoint SSA values");
  expect(within(region).getAllByRole("row")).toHaveLength(19);
  expect(region).toHaveTextContent("0x000001d5"); expect(region).toHaveTextContent("469");
  expect(region).toHaveTextContent("Caller-supplied / unverified");
  const summary = within(region).getByText("Recorded source and snapshot identity");
  await user.click(summary);
  expect(region).toHaveTextContent("Byte span [931, 947)");
  expect(region).toHaveTextContent("Source text and variable names are not supplied");
  expect(region).toHaveTextContent("not an authenticated dynamic helper activation");
  rerender(<ResourceCheckpointValuesView checkpoint={recording.checkpoints[0]} />);
  expect(within(region).getAllByRole("row")).toHaveLength(4);
  expect(region).not.toHaveTextContent("0x000001d5");
  expect(region).toHaveTextContent("Byte span [377, 402)");
});

it("keeps malformed value display local while retaining memory/import provenance", async () => {
  const user = userEvent.setup(), original = retainedResourceExcerpt();
  const badValues = mutateResourceLine(original.responses, 6, row => { row.result.snapshot.snapshot.values[0].availability.value.bits = "bad"; });
  render(<RecordedResourceImport />);
  await user.upload(screen.getByLabelText("Requests JSONL"), file(original.requests, "requests.jsonl"));
  await user.upload(screen.getByLabelText("Responses JSONL"), file(badValues, "negative-control.jsonl"));
  await user.click(screen.getByRole("button", { name: "Import local recording" }));
  const inspector = await screen.findByRole("region", { name: "Imported checkpoint SSA and source" });
  expect(inspector).toHaveAttribute("data-state", "invalid");
  expect(within(inspector).queryByRole("table")).not.toBeInTheDocument();
  expect(within(inspector).getByRole("status")).toHaveTextContent("original recording remains unchanged");
  expect(screen.getByRole("group", { name: "Captured memory cells" })).toBeInTheDocument();
  expect(screen.getByLabelText("Local recording byte provenance")).toHaveTextContent("negative-control.jsonl");
  await user.click(screen.getByRole("button", { name: "Show original paired lines" }));
  expect(screen.getByLabelText("Original response line").textContent).toBe(badValues.split("\n")[0] + "\n");
});

it("links only checkpoint changes, not historical access selection, and resets on file replacement", async () => {
  const user = userEvent.setup(), fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  render(<RecordedResourceImport />);
  await user.upload(screen.getByLabelText("Requests JSONL"), file(input.requests, "requests.jsonl"));
  await user.upload(screen.getByLabelText("Responses JSONL"), file(input.responses, "responses.jsonl"));
  await user.click(screen.getByRole("button", { name: "Import local recording" }));
  const checkpoints = await screen.findByRole("combobox", { name: "Imported checkpoint" });
  expect(within(screen.getByRole("table", { name: "Selected checkpoint SSA values" })).getAllByRole("rowheader")).toHaveLength(3);
  await user.selectOptions(checkpoints, "1");
  let values = screen.getByRole("table", { name: "Selected checkpoint SSA values" });
  const captured = values.textContent, provenance = screen.getByLabelText("Local recording byte provenance").textContent;
  await user.selectOptions(screen.getByRole("combobox", { name: "Recorded resource page" }), "2");
  await user.click(screen.getByRole("button", { name: /Select retained access event/u }));
  expect(values.textContent).toBe(captured);
  expect(screen.getByTestId("checkpoint-values-anchor")).toHaveTextContent("event 33, revision 4");
  await user.selectOptions(checkpoints, "2");
  expect(screen.getByTestId("checkpoint-values-anchor")).toHaveTextContent("event 31, revision 5");
  await user.selectOptions(checkpoints, "3");
  expect(screen.getByTestId("checkpoint-values-anchor")).toHaveTextContent("event 33, revision 6");
  values = screen.getByRole("table", { name: "Selected checkpoint SSA values" });
  expect(values.textContent).toBe(captured);
  expect(screen.getByLabelText("Local recording byte provenance").textContent).toBe(provenance);
  await user.upload(screen.getByLabelText("Responses JSONL"), file(input.responses, "same-bytes-replacement.jsonl"));
  expect(screen.queryByRole("region", { name: "Imported checkpoint SSA and source" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Import local recording" }));
  await screen.findByRole("region", { name: "Imported checkpoint SSA and source" });
  expect(screen.getByRole("combobox", { name: "Imported checkpoint" })).toHaveValue("0");
  expect(within(screen.getByRole("table", { name: "Selected checkpoint SSA values" })).getAllByRole("row")).toHaveLength(4);
  await user.click(screen.getByRole("button", { name: "Reset local recording" }));
  expect(screen.queryByRole("region", { name: "Imported checkpoint SSA and source" })).not.toBeInTheDocument();
  expect(screen.getByLabelText("Requests JSONL")).toHaveFocus(); expect(fetch).not.toHaveBeenCalled();
});

it("never retains a previous table after local unsupported or empty values", async () => {
  const recording = await importResourceRecording(input.requests, input.responses);
  const { rerender } = render(<ResourceCheckpointValuesView checkpoint={recording.checkpoints[1]} />);
  const changed = mutateResourceLine(input.responses, 6, row => { row.result.snapshot.snapshot.values[0].path.root = { kind: "register", name: "v0" }; });
  const unsupported = await importResourceRecording(input.requests, changed);
  rerender(<ResourceCheckpointValuesView checkpoint={unsupported.checkpoints[1]} />);
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Imported checkpoint SSA and source" })).toHaveAttribute("data-state", "unsupported");
  const emptyText = mutateResourceLine(input.responses, 6, row => { row.result.snapshot.snapshot.values = []; });
  const empty = await importResourceRecording(input.requests, emptyText);
  rerender(<ResourceCheckpointValuesView checkpoint={empty.checkpoints[1]} />);
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("No value rows were retained");
});
