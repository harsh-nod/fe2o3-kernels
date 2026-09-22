import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ResourceSourceValuesView } from "../src/components/ResourceSourceValuesView";
import { ResourceCheckpointValuesView } from "../src/components/ResourceCheckpointValuesView";
import { syntheticHelperSourceValueGroup } from "./fixtures/resource-helper-source-values";
import { syntheticSourceValueGroup } from "./fixtures/resource-source-values";

afterEach(() => vi.unstubAllGlobals());
const props = (group: ReturnType<typeof syntheticHelperSourceValueGroup>) => ({
  checkpoint: group.checkpoint, stackPair: group.stack, sourcePages: group.sourcePages,
});
it("shows selected helper source values separately from the all-frame SSA table, read-only", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const user = userEvent.setup(), group = syntheticHelperSourceValueGroup();
  render(<><ResourceSourceValuesView {...props(group)} /><ResourceCheckpointValuesView checkpoint={group.checkpoint} /></>);
  const source = screen.getByRole("region", { name: "Imported checkpoint source variables" });
  expect(source).toHaveAttribute("data-state", "ready");
  expect(within(source).getAllByRole("rowheader")).toHaveLength(2);
  expect(source).toHaveTextContent("source-variable frame 2, legacy occurrence 1");
  expect(source).toHaveTextContent("not a dynamic helper activation");
  expect(source).toHaveTextContent("0x3f800000"); expect(source).toHaveTextContent("not_represented");
  expect(source).toHaveTextContent("Raw bits only; floating-point decoding is not inferred");
  await user.click(within(source).getByText("Recorded source-variable selection and identity"));
  expect(source).toHaveTextContent("2 frames; selected current frame 2");
  expect(source).toHaveTextContent(/2 retained whole SSA values in the selected frame;\s*4 across the complete captured stack/u);
  expect(source).toHaveTextContent("The separate SSA table retains all frames");
  expect(source).toHaveTextContent("no named-variable correspondence inferred");
  const ssa = screen.getByRole("table", { name: "Selected checkpoint SSA values" });
  expect(within(ssa).getAllByRole("row")).toHaveLength(5);
  expect(source).toHaveTextContent("No memory read, debugger command or execution is performed");
  expect(fetch).not.toHaveBeenCalled();
});
it("switches between helper, legacy root and unavailable groups without retaining stale values", () => {
  const helper = syntheticHelperSourceValueGroup(), root = syntheticSourceValueGroup();
  const { rerender } = render(<ResourceSourceValuesView {...props(helper)} />);
  expect(screen.getByTestId("source-values-anchor")).toHaveTextContent("source-variable frame 2");
  rerender(<ResourceSourceValuesView {...props(root)} />);
  expect(screen.getByTestId("source-values-anchor")).toHaveTextContent("source-variable frame 1");
  expect(screen.getAllByRole("rowheader")).toHaveLength(4);
  rerender(<ResourceSourceValuesView checkpoint={helper.checkpoint} stackPair={null} sourcePages={[]} />);
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByRole("region")).toHaveAttribute("data-state", "unavailable");
});
it("removes the helper table when a repeat uses stale source data or an incomplete caller count", () => {
  const helper = syntheticHelperSourceValueGroup(), repeat = syntheticHelperSourceValueGroup(2, 4);
  const { rerender } = render(<ResourceSourceValuesView {...props(helper)} />);
  rerender(<ResourceSourceValuesView checkpoint={repeat.checkpoint} stackPair={helper.stack} sourcePages={helper.sourcePages} />);
  expect(screen.getByRole("region")).toHaveAttribute("data-state", "stale"); expect(screen.queryByRole("table")).not.toBeInTheDocument();
  helper.stack.response.result.frames[0].values.value_count++;
  rerender(<ResourceSourceValuesView {...props(helper)} />);
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
