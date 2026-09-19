import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { evidenceCatalog, tabEvidenceSource } from "../src/content/evidence-catalog";
import { lessons } from "../src/content/curriculum";
import type { CodeTab } from "../src/content/model";
import { validateSourceEvidence } from "../scripts/source-evidence";

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
    expect(wholeFileTabs).toHaveLength(8);
    expect(wholeFileTabs.map(({ tab }) => tab.sourcePath).sort()).toEqual([
      "examples/fill/src/lib.rs",
      "examples/gfx950_advanced_attention/src/ablation.rs",
      "examples/gfx950_gpt_oss_decode/src/kernel_components.rs",
      "examples/gfx950_gpt_oss_decode/src/kernel_held_fragments.rs",
      "examples/gfx950_gpt_oss_decode/src/kernel_interleaved_stores.rs",
      "examples/gfx950_gpt_oss_decode/src/kernel_pipelined_attention.rs",
      "examples/gfx950_gpt_oss_decode/src/kernel_router_serial.rs",
      "examples/gfx950_gpt_oss_decode/src/kernel_scalar_attention.rs",
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
