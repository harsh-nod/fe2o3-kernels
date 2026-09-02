import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CodeTabs } from "../src/components/CodeTabs";
import { DebuggerWorkbench } from "../src/components/DebuggerWorkbench";
import { DebugSimMilestone } from "../src/components/DebugSimMilestone";
import { FunctionalCorrectnessPanel } from "../src/components/FunctionalCorrectnessPanel";
import { LessonSections } from "../src/components/LessonSections";
import { LiveKfdDebuggerPage } from "../src/components/LiveKfdDebuggerPage";
import { ProfilerDispatchImportPage } from "../src/components/ProfilerDispatchImportPage";
import { SourceIsaAgentPage } from "../src/components/SourceIsaAgentPage";
import { curriculum, glossary, lessons } from "../src/content/curriculum";
import { debuggerWorkbenchFixture } from "../src/content/debugger-workbench";
import { liveWorkbenchBackends } from "../src/content/live-kfd-debugger";
import type { LessonSection } from "../src/content/model";
import { narrativeEntry } from "../src/content/narrative-registry";
import { stagedEvidenceRecord } from "../src/content/staged-evidence";
import { validateCurriculum } from "../src/content/validate";
import { searchCatalog } from "../src/lib/search";

describe("debugger and simulator evidence workbench", () => {
  it("switches exact exploration, wave, and PC-sample evidence without upgrading truth", async () => {
    const user = userEvent.setup();
    render(<DebugSimMilestone />);

    expect(
      screen.getByRole("heading", { name: "Explore, retain, and replay a CPU counterexample" }),
    ).toBeInTheDocument();
    expect(screen.getByText("observation only")).toBeInTheDocument();
    expect(screen.getByText("race-freedom proof")).toBeInTheDocument();
    expect(screen.getByText("Inspect exact V2 source variables on CPU")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Source Map V2 variables" })).toBeInTheDocument();
    expect(screen.getByText("0x3f800000")).toBeInTheDocument();
    expect(screen.getAllByText("alloc#1 +0").length).toBeGreaterThan(0);
    expect(screen.getAllByText("not represented").length).toBeGreaterThan(0);
    expect(screen.getByText(/Bundle-bound source is not protected compiler authentication/u)).toBeInTheDocument();
    expect(screen.getByText("Exact production exporter receipt")).toBeInTheDocument();
    expect(screen.getByText("41..43")).toBeInTheDocument();

    const raceTabs = screen.getByRole("tablist", { name: "Race evidence outcome" });
    await user.click(within(raceTabs).getByRole("tab", { name: "No race observed" }));
    expect(screen.getByText(/Other schedules were not exhausted/u)).toBeInTheDocument();
    await user.click(within(raceTabs).getByRole("tab", { name: "Assessment incomplete" }));
    expect(screen.getByText(/Fence or atomic happens-before effects/u)).toBeInTheDocument();

    const waveTabs = screen.getByRole("tablist", { name: "Logical wave width" });
    await user.click(within(waveTabs).getByRole("tab", { name: "Wave64" }));
    expect(screen.getAllByText("0xffffffffffffffff")).toHaveLength(2);
    expect(screen.getByText("0x0000000000000001")).toBeInTheDocument();
    expect(screen.getByText("execution_incomplete_wave")).toBeInTheDocument();

    expect(screen.getByText("Counter Capture V2 importer regression")).toBeInTheDocument();
    expect(screen.getByText("0x3ff8000000000000")).toBeInTheDocument();

    const pcTabs = screen.getByRole("tablist", { name: "PC sample evidence" });
    await user.click(within(pcTabs).getByRole("tab", { name: "Samples" }));
    expect(screen.getByText("5380230786023534")).toBeInTheDocument();
    expect(screen.getAllByText("0xffffffffffffffff").length).toBeGreaterThan(0);
    await user.click(within(pcTabs).getByRole("tab", { name: "Hotspots" }));
    expect(screen.getByText(/Hotspots infer counts of stochastic records/u)).toBeInTheDocument();
    expect(screen.getAllByText("inferred")).toHaveLength(4);
  });
});

describe("semantic debugger workbench", () => {
  it("links hierarchy, timeline, semantic state, and replay controls", async () => {
    const user = userEvent.setup();
    const unavailableSource = debuggerWorkbenchFixture.events.find(
      (event) => event.site.source.availability === "unavailable",
    )!;
    const unavailableValue = debuggerWorkbenchFixture.limitations.find(
      (limitation) => limitation.capability === "register_values",
    )!;
    const sourceReason =
      unavailableSource.site.source.availability === "unavailable"
        ? unavailableSource.site.source.reason
        : "";
    const valueReason = unavailableValue.reason;
    const memoryEventIndex = debuggerWorkbenchFixture.events.findIndex(
      (event) => event.memory.length > 0,
    );
    const memoryEvent = debuggerWorkbenchFixture.events[memoryEventIndex];
    render(<DebuggerWorkbench fixture={debuggerWorkbenchFixture} />);

    expect(screen.getByText("Simulated semantic observation")).toBeInTheDocument();
    expect(screen.getByText("logical only")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lane 32 inactive" })).toBeDisabled();
    expect(screen.getByText(sourceReason)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(valueReason, "u"))).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: new RegExp(memoryEvent.label, "u") }),
    );
    expect(
      screen.getByText(
        `block${memoryEvent.site.kir.block}:op${memoryEvent.site.kir.operation}:${memoryEvent.site.kir.point}`,
      ),
    ).toBeInTheDocument();

    await user.click(
      within(screen.getByRole("tablist", { name: "State inspector" })).getByRole(
        "tab",
        { name: "Memory" },
      ),
    );
    expect(screen.getByText(memoryEvent.memory[0].bytes)).toBeInTheDocument();
    expect(screen.getByText(`init ${memoryEvent.memory[0].initialized}`)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reverse one semantic event" }));
    expect(
      screen.getByText(
        `cursor ${debuggerWorkbenchFixture.events[memoryEventIndex - 1].cursor}/${debuggerWorkbenchFixture.events.at(-1)?.cursor}`,
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Logical wave" }));
    expect(screen.getByRole("tab", { name: "Logical wave" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "Reset debug session" }));
    expect(
      screen.getByText(
        `cursor ${debuggerWorkbenchFixture.events[0].cursor}/${debuggerWorkbenchFixture.events.at(-1)?.cursor}`,
      ),
    ).toBeInTheDocument();
    const nextStop = debuggerWorkbenchFixture.events.findIndex(
      (candidate, index) => index > 0 && candidate.stopped,
    );
    await user.click(screen.getByRole("button", { name: "Continue to next stop" }));
    expect(
      screen.getByText(
        `cursor ${debuggerWorkbenchFixture.events[nextStop >= 0 ? nextStop : debuggerWorkbenchFixture.events.length - 1].cursor}/${debuggerWorkbenchFixture.events.at(-1)?.cursor}`,
      ),
    ).toBeInTheDocument();
  });

  it("edits typed stop policy and emits correlated agent JSON", async () => {
    const user = userEvent.setup();
    const openSite = debuggerWorkbenchFixture.events.find(
      (event) =>
        !debuggerWorkbenchFixture.breakpoints.some(
          (breakpoint) =>
            breakpoint.block === event.site.kir.block &&
            breakpoint.operation === event.site.kir.operation &&
            breakpoint.point === event.site.kir.point,
        ),
    )!;
    render(<DebuggerWorkbench fixture={debuggerWorkbenchFixture} />);

    await user.click(
      screen.getByRole("button", { name: new RegExp(openSite.label, "u") }),
    );
    await user.click(
      screen.getByRole("button", { name: "Add breakpoint at current KIR site" }),
    );
    expect(screen.getByRole("button", { name: "Remove breakpoint 2" })).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Offset"));
    await user.type(screen.getByLabelText("Offset"), "8");
    await user.clear(screen.getByLabelText("Bytes"));
    await user.type(screen.getByLabelText("Bytes"), "8");
    await user.click(screen.getByRole("button", { name: "Add allocation watchpoint" }));
    expect(screen.getByRole("button", { name: "Remove watchpoint 2" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Events" }));
    const request = JSON.parse(screen.getByTestId("debug-agent-request").textContent ?? "{}");
    const response = JSON.parse(screen.getByTestId("debug-agent-response").textContent ?? "{}");
    expect(request).toMatchObject({
      schema: "fe2o3-debug-request-v1",
      operation: "query_events",
      expected_revision: debuggerWorkbenchFixture.session.revision,
    });
    expect(request).toEqual(debuggerWorkbenchFixture.agent_pairs.events.request);
    expect(response).toMatchObject({
      schema: "fe2o3-debug-response-v1",
      status: "ok",
      operation: "query_events",
      result: { result: "events" },
      session: {
        simulated: true,
        hardware_observed: false,
        performance_prediction: false,
      },
    });
    expect(response).toEqual(debuggerWorkbenchFixture.agent_pairs.events.response);
  });
});

describe("live KFD debugger tutorial", () => {
  it("keeps direct KFD, admitted ROCgdb, and profiler evidence distinct", async () => {
    const user = userEvent.setup();
    render(<LiveKfdDebuggerPage />);

    expect(
      screen.getByRole("heading", { name: "GPU debugger + profiler workbench" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Scopes are separate")).toBeInTheDocument();
    expect(screen.getByTestId("gpu-workbench-record")).toHaveTextContent(
      "stopped_queue_envelope",
    );
    expect(screen.getByTestId("gpu-workbench-record")).toHaveTextContent(
      "WaveRecordLayoutNotInKfdUapi",
    );

    const backends = screen.getByRole("tablist", { name: "Evidence backend" });
    const directKfdTab = within(backends).getByRole("tab", { name: "Direct KFD" });
    directKfdTab.focus();
    await user.keyboard("{ArrowRight}");
    expect(within(backends).getByRole("tab", { name: "ROCgdb / MI" })).toHaveFocus();
    expect(screen.getByTestId("gpu-workbench-record")).toHaveTextContent(
      '"live_gpu_stop_validated": false',
    );
    await user.click(
      screen.getByRole("gridcell", {
        name: /GPU wave unavailable, lane 1, unavailable/u,
      }),
    );
    expect(screen.getByText(/lane 1/u)).toBeInTheDocument();

    await user.click(within(backends).getByRole("tab", { name: "Profiler V4" }));
    expect(screen.getByTestId("gpu-workbench-record")).toHaveTextContent(
      "plan_next_capture",
    );
    expect(screen.getByTestId("gpu-workbench-record")).toHaveTextContent(
      "wait_events",
    );
    expect(liveWorkbenchBackends).toHaveLength(3);
    expect(
      screen.getByRole("heading", {
        name: "Semantic evidence composition across complementary tools",
      }),
    ).toBeInTheDocument();
  });
});

describe("in-process profiler import tutorial", () => {
  it("keeps synthetic import, sealed-loader observation, and typed absence distinct", async () => {
    const user = userEvent.setup();
    render(<ProfilerDispatchImportPage />);

    expect(
      screen.getByRole("heading", { name: "In-process profiler import" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Synthetic import, bounded checkpoint qualified")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Process-local profiler agent mapping" }))
      .toHaveTextContent("7001");
    expect(screen.getByText("MI300X bounded importer checkpoint qualified")).toBeInTheDocument();
    expect(screen.getByText(/bounded checkpoint is qualified at a5438d8220/u)).toBeInTheDocument();
    expect(screen.getAllByText(/did not directly observe interpreter/u)).not.toHaveLength(0);
    expect(
      screen.getByRole("heading", { name: "Explore typed absence without a service claim" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/deterministic non-wire, non-authoritative examples/u))
      .toBeInTheDocument();
    expect(screen.getByText(/not a production protocol or service endpoint/u)).toBeInTheDocument();
    await user.click(screen.getByText("Read the exact bounded qualification results"));
    expect(screen.getByText("cargo test -p fe2o3-semantic-import --all-targets"))
      .toBeInTheDocument();
    expect(screen.getByText(/cargo-fe2o3: 340 passed; 1 ignored/u)).toBeInTheDocument();

    const dialects = screen.getByRole("tablist", { name: "rocprof source dialect" });
    const installed = within(dialects).getByRole("tab", { name: "Installed JSON" });
    installed.focus();
    await user.keyboard("{ArrowRight}");
    expect(within(dialects).getByRole("tab", { name: "Forward JSON" })).toHaveFocus();
    expect(within(dialects).getByRole("tab", { name: "Forward JSON" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.click(within(dialects).getByRole("tab", { name: "Current CSV" }));
    expect(screen.getByRole("tabpanel", { name: "Current CSV" }))
      .toHaveTextContent("Stream_Id");

    const queries = screen.getByRole("tablist", {
      name: "Illustrative profiler query exercise",
    });
    await user.click(within(queries).getByRole("tab", { name: "query capability" }));
    const queryPanel = screen.getByRole("tabpanel", { name: "query capability" });
    expect(queryPanel).toHaveTextContent('"status": "unavailable"');
    expect(queryPanel).toHaveTextContent('"production_service_available": false');
    expect(queryPanel).toHaveTextContent(
      "att_decoder_requires_mutable_directory_namespace_without_sealed_route",
    );
    expect(
      screen.getByRole("link", { name: /Return to the composite GPU debugger workbench/u }),
    ).toHaveAttribute("href", "#/debugger/live-kfd");
    expect(
      screen.getByRole("table", { name: "Profiler import truth and nonclaims" }),
    ).toHaveTextContent("Real GPU rocprof roundtrip");
    expect(
      screen.getByRole("table", { name: "Profiler import truth and nonclaims" }),
    ).toHaveTextContent("blocked on #182");
    expect(
      screen.getByRole("table", { name: "Profiler import truth and nonclaims" }),
    ).toHaveTextContent("Protected source/ISA 3x2 matrix");
    expect(screen.getByText(/generic-core qualify only the bounded importer/u))
      .toHaveTextContent("T3 remains open");
    expect(screen.getByText(/grants no compiler, runtime, artifact/u)).toHaveTextContent(
      "GPU-execution authority",
    );
  });
});

describe("agent-native source/ISA tutorial", () => {
  it("switches the exact synthetic characteristic planes without elevating authority", async () => {
    const user = userEvent.setup();
    render(<SourceIsaAgentPage />);

    expect(
      screen.getByRole("heading", { name: "Agent-native source/ISA inspection" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Exact authority-free archive")).toBeInTheDocument();
    expect(screen.getByText("available")).toBeInTheDocument();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("discover_capabilities");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("canonical_self_claimed_archive");
    expect(screen.getByRole("tabpanel")).toHaveTextContent('"archive_authenticity_proved": false');

    await user.click(screen.getByRole("tab", { name: "Targets" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("query_targets");
    expect(screen.getByLabelText("Targets contract")).toHaveTextContent("Exact kind and memory form");

    await user.click(screen.getByRole("tab", { name: "Facts" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("query_facts");
    expect(screen.getByLabelText("Facts contract")).toHaveTextContent("LLVM ordinal and semantic op");

    await user.click(screen.getByRole("tab", { name: "Intervals" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("query_intervals");
    expect(screen.getByLabelText("Intervals contract")).toHaveTextContent("Fact-bound cursor");

    expect(screen.getByLabelText("Source to sparse ISA lineage")).toHaveTextContent("Neutral KIR");
    expect(screen.getByLabelText("Source to sparse ISA lineage")).toHaveTextContent("2 intervals");
    expect(screen.getByText("Structural-only target")).toBeInTheDocument();
    expect(screen.getByText("Duplicate occurrences")).toBeInTheDocument();
    expect(screen.getByText("d000c249aa03...bb57c0")).toBeInTheDocument();
    expect(screen.getByText("23a201c5966c...38b3f6")).toBeInTheDocument();
    expect(screen.getByText("2 interval records on this page")).toBeInTheDocument();
    expect(screen.getByText("synthetic / self-claimed")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "ROCgdb" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "rocprofv3 / ATT" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /live KFD, ROCgdb, and profiler/u }),
    ).toHaveAttribute("href", "#/debugger/live-kfd");
  });
});

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
      "PASS tiled_gemm_general_v1: 19x21x23",
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
    expect(screen.getByText("Functional gate today")).toBeInTheDocument();
    expect(screen.getByText("Runtime CPU oracle")).toBeInTheDocument();
    expect(screen.getByText("Mismatch behavior")).toBeInTheDocument();
    expect(screen.getByText("Compile-time promotion")).toBeInTheDocument();
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
    ).toHaveLength(3);
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
      ["Kimi Delta Attention", "gfx950-kda-gdn-linear-attention"],
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

  it("indexes the launch hub and operator cookbook", () => {
    const start = searchCatalog("run today hardware smoke", lessons, glossary);
    expect(start.some((result) =>
      result.kind === "page" &&
      result.title === "Start here" &&
      result.href === "/"
    )).toBe(true);

    const k3 = searchCatalog("Kimi K3 KDA decode core", lessons, glossary);
    expect(k3.some((result) =>
      result.kind === "operator" &&
      result.title === "Kimi K3 KDA Decode Core" &&
      result.href === "/operators#kimi-k3-kda"
    )).toBe(true);
    expect(k3.some((result) =>
      result.lessonId === "gfx950-kimi-k3-kda-decode"
    )).toBe(true);
  });
});
  it("indexes diagnostics and deep-links to the compiler-check catalog", () => {
    for (const query of [
      "FE2O3-BOUNDS-001",
      "Cross-invocation write race",
      "Checked tiled and row-striped recipes",
      "Nonempty tensor-layout witness",
      "receipt-owned output",
      "IndexBinary to IndexConstant",
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

  it("renders the concise compiler-check catalog and exact boundaries", () => {
    const lesson = lessons.find((candidate) => candidate.id === "compiler-checks")!;
    render(<LessonSections lessonId={lesson.id} sections={lesson.sections} />);

    expect(
      screen.getByRole("heading", {
        name: "Representative compile-time rejections",
      }),
    ).toBeInTheDocument();
    const rejectionPath = screen.getByLabelText("Compile-time rejection path");
    expect(rejectionPath).toHaveTextContent("Rust semantic MIR / PLIRON");
    expect(rejectionPath).toHaveTextContent("PLIRON dialect verification");
    expect(rejectionPath).toHaveTextContent("Fixed generic safety passes");
    expect(rejectionPath).toHaveTextContent("No lowering or artifact");
    expect(screen.getAllByText("Compilation stopped")).toHaveLength(6);
    expect(screen.getByText("Static out-of-bounds access")).toBeInTheDocument();
    expect(screen.getByText("Cross-invocation write race")).toBeInTheDocument();
    expect(
      screen.getByText("Incompatible tensor producer and consumer layouts"),
    ).toBeInTheDocument();
    expect(screen.getByText("Pipeline read before consume")).toBeInTheDocument();
    expect(
      screen.getByText("Dynamic pipeline loop without a drain"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Workgroup pipeline with a divergent trip count"),
    ).toBeInTheDocument();

    for (const heading of [
      "From safe Rust to checked Kernel IR",
      "One production path, with explicit proof boundaries",
      "Debug the verified bundle without upgrading observation into proof",
      "What is complete today",
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
    for (const cell of [
      "Static bounded ranked access witness",
      "Nonempty tensor-layout witness",
      "Checked index constant fold",
      "Any other transformation",
    ]) {
      expect(screen.getByRole("cell", { name: cell })).toBeInTheDocument();
    }
    expect(
      screen.getByText("One completed witness is not universal correctness"),
    ).toBeInTheDocument();
    expect(screen.getByText("Current end-to-end boundary")).toBeInTheDocument();
    expect(screen.getByText(/error\[FE2O3-BOUNDS-001\]/)).toBeInTheDocument();
    expect(screen.getByText(/error\[FE2O3-RACE-001\]/)).toBeInTheDocument();
    expect(
      screen.getByText(/error\[FE2O3-TENSOR-LAYOUT-005\]/),
    ).toBeInTheDocument();
    expect(
      document.querySelectorAll(".compile-failure-source code.language-rust"),
    ).toHaveLength(4);
    expect(
      document.querySelectorAll(".compile-failure-source code.language-text"),
    ).toHaveLength(2);
  }, 20_000);

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
