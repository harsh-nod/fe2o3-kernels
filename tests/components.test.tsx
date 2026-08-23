import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CodeTabs } from "../src/components/CodeTabs";
import { LessonSections } from "../src/components/LessonSections";
import { curriculum, glossary, lessons } from "../src/content/curriculum";
import type { LessonSection } from "../src/content/model";
import { narrativeEntry } from "../src/content/narrative-registry";
import { stagedEvidenceRecord } from "../src/content/staged-evidence";
import { validateCurriculum } from "../src/content/validate";
import { searchCatalog } from "../src/lib/search";

describe("code tabs", () => {
  it("switches with arrow keys and copies the active source", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    const tabs = lessons.find((lesson) => lesson.id === "typed-vecadd")!.tabs;
    render(<CodeTabs tabs={tabs} />);

    const panel = screen.getByRole("tabpanel");
    expect(panel.querySelector("code.language-rust")).toBeInTheDocument();
    expect(panel.querySelector(".token.keyword")).toBeInTheDocument();
    expect(panel.textContent).toBe(tabs[0].code);

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
  it("indexes diagnostics and deep-links to the compiler-check catalog", () => {
    for (const query of [
      "FE2O3-BOUNDS-001",
      "Cross-invocation write race",
      "dynamic shapes",
      "DisjointIndex",
      "Blocked<Index1D, 1, E>",
      "ordinary Rust atomic terminals",
    ]) {
      const results = searchCatalog(query, lessons, glossary);
      expect(results.some((result) =>
        result.lessonId === "compiler-checks" &&
        result.hash === "compiler-checks-catalog"
      )).toBe(true);
    }
    expect(searchCatalog("FE2O3-BOUNDS-001", lessons, glossary)[0]).toMatchObject({
      kind: "diagnostic",
      lessonId: "compiler-checks",
      hash: "compiler-checks-catalog",
    });
  });

describe("lesson section rendering policy", () => {
  it("renders canonical lesson sections", () => {
    const lesson = lessons.find((candidate) => candidate.id === "first-fill")!;
    render(<LessonSections lessonId={lesson.id} sections={lesson.sections} />);

    expect(
      screen.getByRole("heading", { name: "The guarded write is the algorithm" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders the compile-time failure gallery with exact diagnostics", () => {
    const lesson = lessons.find((candidate) => candidate.id === "compiler-checks")!;
    render(<LessonSections lessonId={lesson.id} sections={lesson.sections} />);

    expect(
      screen.getByRole("heading", {
        name: "Eighteen ways an invalid kernel stops at compile time",
      }),
    ).toBeInTheDocument();
    const rejectionPath = screen.getByLabelText("Compile-time rejection path");
    expect(rejectionPath).toHaveTextContent("Rust semantic MIR / PLIRON");
    expect(rejectionPath).toHaveTextContent("PLIRON dialect verification");
    expect(rejectionPath).toHaveTextContent("Fixed generic safety passes");
    expect(rejectionPath).toHaveTextContent("No lowering or artifact");
    expect(screen.getAllByText("Compilation stopped")).toHaveLength(18);
    expect(screen.getByText("Static out-of-bounds access")).toBeInTheDocument();
    expect(screen.getByText("Swapped MFMA operand roles")).toBeInTheDocument();
    expect(screen.getByText("B fragment uses the wrong transpose")).toBeInTheDocument();
    expect(screen.getByText("Partial tile has no edge policy")).toBeInTheDocument();
    expect(screen.getByText("Different views still alias one allocation")).toBeInTheDocument();
    expect(screen.getByText("Rounded 2D launch creates a partial workgroup")).toBeInTheDocument();
    expect(screen.getByText("Kernel asks for an unsupported grid barrier")).toBeInTheDocument();
    expect(screen.getByText("Illegal atomic ordering")).toBeInTheDocument();
    expect(screen.getByText("Cross-invocation write race")).toBeInTheDocument();
    expect(screen.getByText("Invocation-divergent barrier")).toBeInTheDocument();
    expect(screen.getByText("Workgroup read before initialization")).toBeInTheDocument();
    expect(screen.getByText("Declared formula mismatch")).toBeInTheDocument();
    expect(screen.getByText("Generic does not mean automatically provable")).toBeInTheDocument();
    expect(screen.getByText("Supported safe ownership mappings")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Shifted<Index1D, N>" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Blocked<Index1D, L, E> where L > 1" })).toBeInTheDocument();
    expect(screen.getByText("Ordinary Rust atomic terminals are explicitly unsupported")).toBeInTheDocument();
    expect(screen.getByText("Generic diagnostic catalog")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "kernel-structural-v1" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "kernel-tensor-layout-v1" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-TENSOR-LAYOUT-002" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-BOUNDS-002" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-ATOMIC-002" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-WORKGROUP-002" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-SEMANTIC-002" })).toBeInTheDocument();
    expect(
      document.querySelectorAll(".compile-failure-source code.language-rust"),
    ).toHaveLength(4);
    expect(
      document.querySelectorAll(".compile-failure-source code.language-text"),
    ).toHaveLength(14);
    expect(
      document.querySelector(".compile-failure-source .token.keyword"),
    ).toBeInTheDocument();
  });

  it("rejects an unknown section kind without rendering attacker text", () => {
    const unsupportedAuthority =
      "Unknown lesson node grants protected accelerator authority.";
    const lesson = lessons.find((candidate) => candidate.id === "first-fill")!;
    const sections = structuredClone(lesson.sections) as unknown as Array<
      Record<string, unknown>
    >;
    sections[0] = { kind: "authority", text: unsupportedAuthority };

    render(
      <LessonSections
        lessonId={lesson.id}
        sections={sections as unknown as LessonSection[]}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Lesson content unavailable",
    );
    expect(screen.queryByText(unsupportedAuthority)).not.toBeInTheDocument();
  });

  it("rejects unknown, prototype, and staged evidence IDs at render time", () => {
    for (const invalidId of ["unknown-narrative", "__proto__"]) {
      const lesson = lessons.find((candidate) => candidate.id === "first-fill")!;
      const sections = structuredClone(lesson.sections) as unknown as Array<
        Record<string, unknown>
      >;
      sections[0].narrativeId = invalidId;
      const view = render(
        <LessonSections
          lessonId={lesson.id}
          sections={sections as unknown as LessonSection[]}
        />,
      );
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Lesson content unavailable",
      );
      view.unmount();
    }

    const lesson = lessons.find((candidate) => candidate.id === "gemm-proof-plan")!;
    const sections = structuredClone(lesson.sections) as unknown as Array<
      Record<string, unknown>
    >;
    const staged = sections.find(
      (section) => section.kind === "staged-evidence",
    )!;
    staged.evidenceIds = ["unknown-staged-record"];
    render(
      <LessonSections
        lessonId={lesson.id}
        sections={sections as unknown as LessonSection[]}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This lesson section failed its content policy.",
    );
  });

  it("rejects no-hash hardware authority reclassified as narrative", () => {
    const unsupportedAuthority =
      "The hardware harness establishes machine execution authority.";
    const lesson = lessons.find((candidate) => candidate.id === "gemm-proof-plan")!;
    const sections = structuredClone(lesson.sections) as unknown as Array<
      Record<string, unknown>
    >;
    const staged = sections.find(
      (section) => section.kind === "staged-evidence",
    )!;
    staged.kind = "narrative";
    delete staged.evidenceIds;
    staged.narrativeId = "gemm-tiling/public-layout-proof";
    staged.text = unsupportedAuthority;

    render(
      <LessonSections
        lessonId={lesson.id}
        sections={sections as unknown as LessonSection[]}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This lesson section failed its content policy.",
    );
    expect(screen.queryByText(unsupportedAuthority)).not.toBeInTheDocument();
  });

  it("keeps rendered prose canonical after attempted registry mutation", () => {
    const unsupportedAuthority =
      "Post-validation mutation grants unconditional GPU authority.";
    expect(validateCurriculum(curriculum)).toEqual([]);
    const entry = narrativeEntry("first-fill/kernel-shape");
    expect(
      Reflect.set(entry.blocks[0] as object, "text", unsupportedAuthority),
    ).toBe(false);
    const staged = stagedEvidenceRecord("tiled-source-bridge-v1");
    expect(
      Reflect.set(staged.assertions[0] as object, "text", unsupportedAuthority),
    ).toBe(false);
    const lesson = lessons.find(
      (candidate) => candidate.id === "read-the-evidence",
    )!;

    render(<LessonSections lessonId={lesson.id} sections={lesson.sections} />);

    expect(screen.queryByText(unsupportedAuthority)).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
