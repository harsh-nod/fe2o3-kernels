import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { evidenceCatalog } from "../src/content/evidence-catalog";

describe("evidence source digest scopes", () => {
  it("classifies displayed tab excerpts separately from whole files", () => {
    const expected = [
      ["gfx950-fp4-gemm: Rust kernel", "gfx950_fp4_gemm_rust", "478da27352b8d9acae02dbc10b28b353fcd985440f51af73145c3217505012c8"],
      ["gfx950-fp8-gemm: Rust kernel", "gfx950_fp8_gemm_rust", "d54dd98522394418dfa1835858b01be523de1ef6b9f493b866eb802d8c8b55bd"],
      ["gfx950-fp4-attention: Rust kernel", "gfx950_fp4_attention_rust", "3d4ec672e3f10b86fe60df65adfb7a1116f53ea1b458ded39e72d177f034437b"],
      ["gfx950-fp8-attention: Rust kernel", "gfx950_fp8_attention_rust", "98c3eb5b1040116c6eff349dfacfaf141855ad9145993d345e296cca573095c3"],
    ] as const;

    for (const [label, symbol, displayedSha256] of expected) {
      const source = evidenceCatalog.sources.find(
        (candidate) => candidate.label === label,
      );

      expect(source?.commit).toBe("a710b6c67a908caa23d2409a5d3c4a275103cd60");
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
