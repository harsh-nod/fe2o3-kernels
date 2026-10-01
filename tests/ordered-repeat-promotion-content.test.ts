import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lesson = readFileSync("docs/ordered-composition-promotion-v1.md", "utf8");
const hash = (value: Buffer | string) => createHash("sha256").update(value).digest("hex");
const rows = [
  {
    "count": 1,
    "path": "examples/ordered-composition/repeat-1.rs",
    "bytes": 640,
    "sha256": "897b9b77fe1070673616be9441836fb1f913233f3c7f4a7681cb0cd32def451d"
  },
  {
    "count": 2,
    "path": "examples/ordered-composition/repeat-2.rs",
    "bytes": 640,
    "sha256": "976152b24bcdb5594007aa539144139c7f1af6b38e43413d890c1e01791c0b74"
  },
  {
    "count": 15,
    "path": "examples/ordered-composition/repeat-15.rs",
    "bytes": 641,
    "sha256": "7f1639d4675d081b85460490def32597225a9623bef2df25befe1e5335328275"
  }
];

describe("literal-repeat source-promotion tutorial", () => {
  it("retains exact complete compiler fixture copies for all three literal counts", () => {
    for (const row of rows) {
      const bytes = readFileSync(row.path);
      expect(bytes.length).toBe(row.bytes);
      expect(hash(bytes)).toBe(row.sha256);
      const source = bytes.toString();
      expect(source).toContain("repeat(" + row.count + ") { add(out, out, input1); }");
      expect(source).toContain("scratch(8); out(9); in(10) = a; in(11) = b; in(12) = c;");
      expect(source).not.toContain("max_grid");
      expect(lesson).toContain(row.sha256);
    }
  });

  it("shows the exact two-copy source region without rewriting the historical lesson", () => {
    const marker = "\n## 9. Promote a bounded literal repeat\n";
    const offset = lesson.indexOf(marker);
    expect(offset).toBeGreaterThan(0);
    expect(lesson.indexOf(marker, offset + 1)).toBe(-1);
    expect(hash(lesson.slice(0, offset))).toBe("084f6ad07bec01b3032b3055b1cab319949586231719581888c25c9074c9d2b4");
    const addition = lesson.slice(offset);
    const block = addition.split("\n```rust\n")[1]?.split("\n```")[0];
    expect(block).toBeDefined();
    expect(readFileSync("examples/ordered-composition/repeat-2.rs", "utf8")).toContain(block);
    expect(addition).toContain("../examples/ordered-composition/repeat-2.rs");
  });

  it("distinguishes flat materialization and private CPU checks from normal or GPU qualification", () => {
    const addition = lesson.slice(lesson.indexOf("\n## 9. Promote a bounded literal repeat\n"));
    for (const phrase of [
      "a209ae259299069479570cff7726cec7ff0b448e", "flat expanded instructions",
      "canonical decimal count", "fresh compilation", "wrapping-u32 oracle",
      "384 CPU", "288 deliberately wrong", "private live compiler-callback checks",
      "normal ranked/LLVM handoff", "pre-integration source snapshot",
      "No milestone or site publication pin", "aggregate result digests",
    ]) expect(addition).toContain(phrase);
  });
});
