import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/physical-debugger-v2-source-checkpoint.md", "utf8");
const marker = "\n## Disabled loaded-maintenance source checkpoint (2026-09-27)\n";
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ").toLowerCase();
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("disabled loaded-maintenance source checkpoint", () => {
  it("preserves the preceding tutorial byte-for-byte", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(19209);
    expect(sha256(prefix)).toBe("82c111174a557846092ab219fa74089421844148de961df8dbafb88c44034c2c");
  });
  it("separates source and CPU success from remaining native requirements", () => {
    for (const text of ["all four manifest authority flags remain false", "264 real-helper groups with 1,033 checks", "six first-failure groups", "did not execute GDB or a target", "complete build-custody handoff", "native failure remains a failure", "retain unavailable data", "M1/V1/V2/U1/U2/U3 (6/18)"]) expect(appendix).toContain(text.toLowerCase());
  });
  it("pins the published evidence and leaves the public gate unchanged", () => {
    for (const hash of ["223c6225986bdd38208317c2caeb264e611e7344", "db644c80183b906fcdd24c0b0048305c288ea9096a843aafd41d42e522d0d6ee", "299c631a440c684bcea627046a0d9e0191c3eea86bbafaf550a3b16382564fe8"]) expect(appendix).toContain(hash);
    const gate = readFileSync("config/publication-gate.json");
    expect(gate.length).toBe(376);
    expect(sha256(gate)).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
