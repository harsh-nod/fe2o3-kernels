import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const marker = "\n### Following enum, scalar and origin-analysis preparation\n";
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ").toLowerCase();
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("enum, scalar and origin-analysis qualification notes", () => {
  it("preserves the complete previously qualified tutorial", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(82681);
    expect(hash(prefix)).toBe("a4b456950cb34b5843d193576a2ee6cf03982f6331cc4b6816c1900bb4d14894");
  });
  it("distinguishes actual enum execution from isolated components", () => {
    for (const text of ["BeforeScalarV1", "3,209 backend tests", "3,222 backend tests", "3,233 backend tests", "36 numerical helper runs", "does not establish genuine nonempty enum", "origins and edges remain caller-owned", "neither component yet establishes the genuine continuation", "not measured native stack", "code-reading exercise", "admission remain open", "M1/V1/V2/U1/U2/U3 (6/18)"])
      expect(appendix).toContain(text.toLowerCase());
  });
  it("pins all implementations and receipts while preserving the public gate", () => {
    for (const sha of ["c23ae965b1d7d35376a6c0cb075d05d9a489eace", "5d05fe941523d4ccb82ae1f1976f8f6a3d82eeda", "43edfa3bf5587dbf145f2dc85f409e4ebd5bc787", "48468d97aac89ebcf2030f693789c2ad25a8913155febf11028f47c1bb1570a6", "2e33325b3fd92bf966024543f4ac208801ea1c0a70bf25d141efd0480774aaca", "3b78019f35bfc8fa5ffc70469b80e27e87de06380a9e533c0688dbf37118dea5"])
      expect(appendix).toContain(sha);
    expect(hash(readFileSync("config/publication-gate.json"))).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
