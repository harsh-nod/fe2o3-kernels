import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CodeTabs } from "../src/components/CodeTabs";
import { lessons } from "../src/content/curriculum";
import { glossary } from "../src/content/curriculum";
import { searchCatalog } from "../src/lib/search";

describe("code tabs", () => {
  it("switches with arrow keys and copies the active source", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    const tabs = lessons.find((lesson) => lesson.id === "typed-vecadd")!.tabs;
    render(<CodeTabs tabs={tabs} />);

    const kernelTab = screen.getByRole("tab", { name: "Kernel" });
    kernelTab.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Verus proof" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    expect(writeText).toHaveBeenCalledWith(tabs[1].code);
    expect(screen.getByText("Copied")).toBeInTheDocument();
  });
});

describe("search index", () => {
  it("ranks exact lesson title matches above glossary context", () => {
    const results = searchCatalog("flash attention", lessons, glossary);
    expect(results[0]).toMatchObject({
      kind: "lesson",
      lessonId: "flash-attention",
    });
  });

  it("finds API terms and returns their owning lesson", () => {
    const results = searchCatalog("DisjointSlice", lessons, glossary);
    expect(results.some((result) => result.kind === "glossary")).toBe(true);
    expect(results.some((result) => result.lessonId === "first-fill")).toBe(true);
  });
});
