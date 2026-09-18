import { createHash, webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import used from "../examples/ordered_region_used_debugger_v31_r5.json";
import { ORDERED_REGION_RETAINED_INPUT as retained } from "../src/content/ordered-region-retained-input";
import { projectOrderedRegionObservation, type OrderedRegionObservationInput } from "../src/content/ordered-region-observation";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());
const sha = (raw: string) => createHash("sha256").update(raw).digest("hex");
// Rehashed mutations below are explicitly synthetic NEGATIVE format controls,
// never additional execution observations or production fixture replacements.
function changedSidecar(change: (report: typeof used) => void): OrderedRegionObservationInput {
  const report = structuredClone(used); change(report); const debuggerUtf8 = JSON.stringify(report);
  return { ...retained, variants: [{ ...retained.variants[0], debuggerUtf8, expectedDebuggerSha256: sha(debuggerUtf8) }, retained.variants[1]] };
}
describe("retained actual-source ordered-region display projection", () => {
  it("keeps genuine r5 plan, logical observations, identities and distinct compilations", async () => {
    const result = await projectOrderedRegionObservation(retained);
    expect(result.status).toBe("ready"); if (result.status !== "ready") throw new Error(result.detail);
    expect(result.variants).toHaveLength(2);
    const [first, second] = result.variants;
    expect(first.coordinate).toEqual([0, 1, 0]); expect(first.rawBlock).toBe(8);
    expect(first.inputIds).toEqual([12, 2, 4]); expect(first.resultId).toBe(13);
    expect(first.roles).toEqual({ scratch: 32, output: 33, inputs: [34, 35, 36] });
    expect(first.cases).toHaveLength(6); expect(first.cases[5].afterResults).toEqual(Array(64).fill(46));
    expect(first.cases[1].beforeInputs).toEqual([0xffff_ffff, 0, 1]);
    expect(first.cases[1].afterResults).toEqual(Array(64).fill(0));
    expect(first.cases[0].recordIndices[0]).toEqual([2, 3]);
    expect(first.cases[0].records).toBe(1216);
    expect(first.sourceSha256).toBe(second.sourceSha256);
    expect(first.canonicalIdentity).not.toBe(second.canonicalIdentity);
    expect(first.sidecarSha256).not.toBe(second.sidecarSha256);
    for (const value of [result, result.variants, first, first.roles, first.roles.inputs, first.cases, first.cases[0], first.cases[0].recordIndices[0]]) expect(Object.isFrozen(value)).toBe(true);
    expect(JSON.stringify(result)).not.toContain('"physical_values"');
  });

  it("rejects changed sidecar/ladder bytes and independent pin substitution", async () => {
    for (const input of [
      { ...retained, sourceLadderUtf8: `${retained.sourceLadderUtf8} ` },
      { ...retained, expectedSourceLadderSha256: "1".repeat(64) },
      { ...retained, variants: [{ ...retained.variants[0], debuggerUtf8: `${retained.variants[0].debuggerUtf8} ` }, retained.variants[1]] },
      { ...retained, variants: [{ ...retained.variants[0], expectedDebuggerSha256: "1".repeat(64) }, retained.variants[1]] },
    ]) expect((await projectOrderedRegionObservation(input)).status).toBe("invalid");
  });

  it("rejects foreign source/canonical/semantic identities and length even under a rehashed sidecar", async () => {
    const changes: Array<(report: typeof used) => void> = [
      report => { report.canonical_v16_length--; }, report => { report.canonical_v16_identity = "1".repeat(64); },
      report => { report.canonical_bytes_sha256 = "2".repeat(64); }, report => { report.semantic_sha256 = "3".repeat(64); },
      report => { report.region_source_ids[3] = "4".repeat(64); },
      report => { report.rustc_identity_inventory_sha256 = "5".repeat(64); },
      report => { report.rustc_preflight_plan_sha256 = "6".repeat(64); },
    ];
    for (const change of changes) {
      const result = await projectOrderedRegionObservation(changedSidecar(change));
      expect(result.status).toBe("invalid"); if (result.status !== "ready") expect(result.detail).toContain("another canonical, semantic or source observation");
    }
  });

  it("rejects physical values, microsteps, elevated authority and unsupported target/control profiles", async () => {
    for (const change of [
      (report: typeof used) => { report.physical_register_values = "captured"; },
      (report: typeof used) => { report.scratch_values = "42"; },
      (report: typeof used) => { report.exec_values = "captured"; },
      (report: typeof used) => { report.instruction_microsteps = "available"; },
      (report: typeof used) => { report.source_authentication_from_sidecar = true; },
      (report: typeof used) => { report.detached_transcript_admission = true; },
      (report: typeof used) => { report.grants_artifact_or_launch_authority = true; },
      (report: typeof used) => { report.grants_proof_or_resume_authority = true; },
      (report: typeof used) => { report.hardware_observed = true; },
      (report: typeof used) => { report.declared_target = "gfx950:xnack-"; },
      (report: typeof used) => { report.declared_wave_width = 32; },
      (report: typeof used) => { report.same_kir_second_request_not_interchangeable = false; },
      (report: typeof used) => { report.wrong_index_width_and_wave_not_interchangeable = false; },
      (report: typeof used) => { report.capture_count = 0; },
      (report: typeof used) => { report.truncated_control = "none"; },
      (report: typeof used) => { report.unavailable_control = "none"; },
      (report: typeof used) => { Object.assign(report, { final_artifact_mapping: "invented" }); },
    ]) expect((await projectOrderedRegionObservation(changedSidecar(change))).status).toBe("invalid");
  });

  it("bounds roles/IDs/records/cases and rejects false or duplicated before/after data", async () => {
    for (const change of [
      (report: typeof used) => { report.planned_physical_roles.scratch = report.planned_physical_roles.output; },
      (report: typeof used) => { report.planned_physical_roles.inputs[0] = 64; },
      (report: typeof used) => { report.logical_result_value_id = 2 ** 53; },
      (report: typeof used) => { report.kir_coordinate[0] = -1; },
      (report: typeof used) => { report.kir_raw_block_id = 1.5; },
      (report: typeof used) => { report.cpu_cases.pop(); },
      (report: typeof used) => { report.cpu_cases[1] = report.cpu_cases[0]; },
      (report: typeof used) => { report.cpu_cases[0].region_results_after_u32.pop(); },
      (report: typeof used) => { report.cpu_cases[0].region_results_after_u32[0] = 1; },
      (report: typeof used) => { report.cpu_cases[0].region_results_after_u32[0] = -1; },
      (report: typeof used) => { report.cpu_cases[0].region_inputs_before_u32_each_lane[0] = 1; },
      (report: typeof used) => { report.cpu_cases[0].before_after_record_indices[0][1]++; },
      (report: typeof used) => { report.cpu_cases[0].before_after_record_indices[1] = report.cpu_cases[0].before_after_record_indices[0]; },
      (report: typeof used) => { report.cpu_cases[0].records = 2; },
      (report: typeof used) => { report.cpu_cases[0].records = 16385; },
      (report: typeof used) => { report.cpu_cases[0].transcript_completeness = "truncated"; },
      (report: typeof used) => { report.cpu_cases[0].independent_oracle_matches = false; },
      (report: typeof used) => { report.cpu_cases[0].canaries_unchanged = false; },
      (report: typeof used) => { report.limits.logical_view_storage = 1025; },
    ]) expect((await projectOrderedRegionObservation(changedSidecar(change))).status).toBe("invalid");
  });

  it("requires the original six-case source ladder and matching feature selection", async () => {
    const original = JSON.parse(retained.sourceLadderUtf8) as { observations: Array<{ actual_rustc_callback: boolean; feature: string; proof_executed: boolean; observation: { diagnostic?: string } }> };
    for (const change of [
      (row: typeof original) => { row.observations.pop(); },
      (row: typeof original) => { row.observations[0].actual_rustc_callback = false; },
      (row: typeof original) => { row.observations[0].feature = "ordered-region-unused-v31"; },
      (row: typeof original) => { row.observations[0].proof_executed = true; },
      (row: typeof original) => { row.observations[2].observation.diagnostic = "Generic setup failure is not the intended profile refusal."; },
    ]) {
      const value = structuredClone(original); change(value); const sourceLadderUtf8 = JSON.stringify(value);
      expect((await projectOrderedRegionObservation({ ...retained, sourceLadderUtf8, expectedSourceLadderSha256: sha(sourceLadderUtf8) })).status).toBe("invalid");
    }
    expect((await projectOrderedRegionObservation({ ...retained, variants: [...retained.variants].reverse() })).status).toBe("invalid");
  });

  it("rejects oversized/malformed/invalid-Unicode raw inputs before showing values", async () => {
    for (const debuggerUtf8 of ["x".repeat(65537), "{", "{}", "\ud800"]) {
      expect((await projectOrderedRegionObservation({ ...retained, variants: [{ ...retained.variants[0], debuggerUtf8, expectedDebuggerSha256: sha(debuggerUtf8) }, retained.variants[1]] })).status).toBe("invalid");
    }
    expect((await projectOrderedRegionObservation({ ...retained, sourceLadderUtf8: "x".repeat(262145) })).status).toBe("invalid");
    expect((await projectOrderedRegionObservation({ ...retained, unexpected: true })).status).toBe("invalid");
  });

  it("requires the same source, root and manifest for used/unused even under a rehashed ladder", async () => {
    const original = JSON.parse(retained.sourceLadderUtf8) as { observations: Array<{ invocation: Record<string, unknown> }> };
    for (const field of ["source_sha256", "root_source_sha256", "manifest_sha256"] as const) {
      const changed = structuredClone(original);
      changed.observations[1].invocation[field] = "1".repeat(64);
      const sourceLadderUtf8 = JSON.stringify(changed);
      const result = await projectOrderedRegionObservation({ ...retained, sourceLadderUtf8, expectedSourceLadderSha256: sha(sourceLadderUtf8) });
      expect(result.status).toBe("invalid");
      if (result.status !== "ready") expect(result.detail).toContain(`variants differ in ${field}`);
    }
  });

  it("copies immutable strings before asynchronous work and reports missing prerequisites honestly", async () => {
    const mutable = structuredClone(retained), pending = projectOrderedRegionObservation(mutable);
    Reflect.set(mutable, "sourceLadderUtf8", "{}");
    expect((await pending).status).toBe("ready");
    expect((await projectOrderedRegionObservation(null)).status).toBe("unavailable");
    vi.stubGlobal("crypto", undefined);
    expect((await projectOrderedRegionObservation(retained)).status).toBe("unavailable");
  });
});
