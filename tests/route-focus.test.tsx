import { act, cleanup, render, screen } from "@testing-library/react";
import { useSyncExternalStore } from "react";
import { createPath, Router, type Navigator } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App";

const lesson = vi.hoisted(() => ({
  pending: null as Promise<void> | null,
  release: () => {},
  revision: 0,
  listeners: new Set<() => void>(),
}));

vi.mock("../src/components/Topbar", () => ({ Topbar: () => null }));
vi.mock("../src/components/Sidebar", () => ({ Sidebar: () => null }));
vi.mock("../src/components/LessonPage", () => ({
  LessonPage: function ControlledLesson() {
    useSyncExternalStore(subscribe, () => lesson.revision);
    if (lesson.pending) throw lesson.pending;
    return (
      <>
        <h1 id="first-section">First section</h1>
        <h2 id="second-section">Second section</h2>
      </>
    );
  },
}));

function subscribe(listener: () => void) {
  lesson.listeners.add(listener);
  return () => lesson.listeners.delete(listener);
}

function notifyLesson() {
  lesson.revision += 1;
  for (const listener of lesson.listeners) listener();
}

function suspendLesson() {
  lesson.pending = new Promise<void>((resolve) => {
    lesson.release = resolve;
  });
  notifyLesson();
}

async function revealLesson() {
  await act(async () => {
    const pending = lesson.pending;
    lesson.pending = null;
    notifyLesson();
    lesson.release();
    await pending;
  });
  return screen.findByRole("heading", { name: "First section" });
}

const navigator: Navigator = {
  createHref: (to) => (typeof to === "string" ? to : createPath(to)),
  go: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
};

function renderRoute(path = "/lesson/example#first-section") {
  const route = (location: string) => (
    <Router location={location} navigator={navigator}>
      <App />
    </Router>
  );
  const result = render(route(path));
  return {
    ...result,
    navigate: (location: string) => result.rerender(route(location)),
  };
}

let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let originalScroll: PropertyDescriptor | undefined;
let scrolled: HTMLElement[];

function flushFrames() {
  const pending = [...frames.values()];
  frames.clear();
  act(() => {
    for (const callback of pending) callback(0);
  });
}

describe("route focus through lazy loading and Suspense", () => {
  beforeEach(() => {
    lesson.pending = null;
    lesson.revision = 0;
    lesson.listeners.clear();
    frames = new Map();
    nextFrame = 0;
    scrolled = [];
    window.localStorage.clear();
    vi.mocked(window.scrollTo).mockClear();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      const frame = ++nextFrame;
      frames.set(frame, callback);
      return frame;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((frame) => {
      frames.delete(frame);
    });
    originalScroll = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollIntoView",
    );
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(function (this: HTMLElement) {
        scrolled.push(this);
      }),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    if (originalScroll) {
      Object.defineProperty(HTMLElement.prototype, "scrollIntoView", originalScroll);
    } else {
      delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
    }
  });

  it("waits for the lazy route before scrolling and focusing its anchor", async () => {
    suspendLesson();
    renderRoute();
    expect(screen.getByText("Loading content...")).toBeInTheDocument();
    expect(document.title).toBe("Lesson | fe2o3 kernels");
    expect(frames.size).toBe(0);
    flushFrames();
    expect(window.scrollTo).not.toHaveBeenCalled();

    const heading = await revealLesson();
    expect(frames.size).toBe(1);
    flushFrames();
    expect(scrolled).toEqual([heading]);
    expect(heading.scrollIntoView).toHaveBeenCalledWith({ block: "start" });
    expect(heading).toHaveAttribute("tabindex", "-1");
    expect(heading).toHaveFocus();
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("cancels focus while a mounted route hides and reschedules at the same URL", async () => {
    renderRoute();
    const heading = await revealLesson();
    const [frame] = frames.keys();
    expect(frames.size).toBe(1);

    act(suspendLesson);
    expect(screen.getByText("Loading content...")).toBeInTheDocument();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(frame);
    expect(frames.size).toBe(0);
    flushFrames();
    expect(scrolled).toEqual([]);
    expect(window.scrollTo).not.toHaveBeenCalled();

    await revealLesson();
    expect(frames.size).toBe(1);
    flushFrames();
    expect(scrolled).toEqual([heading]);
    expect(heading).toHaveFocus();
  });

  it("uses the latest destination when navigation changes during suspension", async () => {
    suspendLesson();
    const view = renderRoute();
    view.navigate("/lesson/another#second-section");
    expect(frames.size).toBe(0);
    await revealLesson();
    flushFrames();
    const heading = screen.getByRole("heading", { name: "Second section" });
    expect(scrolled).toEqual([heading]);
    expect(heading).toHaveFocus();
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("cancels a queued frame when the route anchor changes", async () => {
    const view = renderRoute();
    await revealLesson();
    const [frame] = frames.keys();
    view.navigate("/lesson/example#second-section");
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(frame);
    expect(frames.size).toBe(1);
    flushFrames();
    const heading = screen.getByRole("heading", { name: "Second section" });
    expect(scrolled).toEqual([heading]);
    expect(heading).toHaveFocus();
  });

  it.each(["", "#missing-section"])(
    "preserves top-of-page fallback for hash %j after the route is ready",
    async (hash) => {
      suspendLesson();
      renderRoute(`/lesson/example${hash}`);
      expect(frames.size).toBe(0);
      await revealLesson();
      flushFrames();
      expect(window.scrollTo).toHaveBeenCalledExactlyOnceWith({
        top: 0,
        behavior: "instant",
      });
      expect(document.getElementById("main-content")).toHaveFocus();
      expect(scrolled).toEqual([]);
    },
  );

  it("cancels a queued focus when the application unmounts", async () => {
    const view = renderRoute();
    await revealLesson();
    const [frame] = frames.keys();
    view.unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(frame);
    expect(frames.size).toBe(0);
    flushFrames();
    expect(scrolled).toEqual([]);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
