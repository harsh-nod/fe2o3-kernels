import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const marker = "\n### Bounds preparation: exact source guards before continuation\n";
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ").toLowerCase();
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("bounds components qualification checkpoint", () => {
  it("preserves the previous tutorial byte-for-byte", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(53778);
    expect(sha256(prefix)).toBe("c93fcdeb37ccf27338a5f5190b96a316e1a293dc1c8bf7059b7c4346387012b1");
  });

  it("distinguishes qualified components from complete source admission", () => {
    for (const text of ["original BoundsCheck Assert","unique success predecessor","source coordinates remain distinct","authentic producer state","lazy first-use event","85 new tests","2,865 backend tests","38 normal observation bodies","52 artifacts","59 focused CPU controls","native qualification remain separate work","M1/V1/V2/U1/U2/U3 (6/18)"]) expect(appendix).toContain(text.toLowerCase());
  });

  it("pins compiler evidence without changing capture authority", () => {
    for (const hash of ["da9793fe559f7de56d32c78e077037639e0a4455", "048bbef5179abe42c9ae65ccce21a8a29d1cf82cdd1d6c2559d71832e932e161", "b6410a81a846e5e4d946e609a468a9830bfb285026ca29243d292bfd7658756e"]) expect(appendix).toContain(hash);
    const gate = readFileSync("config/publication-gate.json");
    expect(gate.length).toBe(376);
    expect(sha256(gate)).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
