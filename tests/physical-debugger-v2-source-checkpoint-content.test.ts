import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lesson = readFileSync("docs/physical-debugger-v2-source-checkpoint.md", "utf8");
const text = lesson.replace(/\s+/g, " ");

describe("disabled physical debugger V2 source tutorial", () => {
  it("pins one actual compiler revision without suggesting activation", () => {
    const pin = lesson.match(/Compiler implementation: \[([a-f0-9]{40})\]\(https:\/\/github\.com\/harsh-nod\/fe2o3\/commit\/([a-f0-9]{40})\)\./);
    expect(pin).not.toBeNull();
    expect(pin?.[1]).toBe(pin?.[2]);
    for (const value of ["not a live-debugging command", "PROFILE is None",
      "runtime bindings are null", "supplies no command to start it",
      "gates must all be false"]) expect(text).toContain(value);
  });

  it("uses existing source and CPU checks without a debugger launch command", () => {
    for (const value of ["node verify-source.mjs", "tests/package-files-tests.mjs",
      "cargo test --offline --locked --all-targets", "physical-publication-disabled-v2",
      "FE2O3_ROCGDB_TEST_SOURCE", "tests/initialization-tests.mjs"])
      expect(text).toContain(value);
    expect(lesson).not.toContain("cargo run");
    expect(lesson).not.toContain("/home/harmenon");
  });

  it("separates actual bytes, unavailable results and later target validation", () => {
    for (const value of ["four actual register bytes plus 272", "typed unavailability",
      "real MI thread and frame PC", "oracle never supplies missing sample bytes",
      "two eight-byte canaries", "64 four-byte lane words", "architecture/DWARF",
      "separate observation", "JavaScript Number", "not current live handles"])
      expect(text).toContain(value);
  });

  it("attributes finite completed CPU and source checks", () => {
    for (const value of ["22 new Node controls", "58 Rust library tests",
      "30 transport tests", "14 metadata plus 20", "16 formatter, 12 output",
      "four resource groups", "60 selected files", "2,162,093 bytes", "2,112-KiB"])
      expect(text).toContain(value);
  });

  it("keeps public disabled source and private unexecuted build distinct", () => {
    for (const value of ["selection flag differs", "53 actual-source/static controls",
      "was not executed", "independent loaded-file review", "trap/CWSR/TTMP",
      "sampling exclusion", "not a successful physical-byte observation",
      "M1/V1/V2/U1/U2/U3 (6/18)", "V4 and the full tiled/physical curriculum remain open"])
      expect(text).toContain(value);
  });

  it("keeps output errors sticky without claiming delivery", () => {
    for (const value of ["one submission and one flush", "poison/revoke without retry",
      "explicitly initialized", "does not prove downstream delivery",
      "/dev/full only to exercise CPU stdio errors", "own GPL license"])
      expect(text).toContain(value);
  });
});
