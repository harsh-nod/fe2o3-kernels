// Synthetic component controls; no real debugger or hardware evidence.
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LiveCpuObservedBankView } from "../src/components/LiveCpuObservedBankView";
import { LiveCpuObservedPanel } from "../src/components/LiveCpuObservedPanel";
import { targetFixture } from "./fixtures/cpu-declared-target";
afterEach(cleanup);
describe("same-stop observed bank view", () => {
  it("makes no request on mount and never offers a target override", async () => {
    const { collection } = await targetFixture(false), read = vi.fn();
    render(<LiveCpuObservedBankView collection={collection} targetReply={null} enabled={true}
      remainingCommands={200} onInspectTarget={read} />);
    expect(read).not.toHaveBeenCalled();
    expect(screen.getByText(/No target is inferred/)).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Read bundle-declared target" }));
    expect(read).toHaveBeenCalledExactlyOnceWith(collection);
  });
  it("renders only a selected complete access and resets the residue when the actual attempt changes", async () => {
    const { collection, target } = await targetFixture();
    render(<LiveCpuObservedBankView collection={collection} targetReply={target} enabled={true}
      remainingCommands={200} onInspectTarget={vi.fn()} />);
    expect(screen.queryByRole("list", { name: "Modeled LDS bank footprint" })).not.toBeInTheDocument();
    const select = screen.getByRole("combobox", { name: "Observed workgroup access" });
    await userEvent.selectOptions(select, screen.getAllByRole("option")[1]);
    expect(within(screen.getByRole("list", { name: "Modeled LDS bank footprint" })).getAllByRole("listitem")).toHaveLength(32);
    const base = screen.getByRole("textbox", { name: /Assumed allocation-base residue/ });
    await userEvent.clear(base); await userEvent.type(base, "4");
    expect(base).toHaveValue("4");
    await userEvent.selectOptions(select, screen.getAllByRole("option")[2]);
    expect(screen.getByRole("textbox", { name: /Assumed allocation-base residue/ })).toHaveValue("0");
    expect(screen.getByText(/physical base is unavailable/)).toBeInTheDocument();
  });
  it("drops a modeled selection immediately on target replacement or collection loss", async () => {
    const { collection, target } = await targetFixture(), read = vi.fn();
    const props = { collection, targetReply: target, enabled: true, remainingCommands: 200, onInspectTarget: read };
    const { rerender } = render(<LiveCpuObservedBankView {...props} />);
    await userEvent.selectOptions(screen.getByRole("combobox"), screen.getAllByRole("option")[1]);
    rerender(<LiveCpuObservedBankView {...props} targetReply={null} />);
    expect(screen.getByRole("combobox")).toHaveValue("");
    expect(screen.queryByRole("list", { name: "Modeled LDS bank footprint" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /Assumed allocation-base residue/ })).not.toBeInTheDocument();
  });
  it("clears the derived view when storage fields change or a target query is pending", async () => {
    const { collection, target } = await targetFixture();
    const props = { collection, targetReply: target, checkpoint: null, enabled: true, busy: false,
      remainingCommands: 200, onRefresh: vi.fn(), onInspectTarget: vi.fn() };
    const { rerender } = render(<LiveCpuObservedPanel {...props} />);
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Observed workgroup access" }),
      within(screen.getByRole("combobox", { name: "Observed workgroup access" })).getAllByRole("option")[1]);
    expect(screen.getByRole("list", { name: "Modeled LDS bank footprint" })).toBeInTheDocument();
    await userEvent.clear(screen.getByRole("textbox", { name: "Observed byte offset" }));
    expect(screen.queryByRole("region", { name: "Same-stop declared-target bank model" })).not.toBeInTheDocument();
    rerender(<LiveCpuObservedPanel {...props} busy={true} />);
    expect(screen.queryByRole("region", { name: "Same-stop declared-target bank model" })).not.toBeInTheDocument();
  });
  it("keeps raw targets unavailable and disables a request when no command budget remains", async () => {
    const { collection, client, bridge } = await targetFixture(false); bridge.raw = true;
    const target = await client.inspectDeclaredTarget(collection);
    render(<LiveCpuObservedBankView collection={collection} targetReply={target} enabled={true}
      remainingCommands={0} onInspectTarget={vi.fn()} />);
    expect(screen.getByText("Raw input has no declared GPU target.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Read bundle-declared target" })).toBeDisabled();
    await userEvent.selectOptions(screen.getByRole("combobox"), screen.getAllByRole("option")[1]);
    expect(screen.queryByRole("list", { name: "Modeled LDS bank footprint" })).not.toBeInTheDocument();
  });
});
