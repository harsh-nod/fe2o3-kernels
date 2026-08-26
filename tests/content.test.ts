import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { curriculum, glossary, lessons } from "../src/content/curriculum";
import { currentState } from "../src/content/current-state";
import { evidenceCatalog } from "../src/content/evidence-catalog";
import { functionalRefinementPublication } from "../src/content/functional-refinement-publication";
import { FE2O3_PIN, evidenceLabels } from "../src/content/model";
import { functionalCorrectnessCatalog } from "../src/content/functional-correctness-catalog";
import { narrativeFingerprint } from "../src/content/narrative-fingerprint";
import { semanticCorrectnessMilestone } from "../src/content/semantic-correctness-milestone";
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
  it("keeps the semantic-correctness milestone explicit in every lesson", () => {
    expect(semanticCorrectnessMilestone.status).toBe("partial-current");
    expect(semanticCorrectnessMilestone.compilerCommit).toBe(
      "d570d61d67fa5ae6fe3e2778f473b8ba5d5f9333",
    );
    expect(semanticCorrectnessMilestone.compilerTree).toBe(
      "b074653ed772c302b25e675dd361301e3c5de11f",
    );
    expect(semanticCorrectnessMilestone).toMatchObject({
      perCompilationTemplatePath:
        "crates/fe2o3-verifier/verus/mir_pliron_per_compilation_template_v1.rs",
      perCompilationGeneratedFixturePath:
        "crates/fe2o3-verifier/verus/mir_pliron_per_compilation_generated_fixture_v1.rs",
      perCompilationMultiOutputFixturePath:
        "crates/fe2o3-verifier/verus/mir_pliron_per_compilation_generated_multi_output_fixture_v1.rs",
      perCompilationMultiOutputFixtureSha256:
        "2425d9c3640de0f8476ba61e751485e7b0d02b7984fd303a12e601fdaf2cc8bc",
      perCompilationMultiOutputSubstitutionFixturePath:
        "crates/fe2o3-verifier/verus/negative/mir_pliron_per_compilation_multi_output_substitution_v1.rs",
      perCompilationMultiOutputSubstitutionFixtureSha256:
        "b0406bca54d4f0b1bac434cc26d3ec80d9c117b48ecfbc78daa2a915807dbcd8",
    });
    expect(
      semanticCorrectnessMilestone.mechanisms.map((mechanism) => [
        mechanism.id,
        mechanism.status,
      ]),
    ).toEqual([
      ["finite-total-view", "published-current"],
      ["atomic-contribution-coverage", "published-current"],
      ["typed-scalar-congruence", "published-current"],
      ["generic-semantic-composition", "published-current"],
      ["ranked-safe-reference-loads", "published-current"],
      ["canonical-dynamic-loop-refinement", "published-current"],
      ["output-numerical-refinement", "published-current"],
      ["cooperative-tensor-structural-validation", "published-current"],
      ["multiple-output-refinement", "published-current"],
      ["aggregate-mir-refinement-gate", "published-current"],
      ["exact-mir-pliron-contract", "published-current"],
      ["per-compilation-verus-composition", "published-current"],
    ]);

    for (const lesson of lessons) {
      expect(serializedLessonContent(lesson.id), lesson.id).toContain(
        "Milestone status: partial-current",
      );
    }

    const semanticEvidence = evidenceCatalog.gitObjects.find(
      (object) => object.label === "MIR/PLIRON semantic-correctness milestone",
    );
    const eligiblePaths = semanticCorrectnessMilestone.mechanisms
      .filter(
        (mechanism) =>
          mechanism.status === "published-current" ||
          mechanism.status === "implemented-unpinned",
      )
      .flatMap((mechanism) => mechanism.evidence);
    expect(semanticEvidence?.sourcePaths).toEqual(eligiblePaths);
    expect(
      semanticCorrectnessMilestone.mechanisms.some(
        (mechanism) => mechanism.status === "implemented-unpinned",
      ),
    ).toBe(false);

    for (const lessonId of [
      "gemm-tiling",
      "softmax-invariant",
      "flash-attention",
      "moe-expert-compute",
    ]) {
      const lesson = lessons.find((candidate) => candidate.id === lessonId);
      const specification = lesson?.tabs.find((tab) => tab.kind === "spec");
      expect(specification, lessonId).toMatchObject({
        label: "Sequential semantics",
        language: "rust",
        explanatory: true,
      });
      expect(specification?.notice, lessonId).toContain(
        "compiler",
      );
      expect(specification?.notice, lessonId).toContain("Incomplete");
      expect(specification?.code, lessonId).toContain("WORKLOAD SPECIFICATION");
      expect(specification?.code, lessonId).toContain("arithmetic_is_defined");
    }
  });

  it("parses and joins the functional-refinement publication manifest", () => {
    expect(functionalRefinementPublication).toMatchObject({
      schema: "fe2o3-functional-refinement-tutorial-publication-v1",
      status: "published-current",
      compilerCommit: semanticCorrectnessMilestone.compilerCommit,
      compilerTree: semanticCorrectnessMilestone.compilerTree,
    });
    expect(functionalRefinementPublication.referenceCompilerCommand).toContain(
      "--features qualification-oracles-test-only",
    );
    expect(
      functionalRefinementPublication.validationCommands.filter((command) =>
        command.includes("--test reference_binding_v1"),
      ),
    ).toSatisfy((commands: readonly string[]) =>
      commands.every((command) =>
        command.includes("--features qualification-oracles-test-only"),
      ),
    );
    const evidence = evidenceCatalog.gitObjects.find(
      (object) => object.label === "functional-refinement publication manifest",
    );
    expect(evidence?.sourcePaths).toEqual([
      functionalRefinementPublication.fixtureSourcePath,
      functionalRefinementPublication.receiptFixturePath,
      functionalRefinementPublication.runtimeControllerPath,
      functionalRefinementPublication.effectDiagnosticFixturePath,
      functionalRefinementPublication.authorityNegativeFixturePath,
      functionalRefinementPublication.dynamicBoundsSourcePath,
    ]);
  });

  it("catalogs the functional-correctness boundary for every kernel lesson", () => {
    expect(functionalCorrectnessCatalog.map((entry) => entry.lessonId)).toEqual(
      semanticCorrectnessMilestone.kernelLessons,
    );
    expect(functionalCorrectnessCatalog).toHaveLength(11);

    for (const entry of functionalCorrectnessCatalog) {
      const lesson = lessons.find((candidate) => candidate.id === entry.lessonId);
      const reference = lesson?.tabs.find((tab) => tab.kind === "reference");
      expect(lesson, entry.lessonId).toBeDefined();
      expect(reference?.sourcePath, entry.lessonId).toBe(
        entry.referenceSourcePath,
      );
      expect(existsSync(entry.referenceSourcePath), entry.referenceSourcePath).toBe(
        true,
      );
      expect(entry.outputRelations.length, entry.lessonId).toBeGreaterThan(0);
      expect(entry.scheduleRelations.length, entry.lessonId).toBeGreaterThan(0);
      expect(entry.perCompilationVerus, entry.lessonId).toContain(
        "exact compilation",
      );
      expect(entry.productionPipeline, entry.lessonId).toMatch(
        /semantic contract.*parallel contract.*per-compilation Verus.*before KIR lowering/iu,
      );
      expect(entry.perCompilationVerus, entry.lessonId).toContain(
        "SafeReferenceMirToLivePliron",
      );
      expect(entry.boundary, entry.lessonId).not.toMatch(
        /universal(?:ly)? (?:correct|proved)/iu,
      );
    }

    expect(
      functionalCorrectnessCatalog
        .filter((entry) =>
          [
            "typed-vecadd",
            "reductions-scans",
            "lds-barriers-atomics",
            "gemm-tiling",
            "gemm-proof-plan",
            "softmax-invariant",
            "flash-attention",
            "moe-routing",
            "moe-expert-compute",
          ].includes(entry.lessonId),
        )
        .every((entry) => entry.disposition === "incomplete"),
    ).toBe(true);

    expect(
      functionalCorrectnessCatalog.find(
        (entry) => entry.lessonId === "cpu-semantic-simulation",
      )?.disposition,
    ).toBe("observation-only");

    for (const lessonId of [
      "gemm-tiling",
      "gemm-proof-plan",
      "flash-attention",
      "moe-expert-compute",
    ]) {
      expect(
        functionalCorrectnessCatalog.find((entry) => entry.lessonId === lessonId)
          ?.boundary,
        lessonId,
      ).toMatch(/tensor|MFMA/iu);
      expect(
        functionalCorrectnessCatalog.find((entry) => entry.lessonId === lessonId)
          ?.cooperativeTensor,
        lessonId,
      ).toMatch(/typed result component.*exact output store.*tensor-component formula replay/isu);
    }

    for (const lessonId of [
      "typed-vecadd",
      "reductions-scans",
      "gemm-tiling",
      "gemm-proof-plan",
      "softmax-invariant",
      "flash-attention",
      "moe-expert-compute",
    ]) {
      expect(
        functionalCorrectnessCatalog.find((entry) => entry.lessonId === lessonId)
          ?.numericalPolicy,
        lessonId,
      ).toMatch(/finite-error-formula replay is not implemented.*target IEEE.*LLVM/isu);
    }

    for (const lessonId of ["moe-routing", "moe-expert-compute"]) {
      expect(
        functionalCorrectnessCatalog.find((entry) => entry.lessonId === lessonId)
          ?.boundary,
        lessonId,
      ).toMatch(/multiple output|multiple outputs|output product|separated-output/iu);
    }
  });

  it("rejects a kernel lesson detached from its cataloged safe reference", () => {
    const changed = structuredClone(curriculum);
    const lesson = changed
      .flatMap((module) => module.lessons)
      .find((candidate) => candidate.id === "flash-attention")!;
    lesson.tabs.find((tab) => tab.kind === "reference")!.sourcePath =
      "examples/flash_attention_general_v1/src/not-the-reference.rs";

    expect(validateCurriculum(changed)).toContainEqual({
      path: "lesson[flash-attention]",
      message:
        "safe CPU reference tab does not match the functional-correctness catalog",
    });
  });

  it("covers modules zero through ten in order", () => {
    expect(curriculum.map((module) => module.number)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(lessons).toHaveLength(33);
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

  it("publishes bounded gfx950 low-precision source and ISA lessons", () => {
    const expected = [
      ["gfx950-fp4-gemm", "gfx950_fp4_gemm_rust", "c8df66efc69ffcc731462d7600d7c307954fcd5bb5e311490fee1b253dafcab7", "gemm_reference", "cfcd4e567eb84127d93e77e9b568facb61674816026cd584f36d262a91b9541c", "gfx950_fp4_gemm", "cbsz:4 blgp:4"],
      ["gfx950-fp8-gemm", "gfx950_fp8_gemm_rust", "07b51618ef69bda35e91e422ca948934a450e376dce68bb9ab62e0e8af1eedce", "gemm_reference", "cfcd4e567eb84127d93e77e9b568facb61674816026cd584f36d262a91b9541c", "gfx950_fp8_gemm", "v_mfma_f32_16x16x128_f8f6f4"],
      ["gfx950-fp4-attention", "gfx950_fp4_attention_rust", "de73f75ba38cab5d88dd4889d0fe4cbc41295f49afec803774a6c9ace78f0062", "attention_reference", "cad34588d47fcd31930fec04bccfc83f3c2d4b56fb413c2a5fc1fba1dd3b35c0", "gfx950_fp4_flash_attention", "ds_read_b64_tr_b4"],
      ["gfx950-fp8-attention", "gfx950_fp8_attention_rust", "1bba502d11b4806e9bb14141049655e6f05ae7a2d2bfdad8fe3b22625feb6149", "attention_reference", "cad34588d47fcd31930fec04bccfc83f3c2d4b56fb413c2a5fc1fba1dd3b35c0", "gfx950_fp8_flash_attention", "ds_read_b64_tr_b8"],
    ] as const;

    for (const [lessonId, rustSymbol, rustSha256, referenceSymbol, referenceSha256, hipSymbol, requiredIsa] of expected) {
      const lesson = lessons.find((candidate) => candidate.id === lessonId);
      expect(lesson, lessonId).toBeDefined();
      expect(lesson?.module).toBe(9);
      expect(lesson?.claims).toEqual([
        expect.objectContaining({ kind: "source-example" }),
      ]);
      expect(lesson?.claims[0].reference).toBeUndefined();
      expect(lesson?.tabs.map((tab) => tab.kind)).toEqual([
        "kernel", "reference", "comparison", "verus", "host", "result",
      ]);
      const kernel = lesson?.tabs[0];
      expect(kernel?.language).toBe("rust");
      expect(kernel?.explanatory).toBe(false);
      expect(kernel?.sourceCommit).toBe("91e3cf2b4d8145d8c269ea3f783da53f90c568f4");
      expect(kernel?.sourcePath).toBe("examples/gfx950_low_precision/src/kernel.rs");
      expect(kernel?.code).toContain(rustSymbol);
      expect(kernel?.sourceSha256).toBe(rustSha256);
      const reference = lesson?.tabs[1];
      expect(reference?.kind).toBe("reference");
      expect(reference?.language).toBe("rust");
      expect(reference?.explanatory).toBe(false);
      expect(reference?.sourceCommit).toBe("91e3cf2b4d8145d8c269ea3f783da53f90c568f4");
      expect(reference?.code).toContain(referenceSymbol);
      expect(reference?.sourceSha256).toBe(referenceSha256);
      const comparison = lesson?.tabs[2];
      expect(comparison?.label).toBe("Equivalent HIP");
      expect(comparison?.code).toContain(hipSymbol);
      expect(comparison?.sourceSha256).toBe(
        "5ecfad224a691b61a07ef4aa16e144853bd3e8f53295a0e9c60404877356609a",
      );
      expect(lesson?.tabs[3]?.kind).toBe("verus");
      const host = lesson?.tabs[4];
      expect(host?.code).toContain(requiredIsa);
      expect(host?.code).toContain("cargo test --offline");
      expect(host?.code).toContain("pinned fe2o3 core checkout");
      expect(host?.code).toContain("fe2o3-kernels site checkout");
      expect(host?.code).toContain(
        "--offload-arch=gfx950",
      );
      const result = lesson?.tabs[5]?.code;
      expect(result).toContain("Rust gfx950 lowering supported: false");
      expect(result).toContain("Rust-produced HSACO: none");
      expect(result).toContain("SEPARATE HIP COMPARISON LANE");
      expect(result).toContain("MI350X gfx950");
      expect(result).toContain("Core source commit: 91e3cf2b4d8145d8c269ea3f783da53f90c568f4");
    }

    const fp4Gemm = serializedLessonContent("gfx950-fp4-gemm");
    expect(
      createHash("sha256")
        .update(readFileSync("examples/gfx950_low_precision/gfx950_low_precision.hip"))
        .digest("hex"),
    ).toBe("5ecfad224a691b61a07ef4aa16e144853bd3e8f53295a0e9c60404877356609a");
    expect(fp4Gemm).toContain("ab39293c0f251678496cb5da026b8fb6ebbb4f6c96989ad5a2962d3ad6018379");
    expect(fp4Gemm).toContain("one fixed K=128 phase");
    expect(fp4Gemm).toContain("identity scale operands as constants");
    const fp4Attention = serializedLessonContent("gfx950-fp4-attention");
    expect(fp4Attention).toContain("ds_read_b64_tr_b4");
    expect(fp4Attention).toContain("scalar FP32 loop");
    expect(fp4Attention).toContain("Multi-tile online rescaling");
    const fp8Attention = serializedLessonContent("gfx950-fp8-attention");
    expect(fp8Attention).toContain("ds_read_b64_tr_b8");
    expect(fp8Attention).toContain("attention max_error=2.38419e-07");
    expect(fp8Attention).toContain("native CDNA 4 FP8 split packing");
  });

  it("publishes exact bounded advanced gfx950 source and evidence", () => {
    const expected = [
      ["gfx950-advanced-moe", "examples/gfx950_advanced_systems/src/kernel.rs", "gfx950_moe_route_fp4_t16_e4_k2_v1", "moe_routing_reference", "68f69c2da2d7b48191ec898b0d96a8164f938d1030fd51c333465088ece3d081", "gfx950_fused_fp4_fp8_moe", "expert counts=9,7,6,10", "cbsz:4"],
      ["gfx950-kda-gdn-linear-attention", "examples/gfx950_advanced_attention/src/kernel.rs", "gfx950_kda_gdn_decode", "kda_gdn_decode_reference_v1", "7ca9927e875561ec1d7e753e72503a3426902af1fe38e7284331fefa8ccb75ba", "gfx950_kda_gdn_decode", "decode normalization max_error=4.76837e-07", "v_rsq_f32"],
      ["gfx950-indexed-sparse-attention", "examples/gfx950_advanced_attention/src/kernel.rs", "gfx950_content_sparse_attention", "content_sparse_attention_reference_v1", "7ca9927e875561ec1d7e753e72503a3426902af1fe38e7284331fefa8ccb75ba", "gfx950_content_sparse_attention", "selected IDs=[7,1,4]", "ds_read_b64_tr_b8"],
      ["gfx950-compressed-hybrid-attention", "examples/gfx950_advanced_attention/src/kernel.rs", "gfx950_compressed_hybrid_attention", "compressed_hybrid_attention_reference_v1", "7ca9927e875561ec1d7e753e72503a3426902af1fe38e7284331fefa8ccb75ba", "gfx950_compressed_hybrid_attention", "compressed hybrid attention max_error=1.67638e-07", "v_mfma_f32_16x16x128_f8f6f4"],
      ["gfx950-attnres-gr-mhc", "examples/gfx950_advanced_attention/src/kernel.rs", "gfx950_mhc_sinkhorn_mix", "mhc_sinkhorn_mix_reference_v1", "7ca9927e875561ec1d7e753e72503a3426902af1fe38e7284331fefa8ccb75ba", "gfx950_mhc_sinkhorn_mix", "mHC/Sinkhorn max_error=2.98023e-08", "v_exp_f32"],
      ["gfx950-speculative-mtp-verification", "examples/gfx950_advanced_systems/src/kernel.rs", "gfx950_speculative_transaction_v1", "speculative_reference", "68f69c2da2d7b48191ec898b0d96a8164f938d1030fd51c333465088ece3d081", "gfx950_speculative_transaction", "rolled-back candidates=6 with bitwise base-state equality", "gfx950_speculative_transaction"],
      ["gfx950-ngram-embedding-gather", "examples/gfx950_advanced_systems/src/kernel.rs", "gfx950_qwen_ngram_gather_v1", "ngram_reference", "68f69c2da2d7b48191ec898b0d96a8164f938d1030fd51c333465088ece3d081", "gfx950_qwen_ngram_gather", "deterministic duplicate-key tie value=4242", "gfx950_qwen_ngram_gather"],
      ["gfx950-muon-optimizer", "examples/gfx950_advanced_systems/src/kernel.rs", "gfx950_muon_update_4x4_v1", "muon_reference", "68f69c2da2d7b48191ec898b0d96a8164f938d1030fd51c333465088ece3d081", "gfx950_muon_update", "reduced norm max_error=0 with norm=0.614919", "gfx950_muon_update"],
    ] as const;

    const excerptHashes = {
      "gfx950-advanced-moe": ["ebb73a207fa5f56c893db782ed5169aa1afe95241908c1ddff8f232fd1c216ed", "13ab007af1facc9263b07b4be60479ff377eb6821629af5a009c4445c2d4690e"],
      "gfx950-kda-gdn-linear-attention": ["807a5e9c92ea2188fca93e4ec1ab0442c4ecf0ff0f3ecc60adf58a070242c571", "7912b95e74b9f9f210bff098b356150ac9dda21aad9b132765b93b3eaaee7b7d"],
      "gfx950-indexed-sparse-attention": ["d73101786d16d612eb9fb5266f882d6e8107650550d6398ad01d004f32030ce3", "813fce6fee60239b9c2ee8aa0c66958680595bfa66162d27b95f7cde7ca2dad9"],
      "gfx950-compressed-hybrid-attention": ["aaf25c62fb72ed32b25eb840b3fba9f955783f1b63d0d3b019c89c6ef9eb9b0a", "afe790e4c83988aae90763d6dccd394b265017ba72d6e4024b6f7b794e8d08db"],
      "gfx950-attnres-gr-mhc": ["9cbc16e2411298f9a452ee9d040b07c377f9d59b908eb89e1729595f4bb6f409", "d3fa6ba2d5fb187aeb5bf304ba3b29327636f8ce6afbf9455adbcf2273a3382f"],
      "gfx950-speculative-mtp-verification": ["c18a04e7de7af396288162bef82683ad944a620f18a65274bc03f5021820e520", "36ca2f84521a24cf65177a8e030dbf935f3b1b03e30ef5fb7e8a8a1e2241d6bc"],
      "gfx950-ngram-embedding-gather": ["82fa12ab47a0d0dc82c75ed0ce552277adef0c4467b9d148bd35772aea6af362", "9ce2cdd494c09f727ba87834de2874a80400cddde22691e50dcacb532dc505b1"],
      "gfx950-muon-optimizer": ["2d648160c8507976040c4db8ed3b3c87ddf47e17ca108850911b19df380eb74f", "20613ed1fad5dbdfd09f2bad3421e0927157a77e3085e0303092567d633403af"],
    } as const;

    for (const [lessonId, sourcePath, rustSymbol, referenceSymbol, sourceFileSha256, hipSymbol, result, isa] of expected) {
      const [rustExcerptSha256, referenceExcerptSha256] = excerptHashes[lessonId];
      const advanced = lessons.find((candidate) => candidate.id === lessonId);
      expect(advanced, lessonId).toBeDefined();
      expect(advanced?.module).toBe(10);
      expect(advanced?.claims).toEqual([
        expect.objectContaining({ kind: "source-example" }),
      ]);
      expect(advanced?.claims[0].reference).toBeUndefined();
      expect(advanced?.tabs.map((tab) => tab.kind)).toEqual([
        "kernel",
        "reference",
        "comparison",
        "verus",
        "host",
        "result",
      ]);

      const kernel = advanced?.tabs.find((tab) => tab.kind === "kernel");
      expect(kernel?.sourcePath).toBe(sourcePath);
      expect(kernel?.language).toBe("rust");
      expect(kernel?.explanatory).toBe(false);
      expect(kernel?.sourceCommit).toBe("91e3cf2b4d8145d8c269ea3f783da53f90c568f4");
      expect(kernel?.sourceSha256).toBe(rustExcerptSha256);
      expect(kernel?.code).toContain(rustSymbol);
      expect(kernel?.code).not.toContain("SOURCE MIRROR PENDING");
      expect(createHash("sha256").update(readFileSync(sourcePath)).digest("hex")).toBe(
        sourceFileSha256,
      );

      const reference = advanced?.tabs[1];
      expect(reference?.kind).toBe("reference");
      expect(reference?.language).toBe("rust");
      expect(reference?.sourcePath).toBe(sourcePath.replace("kernel.rs", "reference.rs"));
      expect(reference?.sourceCommit).toBe("91e3cf2b4d8145d8c269ea3f783da53f90c568f4");
      expect(reference?.sourceSha256).toBe(referenceExcerptSha256);
      expect(reference?.explanatory).toBe(false);
      expect(reference?.code).toContain(referenceSymbol);
      const comparison = advanced?.tabs[2];
      expect(comparison?.label).toBe("Equivalent HIP");
      expect(comparison?.code).toContain(hipSymbol);
      expect(advanced?.tabs[3]?.kind).toBe("verus");
      const host = advanced?.tabs[4];
      expect(host?.code).toContain(isa);
      expect(host?.code).toContain("cargo test --offline");
      expect(host?.code).toContain("pinned fe2o3 core checkout");
      expect(host?.code).toContain("fe2o3-kernels site checkout");
      expect(host?.code).toContain("--offload-arch=gfx950");

      const evidence = advanced?.tabs.find((tab) => tab.kind === "result")?.code;
      expect(evidence).toContain(`Kernel file SHA-256: ${sourceFileSha256}`);
      expect(evidence).toContain("Core source commit: 91e3cf2b4d8145d8c269ea3f783da53f90c568f4");
      expect(evidence).toContain(result);
      expect(evidence).toContain("Rust gfx950 lowering supported: false");
      expect(evidence).toContain("Rust-produced HSACO: none");
      expect(evidence).toContain("HIP runtime observation:");
      expect(evidence).toContain("do not bind to, lower, or execute the Rust source");
      expect(evidence).toContain("Performance result: not claimed");
      expect(evidence).toContain("Formal proof: not claimed");

      const serialized = serializedLessonContent(lessonId);
      expect(serialized).toContain("Fixed-shape teaching boundary");
      expect(serialized).toContain("no production serving");
      expect(serialized).toContain("full distributed collective");
      expect(serialized).toContain("full-model-equivalence claim");
    }
  });

  it("pins byte-exact Rust mirrors for all gfx950 packages", () => {
    const mirrors = [
      ["examples/gfx950_low_precision/README.md", "f3401cc5e0964cb2d3a71809e803edd83d52eec3537dd47aa5f81b5c2087d057"],
      ["examples/gfx950_low_precision/Cargo.toml", "e208401265a5b0453846f98dce53d6b1d325d1aa1739f1a00ec86cbf7e476bb5"],
      ["examples/gfx950_low_precision/src/kernel.rs", "1db40f7590af32b8b6781294ba184101a4e5cb7055a26e60bdf0aabec7145099"],
      ["examples/gfx950_low_precision/src/reference.rs", "388ec3bf3fff9a5290456afc92b9bd24be8813d9ae914865f780affb7fb6e3e7"],
      ["examples/gfx950_low_precision/src/lib.rs", "f0787e4d442e0ea31df61917f803f4b9732a99cf5ccc8e376de7c104bbc94ebd"],
      ["examples/gfx950_advanced_attention/README.md", "7657397fea609f7da6ff930aa23e60775f59822c9f2c2daec3898054abaf49a6"],
      ["examples/gfx950_advanced_attention/Cargo.toml", "15331511f974503b26131577ec321bd7283945360f31744c007ffba2c072acf8"],
      ["examples/gfx950_advanced_attention/src/kernel.rs", "7ca9927e875561ec1d7e753e72503a3426902af1fe38e7284331fefa8ccb75ba"],
      ["examples/gfx950_advanced_attention/src/reference.rs", "36b12a88115884fb52c175da0372e2a1197d05ad8b790992c05cf7a671246af9"],
      ["examples/gfx950_advanced_attention/src/lib.rs", "af05bbaee839bd7c54ea87f986338ccc5b9555021f3fcd4815faf68d21c97f7f"],
      ["examples/gfx950_advanced_systems/README.md", "2408f7085b5504b7b64ac34f4ef1ee1bf062ca2d326cd9c762f7464686e9e218"],
      ["examples/gfx950_advanced_systems/Cargo.toml", "2b7f59fa6efbafafcb6f4ec67831119f6287b12d0a88e08af1e8cfad33767117"],
      ["examples/gfx950_advanced_systems/src/kernel.rs", "68f69c2da2d7b48191ec898b0d96a8164f938d1030fd51c333465088ece3d081"],
      ["examples/gfx950_advanced_systems/src/reference.rs", "7817c51c5274671197460f11ceed5fdd2b8415ba934119013adad68c7d7c8dbd"],
      ["examples/gfx950_advanced_systems/src/lib.rs", "28782b1cf8d9a85973bc02011448cc18d6440aa504eadb48a479264dd08c93a9"],
    ] as const;
    for (const [path, digest] of mirrors) {
      expect(createHash("sha256").update(readFileSync(path)).digest("hex"), path).toBe(digest);
    }
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
        if (claim.kind === "design-only" || claim.kind === "source-example") {
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
        } else if (reference?.scope === "historical-evidence") {
          expect(reference.note).toMatch(/\b(archived|historical|retired)\b/iu);
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

  it("rejects historical evidence without an explicit and distinct boundary", () => {
    const missingBoundary = structuredClone(curriculum);
    const missingReference = missingBoundary
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.id === "cpu-semantic-simulation")!
      .claims[0]!.reference!;
    missingReference.note = "Observation-only evidence.";
    expect(validateCurriculum(missingBoundary)).toContainEqual({
      path: "lesson[cpu-semantic-simulation].claims[0]",
      message: "historical claim does not state its archived boundary",
    });

    const currentPin = structuredClone(curriculum);
    const currentReference = currentPin
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.id === "cpu-semantic-simulation")!
      .claims[0]!.reference!;
    currentReference.commit = currentState.compilerCommit;
    currentReference.tree = currentState.compilerTree;
    expect(validateCurriculum(currentPin)).toContainEqual({
      path: "lesson[cpu-semantic-simulation].claims[0]",
      message: "historical claim reuses the current compiler pin",
    });
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

  it("pairs every executable kernel lesson with a safe CPU reference and Verus obligation", () => {
    const referenceLessonIds = [
      "first-fill",
      "typed-vecadd",
      "cpu-semantic-simulation",
      "reductions-scans",
      "lds-barriers-atomics",
      "gemm-tiling",
      "gemm-proof-plan",
      "softmax-invariant",
      "flash-attention",
      "moe-routing",
      "moe-expert-compute",
    ];

    for (const lessonId of referenceLessonIds) {
      const lesson = lessons.find((entry) => entry.id === lessonId);
      const reference = lesson?.tabs.find((tab) => tab.kind === "reference");
      const proof = lesson?.tabs.find((tab) => tab.kind === "verus");
      expect(reference, lessonId).toBeDefined();
      expect(reference?.language, lessonId).toBe("rust");
      expect(reference?.code, lessonId).not.toMatch(/\bunsafe\b/u);
      expect(reference?.code.length, lessonId).toBeGreaterThan(100);
      expect(proof, lessonId).toBeDefined();
      expect(proof?.code, lessonId).not.toContain(
        "No Verus theorem is claimed for this lesson",
      );
    }
  });

  it("keeps retired CPU semantic simulation exact and non-hardware", () => {
    const lesson = lessons.find(
      (candidate) => candidate.id === "cpu-semantic-simulation",
    );
    expect(lesson).toBeDefined();
    const kernel = lesson?.tabs.find((tab) => tab.kind === "kernel");
    expect(kernel).toMatchObject({
      explanatory: false,
      sourceCommit: "df63236de13f7572bad2c5e25e90d5b1bc4927c1",
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
    expect(host).toContain("This command is not present on current main");
    const result = lesson?.tabs.find((tab) => tab.kind === "result")?.code ?? "";
    for (const boundary of [
      "authority: observation_only",
      "availability: retired_from_current_main",
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
    expect(result).toContain("kir.canonical_bytes: positive bounded byte length");
    expect(result).toContain("counts.invocations_executed: 4");
    expect(result).toContain("counts.workgroups_visited: 1");
    expect(result).toContain("counts.scheduled_slots_visited: 64");
    expect(result).toContain(
      "schedule.identity: workgroup_major_local_zyx_cooperative_v1",
    );
    expect(result).toContain("0x11000000110000001100000011000000");
    expect(lesson?.claims[0]).toMatchObject({
      kind: "compiler-checked",
      reference: {
        scope: "historical-evidence",
        commit: "df63236de13f7572bad2c5e25e90d5b1bc4927c1",
        tree: "d1068313b6bab22b5bb071fc8b39113e76cfb0a3",
      },
    });
    const reference = lesson?.claims[0].reference;
    expect(reference).toMatchObject({
      scope: "historical-evidence",
      commit: "df63236de13f7572bad2c5e25e90d5b1bc4927c1",
      tree: "d1068313b6bab22b5bb071fc8b39113e76cfb0a3",
      target: "amdgpu_64_little_endian_v1 (simulated scalar profile)",
    });
    expect(reference?.note).toContain("Historical observation-only");
    const content = serializedLessonContent("cpu-semantic-simulation");
    expect(content).toContain("trusted, unsandboxed host code");
    expect(content).toContain(
      "hardware_observed: false describes only that archived simulator result",
    );
    expect(content).toContain("fresh ephemeral generation");
    expect(content).toContain("prevented stale handoffs");

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
    ).toContain("single production pipeline");
    expect(
      currentState.capabilities.find(
        (capability) => capability.id === "cpu-semantic-simulation",
      )?.detail,
    ).toContain("not a current command");
  });

  it("pins the executable dynamic GEMM and historical tiled evidence separately", () => {
    const lesson = lessons.find((entry) => entry.id === "gemm-tiling");
    const kernel = lesson?.tabs.find((tab) => tab.kind === "kernel");
    expect(kernel).toMatchObject({
      sourcePath: "examples/tiled_gemm_general_v1/src/kernel.rs",
      sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      sourceSha256:
        "1f76284197d14acb79ace32c5b78ef2914cf845418cb785a6fca86285db8ab5a",
      evidenceId: "dynamic-gemm-executable-source-v1",
      explanatory: false,
    });
    expect(kernel?.code).toContain("while phase < k as usize");
    expect(kernel?.code).toContain("matrix.multiply_accumulate(lhs, rhs, accumulator)");
    expect(kernel?.code).toContain("-> KernelResult");
    expect(kernel?.code).toContain(".ok_or(KernelError::OutOfBounds)?");
    expect(kernel?.code).toContain("let a_matrix = Bf16MfmaAMatrix::row_major");
    expect(kernel?.code).toContain(
      "let lhs = a_matrix.load_m16k16(&wave_lane, tile_row * 16, phase);",
    );
    expect(kernel?.code).not.toMatch(/load_(?:m16k16|k16n16)\([^;]+\)\?/u);
    expect(kernel?.code).toContain("let matrix = Matrix::current()");
    expect(kernel?.code).toContain("alpha * values[0] + beta * *output");
    expect(kernel?.code).not.toMatch(/\bunsafe\b/u);
    expect(lesson?.diagram).toBe("gemm-scalar");

    const reference = lesson?.tabs.find((tab) => tab.kind === "reference");
    expect(reference).toMatchObject({
      label: "Safe CPU reference",
      sourcePath: "examples/tiled_gemm_general_v1/src/reference.rs",
      sourceCommit: "d570d61d67fa5ae6fe3e2778f473b8ba5d5f9333",
      explanatory: false,
    });
    expect(reference?.code).toContain("#![forbid(unsafe_code)]");

    const refinement = lesson?.tabs.find((tab) => tab.kind === "verus");
    expect(refinement).toMatchObject({
      label: "Verus refinement",
      sourcePath: "examples/verus_vecadd/verus/reference_refinement_v1.rs",
      sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      evidenceId: "reference-refinement-v1",
      explanatory: false,
    });
    expect(refinement?.code).toContain(
      "exact_hierarchy_writes_refine_safe_cpu_reference_v1",
    );

    const hip = lesson?.tabs.find((tab) => tab.kind === "comparison");
    expect(hip).toMatchObject({
      label: "Equivalent HIP",
      language: "cpp",
      sourcePath: "examples/tiled_gemm_general_v1/benchmark_hip.cpp",
      sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      sourceSha256:
        "24233c267c1bad3bde9c4897fb063d2e48d6d2fa07439dd04f4d0c14bd2ea84c",
      explanatory: false,
    });
    expect(hip?.code).toContain("__builtin_amdgcn_mfma_f32_16x16x16bf16_1k");

    const host = lesson?.tabs.find((tab) => tab.kind === "host");
    expect(host).toMatchObject({
      sourcePath: "examples/tiled_gemm_general_v1/src/main.rs",
      sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      sourceSha256:
        "6a67bb4fbf8a097389ce184764db2734a4b88037ef65ac607c12effede331a05",
      explanatory: false,
    });
    expect(host?.code).toContain("multi-workgroup-dynamic-k");
    expect(host?.code).toContain("grid_dim: (workgroups, 1, 1)");

    const result = lesson?.tabs.find((tab) => tab.kind === "result")?.code ?? "";
    expect(result).toContain("81 correspondence blocks");
    expect(result).toContain("v_mfma_f32_16x16x16_bf16");
    expect(result).toContain("PASS strided-all-tails");
    expect(result).toContain("PASS multi-workgroup-dynamic-k");
    expect(result).toContain("PASS zero-k-epilogue");
    expect(result).toContain("Fe2O3 is safer and more expressive here; it is not faster than HIP yet");
    expect(result).toContain("138.005 us");
    expect(result).toContain("130.514 us");

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
    const failures = JSON.stringify([
      semanticFailures,
      narrativeEntry("compiler-checks/v7-simulation"),
      narrativeEntry("gemm-tiling/mutation-diagnostics"),
    ]);
    expect(failures).toContain("Compile-time kernel diagnostics");
    expect(failures).toContain("none recognizes GEMM names, tile sizes, or schedules");
    expect(failures).toContain("Generic does not mean automatically provable");
    expect(failures).toContain("strict pre-lowering route fails closed");
    expect(failures).toContain("does not invent programmer intent");
    expect(failures).toContain("Ordinary kernels are safe Rust");
    expect(failures).toContain("One Rust type system, extended to GPU facts");
    expect(failures).toContain("does not implement a second borrow checker");
    expect(failures).toContain("What KernelResult means");
    expect(failures).toContain("physical unit-return GPU entry wrapper");
    expect(failures).toContain("Err is not a host-visible error payload");
    expect(failures).toContain("lane-varying ?");
    expect(failures).toContain("canonical Kernel IR V7");
    expect(failures).toContain("Where Verus fits");
    expect(failures).toContain("Layout follows values across tensor instructions");
    expect(failures).toContain("The CPU reference closes semantics, not hardware layout");
    expect(failures).toContain("Production errors include a repair contract");
    expect(failures).toContain("FE2O3-FIX-LAYOUT");
    expect(failures).toContain("does not establish a general Rust-source-to-Kernel-IR-to-machine refinement theorem");
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
      "mandatory ranked-PLIRON order is tensor layout, ranked bounds, atomic legality, race freedom, hierarchy ownership, barrier convergence, workgroup memory, then semantic refinement with effect refinement inside that final stage",
    );
    expect(failures).toContain("No lowering pass may run between these eight checks");
    expect(failures).toContain("Stable pass diagnostic catalog");
    expect(failures).toContain("FE2O3-RACE-004");
    expect(failures).toContain("Other compile-time boundary");
    expect(failures).toContain("fe2o3-kir-sim --kir-v7");
    expect(failures).toContain("deterministic CPU execution, not a GPU scheduler");
    expect(failures).toContain("Correct relative to explicit contracts, never universally correct");
    expect(failures).toContain("Storage swizzling describes addresses before a load");
    expect(failures).toContain("A and B need not use the same storage transform");
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
    expect(failures).toContain("Historical LDS-family flags remain false");
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
      "kernel-tensor-layout-v1",
      "kernel-memory-bounds-v1",
      "kernel-atomic-legality-v1",
      "kernel-race-freedom-v1",
      "kernel-hierarchy-ownership-v1",
      "kernel-barrier-convergence-v1",
      "kernel-workgroup-memory-v1",
      "kernel-semantic-refinement-v1",
      "pliron-sparse-index-v1 (shared analysis)",
      "pliron-presburger-v1 (shared analysis)",
      "bounded resources (cross-cutting)",
    ]);
    const prerequisiteTable = semanticFailures.blocks.find(
      (block) =>
        block.type === "table" &&
        block.headers[0] === "Separate general Kernel IR check ID",
    );
    expect(prerequisiteTable?.type).toBe("table");
    if (prerequisiteTable?.type !== "table") return;
    expect(prerequisiteTable.rows.map(([check]) => check)).toEqual([
      "kernel-structural-v1",
      "kernel-control-flow-v1",
    ]);
    expect(JSON.stringify(prerequisiteTable)).toContain("irreducible control flow");
    expect(JSON.stringify(pipelineTable)).toContain("compatible atomics");
    expect(JSON.stringify(pipelineTable)).toContain("rather than guessing intent");

    const diagnosticTable = semanticFailures.blocks.find(
      (block) => block.type === "table" && block.headers[0] === "Diagnostic",
    );
    expect(diagnosticTable?.type).toBe("table");
    if (diagnosticTable?.type !== "table") return;
    expect(diagnosticTable.rows.map(([code]) => code)).toEqual([
      "FE2O3-TENSOR-LAYOUT-001",
      "FE2O3-TENSOR-LAYOUT-002",
      "FE2O3-TENSOR-LAYOUT-003",
      "FE2O3-TENSOR-LAYOUT-004",
      "FE2O3-TENSOR-LAYOUT-005",
      "FE2O3-BOUNDS-000",
      "FE2O3-BOUNDS-001",
      "FE2O3-BOUNDS-002",
      "FE2O3-BOUNDS-003",
      "FE2O3-BOUNDS-004",
      "FE2O3-ATOMIC-001",
      "FE2O3-ATOMIC-002",
      "FE2O3-ATOMIC-003",
      "FE2O3-RACE-000",
      "FE2O3-RACE-001",
      "FE2O3-RACE-002",
      "FE2O3-RACE-003",
      "FE2O3-RACE-004",
      "FE2O3-OWN-001",
      "FE2O3-OWN-002",
      "FE2O3-OWN-003",
      "FE2O3-OWN-004",
      "FE2O3-OWN-005",
      "FE2O3-OWN-006",
      "FE2O3-OWN-007",
      "FE2O3-OWN-008",
      "FE2O3-OWN-009",
      "FE2O3-OWN-010",
      "FE2O3-OWN-011",
      "FE2O3-OWN-012",
      "FE2O3-OWN-013",
      "FE2O3-OWN-014",
      "FE2O3-OWN-015",
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
      "FE2O3-SEMANTIC-003",
      "FE2O3-SEMANTIC-004",
      "FE2O3-SEMANTIC-005",
      "FE2O3-SEMANTIC-006",
      "FE2O3-SEMANTIC-007",
      "FE2O3-PARALLEL-001",
      "FE2O3-PARALLEL-002",
      "FE2O3-PARALLEL-003",
      "FE2O3-PARALLEL-004",
      "FE2O3-PARALLEL-005",
      "FE2O3-PARALLEL-006",
      "FE2O3-PARALLEL-007",
      "FE2O3-PARALLEL-008",
      "FE2O3-PARALLEL-009",
      "FE2O3-PARALLEL-010",
      "FE2O3-PARALLEL-013",
      "FE2O3-PARALLEL-015",
      "FE2O3-PARALLEL-016",
      "FE2O3-PARALLEL-017",
      "FE2O3-PARALLEL-018",
      "FE2O3-PARALLEL-019",
      "FE2O3-PARALLEL-020",
      "FE2O3-PARALLEL-021",
      "FE2O3-PARALLEL-023",
      "FE2O3-PARALLEL-024",
      "FE2O3-PARALLEL-025",
      "FE2O3-PARALLEL-026",
      "FE2O3-PARALLEL-027",
      "FE2O3-PARALLEL-028",
      "FE2O3-PARALLEL-029",
      "FE2O3-PARALLEL-030",
      "FE2O3-PARALLEL-031",
    ]);
    expect(diagnosticTable.rows.filter(([, kind]) => kind === "Rejected")).toHaveLength(45);
    expect(diagnosticTable.rows.filter(([, kind]) => kind === "Incomplete")).toHaveLength(25);
    expect(diagnosticTable.rows.filter(([, kind]) => kind === "Prerequisite")).toHaveLength(5);

    const effectDiagnosticTable = semanticFailures.blocks.find(
      (block) => block.type === "table" && block.headers[0] === "Effect diagnostic",
    );
    expect(effectDiagnosticTable?.type).toBe("table");
    if (effectDiagnosticTable?.type !== "table") return;
    expect(effectDiagnosticTable.rows.map(([code]) => code)).toEqual([
      "FE2O3-EFFECT-001",
      "FE2O3-EFFECT-002",
      "FE2O3-EFFECT-003",
      "FE2O3-EFFECT-004",
      "FE2O3-EFFECT-005",
      "FE2O3-EFFECT-006",
      "FE2O3-EFFECT-007",
      "FE2O3-EFFECT-008",
      "FE2O3-EFFECT-009",
    ]);
    expect(JSON.stringify(effectDiagnosticTable)).toContain(
      "block and operation are always reported",
    );

    const failureGallery = semanticFailures.blocks.find(
      (block) => block.type === "compile-failures",
    );
    expect(failureGallery?.type).toBe("compile-failures");
    if (failureGallery?.type !== "compile-failures") return;
    expect(failureGallery.examples).toHaveLength(26);
    expect(failureGallery.intro).toContain("fixed workload-neutral PLIRON verifier sequence");
    expect(failureGallery.intro).toContain("tensor layout first");
    expect(failureGallery.intro).toContain("do not imply that users write a separate kernel DSL");
    expect(failureGallery.examples.map(({ id }) => id)).toEqual([
      "mfma_operand_roles",
      "tensor_wrong_b_map",
      "tensor_accumulator_permutation",
      "tensor_cross_instruction_layout",
      "tensor_storage_transform",
      "tensor_missing_tail_policy",
      "tensor_divergent_collective",
      "race_alias_views",
      "race_multidimensional_constant_write",
      "atomic_scope_too_narrow",
      "barrier_partial_workgroup",
      "workgroup_missing_publish",
      "grid_barrier_unsupported",
      "bounds_static_oob",
      "bounds_affine_oob",
      "atomic_invalid_ordering",
      "race_duplicate_output",
      "barrier_divergent",
      "workgroup_uninitialized",
      "semantic_mismatch",
      "hierarchy_coverage_hole",
      "reference_evidence_missing",
      "reference_expression_mismatch",
      "parallel_output_disjointness",
      "parallel_tensor_arithmetic_binding",
      "parallel_contract_construction",
    ]);
    for (const example of failureGallery.examples) {
      expect(example.source).not.toContain("unsafe");
      expect(example.source).not.toContain("KernelContext");
      expect(example.diagnostic).toContain(example.code);
      expect(example.diagnostic).toContain("error[");
      expect(example.caught.length).toBeGreaterThan(80);
    }
    const example = (id: string) => failureGallery.examples.find((item) => item.id === id);
    expect(example("mfma_operand_roles")?.diagnostic).toContain("error[E0308]");
    expect(example("tensor_wrong_b_map")?.diagnostic).toContain("B lane/component mapping does not match");
    expect(example("tensor_accumulator_permutation")?.diagnostic).toContain("Accumulator lane/component mapping does not match");
    expect(example("tensor_cross_instruction_layout")?.diagnostic).toContain(
      "help[FE2O3-FIX-LAYOUT] (HasPlaceholders)",
    );
    expect(example("tensor_cross_instruction_layout")?.caught).toContain(
      "no workload-specific rule",
    );
    expect(example("tensor_missing_tail_policy")?.diagnostic).toContain("tail-mask contract is incompatible");
    expect(example("tensor_divergent_collective")?.diagnostic).toContain("divergent tensor-instruction trace");
    expect(example("tensor_storage_transform")?.caught).toContain("direct B fragment may legally meet an XOR4-staged A fragment");
    expect(example("race_alias_views")?.caught).toContain("allocation origin and alias class");
    expect(example("race_multidimensional_constant_write")?.source).toContain("global = [2, 2, 1]");
    expect(example("barrier_partial_workgroup")?.diagnostic).toContain("global extent 65 on axis 0");
    expect(example("grid_barrier_unsupported")?.diagnostic).toContain("ordinary grid-wide barriers are unsupported");
    expect(example("bounds_static_oob")?.diagnostic).toContain("required: 64 < 64");
    expect(example("bounds_affine_oob")?.diagnostic).toContain(
      "counterexample invocation [6] computes index 13",
    );
    expect(example("bounds_affine_oob")?.diagnostic).toContain(
      "help[FE2O3-FIX-BOUNDS] (HasPlaceholders)",
    );
    expect(example("atomic_invalid_ordering")?.diagnostic).toContain("invalid Release ordering");
    expect(example("race_duplicate_output")?.diagnostic).toContain("invocation [0]");
    expect(example("race_duplicate_output")?.diagnostic).toContain("invocation [1]");
    expect(example("reference_evidence_missing")?.diagnostic).toContain(
      "FE2O3-SEMANTIC-003",
    );
    expect(example("reference_expression_mismatch")?.diagnostic).toContain(
      "FE2O3-EFFECT-001",
    );
    expect(example("parallel_output_disjointness")?.diagnostic).toContain(
      "FE2O3-PARALLEL-019",
    );
    expect(example("parallel_tensor_arithmetic_binding")?.diagnostic).toContain(
      "FE2O3-PARALLEL-013",
    );
    expect(example("parallel_contract_construction")?.diagnostic).toContain(
      "FE2O3-PARALLEL-017",
    );
    expect(failures).toContain("Ordinary Rust atomic terminals are explicitly unsupported");
    expect(failures).toContain("Rust Ordering does not imply a GPU memory scope");
    expect(failures).toContain("projection preserves the exact operation kind, ordering, and scope");
    expect(failures).toContain("FE2O3-ATOMIC-002 Incomplete");
  });

  it("teaches the authenticated safe-Rust reference path without promoting runtime oracles", () => {
    const lesson = lessons.find((entry) => entry.id === "compiler-checks");
    const bounds = lesson?.tabs.find((tab) => tab.kind === "kernel");
    const boundKernel = lesson?.tabs.find((tab) => tab.kind === "comparison");
    const reference = lesson?.tabs.find((tab) => tab.kind === "reference");
    const proof = lesson?.tabs.find((tab) => tab.kind === "verus");
    const host = lesson?.tabs.find((tab) => tab.kind === "host");
    const result = lesson?.tabs.find((tab) => tab.kind === "result");

    expect(bounds).toMatchObject({
      label: "Bounds fixture",
      explanatory: false,
      sourcePath:
        "crates/rustc-codegen-fe2o3/tests/fixtures/production-ranked-bounds-device/src/lib.rs",
    });
    expect(bounds?.code).toContain("let selected = input[64]");
    expect(result?.code).toContain("required: 64 < 64");

    expect(boundKernel).toMatchObject({
      label: "Reference-bound kernel",
      explanatory: true,
    });
    expect(boundKernel?.code).toContain("reference = cpu_reference");
    expect(boundKernel?.code).toContain("#![forbid(unsafe_code)]");
    expect(reference?.code).toContain(
      "fn cpu_reference(_point: usize, output: &mut u32)",
    );
    expect(reference?.code).not.toMatch(/\bunsafe\b/u);
    expect(proof?.code).toContain("ValueAccess(kind=Write");
    expect(proof?.code).toContain("gpu_write_site");
    expect(proof?.code).toContain("reference_output_site");
    expect(proof?.code).toContain("RequestEffectRefinement");
    expect(proof?.code).toContain("proof.require_effect_refinement");
    expect(proof?.code).toContain("SafeReferenceMirToLivePliron");
    expect(proof?.code).toContain(
      "requested_property = per_compilation_exact_formula_replay",
    );
    expect(proof?.code).toContain("output_product = [output0, output1]");
    expect(proof?.code).toContain("exact_formula(output0)");
    expect(proof?.code).toContain("exact_formula(output1)");
    expect(proof?.code).toContain("pliron_structure = total_and_separated");
    expect(proof?.code).toContain("private_move_only_join");
    expect(proof?.code).toContain("staging_status = Checked");
    expect(proof?.code).toContain("staging_authority = none");
    expect(proof?.code).toContain("UnsupportedFormulaReplayRole");
    expect(proof?.code).toContain(
      "maximum_logical_outputs_and_refinement_sites = 64",
    );
    expect(proof?.code).toContain(
      "maximum_tensor_component_pairs_per_receipt = 64",
    );
    expect(proof?.code).toContain("fixture_proof_admitted = false");
    expect(proof?.code).toContain("proved_total_output_coverage = false");
    expect(proof?.code).toContain("proved_source_to_isa = false");
    expect(result?.code).toContain("RHS mismatch");
    expect(result?.code).toContain("reference block 0, statement 0");
    expect(result?.code).toContain("FE2O3-PARALLEL-027");
    expect(result?.code).toContain("FE2O3-PARALLEL-031");
    expect(result?.code).toContain("UnsupportedFormulaReplayRole");
    expect(result?.code).toContain(
      "accepted: input_extent = %arg3, point_domain[0] = %arg3",
    );
    expect(result?.code).toContain("no exact ranked extent relation");
    expect(result?.code).toContain("derived index range 1..=8");
    expect(result?.code).toContain("index addition can overflow");
    expect(result?.code).toContain("no exact retained bounds assertion");
    expect(host?.code).toContain(
      "--features qualification-oracles-test-only --test reference_binding_v1",
    );

    const narrative = JSON.stringify([
      narrativeEntry("compiler-checks/catalog"),
      narrativeEntry("compiler-checks/production-path"),
    ]);
    for (const boundary of [
      "same session",
      "Reference bounds V2 accepts",
      "canonical finite unit-step loops",
      "safe one-dimensional input[index]",
      "RequestEffectRefinement",
      "Ed25519 V2 records",
      "SafeReferenceMirToLivePliron",
      "compiler-owned semantic contract",
      "strict compiler-owned parallel contract",
      "generated workload-neutral Verus checker",
      "without a generic relation premise",
      "status-Checked policy-staging record each",
      "overflow-safe final latch",
      "identical symbolic ranked extents",
      "exact invariant/variant proof requests",
      "result-component/store claims",
      "ErrorBounded sites",
      "before KIR lowering",
      "Candidate declarations are not evidence",
      "root-owned fixed /opt runtime",
    ]) {
      expect(narrative).toContain(boundary);
    }

    for (const lessonId of [
      "gemm-tiling",
      "gemm-proof-plan",
      "softmax-invariant",
      "flash-attention",
      "moe-expert-compute",
    ]) {
      const advanced = lessons.find((entry) => entry.id === lessonId);
      const advancedReference = advanced?.tabs.find((tab) => tab.kind === "reference");
      expect(advancedReference?.code).toContain("Vec");
      expect(advancedReference?.notice).toMatch(
        /runtime qualification oracle|runtime qualification/u,
      );
      expect(advancedReference?.notice).toMatch(
        /not .*authenticated|not compiler-bound|outside .*reference-effect V1/iu,
      );
    }
  });

  it("teaches row softmax from exact source while preserving evidence boundaries", () => {
    const lesson = lessons.find((entry) => entry.id === "softmax-invariant");
    const kernel = lesson?.tabs.find((tab) => tab.kind === "kernel");
    expect(kernel).toMatchObject({
      sourcePath: "examples/row_softmax_general_v1/src/kernel.rs",
      sourceCommit: "d570d61d67fa5ae6fe3e2778f473b8ba5d5f9333",
      sourceSha256:
        "58012e0d5168161cf48fa3f06644af04585c4e603af0a15b8737964ba96f04de",
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
    expect(kernel?.code).toContain("checked_row_striped_2d::<64, 64>");

    const proof = lesson?.tabs.find((tab) => tab.kind === "verus");
    expect(proof).toMatchObject({
      sourcePath: "examples/verus_vecadd/verus/reference_refinement_v1.rs",
      sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      explanatory: false,
    });
    expect(proof?.code).toContain(
      "exact_hierarchy_writes_refine_safe_cpu_reference_v1",
    );

    const host = lesson?.tabs.find((tab) => tab.kind === "host");
    expect(host).toMatchObject({
      sourcePath: "examples/row_softmax_general_v1/src/main.rs",
      sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      sourceSha256:
        "8df056afb9e91aa3e42b4372860431612a77ef71b0abb7ebdd088c7210a5a1bd",
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
    expect(result).toContain("lane shuffles and no MFMA");
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
      "reference-refinement-v1",
    ]);
    expect(validateSourceMilestoneCatalog()).toEqual([]);

    const profiles = [
      {
        lessonId: "reductions-scans",
        evidenceId: "wave64-collectives-source-v1",
        sourcePath: "examples/wave64_collectives_v1/src/kernel.rs",
        bundledPath: "examples/wave64_collectives_v1/src/kernel.rs",
        sha256:
          "7c6ead1e7c01a61a8f31a010c9e8cb9bd1c21a905ba61e9d90c6c077c748ffd4",
        sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      },
      {
        lessonId: "lds-barriers-atomics",
        evidenceId: "workgroup-sync-source-v1",
        sourcePath: "examples/workgroup_sync_v1/src/kernel.rs",
        bundledPath: "examples/workgroup_sync_v1/src/kernel.rs",
        sha256:
          "991542b783a144598be967ae1671609b2a02a812ca084c3bf6358a9f70968105",
        sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      },
      {
        lessonId: "moe-routing",
        evidenceId: "moe-top2-source-v1",
        sourcePath: "examples/moe_top2_v1/src/kernel.rs",
        bundledPath: "examples/moe_top2_v1/src/kernel.rs",
        sha256:
          "0e4570bd52866dd23b8b00d83983aadc818c77580de8f7f5e2982e12a57e20e2",
        sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
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
        lessonId: "moe-routing",
        evidenceId: "moe-top2-verus-v1",
        bundledPath: "examples/moe_top2_v1/verus/moe_top2_v1.rs",
        sha256:
          "4a5a60b66284567522ab3f07d93309c7002abf75870f4aa9db752f8260cb296c",
        sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
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
      "30931d5236c4730e2b6212644587fe76d37067d87a9b7f1dfadbe3ea02fef28b",
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
      expect(runnable).toBe(false);
      expect(lesson.tabs.find((tab) => tab.kind === "kernel")?.explanatory).toBe(
        [
          "gemm-tiling",
          "gemm-proof-plan",
          "softmax-invariant",
          "flash-attention",
          "moe-routing",
          "moe-expert-compute",
          "gfx950-fp4-gemm",
          "gfx950-fp8-gemm",
          "gfx950-fp4-attention",
          "gfx950-fp8-attention",
          "gfx950-advanced-moe",
          "gfx950-kda-gdn-linear-attention",
          "gfx950-indexed-sparse-attention",
          "gfx950-compressed-hybrid-attention",
          "gfx950-attnres-gr-mhc",
          "gfx950-speculative-mtp-verification",
          "gfx950-ngram-embedding-gather",
          "gfx950-muon-optimizer",
        ].includes(lesson.id)
          ? false
          : true,
      );
    }
  });
});

describe("implementation progress integrity", () => {
  it("gates the published compiler baseline on both public main refs", () => {
    expect(validateProgress()).toEqual([]);
    expect(developmentCheckpoints.map((checkpoint) => checkpoint.id)).toEqual(
      developmentCheckpointIds,
    );
    expect(progressSnapshot.auditedCommit).toBe(FE2O3_PIN.commit);
    expect(progressSnapshot).toMatchObject({
      reviewedOn: "2026-08-26",
      lastAuditedPublicCommit: "96b9890c3ad33ad8c6b4239a9b567728a176d65f",
      lastAuditedPublicTree: "f911f0c693238830ad6070b2674fb863857bfec1",
      eventualPublicCommit: "d570d61d67fa5ae6fe3e2778f473b8ba5d5f9333",
      eventualPublicTree: "b074653ed772c302b25e675dd361301e3c5de11f",
      publicationGate: {
        state: "deployment-gated-contained-object",
        requiredCommit: "d570d61d67fa5ae6fe3e2778f473b8ba5d5f9333",
        requiredTree: "b074653ed772c302b25e675dd361301e3c5de11f",
        requiredRefRelationship: "contains-required-commit",
        requiredRefs: [
          "harsh-nod/fe2o3@refs/heads/main",
          "powderluv/fe2o3@refs/heads/main",
        ],
      },
    });
    expect(progressSnapshot.publicationGate.requirement).toContain(
      "contain the exact required commit",
    );
    expect(developmentCheckpoints[0]).toMatchObject({
      name: "Published implementation snapshot (publication gated)",
      commit: progressSnapshot.eventualPublicCommit,
      state: "public",
    });
    expect(developmentCheckpointDetail(developmentCheckpoints[0])).toContain(
      "published compiler baseline is publication-gated",
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
    expect(currentNarrative).toContain(progressSnapshot.eventualPublicCommit);
    expect(currentNarrative).toContain(progressSnapshot.eventualPublicTree);
    expect(currentNarrative).toContain("Both public main refs must contain");
    expect(currentNarrative).toContain(
      "PLIRON proves and reconciles non-vacuous total coverage",
    );
    expect(currentNarrative).toContain("complete live PLIRON graph");
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
      sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      sourceSha256:
        "d119e41e3a15e0eb3e7866a439c23203b0e4983b3bd53d3fdc585e3bde2a4a25",
      explanatory: false,
    });
    expect(host?.code).toContain("tails-and-strides");
    expect(host?.code).toContain("multi-head-multi-tile");
    expect(host?.code).toContain("wrote output padding");
    expect(result?.explanatory).toBe(true);
    expect(result?.code).toContain("Dynamic fused attention qualification");
    expect(result?.code).toContain("V_MFMA_F32_16X16X16_BF16");
    expect(result?.code).toContain("17 ranked dynamic-index obligations");
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
      "d570d61d67fa5ae6fe3e2778f473b8ba5d5f9333",
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
    expect(expertContent).toContain("41 tokens, 4 experts, 82 routes");
    expect(expertContent).toContain("Host scheduling is still explicit");
    expect(expertHost).toMatchObject({
      sourcePath: "examples/moe_grouped_expert_general_v1/src/main.rs",
      sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      sourceSha256:
        "24838bcdd753efa2d5fac08798c10c4b75176cb18eee88bd05c20af4af04cb1d",
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
      "The checked-in publication gate pins compiler commit",
    );
    expect(orientation).toContain("Both public main refs must contain");
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
    expect(mapping).toContain("sourceCommit\":\"d570d61d67fa5ae6fe3e2778f473b8ba5d5f9333");
    expect(mapping).not.toContain("Optimized schedule mutation diagnostics");
    expect(mapping).not.toContain("staged-evidence");
    expect(proofPlan).toContain("Historical LDS-family flags remain false");
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
