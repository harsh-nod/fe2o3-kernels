import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { evidenceCatalog } from "../src/content/evidence-catalog";

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

      expect(source?.commit).toBe("6399ee2cf8456c6237a89d5507f50c1872602269");
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
        (source) =>
          source.displayedSha256 === undefined &&
          source.displayedSource === undefined,
      ),
    ).toBe(true);
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
