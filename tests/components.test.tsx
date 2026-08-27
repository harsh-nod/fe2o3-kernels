import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CodeTabs } from "../src/components/CodeTabs";
import { FunctionalCorrectnessPanel } from "../src/components/FunctionalCorrectnessPanel";
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
    expect(screen.getByRole("tab", { name: "Safe CPU reference" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    expect(writeText).toHaveBeenCalledWith(tabs[1].code);
    expect(screen.getByText("Copied")).toBeInTheDocument();
  });

  it("resets safely when a new lesson has fewer tabs", async () => {
    const user = userEvent.setup();
    const sixTabs = lessons.find((lesson) => lesson.id === "gemm-tiling")!.tabs;
    const fiveTabs = lessons.find((lesson) => lesson.id === "gemm-proof-plan")!.tabs;
    const { rerender } = render(<CodeTabs tabs={sixTabs} />);

    await user.click(screen.getByRole("tab", { name: "MI300X result" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "PASS multi-workgroup-dynamic-k",
    );

    rerender(<CodeTabs tabs={fiveTabs} />);
    expect(screen.getByRole("tab", { name: "Kernel" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "pub fn tiled_gemm_lds_slice1",
    );
  });

  it("keeps Verus and sequential specifications optional", async () => {
    const user = userEvent.setup();
    const tabs = lessons.find((lesson) => lesson.id === "gemm-tiling")!.tabs;
    render(<CodeTabs tabs={tabs} />);

    expect(
      screen.queryByRole("tab", { name: "Sequential semantics" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Verus refinement" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Show proof details" }),
    );
    expect(
      screen.getByRole("tab", { name: "Sequential semantics" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Verus refinement" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Hide proof details" }),
    );
    expect(
      screen.queryByRole("tab", { name: "Verus refinement" }),
    ).not.toBeInTheDocument();
  });
});

describe("functional-correctness catalog", () => {
  it("keeps the exact fail-closed contract in an optional disclosure", async () => {
    const user = userEvent.setup();
    render(<FunctionalCorrectnessPanel lessonId="flash-attention" />);

    expect(
      screen.getByRole("heading", { name: "Correctness contract" }),
    ).toBeInTheDocument();
    const disclosure = screen
      .getByRole("heading", { name: "Correctness contract" })
      .closest("details");
    expect(disclosure).not.toHaveAttribute("open");

    await user.click(screen.getByText("Correctness contract"));
    expect(disclosure).toHaveAttribute("open");
    expect(screen.getByText("Incomplete")).toBeInTheDocument();
    expect(screen.getByText("Safe Rust reference")).toBeInTheDocument();
    expect(screen.getByText("Admitted MIR subset")).toBeInTheDocument();
    expect(screen.getByText("Output relation")).toBeInTheDocument();
    expect(screen.getByText("Schedule relation")).toBeInTheDocument();
    expect(screen.getByText("Numerical policy")).toBeInTheDocument();
    expect(screen.getByText("Cooperative tensor")).toBeInTheDocument();
    expect(screen.getByText("GPU hierarchy")).toBeInTheDocument();
    expect(screen.getByText("Production gate")).toBeInTheDocument();
    expect(screen.getByText("Per-compilation Verus")).toBeInTheDocument();
    expect(screen.getByText("Incomplete / trusted boundary")).toBeInTheDocument();
    expect(screen.getByText("pointwise + fold")).toBeInTheDocument();
    expect(screen.getByText("bounded recurrence")).toBeInTheDocument();
    expect(
      screen.getByText(/no generated Verus report is bound/iu),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/tensor-component.*replay/iu),
    ).toHaveLength(2);
  });

  it("does not render a functional claim for a non-kernel lesson", () => {
    const { container } = render(
      <FunctionalCorrectnessPanel lessonId="read-the-evidence" />,
    );
    expect(container).toBeEmptyDOMElement();
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

  it("indexes gfx950 MFMA and format-specific transpose lessons", () => {
    const fp4 = searchCatalog("ds_read_b64_tr_b4", lessons, glossary);
    expect(fp4.some((result) => result.lessonId === "gfx950-fp4-attention")).toBe(
      true,
    );

    const fp8 = searchCatalog("gfx950 FP8 GEMM", lessons, glossary);
    expect(fp8[0]).toMatchObject({
      kind: "lesson",
      lessonId: "gfx950-fp8-gemm",
    });
  });

  it("indexes every advanced gfx950 operator family", () => {
    const expected = [
      ["advanced MoE", "gfx950-advanced-moe"],
      ["KDA GDN", "gfx950-kda-gdn-linear-attention"],
      ["indexed sparse attention", "gfx950-indexed-sparse-attention"],
      ["compressed hybrid attention", "gfx950-compressed-hybrid-attention"],
      ["AttnRes GR mHC", "gfx950-attnres-gr-mhc"],
      ["speculative MTP verification", "gfx950-speculative-mtp-verification"],
      ["N-gram hash-table gather", "gfx950-ngram-embedding-gather"],
      ["Muon optimizer", "gfx950-muon-optimizer"],
    ] as const;

    for (const [query, lessonId] of expected) {
      const results = searchCatalog(query, lessons, glossary);
      expect(
        results.some((result) => result.lessonId === lessonId),
        query,
      ).toBe(true);
    }
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
        name: "Forty-two representative compile-time failures",
      }),
    ).toBeInTheDocument();
    const rejectionPath = screen.getByLabelText("Compile-time rejection path");
    expect(rejectionPath).toHaveTextContent("Rust semantic MIR / PLIRON");
    expect(rejectionPath).toHaveTextContent("PLIRON dialect verification");
    expect(rejectionPath).toHaveTextContent("Fixed generic safety passes");
    expect(rejectionPath).toHaveTextContent("No lowering or artifact");
    expect(screen.getAllByText("Compilation stopped")).toHaveLength(42);
    expect(screen.getByText("Static out-of-bounds access")).toBeInTheDocument();
    expect(screen.getByText("Affine access exceeds a finite view")).toBeInTheDocument();
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
    expect(screen.getByText("An intermediate index multiplication overflows")).toBeInTheDocument();
    expect(screen.getByText("One wave executes different tensor phases")).toBeInTheDocument();
    expect(screen.getByText("Tensor metadata claims the wrong active lanes")).toBeInTheDocument();
    expect(screen.getByText("Aliasing LDS views disagree about shape")).toBeInTheDocument();
    expect(screen.getByText("Atomic flags do not invent publication")).toBeInTheDocument();
    expect(screen.getByText("A live loop never advances")).toBeInTheDocument();
    expect(screen.getByText("A dynamic tiled loop can wrap")).toBeInTheDocument();
    expect(screen.getByText("Reassociated floating-point math lacks an error proof")).toBeInTheDocument();
    expect(screen.getByText("Static LDS usage exceeds the target")).toBeInTheDocument();
    expect(screen.getByText("The host buffer is smaller than its kernel view")).toBeInTheDocument();
    expect(screen.getByText("An analysis stage leaves a changed operator")).toBeInTheDocument();
    expect(screen.getByText("An identity snapshot contains unsupported structure")).toBeInTheDocument();
    expect(screen.getByText("An identity snapshot exceeds its bounded budget")).toBeInTheDocument();
    expect(screen.getByText("Declared formula mismatch")).toBeInTheDocument();
    expect(screen.getByText("The grid leaves one output coordinate unwritten")).toBeInTheDocument();
    expect(screen.getByText("A CPU-reference effect has no policy-checked staging")).toBeInTheDocument();
    expect(screen.getByText("The GPU write disagrees with the CPU reference")).toBeInTheDocument();
    expect(screen.getByText("Multiple outputs lack noalias separation")).toBeInTheDocument();
    expect(
      screen.getByText("A tensor result component lacks an exact output binding"),
    ).toBeInTheDocument();
    expect(screen.getByText("Compiler-derived parallel contract is invalid")).toBeInTheDocument();
    expect(screen.getByText("Generic does not mean automatically provable")).toBeInTheDocument();
    expect(screen.getByText("Supported safe ownership mappings")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Shifted<Index1D, N>" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Blocked<Index1D, L, E> where L > 1" })).toBeInTheDocument();
    expect(screen.getByText("Ordinary Rust atomic terminals are explicitly unsupported")).toBeInTheDocument();
    expect(screen.getByText("Stable pass diagnostic catalog")).toBeInTheDocument();
    expect(screen.getByText("Mutation epoch plus exact checkpoints")).toBeInTheDocument();
    expect(screen.getByText("A Clean report is diagnostic, not a proof")).toBeInTheDocument();
    expect(screen.getByText("Transforming passes use a different boundary")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Tensor layout" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Semantic refinement" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "pliron-analysis-report-validation-v1 (integrity boundary)" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "pliron-transform-refinement-v1 (separate transformation boundary)" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-RACE-004" })).toBeInTheDocument();
    expect(screen.getAllByText("Schematic semantic IR")).toHaveLength(38);
    expect(screen.getByRole("cell", { name: "kernel-structural-v1" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "kernel-tensor-layout-v1" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "pliron-presburger (shared analysis)" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-TENSOR-LAYOUT-002" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-BOUNDS-002" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-BOUNDS-004" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-BOUNDS-005" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-PROTOCOL-001" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-PROGRESS-001" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-NUMERIC-001" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-RESOURCE-004" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-ABI-004" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-ATOMIC-002" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-WORKGROUP-002" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-PRESERVE-000" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-PRESERVE-001" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-PRESERVE-002" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-PRESERVE-010" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-PRESERVE-020" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-PRESERVE-025" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-PRESERVE-028" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-PRESERVE-031" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-PRESERVE-039" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-PRESERVE-044" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-TRANSFORM-001" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-TRANSFORM-008" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-TRANSFORM-009" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-SEMANTIC-002" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-PARALLEL-019" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-PARALLEL-021" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-PARALLEL-023" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-PARALLEL-026" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-PARALLEL-027" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-PARALLEL-031" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FE2O3-PARALLEL-017" })).toBeInTheDocument();
    expect(
      document.querySelectorAll(".compile-failure-source code.language-rust"),
    ).toHaveLength(4);
    expect(
      document.querySelectorAll(".compile-failure-source code.language-text"),
    ).toHaveLength(38);
    expect(
      document.querySelector(".compile-failure-source .token.keyword"),
    ).toBeInTheDocument();
  }, 40_000);

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
