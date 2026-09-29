import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const hash = (value: Buffer) => createHash("sha256").update(value).digest("hex");
const notes = [
  {
    "path": "docs/source-bound-assertion-analysis-v1.md",
    "marker": "\n### Keep constant-analysis ownership separate from loop proofs\n",
    "bytes": 91640,
    "sha": "9024c75589ea0aed26302e494da2aa3488a0baa0a34af554e2e7f5681de1ed02"
  },
  {
    "path": "docs/gfx950-one-stop-cpu-v1.md",
    "marker": "\n## 6. Inspect an actual supervised debugger startup\n",
    "bytes": 7249,
    "sha": "51efc087dafac2eb0673e36b5a6f850ba6e1e0fd799065cda0d6a1031237ff22"
  }
];
const appendices = notes.map((note) => {
  const source = readFileSync(note.path, "utf8");
  return source.slice(source.indexOf(note.marker)).replace(/\s+/g, " ").toLowerCase();
});

describe("constant ownership and actual debugger startup notes", () => {
  for (const note of notes) {
    it(`preserves complete historical ${note.path}`, () => {
      const source = readFileSync(note.path, "utf8"), at = source.indexOf(note.marker);
      expect(at).toBeGreaterThan(0);
      expect(source.indexOf(note.marker, at + 1)).toBe(-1);
      const prefix = Buffer.from(source.slice(0, at), "utf8");
      expect(prefix.length).toBe(note.bytes);
      expect(hash(prefix)).toBe(note.sha);
    });
  }
  it("distinguishes retained constants from a compiler route or loop proof", () => {
    for (const text of ["74160065e8be19c36c5c84528134b39ae508ccaa", "12 component controls", "3,349 backend tests", "not candidate output", "does not connect the entire genuine capability driver", "d6d6e546d7dc5075f17500bffbc2a523dafb653efc0c4c67a02d953893784701"])
      expect(appendices[0]).toContain(text);
  });
  it("keeps failed startup distinct from accepted retry and physical capture", () => {
    for (const text of ["a8bbcf6165c41c71368ded8cadb7f071b16537ab", "did run the custom gdb", "failed its outer", "fresh coordinated ssh-quiet", "170 present", "23 absent", "398,626,885", "not complete import history", "physical capture remain false", "no native replay command", "f5bafcaf01ad08faadf40985059a20773de65447ffbae57369d160f9801f82e7", "ee1b7a38bd83cee5d0fa7eed55d31556eb9903c91c2adced5f5109538c85205d"])
      expect(appendices[1]).toContain(text);
  });
  it("preserves public gates and broad milestone limits", () => {
    for (const appendix of appendices) expect(appendix).toContain("m1/v1/v2/u1/u2/u3 (6/18)");
    expect(hash(readFileSync("config/publication-gate.json"))).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
