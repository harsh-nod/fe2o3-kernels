import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import retained from "../examples/source_lds_multi_workgroup_v1.json";
import globalRetained from "../examples/resource_query_v6.json";
import { ResourceAccessView } from "../src/components/ResourceAccessView";
import { projectResourceAccessResponse } from "../src/content/resource-access-view";
import { resourceAccessNavigation } from "../src/content/resource-access-navigation";

function props(checkpoint = 4, page = 0) {
  const stop = retained.checkpoints[checkpoint], pair = stop.accessPages[page];
  return { response: pair.response, expectedRequest: pair.request, expectedSnapshot: stop.expectedSnapshot,
    context: retained.context, responseContext: retained.context };
}
async function open(user: ReturnType<typeof userEvent.setup>) {
  const panel = screen.getByTestId("selected-lds-bank-analysis");
  if (!panel.hasAttribute("open")) await user.click(within(panel).getByText("LDS address-pattern model — assumed layout"));
  return panel;
}

describe("selected LDS assumed-layout UI", () => {
  it("renders one actual retained range with keyboard-readable labels and no network effects", async () => {
    const user = userEvent.setup(), fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    try {
      render(<ResourceAccessView {...props()} />);
      const panel = await open(user);
      expect(panel).toHaveAttribute("open");
      expect(within(panel).getByText(/caller-owned context, not backend-attested/u)).toBeInTheDocument();
      expect(within(panel).getByText(/physical base and alignment are unavailable/u)).toBeInTheDocument();
      expect(within(panel).getByText(/Selected event 12; alloc#2:g0/u)).toBeInTheDocument();
      expect(within(panel).getByRole("list", { name: "Modeled LDS bank footprint" })).toBeInTheDocument();
      expect(within(panel).getAllByRole("listitem")).toHaveLength(32);
      const input = within(panel).getByRole("textbox", { name: /Assumed allocation-base residue/u });
      expect(input).toHaveValue("0");
      expect(input).toHaveAccessibleDescription(/arithmetic for one selected retained byte range/u);
      await user.clear(input); await user.type(input, "1");
      expect(within(panel).getAllByRole("listitem")[0]).toHaveTextContent("1 words · 3 bytes");
      expect(within(panel).getAllByRole("listitem")[1]).toHaveTextContent("1 words · 1 bytes");
      expect(within(panel).getByText(/The selected checkpoint remains 16080, revision 15/u)).toBeInTheDocument();
      expect(within(panel).getByText(/conflict count and GPU timing are unavailable/u)).toBeInTheDocument();
      expect(fetch).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
  });

  it("removes old bins on invalid assumptions and resets on access/target/revision replacement", async () => {
    const user = userEvent.setup(), initial = props();
    const { rerender } = render(<ResourceAccessView {...initial} />);
    let panel = await open(user);
    let input = within(panel).getByRole("textbox");
    fireEvent.change(input, { target: { value: "128" } });
    expect(within(panel).queryByRole("list")).not.toBeInTheDocument();
    expect(within(panel).getByRole("status")).toHaveTextContent("No prior modeled banks");
    fireEvent.change(input, { target: { value: "01" } });
    expect(within(panel).queryByRole("list")).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: "1" } });
    await user.click(screen.getByRole("button", { name: "Next retained access" }));
    panel = await open(user); input = within(panel).getByRole("textbox");
    expect(input).toHaveValue("0");
    expect(within(panel).getByText(/Selected event 28/u)).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "127" } });
    // Synthetic caller-context change; not evidence that this CPU capture ran on gfx950.
    const context = { ...retained.context, target: "gfx950:xnack-" };
    rerender(<ResourceAccessView {...initial} context={context} responseContext={context} />);
    panel = await open(user);
    expect(within(panel).getByRole("textbox")).toHaveValue("0");
    expect(within(panel).getAllByRole("listitem")).toHaveLength(64);
    rerender(<ResourceAccessView {...initial} context={{ ...retained.context, connectionId: "stale" }} />);
    expect(screen.queryByTestId("selected-lds-bank-analysis")).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("does not normalize a missing explicit event or filtered event into a different modeled row", async () => {
    const user = userEvent.setup(), input = props();
    const page = projectResourceAccessResponse(input);
    if (page.status !== "ready" || page.kind !== "memory_accesses") throw new Error("Expected access page");
    const navigation = resourceAccessNavigation(page, null);
    const { rerender } = render(<ResourceAccessView {...input} selection={{ ...navigation.selection, eventSequence: 13 }} />);
    let panel = await open(user);
    expect(within(panel).queryByRole("list")).not.toBeInTheDocument();
    expect(within(panel).getByRole("status")).toHaveTextContent("No exact retained access");
    rerender(<ResourceAccessView {...input} selection={{ ...navigation.selection,
      scopeKey: navigation.scopeOptions[1].key, eventSequence: 12 }} />);
    panel = await open(user);
    expect(within(panel).queryByRole("list")).not.toBeInTheDocument();
    expect(within(panel).getByRole("status")).toHaveTextContent("No exact retained access");
    rerender(<ResourceAccessView {...input} selection={{ ...navigation.selection, pageKey: "another-capture" }} />);
    panel = await open(user);
    expect(within(panel).queryByRole("list")).not.toBeInTheDocument();
    expect(within(panel).getByRole("status")).toHaveAttribute("data-state", "stale");
  });

  it("preserves explicit unknown-target, global-space and empty-page unavailability", async () => {
    const user = userEvent.setup(), initial = props(), context = { ...retained.context, target: null };
    const { rerender } = render(<ResourceAccessView {...initial} context={context} responseContext={context} />);
    let panel = await open(user);
    expect(within(panel).queryByRole("textbox")).not.toBeInTheDocument();
    expect(within(panel).queryByRole("list")).not.toBeInTheDocument();
    expect(within(panel).getByRole("status")).toHaveTextContent("no supported LDS geometry profile");
    rerender(<ResourceAccessView response={globalRetained.accessResponse} expectedRequest={globalRetained.accessRequest}
      expectedSnapshot={globalRetained.expectedSnapshot} context={globalRetained.context} responseContext={globalRetained.context} />);
    panel = await open(user);
    expect(within(panel).getByRole("status")).toHaveTextContent("not global or private memory");
    expect(within(panel).queryByRole("list")).not.toBeInTheDocument();
    rerender(<ResourceAccessView {...props(4, 1)} />);
    panel = await open(user);
    expect(within(panel).getByRole("status")).toHaveTextContent("No exact retained access");
    expect(within(panel).queryByRole("list")).not.toBeInTheDocument();
  });

  it("keeps partial capture and extra pages visible without interpreting missing activity", async () => {
    const user = userEvent.setup(), initial = props();
    const response = { ...initial.response, page: { ...initial.response.page,
      completeness: { status: "truncated", reason: "resident_limit", emitted_events: 16080 } } };
    render(<ResourceAccessView {...initial} response={response} />);
    const panel = await open(user);
    expect(within(panel).getByText(/The retained capture is partial/u)).toHaveTextContent("More backend pages exist");
    expect(within(panel).getByText(/missing accesses are not inactivity/u)).toBeInTheDocument();
    expect(within(panel).getByRole("list")).toBeInTheDocument();
    expect(within(panel).getByText(/not a native LDS bounds check/u)).toBeInTheDocument();
  });
});
