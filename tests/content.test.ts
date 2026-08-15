import { describe, expect, it } from "vitest";
import { curriculum, glossary, lessons } from "../src/content/curriculum";
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
  parseExactCargoTestCommand,
  stagedEvidenceDetail,
  stagedEvidenceOrder,
  stagedEvidenceRecord,
  validateStagedEvidenceCatalog,
} from "../src/content/staged-evidence";
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
    expect(lessons).toHaveLength(18);
    expect(validateCurriculum(curriculum)).toEqual([]);
    expect(
      lessons.flatMap((lesson) =>
        lesson.sections.flatMap((section) =>
          section.kind === "narrative" ? [section.narrativeId] : [],
        ),
      ),
    ).toEqual(narrativeIds);
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
          ]).toContain(reference.authority);
        }
        for (const path of reference?.sourcePaths ?? []) {
          expect(path).not.toMatch(/^\//);
          expect(path).not.toContain("..");
        }
      }
    }
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
        .find((entry) => entry.id === "read-the-evidence");
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
    const lesson = lessons.find((entry) => entry.id === "read-the-evidence");
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
    ]);
    expect(staged?.every((claim) => claim.reference?.commands.length)).toBe(true);
    expect(staged?.every((claim) => claim.reference?.sourcePaths.length)).toBe(true);
    expect(staged?.filter((claim) => claim.kind === "gpu-observed")).toHaveLength(1);
  });

  it("requires whole Cargo test suites and referenced integration targets", () => {
    expect(validateStagedEvidenceCatalog()).toEqual([]);
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
    for (const id of stagedEvidenceOrder) {
      const record = stagedEvidenceRecord(id);
      for (const command of record.commands) {
        const parsed = parseExactCargoTestCommand(command);
        expect(parsed).toBeDefined();
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
  });

  it("rejects no-hash hardware authority moved into lesson narrative", () => {
    const unsupportedObservation =
      "The hardware run establishes protected GPU execution authority.";
    expect(unsupportedObservation).not.toMatch(/[0-9a-f]{40}/u);
    const changed = structuredClone(curriculum);
    const section = changed
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.id === "gemm-tiling")
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
      .find((lesson) => lesson.id === "gemm-tiling")
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
      .find((lesson) => lesson.id === "read-the-evidence")
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

  it("labels advanced source snippets as explanatory", () => {
    for (const lesson of lessons.filter((entry) => entry.module >= 4)) {
      const runnable = lesson.claims.some(
        (claim) => claim.kind === "runnable-now",
      );
      expect(runnable).toBe(false);
      expect(lesson.tabs.find((tab) => tab.kind === "kernel")?.explanatory).toBe(
        true,
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
      reviewedOn: "2026-08-14",
      lastAuditedPublicCommit: "96b9890c3ad33ad8c6b4239a9b567728a176d65f",
      lastAuditedPublicTree: "f911f0c693238830ad6070b2674fb863857bfec1",
      eventualPublicCommit: "50902b6fc4e861f4b93c40f13fb2e808b2bdc0c2",
      eventualPublicTree: "4bc6c5a4f46a0c7cb86cbd5542ff20f170b3f940",
      publicationGate: {
        state: "blocked-until-public-refs-match",
        requiredCommit: "50902b6fc4e861f4b93c40f13fb2e808b2bdc0c2",
        requiredRefs: [
          "harsh-nod/fe2o3@refs/heads/main",
          "powderluv/fe2o3@refs/heads/main",
        ],
      },
    });
    expect(progressSnapshot.publicationGate.requirement).toContain(
      "Do not publish this site revision until both required public refs",
    );
    expect(developmentCheckpoints[0]).toMatchObject({
      name: "Published implementation snapshot (publication gated)",
      commit: progressSnapshot.eventualPublicCommit,
      state: "public",
    });
    expect(developmentCheckpointDetail(developmentCheckpoints[0])).toContain(
      "implementation snapshot is publication-gated",
    );
    expect(developmentCheckpoints[1]).toMatchObject({
      name: "Last audited public baseline",
      commit: progressSnapshot.lastAuditedPublicCommit,
      state: "public",
    });
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
        "production protected transaction authenticator",
        "authenticated analyzer-identity binding",
        "compiler and address refinement",
        "protected MI300X launch evidence",
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

  it("tracks all four LDS Slice 1 increments without claiming execution", () => {
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
    expect(source).toContain("deliberately non-executable");
    const machine = stagedEvidenceDetail([
      "tiled-lds-machine-inspection-v1",
    ]);
    expect(machine).toContain("direct upstream llc and ld.lld");
    expect(machine).toContain("not collected from the attributed Rust source");
    expect(machine).toContain("has not produced LDS functional hardware evidence");
  });

  it("keeps tiled GEMM partial until source, body, authority, and race closure", () => {
    expect(
      kernelProgress.find((kernel) => kernel.id === "tiled-gemm"),
    ).toMatchObject({
      run: "partial",
      verify: "partial",
      evidence: "partial",
      dependsOn: [
        "source-to-LDS-Kernel-IR collection",
        "#[kernel] WG64 contract integration",
        "protected publisher, load, and launch",
        "LDS functional hardware evidence",
        "source and Verus-to-machine refinement",
        "IEEE BF16/F32 numerical contract",
      ],
    });
  });

  it("teaches the staged tiled evidence boundaries without repinning claims", () => {
    const orientation = serializedLessonContent("read-the-evidence");
    const mapping = serializedLessonContent("gemm-tiling");
    const proofPlan = serializedLessonContent("gemm-proof-plan");
    const renderedStaged = stagedEvidenceDetail(stagedEvidenceOrder);

    expect(orientation).toContain(tiledGemmV1Commits.structuralAdmission);
    expect(orientation).toContain(
      "must not be published until both harsh-nod/fe2o3@refs/heads/main and powderluv/fe2o3@refs/heads/main",
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
    expect(mapping).toContain("ordinary #[kernel(typed, ...)] Rust body");
    expect(mapping).toContain("not a functional kernel");
    expect(mapping).toContain("Source-to-LDS-Kernel-IR collection");
    expect(mapping).toContain("no LDS functional hardware result");

    expect(proofPlan).toContain("Source-to-LDS-Kernel-IR collection");
    expect(proofPlan).toContain("typed staged records remain separate");
    expect(proofPlan).not.toContain(tiledGemmV1Commits.sourceBridge);
  });
});
