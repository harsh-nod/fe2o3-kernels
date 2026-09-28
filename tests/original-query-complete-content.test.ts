import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const marker = "\n### Complete bounded original-query DATA\n";
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ").toLowerCase();
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("complete bounded original-query DATA", () => {
  it("preserves the preceding tutorial byte-for-byte", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(76967);
    expect(hash(prefix)).toBe("a8a5755d83dae8ecc87496320b37d95ba08db04b14f5f161f0ccf3ddcf62d4e4");
  });
  it("separates complete component DATA from authentic chronology", () => {
    for (const text of ["all 21 new controls passed", "3,054 backend tests", "matching refusals never establish data equality", "same-source/shared-budget connector remains open", "production routing remains unchanged", "zero-cache contents are currently empty", "M1/V1/V2/U1/U2/U3 (6/18)"])
      expect(appendix).toContain(text.toLowerCase());
  });
  it("pins qualification without activating public capture", () => {
    for (const sha of ["bd10f4032fdd864207a6c6226e0d7b1f6a833fbc", "25cc97d2c25a6ad46be34683bc608d85bc5a82c0b2e3b1d86620d0ffcb797e06", "f32c6d1ac775edc0912ed512313605455bb1c95209619c91e86047f9fc1f5d17"])
      expect(appendix).toContain(sha);
    expect(hash(readFileSync("config/publication-gate.json"))).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
