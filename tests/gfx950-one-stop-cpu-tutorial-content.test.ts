import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lesson = readFileSync("docs/gfx950-one-stop-cpu-v1.md", "utf8");
const emptyQueue = readFileSync("docs/gfx950-empty-queue-lifecycle-v1.md", "utf8");
const hash = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");

describe("one-stop CPU-only contributor lesson", () => {
  it("pins the reviewed implementation without transferring historical native acceptance", () => {
    const pin = "a9b636ec4475a15e13187d78d53692d7e6b834e4";
    expect(lesson).toContain("Compiler implementation commit: `" + pin + "`.");
    expect(lesson).toContain("/blob/" + pin + "/docs/gfx950-debug-one-stop-cpu-qualification-20260924.md");
    for (const phrase of [
      "CPU/static qualification only", "the one-stop target was NOT RUN",
      "zero publications and zero dispatches", "does\nnot transfer",
      "separate later snapshot", "does not retroactively relabel",
    ]) expect(lesson).toContain(phrase);
  });

  it("keeps typed packet ownership and native unsafe prerequisites distinct", () => {
    for (const phrase of [
      "same prepared packet", "cannot be reconstructed from JSON",
      "or an empty-queue owner", "whole bytes, descriptor, ABI, segments",
      "272-byte logical output", "not observed GPU output",
      "one-shot", "original 60-second deadline", "possible-publication facts",
      "Drop is not native cleanup", "776-byte checkpoint",
      "checkpoint bytes are not runtime authority",
      "signal base and its atomic value at base+8 remain distinct",
      "Before any publication effect", "same-client pre-runtime attachment",
      "LoadedSuccess and sole ACK", "trap/CWSR/TTMP", "sampler exclusion",
      "consumed native pre-resume gates",
    ]) expect(lesson).toContain(phrase);
  });

  it("records actual CPU controls and both ELF symbols without execution claims", () => {
    for (const phrase of [
      "2,057 test executions across 18 Rust result groups", "configurations overlap",
      "21 Rust controls, 12 Node controls", "strict Clippy, CPU build and readelf checks",
      "actual first-main entry symbol", "real target-owned checkpoint",
      "without dummy or dead-code substitutes", "4,162,064-byte PIE",
      "not runtime addresses or a ready debugger",
      "The executable, debugger and scope were not invoked by that gate",
    ]) expect(lesson).toContain(phrase);
    for (const sha of [
      "5b40adfaf8c6b68c7e6da997d7ac3b536c339e8ab39e36dc0d56d81624b20a54",
      "7261b67fece74456763f360a16b88e12a9486d5fad0938ec56054536cbab6531",
      "1ec72e9d53df21a510089951a6bba9a0167d8b7e2323e3dcd1d1ec5add3f3bdb",
    ]) expect(lesson).toContain(sha);
  });

  it("does not add a native replay command, live UI or milestone acceptance", () => {
    for (const phrase of [
      "no native replay command", "There is no environment or JSON switch",
      "still needs integration and fresh qualification",
      "not an actual DEBUG_TRAP observation", "No physical register or memory sample",
      "new live route", "V4 remains open", "M1/V1/V2/U1/U2/U3 (6/18)",
      "No global `FE2O3_PIN`, maturity level or support",
    ]) expect(lesson).toContain(phrase);
    expect(lesson).not.toContain("```");
    expect(lesson).not.toContain("cargo run");
    expect(lesson).not.toContain("--pid");
  });

  it("only appends a sibling link to the unchanged empty-queue lesson", () => {
    const marker = "\n## Separate one-stop CPU-only continuation\n";
    const offset = emptyQueue.indexOf(marker);
    expect(offset).toBeGreaterThan(0);
    expect(emptyQueue.indexOf(marker, offset + 1)).toBe(-1);
    expect(hash(emptyQueue.slice(0, offset))).toBe("e31987f71459311fb9ba50c29fe0658a760ddbe801582511fcc1c710d5d8f5f9");
    expect(emptyQueue.slice(offset)).toContain("gfx950-one-stop-cpu-v1.md");
    expect(emptyQueue.slice(offset)).toContain("historical packet-incapable");
    expect(emptyQueue.slice(offset)).toContain("physical capture remain unqualified");
  });

  it("preserves all seven historical empty-queue evidence files byte for byte", () => {
    const rows: [string, number, string][] = [
      ["local-observation.json", 1336, "0992c06ee4801e7f19ad7d85a39bb28c7b4e9ba7607c9acbb86c5b0244a8085b"],
      ["local-summary.json", 475, "67e061ac3c74f711d9d01338b2c97d33f2cc38ca51f04532747e326e4fac0c8a"],
      ["inner-cleanup.json", 842, "725cf7a4da5781c5806fc08dc98ffc3ed3c85c8a0495d750318a74d13ae6bdab"],
      ["outer-family.json", 1586, "e70cc98571a99bca5d9f1ec60c76fd9efa0b383d8ef9243a09e8b1a968072531"],
      ["startup-qualified.json", 529, "6353777415da0b0147d06681760205ef013bd4bc9a512e81d098a3dcfed6dd0f"],
      ["one-stop-O0-report.json", 22970, "90cdca4b1143ee1ff981bb385140c0853e96cb858f9220c75004a56dfacf359b"],
      ["one-stop-O3-report.json", 22970, "a0a147beb824f931c91887181b519511599e82f39fc417bd756be7644ea103af"],
    ];
    for (const [name, bytes, sha] of rows) {
      const content = readFileSync("docs/evidence/gfx950-empty-queue-20260924/" + name);
      expect(content.length).toBe(bytes);
      expect(hash(content)).toBe(sha);
    }
  });
});
