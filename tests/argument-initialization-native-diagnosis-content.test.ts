import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const marker = "\n### Authentic argument initialization and loaded-runtime commit diagnosis\n";
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ").toLowerCase();
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("argument initialization and native refusal checkpoint", () => {
  it("preserves the previous tutorial byte-for-byte", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(65657);
    expect(sha256(prefix)).toBe("4d9e81910864f79d669b45e299a6d4df0f7014d4d1c1c6f77fbd16186a2b4976");
  });
  it("keeps component and native acceptance distinct", () => {
    for (const text of ["original root source, owner, graph and recipe-credit counter","index slots, then slice slots","initialization cannot restart","Fifteen new controls passed","2,957 backend tests","five actual rustc sessions and 36 positive numerical runs","38 lossless observation bodies and 52 artifacts","No stopped-wave capture was accepted","four selected process generations","not a passed native receipt","drop before refund","M1/V1/V2/U1/U2/U3 (6/18)"]) expect(appendix).toContain(text.toLowerCase());
  });
  it("pins actual evidence without changing capture authority", () => {
    for (const hash of ["88d3df97ec0cde7047e03f9fa3f56c9cb97fe7b1", "730715d7b653bbdf4cd4579f5353733acfd48e5b66a5ec7bdf9cd518b9791ca2", "784ee5b801c1cdae3ce0420587a9cb5c5f0258753001886b849f9f7254b5a8d1", "a3c5de301d7c2e052205f38d04af7bd56ad2dda572ca90f98da626c7d9f187b3"]) expect(appendix).toContain(hash);
    const gate = readFileSync("config/publication-gate.json");
    expect(gate.length).toBe(376);
    expect(sha256(gate)).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
