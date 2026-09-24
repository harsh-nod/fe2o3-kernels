import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lesson = readFileSync("docs/tiled-region-normal-continuation-v1.md", "utf8");
const earlier = readFileSync("docs/tiled-region-inspection-checkpoint-v1.md", "utf8");

describe("same-owner BF16 normal continuation checkpoint", () => {
  it("separates the published extension from the historical source-only checkpoint", () => {
    expect(lesson).toContain("2af2a8d7dc75d8edac3da50325c91ea1911f8324");
    expect(lesson).toContain("1b2e5dd364e63c5d107115f379e9c21a6a84236e");
    expect(earlier).toContain("Historical checkpoint:");
    expect(earlier).toContain("(tiled-region-normal-continuation-v1.md)");
    expect(earlier).toContain("Normal ranked/formal/target continuation, numerical simulation, promotion");
    expect(lesson).toContain("not automatically to every");
  });

  it("uses the existing bounded contributor test without inventing a public tiled command", () => {
    for (const text of [
      "compiler-developer qualification tutorial", "nightly-2026-04-03",
      "test --offline --locked -j2", "FE2O3_TEST_TILED_REGION_OUTPUT_V1",
      "mktemp -d /tmp/fe2o3-bf16-normal.XXXXXX",
      "production_rustc_driver_v1::gfx942_tiled_region_qualification_v1_tests::observation::normal::actual_bf16_normal_ladder",
      "-- --exact --ignored --nocapture", "300 seconds per child", "1,200 seconds",
      "must not already exist", "no public tiled CLI or tiled profile promotion",
    ]) expect(lesson).toContain(text);
    expect(lesson).not.toContain("cargo run");
    expect(lesson).not.toContain("/home/harmenon");
  });

  it("retains live-owner identity, separate artifact roles and actual runtime obligations", () => {
    for (const text of [
      "same materialized", "not reconstructed from the copied inspection JSON",
      "full original V12 identity", "including canonical byte length",
      "not\none compiler-wide meter", "direct.normal.ll", "52,795",
      "direct.worker.ll", "61,355", "direct.handoff-v2.bin", "61,654",
      "One runtime bounds requirement and two runtime alias requirements remain.",
      "no output-publication attempt", "ce2b72e8d05a6d5850e91bc39ee6912448cf78603d33dabe96cd892de3ad181e",
      "9ba72e9b492666b3be9dea5c490710b5f9d988a1821dc92aa19efd76bfc60cd7",
    ]) expect(lesson).toContain(text);
  });

  it("leaves numerical, native, milestone and site-default boundaries unchanged", () => {
    for (const text of [
      "Numerical CPU qualification is false; native execution is false.",
      "not a complete GEMM", "no compiler, worker or launch authority",
      "M1/V1/V2/U1/U2/U3 (6/18)", "M2/U4/V4 remain open",
      "changes no `FE2O3_PIN`, live route or lab maturity",
      "not whole-family supervision",
    ]) expect(lesson).toContain(text);
  });
});
