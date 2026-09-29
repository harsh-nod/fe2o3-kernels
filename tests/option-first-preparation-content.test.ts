import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const marker = "\n### Source-ordered Option preparation before enum analysis\n";
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ").toLowerCase();
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("source-ordered Option preparation checkpoint", () => {
  it("preserves the preceding qualified tutorial", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(80751);
    expect(hash(prefix)).toBe("31514e85caea7a77c2181178156b9536e1cd14e59c5ee1811bfacda77fa3236c");
  });
  it("states genuine positive data and the precise remaining boundary", () => {
    for (const text of ["all 12 new controls passed", "3,196 backend tests", "36 numerical helper runs", "nonempty Option data", "invalid-caller", "not the complete outer root chronology", "production routing remain open", "M1/V1/V2/U1/U2/U3 (6/18)"])
      expect(appendix).toContain(text.toLowerCase());
  });
  it("pins exact qualification without changing the public gate", () => {
    for (const sha of ["f47a7a8ad5365cd50249dc60a58e4f930a1447b2", "3acb9662acf50ca4a960c2e5492503c2c507b276296358956ddd1a911be3ff8f", "07419034ac2c045d5dce3209ee8bbf2c814dbf6bae049301192a669a8880774f"])
      expect(appendix).toContain(sha);
    expect(hash(readFileSync("config/publication-gate.json"))).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
