import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const marker = "\n### Authentic source-factory proof retirement\n";
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ").toLowerCase();
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("authentic source-factory proof retirement", () => {
  it("preserves the preceding tutorial byte-for-byte", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(70851);
    expect(sha256(prefix)).toBe("07aa191a58a4760480781a93b04f66ed1dc9357ec6b1888904c7f7ade9b59f2b");
  });
  it("distinguishes authentic retirement from unsupported fixed-query coverage", () => {
    for (const text of ["original pending owner", "same panic object", "dropped before refund", "stops BEFORE visit", "Genuine nonempty/partial proof coverage remains open", "30 new controls", "356 model and 3,010 backend tests", "38 lossless observation bodies and 52 artifacts", "includes entry prework", "M1/V1/V2/U1/U2/U3 (6/18)"]) expect(appendix).toContain(text.toLowerCase());
  });
  it("pins evidence and preserves the disabled publication gate", () => {
    for (const hash of ["a1ec243fa821d1028e78b1b87da3d5030783a323", "ececc3c4d997af10d24f1eab430ae18219759ff8dd08e927d3ab4a05759271dd", "46700cb6e94958bafbca110293bf6d1e3c127484eff2c5ed1df7cbd389322c8f"]) expect(appendix).toContain(hash);
    const gate = readFileSync("config/publication-gate.json");
    expect(gate.length).toBe(376);
    expect(sha256(gate)).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
