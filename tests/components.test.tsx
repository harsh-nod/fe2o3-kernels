import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CodeTabs } from "../src/components/CodeTabs";
import { LessonSections } from "../src/components/LessonSections";
import { RuntimeMilestonesPage } from "../src/components/RuntimeMilestonesPage";
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

describe("runtime milestones", () => {
  it("renders the implementation, runnable commands, and claim boundary", () => {
    render(<RuntimeMilestonesPage />);

    expect(
      screen.getByRole("heading", { name: "One runtime ownership pipeline" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Implementation checked")).toHaveLength(4);
    expect(screen.getAllByText("Formal model verified")).toHaveLength(3);
    expect(screen.getByText(/100,000 sequential dispatch/u)).toBeInTheDocument();
    expect(screen.getByText(/not yet been re-observed on MI300X/u)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Public one-shot synchronous vecadd API" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Exactly three ownership outcomes")).toBeInTheDocument();
    expect(screen.getByText("DefinitelyNotPublished")).toBeInTheDocument();
    expect(screen.getByText("RetainedTerminal")).toBeInTheDocument();
    expect(screen.getByText(/released12 and retained0/u)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Copy hardware command" })).toHaveLength(2);
    expect(screen.getAllByText(/browser only copies this command/u)).toHaveLength(2);
    expect(screen.getAllByText(/implementation-checked and unmeasured/u)).toHaveLength(2);
    expect(screen.getByText("ceeaa7cfc973a576004ceaba10f95c4681a90b3edf266d382f6f8021e8083e2c")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "One bounded MI300X current-V2 requalification",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Evidence reviewed")).toBeInTheDocument();
    expect(screen.getByText("Bounded MI300X observation")).toBeInTheDocument();
    expect(screen.getByText(/group_status=1 afterward/u)).toBeInTheDocument();
    expect(screen.getByText(/actual2\/expected1 defect remains open/u)).toBeInTheDocument();
    expect(screen.getByText(/No rerun was performed/u)).toBeInTheDocument();
    expect(screen.getByText("7324c8a8457c20298ccac1b7791fe219cf72d83dd982aea145c5b730fa19d6c3")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Compiler-to-KFD compatibility leaf" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /deliberately rejected before bridge-owned VM, memory, queue, or packet work/u,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/556f97ee4e509b4c/u)).toBeInTheDocument();
    expect(screen.getByText(/RequiredWorkgroupSize \{ actual: None \}/u)).toBeInTheDocument();
    expect(screen.getByText(/zero opens of \/dev\/kfd or \/dev\/dri/u)).toBeInTheDocument();
    expect(screen.getByText(/one-bit payload substitution fails closed/u)).toBeInTheDocument();
    expect(screen.getByText(/Compiler convergence and its source-closed c454 reproduction/u)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Exact Kernel IR V1 compiler convergence" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("08af31846f37d715cfde9af67c843761a78c2b71"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /kernel_ir_v1_vecadd_cov6_llc_o2.rs/u }),
    ).toHaveAttribute(
      "href",
      "https://github.com/harsh-nod/fe2o3/blob/08af31846f37d715cfde9af67c843761a78c2b71/crates/rustc-codegen-fe2o3/src/kernel_ir_v1_vecadd_cov6_llc_o2.rs",
    );
    expect(screen.getAllByText(/ec153356f5bd021b5d9a9dd6809eaa53/u)).toHaveLength(2);
    expect(screen.getAllByText(/8ade5e0e3807c7ceed3ffbbe8b1d12c4/u)).toHaveLength(2);
    expect(screen.getAllByText(/c4547fe045f839711f1f022a485f50c7/u)).toHaveLength(3);
    expect(screen.getByText(/zero \/dev\/kfd or \/dev\/dri opens and zero ioctl calls/u)).toBeInTheDocument();
    expect(screen.getByText(/existing fill path remains a separate explicit legacy-clang route/u)).toBeInTheDocument();
    expect(screen.getByText(/no GPU execution, hardware result, numerical result/u)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Same-source bounded decision kernel" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Formal model verified")).toHaveLength(3);
    expect(
      screen.getByText(/same executable functions for ordinary Cargo tests and Verus/u),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/10,000 repeated exact Pending observations/u),
    ).toBeInTheDocument();
    expect(screen.getByText(/all 64 bounded lifetime slots/u)).toBeInTheDocument();
    expect(screen.getByText(/does not prove liveness/u)).toBeInTheDocument();
    expect(
      screen.getAllByText(/neither HIP\/HSA\/ROCr feature parity/u),
    ).toHaveLength(2);
    expect(
      screen.getByRole("heading", { name: "Operation-typed runtime effect plans" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Completed runtime milestone")).toHaveLength(8);
    expect(
      screen.getByText(/seven operation-typed, move-only same-source adapter plans/u),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Current NotObserved, Pending, or Complete evidence cannot be relabeled Unexpected/u),
    ).toBeInTheDocument();
    expect(screen.getByText(/24 passing hostile mutation cases/u)).toBeInTheDocument();
    expect(
      screen.getByText(/verification results:: 253 verified, 0 errors/u),
    ).toBeInTheDocument();
    expect(screen.getByText("ccd402e3f349fa216ff8ee255eabe2e4bd95ff70")).toBeInTheDocument();
    expect(screen.getByText("063be2f0356363ad098457fd5880d38c57a568c1")).toBeInTheDocument();
    for (const finding of [
      "NO_KERNEL_FACADE_REFINEMENT",
      "NATIVE_BRIDGE_UNAVAILABLE",
      "MODEL_EFFECT_CUTPOINT_UNREFINED",
      "CURRENTNESS_CERTIFICATE_UNBOUND",
      "TRACE_RESERVE_UNREFINED",
    ]) {
      expect(screen.getByText(new RegExp(finding, "u"))).toBeInTheDocument();
    }
    expect(
      screen.getByText(/one bounded, isolated MI300X current-V2 regression/u),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Preparation and preflight are closed before milestone 05",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Authenticated compiler-build preparation",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Authenticated compiler-build preflight",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Receipt committed")).toBeInTheDocument();
    expect(screen.getByText("Receipt reviewed")).toBeInTheDocument();
    expect(screen.getByText("Preparation only")).toBeInTheDocument();
    expect(screen.getByText("Preflight only")).toBeInTheDocument();
    expect(screen.getAllByText(/Verify the retained receipt on the prepared host/u)).toHaveLength(2);
    expect(screen.getAllByText(/08fcbdb9020960c32/u).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/81d5c89ae4d843e6/u).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/110 authenticated records and 15 byte-identical/u)).toBeInTheDocument();
    expect(screen.getByText(/not milestone 05 and not a compiler build/u)).toBeInTheDocument();
    expect(screen.getByText("e5c8d66c5520d1bce7cf2db911c200f1cf4c5536")).toBeInTheDocument();
    expect(screen.getByText("1c694eed427526dc507a129a721237613bafe094")).toBeInTheDocument();
    expect(screen.getByText(/does not execute Rust, KFD, or GPU work/u)).toBeInTheDocument();
    expect(screen.getByText(/Hardware commands are separated and labeled as copy-only/u)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "One reviewed compiler build before one joined launch" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Run the reviewed compiler build")).toBeInTheDocument();
    expect(screen.getByText("Approve one bounded compiler-generated MI300X attempt")).toBeInTheDocument();
    expect(screen.getByText("Retain the one-attempt hardware record")).toBeInTheDocument();
    expect(
      screen.getByText("Consume operation-typed plans in the KFD facade"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Build persistent repeated execution")).not.toBeInTheDocument();
  }, 10_000);
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
    const lesson = lessons.find((candidate) => candidate.id === "gemm-tiling")!;
    render(<LessonSections lessonId={lesson.id} sections={lesson.sections} />);

    expect(
      screen.getByRole("heading", {
        name: "Five kernels that never become GPU artifacts",
      }),
    ).toBeInTheDocument();
    const rejectionPath = screen.getByLabelText("Compile-time rejection path");
    expect(rejectionPath).toHaveTextContent("Safe Rust source");
    expect(rejectionPath).toHaveTextContent(
      "Authenticated optimized-MIR admission",
    );
    expect(rejectionPath).toHaveTextContent("Structured KIR verifier");
    expect(rejectionPath).toHaveTextContent("No artifact");
    expect(screen.getAllByText("Compilation stopped")).toHaveLength(5);
    expect(screen.getByText("Out-of-bounds global load")).toBeInTheDocument();
    expect(screen.getByText("Duplicate output ownership")).toBeInTheDocument();
    expect(screen.getByText("Lane-divergent barrier")).toBeInTheDocument();
    expect(screen.getByText("LDS read before initialization")).toBeInTheDocument();
    expect(screen.getByText("Incorrect alpha/beta epilogue")).toBeInTheDocument();
    expect(screen.getAllByText("0x4647010a")).toHaveLength(2);
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

    const lesson = lessons.find((candidate) => candidate.id === "gemm-tiling")!;
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
    const lesson = lessons.find((candidate) => candidate.id === "gemm-tiling")!;
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
