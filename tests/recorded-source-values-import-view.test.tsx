import { webcrypto } from "node:crypto";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RecordedResourceImport } from "../src/components/RecordedResourceImport";
import { retainedResourceExcerpt } from "./fixtures/recorded-resource-import";
import { encodeSyntheticSourcePairs, syntheticSourceImportPairs } from "./fixtures/recorded-source-values-integration";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const file = (text: string, name: string) => new File([text], name, { type: "application/x-ndjson" });
async function upload(user: ReturnType<typeof userEvent.setup>, raw: { requests: string; responses: string }) {
  await user.upload(screen.getByLabelText("Requests JSONL"), file(raw.requests, "synthetic-requests.jsonl"));
  await user.upload(screen.getByLabelText("Responses JSONL"), file(raw.responses, "synthetic-responses.jsonl"));
  await user.click(screen.getByRole("button", { name: "Import local recording" }));
}
const sourcePanel = () => screen.getByRole("region", { name: "Imported checkpoint source variables" });
const ssaPanel = () => screen.getByRole("region", { name: "Imported checkpoint SSA and source" });

it("integrates synthetic source/SSA/memory views as visibly separate read-only observations", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const storage = vi.spyOn(Storage.prototype, "setItem");
  const user = userEvent.setup(), raw = encodeSyntheticSourcePairs(syntheticSourceImportPairs());
  render(<RecordedResourceImport />); await upload(user, raw);
  await screen.findByRole("combobox", { name: "Imported checkpoint" });
  const source = sourcePanel(), ssa = ssaPanel();
  expect(source).toHaveAttribute("data-state", "ready"); expect(ssa).toHaveAttribute("data-state", "ready");
  const sourceTable = within(source).getByRole("table", { name: "Selected checkpoint source variables" });
  const ssaTable = within(ssa).getByRole("table", { name: "Selected checkpoint SSA values" });
  expect(within(sourceTable).getAllByRole("rowheader")).toHaveLength(4);
  expect(within(ssaTable).getAllByRole("rowheader")).toHaveLength(2);
  expect(sourceTable).toHaveTextContent("not_represented");
  expect(sourceTable).toHaveTextContent("4294967280"); expect(ssaTable).toHaveTextContent("4294967280");
  expect(source).toHaveTextContent("Matching values or names are not a source-to-SSA mapping");
  expect(source).toHaveTextContent("not identical to the unframed checkpoint anchor");
  expect(source).toHaveTextContent("Legacy occurrence 1 is not a dynamic helper activation");
  // Native details summaries are read-only disclosure controls, not commands.
  expect(source.querySelectorAll("button,input,select,textarea,[contenteditable=true]")).toHaveLength(0);
  expect(screen.getByRole("group", { name: "Captured memory cells" })).toBeInTheDocument();
  const provenance = screen.getByLabelText("Local recording byte provenance").textContent;
  await user.click(within(source).getByText("Recorded source-variable selection and identity"));
  expect(source).toHaveTextContent("next operation 1"); expect(source).toHaveTextContent("operation 0");
  await user.click(screen.getByRole("button", { name: "Show original paired lines" }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Original pair" }), "2");
  expect(screen.getByLabelText("Original request line").textContent).toBe(raw.requests.split("\n")[2] + "\n");
  expect(screen.getByLabelText("Original response line").textContent).toBe(raw.responses.split("\n")[2] + "\n");
  expect(screen.getByLabelText("Local recording byte provenance").textContent).toBe(provenance);
  expect(fetch).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled();
});

it("moves both panels with exact reverse/repeat revisions and clears source data on replacement/refusal", async () => {
  const user = userEvent.setup(), pairs = syntheticSourceImportPairs(), raw = encodeSyntheticSourcePairs(pairs);
  render(<RecordedResourceImport />); await upload(user, raw);
  const checkpoint = await screen.findByRole("combobox", { name: "Imported checkpoint" });
  const initial = within(sourcePanel()).getByRole("table").textContent;
  for (const [index, event, revision] of [["1", 1, 3], ["2", 3, 4]] as const) {
    await user.selectOptions(checkpoint, index);
    expect(within(sourcePanel()).getByTestId("source-values-anchor")).toHaveTextContent(`event ${event}, revision ${revision}`);
    expect(within(ssaPanel()).getByTestId("checkpoint-values-anchor")).toHaveTextContent(`event ${event}, revision ${revision}`);
    expect(within(sourcePanel()).getByRole("table").textContent).toBe(initial);
  }
  pairs[3].response.status = "error";
  const failed = encodeSyntheticSourcePairs(pairs);
  await user.upload(screen.getByLabelText("Responses JSONL"), file(failed.responses, "failed-source.jsonl"));
  expect(screen.queryByRole("region", { name: "Imported checkpoint source variables" })).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Imported checkpoint SSA and source" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Import local recording" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("response_refused");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  await user.upload(screen.getByLabelText("Responses JSONL"), file(raw.responses, "same-source-bytes.jsonl"));
  await user.click(screen.getByRole("button", { name: "Import local recording" }));
  expect(await screen.findByRole("combobox", { name: "Imported checkpoint" })).toHaveValue("0");
  expect(within(sourcePanel()).getByTestId("source-values-anchor")).toHaveTextContent("event 3, revision 2");
  await user.click(screen.getByRole("button", { name: "Reset local recording" }));
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Requests JSONL")).toHaveFocus();
});

it("continues to import actual old transcripts without inventing named values from their SSA table", async () => {
  const user = userEvent.setup(); render(<RecordedResourceImport />); await upload(user, retainedResourceExcerpt());
  await screen.findByRole("combobox", { name: "Imported checkpoint" });
  expect(sourcePanel()).toHaveAttribute("data-state", "unavailable");
  expect(within(sourcePanel()).queryByRole("table")).not.toBeInTheDocument();
  expect(within(sourcePanel()).getByRole("status")).toHaveTextContent("No source-variable query was retained");
  expect(ssaPanel()).toHaveAttribute("data-state", "ready");
  expect(screen.getByRole("table", { name: "Captured allocation inventory" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Captured memory cells" })).toBeInTheDocument();
});
