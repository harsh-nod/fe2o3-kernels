import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CodeTabs } from "../src/components/CodeTabs";
import { curriculum } from "../src/content/curriculum";
import { validateCurriculum } from "../src/content/validate";

function fourteenTabLesson() {
  const changed = structuredClone(curriculum);
  const lesson = changed.flatMap((module) => module.lessons)
    .find((item) => item.id === "gfx950-gpt-oss-120b-megakernel")!;
  const host = lesson.tabs.find((tab) => tab.kind === "host")!;
  lesson.tabs.push({ ...host, label: "Additional command view" });
  return { changed, lesson };
}

describe("finite lesson tab capacity", () => {
  it("accepts fourteen tabs while retaining all existing lesson roles and evidence", () => {
    const { changed, lesson } = fourteenTabLesson();
    expect(lesson.tabs).toHaveLength(14);
    expect(validateCurriculum(changed)).toEqual([]);
  });

  it.each([3, 15])("rejects an out-of-bound %i-tab lesson", (count) => {
    const { changed, lesson } = fourteenTabLesson();
    lesson.tabs = Array.from({ length: count }, (_, index) => ({
      ...lesson.tabs[index % 14], label: "View " + index,
    }));
    expect(validateCurriculum(changed)).toContainEqual({
      path: "lesson[gfx950-gpt-oss-120b-megakernel]",
      message: "lesson must expose four to fourteen code tabs",
    });
  });

  it("selects the fourteenth view and wraps keyboard navigation to the first", () => {
    const { lesson } = fourteenTabLesson();
    render(<CodeTabs tabs={lesson.tabs} proofDetailsInitiallyOpen />);
    const list = screen.getByRole("tablist");
    const buttons = within(list).getAllByRole("tab");
    expect(buttons).toHaveLength(14);
    fireEvent.click(buttons[13]);
    expect(buttons[13]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel").textContent).toContain(
      "bash examples/gfx950_gpt_oss_decode/run-gfx950.sh",
    );
    fireEvent.keyDown(list, { key: "ArrowRight" });
    expect(buttons[0]).toHaveFocus();
    expect(buttons[0]).toHaveAttribute("aria-selected", "true");
  });
});
