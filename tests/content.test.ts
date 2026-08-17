import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
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

  it("pins the exact bounded GEMM source, proof, host, and result tabs", () => {
    for (const lessonId of ["gemm-tiling", "gemm-proof-plan"]) {
      const lesson = lessons.find((entry) => entry.id === lessonId);
      const kernel = lesson?.tabs.find((tab) => tab.kind === "kernel");
      expect(kernel).toMatchObject({
        sourcePath: "examples/tiled_gemm_v1/src/kernel.rs",
        sourceCommit: "c4fcb4d980cf979c0527dfa135a7b9f4fe72a811",
        sourceSha256:
          "695e3449daa327944b0a9b0ecc081b0f1bd59eb60009cbe79ed6924942e86334",
        evidenceId: "tiled-lds-protected-lifecycle-v1",
        explanatory: false,
      });
      expect(
        createHash("sha256").update(kernel?.code ?? "").digest("hex"),
      ).toBe("695e3449daa327944b0a9b0ecc081b0f1bd59eb60009cbe79ed6924942e86334");
      expect(kernel?.code).toContain("#[kernel(");
      expect(kernel?.code).not.toMatch(/macro_rules!\s+[A-Za-z_]/u);

      const proof = lesson?.tabs.find((tab) => tab.kind === "verus");
      expect(proof).toMatchObject({
        sourcePath:
          "examples/tiled_gemm_v1/verus/lds_tiled_slice1_source_refinement.rs",
        sourceCommit: "5a45239aeeda3ca64cf16beb7fb1d3589e649bfe",
        evidenceId: "tiled-lds-source-model-correspondence-v1",
        explanatory: true,
      });
      expect(proof?.code).toContain("--test lds_source_refinement");
      expect(proof?.notice).toContain("96 obligations verify");

      const host = lesson?.tabs.find((tab) => tab.kind === "host");
      expect(host).toMatchObject({
        sourcePath:
          "crates/fe2o3-hsa-runtime/tests/tiled_gemm_lds_slice1_worker_v2_hardware.rs",
        sourceCommit: "c4fcb4d980cf979c0527dfa135a7b9f4fe72a811",
        evidenceId: "tiled-lds-protected-lifecycle-v1",
        explanatory: false,
      });
      expect(host?.code).toContain(
        "FE2O3_RUN_GFX942_TILED_GEMM_LDS_SLICE1_WORKER_V2_HARDWARE=1",
      );
      expect(host?.code).toContain("--ignored --exact --nocapture");

      const result = lesson?.tabs.find((tab) => tab.kind === "result")?.code ?? "";
      expect(result).toContain(
        "FE2O3_PROTECTED_SLICE1_WORKER_V2_OK outputs=256 max_abs_error=0",
      );
      expect(result).toContain("all 256 output bit patterns");
      expect(result).toContain("A and B remained bitwise unchanged");
      expect(result).toContain("A/B/C prefix and suffix guard canary");
      expect(result).toContain("1/1 passed in 14.36 seconds");
      expect(result).toContain("not generalized GEMM");
    }

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

  it("teaches row softmax from exact source while preserving evidence boundaries", () => {
    const lesson = lessons.find((entry) => entry.id === "softmax-invariant");
    const kernel = lesson?.tabs.find((tab) => tab.kind === "kernel");
    expect(kernel).toMatchObject({
      sourcePath:
        "crates/rustc-codegen-fe2o3/tests/fixtures/collected-row-softmax-v1/src/lib.rs",
      sourceCommit: "07446dc820d457ab895a3b01bcf6290613b47e66",
      sourceSha256:
        "c4e2d6bb6eebe01eb6ae7c0da1a524113819a37b4ec2d0a5167f32cc3134e6f4",
      explanatory: false,
    });
    expect(createHash("sha256").update(kernel?.code ?? "").digest("hex")).toBe(
      kernel?.sourceSha256,
    );
    expect(kernel?.code).toContain("#[kernel(");
    expect(kernel?.code).toContain("control_flow(loop_bounds(64, 64, 64))");
    expect(kernel?.code).toContain("DeviceMath::from_compiler()");

    const proof = lesson?.tabs.find((tab) => tab.kind === "verus");
    expect(proof).toMatchObject({
      sourcePath: "examples/row_softmax_v1/verus/row_softmax_v1.rs",
      sourceCommit: "dd841720591003f418d056b21a319088ce4559d6",
      explanatory: false,
    });
    expect(proof?.code).toContain("active_element_address_is_in_row_v1");
    expect(proof?.code).toContain(
      "separate_input_and_output_accesses_do_not_alias_v1",
    );

    const host = lesson?.tabs.find((tab) => tab.kind === "host");
    expect(host).toMatchObject({
      sourcePath:
        "crates/fe2o3-host/src/protected_row_softmax_v1_lifecycle.rs",
      sourceCommit: "38b0005765944de55bb32c559bc8431637317b2b",
      explanatory: false,
    });
    expect(host?.code).toContain("JoinedProtectedRowSoftmaxV1");
    expect(host?.code).toContain("load_after_context_match");

    const result = lesson?.tabs.find((tab) => tab.kind === "result")?.code ?? "";
    for (const layer of [
      "Source:",
      "CPU:",
      "Verus:",
      "Compiler/code object:",
      "Host:",
      "GPU:",
    ]) {
      expect(result).toContain(layer);
    }
    expect(result).toContain("Release A 31bf96a21c0a2bbfb55c44f9a22b7350cabcfcb1");
    expect(result).toContain("manifest B fd89390788adc5670c54ecc2517b9720f2f80113");
    expect(result).toContain(
      "9c7dc4a08f2f972b581ffa0f88bf8834d2098f21ff57b1a8594dd4dfca03759c",
    );
    expect(result).toContain("Two fresh complete MI300X runs passed");
    expect(result).toContain("independent review accepted the evidence package");
    expect(result).toContain(
      "0864047320a7ade5eba29d3fbb3ef9efefcf2a1378097061010d163af461db93",
    );
    expect(result).toContain("no protected dispatch");
    expect(result).toContain("does not justify a cuda-oxide parity promotion");

    const proofNarrative = narrativeEntry("softmax-invariant/proof");
    expect(JSON.stringify(proofNarrative)).not.toContain(
      "row loads and output writes are bounded and race-free",
    );
    expect(JSON.stringify(proofNarrative)).toContain(
      "Address separation is an obligation, not end-to-end race freedom",
    );
  });

  it("pins exact source-only kernel snapshots", () => {
    expect(sourceMilestoneOrder).toEqual([
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
          "01ac1365b0fdfe91cdc8f7cf6a14ae5acbea41528103ec3de5fe6d895261625e",
        sourceCommit: "d592ecee1154ca39daf1f9b1c2e02ab462e6c5f8",
      },
      {
        lessonId: "lds-barriers-atomics",
        evidenceId: "workgroup-sync-source-v1",
        sourcePath: "examples/workgroup_sync_v1/src/kernel.rs",
        bundledPath: "examples/workgroup_sync_v1/src/kernel.rs",
        sha256:
          "3e7ec081c7958288f9d997d40e6f41a7faabc56a3add734099cd1777443b2983",
        sourceCommit: "d592ecee1154ca39daf1f9b1c2e02ab462e6c5f8",
      },
      {
        lessonId: "flash-attention",
        evidenceId: "flash-attention-source-v1",
        sourcePath: "examples/flash_attention_v1/src/kernel.rs",
        bundledPath: "examples/flash_attention_v1/src/kernel.rs",
        sha256:
          "2b00a64e43e69c416e70080e013edf90e861fef94ee66441da93d2c11b3e8f17",
        sourceCommit: "5d4313bcda3479e6c77ce93350ca3428729fdbc0",
      },
      {
        lessonId: "moe-routing",
        evidenceId: "moe-top2-source-v1",
        sourcePath: "examples/moe_top2_v1/src/kernel.rs",
        bundledPath: "examples/moe_top2_v1/src/kernel.rs",
        sha256:
          "b77016caa0c3708e420e583712e65e4e6428db7b4feafd8d0a1d4bdc475ef6ff",
        sourceCommit: "ebaf1d87ca6f35eba0c321e7cf2aac62ba9eebdc",
      },
      {
        lessonId: "moe-expert-compute",
        evidenceId: "moe-expert-source-v1",
        sourcePath: "examples/moe_expert_v1/src/kernel.rs",
        bundledPath: "examples/moe_expert_v1/src/kernel.rs",
        sha256:
          "aeb772a09c7a81e624b72e7e9a84f7b7cd8f63110d3ced5ed975c0104036f8ba",
        sourceCommit: "b35c7ceff5b99494fcef2f419a4351dd5fb591cc",
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
        ![
          "flash-attention",
          "moe-routing",
          "moe-expert-compute",
        ].includes(profile.lessonId),
      );
      const result = lesson?.tabs.find((tab) => tab.kind === "result")?.code;
      const gaps = profile.lessonId === "flash-attention"
        ? [
            "W0 authenticated HostLinkClosureV1",
            "W1 broker cargo-fe2o3 executable identity",
            "exponential and IEEE FP32/OCML refinement",
            "protected gfx942 output",
            "source/model-to-machine refinement",
          ]
        : profile.lessonId === "moe-routing"
        ? [
            "W0 authenticated HostLinkClosureV1",
            "W1 broker cargo-fe2o3 executable identity",
            "protected GPU output",
            "authenticated proof consumption",
            "IEEE FP32/compiler/logical-address refinement",
            "source/model-to-machine refinement",
          ]
        : profile.lessonId === "moe-expert-compute"
        ? [
            "exact compiler admission",
            "typed multi-dispatch runtime",
            "protected gfx942 execution",
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
          "e1f48bb3dc7bee0678898d13660bf4ce02d9d8e5706e3969f11b11c8b1d7a2da",
        sourceCommit: "5c25611adbd99e807957dfc9a0a6a63e83a9e099",
      },
      {
        lessonId: "moe-routing",
        evidenceId: "moe-top2-verus-v1",
        bundledPath: "examples/moe_top2_v1/verus/moe_top2_v1.rs",
        sha256:
          "4c8db7b0d33c19d01677cf30ead3273844ffc480c70869181f6be0d9d3cc637f",
        sourceCommit: "5c25611adbd99e807957dfc9a0a6a63e83a9e099",
      },
      {
        lessonId: "moe-expert-compute",
        evidenceId: "moe-expert-verus-v1",
        bundledPath:
          "examples/moe_expert_v1/verus/moe_expert_memory_v1.rs",
        sha256:
          "617e6741c5f1415a8e792e5e36e3526c04ba18903438e3af178bb107766383d1",
        sourceCommit: "ff0c08a5bdca2568178f690c04c0b0c6bfa6febe",
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
      "c0f00a14c5941f34741fc10ca7798ce9cf47288294b0bcc43cddb7d22bbfe97e",
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
        commit: "1429ed6ae70dcd218376b777e0fef7db4413efdb",
        tree: "0a2b7965ef678253ed4c028e27f5de4394d22eb5",
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

  it("promotes only exact pinned sources among advanced lessons", () => {
    for (const lesson of lessons.filter((entry) => entry.module >= 4)) {
      const runnable = lesson.claims.some(
        (claim) => claim.kind === "runnable-now",
      );
      expect(runnable).toBe(false);
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
      reviewedOn: "2026-08-16",
      lastAuditedPublicCommit: "96b9890c3ad33ad8c6b4239a9b567728a176d65f",
      lastAuditedPublicTree: "f911f0c693238830ad6070b2674fb863857bfec1",
      eventualPublicCommit: "d9ae1e95957d28a17afdcfa1a5173d40b89e65a6",
      eventualPublicTree: "a7a5fe7a94331a1354679eea1977b1fa3d0c1218",
      publicationGate: {
        state: "deployment-gated-exact-target",
        requiredCommit: "d9ae1e95957d28a17afdcfa1a5173d40b89e65a6",
        requiredTree: "a7a5fe7a94331a1354679eea1977b1fa3d0c1218",
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
      sourcePath:
        "crates/fe2o3-hsa-runtime/tests/flash_attention_v1_hardware.rs",
      sourceCommit: "26c80737e3380cd73df21d9a8abd1838cdfa76bc",
      explanatory: true,
    });
    expect(host?.code).toContain("protected_gfx942_flash_attention_v1_hardware");
    expect(result?.explanatory).toBe(true);
    expect(result?.code).toContain(
      "d2aa57c0f468f574f44a9fea06bbb8e98aa9b60bb2d9303cc4d8b6caf0cfca54",
    );
    expect(result?.code).toContain(
      "Reproducible machine bytes do not establish functional or numerical correctness",
    );
    expect(result?.code).toContain("No protected GPU dispatch");
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
      "d9ae1e95957d28a17afdcfa1a5173d40b89e65a6",
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
    expect(expertContent).toContain("E4/C4/routes16/width16/tile256");
    expect(expertContent).toContain("19 verified obligations");
    expect(expertContent).toContain("all seven expected-failure mutations");
    expect(expertContent).toContain("all 625 possible expert-count vectors");
    expect(expertContent).toContain(
      "A consistent host snapshot is not router provenance",
    );
    expect(expertContent).toContain("no freshness or replay authority");
    expect(expertHost?.code).toContain(
      "scripts/test-moe-expert-compact-plan-verus.sh",
    );
    expect(expertHost?.code).toContain(
      "gfx942_routing_bridge_upload_readback_and_denial_are_exact",
    );
    expect(expertHost?.notice).toContain("dispatches no kernel");
    expect(expertResult?.code).toContain(
      "internal consistency of caller-supplied top2 experts",
    );
    expect(expertResult?.code).toContain(
      "No functional expert GPU result or performance result is claimed",
    );
    expect(expertResult?.code).toContain("No expert kernel was dispatched");

    const orientation = serializedLessonContent("read-the-evidence");
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
        "IEEE BF16/F32 numerical contract (fe2o3 #109)",
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
    expect(mapping).toContain("Ordinary Rust source for the fixed Slice 1 LDS tiled GEMM");
    expect(mapping).toContain("sourceCommit\":\"c4fcb4d980cf979c0527dfa135a7b9f4fe72a811");
    expect(mapping).toContain("not generalized GEMM or a complete production authority chain");
    expect(mapping).toContain("authenticates the exact attributed source");
    expect(mapping).toContain("stops before descriptor construction and Worker V2");
    expect(mapping).toContain("six cases checked 1,536 outputs");
    expect(mapping).toContain("not Rust-source correspondence");
    expect(mapping).toContain("196 verified and 0 errors");
    expect(mapping).toContain("not an attributed multi-phase GPU kernel");
    expect(mapping).toContain("real two-trip SSA loop");
    expect(mapping).toContain("macro-owned for general typed #[kernel]");
    expect(mapping).toContain("fixed-K16 grid/stride source model");
    expect(mapping).toContain("101 verified and 0 errors");
    expect(renderedStaged).toContain("12 expected negative rejections");
    expect(mapping).toContain("M=64, N=48, K=16");
    expect(mapping).toContain("gfx942:xnack- COV6");
    expect(mapping).toContain("passed 1/1 in 14.36 seconds");
    expect(mapping).toContain("one exact bounded Slice 1 protected hardware observation");
    expect(mapping).toContain("Slice 4 at f24063534");
    expect(mapping).toContain("Commit 35575cc32");
    expect(mapping).toContain("M=17, N=19, K=18");
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
      expect(mapping).toContain(issue);
    }
    expect(mapping).toContain("fe2o3-kernels #2");
    expect(mapping).toContain("the sealed authority-free exact-profile registry (#96) are complete");
    expect(mapping).toContain("96 verified and 0 errors");
    expect(mapping).toContain("76 debug tests, 76 release tests");
    expect(mapping).toContain("Production certificate consumption is tracked in #91");
    expect(mapping).toContain("No production source execution is claimed");
    for (const issue of [85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 96, 97, 99, 100]) {
      expect(mapping).toContain(
        `https://github.com/harsh-nod/fe2o3/issues/${String(issue)}`,
      );
    }
    expect(mapping).toContain(
      "https://github.com/harsh-nod/fe2o3-kernels/issues/2",
    );
    expect(mapping).not.toContain("#[kernel] WG64 contract integration remain open");

    expect(proofPlan).toContain("multi-phase source-to-machine derivation");
    expect(proofPlan).toContain("remain separate from the attributed source");
    expect(proofPlan).not.toContain(tiledGemmV1Commits.sourceBridge);
  });
});
