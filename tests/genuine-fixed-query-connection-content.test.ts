import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const marker = "\n### Authentic same-source fixed-query comparison\n";
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ").toLowerCase();
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("authentic same-source fixed-query connection", () => {
  it("preserves all preceding tutorial bytes", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(78567);
    expect(hash(prefix)).toBe("e3138e5f89c6ed97d71f7a5d384ddb8aec5a93623be58bf47ca6f80757b3788d");
  });
  it("keeps the measured scope and remaining limitations explicit", () => {
    for (const text of ["same authenticated source and original resource Budget","all 15 new controls passed","3,184 backend tests","36 positive numerical CPU runs","zero Fixed queries","BF16 semantic Assert is unavailable","production route remain open","M1/V1/V2/U1/U2/U3 (6/18)"])
      expect(appendix).toContain(text.toLowerCase());
  });
  it("pins the qualified compiler without enabling public capture", () => {
    for (const sha of ["2ef4196907c0e80f912d5318a9ea1eb3a884c961","eff86f458e847e6d93bb0f227987497995ec70deec6f03c7f047baeab6f4e581","6201a5c2880b4b9f036e40df65a86e9d79991f67a28a5a06eb1bec713bdb7390"])
      expect(appendix).toContain(sha);
    expect(hash(readFileSync("config/publication-gate.json"))).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
