import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { evidenceCatalog } from "../src/content/evidence-catalog";

describe("evidence source digest scopes", () => {
  it("classifies displayed tab excerpts separately from whole files", () => {
    const expected = [
      ["gfx950-fp4-gemm: Rust kernel", "gfx950_fp4_gemm_rust", "0a4a3d325d588ddad15697aa58f0e354cd9af20ae83f441432bd1489965fecad"],
      ["gfx950-fp8-gemm: Rust kernel", "gfx950_fp8_gemm_rust", "004ad607c55169f7f3291ea4cd74afc63e937877ec84efacf5b731f99248b9fd"],
      ["gfx950-fp4-attention: Rust kernel", "gfx950_fp4_attention_rust", "2e5adea75d61f9524f1f9ee9d0f00fa9c8e4a0fac3d1ebc2d8c49401b1797a96"],
      ["gfx950-fp8-attention: Rust kernel", "gfx950_fp8_attention_rust", "c926d59ea1746895f406b72d3e343c38d2b240faec4c0654675dec6e8e05b738"],
    ] as const;

    for (const [label, symbol, displayedSha256] of expected) {
      const source = evidenceCatalog.sources.find(
        (candidate) => candidate.label === label,
      );

      expect(source?.commit).toBe("c1383e97db732f9f1ff8105f10d5c2b5971143e1");
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
});
