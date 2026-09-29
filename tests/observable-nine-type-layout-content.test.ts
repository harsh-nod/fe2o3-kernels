import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/physical-debugger-v2-source-checkpoint.md", "utf8");
const marker = "\n## Actual nine-type debugger layout (2026-09-28)\n";
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ").toLowerCase();
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("actual nine-type debugger layout", () => {
  it("preserves all preceding tutorial bytes", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(23437);
    expect(hash(prefix)).toBe("c2741c4e8b391507544ba63dc30914c068ca1d16c1d69f526f0dd92dbe96ca14");
  });
  it("keeps the measured scope and remaining limitations explicit", () => {
    for (const text of ["all nine required types","all 152 controls passed","loaded_maintenance_scratch | 624","native_adapter | 8,760","15,144 bytes","65,536-byte cap","nine records / 2,543","current startup and native capture remain unqualified","keep unavailable data unavailable","public gates remain disabled","M1/V1/V2/U1/U2/U3 (6/18)"])
      expect(appendix).toContain(text.toLowerCase());
  });
  it("pins the qualified compiler without enabling public capture", () => {
    for (const sha of ["2ef4196907c0e80f912d5318a9ea1eb3a884c961","021eb18660b6e2867ab8f24c154a1cc5edd7e42e853e0eea21de61e5d32ea16a","1b6c4fe2615d37902b33a446a0f9d35415fbc5dfbe28e25add98eed9f2a10b73"])
      expect(appendix).toContain(sha);
    expect(hash(readFileSync("config/publication-gate.json"))).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
