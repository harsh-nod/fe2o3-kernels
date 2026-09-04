import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { evidenceCatalog } from "../src/content/evidence-catalog";

describe("evidence source digest scopes", () => {
  it("classifies displayed tab excerpts separately from whole files", () => {
    const expected = [
      [
        "gfx950-fp4-gemm: Rust kernel",
        "gfx950_fp4_gemm_rust",
        "c6a00cb6e0df1e38563641bbc533a5725bf7a09d72bc8f50932c8b4c7b966616",
      ],
      [
        "gfx950-fp8-gemm: Rust kernel",
        "gfx950_fp8_gemm_rust",
        "0b05a0508c4970a64bed8fcb9c98341242076098aac56e6c3a4ca5ebb36c5055",
      ],
      [
        "gfx950-fp4-attention: Rust kernel",
        "gfx950_fp4_attention_rust",
        "f9a94dfe597a4a48271ca15bee859467540e43b29d2b5ae9d95c91a065015a49",
      ],
      [
        "gfx950-fp8-attention: Rust kernel",
        "gfx950_fp8_attention_rust",
        "f48050d4a711f4df78216c9414c6edac2ee3fed584be9d7755fb58076a566c5c",
      ],
    ] as const;

    for (const [label, symbol, displayedSha256] of expected) {
      const source = evidenceCatalog.sources.find(
        (candidate) => candidate.label === label,
      );

      expect(source?.commit).toBe("65ddfd76c4fe276dedcb5046d592d50b4bf921ac");
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
      commit: "199311b61c4b7ef08813f4ba60b61f569926c202",
      tree: "ecd73e0a1eff794d010d83cd93f72654d4937bd5",
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
