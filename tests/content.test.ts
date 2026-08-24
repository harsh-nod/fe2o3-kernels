import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { curriculum, glossary, lessons } from "../src/content/curriculum";
import { currentState } from "../src/content/current-state";
import { FE2O3_PIN, evidenceLabels } from "../src/content/model";
import { narrativeFingerprint } from "../src/content/narrative-fingerprint";
import {
  developmentCheckpointIds,
  developmentCheckpoints,
  developmentCheckpointDetail,
  kernelProgress,
  progressSnapshot,
  tiledGemmV1Commits,
  validateProgress,
} from "../src/content/progress";
import {
  narrativeEntry,
  narrativeIds,
  narrativeRegistrySnapshot,
  validateNarrativeRegistry,
} from "../src/content/narrative-registry";
import {
  progressNarrativeRegistrySnapshot,
  SAFE_PROGRESS_DETAIL,
  validateProgressNarrativeRegistry,
} from "../src/content/progress-narrative-registry";
import {
  expectedCargoTestSourcePath,
  isExactCargoClippyCommand,
  parseExactCargoTestCommand,
  stagedEvidenceDetail,
  stagedEvidenceOrder,
  stagedEvidenceRecord,
  validateStagedEvidenceCatalog,
} from "../src/content/staged-evidence";
import {
  sourceMilestoneOrder,
  sourceMilestoneRecord,
  validateSourceMilestoneCatalog,
} from "../src/content/source-milestones";
import { validateCurriculum } from "../src/content/validate";

function serializedLessonContent(lessonId: string): string {
  const lesson = lessons.find((candidate) => candidate.id === lessonId);
  return JSON.stringify({
    lesson,
    narratives: lesson?.sections.flatMap((section) =>
      section.kind === "narrative"
        ? [narrativeEntry(section.narrativeId)]
        : [],
    ),
  });
}

function checkpointDetail(
  checkpoint: unknown,
): string {
  return checkpoint ? developmentCheckpointDetail(checkpoint) : "";
}

describe("curriculum integrity", () => {
  it("covers modules zero through eight in order", () => {
    expect(curriculum.map((module) => module.number)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(lessons).toHaveLength(21);
    expect(validateCurriculum(curriculum)).toEqual([]);
    expect(
      new Set(
        lessons.flatMap((lesson) =>
          lesson.sections.flatMap((section) =>
            section.kind === "narrative" ? [section.narrativeId] : [],
          ),
        ),
      ),
    ).toEqual(new Set(narrativeIds));
  });

  it("uses every evidence label", () => {
    const kinds = new Set(
      lessons.flatMap((lesson) => lesson.claims.map((claim) => claim.kind)),
    );
    expect(kinds).toEqual(new Set(Object.keys(evidenceLabels)));
  });

  it("pins every evidenced claim to exact source and commands", () => {
    for (const lesson of lessons) {
      for (const claim of lesson.claims) {
        if (claim.kind === "design-only") {
          expect(claim.reference).toBeUndefined();
          continue;
        }

        const reference = claim.reference;
        expect(reference?.commit).toMatch(/^[0-9a-f]{40}$/);
        expect(reference?.tree).toMatch(/^[0-9a-f]{40}$/);
        expect(reference?.commands.length).toBeGreaterThan(0);
        expect(reference?.sourcePaths.length).toBeGreaterThan(0);
        if (reference?.scope === "lesson-evidence") {
          expect(reference.commit).toBe(FE2O3_PIN.commit);
          expect(reference.tree).toBe(FE2O3_PIN.tree);
        } else if (reference?.scope === "source-milestone") {
          const record = sourceMilestoneRecord(reference.evidenceId);
          expect(reference.commit).toBe(record.commit);
          expect(reference.tree).toBe(record.tree);
          expect(reference.claim).toBe(record.claim);
          expect(reference.authority).toBe(record.authority);
        } else if (reference?.scope === "staged-progress") {
          expect(reference.claim).toBe(claim.kind);
          expect([
            "source-admission-only",
            "harness-only",
            "structural-admission-only",
            "kernel-ir-admission-only",
            "source-model-only",
            "source-shape-only",
            "machine-inspection-only",
            "wire-format-only",
            "inert-worker-handoff-only",
            "sealed-profile-registry-only",
          ]).toContain(reference.authority);
        }
        for (const path of reference?.sourcePaths ?? []) {
          expect(path).not.toMatch(/^\//);
          expect(path).not.toContain("..");
        }
      }
    }
  });

  it("requires every real source tab to match its pinned digest", () => {
    for (const lesson of lessons) {
      for (const tab of lesson.tabs) {
        if (tab.explanatory !== false) continue;
        expect(tab.sourcePath).toBeTruthy();
        expect(tab.sourceCommit).toMatch(/^[0-9a-f]{40}$/u);
        expect(tab.sourceSha256).toMatch(/^[0-9a-f]{64}$/u);
        expect(createHash("sha256").update(tab.code).digest("hex")).toBe(
          tab.sourceSha256,
        );
      }
    }
  });

  it("shows only safe Rust in every kernel tab", () => {
    for (const lesson of lessons) {
      for (const kernel of lesson.tabs.filter((tab) => tab.kind === "kernel")) {
        expect(kernel.code).not.toMatch(
          /\bunsafe\s*(?:\{|fn\b|impl\b|trait\b|extern\b)/u,
        );
      }
    }
  });

  it("keeps CPU semantic simulation exact and non-hardware", () => {
    const lesson = lessons.find(
      (candidate) => candidate.id === "cpu-semantic-simulation",
    );
    expect(lesson).toBeDefined();
    const kernel = lesson?.tabs.find((tab) => tab.kind === "kernel");
    expect(kernel).toMatchObject({
      explanatory: false,
      sourceCommit: currentState.compilerCommit,
      sourcePath:
        "crates/cargo-fe2o3/tests/fixtures/simulation-source-fill/src/lib.rs",
      sourceSha256:
        "19854910d7488530033bbf4c15ed6b32283e56f4f8b6ed64f7775d68597a46dd",
    });
    expect(kernel?.code).toBe(
      readFileSync("examples/cpu_simulation_kernel.rs", "utf8"),
    );
    const host = lesson?.tabs.find((tab) => tab.kind === "host")?.code ?? "";
    expect(host).toContain(
      readFileSync("examples/cpu_simulation_request.json", "utf8").trim(),
    );
    expect(host).toContain("cargo fe2o3 simulate");
    const result = lesson?.tabs.find((tab) => tab.kind === "result")?.code ?? "";
    for (const boundary of [
      "authority: observation_only",
      "simulated: true",
      "hardware_observed: false",
      "hardware_validation: false",
      "performance_prediction: false",
    ]) {
      expect(result).toContain(boundary);
    }
    expect(result).toContain(
      "kir.sha256: 64 lowercase hexadecimal digits (profile-specific)",
    );
    expect(result).toContain("kir.canonical_bytes: 626");
    expect(result).toContain("counts.invocations_executed: 4");
    expect(result).toContain("counts.workgroups_visited: 1");
    expect(result).toContain("counts.scheduled_slots_visited: 64");
    expect(result).toContain("0x11000000110000001100000011000000");
    const reference = lesson?.claims[0].reference;
    expect(reference).toMatchObject({
      scope: "current-implementation",
      commit: currentState.compilerCommit,
      tree: currentState.compilerTree,
      target: "amdgpu_64_little_endian_v1 (simulated scalar profile)",
    });
    expect(reference?.note).toContain("no GPU");
    const content = serializedLessonContent("cpu-semantic-simulation");
    expect(content).toContain("trusted, unsandboxed host code");
    expect(content).toContain(
      "hardware_observed: false describes fe2o3's simulator result",
    );
    expect(content).toContain("fresh ephemeral generation");
    expect(content).toContain(
      "without reusing an earlier simulation handoff or result",
    );

    expect(currentState.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ number: 215, state: "open" }),
        expect.objectContaining({ number: 216, state: "open" }),
      ]),
    );
    expect(
      currentState.capabilities.find(
        (capability) => capability.id === "semantic-debug-profile",
      )?.detail,
    ).toContain("no debugger or profiler UI");
    expect(
      currentState.capabilities.find(
        (capability) => capability.id === "cpu-semantic-simulation",
      )?.detail,
    ).toContain("trusted, unsandboxed host code");
  });

  it("pins the executable dynamic GEMM and historical tiled evidence separately", () => {
    const lesson = lessons.find((entry) => entry.id === "gemm-tiling");
    const kernel = lesson?.tabs.find((tab) => tab.kind === "kernel");
    expect(kernel).toMatchObject({
      sourcePath: "examples/tiled_gemm_general_v1/src/kernel.rs",
      sourceCommit: "6a86f5cbb5049cd6895d47e6734048ddd4d308d5",
      sourceSha256:
        "058c5dab9910124480974b69686b6a60a18016a50657286daa8df5c58d1aa48b",
      evidenceId: "dynamic-gemm-executable-source-v1",
      explanatory: false,
    });
    expect(kernel?.code).toContain("while phase < k as usize");
    expect(kernel?.code).toContain("matrix.multiply_accumulate(lhs, rhs, accumulator)");
    expect(kernel?.code).toContain("-> KernelResult");
    expect(kernel?.code).toContain(".ok_or(KernelError::OutOfBounds)?");
    expect(kernel?.code).toContain("let matrix = Matrix::current()");
    expect(kernel?.code).toContain("alpha * values[0] + beta * *output");
    expect(kernel?.code).not.toMatch(/\bunsafe\b/u);
    expect(lesson?.diagram).toBe("gemm-scalar");

    const hip = lesson?.tabs.find((tab) => tab.kind === "verus");
    expect(hip).toMatchObject({
      label: "Equivalent HIP",
      language: "cpp",
      sourcePath: "examples/tiled_gemm_general_v1/benchmark_hip.cpp",
      sourceCommit: "6a86f5cbb5049cd6895d47e6734048ddd4d308d5",
      sourceSha256:
        "24233c267c1bad3bde9c4897fb063d2e48d6d2fa07439dd04f4d0c14bd2ea84c",
      explanatory: false,
    });
    expect(hip?.code).toContain("__builtin_amdgcn_mfma_f32_16x16x16bf16_1k");

    const host = lesson?.tabs.find((tab) => tab.kind === "host");
    expect(host).toMatchObject({
      sourcePath: "examples/tiled_gemm_general_v1/src/main.rs",
      sourceCommit: "6a86f5cbb5049cd6895d47e6734048ddd4d308d5",
      sourceSha256:
        "21684aba1e3b562d86caebc9ee636001e83bac7d1e2e727feb0225df57456b94",
      explanatory: false,
    });
    expect(host?.code).toContain("multi-workgroup-dynamic-k");
    expect(host?.code).toContain("grid_dim: (workgroups, 1, 1)");

    const result = lesson?.tabs.find((tab) => tab.kind === "result")?.code ?? "";
    expect(result).toContain("112 correspondence blocks");
    expect(result).toContain("v_mfma_f32_16x16x16_bf16");
    expect(result).toContain("PASS strided-all-tails");
    expect(result).toContain("PASS multi-workgroup-dynamic-k");
    expect(result).toContain("PASS zero-k-epilogue");
    expect(result).toContain("Fe2O3 is safer and more expressive here; it is not faster than HIP yet");
    expect(result).toContain("137.551 us");
    expect(result).toContain("130.821 us");

    const proofLesson = lessons.find((entry) => entry.id === "gemm-proof-plan");
    expect(proofLesson?.tabs.find((tab) => tab.kind === "kernel")).toMatchObject({
      sourcePath: "examples/tiled_gemm_v1/src/kernel.rs",
      evidenceId: "tiled-gemm-safe-source-v1",
    });
    expect(proofLesson?.tabs.find((tab) => tab.kind === "verus")?.code).toContain(
      "--test lds_source_refinement",
    );

    const changed = structuredClone(curriculum);
    const changedKernel = changed
      .flatMap((module) => module.lessons)
      .find((entry) => entry.id === "gemm-tiling")
      ?.tabs.find((tab) => tab.kind === "kernel");
    if (changedKernel) changedKernel.sourceCommit = "main";
    expect(validateCurriculum(changed)).toContainEqual(
      expect.objectContaining({
        message: "code tab source is not pinned to an exact commit",
      }),
    );
  });

  it("keeps compiler diagnostics in the GEMM proof lesson", () => {
    const lesson = lessons.find((entry) => entry.id === "gemm-tiling");
    expect(lesson?.objectives).toContain(
      "Follow the dynamic K loop through target-neutral matrix fragments to a gfx942 MFMA.",
    );

    const contract = JSON.stringify(
      narrativeEntry("gemm-tiling/general-contract"),
    );
    expect(contract).toContain("Generic PLIRON safety passes are mandatory before lowering");
    expect(contract).toContain("mandatory workload-neutral safety sequence before Kernel IR lowering");
    expect(contract).toContain("memory bounds");
    expect(contract).toContain("atomic legality");
    expect(contract).toContain("global race freedom");
    expect(contract).toContain("barrier convergence");
    expect(contract).toContain("workgroup-memory must-initialization/publication by epoch");
    expect(contract).toContain("declared semantic refinement");
    expect(contract).toContain("bounded sparse affine index dataflow");
    expect(contract).toContain("contains no GEMM names, tile-size tests, or schedule recognizers");
    expect(contract).toContain("ThreadIndex/DisjointSlice dynamic access");
    expect(contract).toContain("Tiled2D ownership");
    expect(contract).toContain("matrix terminals");
    expect(contract).toContain("connected from ordinary safe Rust through LLVM and qualification launch");
    expect(contract).toContain("Unsupported effects and ownership forms still fail closed");
    expect(contract).toContain("current kernel already uses BF16/F32 MFMA");
    expect(contract).toContain("remaining schedule optimization is cooperative LDS staging");
    expect(contract).toContain("ceil_div(K,16)");
    expect(contract).toContain("defined BF16 +0");
    expect(contract).toContain("unconditional publish barrier");
    expect(contract).toContain("alpha*acc[m,n] + beta*C[m,n]");
    expect(contract).toContain("Ten safe UI fixtures");
    expect(contract).toContain("not fe2o3 semantic proof diagnostics");
    expect(contract).toContain("unsafe never discharges or bypasses a verifier obligation");
    for (const [obligation, code] of [
      ["memory_safe", "0x46470101"],
      ["bounds_safe", "0x46470102"],
      ["initialized", "0x46470103"],
      ["race_free", "0x46470104"],
      ["barrier_convergent", "0x46470105"],
      ["output_region_injective", "0x46470106"],
      ["lds_epoch_correct", "0x46470107"],
      ["accumulator_phase_refinement", "0x46470108"],
      ["tail_refinement", "0x46470109"],
      ["epilogue_refinement", "0x4647010a"],
      ["numerical_contract", "0x4647010b"],
      ["machine_refinement_boundary", "0x4647010c"],
    ]) {
      expect(contract).toContain(obligation);
      expect(contract).toContain(code);
    }
    for (const code of [
      "0x46470001",
      "0x46470002",
      "0x46470003",
      "0x46470004",
      "0x46470005",
      "0x46470006",
    ]) {
      expect(contract).toContain(code);
    }

    const semanticFailures = narrativeEntry("compiler-checks/catalog");
    const failures = JSON.stringify([semanticFailures, narrativeEntry("gemm-tiling/mutation-diagnostics")]);
    expect(failures).toContain("Compile-time kernel diagnostics");
    expect(failures).toContain("none recognizes GEMM names, tile sizes, or schedules");
    expect(failures).toContain("Generic does not mean automatically provable");
    expect(failures).toContain("strict pre-lowering route fails closed");
    expect(failures).toContain("does not invent the programmer's intended formula");
    expect(failures).toContain("Ordinary kernels are safe Rust");
    expect(failures).toContain("One Rust type system, extended to GPU facts");
    expect(failures).toContain("does not implement a second borrow checker");
    expect(failures).toContain("What KernelResult means");
    expect(failures).toContain("physical unit-return GPU entry wrapper");
    expect(failures).toContain("Err is not a host-visible error payload");
    expect(failures).toContain("lane-varying ?");
    expect(failures).toContain("canonical Kernel IR V6");
    expect(failures).toContain("Where Verus fits");
    expect(failures).toContain("do not establish a general operational Rust-source-to-Kernel-IR-to-machine refinement theorem");
    expect(failures).toContain("unsafe_asm");
    expect(failures).toContain("Kernel tabs are current safe source");
    expect(failures).toContain("contains no unsafe block");
    expect(failures).toContain("do not transfer authority");
    for (const capability of [
      "DisjointIndex",
      "Shifted",
      "GridExclusive",
      "Blocked",
      "DisjointBlock",
      "current wave/collective/LDS/matrix capabilities",
      "DeviceGlobalMutPtr<T>::as_atomic()",
    ]) {
      expect(failures).toContain(capability);
    }
    expect(failures).toContain("compiled SourceFileHash against the reviewed source root");
    expect(failures).toContain("A crate name or same-named replacement is not sufficient");
    expect(failures).toContain("Supported safe ownership mappings");

    const rustSemanticsTable = semanticFailures.blocks.find(
      (block) => block.type === "table" && block.headers[0] === "Rust form",
    );
    expect(rustSemanticsTable?.type).toBe("table");
    expect(JSON.stringify(rustSemanticsTable)).toContain("KernelResult and ?");
    expect(JSON.stringify(rustSemanticsTable)).toContain("non-Copy, non-Clone capability");

    const ownershipTable = semanticFailures.blocks.find(
      (block) => block.type === "table" && block.headers[0] === "Safe ownership form",
    );
    expect(ownershipTable?.type).toBe("table");
    if (ownershipTable?.type !== "table") return;
    expect(ownershipTable.rows.map(([mapping, state]) => [mapping, state])).toEqual([
      ["thread::index_1d() with DisjointSlice::get_mut", "Supported"],
      ["Shifted<Index1D, N>", "Supported for one shift layer"],
      ["GridExclusive with a constant leader index", "Supported"],
      ["Blocked<Index1D, 1, E> with DisjointBlock", "Supported for nonzero E and a constant component"],
      ["Blocked<Index1D, L, E> where L > 1", "Incomplete"],
      ["Malformed or substituted ownership mapping", "Rejected"],
    ]);
    expect(JSON.stringify(ownershipTable)).toContain("Nested Shifted<Shifted<...>> is rejected");
    expect(JSON.stringify(ownershipTable)).toContain("dynamic or unresolved leader index is Incomplete");
    expect(JSON.stringify(ownershipTable)).toContain("Wrong marker identity");
    expect(failures).toContain(
      "fixed Kernel IR order is structural, control flow, memory bounds, race freedom, barrier convergence, then workgroup memory",
    );
    expect(failures).toContain(
      "ranked-PLIRON pre-lowering order is memory bounds, atomic legality, race freedom, barrier convergence, workgroup memory, then declared semantic refinement",
    );
    expect(failures).toContain("No lowering pass may run between these checks");
    expect(failures).toContain("Complete generic PLIRON diagnostic code catalog");
    for (const fixture of [
      "unguarded_a_tail_load",
      "unguarded_b_tail_load",
      "unguarded_c_tail_store",
      "duplicate_lane_c_write",
      "overlapping_workgroup_c_tile",
      "duplicate_lds_write",
      "lds_read_before_initialization",
      "missing_publish_barrier",
      "divergent_barrier",
      "missing_reuse_barrier",
      "expired_lds_epoch",
      "staged_read_before_wait",
      "accumulator_reset",
      "incorrect_k_tail_zero_fill",
      "incorrect_alpha_beta_epilogue",
    ]) {
      expect(failures).toContain(fixture);
    }
    expect(failures).toContain("Rust typestate UI");
    expect(failures).toContain("Sealed-surface UI plus verifier");
    expect(failures).toContain("Verifier-only; remains well-typed");
    expect(failures).toContain("A rustc UI error is not a proof diagnostic");
    expect(failures).toContain("All 15 are rejected as structured KIR");
    expect(failures).toContain(
      "not authenticated source derivation of all 15 graphs",
    );
    expect(failures).toContain("All 15 exact safe source mutations are diagnostic");
    expect(failures).toContain("retains the valid_proof_sensitive root");
    expect(failures).toContain("failed at compiler preflight");
    expect(failures).toContain("empty artifact directory");
    expect(failures).toContain("Executable direct-global MFMA source");
    expect(failures).toContain("Cooperative-LDS positive source");
    expect(failures).toContain("without issuing a positive receipt or frontend correspondence");
    expect(failures).toContain("analysis fails closed");
    expect(failures).toContain("safe-code root and reachable helper MIR");
    expect(failures).toContain("Private final pair join");
    expect(failures).toContain("stops before receipt, correspondence, configuration, and proof");
    expect(failures).toContain("second downstream blocker");
    expect(failures).toContain("never reaches configuration or proof execution");
    expect(failures).toContain("Current MFMA qualification");
    expect(failures).toContain("Legacy LDS-family flags remain false");
    expect(failures).toContain("TILED_SOURCE_TO_IR=false");
    expect(failures).toContain("TILED_LOWERING=false");
    expect(failures).toContain("TILED_PROTECTED_EXECUTION=false");

    const outcomeTable = semanticFailures.blocks.find(
      (block) => block.type === "table" && block.headers[0] === "Outcome",
    );
    expect(outcomeTable?.type).toBe("table");
    if (outcomeTable?.type !== "table") return;
    expect(outcomeTable.rows.map(([outcome]) => outcome)).toEqual([
      "Clean",
      "Rejected",
      "Incomplete",
    ]);
    expect(JSON.stringify(outcomeTable)).toContain(
      "Incomplete does not claim that a concrete bug was proved",
    );

    const pipelineTable = semanticFailures.blocks.find(
      (block) => block.type === "table" && block.headers[0] === "Analysis ID",
    );
    expect(pipelineTable?.type).toBe("table");
    if (pipelineTable?.type !== "table") return;
    expect(pipelineTable.rows.map(([pass]) => pass)).toEqual([
      "kernel-structural-v1",
      "kernel-control-flow-v1",
      "kernel-memory-bounds-v1",
      "kernel-atomic-legality-v1",
      "kernel-race-freedom-v1",
      "kernel-barrier-convergence-v1",
      "kernel-workgroup-memory-v1",
      "kernel-semantic-refinement-v1",
      "pliron-sparse-index-v1 (shared analysis)",
      "bounded resources (cross-cutting)",
    ]);
    expect(JSON.stringify(pipelineTable)).toContain("irreducible control flow");
    expect(JSON.stringify(pipelineTable)).toContain("compatible atomics");
    expect(JSON.stringify(pipelineTable)).toContain("rather than guessing intent");

    const diagnosticTable = semanticFailures.blocks.find(
      (block) => block.type === "table" && block.headers[0] === "Diagnostic",
    );
    expect(diagnosticTable?.type).toBe("table");
    if (diagnosticTable?.type !== "table") return;
    expect(diagnosticTable.rows.map(([code]) => code)).toEqual([
      "FE2O3-BOUNDS-000",
      "FE2O3-BOUNDS-001",
      "FE2O3-BOUNDS-002",
      "FE2O3-BOUNDS-003",
      "FE2O3-ATOMIC-001",
      "FE2O3-ATOMIC-002",
      "FE2O3-ATOMIC-003",
      "FE2O3-RACE-000",
      "FE2O3-RACE-001",
      "FE2O3-RACE-002",
      "FE2O3-RACE-003",
      "FE2O3-BARRIER-000",
      "FE2O3-BARRIER-001",
      "FE2O3-BARRIER-002",
      "FE2O3-WORKGROUP-000",
      "FE2O3-WORKGROUP-001",
      "FE2O3-WORKGROUP-002",
      "FE2O3-WORKGROUP-003",
      "FE2O3-SEMANTIC-000",
      "FE2O3-SEMANTIC-001",
      "FE2O3-SEMANTIC-002",
    ]);
    expect(diagnosticTable.rows.filter(([, kind]) => kind === "Rejected")).toHaveLength(7);
    expect(diagnosticTable.rows.filter(([, kind]) => kind === "Incomplete")).toHaveLength(9);
    expect(diagnosticTable.rows.filter(([, kind]) => kind === "Prerequisite")).toHaveLength(5);

    const failureGallery = semanticFailures.blocks.find(
      (block) => block.type === "compile-failures",
    );
    expect(failureGallery?.type).toBe("compile-failures");
    if (failureGallery?.type !== "compile-failures") return;
    expect(failureGallery.examples).toHaveLength(6);
    expect(failureGallery.intro).toContain("fixed workload-neutral PLIRON verifier sequence");
    expect(failureGallery.intro).toContain(
      "Bounds and barrier convergence are exercised end to end",
    );
    expect(failureGallery.intro).toContain("static index 64 into extent 64");
    expect(failureGallery.intro).toContain("parsed textual PLIRON lit fixtures");
    expect(failureGallery.intro).toContain("explicitly unsupported and fail closed");
    expect(
      failureGallery.examples.map(({ id, property, stage, code }) => ({
        id,
        property,
        stage,
        code,
      })),
    ).toEqual([
      { id: "bounds_static_oob", property: "MemoryBounds", stage: "generic PLIRON pass 1/6", code: "FE2O3-BOUNDS-001" },
      { id: "atomic_invalid_ordering", property: "AtomicLegality", stage: "generic PLIRON pass 2/6", code: "FE2O3-ATOMIC-001" },
      { id: "race_duplicate_output", property: "RaceFreedom", stage: "generic PLIRON pass 3/6", code: "FE2O3-RACE-001" },
      { id: "barrier_divergent", property: "BarrierConvergence", stage: "generic PLIRON pass 4/6", code: "FE2O3-BARRIER-001" },
      { id: "workgroup_uninitialized", property: "WorkgroupMemory", stage: "generic PLIRON pass 5/6", code: "FE2O3-WORKGROUP-001" },
      { id: "semantic_mismatch", property: "SemanticRefinement", stage: "generic PLIRON pass 6/6", code: "FE2O3-SEMANTIC-001" },
    ]);
    for (const example of failureGallery.examples) {
      expect(example.source).not.toContain("unsafe");
      expect(example.source).not.toContain("KernelContext");
      expect(example.diagnostic).toContain(example.code);
      expect(example.diagnostic).toContain("error[");
      expect(example.caught.length).toBeGreaterThan(80);
    }
    expect(failureGallery.examples[0]?.source).toContain("values[64]");
    expect(failureGallery.examples[0]?.diagnostic).toContain(
      "required: 64 < 64",
    );
    expect(failureGallery.examples[1]?.diagnostic).toContain("invalid Release ordering");
    expect(failureGallery.examples[2]?.diagnostic).toContain("invocation [0]");
    expect(failureGallery.examples[2]?.diagnostic).toContain("invocation [1]");
    expect(failures).toContain("Ordinary Rust atomic terminals are explicitly unsupported");
    expect(failures).toContain("Rust Ordering does not imply a GPU memory scope");
    expect(failures).toContain("projection preserves the exact operation kind, ordering, and scope");
    expect(failures).toContain("FE2O3-ATOMIC-002 Incomplete");
  });

  it("teaches row softmax from exact source while preserving evidence boundaries", () => {
    const lesson = lessons.find((entry) => entry.id === "softmax-invariant");
    const kernel = lesson?.tabs.find((tab) => tab.kind === "kernel");
    expect(kernel).toMatchObject({
      sourcePath: "examples/row_softmax_general_v1/src/kernel.rs",
      sourceCommit: "3127eae84ef1c8f539d56bfb418ec859ba0dd706",
      sourceSha256:
        "b1d742be6f4d782ff45afea4b61ed98294fa699c01882453bc35e60e0ad95ad0",
      explanatory: false,
    });
    expect(createHash("sha256").update(kernel?.code ?? "").digest("hex")).toBe(
      kernel?.sourceSha256,
    );
    expect(kernel?.code).toContain("#[kernel(");
    expect(kernel?.code).toContain("control_flow(loop_bounds(64, 64, 64))");
    expect(kernel?.code).toContain("Math::current()");
    expect(kernel?.code).toContain("Subgroup::current()");
    expect(kernel?.code).toContain("-> KernelResult");
    expect(kernel?.code).toContain("subgroup_reduce_max_f32::<64>");
    expect(kernel?.code).toContain("subgroup_reduce_sum_f32::<64>");
    expect(kernel?.code).toContain("checked_tiled_2d::<64, 64, 64, 64>");

    const proof = lesson?.tabs.find((tab) => tab.kind === "verus");
    expect(proof).toMatchObject({
      sourcePath: "examples/row_softmax_v1/verus/row_softmax_v1.rs",
      sourceCommit: "dd841720591003f418d056b21a319088ce4559d6",
      explanatory: true,
    });
    expect(proof?.code).toContain("active_element_address_is_in_row_v1");
    expect(proof?.code).toContain(
      "separate_input_and_output_accesses_do_not_alias_v1",
    );

    const host = lesson?.tabs.find((tab) => tab.kind === "host");
    expect(host).toMatchObject({
      sourcePath: "examples/row_softmax_general_v1/src/main.rs",
      sourceCommit: "3127eae84ef1c8f539d56bfb418ec859ba0dd706",
      sourceSha256:
        "f3ec05ee1bcbb0cea08bf90ee87121996dde519905a93469dd59442dd34f9a8b",
      explanatory: false,
    });
    expect(host?.code).toContain("grid_dim: (case.rows, 1, 1)");
    expect(host?.code).toContain("maximum-width");
    expect(host?.code).toContain("wrote output padding");

    const result = lesson?.tabs.find((tab) => tab.kind === "result")?.code ?? "";
    expect(result).toContain("Dynamic row softmax qualification on MI300X/gfx942");
    expect(result).toContain("PASS single-column");
    expect(result).toContain("PASS maximum-width");
    expect(result).toContain("four ranked dynamic-index obligations");
    expect(result).toContain("12 ds_bpermute instructions and no MFMA");
    expect(result).toContain("not a proof for every input or a performance claim");

    const proofNarrative = narrativeEntry("softmax-invariant/proof");
    expect(JSON.stringify(proofNarrative)).toContain("PLIRON verification");
    expect(JSON.stringify(proofNarrative)).toContain(
      "The compiler does not know this is softmax",
    );
    expect(JSON.stringify(proofNarrative)).toContain(
      "never matches a softmax name or loop pattern",
    );
  });

  it("pins exact source-only kernel snapshots", () => {
    expect(sourceMilestoneOrder).toEqual([
      "dynamic-gemm-executable-source-v1",
      "tiled-gemm-safe-source-v1",
      "wave64-collectives-source-v1",
      "workgroup-sync-source-v1",
      "flash-attention-source-v1",
      "flash-attention-verus-v1",
      "moe-top2-source-v1",
      "moe-top2-verus-v1",
      "moe-expert-source-v1",
      "moe-expert-verus-v1",
    ]);
    expect(validateSourceMilestoneCatalog()).toEqual([]);

    const profiles = [
      {
        lessonId: "reductions-scans",
        evidenceId: "wave64-collectives-source-v1",
        sourcePath: "examples/wave64_collectives_v1/src/kernel.rs",
        bundledPath: "examples/wave64_collectives_v1/src/kernel.rs",
        sha256:
          "c649e38712232ed45c1d2f6f8a2a49405f12a5e308907b3265c2415f227803a2",
        sourceCommit: "ae312f421872e1eb9885217888548d74f79c3357",
      },
      {
        lessonId: "lds-barriers-atomics",
        evidenceId: "workgroup-sync-source-v1",
        sourcePath: "examples/workgroup_sync_v1/src/kernel.rs",
        bundledPath: "examples/workgroup_sync_v1/src/kernel.rs",
        sha256:
          "1a28ca6d97d180c347be41ce65377d67e44773c539aa73610808585aedf125bf",
        sourceCommit: "ae312f421872e1eb9885217888548d74f79c3357",
      },
      {
        lessonId: "moe-routing",
        evidenceId: "moe-top2-source-v1",
        sourcePath: "examples/moe_top2_v1/src/kernel.rs",
        bundledPath: "examples/moe_top2_v1/src/kernel.rs",
        sha256:
          "0260f144150e6fee7d9bd6a3d919e99ded0e43666509770f6e6186f5100fee25",
        sourceCommit: "ae312f421872e1eb9885217888548d74f79c3357",
      },
    ] as const;

    for (const profile of profiles) {
      const lesson = lessons.find((entry) => entry.id === profile.lessonId);
      const kernel = lesson?.tabs.find((tab) => tab.kind === "kernel");
      expect(kernel).toMatchObject({
        sourcePath: profile.sourcePath,
        sourceCommit: profile.sourceCommit,
        sourceSha256: profile.sha256,
        evidenceId: profile.evidenceId,
        explanatory: false,
      });
      const bundled = readFileSync(profile.bundledPath, "utf8");
      expect(kernel?.code).toBe(bundled);
      expect(createHash("sha256").update(bundled).digest("hex")).toBe(
        profile.sha256,
      );
      expect(kernel?.code).toContain("#[kernel(");
      expect(kernel?.code).not.toMatch(/macro_rules!\s+[A-Za-z_]/u);

      for (const kind of ["host", "result"] as const) {
        expect(
          lesson?.tabs.find((tab) => tab.kind === kind)?.explanatory,
        ).toBe(true);
      }
      expect(lesson?.tabs.find((tab) => tab.kind === "verus")?.explanatory).toBe(
        profile.lessonId !== "moe-routing",
      );
      const result = lesson?.tabs.find((tab) => tab.kind === "result")?.code;
      const gaps = profile.lessonId === "moe-routing"
        ? [
            "W0 authenticated HostLinkClosureV1",
            "W1 broker cargo-fe2o3 executable identity",
            "protected GPU output",
            "authenticated proof consumption",
            "IEEE FP32/compiler/logical-address refinement",
            "source/model-to-machine refinement",
          ]
        : profile.lessonId === "lds-barriers-atomics"
          ? [
              "source/compiler/machine refinement",
              "generalized illegal-access safety",
              "generalized race freedom",
            ]
          : profile.lessonId === "reductions-scans"
            ? ["Compiler and Verus-to-machine refinement"]
          : [
            "compiler collector/lowering",
            "compiler profile and descriptor",
            "finalizer",
            "generated host/runtime",
            "protected gfx942 execution",
          ];
      for (const gap of gaps) {
        expect(result).toContain(gap);
      }
      if (profile.lessonId === "reductions-scans") {
        expect(result).toContain("protected four-mask gfx942 observation");
      } else if (profile.lessonId === "lds-barriers-atomics") {
        expect(result).toContain("bounded protected MI300X observation");
        expect(result).toContain("exact-profile evidence only");
      } else {
        expect(result).toContain("No functional hardware result is claimed");
      }
    }

    const proofProfiles = [
      {
        lessonId: "flash-attention",
        evidenceId: "flash-attention-verus-v1",
        bundledPath: "examples/flash_attention_v1/verus/flash_attention_v1.rs",
        sha256:
          "e98b9fffc6e4c2fbcc5bca0ca706ac6575f93814afecf67be73de0f2d087d467",
        sourceCommit: "ae312f421872e1eb9885217888548d74f79c3357",
      },
      {
        lessonId: "moe-routing",
        evidenceId: "moe-top2-verus-v1",
        bundledPath: "examples/moe_top2_v1/verus/moe_top2_v1.rs",
        sha256:
          "aee6c405f3e95be25bf0575a419ff6591153fce7ff9e950f7d3e5889188e354c",
        sourceCommit: "ae312f421872e1eb9885217888548d74f79c3357",
      },
      {
        lessonId: "moe-expert-compute",
        evidenceId: "moe-expert-verus-v1",
        bundledPath:
          "examples/moe_expert_v1/verus/moe_expert_memory_v1.rs",
        sha256:
          "617e6741c5f1415a8e792e5e36e3526c04ba18903438e3af178bb107766383d1",
        sourceCommit: "ae312f421872e1eb9885217888548d74f79c3357",
      },
    ] as const;
    for (const profile of proofProfiles) {
      const proof = lessons
        .find((entry) => entry.id === profile.lessonId)
        ?.tabs.find((tab) => tab.kind === "verus");
      const bundled = readFileSync(profile.bundledPath, "utf8");
      expect(proof).toMatchObject({
        code: bundled,
        sourcePath: profile.bundledPath,
        sourceCommit: profile.sourceCommit,
        sourceSha256: profile.sha256,
        evidenceId: profile.evidenceId,
        explanatory: false,
      });
      expect(createHash("sha256").update(bundled).digest("hex")).toBe(
        profile.sha256,
      );
    }

    const atomicPath = "examples/workgroup_sync_v1/src/scoped_atomic.rs";
    const atomic = readFileSync(atomicPath, "utf8");
    expect(createHash("sha256").update(atomic).digest("hex")).toBe(
      "0531f894d0c6c94af9258717cf7ed52fab8f68785b361bd261f154ac9cf7ce14",
    );
    const synchronizationClaim = lessons
      .find((entry) => entry.id === "lds-barriers-atomics")
      ?.claims.find(
        (claim) => claim.reference?.scope === "source-milestone",
      );
    expect(synchronizationClaim?.reference?.sourcePaths).toContain(atomicPath);
    expect(atomic).toContain("DeviceGlobalMutPtr<u32>");
  });

  it("rejects incomplete or substituted promoted source provenance", () => {
    const mutateCollectivesKernel = (
      mutate: (kernel: Record<string, unknown>) => void,
    ) => {
      const changed = structuredClone(curriculum);
      const kernel = changed
        .flatMap((module) => module.lessons)
        .find((entry) => entry.id === "reductions-scans")
        ?.tabs.find((tab) => tab.kind === "kernel");
      expect(kernel).toBeDefined();
      mutate(kernel as unknown as Record<string, unknown>);
      return validateCurriculum(changed);
    };

    expect(
      mutateCollectivesKernel((kernel) => delete kernel.sourceSha256),
    ).toContainEqual(
      expect.objectContaining({
        message: "promoted algorithm kernel lacks exact source provenance",
      }),
    );
    expect(
      mutateCollectivesKernel((kernel) => {
        kernel.sourceSha256 = "0".repeat(64);
      }),
    ).toContainEqual(
      expect.objectContaining({
        message: "real source tab does not match its exact source milestone",
      }),
    );
    expect(
      mutateCollectivesKernel((kernel) => {
        kernel.sourceCommit = "main";
      }),
    ).toContainEqual(
      expect.objectContaining({
        message: "code tab source is not pinned to an exact commit",
      }),
    );
  });

  it("rejects promoted GEMM tabs without exact evidence linkage", () => {
    const mutateKernel = (mutate: (kernel: Record<string, unknown>) => void) => {
      const changed = structuredClone(curriculum);
      const kernel = changed
        .flatMap((module) => module.lessons)
        .find((entry) => entry.id === "gemm-tiling")
        ?.tabs.find((tab) => tab.kind === "kernel");
      expect(kernel).toBeDefined();
      mutate(kernel as unknown as Record<string, unknown>);
      return validateCurriculum(changed);
    };

    expect(
      mutateKernel((kernel) => delete kernel.evidenceId),
    ).toContainEqual(
      expect.objectContaining({
        message:
          "promoted algorithm kernel tab lacks exact source and evidence linkage",
      }),
    );
    expect(
      mutateKernel((kernel) => {
        kernel.sourceCommit = "5a45239aeeda3ca64cf16beb7fb1d3589e649bfe";
      }),
    ).toContainEqual(
      expect.objectContaining({
        message: "code tab source commit does not match its evidence",
      }),
    );
    expect(
      mutateKernel((kernel) => {
        kernel.sourcePath = "examples/tiled_gemm_v1/src/oracle.rs";
      }),
    ).toContainEqual(
      expect.objectContaining({
        message: "code tab source path is not covered by its evidence",
      }),
    );
    expect(
      mutateKernel((kernel) => {
        kernel.evidenceId = "unknown-evidence";
      }),
    ).toContainEqual(
      expect.objectContaining({
        message: "code tab has no recognized evidence linkage",
      }),
    );
    expect(
      mutateKernel((kernel) => {
        kernel.explanatory = true;
      }),
    ).toContainEqual(
      expect.objectContaining({
        message: "promoted algorithm kernel must be marked real",
      }),
    );
  });

  it("requires complete staged evidence references mechanically", () => {
    const mutations: Array<{
      field: string;
      value: unknown;
      message: string;
    }> = [
      {
        field: "commit",
        value: undefined,
        message: "claim has no exact commit",
      },
      { field: "tree", value: undefined, message: "claim has no exact tree" },
      { field: "commands", value: [], message: "claim has no exact command" },
      { field: "sourcePaths", value: [], message: "claim has no source path" },
      {
        field: "evidenceId",
        value: "unknown-staged-record",
        message: "staged reference has no recognized evidence id",
      },
      {
        field: "claim",
        value: "gpu-observed",
        message: "staged reference claim label does not match its claim",
      },
      {
        field: "authority",
        value: "",
        message: "staged reference has no recognized authority label",
      },
    ];

    for (const mutation of mutations) {
      const changed = structuredClone(curriculum);
      const lesson = changed
        .flatMap((module) => module.lessons)
        .find((entry) => entry.id === "evidence-archive");
      const reference = lesson?.claims.find(
        (claim) => claim.label === "Staged tiled source bridge",
      )?.reference;
      expect(reference?.scope).toBe("staged-progress");
      const mutable = reference as unknown as Record<string, unknown>;
      if (mutation.value === undefined) {
        delete mutable[mutation.field];
      } else {
        mutable[mutation.field] = mutation.value;
      }
      expect(validateCurriculum(changed)).toContainEqual(
        expect.objectContaining({ message: mutation.message }),
      );
    }
  });

  it("records every staged tiled statement with exact limited authority", () => {
    const lesson = lessons.find((entry) => entry.id === "evidence-archive");
    const staged = lesson?.claims.filter(
      (claim) => claim.reference?.scope === "staged-progress",
    );
    expect(
      staged?.map((claim) => ({
        label: claim.label,
        kind: claim.kind,
        evidenceId:
          claim.reference?.scope === "staged-progress"
            ? claim.reference.evidenceId
            : undefined,
        commit: claim.reference?.commit,
        tree: claim.reference?.tree,
        authority:
          claim.reference?.scope === "staged-progress"
            ? claim.reference.authority
            : undefined,
      })),
    ).toEqual([
      {
        label: "Staged tiled source bridge",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-source-bridge-v1",
        commit: "fb75e19a73ec0a9acebb203bd9821190b0592c82",
        tree: "0a57b2b6d14121da92dbbb2d7c4f9d8b4df4ce63",
        authority: "source-admission-only",
      },
      {
        label: "Staged Cargo metadata normalization",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-cargo-metadata-v1",
        commit: "b904f5b648c7eb249d32d73db427abe72970315a",
        tree: "a5b07af23c9fcf5f04ddcad1c18a6318469e6e06",
        authority: "source-admission-only",
      },
      {
        label: "Staged Cargo root normalization",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-cargo-root-v1",
        commit: "51bd129c31b08b636545f12229f34aaa431321f2",
        tree: "8be992dee9f145c73f61bb05f0066656298a7c75",
        authority: "source-admission-only",
      },
      {
        label: "Observed direct-global tiled GEMM tile",
        kind: "gpu-observed",
        evidenceId: "tiled-hardware-harness-v1",
        commit: "233b88f9722a0072d9a5fe3b9ccdc3dbaefdc1dd",
        tree: "03129e8e3badf707007a128a3d3a98e218b0df36",
        authority: "harness-only",
      },
      {
        label: "Staged tiled structural admission",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-structural-admission-v1",
        commit: "d43f11c86196e4f01c9ee305ea8d19f6d8c17672",
        tree: "1396be8ff4947a16ddc6aabae7390cc376992c61",
        authority: "structural-admission-only",
      },
      {
        label: "Bounded LDS Kernel IR",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-kernel-ir-v1",
        commit: "4c79c58de1da19d9b7a22cba906f301e347c8f7c",
        tree: "164414ee43e9df53d02f3d3b53e63c7b7ff36a52",
        authority: "kernel-ir-admission-only",
      },
      {
        label: "Fixed LDS source model",
        kind: "source-model-verified",
        evidenceId: "tiled-lds-verus-v1",
        commit: "97373b781ac3643b1de61b4572894f7028b565b0",
        tree: "f9b874cf641887a5295d58a2313ed9d7e5cb42cf",
        authority: "source-model-only",
      },
      {
        label: "Fail-closed attributed LDS source",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-attributed-source-v1",
        commit: "ee76cedcdc4126c69bc486a5ac12900c1c5485b1",
        tree: "cd0cec133dd5689c71c5d2795e125ea43cff4db3",
        authority: "source-shape-only",
      },
      {
        label: "Upstream LLVM/LLD LDS machine shape",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-machine-inspection-v1",
        commit: "50902b6fc4e861f4b93c40f13fb2e808b2bdc0c2",
        tree: "4bc6c5a4f46a0c7cb86cbd5542ff20f170b3f940",
        authority: "machine-inspection-only",
      },
      {
        label: "Bounded Slice 2 K-phase model",
        kind: "source-model-verified",
        evidenceId: "tiled-lds-kphase-model-v2",
        commit: "aba53376b4825c730ca9e9685e274e0c334e0e32",
        tree: "e05bf2ac73f31f2fda39762520d855031ddf7419",
        authority: "source-model-only",
      },
      {
        label: "Observed LDS Slice 1 execution",
        kind: "gpu-observed",
        evidenceId: "tiled-lds-hardware-observation-v1",
        commit: "79ad2298619baa4138b5edbf55e0d8044295bec2",
        tree: "2b7766ec5f003b1316853376a802ada4a9999d9b",
        authority: "harness-only",
      },
      {
        label: "Upstream LLVM/LLD K32 machine shape",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-k32-machine-inspection-v2",
        commit: "b94bd7d78604a6b7fe12f571f84cfc5f5b29eaba",
        tree: "70867ea4d2b360773480ded0a41f68b74722b209",
        authority: "machine-inspection-only",
      },
      {
        label: "Generated typed WG64 launch contract",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-wg64-contract-v1",
        commit: "280995762fce8a97f72fc2acb53c0d7effd2109f",
        tree: "782bcc60e1c5e12c32c0dabfd0975304a020d0bf",
        authority: "source-admission-only",
      },
      {
        label: "Bounded Slice 3 grid and stride model",
        kind: "source-model-verified",
        evidenceId: "tiled-lds-grid-stride-model-v3",
        commit: "5bc57587b458da6a77a0f1063e4697f846cc0946",
        tree: "165566f92afaf03eed7cea8ae2b927aca53e618c",
        authority: "source-model-only",
      },
      {
        label: "Authenticated attributed LDS source correspondence",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-source-ir-correspondence-v1",
        commit: "dc31f23eb2decaa91eb2f9d72ae4c70e94766564",
        tree: "092103d6daa2d8ebcd513627b7be9a3b182bfa60",
        authority: "source-admission-only",
      },
      {
        label: "Exact Slice 3 upstream LLVM/LLD machine shape",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-grid-machine-inspection-v3",
        commit: "f38fe82ca574eff0eb273d5a793f04b0df3e00e1",
        tree: "0375b991b20dcdb934797b039120f4ac279ee8cd",
        authority: "machine-inspection-only",
      },
      {
        label: "Exact tail-safe Slice 4 Kernel IR",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-edge-kernel-ir-v4",
        commit: "f24063534fd9c69d8c595608c75213db0570aa5e",
        tree: "8fd840624c50c25c74beb3371625a53a51956831",
        authority: "kernel-ir-admission-only",
      },
      {
        label: "Exact Slice 4 upstream LLVM/LLD machine shape",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-edge-machine-inspection-v4",
        commit: "35575cc32cde9744078a3026b14c5e0e0066157f",
        tree: "f7f43e9d92f98144daf5f003734fc2d9b77130d9",
        authority: "machine-inspection-only",
      },
      {
        label: "Identity-bound Slice 1 source/model correspondence",
        kind: "source-model-verified",
        evidenceId: "tiled-lds-source-model-correspondence-v1",
        commit: "5a45239aeeda3ca64cf16beb7fb1d3589e649bfe",
        tree: "1b8e2d3589082114a0bafe231d79262e6f8b22a1",
        authority: "source-model-only",
      },
      {
        label: "Canonical bounded matrix Kernel IR wire",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-matrix-wire-v5",
        commit: "1429ed6ae46e14317bb5b927c8d9cb1f66f268c7",
        tree: "0a2b79650673b2b9b42965307f2ac40d05324afe",
        authority: "wire-format-only",
      },
      {
        label: "Source-bound compiler descriptor and inert handoff",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-inert-worker-handoff-v1",
        commit: "7337a2b87dffa0845d092c13399b012f884de90b",
        tree: "6dd4d922e22cf488157cc0fece17edf64df98b7c",
        authority: "inert-worker-handoff-only",
      },
      {
        label: "Sealed exact Slice 1 compiler import",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-sealed-profile-registry-v1",
        commit: "89ebe69bb3daf8262a485463c5fdf04cf095346f",
        tree: "c2604487ec76f337d7ada2c0319fffd02b3ce8c9",
        authority: "sealed-profile-registry-only",
      },
    ]);
    expect(staged?.every((claim) => claim.reference?.commands.length)).toBe(true);
    expect(staged?.every((claim) => claim.reference?.sourcePaths.length)).toBe(true);
    expect(staged?.filter((claim) => claim.kind === "gpu-observed")).toHaveLength(2);
  });

  it("requires whole Cargo test suites and referenced integration targets", () => {
    expect(validateStagedEvidenceCatalog()).toEqual([]);
    const sealedRegistry = stagedEvidenceRecord(
      "tiled-lds-sealed-profile-registry-v1",
    );
    expect(sealedRegistry.commands).toEqual([
      "cargo test --locked -p fe2o3-hsaco-finalize --all-targets",
      "cargo test --locked -p fe2o3-hsaco-finalize --test lds_gemm_profile_registry",
      "cargo clippy --locked -p fe2o3-hsaco-finalize --all-targets --no-deps -- -D warnings",
    ]);
    expect(stagedEvidenceDetail([sealedRegistry.id])).toContain(
      "Only the exact M16 N16 K16 Slice 1 manifest is enabled",
    );
    expect(stagedEvidenceDetail([sealedRegistry.id])).toContain(
      "grants no finalizer, Worker V2, LLVM linker, publication, load, launch, hardware, numerical, or Verus proof authority",
    );
    expect(
      stagedEvidenceRecord("tiled-structural-admission-v1").commands,
    ).toEqual([
      "cargo test -p fe2o3-kernel-descriptor --test tiled_gemm_v1",
      "cargo test -p fe2o3-hsaco-finalize --test worker_v2_hsaco_admission",
      "cargo test -p fe2o3-hsaco-finalize --test worker_v2_hsaco_finalization",
    ]);
    const hardwareCommand = stagedEvidenceRecord(
      "tiled-hardware-harness-v1",
    ).commands[0];
    const parsedHardwareCommand = parseExactCargoTestCommand(hardwareCommand);
    expect(hardwareCommand).toContain("cargo test --locked");
    expect(parsedHardwareCommand).toMatchObject({
      locked: true,
      packageName: "fe2o3-hsa-runtime",
      mode: "test",
      targetName: "tiled_gemm_v1_hardware",
      testName: "gfx942_tiled_gemm_v1_one_tile_raw_hardware_evidence",
      features: "hardware-test-hooks",
      environment: {
        FE2O3_RUN_GFX942_TILED_GEMM_V1_HARDWARE: "1",
        FE2O3_GFX942_TILED_GEMM_V1_HSACO:
          "/home/harsh/fe2o3-tiled-gemm-f494.hsaco",
        FE2O3_GFX942_TILED_GEMM_V1_SHA256:
          "681077be1108c57d9d887f94afdd0ec3700ed2c86d73e66d2b229d6b418d0c66",
        FE2O3_GFX942_TILED_GEMM_V1_KERNEL_SYMBOL: "tiled_gemm_v1",
        FE2O3_LLVM_OBJDUMP: "/opt/rocm-7.2.4/lib/llvm/bin/llvm-objdump",
        FE2O3_LLVM_OBJDUMP_SHA256:
          "e5bf27bb6ba178b4de94ac0d5da760b628672cd00d2ffeb40a4372fa6ad25140",
      },
    });
    const ldsHardwareCommand = stagedEvidenceRecord(
      "tiled-lds-hardware-observation-v1",
    ).commands[0];
    expect(parseExactCargoTestCommand(ldsHardwareCommand)).toMatchObject({
      locked: true,
      packageName: "fe2o3-hsa-runtime",
      mode: "test",
      targetName: "tiled_gemm_lds_v1_hardware",
      testName: "gfx942_tiled_gemm_lds_v1_observational_hardware_evidence",
      features: "hardware-test-hooks",
      environment: {
        FE2O3_RUN_GFX942_TILED_GEMM_LDS_V1_HARDWARE: "1",
        HSA_XNACK: "0",
        HIP_VISIBLE_DEVICES: "0",
        ROCR_VISIBLE_DEVICES: "0",
        FE2O3_LLC: "/absolute/canonical/llc",
        FE2O3_LLC_SHA256: "<sha256>",
        FE2O3_LLD: "/absolute/canonical/ld.lld",
        FE2O3_LLD_SHA256: "<sha256>",
        FE2O3_LLVM_OBJDUMP: "/absolute/canonical/llvm-objdump",
        FE2O3_LLVM_OBJDUMP_SHA256: "<sha256>",
      },
    });
    const parsedVerusCommand = parseExactCargoTestCommand(
      stagedEvidenceRecord("tiled-lds-verus-v1").commands[0],
    );
    expect(parsedVerusCommand).toMatchObject({
      locked: true,
      manifestPath: "examples/tiled_gemm_v1/Cargo.toml",
      mode: "test",
      targetName: "lds_proof_verus",
      environment: { VERUS: "/absolute/path/to/pinned/verus" },
    });
    expect(
      parsedVerusCommand
        ? expectedCargoTestSourcePath(parsedVerusCommand)
        : undefined,
    ).toBe("examples/tiled_gemm_v1/tests/lds_proof_verus.rs");
    const sourceModelCommands = stagedEvidenceRecord(
      "tiled-lds-source-model-correspondence-v1",
    ).commands;
    expect(parseExactCargoTestCommand(sourceModelCommands[0])).toMatchObject({
      locked: true,
      manifestPath: "examples/tiled_gemm_v1/Cargo.toml",
      mode: "test",
      release: false,
      targetName: "lds_source_refinement",
    });
    expect(parseExactCargoTestCommand(sourceModelCommands[1])).toMatchObject({
      environment: { VERUS: "/home/harsh/tools/verus-0.2026.08.02/verus" },
      locked: true,
      manifestPath: "examples/tiled_gemm_v1/Cargo.toml",
      mode: "package",
      release: false,
    });
    expect(parseExactCargoTestCommand(sourceModelCommands[2])).toMatchObject({
      environment: { VERUS: "/home/harsh/tools/verus-0.2026.08.02/verus" },
      locked: true,
      manifestPath: "examples/tiled_gemm_v1/Cargo.toml",
      mode: "package",
      release: true,
    });
    expect(isExactCargoClippyCommand(sourceModelCommands[3])).toBe(true);
    const machineCommand = stagedEvidenceRecord(
      "tiled-lds-machine-inspection-v1",
    ).commands[1];
    expect(parseExactCargoTestCommand(machineCommand)).toMatchObject({
      locked: true,
      packageName: "fe2o3-hsaco-finalize",
      targetName: "tiled_gemm_lds_v1_machine",
      testName:
        "upstream_llvm_lld_final_artifact_has_the_exact_slice_1_machine_shape",
      environment: {
        FE2O3_LLC: "/opt/rocm-7.2.4/lib/llvm/bin/llc",
        FE2O3_LLD: "/opt/rocm-7.2.4/lib/llvm/bin/ld.lld",
        FE2O3_LLVM_OBJDUMP: "/opt/rocm-7.2.4/lib/llvm/bin/llvm-objdump",
      },
    });
    const k32Commands = stagedEvidenceRecord(
      "tiled-lds-k32-machine-inspection-v2",
    ).commands;
    expect(parseExactCargoTestCommand(k32Commands[0])).toMatchObject({
      locked: true,
      packageName: "dialect-amdgcn",
      mode: "package",
    });
    expect(isExactCargoClippyCommand(k32Commands[1])).toBe(true);
    expect(parseExactCargoTestCommand(k32Commands[2])).toMatchObject({
      locked: true,
      packageName: "dialect-amdgcn",
      mode: "test",
      targetName: "tiled_gemm_lds_k32_v2",
      testName:
        "upstream_llvm_lld_final_artifact_has_the_exact_k32_machine_shape",
      environment: {
        FE2O3_OPT: "/opt/rocm-7.2.4/lib/llvm/bin/opt",
        FE2O3_LLC: "/opt/rocm-7.2.4/lib/llvm/bin/llc",
        FE2O3_LLD: "/opt/rocm-7.2.4/lib/llvm/bin/ld.lld",
        FE2O3_LLVM_OBJDUMP:
          "/opt/rocm-7.2.4/lib/llvm/bin/llvm-objdump",
        FE2O3_LLVM_READOBJ:
          "/opt/rocm-7.2.4/lib/llvm/bin/llvm-readobj",
      },
    });
    for (const id of stagedEvidenceOrder) {
      const record = stagedEvidenceRecord(id);
      for (const command of record.commands) {
        const parsed = parseExactCargoTestCommand(command);
        expect(parsed ?? isExactCargoClippyCommand(command)).toBeTruthy();
        if (!parsed) continue;
        const targetPath = parsed
          ? expectedCargoTestSourcePath(parsed)
          : undefined;
        if (targetPath) expect(record.sourcePaths).toContain(targetPath);
      }
    }

    expect(
      parseExactCargoTestCommand(
        "cargo test -p fe2o3-kernel-descriptor tiled_gemm_v1",
      ),
    ).toBeUndefined();
    expect(
      parseExactCargoTestCommand(
        "cargo test -p fe2o3-hsaco-finalize --test worker_v2_hsaco_admission tiled",
      ),
    ).toBeUndefined();
    expect(
      parseExactCargoTestCommand(
        "cargo test -p rustc-codegen-fe2o3 --lib collected_tiled_gemm_v1",
      ),
    ).toBeUndefined();
    expect(
      isExactCargoClippyCommand(
        "cargo clippy -p dialect-amdgcn --all-targets --all-features",
      ),
    ).toBe(false);
  });

  it("rejects no-hash hardware authority moved into lesson narrative", () => {
    const unsupportedObservation =
      "The hardware run establishes protected GPU execution authority.";
    expect(unsupportedObservation).not.toMatch(/[0-9a-f]{40}/u);
    const changed = structuredClone(curriculum);
    const section = changed
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.id === "gemm-proof-plan")
      ?.sections.find((candidate) => candidate.kind === "staged-evidence");
    const mutable = section as unknown as Record<string, unknown>;
    mutable.kind = "narrative";
    delete mutable.evidenceIds;
    mutable.narrativeId = "gemm-tiling/public-layout-proof";
    mutable.blocks = [
      {
        type: "paragraph",
        text: unsupportedObservation,
      },
    ];
    expect(validateCurriculum(changed)).toContainEqual(
      expect.objectContaining({
        message: "narrative section accepts only one canonical narrative ID",
      }),
    );
    expect(validateCurriculum(changed)).toContainEqual(
      expect.objectContaining({
        message: "lesson must contain exactly one canonical staged evidence section",
      }),
    );
  });

  it("rejects renamed and retyped staged checkpoints without evidence IDs", () => {
    const unsupportedAuthority =
      "The emitted machine code carries execution authority on the accelerator.";
    expect(unsupportedAuthority).not.toMatch(/[0-9a-f]{40}/u);
    const changed = structuredClone(developmentCheckpoints);
    const checkpoint = changed.find(
      (candidate) => candidate.id === "tiled-gemm-source-bridge",
    );
    const mutable = checkpoint as unknown as Record<string, unknown>;
    mutable.name = "Ordinary implementation note";
    mutable.kind = "narrative";
    delete mutable.stagedEvidenceIds;
    mutable.detail = unsupportedAuthority;
    expect(validateProgress(changed)).toContain(
      "tiled-gemm-source-bridge must retain canonical kind staged-evidence",
    );
    expect(validateProgress(changed)).toContain(
      "tiled-gemm-source-bridge fields do not match its canonical kind",
    );
    expect(validateProgress(changed)).toContain(
      "tiled-gemm-source-bridge must contain its complete canonical staged evidence IDs",
    );
    const rendered = developmentCheckpointDetail(checkpoint);
    expect(rendered).toBe(SAFE_PROGRESS_DETAIL);
    expect(rendered).not.toContain(unsupportedAuthority);
  });

  it("rejects progress authority prose stored on a checkpoint", () => {
    const unsupportedAuthority =
      "This checkpoint proves machine-code authority without further evidence.";
    const changed = structuredClone(developmentCheckpoints);
    const checkpoint = changed.find(
      (candidate) => candidate.id === "scalar-gemm-v1",
    );
    const mutable = checkpoint as unknown as Record<string, unknown>;
    mutable.detail = unsupportedAuthority;
    delete mutable.narrativeId;

    expect(validateProgress(changed)).toContain(
      "scalar-gemm-v1 fields do not match its canonical kind",
    );
    expect(validateProgress(changed)).toContain(
      "scalar-gemm-v1 does not bind its canonical progress narrative ID",
    );
    const rendered = developmentCheckpointDetail(checkpoint);
    expect(rendered).toBe(SAFE_PROGRESS_DETAIL);
    expect(rendered).not.toContain(unsupportedAuthority);
  });

  it("rejects renamed stable checkpoint IDs independently of display labels", () => {
    const changed = structuredClone(developmentCheckpoints);
    const checkpoint = changed.find(
      (candidate) => candidate.id === "tiled-gemm-source-bridge",
    );
    const mutable = checkpoint as unknown as Record<string, unknown>;
    mutable.id = "renamed-source-bridge";
    mutable.name = "Ordinary implementation note";
    expect(validateProgress(changed)).toContain(
      "development checkpoints do not contain the exact canonical ID order",
    );
    expect(validateProgress(changed)).toContain(
      "unknown development checkpoint id renamed-source-bridge",
    );
  });

  it("rejects unknown and prototype narrative IDs", () => {
    for (const invalidId of ["unknown-narrative", "__proto__"]) {
      const changed = structuredClone(curriculum);
      const section = changed[0].lessons[0].sections.find(
        (candidate) => candidate.kind === "narrative",
      );
      const mutable = section as unknown as Record<string, unknown>;
      mutable.narrativeId = invalidId;
      expect(validateCurriculum(changed)).toContainEqual(
        expect.objectContaining({ message: `unknown narrative id ${invalidId}` }),
      );
    }
  });

  it("rejects canonical narrative registry drift and unreviewed additions", () => {
    expect(validateNarrativeRegistry()).toEqual([]);
    expect(narrativeFingerprint("abc")).toBe(
      "6cc43f858fbb763301637b5af970e2a46b46f461f27e5a0f41e009c59b827b25",
    );
    const unsupportedAuthority =
      "The hardware result has unconditional execution authority.";
    expect(unsupportedAuthority).not.toMatch(/[0-9a-f]{40}/u);
    const changed = narrativeRegistrySnapshot();
    changed["gemm-tiling/public-layout-proof"].blocks[0] = {
      type: "paragraph",
      text: unsupportedAuthority,
    };
    expect(validateNarrativeRegistry(changed)).toContain(
      "gemm-tiling/public-layout-proof: canonical narrative text drift",
    );
    changed["unreviewed/new-claim"] = {
      sectionId: "new-claim",
      title: "Unreviewed claim",
      blocks: [],
    };
    expect(validateNarrativeRegistry(changed)).toContain(
      "registry does not contain the exact canonical narrative ID order",
    );
  });

  it("keeps frozen registries authoritative after detached mutations", () => {
    const unsupportedAuthority =
      "Mutated registry text grants unconditional machine authority.";
    expect(validateNarrativeRegistry()).toEqual([]);
    expect(validateProgressNarrativeRegistry()).toEqual([]);
    expect(validateStagedEvidenceCatalog()).toEqual([]);

    const narrative = narrativeEntry("first-fill/kernel-shape");
    const originalNarrativeText =
      narrative.blocks[0].type === "paragraph"
        ? narrative.blocks[0].text
        : "";
    expect(Object.isFrozen(narrative.blocks[0])).toBe(true);
    expect(
      Reflect.set(
        narrative.blocks[0] as object,
        "text",
        unsupportedAuthority,
      ),
    ).toBe(false);

    const narrativeSnapshot = narrativeRegistrySnapshot();
    const snapshotBlock =
      narrativeSnapshot["first-fill/kernel-shape"].blocks[0];
    if (snapshotBlock.type === "paragraph") {
      snapshotBlock.text = unsupportedAuthority;
    }
    expect(validateNarrativeRegistry(narrativeSnapshot)).toContain(
      "first-fill/kernel-shape: canonical narrative text drift",
    );
    expect(narrativeEntry("first-fill/kernel-shape").blocks[0]).toMatchObject({
      text: originalNarrativeText,
    });

    const progressSnapshotCandidate = progressNarrativeRegistrySnapshot();
    progressSnapshotCandidate["progress/scalar-gemm-v1"] = unsupportedAuthority;
    expect(validateProgressNarrativeRegistry(progressSnapshotCandidate)).toContain(
      "progress/scalar-gemm-v1: canonical progress narrative text drift",
    );
    const scalarCheckpoint = developmentCheckpoints.find(
      (candidate) => candidate.id === "scalar-gemm-v1",
    );
    expect(developmentCheckpointDetail(scalarCheckpoint)).not.toContain(
      unsupportedAuthority,
    );

    const staged = stagedEvidenceRecord("tiled-source-bridge-v1");
    expect(Object.isFrozen(staged.assertions[0])).toBe(true);
    expect(
      Reflect.set(
        staged.assertions[0] as object,
        "text",
        unsupportedAuthority,
      ),
    ).toBe(false);
    expect(stagedEvidenceDetail(["tiled-source-bridge-v1"])).not.toContain(
      unsupportedAuthority,
    );
  });

  it("rejects unknown staged evidence IDs", () => {
    const changed = structuredClone(curriculum);
    const section = changed
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.id === "gemm-proof-plan")
      ?.sections.find((candidate) => candidate.kind === "staged-evidence");
    const mutable = section as unknown as Record<string, unknown>;
    mutable.evidenceIds = ["unknown-staged-record"];
    expect(validateCurriculum(changed)).toContainEqual(
      expect.objectContaining({
        message: "unknown staged evidence id unknown-staged-record",
      }),
    );

    const changedProgress = structuredClone(developmentCheckpoints);
    const checkpoint = changedProgress.find(
      (candidate) => candidate.id === "tiled-gemm-source-bridge",
    );
    const mutableCheckpoint = checkpoint as unknown as Record<string, unknown>;
    mutableCheckpoint.stagedEvidenceIds = ["unknown-staged-record"];
    expect(validateProgress(changedProgress)).toContain(
      "tiled-gemm-source-bridge has unknown staged evidence id unknown-staged-record",
    );

    mutableCheckpoint.stagedEvidenceIds = ["__proto__"];
    expect(validateProgress(changedProgress)).toContain(
      "tiled-gemm-source-bridge has unknown staged evidence id __proto__",
    );
  });

  it("rejects staged prose that mismatches its evidence record", () => {
    const changedClaims = structuredClone(curriculum);
    const claim = changedClaims
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.id === "evidence-archive")
      ?.claims.find(
        (candidate) =>
          candidate.reference?.scope === "staged-progress" &&
          candidate.reference.evidenceId === "tiled-source-bridge-v1",
      );
    if (claim) claim.detail += " Unsupported extra staged assertion.";
    expect(validateCurriculum(changedClaims)).toContainEqual(
      expect.objectContaining({
        message: "staged claim is not derived from its atomic evidence record",
      }),
    );
  });

  it("scopes the acb3 pin to lesson evidence, not staged progress", () => {
    const lesson = lessons.find((entry) => entry.id === "read-the-evidence");
    const baseline = lesson?.claims.find(
      (claim) => claim.label === "Audited lesson baseline",
    );
    expect(baseline?.detail).toContain("Lesson evidence claims are pinned");
    expect(baseline?.detail).toContain(
      "separately gated implementation-progress snapshot",
    );
    expect(baseline?.reference).toMatchObject({
      scope: "lesson-evidence",
      commit: FE2O3_PIN.commit,
      tree: FE2O3_PIN.tree,
    });
    expect(JSON.stringify(lessons)).not.toMatch(
      /guarded hardware (?:run|result)/iu,
    );

    const compilerRefactor = JSON.stringify(
      narrativeEntry("read-the-evidence/compiler-refactor"),
    );
    expect(compilerRefactor).toContain(
      "2f7c4fd1dfef7b9056caab0880700e3da7eeef03",
    );
    expect(compilerRefactor).toContain(
      "96d4275e7efde8ef594ef34b1c28f95d3000c8dc",
    );
    expect(compilerRefactor).toContain(
      "opaque bridge preserves canonical KIR bytes unchanged",
    );
    expect(compilerRefactor).toContain(
      "not a second KIR serialization, semantic lowering",
    );
    expect(compilerRefactor).toContain("context-bound services");
    expect(compilerRefactor).toContain("terminal typed errors");
    expect(compilerRefactor).toContain("no fallback and no result after failure");
    expect(compilerRefactor).toContain(
      "2610651306ea3ba670f68d5d8b1e1159bcd521ed",
    );
    expect(compilerRefactor).toContain("non-executing");
    expect(compilerRefactor).toContain("issue #140");
    expect(compilerRefactor).toContain("does not complete issue #134, #135, or #140");
    expect(compilerRefactor).toContain(
      "make any explanatory lesson kernel functional",
    );
    expect(compilerRefactor).toContain(
      "pinned upstream LLVM target-machine APIs plus in-process LLD",
    );
    expect(compilerRefactor).toContain("No COMGR path is introduced");
    expect(compilerRefactor).toContain("Checked gfx942 device identity");
    expect(compilerRefactor).toContain("does not provide production queues");
    expect(compilerRefactor).toContain("does not detect GPU reset");
  });

  it("makes every glossary item searchable and navigable", () => {
    const lessonIds = new Set(lessons.map((lesson) => lesson.id));
    expect(glossary.length).toBeGreaterThan(50);
    for (const entry of glossary) {
      expect(entry.term.trim()).not.toBe("");
      expect(entry.definition.length).toBeGreaterThan(20);
      expect(lessonIds.has(entry.lessonId)).toBe(true);
    }
  });

  it("promotes only exact pinned sources among advanced lessons", () => {
    for (const lesson of lessons.filter((entry) => entry.module >= 4)) {
      const runnable = lesson.claims.some(
        (claim) => claim.kind === "runnable-now",
      );
      expect(runnable).toBe(lesson.id === "gemm-tiling");
      expect(lesson.tabs.find((tab) => tab.kind === "kernel")?.explanatory).toBe(
        [
          "gemm-tiling",
          "gemm-proof-plan",
          "softmax-invariant",
          "flash-attention",
          "moe-routing",
          "moe-expert-compute",
        ].includes(lesson.id)
          ? false
          : true,
      );
    }
  });
});

describe("implementation progress integrity", () => {
  it("gates the eventual public target on both public main refs", () => {
    expect(validateProgress()).toEqual([]);
    expect(developmentCheckpoints.map((checkpoint) => checkpoint.id)).toEqual(
      developmentCheckpointIds,
    );
    expect(progressSnapshot.auditedCommit).toBe(FE2O3_PIN.commit);
    expect(progressSnapshot).toMatchObject({
      reviewedOn: "2026-08-23",
      lastAuditedPublicCommit: "96b9890c3ad33ad8c6b4239a9b567728a176d65f",
      lastAuditedPublicTree: "f911f0c693238830ad6070b2674fb863857bfec1",
      eventualPublicCommit: "3127eae84ef1c8f539d56bfb418ec859ba0dd706",
      eventualPublicTree: "eb1bf46dd2a5d996391019eb3f35825753956611",
      publicationGate: {
        state: "deployment-gated-exact-target",
        requiredCommit: "3127eae84ef1c8f539d56bfb418ec859ba0dd706",
        requiredTree: "eb1bf46dd2a5d996391019eb3f35825753956611",
        requiredRefs: [
          "harsh-nod/fe2o3@refs/heads/main",
          "powderluv/fe2o3@refs/heads/main",
        ],
      },
    });
    expect(progressSnapshot.publicationGate.requirement).toContain(
      "required commit and required tree",
    );
    expect(developmentCheckpoints[0]).toMatchObject({
      name: "Published implementation snapshot (publication gated)",
      commit: progressSnapshot.eventualPublicCommit,
      state: "public",
    });
    expect(developmentCheckpointDetail(developmentCheckpoints[0])).toContain(
      "public-main documentation snapshot is publication-gated",
    );
    const compilerRefactor = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "compiler-refactor-infrastructure",
    );
    expect(compilerRefactor).toMatchObject({
      name: "Pliron ownership and device identity at 2f7c4fd1d",
      commit: "2f7c4fd1dfef7b9056caab0880700e3da7eeef03",
      state: "public",
      narrativeId: "progress/compiler-refactor-infrastructure",
    });
    const compilerRefactorDetail = developmentCheckpointDetail(compilerRefactor);
    expect(compilerRefactorDetail).toContain(
      "Upstream Pliron v0.17.0 commit 2610651306ea3ba670f68d5d8b1e1159bcd521ed",
    );
    expect(compilerRefactorDetail).toContain("PassPlan is bounded and non-executing");
    expect(compilerRefactorDetail).toContain("issue #140");
    expect(compilerRefactorDetail).toContain("Issues #134, #135, and #140 remain open");
    expect(compilerRefactorDetail).toContain("make an explanatory kernel functional");
    expect(compilerRefactorDetail).toContain(
      "opaque KIR bridge preserves canonical V1-V5 bytes",
    );
    expect(compilerRefactorDetail).toContain(
      "not a second KIR serialization or semantic lowering",
    );
    expect(compilerRefactorDetail).toContain("detached context-bound services");
    expect(compilerRefactorDetail).toContain("typed terminal errors");
    expect(compilerRefactorDetail).toContain(
      "no fallback and no result after failure",
    );
    expect(compilerRefactorDetail).toContain(
      "pinned upstream LLVM target-machine APIs plus in-process LLD",
    );
    expect(compilerRefactorDetail).toContain("no COMGR or pliron-llvm path");
    expect(compilerRefactorDetail).toContain("Pure-Rust KFD 1.18 encoding");
    expect(compilerRefactorDetail).toContain("checked MI300X identity");
    expect(compilerRefactorDetail).toContain("does not detect GPU reset");
    const currentNarrative = JSON.stringify(
      narrativeEntry("read-the-evidence/scalar-gemm-checkpoint"),
    );
    expect(currentNarrative).toContain("0 Complete / 97 Partial / 0 Missing / 12 N/A");
    expect(currentNarrative).toContain("normative 0/82/0/12");
    expect(currentNarrative).toContain("supplemental 0/15/0");
    expect(currentNarrative).toContain("No tutorial run/verify/evidence status");
    expect(currentNarrative).toContain("unrelated explanatory-source label");
    expect(
      developmentCheckpoints.find(
        (checkpoint) => checkpoint.id === "last-audited-public-baseline",
      ),
    ).toMatchObject({
      name: "Historical audited public baseline",
      commit: progressSnapshot.lastAuditedPublicCommit,
      state: "public",
    });
  });

  it("records the four accepted commits in the current publication checkpoint", () => {
    const worker = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "worker-v2-ack-harness-isolation",
    );
    expect(worker).toMatchObject({
      commit: "c703eaa271040b7c297e0d3b9ea8cc9fa470f327",
      state: "public",
    });
    expect(checkpointDetail(worker)).toContain("tree c75b6cb9d70c6984bb375d09f095580eb2f7581a");
    expect(checkpointDetail(worker)).toContain("test-harness determinism repair only");

    const source = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "row-softmax-ordinary-source",
    );
    expect(source).toMatchObject({
      commit: "f4dcafb8b95345a5203a7f2c9886f9600345405f",
      state: "public",
    });
    expect(checkpointDetail(source)).toContain("Complete syn AST structural admission");
    expect(checkpointDetail(source)).toContain("not Rust semantic refinement");
    expect(checkpointDetail(source)).toContain("The row remains Partial");

    const broker = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "broker-durable-prepared-session",
    );
    expect(broker).toMatchObject({
      commit: "7139ccfd01e0ab8b0fc521613ac4356134d2e0c5",
      state: "public",
    });
    const brokerDetail = checkpointDetail(broker);
    expect(brokerDetail).toContain("AUTHORITY=none");
    expect(brokerDetail).toContain("hostile same-UID resistance");
    expect(brokerDetail).toContain("multiwriter coordination");
    expect(brokerDetail).toContain("cross-system atomicity");
    expect(brokerDetail).toContain("GPU authority");

    const ci = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "generic-ci-sharding",
    );
    expect(ci).toMatchObject({
      commit: "5a3f057b915b0cb21c3a0ac54094fd7e5e5ce6a4",
      state: "public",
    });
    expect(checkpointDetail(ci)).toContain("eight explicit rustc-codegen shards");
    expect(checkpointDetail(ci)).toContain("19 current Cargo integration-test targets");
    expect(checkpointDetail(ci)).toContain("Locked Cargo metadata is authoritative");
    expect(checkpointDetail(ci)).toContain(
      "the complete powderluv/fe2o3 GitHub-hosted generic run",
    );

    for (const id of ["softmax", "flash-attention", "moe-routing", "moe-experts"]) {
      expect(kernelProgress.find((kernel) => kernel.id === id)).toMatchObject({
        run: "partial",
        verify: "partial",
        evidence: "partial",
      });
    }
  });

  it("records bounded W0 acceptance and inert Broker V4 separately", () => {
    const w0 = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "w0-host-link-closure-v1",
    );
    expect(w0).toMatchObject({
      name: "Accepted W0/G1 static host-link boundary",
      commit: "9f40bbff39156f8b5f05868377ee12a2c4f74207",
      state: "public",
      narrativeId: "progress/w0-host-link-closure-v1",
    });
    const w0Detail = checkpointDetail(w0);
    expect(w0Detail).toContain("tree fd05530d3728aa928090b8e7beb372eaaf22b477");
    expect(w0Detail).toContain("85,597,472-byte tool");
    expect(w0Detail).toContain(
      "7c1a7429e93896393eb743ed54ead78ec6d492e3ed887183e67737b3872d7bf9",
    );
    expect(w0Detail).toContain("measured/no-authority");
    expect(w0Detail).toContain("no protected publication");
    expect(w0Detail).toContain("neither memory safety nor race freedom");
    expect(w0Detail).toContain("no source-to-machine or Verus-to-machine refinement");

    const broker = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "broker-v4-inert-foundation",
    );
    expect(broker).toMatchObject({
      name: "Inert Broker V4 protocol foundation",
      commit: "66393d3ca7a6805633ed94e12c707a6d22bdf1ad",
      state: "public",
      narrativeId: "progress/broker-v4-inert-foundation",
    });
    const brokerDetail = checkpointDetail(broker);
    expect(brokerDetail).toContain("tree f39f9c76d964bafe9e8a12a0b48099766490b366");
    expect(brokerDetail).toContain("AUTHORITY=none");
    expect(brokerDetail).toContain("No registry implementation");
    expect(brokerDetail).toContain("broker-owned durable registry");
    expect(brokerDetail).toContain("unforgeable move-only capability");
    expect(brokerDetail).toContain("persist replay exclusion across restart");

    for (const id of ["softmax", "flash-attention", "moe-routing", "moe-experts"]) {
      expect(kernelProgress.find((kernel) => kernel.id === id)).toMatchObject({
        run: "partial",
        verify: "partial",
        evidence: "partial",
      });
    }
  });

  it("records bounded Wave64 source-model-to-KIR correspondence", () => {
    const wave64 = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "gfx942-wave64-lds-reduction",
    );
    expect(wave64).toMatchObject({
      name: "gfx942 Wave64 bounded source-model/KIR correspondence",
      commit: "43bd2a602b2ceb5a7079f85445dacd6dc8fe73c4",
      state: "public",
      narrativeId: "progress/gfx942-wave64-lds-reduction",
    });
    const detail = checkpointDetail(wave64);
    expect(detail).toContain("tree bfedcca0e8fb58acda182d780700e520d093fb0f");
    expect(detail).toContain("4,359 deterministic mask observations");
    expect(detail).toContain("38 tests with one existing hardware test ignored");
    expect(detail).toContain("22 positive obligations");
    expect(detail).toContain("all eight expected-negative fixtures");
    expect(detail).toContain("does not hash the CPU oracle or refinement implementation");
    expect(detail).toContain("KIR order is validated but not operationally executed");
    expect(detail).toContain("does not compute SHA-256");
    expect(detail).toContain("no source-to-model correspondence");
    expect(detail).toContain("compiler causality");
    expect(detail).toContain("LLVM/ISA refinement");
    expect(detail).toContain("generalized memory safety or race freedom");
    expect(detail).toContain("parity authority");
  });

  it("records reviewed Wave64 attributed-source structural correspondence", () => {
    const correspondence = developmentCheckpoints.find(
      (checkpoint) =>
        checkpoint.id === "wave64-reviewed-source-structural-correspondence",
    );
    expect(correspondence).toMatchObject({
      name: "Wave64 reviewed attributed-source structural correspondence",
      commit: "e874da2083c2a1eb192048ea5f88a053c28d0ee2",
      state: "public",
      narrativeId: "progress/wave64-reviewed-source-structural-correspondence",
    });
    const detail = checkpointDetail(correspondence);
    expect(detail).toContain("tree 0e504b3be16b4dfaf3c997eefac8a6d24313e1b8");
    expect(detail).toContain("exact syn AST gate");
    expect(detail).toContain("fixed reviewed interpreter");
    expect(detail).toContain("17,436 observations");
    expect(detail).toContain("13 positive obligations");
    expect(detail).toContain("six expected-negative fixtures");
    expect(detail).toContain("proves_source_to_model_refinement=false");
    expect(detail).toContain("model-internal/definitional correspondence");
    expect(detail).toContain("constants rather than a verified SHA computation");
    expect(detail).toContain("interpreter is fixed after the AST gate");
    expect(detail).toContain("no theorem gives the Rust syntax operational semantics");
    expect(detail).toContain("no compiler, LLVM/ISA, artifact, GPU");
    expect(detail).toContain("generalized memory-safety or race-freedom");
    expect(detail).toContain("parity authority");
    expect(detail).toContain("promotes no lesson or parity row");
  });

  it("records only inert protected-service descriptor admission", () => {
    const admission = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "protected-service-descriptor-admission",
    );
    expect(admission).toMatchObject({
      name: "Inert protected-service descriptor admission",
      commit: "b8daeb2bc953924a424542820bed566e52d57290",
      state: "public",
      narrativeId: "progress/protected-service-descriptor-admission",
    });
    const detail = checkpointDetail(admission);
    expect(detail).toContain("tree ee06e94d6c5b5f5f447127a6c497e5a3e84ba417");
    expect(detail).toContain("AUTHORITY=none");
    expect(detail).toContain("27 unit tests and two compile-fail doctests");
    expect(detail).toContain("two privileged/root-only positive tests remain ignored");
    expect(detail).toContain("client liveness");
    expect(detail).toContain("PID-reuse protection");
    expect(detail).toContain("exclusive endpoint ownership");
    expect(detail).toContain("storage or anti-rollback");
    expect(detail).toContain("replay, reservation, host-link, publication, load, launch");
    expect(detail).toContain("changes no parity status");
    expect(detail).toContain("run/verify/evidence gate");
    expect(detail).toContain("lesson pin");
    expect(detail).toContain("explanatory-source label");
  });

  it("records the accepted static pre-exec containment foundation", () => {
    const preexec = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "static-preexec-containment-foundation",
    );
    expect(preexec).toMatchObject({
      name: "Accepted static pre-exec containment foundation",
      commit: "4aed8d4d394783362e289a558b6d94cc28ecda36",
      state: "public",
      narrativeId: "progress/static-preexec-containment-foundation",
    });
    const detail = checkpointDetail(preexec);
    expect(detail).toContain("tree 3996f269dad3e88748c50a24c98439c1422c1e3b");
    expect(detail).toContain("AUTHORITY=none");
    expect(detail).toContain("freestanding Linux x86-64 syscall-only _start");
    expect(detail).toContain("exact descriptor objects and process controls");
    expect(detail).toContain("empty target environment and fixed one-element argv");
    expect(detail).toContain("post-exec target inherits PDEATHSIG(SIGKILL)");
    expect(detail).toContain("Fourteen CTests and the Cargo integration pass");
    expect(detail).toContain("17,488-byte executable");
    expect(detail).toContain(
      "db65ee057a8a9d10f8c8e54087e46c4d34c7040b5b34e1732c42da2872b91c52",
    );
    expect(detail).toContain("trusts the supervisor and inherited process state");
    expect(detail).toContain("preattached ptrace tracer");
    expect(detail).toContain("inherited seccomp user notification");
    expect(detail).toContain("coarse object state");
    expect(detail).toContain("parent-start provenance relies on trusted procfs mount state");
    expect(detail).toContain("ordinary target exec resets dumpability");
    expect(detail).toContain("no supervisor authentication, broker session or replay");
    expect(detail).toContain("publication, link, load, launch, runtime, GPU, or parity authority");
    expect(detail).toContain("promotes no lesson or parity row");
  });

  it("records only the bounded external anti-rollback anchor protocol", () => {
    const anchor = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "external-anchor-protocol-foundation",
    );
    expect(anchor).toMatchObject({
      name: "Bounded external anti-rollback anchor protocol",
      commit: "4639ff36c8651a859495da86ea2c75e735377440",
      state: "public",
      narrativeId: "progress/external-anchor-protocol-foundation",
    });
    const detail = checkpointDetail(anchor);
    expect(detail).toContain("tree f0d91caaf705a7542135226c20cdb794dbc4f542");
    expect(detail).toContain("AUTHORITY=none");
    expect(detail).toContain("nonzero caller nonce");
    expect(detail).toContain("Strict Ed25519 verification");
    expect(detail).toContain("caller-supplied pinned public-key value");
    expect(detail).toContain("constructible only after a valid signature");
    expect(detail).toContain("unrelated or later positions fail closed");
    expect(detail).toContain("Fifteen unit, adversarial, and property-style tests");
    expect(detail).toContain("three compile-fail doctests");
    expect(detail).toContain("every single-byte response mutation");
    expect(detail).toContain("durable nonce freshness");
    expect(detail).toContain("monotonic anchor implementation");
    expect(detail).toContain("atomic anchoring or publication remain absent");
    expect(detail).toContain("changes no parity status");
    expect(detail).toContain("explanatory-source label");
  });

  it("records W0-B as rejected and pins the selected host-link closure", () => {
    const rejected = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "w0b-host-link-rejection",
    );
    expect(rejected).toMatchObject({
      name: "Rejected W0-B static host-link candidate",
      commit: "2e5ad53bcb20f2a46e91128a42e838d918d61581",
      state: "rejected",
      narrativeId: "progress/w0b-host-link-rejection",
    });
    const detail = checkpointDetail(rejected);
    expect(detail).toContain("tree 892f014381cd3e34f81cb05df3b9bbda4a412478");
    expect(detail).toContain("is rejected and is not integrated, accepted, or public");
    expect(detail).toContain(
      "crossed the static binding-wrapper, Cargo, rustc, backend, and kernel-collection boundaries",
    );
    expect(detail).toContain("broker lacked an authenticated cargo-fe2o3 executable identity");
    expect(detail).toContain("executed zero Workers");
    expect(detail).toContain("no artifact admission, load, dispatch, or GPU result");
    expect(detail).toContain("opened no COMGR path");
    expect(detail).toContain("ELF loader and system DSOs, CRTs, archives and objects, search roots");
    expect(detail).toContain("forwarded Cargo target artifacts outside the authenticated closure");
    expect(detail).toContain("env_clear reduces ambient configuration but does not authenticate");
    expect(detail).toContain("dedicated, genuinely static fe2o3-host-lld");
    expect(detail).toContain("pinned upstream LLVM/LLD archives");
    expect(detail).toContain("descriptor-backed HostLinkClosureV1");
    expect(detail).toContain("W0 is a dedicated");
    expect(detail).toContain(
      "W1 is authenticated broker cargo-fe2o3 executable identity and follows W0",
    );
    expect(detail).toContain("Retaining dynamic rust-lld is rejected");
    expect(detail).toContain("in-process host LLD is deferred");
    expect(detail).toContain(
      "Device code-object linking remains pinned upstream LLVM target-machine APIs plus in-process LLD",
    );
    expect(detail).toContain("no COMGR or shell GPU linker");
    expect(detail).toContain("promote no parity or evidence row");

    for (const id of ["softmax", "flash-attention", "moe-routing", "moe-experts"]) {
      expect(kernelProgress.find((kernel) => kernel.id === id)).toMatchObject({
        run: "partial",
        verify: "partial",
        evidence: "partial",
      });
    }
  });

  it("keeps the historical row pin separate from the LLVM release pair", () => {
    const historical = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "row-softmax-release-checkpoint",
    );
    expect(historical).toMatchObject({
      name: "Row-softmax historical 25-pin release checkpoint",
      commit: "aca28306fe89c036dc0129349ef9ed685a43c7bb",
      state: "public",
    });
    expect(checkpointDetail(historical)).toContain(
      "tree 37f1a92e0be0a4b48c5cef1b1a48327e0ea4c828",
    );
    expect(checkpointDetail(historical)).toContain("all 25 release pins");

    const llvmRelease = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "row-softmax-llvm-release",
    );
    expect(llvmRelease).toMatchObject({
      name: "Row-softmax LLVM release pair",
      commit: "fd89390788adc5670c54ecc2517b9720f2f80113",
      state: "public",
    });
    const detail = checkpointDetail(llvmRelease);
    expect(detail).toContain(
      "A 31bf96a21c0a2bbfb55c44f9a22b7350cabcfcb1, tree 293c6d39e47d64f5949d450d6041dc598aafd0fe",
    );
    expect(detail).toContain(
      "B fd89390788adc5670c54ecc2517b9720f2f80113, tree af0156687517c0e71eb0d607917964b7c375af43",
    );
    expect(detail).toContain(
      "9c7dc4a08f2f972b581ffa0f88bf8834d2098f21ff57b1a8594dd4dfca03759c",
    );
    expect(detail).toContain("Two fresh complete MI300X runs passed");
    expect(detail).toContain("independent review accepted the evidence package");
    expect(detail).toContain(
      "single retained HSACO identity 0864047320a7ade5eba29d3fbb3ef9efefcf2a1378097061010d163af461db93",
    );
    expect(detail).toContain("did not dispatch a GPU");
    expect(detail).toContain("upstream LLVM target-machine APIs plus in-process LLD");
    expect(detail).toContain("no runtime or GPU result, authentication");
  });

  it("tracks every tutorial kernel through three independent gates", () => {
    expect(kernelProgress.map((kernel) => kernel.id)).toEqual([
      "fill",
      "vecadd",
      "scalar-map",
      "wave-collectives",
      "workgroup-reduction",
      "scalar-gemm",
      "tiled-gemm",
      "softmax",
      "flash-attention",
      "moe-routing",
      "moe-experts",
    ]);
    expect(kernelProgress.every((kernel) => kernel.next.length > 0)).toBe(true);
    expect(
      kernelProgress.some(
        (kernel) =>
          kernel.run === "complete" &&
          kernel.verify === "complete" &&
          kernel.evidence === "complete",
      ),
    ).toBe(false);
    expect(
      kernelProgress.find((kernel) => kernel.id === "moe-experts"),
    ).toMatchObject({
      run: "partial",
      verify: "partial",
      evidence: "partial",
    });
  });

  it("tracks G4 Flash finalization, upstream reproduction, and typed runtime without GPU authority", () => {
    const admission = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "flash-attention-compiler-admission",
    );
    expect(admission).toMatchObject({
      commit: "bfc32b51314e75e4d619eda244e0d78573f1232c",
      state: "public",
    });

    const finalization = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "flash-attention-direct-finalization",
    );
    expect(finalization).toMatchObject({
      commit: "0b8ddf138d5420b90a61463ade8d612eb7101090",
      state: "public",
    });
    const detail = checkpointDetail(finalization);
    expect(detail).toContain("upstream LLVM target-machine APIs");
    expect(detail).toContain("in-process LLD");
    expect(detail).toContain("opaque deterministic-receipt evidence only");
    expect(detail).toContain(
      "no publication, load, launch, runtime, GPU, numerical, performance, compiler-refinement, OCML-semantics, general memory-safety, or race-freedom authority",
    );
    expect(detail).toContain("no measured proof of no-COMGR linkage");

    const reproducibility = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "flash-attention-upstream-reproducibility",
    );
    expect(reproducibility).toMatchObject({
      commit: "c1aecbb11017125e84209a333d978ec6d5bdddb1",
      state: "public",
    });
    const reproducibilityDetail = checkpointDetail(reproducibility);
    expect(reproducibilityDetail).toContain("sole exact FlashAttention V1 machine compiler identity");
    expect(reproducibilityDetail).toContain("Two previously absent worker build directories");
    expect(reproducibilityDetail).toContain(
      "d2aa57c0f468f574f44a9fea06bbb8e98aa9b60bb2d9303cc4d8b6caf0cfca54",
    );
    expect(reproducibilityDetail).toContain("ROCm LLVM 7.2.4 is rejected");
    expect(reproducibilityDetail).toContain("first measured toolchain divergence is linked bitcode");
    expect(reproducibilityDetail).toContain(
      "GPU device code-object path introduced no COMGR or shell GPU linker",
    );
    expect(reproducibilityDetail).toContain("no functional Flash semantics");

    const runtime = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "flash-attention-typed-runtime",
    );
    expect(runtime).toMatchObject({
      commit: "26c80737e3380cd73df21d9a8abd1838cdfa76bc",
      state: "public",
    });
    const runtimeDetail = checkpointDetail(runtime);
    expect(runtimeDetail).toContain("typed four-buffer binding");
    expect(runtimeDetail).toContain("Joined -> Loaded -> Completed -> Unloaded");
    expect(runtimeDetail).toContain("Nine compile-fail cases");
    expect(runtimeDetail).toContain("independent strict-f32 CPU oracle");
    expect(runtimeDetail).toContain("fails closed before HSA load");
    expect(runtimeDetail).toContain("no protected GPU dispatch or numerical GPU result");
    const memoryProof = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "flash-attention-memory-proof",
    );
    expect(memoryProof).toMatchObject({
      commit: "182d5673327bdbf642e3328a50903a4607a1756c",
      state: "public",
    });
    const memoryProofDetail = checkpointDetail(memoryProof);
    expect(memoryProofDetail).toContain("13 verified obligations");
    expect(memoryProofDetail).toContain("all eight pinned mutations");
    expect(memoryProofDetail).toContain("explicitly inert");
    expect(memoryProofDetail).toContain("has_identity_bound_verus_receipt false");
    expect(memoryProofDetail).toContain("No AuthenticatedVerusExecutionReceiptV2 join");
    expect(
      kernelProgress.find((kernel) => kernel.id === "flash-attention")?.next,
    ).toContain("W1 with broker-owned durable replay exclusion");

    const lesson = lessons.find((entry) => entry.id === "flash-attention");
    const host = lesson?.tabs.find((tab) => tab.kind === "host");
    const result = lesson?.tabs.find((tab) => tab.kind === "result");
    expect(host).toMatchObject({
      sourcePath: "examples/flash_attention_general_v1/src/main.rs",
      sourceCommit: "3127eae84ef1c8f539d56bfb418ec859ba0dd706",
      sourceSha256:
        "d1ee9f0f3f72e74282706b16f3ac1272356dffb97e766bbc46e6d71ed02eebd1",
      explanatory: false,
    });
    expect(host?.code).toContain("tails-and-strides");
    expect(host?.code).toContain("multi-head-multi-tile");
    expect(host?.code).toContain("wrote output padding");
    expect(result?.explanatory).toBe(true);
    expect(result?.code).toContain("Dynamic fused attention qualification");
    expect(result?.code).toContain("V_MFMA_F32_16X16X16_BF16");
    expect(result?.code).toContain("29 ranked dynamic-index obligations");
    expect(result?.code).toContain(
      "claim of parity with a tuned production FlashAttention library",
    );
  });

  it("tracks G5 MoE finalization and typed runtime without granting GPU authority", () => {
    const admission = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "moe-top2-compiler-admission",
    );
    expect(admission).toMatchObject({
      commit: "40e04f8e8469f37d3e9c4fcfcb23bd5ab6d1536e",
      state: "public",
    });

    const finalization = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "moe-top2-direct-finalization",
    );
    expect(finalization).toMatchObject({
      commit: "8926b3f725a9cb6a15bc8f43f019af1afffc6c1c",
      state: "public",
    });
    const detail = checkpointDetail(finalization);
    expect(detail).toContain("upstream LLVM target-machine APIs");
    expect(detail).toContain("in-process LLD");
    expect(detail).toContain("non-Clone receipt is opaque");
    expect(detail).toContain("passed in debug and release");
    expect(detail).toContain("not measured no-COMGR authority");
    expect(detail).toContain(
      "no publication, load, launch, runtime, GPU numerical, performance, compiler-refinement, Verus-to-machine, general memory-safety, or race-freedom authority",
    );

    const runtime = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "moe-top2-typed-runtime",
    );
    expect(runtime).toMatchObject({
      commit: "b1302940e9f7bc1cdcd58709a5d716bc2404df97",
      state: "public",
    });
    const runtimeDetail = checkpointDetail(runtime);
    expect(runtimeDetail).toContain("eight-buffer binding");
    expect(runtimeDetail).toContain("Joined -> Loaded -> Completed -> Unloaded");
    expect(runtimeDetail).toContain("nine compile-fail cases");
    expect(runtimeDetail).toContain("independent CPU oracle");
    expect(runtimeDetail).toContain("fails closed before HSA load");
    expect(runtimeDetail).toContain("no protected GPU routing result");

    const memoryProof = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "moe-top2-memory-proof",
    );
    expect(memoryProof).toMatchObject({
      commit: "d9ee4d09a97e59982b5e9ccf2e3877fff84fab5b",
      state: "public",
    });
    const memoryProofDetail = checkpointDetail(memoryProof);
    expect(memoryProofDetail).toContain("16 verified obligations");
    expect(memoryProofDetail).toContain("all eight pinned mutations");
    expect(memoryProofDetail).toContain("explicitly inert");
    expect(memoryProofDetail).toContain("cannot mint or join");
    expect(memoryProofDetail).toContain("no source/compiler/KIR/LLVM/ISA");

    const expertEvidence = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "moe-expert-bounded-evidence",
    );
    expect(expertEvidence).toMatchObject({
      commit: "43bd2a602b2ceb5a7079f85445dacd6dc8fe73c4",
      state: "public",
      narrativeId: "progress/moe-expert-bounded-evidence",
    });
    const expertEvidenceDetail = checkpointDetail(expertEvidence);
    expect(expertEvidenceDetail).toContain(
      "retains the bounded MoE V2 proof and host-bridge evidence",
    );
    expect(expertEvidenceDetail).toContain("19 verified obligations");
    expect(expertEvidenceDetail).toContain(
      "all seven expected-failure mutations",
    );
    expect(expertEvidenceDetail).toContain("all 625 count vectors");
    expect(expertEvidenceDetail).toContain(
      "caller-supplied top2 experts, requested and admitted counts, offsets, route slots, permutation, and inverse",
    );
    expect(expertEvidenceDetail).toContain(
      "uploads offsets and inverse together",
    );
    expect(expertEvidenceDetail).toContain(
      "gfx942 upload/readback test is no kernel dispatch",
    );
    expect(expertEvidenceDetail).toContain(
      "does not authenticate router execution or device readback provenance",
    );
    expect(expertEvidenceDetail).toContain("freshness, replay, compiler, finalizer");
    expect(expertEvidenceDetail).toContain(
      "no router or expert GPU execution",
    );
    expect(progressSnapshot.eventualPublicCommit).toBe(
      "3127eae84ef1c8f539d56bfb418ec859ba0dd706",
    );

    const lesson = curriculum
      .flatMap((module) => module.lessons)
      .find((candidate) => candidate.id === "moe-routing");
    const host = lesson?.tabs.find((tab) => tab.kind === "host");
    const result = lesson?.tabs.find((tab) => tab.kind === "result");
    expect(host).toMatchObject({
      sourcePath: "crates/fe2o3-hsa-runtime/tests/moe_top2_v1_hardware.rs",
      sourceCommit: "b1302940e9f7bc1cdcd58709a5d716bc2404df97",
      explanatory: true,
    });
    expect(host?.code).toContain("examples/moe_top2_v1/run-memory-verus.sh");
    expect(host?.code).toContain("protected_gfx942_moe_top2_v1_hardware");
    expect(result?.code).toContain("No protected GPU dispatch occurred");
    expect(
      kernelProgress.find((kernel) => kernel.id === "moe-routing")?.next,
    ).toContain("W1 with broker-owned durable replay exclusion");

    const expertLesson = lessons.find(
      (candidate) => candidate.id === "moe-expert-compute",
    );
    const expertHost = expertLesson?.tabs.find((tab) => tab.kind === "host");
    const expertResult = expertLesson?.tabs.find((tab) => tab.kind === "result");
    const expertContent = serializedLessonContent("moe-expert-compute");
    expect(expertContent).toContain("runtime padded rows");
    expect(expertContent).toContain("MFMA is an operation, not a workload label");
    expect(expertContent).toContain("17 tokens, 3 experts, 34 routes");
    expect(expertContent).toContain("Host scheduling is still explicit");
    expect(expertHost).toMatchObject({
      sourcePath: "examples/moe_grouped_expert_general_v1/src/main.rs",
      sourceCommit: "3127eae84ef1c8f539d56bfb418ec859ba0dd706",
      sourceSha256:
        "4a999e24699896c792c5b9e4a0c4428e08cd1e65d0bf0b5772aa4d721aafe5b9",
      explanatory: false,
    });
    expect(expertHost?.code).toContain("launch_expert");
    expect(expertHost?.code).toContain("routes[(token % EXPERTS)");
    expect(expertHost?.notice).toContain("launches the same generated kernel");
    expect(expertResult?.code).toContain("PASS top2-routed-moe");
    expect(expertResult?.code).toContain("17 ranked dynamic-index obligations");
    expect(expertResult?.code).toContain(
      "no GEMM, attention, routing, or MoE recognizer",
    );

    const orientation = serializedLessonContent("evidence-archive");
    expect(orientation).toContain("Read bounded MoE evidence by layer");
    expect(orientation).toContain("all 625 count vectors");
    expect(orientation).toContain("uploads offsets and inverse together");
    expect(orientation).toContain("no freshness or replay authority");
    expect(orientation).toContain(
      "No expert GEMM or combine kernel was dispatched",
    );
    expect(
      kernelProgress.find((kernel) => kernel.id === "moe-experts"),
    ).toMatchObject({
      run: "partial",
      verify: "partial",
      evidence: "partial",
      dependsOn: expect.arrayContaining([
        "authenticated router completion and device readback provenance",
        "logits-to-top2, route-weight, and packed-activation joins",
        "freshness and replay authority",
      ]),
    });
    expect(
      kernelProgress.find((kernel) => kernel.id === "moe-experts")?.next,
    ).toContain("Promote the exact compact-plan proof and host bridge only after");
  });

  it("tracks scalar GEMM hardware observation without upgrading authority", () => {
    const scalarCheckpoint =
      developmentCheckpoints.find(
        (checkpoint) => checkpoint.name === "Scalar GEMM V1 vertical slice",
      );
    expect(scalarCheckpoint).toMatchObject({
      commit: progressSnapshot.lastAuditedPublicCommit,
      state: "public",
    });
    const scalarDetail = checkpointDetail(scalarCheckpoint);
    expect(scalarDetail).toContain(
      "ac1da70c69a5038b887b459dece40802668c41bcf98f621d7d1273d2f61ba2c9",
    );
    expect(scalarDetail).toContain(
      "raw smoke deliberately bypasses production prerequisite authentication",
    );
    expect(kernelProgress.find((kernel) => kernel.id === "scalar-gemm")).toMatchObject({
      run: "partial",
      verify: "partial",
      evidence: "partial",
      dependsOn: [
        "protected artifact publication and currentness",
        "complete source-to-machine refinement",
        "dynamic safe LDS/MFMA optimization",
        "comparative performance evidence",
      ],
    });
    expect(checkpointDetail(
      developmentCheckpoints.find(
        (checkpoint) => checkpoint.name === "Scalar GEMM proof profile",
      ),
    )).toContain("does not execute Verus");
    const physicalEffectCheckpoint = developmentCheckpoints.find(
      (checkpoint) => checkpoint.name === "Scalar GEMM physical-effect profile",
    );
    expect(physicalEffectCheckpoint).toMatchObject({
      commit: progressSnapshot.lastAuditedPublicCommit,
      state: "acceptance",
    });
    const physicalEffectDetail = checkpointDetail(physicalEffectCheckpoint);
    expect(physicalEffectDetail).toContain("upstream LLVM 22");
    expect(physicalEffectDetail).toContain("exact 60-opcode scalar profile");
    expect(physicalEffectDetail).toContain(
      "9 address / 8 read / 1 write / 1 return / 0 calls",
    );
    expect(physicalEffectDetail).toContain("without COMGR");
    expect(physicalEffectDetail).toContain(
      "static, inert evidence only",
    );
    expect(physicalEffectDetail).toContain(
      "downstream authenticated evidence must bind the new identity",
    );
  });

  it("tracks production S09 capture without granting compiler or execution authority", () => {
    const s09Checkpoint = developmentCheckpoints.find(
      (checkpoint) => checkpoint.name === "Production S09 rustc invocation capture",
    );
    expect(s09Checkpoint).toMatchObject({
      commit: progressSnapshot.lastAuditedPublicCommit,
      state: "public",
    });
    const s09Detail = checkpointDetail(s09Checkpoint);
    expect(s09Detail).toContain("RustcInvocationDescriptorV2");
    expect(s09Detail).toContain("exactly /proc/./self/fd/198");
    expect(s09Detail).toContain(
      "sole final managed -Zcodegen-backend=<path> selector",
    );
    expect(s09Detail).toContain("COV6 gfx942:xnack-");
    expect(s09Detail).toContain("containing exactly alpha");
    expect(s09Detail).toContain(
      "canonical publication envelope and nested record",
    );
    expect(s09Detail).toContain(
      "5902632c5c249be05855ae5cef62bb9096a1f9277cfb0c58b4384594d6ee61de",
    );
    expect(s09Detail).toContain("proves no compiler origin");
    expect(s09Detail).toContain(
      "no loading, execution, or verification authority",
    );
    expect(s09Detail).toContain(
      "not a pathname-to-object identity join",
    );
    expect(s09Detail).toContain(
      "no general source or output-object association",
    );
  });

  it("tracks authenticated Verus V2 without overstating its authority", () => {
    const checkpoint = developmentCheckpoints.find(
      (entry) => entry.name === "Authenticated Verus execution V2",
    );
    expect(checkpoint).toMatchObject({
      commit: "b704651757a3d46801144277e025f68153cb1ba9",
      state: "public",
    });
    const detail = checkpointDetail(checkpoint);
    expect(detail).toContain("Linux x86_64");
    expect(detail).toContain(
      "pinned local runtime and tool snapshots",
    );
    expect(detail).toContain(
      "clone3 pidfds and ptrace-unresumable checkpoints",
    );
    expect(detail).toContain("seccomp process-creation denial");
    expect(detail).toContain(
      "exact live executable/backing comparison",
    );
    expect(detail).toContain(
      "runtime closure and baseline pinning",
    );
    expect(detail).toContain("vDSO pinning");
    expect(detail).toContain("immutable sealed results");
    expect(detail).toContain(
      "compressed and alternate debug-section families",
    );
    expect(detail).toContain(
      "Package-scoped debug stripping",
    );
    expect(detail).toContain(
      "bounded two-root gate compares SHA-256, size, and Build ID",
    );
    expect(detail).toContain("debug V2 integration passed 14/14");
    expect(detail).toContain("release passed 13/13");
    expect(detail).toContain(
      "full verifier debug and release suites and 22 doctests passed",
    );
    expect(detail).toContain(
      "mi300x correctly failed closed on its different vDSO and runtime baseline",
    );
    expect(detail).toContain(
      "does not integrate stock Verus or Z3",
    );
    expect(detail).toContain("semantic proof validity");
    expect(detail).toContain(
      "exclusive measured-image execution between checkpoints",
    );
    expect(detail).toContain("compiler refinement");
    expect(detail).toContain("GPU authority");
  });

  it("keeps the tiled GEMM fragment probe separate from the four-slice profile", () => {
    const foundation = developmentCheckpoints.find(
      (checkpoint) =>
        checkpoint.name === "Tiled GEMM V1 layout and frontend foundations",
    );
    expect(foundation).toMatchObject({
      commit: "286331aab8639dd3707e55cdf51a83f8854d26a5",
      state: "public",
    });
    const detail = checkpointDetail(foundation);
    expect(detail).toContain(
      "2ef91896bcdc4d26624f952e5c905c787cd9bc9e",
    );
    expect(detail).toContain(
      "commit 027ab901bef7007d0e8da3370470556ed28baad1",
    );
    expect(detail).toContain(
      "Exhaustive 64-lane x 4-component goldens",
    );
    expect(detail).toContain(
      "23 public Verus proof functions discharge 73 obligations",
    );
    expect(detail).toContain(
      "five formula mutations are rejected",
    );
    expect(detail).toContain(
      "build-scoped WG64/288-byte fragment probe",
    );
    expect(detail).toContain(
      "neither the later four-slice production profile nor the independent WG256/384-byte mutation",
    );
  });

  it("tracks source-authenticated tiled lowering without claiming refinement", () => {
    const sourceBridge = developmentCheckpoints.find(
      (checkpoint) =>
        checkpoint.name === "Tiled GEMM V1 source-authenticated compiler bridge",
    );
    expect(sourceBridge).toMatchObject({
      kind: "staged-evidence",
      commit: tiledGemmV1Commits.sourceBridge,
      state: "acceptance",
    });
    expect(sourceBridge).not.toHaveProperty("detail");
    const sourceBridgeDetail = sourceBridge
      ? developmentCheckpointDetail(sourceBridge)
      : "";
    expect(sourceBridgeDetail).toBe(
      stagedEvidenceDetail([
        "tiled-source-bridge-v1",
        "tiled-cargo-metadata-v1",
        "tiled-cargo-root-v1",
      ]),
    );
    expect(sourceBridgeDetail).toContain(
      "A:&[u16], B:&[u16], C:&[f32], D:DisjointSlice<f32>",
    );
    expect(sourceBridgeDetail).toContain(
      "portable-MIR identity, compiler profile, gfx942:xnack-, COV6, WG64, zero LDS",
    );
    expect(sourceBridgeDetail).toContain(
      "64-byte explicit plus 256-byte implicit four-slice ABI",
    );
    expect(sourceBridgeDetail).toContain(
      "eight BF16 loads, four f32 loads, one BF16 MFMA, and four f32 stores",
    );
    expect(sourceBridgeDetail).toContain(
      "AMDGCN lowering represents the BF16 carriers with i16 loads",
    );
    expect(sourceBridgeDetail).toContain("private single-use receipt");
    expect(sourceBridgeDetail).toContain(
      "b904f5b648c7eb249d32d73db427abe72970315a normalizes Cargo-generated metadata only inside the compiler-semantic commitment",
    );
    expect(sourceBridgeDetail).toContain(
      "private receipt carries that normalized compiler-semantic commitment",
    );
    expect(sourceBridgeDetail).toContain(
      "does not carry normalized metadata as a separate receipt field",
    );
    expect(sourceBridgeDetail).toContain(
      "managed cargo-fe2o3 wrapper separately binds the full ordered rustc argv and exact metadata observations",
    );
    expect(sourceBridgeDetail).not.toContain(
      "private receipt contain normalized Cargo-generated metadata",
    );
    expect(sourceBridgeDetail).not.toContain(
      "full observed argv and metadata remain receipt-bound",
    );
    expect(sourceBridgeDetail).toContain(
      "51bd129c31b08b636545f12229f34aaa431321f2 normalizes only the Cargo-generated root shape in the compiler semantic commitment",
    );
    expect(sourceBridgeDetail).toContain(
      "full observed root is stored in the private receipt and length-framed into its authority commitment",
    );
    expect(sourceBridgeDetail).toContain("Worker V2 handoff remains inert");
    expect(sourceBridgeDetail).toContain(
      "not a compiler refinement proof",
    );
    expect(sourceBridgeDetail).toContain(
      "no final-HSACO, publication, loading, or launch authority",
    );
  });

  it("tracks the guarded tiled hardware observation without upgrading authority", () => {
    const hardware = developmentCheckpoints.find(
      (checkpoint) =>
        checkpoint.name === "Tiled GEMM V1 guarded gfx942 hardware observation",
    );
    expect(hardware).toMatchObject({
      commit: tiledGemmV1Commits.hardwareEvidence,
      state: "public",
    });
    const hardwareDetail = hardware ? developmentCheckpointDetail(hardware) : "";
    expect(hardwareDetail).toContain("externally supplied digest-pinned bytes");
    expect(hardwareDetail).toContain("COV6/WG64/320-byte metadata");
    expect(hardwareDetail).toContain("bitwise dyadic 16x16 oracle");
    expect(hardwareDetail).toContain(
      "A/B/C inputs remained bitwise unchanged",
    );
    expect(hardwareDetail).not.toMatch(/immutable\s+inputs/);
    expect(hardwareDetail).toContain("6,672-byte HSACO");
    expect(hardwareDetail).toContain(
      "SHA-256 681077be1108c57d9d887f94afdd0ec3700ed2c86d73e66d2b229d6b418d0c66",
    );
    expect(hardwareDetail).toContain("passed 1/1 in 40.92 seconds");
    expect(hardwareDetail).toContain("compact console receipt is committed");
    expect(hardwareDetail).toContain("zero LDS and is not source-derived");
    expect(hardwareDetail).toContain("non-authoritative observation");
    expect(hardwareDetail).toContain("no compiler, publication, protected loading");
  });

  it("tracks structural artifact admission without claiming body semantics", () => {
    const structural = developmentCheckpoints.find(
      (checkpoint) =>
        checkpoint.name === "Tiled GEMM V1 structural artifact admission",
    );
    expect(structural).toMatchObject({
      commit: tiledGemmV1Commits.structuralAdmission,
      state: "public",
    });
    const structuralDetail = structural
      ? developmentCheckpointDetail(structural)
      : "";
    expect(structuralDetail).toContain(
      "four slices in 64 explicit bytes, a 256-byte implicit suffix",
    );
    expect(structuralDetail).toContain(
      "separately rejects the WG64/288-byte fragment probe",
    );
    expect(structuralDetail).toContain(
      "independent WG256 and 384-byte structural mutations",
    );
    expect(structuralDetail).toContain("admit arbitrary .text");
    expect(structuralDetail).toContain(
      "does not inspect machine-body semantics",
    );
    expect(structuralDetail).toContain(
      "no publication, loading, or launch authority",
    );
    expect(structuralDetail).toContain("no COMGR path is added");
  });

  it("tracks observational Slice 1 and proof-only Slice 2 without promotion", () => {
    const expected = [
      ["tiled-gemm-lds-kernel-ir", tiledGemmV1Commits.ldsKernelIr],
      ["tiled-gemm-lds-verus", tiledGemmV1Commits.ldsVerus],
      [
        "tiled-gemm-lds-attributed-source",
        tiledGemmV1Commits.ldsAttributedSource,
      ],
      [
        "tiled-gemm-lds-machine-inspection",
        tiledGemmV1Commits.ldsMachineInspection,
      ],
      ["tiled-gemm-lds-kphase-model", tiledGemmV1Commits.ldsKphaseModel],
      [
        "tiled-gemm-lds-hardware-observation",
        tiledGemmV1Commits.ldsHardwareObservation,
      ],
      [
        "tiled-gemm-lds-k32-machine-inspection",
        tiledGemmV1Commits.ldsK32MachineInspection,
      ],
      ["tiled-gemm-lds-wg64-contract", tiledGemmV1Commits.ldsWg64Contract],
      [
        "tiled-gemm-lds-grid-stride-model",
        tiledGemmV1Commits.ldsGridStrideModel,
      ],
      [
        "tiled-gemm-lds-source-ir-correspondence",
        tiledGemmV1Commits.ldsSourceIrCorrespondence,
      ],
      [
        "tiled-gemm-lds-grid-machine-inspection",
        tiledGemmV1Commits.ldsGridMachineInspection,
      ],
      [
        "tiled-gemm-lds-edge-kernel-ir",
        tiledGemmV1Commits.ldsEdgeKernelIr,
      ],
      [
        "tiled-gemm-lds-edge-machine-inspection",
        tiledGemmV1Commits.ldsEdgeMachineInspection,
      ],
      [
        "tiled-gemm-lds-source-model-correspondence",
        tiledGemmV1Commits.ldsSourceModelCorrespondence,
      ],
      [
        "tiled-gemm-lds-matrix-wire-v5",
        tiledGemmV1Commits.ldsMatrixWireV5,
      ],
      [
        "tiled-gemm-lds-inert-worker-handoff",
        tiledGemmV1Commits.ldsInertWorkerHandoff,
      ],
      [
        "tiled-gemm-lds-sealed-profile-registry",
        tiledGemmV1Commits.ldsSealedProfileRegistry,
      ],
    ];
    for (const [id, commit] of expected) {
      expect(
        developmentCheckpoints.find((checkpoint) => checkpoint.id === id),
      ).toMatchObject({ commit, state: "public" });
    }

    expect(stagedEvidenceDetail(["tiled-lds-kernel-ir-v1"])).toContain(
      "neither collection from the attributed Rust source",
    );
    expect(stagedEvidenceDetail(["tiled-lds-verus-v1"])).toContain(
      "excludes IEEE rounding",
    );
    const source = stagedEvidenceDetail(["tiled-lds-attributed-source-v1"]);
    expect(source).toContain("ordinary Rust function carrying #[kernel(typed, ...)]");
    expect(source).toContain("without macro_rules!");
    expect(source).toContain("At commit ee76cedc");
    expect(source).toContain("source is deliberately non-executable");
    expect(source).toContain("Later records first add");
    const machine = stagedEvidenceDetail([
      "tiled-lds-machine-inspection-v1",
    ]);
    expect(machine).toContain("direct upstream llc and ld.lld");
    expect(machine).toContain("not collected from the attributed Rust source");
    expect(machine).toContain("later hardware observation remains a separate evidence record");
    const kphase = stagedEvidenceDetail(["tiled-lds-kphase-model-v2"]);
    expect(kphase).toContain("196 verified and 0 errors");
    expect(kphase).toContain("1-, 2-, and 4-phase cases");
    expect(kphase).toContain("proof/model evidence only");
    expect(kphase).toContain("no attributed multi-phase GPU source");
    expect(kphase).toContain("later backend evidence remains independent");
    const hardware = stagedEvidenceDetail([
      "tiled-lds-hardware-observation-v1",
    ]);
    expect(hardware).toContain("SHA-256-pinned upstream LLVM 22 llc, ld.lld, and llvm-objdump");
    expect(hardware).toContain("COMGR is neither invoked nor admitted");
    expect(hardware).toContain("all 1,536 outputs");
    expect(hardware).toContain("passed 1/1 in 33.72 seconds");
    expect(hardware).toContain("observational IR-derived hardware evidence only");
    expect(hardware).toContain("no Worker V2, publisher, protected load, or protected launch authority");
    expect(hardware).toContain("cannot establish general illegal-memory-access detection");
    const k32Machine = stagedEvidenceDetail([
      "tiled-lds-k32-machine-inspection-v2",
    ]);
    expect(k32Machine).toContain("real two-trip SSA loop");
    expect(k32Machine).toContain("reuses the same two LDS tiles");
    expect(k32Machine).toContain("two physical workgroup barriers");
    expect(k32Machine).toContain("one static loop-body BF16 MFMA");
    expect(k32Machine).toContain("passed 120 tests");
    expect(k32Machine).toContain("Clippy passed with warnings denied");
    expect(k32Machine).toContain("no attributed multi-phase Rust source");
    expect(k32Machine).toContain("runtime hardware execution");
    expect(k32Machine).toContain("LLVM refinement proof");
    const wg64 = stagedEvidenceDetail(["tiled-lds-wg64-contract-v1"]);
    expect(wg64).toContain("macro generates the frontend contract bytes");
    expect(wg64).toContain("no longer carries a handwritten frontend sidecar");
    expect(wg64).toContain("required-only exact WG64 and WG256 compatibility");
    expect(wg64).toContain("fixed vecadd, alpha/zeta, and scalar-GEMM profiles");
    expect(wg64).toContain("source-to-LDS Kernel IR collection");
    expect(wg64).toContain("compiler-issued LDS acquisition are still open");
    expect(wg64).toContain("later dc31f23eb source-correspondence record");
    const gridStride = stagedEvidenceDetail([
      "tiled-lds-grid-stride-model-v3",
    ]);
    expect(gridStride).toContain("fixed-K16 Slice 3 Verus model");
    expect(gridStride).toContain("101 verified and 0 errors");
    expect(gridStride).toContain("73, 93, 196, and 101 verified obligations");
    expect(gridStride).toContain("12 expected negative rejections");
    expect(gridStride).toContain("1x1 through 3x3");
    expect(gridStride).toContain("lda=33, ldb=79, and ldc=96");
    expect(gridStride).toContain("no attributed kernel-source correspondence");
    expect(gridStride).toContain("runtime hardware execution");
    expect(gridStride).toContain("numerical-contract proof");
    expect(gridStride).toContain("compiler or machine refinement");

    const sourceIr = stagedEvidenceDetail([
      "tiled-lds-source-ir-correspondence-v1",
    ]);
    expect(sourceIr).toContain("ordinary #[kernel(typed, ...)] Rust");
    expect(sourceIr).toContain("contains no macro_rules! body");
    expect(sourceIr).toContain("select only the verified canonical");
    expect(sourceIr).toContain("Removed-barrier, A-index-drift");
    expect(sourceIr).toContain("stops before descriptor construction and Worker V2");
    expect(sourceIr).toContain("fe2o3 issue #85 was still open");
    expect(sourceIr).toContain("not a source-to-machine or compiler-refinement proof");

    const gridMachine = stagedEvidenceDetail([
      "tiled-lds-grid-machine-inspection-v3",
    ]);
    expect(gridMachine).toContain("M=64, N=48, K=16");
    expect(gridMachine).toContain("lda=33, ldb=79, ldc=96");
    expect(gridMachine).toContain("gfx942:xnack- COV6");
    expect(gridMachine).toContain("zero spills, scratch, calls, atomics, or COMGR");
    expect(gridMachine).toContain("protected Slice 3 Worker V2 execution remains open");

    const edgeIr = stagedEvidenceDetail(["tiled-lds-edge-kernel-ir-v4"]);
    expect(edgeIr).toContain("M=17, N=19, K=18");
    expect(edgeIr).toContain("BF16 zero-fill tails");
    expect(edgeIr).toContain("alpha=2.0, beta=-1.0");
    expect(edgeIr).toContain("unconditional publish and reuse barriers");
    expect(edgeIr).toContain("At commit f2406353");
    expect(edgeIr).toContain("later 35575cc32 machine-inspection record");
    expect(edgeIr).toContain("protected execution remains open in #89");

    const edgeMachine = stagedEvidenceDetail([
      "tiled-lds-edge-machine-inspection-v4",
    ]);
    expect(edgeMachine).toContain("M=17, N=19, K=18");
    expect(edgeMachine).toContain("alpha=2.0, beta=-1.0");
    expect(edgeMachine).toContain("two predicated K16 phases");
    expect(edgeMachine).toContain("exactly two static barriers");
    expect(edgeMachine).toContain("one static loop-body BF16 MFMA");
    expect(edgeMachine).toContain("5 active tests and 1 intentional LLVM-tool ignore");
    expect(edgeMachine).toContain("129 active dialect tests with 23 intentional ignores");
    expect(edgeMachine).toContain("362 active Kernel IR tests with 1 intentional ignore");
    expect(edgeMachine).toContain("closes fe2o3 issue #86");
    expect(edgeMachine).toContain("protected Slice 4 MI300X execution in #89");

    const sourceModel = stagedEvidenceDetail([
      "tiled-lds-source-model-correspondence-v1",
    ]);
    expect(sourceModel).toContain("96 verified and 0 errors");
    expect(sourceModel).toContain("exact 256/256/256 lengths");
    expect(sourceModel).toContain("Four new expected-negative fixtures");
    expect(sourceModel).toContain("76 debug tests, 76 release tests");
    expect(sourceModel).toContain("7 doctests in each lane");
    expect(sourceModel).toContain("all six positive proof groups");
    expect(sourceModel).toContain("all 21 expected-negative fixtures");
    expect(sourceModel).toContain("identity-bound bounded source/model correspondence only");
    expect(sourceModel).toContain("does not prove rustc MIR-to-IR semantics");
    expect(sourceModel).toContain("descriptor or Worker V2 integrity");
    expect(sourceModel).toContain("certificate consumption");
    expect(sourceModel).toContain("fe2o3 #91");
    expect(sourceModel).toContain("#92");
    expect(sourceModel).toContain("#106");

    const matrixWire = stagedEvidenceDetail(["tiled-lds-matrix-wire-v5"]);
    expect(matrixWire).toContain("canonical Kernel IR V5 bytes");
    expect(matrixWire).toContain("V1 through V4 remain frozen");
    expect(matrixWire).toContain("wire identity only");

    const inertHandoff = stagedEvidenceDetail([
      "tiled-lds-inert-worker-handoff-v1",
    ]);
    expect(inertHandoff).toContain("exact compiler-owned descriptor");
    expect(inertHandoff).toContain("single-use Worker V2 handoff");
    expect(inertHandoff).toContain("original pre-section upstream-LLVM body");
    expect(inertHandoff).toContain("380 library tests passed");
    expect(inertHandoff).toContain("grants no worker, linker, final-HSACO");
  });

  it("keeps tiled GEMM partial until source, body, authority, and race closure", () => {
    expect(
      kernelProgress.find((kernel) => kernel.id === "tiled-gemm"),
    ).toMatchObject({
      run: "partial",
      verify: "partial",
      evidence: "partial",
      dependsOn: [
        "compiler-origin-authenticated source-to-HSACO binding",
        "production proof-certificate consumption (fe2o3 #91)",
        "K-phase, grid, and edge proof extension (fe2o3 #92)",
        "MIR-to-IR and IR-to-machine safety correspondence (fe2o3 #106 and #107)",
        "protected Slice 3 and Slice 4 execution (fe2o3 #88 and #89)",
        "general dimensions, strides, tails, and coefficients (fe2o3 #90)",
        "source and Verus-to-machine refinement",
      ],
    });
  });

  it("teaches the staged tiled evidence boundaries without repinning claims", () => {
    const orientation = serializedLessonContent("evidence-archive");
    const mapping = serializedLessonContent("gemm-tiling");
    const proofPlan = serializedLessonContent("gemm-proof-plan");
    const renderedStaged = stagedEvidenceDetail(stagedEvidenceOrder);

    expect(orientation).toContain(tiledGemmV1Commits.structuralAdmission);
    expect(orientation).toContain(
      "Deployment remains gated until both harsh-nod/fe2o3@refs/heads/main and powderluv/fe2o3@refs/heads/main resolve to that exact commit and tree",
    );
    expect(orientation).toContain("not a compiler refinement proof");
    expect(orientation).toContain("passed 1/1 in 40.92 seconds");
    expect(orientation).toContain("does not inspect machine-body semantics");

    for (const commit of Object.values(tiledGemmV1Commits)) {
      expect(renderedStaged).toContain(commit);
    }
    expect(renderedStaged).toContain("Worker V2 handoff remains inert");
    expect(renderedStaged).toContain(
      "eight BF16 loads, four f32 loads, one BF16 MFMA, and four f32 stores",
    );
    expect(renderedStaged).toContain(
      "WG64/288-byte fragment probe",
    );
    expect(renderedStaged).toContain(
      "independent WG256 and 384-byte structural mutations",
    );
    expect(renderedStaged).toContain("inputs remained bitwise unchanged");
    expect(renderedStaged).not.toMatch(/immutable\s+inputs/);
    expect(renderedStaged).toContain(
      "c4fcb4d980cf979c0527dfa135a7b9f4fe72a811",
    );
    expect(renderedStaged).toContain(
      "FE2O3_PROTECTED_SLICE1_WORKER_V2_OK outputs=256 max_abs_error=0",
    );
    expect(renderedStaged).toContain(
      "fe2o3-worker-v1-sha256-6c3dfd5f784b3babe140006aba57a214a897b171860928440184fa201b6f96db",
    );
    expect(renderedStaged).toContain(
      "crates/fe2o3-host/src/generated_lds_gemm_lifecycle_tests.rs",
    );
    expect(renderedStaged).not.toContain(
      "crates/fe2o3-host/tests/generated_lds_gemm_lifecycle.rs",
    );
    expect(mapping).toContain("Safe Rust qualification kernel for dynamic strided matrix multiplication");
    expect(mapping).toContain("sourceCommit\":\"6a86f5cbb5049cd6895d47e6734048ddd4d308d5");
    expect(mapping).not.toContain("Optimized schedule mutation diagnostics");
    expect(mapping).not.toContain("staged-evidence");
    expect(proofPlan).toContain("Legacy LDS-family flags remain false");
    expect(proofPlan).toContain("authenticates the exact attributed source");
    expect(proofPlan).toContain("stops before descriptor construction and Worker V2");
    expect(proofPlan).toContain("six cases checked 1,536 outputs");
    expect(proofPlan).toContain("not Rust-source correspondence");
    expect(proofPlan).toContain("196 verified and 0 errors");
    expect(proofPlan).toContain("not an attributed multi-phase GPU kernel");
    expect(proofPlan).toContain("real two-trip SSA loop");
    expect(proofPlan).toContain("macro-owned for general typed #[kernel]");
    expect(proofPlan).toContain("fixed-K16 grid/stride source model");
    expect(proofPlan).toContain("101 verified and 0 errors");
    expect(renderedStaged).toContain("12 expected negative rejections");
    expect(proofPlan).toContain("M=64, N=48, K=16");
    expect(proofPlan).toContain("gfx942:xnack- COV6");
    expect(proofPlan).toContain("passed 1/1 in 14.36 seconds");
    expect(proofPlan).toContain("one exact bounded Slice 1 protected hardware observation");
    expect(proofPlan).toContain("Slice 4 at f24063534");
    expect(proofPlan).toContain("Commit 35575cc32");
    expect(proofPlan).toContain("M=17, N=19, K=18");
    for (const issue of [
      "#85",
      "#86",
      "#87",
      "#88",
      "#89",
      "#90",
      "#91",
      "#92",
      "#93",
      "#94",
      "#96",
      "#97",
      "#99",
      "#100",
    ]) {
      expect(proofPlan).toContain(issue);
    }
    expect(proofPlan).toContain("fe2o3-kernels #2");
    expect(proofPlan).toContain("the sealed authority-free exact-profile registry (#96) are complete");
    expect(proofPlan).toContain("96 verified and 0 errors");
    expect(proofPlan).toContain("76 debug tests, 76 release tests");
    expect(proofPlan).toContain("Production certificate consumption is tracked in #91");
    expect(proofPlan).toContain("No production source execution is claimed");
    for (const issue of [85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 96, 97, 99, 100]) {
      expect(proofPlan).toContain(
        `https://github.com/harsh-nod/fe2o3/issues/${String(issue)}`,
      );
    }
    expect(proofPlan).toContain(
      "https://github.com/harsh-nod/fe2o3-kernels/issues/2",
    );
    expect(proofPlan).not.toContain("#[kernel] WG64 contract integration remain open");

    expect(proofPlan).toContain("multi-phase source-to-machine derivation");
    expect(proofPlan).toContain("remain separate from the attributed source");
    expect(proofPlan).not.toContain(tiledGemmV1Commits.sourceBridge);
  });
});
