import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lesson = readFileSync("docs/bf16-helper-source-cpu-observation-v1.md", "utf8");
const marker = "\n## Later routing and capability checkpoint (2026-09-26)\n";
const split = lesson.indexOf(marker);
const checkpoint = lesson.slice(split).replace(/\s+/g, " ");

describe("BF16 helper routing checkpoint", () => {
  it("preserves the first R19 lesson byte-for-byte", () => {
    expect(split).toBeGreaterThan(0);
    expect(lesson.indexOf(marker, split + 1)).toBe(-1);
    expect(createHash("sha256").update(lesson.slice(0, split)).digest("hex"))
      .toBe("e2a4cd39bdb401940bce9275d34f31c8383833c767b1586bd9b9e534819d5d6a");
  });

  it("links immutable implementation and genuine evidence without promoting synthetic controls", () => {
    for (const value of [
      "123a2c59c759e506215e091162352975a75ca0e7",
      "424d6190de69162cdb8a01058ca2c17f0d3df22cd616da2956f44101faa2243c",
      "281,039 bytes", "18 numerical positives and 16 request refusals",
      "83,943,541 additional work units", "1,632,943,151-byte logical peak",
      "not a genuine combined C1/C2/C3 positive", "synthetic",
      "2,381 backend test executions", "189 ignored tests were not run",
      "latest genuine source run preceded C1/C3 integration",
    ]) expect(checkpoint).toContain(value);
  });

  it("retains original-owner, array-result and pending compilation boundaries", () => {
    for (const value of [
      "physical effect set is empty", "under the original ledger",
      "Six whole-route boundary probes and four isolated custody probes",
      "incomplete-capability refusal", "shares the direct-MFMA operand matcher",
      "actual caller Call, helper Matrix and helper Return",
      "four function-qualified component rows", "does not acquire accumulator provenance",
      "metered source-derived preparation", "final replay (C2)",
      "controls (C4)", "formal/target continuation (N3)",
      "Move operands must be consumed only once",
      "LLVM emission, native helper execution and physical register capture remain unqualified",
      "M1/V1/V2/U1/U2/U3 (6/18)", "closes no milestone",
    ]) expect(checkpoint).toContain(value);
    expect(lesson).not.toContain("/home/harmenon");
  });
});

