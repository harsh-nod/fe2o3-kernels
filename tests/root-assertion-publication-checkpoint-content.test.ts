import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const helper = readFileSync("docs/bf16-helper-source-cpu-observation-v1.md", "utf8");
const physical = readFileSync("docs/physical-debugger-v2-source-checkpoint.md", "utf8");
const lesson = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8").replace(/\s+/g, " ");
const helperMarker = "\n## Later source-bound assertion checkpoint (2026-09-26)\n";
const physicalMarker = "\n## Later readiness attempt: report-publication deadline (2026-09-26)\n";
const physicalNew = physical.slice(physical.indexOf(physicalMarker)).replace(/\s+/g, " ");

describe("source-bound assertions and refused publication checkpoint", () => {
  it("preserves both complete earlier lessons", () => {
    for (const [text, marker, digest] of [
      [helper, helperMarker, "14be357b17bd3fe5fd8b38ef50c0958b67e9cf355e19cfd12ae51552ae009a7d"],
      [physical, physicalMarker, "26247ffd0be04b9e89835e52c9b6bc5c4b6a500968d072331de15e17ed7dde15"],
    ]) {
      const at = text.indexOf(marker);
      expect(at).toBeGreaterThan(0);
      expect(text.indexOf(marker, at + 1)).toBe(-1);
      expect(createHash("sha256").update(text.slice(0, at)).digest("hex")).toBe(digest);
    }
  });

  it("pins actual published source and completed evidence", () => {
    for (const value of [
      "db351c0df32173d2423235eab2812bac5ccf50a6",
      "14a20812c89575654866900c96254f0388ec74152fa6fecad0e3a76492e9d7c7",
      "982d6fb4c72e95035589c14cdc0ed9e5e781587a6d72b3d51b783c49479af14c",
      "fa79dd458a3deb0269fdd0397f2c15f068f2cbac233295607649729dd5ab7854",
      "331 model and 2,536 backend tests", "18 checker controls",
      "459-file dependency trees", "1,632,943,151 bytes", "unchanged 2 GiB limit",
      "+8,535,477", "+8,535,647", "no peak override",
    ]) expect(lesson).toContain(value);
  });

  it("does not promote source binding or legacy decisions to a memory proof", () => {
    for (const value of [
      "same immutable source", "Matching copied hashes", "cannot detach that mask",
      "same assertion/range evaluator", "original work/storage ledger",
      "BoundsCheck decision convention is not a standalone memory-safety certificate",
      "Canonical access matching", "not RSS figures", "not slower GPU execution",
      "preserves numeric lexemes", "JavaScript Number",
    ]) expect(lesson).toContain(value);
  });

  it("preserves zero actual assertion coverage and duplicate diagnostic rows", () => {
    for (const value of [
      "19 root blocks", "**zero assertion terminators**", "zero true decisions",
      "zero evaluator logical work", "Four repeated diagnostic rows",
      "wrong launch has none", "not four distinct source owners",
      "Positive and hostile assertion cases", "separate component tests",
      "A diagnostic line alone is not whole-gate success",
    ]) expect(lesson).toContain(value);
  });

  it("keeps complete recipe and normal compilation explicitly pending", () => {
    for (const value of [
      "Normal helper compilation still refuses", "actual input reads",
      "Option-guarded output write", "base mask must remain immutable",
      "real generated coordinates", "formal/target/LLVM continuation remain open",
      "not qualify inline assembly", "physical register allocation",
      "M1/V1/V2/U1/U2/U3 (6/18)",
    ]) expect(lesson).toContain(value);
    expect(helper).toContain("(source-bound-assertion-analysis-v1.md)");
  });

  it("does not turn failed publication or cleanup into physical bytes", () => {
    for (const value of [
      "db351c0df32173d2423235eab2812bac5ccf50a6", "raw-report publication with Deadline",
      "zero capture-report bytes", "does not prove the earlier setup refusal repeated",
      "missing capture bytes must remain unavailable", "not zero registers",
      "GPU dispatch remain unknown", "all five retained process IDs were absent",
      "family owner reaped an adopted inferior", "cleanup, not physical capture",
      "without automatic retry", "without resetting the positive deadline",
      "9663f1bad0e4ceff58d9c28fba39d5337756b4fb5ecfc77afb7dfce81e57eeb1",
      "f26693798f4ae476d4c85caf817c20d84df5acd615c181cbaab6671cbe99d2c7",
    ]) expect(physicalNew).toContain(value);
  });

  it("adds no activation or global pin change", () => {
    expect(physicalNew).toContain("Public capture stays disabled");
    expect(physicalNew).toContain("no live route, activation command");
    expect(lesson).toContain("No public debugger activation");
    expect(lesson).toContain("global compiler pin changes");
    expect(helper + physical + lesson).not.toContain("/home/harmenon");
  });
});
