import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { CodeTabs } from "../src/components/CodeTabs";
import { DebuggerWorkbench } from "../src/components/DebuggerWorkbench";
import { DebugSimMilestone } from "../src/components/DebugSimMilestone";
import { FunctionalCorrectnessPanel } from "../src/components/FunctionalCorrectnessPanel";
import { GettingStartedPage } from "../src/components/GettingStartedPage";
import { LessonSections } from "../src/components/LessonSections";
import { LiveKfdDebuggerPage } from "../src/components/LiveKfdDebuggerPage";
import { ProfilerDispatchImportPage } from "../src/components/ProfilerDispatchImportPage";
import { SourceIsaAgentPage } from "../src/components/SourceIsaAgentPage";
import { curriculum, glossary, lessons } from "../src/content/curriculum";
import { debuggerWorkbenchFixture } from "../src/content/debugger-workbench";
import { currentSourceUrl, currentState } from "../src/content/current-state";
import { liveWorkbenchBackends } from "../src/content/live-kfd-debugger";
import type { LessonSection } from "../src/content/model";
import { narrativeEntry } from "../src/content/narrative-registry";
import { stagedEvidenceRecord } from "../src/content/staged-evidence";
import { validateCurriculum } from "../src/content/validate";
import { searchCatalog } from "../src/lib/search";
import { authorFacingCode } from "../src/lib/kernel-authoring";

describe("community getting started tutorial", () => {
  it("shows the executable CPU path, semantic hierarchy, and fail-closed GPU boundary", () => {
    render(
      <MemoryRouter>
        <GettingStartedPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Run a Rust kernel without a GPU" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Write the type, not an identity hash" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Typed kernel authoring commands"))
      .toHaveTextContent("#[kernel(typed)]");
    expect(screen.getByLabelText("Typed kernel authoring commands"))
      .toHaveTextContent("cargo fe2o3 clippy --all-targets -- -D warnings");
    expect(screen.getByText("No authored SHA")).toBeInTheDocument();
    expect(screen.getByLabelText("No-GPU quick start commands")).toHaveTextContent(
      "bash scripts/quickstart.sh no-gpu",
    );
    expect(screen.getByLabelText("No-GPU quick start commands")).toHaveTextContent(
      `git checkout --detach ${currentState.compilerCommit}`,
    );
    expect(screen.getByText(/default host dependency closure are direct-KFD/u))
      .toBeInTheDocument();
    const typedResult = screen.getByLabelText("Typed simulation result");
    expect(within(typedResult).getByText("authority").closest("div"))
      .toHaveTextContent("observation_only");
    expect(screen.getByLabelText("Work-item activity")).toHaveTextContent("4..63");
    expect(screen.getByText("out + 8")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Semantic debugger differentiators" }))
      .toHaveTextContent("Versioned JSONL queries");
    expect(screen.getByText("runtime: direct-kfd", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Bash + GNU realpath")).toBeInTheDocument();
    expect(screen.getByText("Rust compiler workspace build space")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Inspect KFD before attempting hardware work" })
        .closest("section"),
    ).toHaveTextContent(
      "Schematic output shape; host-specific states are alternatives",
    );
    expect(screen.getByText("debugger-rocgdb: optional-present-unvalidated", {
      exact: false,
    })).toBeInTheDocument();
    expect(screen.getByText(/not an execution capture/u)).toBeInTheDocument();
    expect(screen.getByText(/FE2O3_HIP_SYS_DISABLE=1/u)).toBeInTheDocument();
    expect(screen.getByText(/qualification-legacy-hip-hsa/u)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Debugger protocol reference/u }))
      .toHaveAttribute(
        "href",
        currentSourceUrl("crates/fe2o3-debug-cli/README.md"),
      );
    expect(screen.getByRole("heading", { name: "A diagnostic, not a GPU quick start" }))
      .toBeInTheDocument();
    expect(screen.getByText("No performance prediction is made.")).toBeInTheDocument();
  });
});

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
    expect(
      screen.getByRole("heading", {
        name: "Debug a portable workgroup reduction end to end",
      }),
    ).toBeInTheDocument();
    const reductionResults = screen.getByRole("table", {
      name: "Portable workgroup reduction results",
    });
    expect(within(reductionResults).getByText("0x00000080")).toBeInTheDocument();
    expect(within(reductionResults).getByText("0xffffff40")).toBeInTheDocument();
    expect(within(reductionResults).getByText("0x42c00000")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Workgroup reduction debugger queries"),
    ).toHaveTextContent('"operation":"inspect_scope"');
    expect(screen.getByText("One owner for each source and KIR site")).toBeInTheDocument();
    expect(screen.getByText("The schedule cannot drift to another bundle")).toBeInTheDocument();
    expect(screen.getByText(/A 32-lane launch is a typed workgroup mismatch/u)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Debug arbitrary 1D prefix contracts at KIR V10",
      }),
    ).toBeInTheDocument();
    const arbitraryScanExtents = screen.getByRole("table", {
      name: "Arbitrary workgroup scan extent counts",
    });
    const extentRows = within(arbitraryScanExtents).getAllByRole("row");
    expect(within(extentRows[1]).getAllByRole("cell").map((cell) => cell.textContent))
      .toEqual(["3", "2", "8", "6", "3 active"]);
    expect(within(extentRows[2]).getAllByRole("cell").map((cell) => cell.textContent))
      .toEqual(["65", "7", "23", "16", "64 + 1 active"]);
    expect(within(extentRows[3]).getAllByRole("cell").map((cell) => cell.textContent))
      .toEqual(["255", "8", "26", "18", "64 + 64 + 64 + 63 active"]);
    expect(screen.getByText("3 * ceil(log2(N)) + 2")).toBeInTheDocument();
    expect(screen.getByText("2 * ceil(log2(N)) + 2")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ba2171d19e…bb2aa45e/u }),
    ).toHaveAttribute(
      "href",
      "https://github.com/harsh-nod/fe2o3/blob/ba2171d19e32d957388f4e89ef510539bb2aa45e/docs/target-neutral-workgroup-scan-v1.md",
    );
    const scanResults = screen.getByRole("table", {
      name: "Workgroup scan semantic results",
    });
    expect(within(scanResults).getAllByText("inclusive")).toHaveLength(3);
    expect(within(scanResults).getAllByText("exclusive")).toHaveLength(3);
    expect(scanResults).toHaveTextContent("[1, 3, 6, 10, 15, 21, 28, 36]");
    expect(scanResults).toHaveTextContent("[0, -4, 3, 1, 10, 7, 8, 14]");
    expect(screen.getByLabelText("Workgroup scan evidence layers")).toHaveTextContent(
      "ordinary V5 cases18",
    );
    expect(screen.getByLabelText("Workgroup scan evidence layers")).toHaveTextContent(
      "archived bundles0",
    );
    const sourceBundleMatrix = screen.getByRole("table", {
      name: "Ordinary scan Bundle V5 matrix",
    });
    const sourceBundleRows = within(sourceBundleMatrix).getAllByRole("row");
    expect(sourceBundleRows).toHaveLength(7);
    expect(within(sourceBundleRows[1]).getAllByRole("cell").map((cell) => cell.textContent))
      .toEqual(["u32", "inclusive", "exact · 0x5ca0", "exact · 0x5ca1", "exact · 0x5ca2"]);
    expect(within(sourceBundleRows[6]).getAllByRole("cell").map((cell) => cell.textContent))
      .toEqual(["f32", "exclusive", "exact · 0x5caf", "exact · 0x5cb0", "exact · 0x5cb1"]);
    expect(screen.getByRole("heading", {
      name: "18 canonical documents round-trip and replay exactly",
    })).toBeInTheDocument();
    expect(screen.getByText(/trap-bearing Semantic MIR uses additive V11/u)).toBeInTheDocument();
    expect(screen.getByText("schedule_binding_mismatch")).toBeInTheDocument();
    expect(screen.getByRole("heading", {
      name: "The final Wave64 contains one logical lane",
    })).toBeInTheDocument();
    expect(screen.getByText("0x0000000000000001")).toBeInTheDocument();
    expect(screen.getByRole("heading", {
      name: "Resource exhaustion remains inspectable and inexact",
    })).toBeInTheDocument();
    expect(screen.getByText(/does not expose which retention dimension/u)).toBeInTheDocument();
    const sourceBundleSection = screen.getByRole("region", {
      name: "All 18 source cases reach every CPU observation path",
    });
    expect(within(sourceBundleSection).getByRole("link", {
      name: /b15cf628f6…bef6597e/u,
    })).toHaveAttribute(
      "href",
      "https://github.com/harsh-nod/fe2o3/blob/b15cf628f628db435cf12269c507b06fbef6597e/docs/target-neutral-workgroup-scan-v1.md",
    );
    expect(screen.getByRole("table", { name: "Semantic Trace version custody" }))
      .toHaveTextContent("exact KIR V9 or V10");
    expect(screen.getByLabelText("Shared helper instance custody"))
      .toHaveTextContent("one KIR node");
    expect(screen.getByText(/archives none of the generated bundles or schedule documents/u))
      .toBeInTheDocument();
    expect(screen.getByText(/does not execute a GPU or predict GPU behavior/u))
      .toBeInTheDocument();

    const raceTabs = screen.getByRole("tablist", { name: "Race evidence outcome" });
    await user.click(within(raceTabs).getByRole("tab", { name: "No race observed" }));
    expect(screen.getByText(/Other schedules were not exhausted/u)).toBeInTheDocument();
    await user.click(within(raceTabs).getByRole("tab", { name: "Assessment incomplete" }));
    expect(screen.getByText(/Fence or atomic happens-before effects/u)).toBeInTheDocument();

    const waveTabs = screen.getByRole("tablist", { name: "Logical wave width" });
    await user.click(within(waveTabs).getByRole("tab", { name: "Wave64" }));
    expect(screen.getAllByText("0xffffffffffffffff")).toHaveLength(2);
    expect(screen.getAllByText("0x0000000000000001")).toHaveLength(2);
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
  it("keeps exactly one lane gridcell in the tab order", async () => {
    const user = userEvent.setup();
    render(<LiveKfdDebuggerPage />);

    const grid = screen.getByRole("grid", {
      name: "Direct KFD unavailable inner wave and lane records",
    });
    const cells = within(grid).getAllByRole("gridcell");
    const activeTabStops = () =>
      cells.filter((cell) => cell.getAttribute("tabindex") === "0");

    expect(activeTabStops()).toEqual([cells[0]]);
    await user.click(cells[7]);
    expect(activeTabStops()).toEqual([cells[7]]);
  });

  it("moves lane grid focus with bounded arrow keys", async () => {
    const user = userEvent.setup();
    render(<LiveKfdDebuggerPage />);

    const grid = screen.getByRole("grid", {
      name: "Direct KFD unavailable inner wave and lane records",
    });
    const cells = within(grid).getAllByRole("gridcell");
    cells[0].focus();

    await user.keyboard("{ArrowLeft}");
    expect(cells[0]).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(cells[1]).toHaveFocus();
    expect(cells[1]).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowDown}");
    expect(cells[1]).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(cells[1]).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(cells[0]).toHaveFocus();
  });

  it("keeps direct KFD, admitted ROCgdb, and profiler evidence distinct", async () => {
    const user = userEvent.setup();
    render(<LiveKfdDebuggerPage />);

    expect(
      screen.getByRole("heading", { name: "GPU debugger + profiler workbench" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Scopes are separate")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Follow one stop across entry and helper frames",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Multi-function source and KIR identity flow"),
    ).toHaveTextContent("KIR-to-source");
    expect(screen.getByText(/Identity-bound, not name-matched/u).closest("aside")).toHaveTextContent(
      "exact owner qualified occurrence sidecar",
    );
    expect(screen.getByText(/Identity-bound, not name-matched/u).closest("aside")).toHaveTextContent(
      "external verifier environment was not provisioned",
    );
    expect(screen.getByText(/CPU simulator debugging is a separate/u)).toHaveTextContent(
      "CPU performance prediction",
    );
    expect(screen.getByText(/V3 cleanup finishes KFD state/u)).toHaveTextContent(
      "leader-only PTRACE_O_EXITKILL",
    );
    expect(
      screen.getByRole("link", { name: /hardware_linux_v2.rs/u }),
    ).toHaveAttribute(
      "href",
      currentSourceUrl("crates/fe2o3-debug-cli/src/hardware_linux_v2.rs"),
    );
    expect(screen.getByTestId("gpu-workbench-record")).toHaveTextContent(
      "stopped_queue_envelope",
    );
    expect(screen.getByTestId("gpu-workbench-record")).toHaveTextContent(
      "WaveRecordLayoutNotInKfdUapi",
    );
    expect(screen.getByTestId("gpu-workbench-record")).toHaveTextContent(
      "ReceiptContainsNoLiveSelector",
    );
    expect(screen.getByTestId("gpu-workbench-record")).toHaveTextContent(
      '"physical_execution_authenticated": false',
    );
    expect(screen.getByTestId("gpu-workbench-record")).toHaveTextContent(
      '"grants_execution_authority": false',
    );
    const checkpoint = screen.getByLabelText("Active direct KFD opaque checkpoint");
    expect(checkpoint).toHaveTextContent("gfx942:xnack-");
    expect(checkpoint).toHaveTextContent("Wave64");
    expect(checkpoint).toHaveTextContent("3,407");
    expect(checkpoint).toHaveTextContent("2,324");
    expect(checkpoint).toHaveTextContent("16");
    expect(screen.getByText("evidence f010a237…acb96f")).toBeInTheDocument();
    const pins = within(checkpoint).getByLabelText("Checkpoint receipt pins");
    expect(within(pins).getByRole("link", { name: /receipt identity/u }))
      .toHaveAttribute(
        "href",
        "https://github.com/harsh-nod/fe2o3/blob/656ddbda60e5b76ba62ccf3f494d491e29ba0dea/docs/evidence/mi300x-direct-kfd-opaque-checkpoint-qualification-v1.json",
      );
    expect(pins).toHaveTextContent(
      "9e9e633b1a5f714662036317290338a86cacc27e5265704bd08b744d4b6ecdf1",
    );
    expect(pins).toHaveTextContent(
      "7c2db0c15664fcc2671796f6cc62219fc935cfa9",
    );
    expect(pins).toHaveTextContent(
      "0b354b4ec534383eff9b1162c20c34392cbbacc9",
    );
    const segments = within(checkpoint).getByRole("table", {
      name: "Canonical opaque checkpoint range slots",
    });
    const segmentRows = within(segments).getAllByRole("row");
    expect(segmentRows).toHaveLength(17);
    expect(within(segmentRows[0]).getAllByRole("columnheader")).toHaveLength(5);
    expect(within(segmentRows[0]).getByRole("columnheader", { name: "XCC" }))
      .toHaveAttribute("scope", "col");
    expect(within(segmentRows[1]).getByRole("rowheader", { name: "XCC 0" }))
      .toHaveAttribute("scope", "row");
    expect(within(segmentRows[1]).getAllByRole("cell").map((cell) => cell.textContent))
      .toEqual(["control stack", "12,268", "20", "complete"]);
    expect(within(segmentRows[2]).getAllByRole("cell").map((cell) => cell.textContent))
      .toEqual(["wave state", "14,592", "2,304", "complete"]);
    expect(within(segmentRows[3]).getAllByRole("cell").map((cell) => cell.textContent))
      .toEqual(["control stack", "12,288", "0", "empty"]);
    for (const row of segmentRows.slice(1)) {
      const rowHeader = within(row).getByRole("rowheader");
      const rowId = rowHeader.getAttribute("id");
      expect(rowId).toBeTruthy();
      const cells = within(row).getAllByRole("cell");
      for (const [index, columnId] of [
        "checkpoint-slot-kind",
        "checkpoint-slot-offset",
        "checkpoint-slot-bytes",
        "checkpoint-slot-content",
      ].entries()) {
        expect(cells[index]).toHaveAttribute("headers", `${rowId} ${columnId}`);
      }
    }
    const limits = within(checkpoint).getByLabelText("Checkpoint evidence limits");
    expect(limits).toHaveTextContent("not one coherent checkpoint instant");
    expect(limits).toHaveTextContent("not signatures");
    expect(limits).toHaveTextContent("grant no authority");
    expect(limits).toHaveTextContent("process_vm_readv returned EFAULT");
    expect(limits).toHaveTextContent("only EFAULT admits");
    expect(limits).toHaveTextContent("read-only /proc/<pid>/mem fallback");
    expect(limits).toHaveTextContent("does not authenticate the code-object bytes");
    expect(
      within(
        screen.getByRole("grid", {
          name: "Direct KFD unavailable inner wave and lane records",
        }),
      ).getAllByRole("gridcell"),
    ).toHaveLength(64);

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
        name: /physical stop unavailable, lane 1, unavailable/u,
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
    expect(
      screen.getByRole("heading", {
        name: "Compare complete profiler catalogs in a fresh process",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Profiler Variant V3 identity join"))
      .toHaveTextContent("exact multiset delta");
    expect(screen.getByText(/fe2o3-profiler-service variant-v3-jsonl/u))
      .toHaveTextContent("open_structural_archive");
    expect(screen.getByRole("table", { name: "Process-local profiler agent mapping" }))
      .toHaveTextContent("7001");
    expect(screen.getByText("MI300X bounded importer checkpoint qualified")).toBeInTheDocument();
    expect(screen.getByText(/bounded checkpoint is qualified at a5438d8220/u)).toBeInTheDocument();
    expect(screen.getAllByText(/did not directly observe interpreter/u)).not.toHaveLength(0);
    expect(
      screen.getByRole("heading", { name: "Keep illustrative import queries separate" }),
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
    ).toHaveTextContent("+31.35% observed");
    expect(
      screen.getByRole("table", { name: "Direct-KFD differential and causality status" }),
    ).toHaveTextContent("Wrapper process wall time");
    expect(
      screen.getByRole("table", { name: "Direct-KFD differential and causality status" }),
    ).toHaveTextContent("no direct-KFD queue-registration path");
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
    const authoringKernel = authorFacingCode(tabs[0]);
    expect(panel.querySelector("code.language-rust")).toBeInTheDocument();
    expect(panel.querySelector(".token.keyword")).toBeInTheDocument();
    expect(panel.textContent).toBe(authoringKernel.code);
    expect(panel).not.toHaveTextContent(/\bnamespace\s*=/u);
    expect(screen.getByRole("link", { name: "Source" })).toHaveAttribute(
      "title",
      "Open archived source",
    );
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    expect(writeText).toHaveBeenCalledWith(authoringKernel.code);

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

    const kda = searchCatalog("Kimi Delta Attention decode", lessons, glossary);
    expect(kda.some((result) =>
      result.kind === "operator" &&
      result.title === "Kimi Delta Attention Decode/Prefill" &&
      result.href === "/operators#kda-gdn"
    )).toBe(true);
    expect(kda.some((result) =>
      result.lessonId === "gfx950-kda-gdn-linear-attention"
    )).toBe(true);

    const semantic = searchCatalog("KDA recurrence Wave16 equivalence", lessons, glossary);
    expect(semantic.some((result) =>
      result.kind === "page" &&
      result.title === "Semantic equivalence" &&
      result.href === "/semantic-equivalence" &&
      result.lessonId === "gfx950-kda-gdn-linear-attention"
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
