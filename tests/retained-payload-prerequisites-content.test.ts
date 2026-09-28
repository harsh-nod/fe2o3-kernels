import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const marker = "\n### Retained analysis and proof payloads before factory integration\n";
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ").toLowerCase();
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("retained analysis and proof-payload checkpoint", () => {
  it("preserves the previous tutorial byte-for-byte", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(68443);
    expect(sha256(prefix)).toBe("4ff181498640b8ca4b680896a9edc3fae85b6f3deff4c2d5ed2d626e7ab25e6b");
  });
  it("separates retained components from whole-factory qualification", () => {
    for (const text of ["three opaque model-preparation owners","same panic object","then refund","All 48 new controls passed","356 model and 2,980 backend tests","38 lossless observation bodies and 52 artifacts","missing fixed-query coverage is a gap","not whole-factory qualification or native GPU evidence","M1/V1/V2/U1/U2/U3 (6/18)"]) expect(appendix).toContain(text.toLowerCase());
  });
  it("pins evidence without changing the capture gate", () => {
    for (const hash of ["20fa1338ce815a4dde2ee33c4a13931780ebbd47","5d56ce6638ca1c3ef7b4b1406e17a76e229276da6aa92ff72ec1650fcacd730b","baec6bb9110ca2f6e56a90bcd835b33cd3b651c8c49dc2fde6566b4119ac5f5b"]) expect(appendix).toContain(hash);
    const gate = readFileSync("config/publication-gate.json");
    expect(gate.length).toBe(376);
    expect(sha256(gate)).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
