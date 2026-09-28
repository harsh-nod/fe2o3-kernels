import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const marker = "\n### Shared preparation policy and retained direct comparisons\n";
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ").toLowerCase();
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("policy and direct comparison qualification checkpoint", () => {
  it("preserves the previous tutorial byte-for-byte", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(60039);
    expect(sha256(prefix)).toBe("695c9cb85b77fa86156e40f8f6c457839f1b9b3ab91b3f64285c1ab46fa14781");
  });

  it("separates component, build and native acceptance", () => {
    for (const text of ["without adding runtime wrapper calls","paid growth stays exact","left operand before the right","retain both physical payloads","drop payloads before refunding credits","Thirteen policy controls and twenty-five comparison controls","2,916 backend tests","38 lossless observation bodies","52 artifacts","DATA, not an authenticated","27 products total","No scope owner, launcher, debugger, target or GPU dispatch was invoked","native capture remain separate","M1/V1/V2/U1/U2/U3 (6/18)"]) expect(appendix).toContain(text.toLowerCase());
  });

  it("pins actual evidence without changing capture authority", () => {
    for (const hash of ["b53cce7fee8c0cdaa9f6c6b7f453d702944dcfae", "f17410b02a30ff6d0d3e65891e12a012dcb06bbccca5a396127892cdd645a970", "eed65c7bf4f9f19e965d823a3fd11619eee8b713d5b563c6877701ebdb3f4687", "e0bbbeb63445bc1c5a43b73533a48a94273e3c9614e11677112ff2f035f8583f"]) expect(appendix).toContain(hash);
    const gate = readFileSync("config/publication-gate.json");
    expect(gate.length).toBe(376);
    expect(sha256(gate)).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
