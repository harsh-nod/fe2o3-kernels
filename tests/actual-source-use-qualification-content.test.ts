import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const marker = "\n### Actual source-use qualification: distinguish data from a compiled kernel\n";
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ");
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("actual source-use qualification checkpoint", () => {
  it("preserves the previous tutorial byte-for-byte", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(49509);
    expect(sha256(prefix)).toBe("a9f86c57dd91807f5ee9c7da3b7a3f9b4beb086ddc2b76ef5038b04fddbcca5c");
  });

  it("distinguishes qualified observers from complete kernel admission", () => {
    for (const text of [
      "supersedes the earlier checkpoint", "not emitted operation indices",
      "separate single-visit assemblies", "not an arbitrary tolerance",
      "Every report storage/peak field", "not measured RSS",
      "331 model tests", "2,780 backend tests", "189 ignored",
      "306 comparison controls", "38 ordinary observation bodies", "52 artifacts",
      "without starting an inferior", "not a stopped-wave capture",
      "mandatory verification/normal continuation remain open",
      "M1/V1/V2/U1/U2/U3 (6/18)",
    ]) expect(appendix).toContain(text);
  });

  it("pins qualified compiler evidence without changing publication authority", () => {
    for (const hash of [
      "fa631dba8bfabac97b113c97973faebdc077201a",
      "cd8fc5439b107f0cf41ad654efcc6c64f7f3bd5badace6826ee87c1e39e94481",
      "5de5a0a1e20bdb71602cb2bf77136ed6ed7e34690406283a20190243215d7858",
    ]) expect(appendix).toContain(hash);
    const gate = readFileSync("config/publication-gate.json");
    expect(gate.length).toBe(376);
    expect(sha256(gate)).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
