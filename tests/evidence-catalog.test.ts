import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { evidenceCatalog } from "../src/content/evidence-catalog";

describe("evidence source digest scopes", () => {
  it("classifies displayed tab excerpts separately from whole files", () => {
    const fp8Attention = evidenceCatalog.sources.find(
      (source) => source.label === "gfx950-fp8-attention: Rust kernel",
    );

    expect(fp8Attention?.fileSha256).toBeUndefined();
    expect(fp8Attention?.displayedSource).toContain(
      "pub fn gfx950_fp8_attention_rust",
    );
    expect(fp8Attention?.displayedFragments).toEqual([
      fp8Attention?.displayedSource,
    ]);
    expect(
      createHash("sha256")
        .update(fp8Attention?.displayedSource ?? "")
        .digest("hex"),
    ).toBe(fp8Attention?.displayedSha256);
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
