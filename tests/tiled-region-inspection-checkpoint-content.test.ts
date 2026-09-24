import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lesson = readFileSync("docs/tiled-region-inspection-checkpoint-v1.md", "utf8");

describe("source-owned tiled inspection checkpoint", () => {
  it("keeps the original borrowed phase and subsequent checks explicit", () => {
    for (const text of [
      "borrowed pre-ranked view", "raw/semantic", "same SSA producers",
      "original\nmaterialization callback", "retained phase budget",
      "not a single\ncompiler-wide meter", "cannot recreate that custody",
      "Later mandatory ranked, formal and target validation remains unchanged",
    ]) expect(lesson).toContain(text);
  });

  it("uses the actual nominal zero-accumulator fragment without asserting GEMM results", () => {
    for (const text of [
      "WaveLane::<Wave64>::current()", "Bf16MfmaAMatrix::row_major",
      "Bf16MfmaBMatrix::row_major", "F32AccumulatorFragment::zero(&lane)",
      "DeviceMatrix::current()", "one result-component output use",
      "not a complete\nGEMM implementation or numerical correctness result",
      "actual imported graph", "scan caps",
    ]) expect(lesson).toContain(text);
  });

  it("separates protocol mocks and static builds from activation and physical evidence", () => {
    for (const text of [
      "72 CPU/parser controls", "late running notifications",
      "not\nan actual GPU stop or physical sample", "Native activation remains disabled",
      "separate qualification", "no native replay command",
      "M1/V1/V2/U1/U2/U3 (6/18)", "M2/U4/V4 remain open",
      "No global FE2O3_PIN, lab maturity",
    ]) expect(lesson).toContain(text);
    expect(lesson).not.toContain("ROOT_");
    expect(lesson).toContain("inspection callback was reached with the original owner and ledger");
    expect(lesson).toContain("not a fresh run of the current frontend");
    expect(lesson).toContain("1b2e5dd364e63c5d107115f379e9c21a6a84236e");
    expect(lesson).toContain("remaining children did not run");
    expect(lesson).not.toContain("cargo run");
    expect(lesson).not.toContain("--pid");
  });
});
