import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evidenceCatalog, tabEvidenceSource } from "../src/content/evidence-catalog";
import { lessons } from "../src/content/curriculum";
import type { CodeTab } from "../src/content/model";
import { validateSourceEvidence } from "../scripts/source-evidence";
import { authorFacingCode } from "../src/lib/kernel-authoring";

const wholeFileTabs = lessons.flatMap((lesson) =>
  lesson.tabs.filter((tab) => tab.sourceDigestScope === "file")
    .map((tab) => ({ lessonId: lesson.id, tab })),
);

describe("evidence source digest scopes", () => {
  it("classifies displayed tab excerpts separately from whole files", () => {
    const expected = [
      [
        "gfx950-fp4-gemm: Rust kernel",
        "gfx950_fp4_gemm_rust",
        "3877bfb0afdcdd30b3ef8a11eaafb4a7d40c6fefab348a8bac3ad76e23a61ef1",
      ],
      [
        "gfx950-fp8-gemm: Rust kernel",
        "gfx950_fp8_gemm_rust",
        "b40f7cf4fa7560536a91914adda47107f4b2710bdbf5e176b7c1c71b690abf97",
      ],
      [
        "gfx950-fp4-attention: Rust kernel",
        "gfx950_fp4_attention_rust",
        "f342cc1c42eef9058ceb1b5615cee104e6552a32a7190550c4e3f4f6234e3ed2",
      ],
      [
        "gfx950-fp8-attention: Rust kernel",
        "gfx950_fp8_attention_rust",
        "69650ea2502ee149949d6cbec3e909032ede026be47ca52568bda455b9d9ef2c",
      ],
    ] as const;

    for (const [label, symbol, displayedSha256] of expected) {
      const source = evidenceCatalog.sources.find(
        (candidate) => candidate.label === label,
      );

      expect(source?.commit).toBe("9006001157e2c3062e44088634e467b0f8963ee0");
      expect(source?.sourcePath).toBe(
        "examples/gfx950_low_precision/src/kernel.rs",
      );
      expect(source?.fileSha256).toBeUndefined();
      expect(source?.displayedSha256).toBe(displayedSha256);
      expect(source?.displayedSource).toContain(`pub fn ${symbol}`);
      expect(source?.displayedFragments).toEqual([source?.displayedSource]);
      expect(
        createHash("sha256")
          .update(source?.displayedSource ?? "")
          .digest("hex"),
      ).toBe(displayedSha256);
    }
  });

  it("retains whole-file digests for file-level evidence", () => {
    const fileEvidence = evidenceCatalog.sources.filter(
      (source) => source.fileSha256,
    );

    expect(fileEvidence.length).toBeGreaterThan(0);
    expect(
      fileEvidence.every(
        (source) => source.displayedSha256 === undefined,
      ),
    ).toBe(true);
    expect(fileEvidence.some((source) => source.displayedSource === undefined)).toBe(true);
  });

  it("retains exact displayed bytes for every explicit whole-file tab", () => {
    expect(wholeFileTabs).toHaveLength(17);
    expect(wholeFileTabs.map(({ tab }) => tab.sourcePath).sort()).toEqual([
      "examples/fill/src/lib.rs",
      "examples/flash_attention_general_v1/src/kernel.rs",
      "examples/gemm_autoresearch_v1/src/kernel.rs",
      "examples/gfx950_advanced_attention/src/ablation.rs",
      "examples/gfx950_advanced_attention/src/kda_baseline.rs",
      "examples/gfx950_gpt_oss_decode/src/kernel_components.rs",
      "examples/gfx950_gpt_oss_decode/src/kernel_held_fragments.rs",
      "examples/gfx950_gpt_oss_decode/src/kernel_interleaved_stores.rs",
      "examples/gfx950_gpt_oss_decode/src/kernel_pipelined_attention.rs",
      "examples/gfx950_gpt_oss_decode/src/kernel_router_serial.rs",
      "examples/gfx950_gpt_oss_decode/src/kernel_scalar_attention.rs",
      "examples/moe_grouped_expert_general_v1/src/kernel.rs",
      "examples/row_softmax_general_v1/src/kernel.rs",
      "examples/tiled_gemm_general_v1/src/kernel.rs",
      "examples/workgroup_sync_v1/src/kernel_mixed_tile_u32.rs",
      "examples/workgroup_sync_v1/src/kernel_row_affine_u32.rs",
      "examples/workgroup_sync_v1/src/mixed_tile_oracle.rs",
    ]);
    for (const { lessonId, tab } of wholeFileTabs) {
      const source = tabEvidenceSource(lessonId, tab)!;
      expect(source.displayedSource).toBe(tab.code);
      expect(source.fileSha256).toBe(tab.sourceSha256);
      expect(source.displayedSha256).toBeUndefined();
      expect(evidenceCatalog.sources).toContainEqual(source);
      expect(() => validateSourceEvidence(source, Buffer.from(tab.code))).not.toThrow();
    }
  });

  it("appends independently pinned KDA baseline source without changing historical tabs", () => {
    const lesson = lessons.find((candidate) => candidate.id === "gfx950-kda-gdn-linear-attention")!;
    expect(lesson.tabs).toHaveLength(7);
    expect(lesson.tabs.slice(0, 6).map((tab) => [
      tab.label,
      createHash("sha256").update(authorFacingCode(tab).code).digest("hex"),
    ])).toEqual([
      ["Rust kernel", "2f6be28d762205ac3dc82434e9151748da69b4587d3fb13feecf1b0b99f468c0"],
      ["Safe CPU reference", "9b693e07fa53fc0fdff9b235bffdb012987e336d63ca7cbeac8cac01cb5ac76d"],
      ["Proof obligations", "395429340c6942b667dfe421a8ed268b77c0bcd3d084eef4e27860568e3257e2"],
      ["Run and inspect", "97213f2e63ecd3f271637ebfe147627a34194b2840528827bd06ab85885b1cf4"],
      ["Evidence record", "2dd641759e7231648f1b4a68581e0d36d4244089445ba96a6c88c03ffadc477c"],
      ["Performance", "d60da3b81b34709cab02880581cd5da27850e60f308a8a260dd982eb42f35653"],
    ]);
    expect(lesson.tabs.slice(0, 2).map((tab) => tab.sourceCommit)).toEqual([
      "3d10825df93a86644cc5a5b006cadd45f71afb91",
      "3d10825df93a86644cc5a5b006cadd45f71afb91",
    ]);
    const tab = lesson.tabs[6];
    expect(tab).toMatchObject({
      kind: "kernel",
      label: "Baseline source [SOURCE-ONLY]",
      language: "rust",
      sourcePath: "examples/gfx950_advanced_attention/src/kda_baseline.rs",
      sourceCommit: "6399ee2cf8456c6237a89d5507f50c1872602269",
      sourceSha256: "44a5f7b196b4a62bf197cb694290b7a71db8f2d9c168b3fa3b018c725eae2455",
      sourceDigestScope: "file",
      explanatory: false,
    });
    const source = readFileSync(`${process.cwd()}/${tab.sourcePath}`, "utf8");
    expect(tab.code).toBe(source);
    expect(Buffer.byteLength(source)).toBe(10258);
    expect(createHash("sha256").update(source).digest("hex")).toBe(tab.sourceSha256);
    expect(tab.sourceFragments).toBeUndefined();
    expect(tab.evidenceId).toBeUndefined();
    expect(tab.notice).toContain("Source association only");
    expect(tab.notice).toContain("qualifies no SIMT/tile pair");
    for (const [feature, symbol] of [
      ["kernel-kda-decode-baseline-v1", "gfx950_kda_decode"],
      ["kernel-kda-prefill-baseline-v1", "gfx950_kda_chunkwise_prefill"],
    ]) {
      expect(tab.code).toContain(`#[cfg(feature = "${feature}")]`);
      expect(tab.code.split(`pub fn ${symbol}(`)).toHaveLength(2);
      expect(tab.notice).toContain(feature);
    }
    expect(tab.notice).toContain("default features disabled, never both together");
    expect(() => validateSourceEvidence(tabEvidenceSource(lesson.id, tab)!, Buffer.from(source))).not.toThrow();
  });

  it("refreshes only the fill source binding while preserving historical evidence", () => {
    const lesson = lessons.find((candidate) => candidate.id === "first-fill")!;
    expect(lesson.tabs).toHaveLength(5);
    expect(lesson.tabs.slice(1).map((tab) => [
      tab.label,
      createHash("sha256").update(authorFacingCode(tab).code).digest("hex"),
    ])).toEqual([
      ["Safe CPU reference", "5fd27aaa8e84786e83438ac7c0800a599c41704286131599dab2bb8a21b8c989"],
      ["Verus proof", "ecc01851ba9887d26c41da73d5de1ca360a3a2714269245dc5eb11a09dd49bf9"],
      ["Host", "5543996a4b1ad515666f04d1b5f2ee980d01e2bd63910010eb4b7c9b83370093"],
      ["Expected result", "83873eed61a2391112dd3cb7dccd480b81ead7a949d0d873aef0e36a1b63edc3"],
    ]);
    expect(lesson.tabs[1].sourceCommit).toBe("308d8fa00fa41e098b2a1a47bbfea1bc29735464");
    const tab = lesson.tabs[0];
    expect(tab).toMatchObject({
      kind: "kernel",
      label: "Kernel",
      language: "rust",
      sourcePath: "examples/fill/src/lib.rs",
      sourceCommit: "f84c2a59ba34c3e4c12e316cc9b30f14342e36cf",
      sourceSha256: "66593042d32204a35d4371de11387466c6eb553b54a24d21e370f47b3ee4789e",
      sourceDigestScope: "file",
      explanatory: false,
    });
    const source = readFileSync(tab.sourcePath!, "utf8");
    expect(tab.code).toBe(source);
    expect(Buffer.byteLength(source)).toBe(680);
    expect(createHash("sha256").update(source).digest("hex")).toBe(tab.sourceSha256);
    expect(source.indexOf("fill_reference")).toBe(152);
    expect(source.indexOf("pub fn fill(") + "pub fn ".length).toBe(520);
    expect(tab.sourceFragments).toBeUndefined();
    expect(tab.evidenceId).toBeUndefined();
    expect(tab.notice).toContain("default features and no selected features");
    expect(tab.notice).toContain("reference-proof feature is opt-in");
    expect(tab.notice).toContain("Source association only");
    expect(tab.notice).toContain("no SIMT/tile pair is qualified");
    expect(tab.notice).toContain("7a536e0a retain their independent historical pins");
    expect(() => validateSourceEvidence(tabEvidenceSource(lesson.id, tab)!, Buffer.from(source))).not.toThrow();

    const historical = readFileSync("examples/fill_kernel.rs", "utf8");
    expect(Buffer.byteLength(historical)).toBe(308);
    expect(createHash("sha256").update(historical).digest("hex"))
      .toBe("827ea368df5dd7f429792e0f8a21df79d4d5508525061a844c190da25de54213");
    const proof = lessons.find((candidate) => candidate.id === "verus-contracts")!;
    expect(proof.tabs[0].code).toBe(historical);
  });

  it.each(wholeFileTabs)("rejects changed whole-file display bytes: $tab.sourcePath", ({ lessonId, tab }) => {
    const pinned = Buffer.from(tab.code);
    for (const code of [
      tab.code.replace("pub", "priv"),
      tab.code.slice(1),
      `${tab.code}\n// appended display text\n`,
      tab.code.replace(/\n/gu, "\r\n"),
      "",
    ]) {
      expect(code).not.toBe(tab.code);
      const changed = tabEvidenceSource(lessonId, { ...tab, code })!;
      expect(changed.fileSha256).toBe(tab.sourceSha256);
      expect(() => validateSourceEvidence(changed, pinned)).toThrow(
        "displayed whole file differs from the pinned source file",
      );
    }
  });

  it.each(["file", "displayed"] as const)("does not silently downgrade incomplete explicit %s claims", (sourceDigestScope) => {
    const { lessonId, tab: original } = wholeFileTabs[0];
    const tab = { ...original, sourceDigestScope };
    const scope = sourceDigestScope === "file" ? "whole-file" : "displayed";
    const diagnostic = `incomplete explicit ${scope} evidence`;
    for (const missing of ["sourcePath", "sourceCommit", "sourceSha256", "code"] as const) {
      const incomplete = { ...tab, [missing]: undefined } as unknown as CodeTab;
      expect(() => tabEvidenceSource(lessonId, incomplete)).toThrow(diagnostic);
    }
    for (const invalid of [
      { sourcePath: "" },
      { sourcePath: " \t" },
      { sourcePath: 1 },
      { sourceCommit: "main" },
      { sourceCommit: null },
      { sourceCommit: "A".repeat(40) },
      { sourceSha256: "invalid" },
      { sourceSha256: null },
      { sourceSha256: "A".repeat(64) },
      { code: null },
    ]) {
      expect(() => tabEvidenceSource(lessonId, { ...tab, ...invalid } as unknown as CodeTab)).toThrow(
        diagnostic,
      );
    }
  });

  it.each(["file", "displayed"] as const)("checks actual rendered %s code after the existing author-facing projection", (sourceDigestScope) => {
    const code = `#[kernel(\n    typed,\n    namespace = "${"a".repeat(64)}",\n)]\npub fn fill() {}`;
    const tab: CodeTab = {
      kind: "kernel", label: "legacy", language: "rust", code,
      sourcePath: "kernel.rs", sourceCommit: "b".repeat(40),
      sourceSha256: createHash("sha256").update(code).digest("hex"),
      sourceDigestScope,
    };
    const source = tabEvidenceSource("legacy", tab)!;
    expect(source.displayedSource).not.toContain("namespace");
    expect(() => validateSourceEvidence(source, Buffer.from(code))).toThrow(
      sourceDigestScope === "file"
        ? "displayed whole file differs from the pinned source file"
        : "displayed excerpt digest is",
    );
    if (sourceDigestScope === "displayed") {
      expect(source.displayedFragments).toEqual([code]);
      const rehashed = {
        ...source,
        displayedSha256: createHash("sha256").update(source.displayedSource!).digest("hex"),
      };
      expect(() => validateSourceEvidence(rehashed, Buffer.from(code))).toThrow(
        "displayed fragments do not reconstruct the displayed source",
      );
    }
  });

  it("validates explicit single and multiple fragment tabs through the catalog", () => {
    const first = "pub fn first() {}";
    const last = "pub fn last() {}";
    const pinned = Buffer.from(`${first}\n// omitted\n${last}\n`);
    for (const fragments of [[first], [first, last]]) {
      const code = fragments.join("\n\n");
      const tab: CodeTab = {
        kind: "kernel", label: "excerpt", language: "rust", code,
        sourcePath: "kernel.rs", sourceCommit: "a".repeat(40),
        sourceDigestScope: "displayed",
        sourceSha256: createHash("sha256").update(code).digest("hex"),
        ...(fragments.length > 1 ? { sourceFragments: fragments } : {}),
      };
      const source = tabEvidenceSource("excerpt", tab)!;
      expect(source.fileSha256).toBeUndefined();
      expect(source.displayedSource).toBe(code);
      expect(source.displayedFragments).toEqual(fragments);
      expect(() => validateSourceEvidence(source, pinned)).not.toThrow();
    }
  });

  it("keeps unspecified legacy scopes as metadata-only file claims", () => {
    const { lessonId, tab } = wholeFileTabs[0];
    const source = tabEvidenceSource(lessonId, {
      ...tab,
      sourceDigestScope: undefined,
      code: "legacy explanatory excerpt",
    })!;
    expect(source.displayedSource).toBeUndefined();
    expect(() => validateSourceEvidence(source, Buffer.from(tab.code))).not.toThrow();
    expect(() => validateSourceEvidence(source, Buffer.from("wrong pinned file"))).toThrow(
      "whole-file digest is",
    );
  });

  it("keeps excerpt digest, reconstruction and pinned-fragment checks", () => {
    const displayedSource = "first\n\nlast";
    const source = {
      label: "excerpt",
      commit: "a".repeat(40),
      sourcePath: "kernel.rs",
      displayedSha256: createHash("sha256").update(displayedSource).digest("hex"),
      displayedSource,
      displayedFragments: ["first", "last"],
    };
    const pinned = Buffer.from("first\nmiddle\nlast\n");
    expect(() => validateSourceEvidence(source, pinned)).not.toThrow();
    expect(() => validateSourceEvidence({ ...source, displayedSource: "changed" }, pinned))
      .toThrow("displayed excerpt digest is");
    expect(() => validateSourceEvidence({ ...source, displayedFragments: ["first"] }, pinned))
      .toThrow("displayed fragments do not reconstruct");
    expect(() => validateSourceEvidence(source, Buffer.from("first\nmiddle\n")))
      .toThrow("displayed fragment is absent");
    expect(() => validateSourceEvidence({ ...source, displayedSource: undefined }, pinned))
      .toThrow("displayed digest without displayed source");
  });

  it("catalogs every deterministic profiler import projection", () => {
    const profilerArtifacts = evidenceCatalog.localArtifacts.filter(
      (artifact) =>
        artifact.path.startsWith("examples/profiler_dispatch_import_v1/"),
    );

    expect(profilerArtifacts).toHaveLength(7);
    expect(profilerArtifacts.map((artifact) => artifact.path)).toEqual([
      "examples/profiler_dispatch_import_v1/dialects.json",
      "examples/profiler_dispatch_import_v1/capture-projection.json",
      "examples/profiler_dispatch_import_v1/bundle-v4-projection.json",
      "examples/profiler_dispatch_import_v1/receipt-v1-projection.json",
      "examples/profiler_dispatch_import_v1/publication-manifest.txt",
      "examples/profiler_dispatch_import_v1/agent-requests.jsonl",
      "examples/profiler_dispatch_import_v1/agent-responses.jsonl",
    ]);
    expect(
      profilerArtifacts.every((artifact) =>
        /^[0-9a-f]{64}$/u.test(artifact.sha256),
      ),
    ).toBe(true);

    const compilerEvidence = evidenceCatalog.gitObjects.find(
      (object) =>
        object.label === "in-process profiler dispatch import milestone",
    );
    expect(compilerEvidence).toMatchObject({
      commit: "a5438d82203eeb223b4ff8aa25ea6581b1f1af81",
      tree: "3a319954541af34b3d77366498e73fe4663f2044",
    });
    expect(compilerEvidence?.sourcePaths).toEqual(
      expect.arrayContaining([
        "crates/cargo-fe2o3/src/profile_command.rs",
        "crates/fe2o3-semantic-import/src/lib.rs",
        "crates/fe2o3-semantic-import/src/raw_source_relation.rs",
        "crates/fe2o3-semantic-import/src/bin/fe2o3-profiler-import.rs",
        "crates/fe2o3-semantic-import/tests/fixtures/rocprofv3-current-schema-fixture-v1.txt",
      ]),
    );
  });

  it("binds the SIMT row source without claiming tile or GPU qualification", () => {
    const lesson = lessons.find((candidate) => candidate.id === "cpu-semantic-simulation")!;
    const tab = lesson.tabs[6];
    expect(tab).toMatchObject({
      label: "SIMT row", kind: "kernel", sourceDigestScope: "file",
      sourceCommit: "2f4adb9f41317bfa647b0c96d8f12b13d0830aba",
      sourcePath: "examples/workgroup_sync_v1/src/kernel_row_affine_u32.rs",
      sourceSha256: "07adc0c50f24e51cb3d6c6bcb6cc1c8c6ff2a772c45ee2153435601eca2f39df",
    });
    expect(Buffer.byteLength(tab.code)).toBe(2668);
    expect(tab.code.indexOf("row_affine_sum_u32_v1")).toBe(885);
    expect(tab.sourceFragments).toBeUndefined();
    const claim = lesson.claims.find((candidate) => candidate.label === "SIMT row affine reduction and CPU replay")!;
    expect(claim.reference).toMatchObject({
      commit: "13e424bdef9f0cb9d0a073c86d8bebc8f190741a", tree: "ce5f8f94072d63ecb75cbacc38ea9816dcee16e7",
      commands: ["cargo test --locked -p rustc-codegen-fe2o3 --test production_neutral_workgroup_reduce_driver_v1 ordinary_row_affine_source_matches_oracle_and_replay -- --ignored --exact --test-threads=1"],
      sourcePaths: ["examples/workgroup_sync_v1/README.md","examples/workgroup_sync_v1/src/kernel_row_affine_u32.rs","examples/workgroup_sync_v1/src/row_affine_oracle.rs","examples/workgroup_sync_v1/tests/row_affine.rs","crates/rustc-codegen-fe2o3/tests/production_neutral_workgroup_reduce_driver_v1.rs","crates/rustc-codegen-fe2o3/tests/production_neutral_workgroup_reduce_driver_v1/row_affine_v1.rs","scripts/ci-local.sh","scripts/tests/ci-local-test-gate.sh"],
    });
    expect(claim.detail).toContain("688 successful runs");
    expect(claim.detail).toContain("20 simulator refusal checks and 2 stale schedule-binding checks");
    expect(claim.detail).toContain("tile and mixed variants");
    expect(claim.detail).toContain("gfx942/mi300x and gfx950/mi350");
    expect(claim.detail).toContain("does not qualify row Trace V2 or debugger CLI execution");
    expect(claim.detail).toContain("or predict performance");
    expect(evidenceCatalog.gitObjects).toContainEqual(expect.objectContaining({
      label: "cpu-semantic-simulation: SIMT row affine reduction and CPU replay",
      commit: claim.reference!.commit, tree: claim.reference!.tree,
      sourcePaths: claim.reference!.sourcePaths,
    }));
  });

  it("catalogs the exact Scan Bundle V5 qualification sources", () => {
    const scan = evidenceCatalog.gitObjects.find(
      (object) => object.label ===
        "cpu-semantic-simulation: Exact production KIR in the CPU semantic debugger",
    );

    expect(scan).toMatchObject({
      commit: "b15cf628f628db435cf12269c507b06fbef6597e",
      tree: "f77977b6f94411acd10f8d33159196425bee1b2d",
    });
    expect(scan?.sourcePaths).toEqual(expect.arrayContaining([
      "docs/target-neutral-workgroup-scan-v1.md",
      "crates/rustc-codegen-fe2o3/tests/production_neutral_workgroup_reduce_driver_v1.rs",
      "crates/fe2o3-lower-mir-kernel/src/production_semantic_kir_v1.rs",
      "examples/workgroup_sync_v1/src/kernel_scan_u32.rs",
      "examples/workgroup_sync_v1/src/kernel_scan_f32_exclusive.rs",
      "scripts/quickstart.sh",
    ]));
  });
});
