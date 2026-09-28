import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const marker = "\n### Independent original fixed-query execution\n";
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ").toLowerCase();
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("independent original fixed-query execution", () => {
  it("preserves the preceding tutorial byte-for-byte", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(75333);
    expect(hash(prefix)).toBe("aa420394232f2d2f1043beabf0b2f87c129cf8859549b322f4beb5807a118dea");
  });
  it("distinguishes query controls from complete DATA and authentic routing", () => {
    for (const text of ["all 13 controls passed", "3,033 backend tests", "at most 32 query ordinals", "production routing remains unchanged", "not complete cache contents", "not one authentic budget", "M1/V1/V2/U1/U2/U3 (6/18)"])
      expect(appendix).toContain(text.toLowerCase());
  });
  it("pins qualification without activating public capture", () => {
    for (const sha of ["648a4885ad84817ea4e157bf72edb9668673cfc7", "e0631416e4fd17e3a6dd681fc66a2075cf0dde028c6ead22a6433e063f1edb34", "9bced215c5070113a49740b9f0dd60e717b7aa642e947ed577c5df3cf6f59fa4"])
      expect(appendix).toContain(sha);
    expect(hash(readFileSync("config/publication-gate.json"))).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
