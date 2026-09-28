import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const hash = (value: Buffer) => createHash("sha256").update(value).digest("hex");
const notes = [
  { path: "docs/source-bound-assertion-analysis-v1.md", marker: "\n### Follow original-order capability propagation\n", bytes: 89251, sha: "62bf8fd9dd2dce5fc5a8d37b527d3641acddde992359eadcdc7b614758fa0d56" },
  { path: "docs/gfx950-one-stop-cpu-v1.md", marker: "\n## 5. Separate startup inputs from captured debugger state\n", bytes: 4965, sha: "a7bb8798582a1f8a961d35bb53caf38b1a354557a9c77b451c37d3dec74d7e6c" },
];
const appendices = notes.map((note) => {
  const source = readFileSync(note.path, "utf8");
  return source.slice(source.indexOf(note.marker)).replace(/\s+/g, " ").toLowerCase();
});

describe("capability driver and debugger input-closure notes", () => {
  for (const note of notes) {
    it(`preserves the complete prior ${note.path}`, () => {
      const source = readFileSync(note.path, "utf8"), at = source.indexOf(note.marker);
      expect(at).toBeGreaterThan(0);
      expect(source.indexOf(note.marker, at + 1)).toBe(-1);
      const prefix = Buffer.from(source.slice(0, at), "utf8");
      expect(prefix.length).toBe(note.bytes);
      expect(hash(prefix)).toBe(note.sha);
    });
  }
  it("distinguishes helper controls from genuine full-driver execution", () => {
    for (const text of ["[0, 1, 2, 3, 4, 4]", "3,326 backend tests", "3,337", "356 model tests", "197 ignored", "do not exercise successful full-driver", "original early position", "production admission remain open"])
      expect(appendices[0]).toContain(text.toLowerCase());
  });
  it("does not turn selected input validation into physical capture", () => {
    for (const text of ["1,024 named files", "879 duties", "1,801,031,093", "29,285", "all five owned cgroups were absent", "only the first question", "no gdb", "no native replay command", "v4 remains open"])
      expect(appendices[1]).toContain(text);
  });
  it("pins qualified source and receipts without changing public maturity", () => {
    for (const text of ["a2663d4116357c94078a42ecd20fd0ddfe5028b5", "m1/v1/v2/u1/u2/u3 (6/18)"])
      for (const appendix of appendices) expect(appendix).toContain(text);
    expect(appendices[0]).toContain("3b064ab0103eb33ca04e13e230c9c39d1885a002e7c075e170ee4b9b4dfef715");
    expect(appendices[1]).toContain("c1a155f7ba8afc3138e323f3c96231efabdd519ceeb76f0f0fd58ec0885c2ec6");
    expect(hash(readFileSync("config/publication-gate.json"))).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
