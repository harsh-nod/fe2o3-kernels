import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App } from "../src/App";
import { GpuCapabilitiesPage } from "../src/components/GpuCapabilitiesPage";
import { gpuCapabilitiesPage } from "../src/content/gpu-capabilities";
import { glossary, lessons } from "../src/content/curriculum";
import { searchCatalog } from "../src/lib/search";
import "../src/components/Sidebar";

const exactW4Order = [
  "CanonicalTyping",
  "CapabilityProvenance",
  "ResourceLegality",
  "Uniformity",
  "TensorLayout",
  "MemoryBounds",
  "AtomicLegality",
  "HappensBefore",
  "RaceFreedom",
  "HierarchicalOwnership",
  "BarrierConvergence",
  "BarrierOrder",
  "PipelineProtocol",
  "Initialization",
  "MemoryVisibility",
  "WorkgroupMemoryEpochs",
  "CollectiveParticipation",
  "EffectRefinement",
  "SemanticRefinement",
];

describe("GPU capability pipeline reference", () => {
  it("routes from reference navigation to the issue 272 page", async () => {
    render(
      <MemoryRouter initialEntries={["/gpu-capabilities"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole(
        "heading",
        {
          level: 1,
          name: "GPU authority expressed as ordinary Rust",
        },
        { timeout: 10_000 },
      ),
    ).toBeInTheDocument();
    expect(document.title).toBe("GPU capability pipeline | fe2o3 kernels");
    expect(
      await screen.findByRole(
        "link",
        { name: "Capability pipeline" },
        { timeout: 10_000 },
      ),
    ).toHaveAttribute("href", "/gpu-capabilities");
  });

  it("renders the one pipeline without promoting component evidence", () => {
    render(
      <MemoryRouter>
        <GpuCapabilitiesPage />
      </MemoryRouter>,
    );

    const pipeline = screen.getByRole("list", {
      name: "GPU capability production pipeline",
    });
    expect(within(pipeline).getAllByRole("listitem")).toHaveLength(9);
    expect(within(pipeline).getAllByText("Implemented interface")).toHaveLength(1);
    expect(within(pipeline).getAllByText("Component evidence")).toHaveLength(7);
    expect(within(pipeline).getAllByText("Not qualified")).toHaveLength(1);
    expect(screen.getByText(/Issue #272 remains in migration/u)).toBeInTheDocument();
    expect(screen.getAllByText(/0 of 47 compiler fixtures/u).length).toBeGreaterThan(0);
    expect(within(pipeline).getByText("Checked calls + SSA")).toBeInTheDocument();
    expect(within(pipeline).getByText(/Original MIR stays unchanged/u)).toBeInTheDocument();
    expect(within(pipeline).getByText(/each call's frame-entry marker/u))
      .toBeInTheDocument();
    expect(within(pipeline).getByText(/memory safety does not imply equivalent outputs/u))
      .toBeInTheDocument();
    expect(within(pipeline).getByText(/Extraction stops at the missing pinned proof runtime/u))
      .toBeInTheDocument();
    expect(within(pipeline).getByText(/replay is not a semantic-equivalence proof/u))
      .toBeInTheDocument();
    expect(within(pipeline).getByText(/Production correspondence and lineage still reject/u))
      .toBeInTheDocument();
    expect(within(pipeline).getByText(/Loop induction proofs inside expanded helpers remain unsupported/u))
      .toBeInTheDocument();
  });

  it("uses the runnable tiled GEMM while preserving its legacy boundary", () => {
    render(
      <MemoryRouter>
        <GpuCapabilitiesPage />
      </MemoryRouter>,
    );

    const sourceExcerpt = screen.getByLabelText("Tiled GEMM ordinary Rust excerpt");
    expect(sourceExcerpt).toHaveTextContent("thread::index_1d");
    expect(sourceExcerpt).toHaveTextContent("WorkgroupPipeline");
    expect(sourceExcerpt).toHaveTextContent("matrix.multiply_accumulate");
    expect(sourceExcerpt).toHaveTextContent("get_tiled_2d_mut");
    expect(screen.getByText("gfx942 end-to-end runner")).toBeInTheDocument();
    expect(screen.getAllByText(/available-legacy-only/u).length).toBeGreaterThan(0);

    const kir = screen.getByLabelText("Canonical KIR V13 capability operations");
    expect(kir).toHaveTextContent("KernelContextIssue");
    expect(kir).toHaveTextContent("ExecutionCapabilityOperationV1::LdsAllocate");
    expect(kir).toHaveTextContent("ExecutionCapabilityOperationV1::MatrixAccess");
  });

  it("publishes all 19 W4 obligations in immutable order", () => {
    expect(gpuCapabilitiesPage.obligations.map((item) => item.name)).toEqual(exactW4Order);

    render(
      <MemoryRouter>
        <GpuCapabilitiesPage />
      </MemoryRouter>,
    );
    const schedule = screen.getByRole("region", { name: "Exact W4 obligation schedule" });
    expect(within(schedule).getAllByRole("row")).toHaveLength(20);
    for (const obligation of exactW4Order) {
      expect(within(schedule).getByRole("rowheader", { name: obligation })).toBeInTheDocument();
    }
  });

  it("keeps Checked, Proven, refinement, simulator, and hardware claims distinct", () => {
    render(
      <MemoryRouter>
        <GpuCapabilitiesPage />
      </MemoryRouter>,
    );

    for (const term of [
      "Clean",
      "Checked",
      "Proven",
      "Refinement receipt",
      "Simulator observation",
      "Hardware observation",
    ]) {
      expect(screen.getByRole("heading", { name: term })).toBeInTheDocument();
    }
    expect(screen.getByText(/must never be relabeled Proven/u)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Target lowering is not machine refinement" }))
      .toBeInTheDocument();
  });

  it("derives migration presentation from the checked-in manifest", () => {
    expect(gpuCapabilitiesPage.manifest).toMatchObject({
      baselineStatus: "migration",
      lessons: 25,
      fixtures: 47,
      completeClosures: 0,
      canonicalPaths: 0,
      legacyHardware: 47,
      legacySimulator: 3,
    });
    expect(gpuCapabilitiesPage.workedExample.manifestState).toEqual({
      closure: "not-produced",
      productionPath: "legacy-only (legacy)",
      proof: "missing",
      neutralTarget: "not-evaluated",
      backendTarget: "legacy-only",
      simulator: "unavailable",
      hardware: "available-legacy-only",
      negatives: "missing",
    });
    expect(JSON.stringify(gpuCapabilitiesPage)).not.toContain("KIR V12");
  });

  it("indexes V13, W4, evidence classes, and machine refinement", () => {
    for (const query of [
      "GPU capabilities target closure",
      "KIR V13 exact W4",
      "Checked versus Proven",
      "machine refinement tiled GEMM",
      "safe launch dynamic precondition",
    ]) {
      expect(searchCatalog(query, lessons, glossary)).toContainEqual(
        expect.objectContaining({
          kind: "page",
          title: "GPU capability pipeline",
          href: "/gpu-capabilities",
          lessonId: "gemm-tiling",
        }),
      );
    }
  });
});
