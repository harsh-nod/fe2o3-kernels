import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CodeTabs } from "../src/components/CodeTabs";
import type { CodeTab } from "../src/content/model";

const tabs: CodeTab[] = [
  { kind: "kernel", label: "First", language: "text", code: "first" },
  { kind: "spec", label: "Proof", language: "text", code: "proof" },
  { kind: "reference", label: "Second", language: "text", code: "second" },
  { kind: "host", label: "Third", language: "text", code: "third" },
];

afterEach(() => vi.restoreAllMocks());

function geometry(list: HTMLElement, positions: [number, number][] | (() => [number, number][]), initial = 0) {
  let left = initial;
  const layout = () => typeof positions === "function" ? positions() : positions;
  const maximum = () => Math.max(0, ...layout().map(([start, width]) => start + width)) - 200;
  Object.defineProperties(list, {
    clientWidth: { configurable: true, value: 200 },
    clientLeft: { configurable: true, value: 1 },
    scrollLeft: {
      configurable: true,
      get: () => left,
      set: (value: number) => { left = Math.max(0, Math.min(Math.max(0, maximum()), value)); },
    },
  });
  vi.spyOn(list, "getBoundingClientRect").mockImplementation(() => new DOMRect(99, 300, 202, 43));
  const buttons = within(list).getAllByRole("tab");
  for (const button of buttons) {
    vi.spyOn(button, "getBoundingClientRect").mockImplementation(() => {
      const index = Array.from(list.children).indexOf(button);
      const [start, width] = layout()[index];
      return new DOMRect(100 + start - left, 300, width, 43);
    });
  }
  return buttons;
}

describe("code tab horizontal navigation", () => {
  it("reveals a partially clipped right edge without requesting page scrolling", () => {
    render(<CodeTabs tabs={tabs} />);
    const list = screen.getByRole("tablist");
    const buttons = geometry(list, [[0, 80], [170, 90], [300, 80]]);
    const focus = vi.spyOn(buttons[1], "focus");
    const pageScroll = vi.spyOn(window, "scrollTo");
    buttons[0].focus();
    fireEvent.keyDown(list, { key: "ArrowRight" });
    expect(buttons[1]).toHaveFocus();
    expect(buttons[1]).toHaveAttribute("aria-selected", "true");
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(list.scrollLeft).toBe(60);
    expect(pageScroll).not.toHaveBeenCalled();
  });

  it("reveals a clipped left edge when moving back", () => {
    render(<CodeTabs tabs={tabs} />);
    const list = screen.getByRole("tablist");
    const buttons = geometry(list, [[0, 80], [170, 90], [300, 80]], 60);
    fireEvent.click(buttons[1]);
    fireEvent.keyDown(list, { key: "ArrowLeft" });
    expect(buttons[0]).toHaveFocus();
    expect(list.scrollLeft).toBe(0);
  });

  it("does not move an already fully visible selected tab", () => {
    render(<CodeTabs tabs={tabs} />);
    const list = screen.getByRole("tablist");
    const buttons = geometry(list, [[0, 80], [100, 90], [300, 80]], 40);
    fireEvent.keyDown(list, { key: "ArrowRight" });
    expect(buttons[1]).toHaveFocus();
    expect(list.scrollLeft).toBe(40);
  });

  it("wraps in both directions across the scrollable row", () => {
    render(<CodeTabs tabs={tabs} />);
    const list = screen.getByRole("tablist");
    const buttons = geometry(list, [[0, 80], [170, 90], [300, 80]]);
    fireEvent.keyDown(list, { key: "ArrowLeft" });
    expect(buttons[2]).toHaveFocus();
    expect(list.scrollLeft).toBe(180);
    fireEvent.keyDown(list, { key: "ArrowRight" });
    expect(buttons[0]).toHaveFocus();
    expect(list.scrollLeft).toBe(0);
  });

  it("uses the same nearest-edge policy for click selection", () => {
    render(<CodeTabs tabs={tabs} />);
    const list = screen.getByRole("tablist");
    const buttons = geometry(list, [[0, 80], [170, 90], [300, 80]]);
    const focus = vi.spyOn(buttons[1], "focus");
    fireEvent.click(buttons[1]);
    expect(buttons[1]).toHaveFocus();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(list.scrollLeft).toBe(60);
    fireEvent.click(buttons[0]);
    expect(list.scrollLeft).toBe(0);
  });

  it("aligns an oversized label at its leading edge without oscillation", () => {
    render(<CodeTabs tabs={tabs} />);
    const list = screen.getByRole("tablist");
    const buttons = geometry(list, [[0, 80], [100, 300], [420, 80]]);
    fireEvent.keyDown(list, { key: "ArrowRight" });
    expect(list.scrollLeft).toBe(100);
    fireEvent.click(buttons[1]);
    expect(list.scrollLeft).toBe(100);
  });

  it("navigates source indices through hidden and revealed proof tabs", () => {
    render(<CodeTabs tabs={tabs} />);
    const list = screen.getByRole("tablist");
    geometry(list, [[0, 80], [170, 90], [300, 80]]);
    fireEvent.keyDown(list, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Second" })).toHaveFocus();
    expect(screen.queryByRole("tab", { name: "Proof" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show proof details" }));
    geometry(list, [[0, 80], [100, 80], [200, 90], [300, 80]], 90);
    fireEvent.keyDown(list, { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: "Proof" })).toHaveFocus();
    expect(list.scrollLeft).toBe(90);
    fireEvent.keyDown(list, { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: "First" })).toHaveFocus();
    expect(list.scrollLeft).toBe(0);
  });

  it("keeps focus and scrolling inside the initiating component", () => {
    render(<><CodeTabs tabs={tabs} /><CodeTabs tabs={tabs} /></>);
    const [first, second] = screen.getAllByRole("tablist");
    geometry(first, [[0, 80], [170, 90], [300, 80]]);
    const buttons = geometry(second, [[0, 80], [170, 90], [300, 80]]);
    fireEvent.keyDown(second, { key: "ArrowRight" });
    expect(buttons[1]).toHaveFocus();
    expect(first.scrollLeft).toBe(0);
    expect(second.scrollLeft).toBe(60);
  });

  it("reveals an unchanged selection after hiding proof tabs without moving toggle focus", () => {
    render(<CodeTabs tabs={tabs} proofDetailsInitiallyOpen />);
    const list = screen.getByRole("tablist");
    geometry(list, () => list.children.length === 4
      ? [[0, 80], [100, 220], [340, 90], [600, 80]]
      : [[0, 80], [100, 90], [360, 80]]);
    fireEvent.click(screen.getByRole("tab", { name: "Second" }));
    expect(list.scrollLeft).toBe(230);
    const toggle = screen.getByRole("button", { name: "Hide proof details" });
    toggle.focus();
    const pageScroll = vi.spyOn(window, "scrollTo");
    fireEvent.click(toggle);
    expect(screen.getByRole("tab", { name: "Second" })).toHaveAttribute("aria-selected", "true");
    expect(list.scrollLeft).toBe(100);
    expect(toggle).toHaveFocus();
    expect(pageScroll).not.toHaveBeenCalled();
  });

  it("reveals the fallback first tab when its selected proof tab is hidden", () => {
    render(<CodeTabs tabs={tabs} proofDetailsInitiallyOpen />);
    const list = screen.getByRole("tablist");
    geometry(list, () => list.children.length === 4
      ? [[0, 80], [300, 100], [430, 90], [600, 80]]
      : [[0, 80], [100, 90], [360, 80]]);
    fireEvent.click(screen.getByRole("tab", { name: "Proof" }));
    expect(list.scrollLeft).toBe(200);
    const toggle = screen.getByRole("button", { name: "Hide proof details" });
    toggle.focus();
    const pageScroll = vi.spyOn(window, "scrollTo");
    fireEvent.click(toggle);
    expect(screen.getByRole("tab", { name: "First" })).toHaveAttribute("aria-selected", "true");
    expect(list.scrollLeft).toBe(0);
    expect(toggle).toHaveFocus();
    expect(pageScroll).not.toHaveBeenCalled();
  });
});
