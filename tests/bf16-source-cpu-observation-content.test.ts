import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lesson = readFileSync("docs/bf16-source-cpu-observation-v1.md", "utf8");
const text = lesson.replace(/\s+/g, " ");
const siblingMarker = "\n## Later source-CPU observation (2026-09-25)\n";

describe("genuine-source BF16 CPU observation", () => {
  it("requires the integrator's real immutable compiler link before publication", () => {
    expect(lesson).not.toContain("PUBLICATION_PIN_PENDING_IN_PRIVATE_DONOR");
    const pin = lesson.match(/Compiler implementation: \[([a-f0-9]{40})\]\(https:\/\/github\.com\/harsh-nod\/fe2o3\/commit\/([a-f0-9]{40})\)\./);
    expect(pin).not.toBeNull();
    expect(pin?.[1]).toBe(pin?.[2]);
    expect(text).toContain("not automatically evidence for a later merged tree");
  });

  it("uses existing contributor commands without inventing a public tiled CLI", () => {
    for (const value of [
      "compiler-developer qualification tutorial", "nightly-2026-04-03",
      "test --offline --locked -j2", "--test budgeted_v12_observation",
      "FE2O3_TEST_TILED_CPU_OUTPUT_V1", "mktemp -d /tmp/fe2o3-bf16-cpu.XXXXXX",
      "production_rustc_driver_v1::gfx942_tiled_region_qualification_v1_tests::observation::cpu::actual_bf16_source_cpu_ladder",
      "-- --exact --ignored --nocapture", "four actual rustc children",
      "must not already exist", "outside the compiler checkout",
      "300 seconds per child", "1,200 seconds", "not whole-family supervision",
    ]) expect(text).toContain(value);
    expect(lesson).not.toContain("cargo run");
    expect(lesson).not.toContain("/home/harmenon");
  });

  it("retains the actual source owner, ledger and borrowed result boundary", () => {
    for (const value of [
      "fcb26135ad4f931bb8dda63d631639a34dd8461e7801c22a1f6a383e0e735a3e",
      "view.emission().original().executable()",
      "AdmittedSimulationModuleV1::admit_v12_with_verification_budget",
      "V12CpuObservationInputV1::new(&typed_owner, &request)",
      "with_v12_cpu_observation_v1", "Copy + 'static",
      "not execution success", "whole unchanged graph", "not one compiler-wide meter",
      "8,049 canonical bytes, 20 blocks and 323 operations",
      "cannot recreate source authority",
    ]) expect(text).toContain(value);
  });

  it("separates actual four-component SSA, authored stores and independent expectations", () => {
    for (const value of [
      "*output = result[0]", "All 256 results", "Component 0 only",
      "64, 13 or 0 committed stores", "All 272 bytes", "Both 512-byte input backings",
      "row = 4 * (l / 16) + c", "column = l % 16",
      "values_row_major_le_hex", "output_with_canaries_le_hex",
      "integer F32 bit encoder", "never a substitute for absent observations",
      "Even output length 0", "not Engine allocation identities",
      "not a complete GEMM output implementation",
    ]) expect(text).toContain(value);
  });

  it("keeps exact refusals distinct from observation loss and rollback", () => {
    for (const value of [
      "18 positive runs", "16 request refusals", "offset 510, width 2",
      "lane 63, component 3", "before inspection", "not numerical success",
      "zero DELIVERED", "The engine may continue after delivery stops.",
      "do not prove engine cancellation, absence of effects or rollback",
      "exact full-Wave64 LaneId", "exact zero-argument builtin Trap",
      "Wrong arity, near names", "call-depth cap remains 1",
      "unrelated preflight error",
    ]) expect(text).toContain(value);
  });

  it("preserves lossless integers and original logical resource limits", () => {
    for (const value of [
      "18446744073709551615", "8191", "JavaScript `Number`",
      "131,072 steps", "65,536 debug deliveries", "128 MiB logical prepayment",
      "not measured RSS", "141,130,665,200,160", "2^54",
      "4 * 65536 * 4096 = 2^30", "no sibling meter resets",
      "875,607", "4,798,397,636,508,952", "63,600-byte",
    ]) expect(text).toContain(value);
  });

  it("attributes real R4 evidence without promoting unrelated capabilities", () => {
    for (const value of [
      "fe2o3-gfx942-bf16-source-cpu-observation-v1",
      "direct.cpu-observed.json", "direct.cpu-accepted.json", "accepted: false",
      "b7d726d610e312694b1137359c26b588618d77430193f619469dd293f7c2512f",
      "38a6527d121e4cb9db2555aa8d64a8a29e64907c28e8fceb2e07ae3ad2d196fa",
      "9ff9f2ed9bb8de48f140c1f9ad3de64597666d9a03a532359bff891c4635f351",
      "Earlier R1–R3 attempts remain failed evidence",
      "Normal ranked/formal/target handoff and native execution remain false",
      "no physical register capture", "edited-tile promotion", "arbitrary BF16 support",
      "M1/V1/V2/U1/U2/U3 (6/18)", "M2/U4/V4 remain open",
      "changes no global `FE2O3_PIN`, route, lab maturity",
    ]) expect(text).toContain(value);
  });

  it("adds sibling links without rewriting historical inspection or normal evidence", () => {
    for (const [path, sha256] of [
      ["docs/tiled-region-inspection-checkpoint-v1.md", "c9af490971b694d24bd33557c8dbf8c7d9aac6dfe7d60b9928a73ac21f892176"],
      ["docs/tiled-region-normal-continuation-v1.md", "3e4c5cdd173dba9987a2aac0d022ae00996eee0558869c7c95d662cd6daf0344"],
    ]) {
      const sibling = readFileSync(path, "utf8");
      const split = sibling.indexOf(siblingMarker);
      expect(split).toBeGreaterThan(0);
      expect(createHash("sha256").update(sibling.slice(0, split)).digest("hex")).toBe(sha256);
      expect(sibling.slice(split)).toContain("(bf16-source-cpu-observation-v1.md)");
      expect(sibling.slice(split)).toContain("does not change this historical checkpoint");
    }
  });
});
