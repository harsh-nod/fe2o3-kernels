import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/physical-debugger-v2-source-checkpoint.md", "utf8");
const marker = "\n## Disabled scratch debug-type anchor (2026-09-27)\n";
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ").toLowerCase();
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("disabled scratch debug-type anchor", () => {
  it("preserves all preceding evidence byte-for-byte", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(21627);
    expect(hash(prefix)).toBe("29ca75c5fa19e6f62ee43b369305b02e4d36bb809027875d4defc5d3bc43d3c2");
  });
  it("distinguishes source and CPU controls from measured layout or capture", () => {
    for (const text of ["all 45 source controls", "264 maintenance groups / 1,033 checks", "530 bytes", "nine-type layout and current startup remain unqualified", "public gates remain disabled", "keep unavailable data unavailable", "M1/V1/V2/U1/U2/U3 (6/18)"])
      expect(appendix).toContain(text.toLowerCase());
  });
  it("pins the qualified compiler without changing the public gate", () => {
    for (const sha of ["889d52a22f14daa85e87590e85ff999864589f71", "3d2e29fa7968f707d628594cceb0607f554dba92732d2fa3d18f5ed2972ecc76", "000f42da869eb831421d077fb695fa219595364e8035b1cf8dd3e6c163a0e72c"])
      expect(appendix).toContain(sha);
    expect(hash(readFileSync("config/publication-gate.json"))).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
