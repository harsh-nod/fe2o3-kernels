import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ResourceSourceValuesView } from "../src/components/ResourceSourceValuesView";
import { syntheticSourceValueGroup } from "./fixtures/resource-source-values";

afterEach(() => vi.unstubAllGlobals());
const props = (group: ReturnType<typeof syntheticSourceValueGroup>) => ({ checkpoint: group.checkpoint,
  stackPair: group.stack, sourcePages: group.sourcePages });

it("shows named source values and unavailable locals with explicit independent anchor semantics", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const user = userEvent.setup(), group = syntheticSourceValueGroup();
  render(<ResourceSourceValuesView {...props(group)} />);
  const panel = screen.getByRole("region", { name: "Imported checkpoint source variables" });
  expect(panel).toHaveAttribute("data-state", "ready");
  expect(within(panel).getByRole("table")).toHaveAccessibleName("Selected checkpoint source variables");
  expect(within(panel).getAllByRole("rowheader")).toHaveLength(4);
  expect(panel).toHaveTextContent("Caller-supplied / unverified");
  expect(panel).toHaveTextContent("4294967280"); expect(panel).toHaveTextContent("not_represented");
  expect(panel).toHaveTextContent("not identical to the unframed checkpoint anchor");
  expect(panel).toHaveTextContent("not a dynamic helper activation");
  await user.click(within(panel).getByText("Recorded source-variable selection and identity"));
  expect(panel).toHaveTextContent("next operation 1"); expect(panel).toHaveTextContent("operation 0");
  expect(panel).toHaveTextContent("No memory read, debugger command or execution is performed");
  expect(fetch).not.toHaveBeenCalled();
});
it("updates immediately for another checkpoint and keeps repeated event revisions distinct", () => {
  const initial = syntheticSourceValueGroup(), reverse = syntheticSourceValueGroup(1, 3), repeat = syntheticSourceValueGroup(2, 4);
  const { rerender } = render(<ResourceSourceValuesView {...props(initial)} />);
  expect(screen.getByTestId("source-values-anchor")).toHaveTextContent("event 2, revision 2");
  rerender(<ResourceSourceValuesView {...props(reverse)} />);
  expect(screen.getByTestId("source-values-anchor")).toHaveTextContent("event 1, revision 3");
  rerender(<ResourceSourceValuesView {...props(repeat)} />);
  expect(screen.getByTestId("source-values-anchor")).toHaveTextContent("event 2, revision 4");
});
it("never retains a previous table when new source data is stale, malformed or missing", () => {
  const group = syntheticSourceValueGroup(), stale = syntheticSourceValueGroup(2, 4);
  const { rerender } = render(<ResourceSourceValuesView {...props(group)} />);
  expect(screen.getByRole("table")).toBeInTheDocument();
  rerender(<ResourceSourceValuesView checkpoint={stale.checkpoint} stackPair={group.stack} sourcePages={group.sourcePages} />);
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByRole("region")).toHaveAttribute("data-state", "stale");
  const malformed = syntheticSourceValueGroup(); malformed.sourcePages[0].response.values[0].availability.value.value.bits = "bad";
  rerender(<ResourceSourceValuesView {...props(malformed)} />);
  expect(screen.queryByRole("table")).not.toBeInTheDocument(); expect(screen.getByRole("region")).toHaveAttribute("data-state", "invalid");
  rerender(<ResourceSourceValuesView checkpoint={group.checkpoint} stackPair={null} sourcePages={[]} />);
  expect(screen.queryByRole("table")).not.toBeInTheDocument(); expect(screen.getByRole("region")).toHaveAttribute("data-state", "unavailable");
  expect(screen.getByRole("status")).toHaveTextContent("No source-variable query was retained");
});
it("displays ambiguity and redaction text without selecting a same-name value", () => {
  const group = syntheticSourceValueGroup(); group.sourcePages[0].response.values[0].availability = { status: "ambiguous" };
  group.sourcePages[0].response.values[1].name = "a";
  group.sourcePages[0].response.values[1].availability = { status: "value", value: { status: "redacted", reason: "native_address" } };
  render(<ResourceSourceValuesView {...props(group)} />);
  const panel = screen.getByRole("region"); expect(panel).toHaveTextContent("ambiguous"); expect(panel).toHaveTextContent("redacted");
  expect(panel).toHaveTextContent("No candidate is chosen by name or bits");
  expect(within(panel).getAllByRole("rowheader")).toHaveLength(4);
});
it("renders empty complete queries without claiming that source variables do not exist", () => {
  const group = syntheticSourceValueGroup(); group.sourcePages.splice(1);
  group.sourcePages[0].response.values = []; delete group.sourcePages[0].response.next_cursor;
  render(<ResourceSourceValuesView {...props(group)} />);
  expect(screen.getByRole("region")).toHaveAttribute("data-state", "ready");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("not evidence that the source has no variables");
});
