import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import actual from "../docs/evidence/gfx950-noqueue-20260924/actual-report.json";
import negative from "../docs/evidence/gfx950-noqueue-20260924/negative-report.json";

const evidenceRoot = "docs/evidence/gfx950-noqueue-20260924/";
const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("retained gfx950 noqueue registration tutorial", () => {
  it("pins exact original report and positive-stream bytes without reserialization", () => {
    for (const [name, size, sha] of [
      ["actual-report.json", 3349, "feb5c8c215558c246b6e13bdff453090adb14941e48dcbe67d57755cb6e40b70"],
      ["negative-report.json", 15226, "59f44122eef4097a1026b79c30a94a918f6d5615e71a25ee50230d14e7864dfd"],
      ["actual-noqueue.jsonl", 1276, "5101d4cad81b5813b3c07d0332e34fc4de97fdca495655b28f375e2b5b9004d5"],
    ] as const) {
      const bytes = readFileSync(resolve(evidenceRoot, name));
      expect(bytes.length).toBe(size);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(sha);
    }
    expect(JSON.parse(read(evidenceRoot + "actual-noqueue.jsonl"))).toEqual(actual.results[0].result);
  });

  it("records actual registration only, not queue, dispatch, capture or cleanup", () => {
    expect(actual.status).toBe("passed");
    expect(actual.mode).toBe("positive");
    expect(actual.results).toHaveLength(1);
    const { result, process } = actual.results[0];
    expect(result.status).toBe("registered_no_queue");
    expect(result.schema).toBe("diagnostic-gfx950-debug-metadata-noqueue-v1");
    expect([process.code, process.signal, process.reason]).toEqual([0, null, null]);
    expect(process.direct_exit).toEqual({ code: 0, signal: null });
    expect(process.drain_abandoned).toBe(false);
    expect(process.streams.stderr.bytes).toBe(0);
    expect(result.observation.metadata_version).toBe(11);
    for (const value of [
      result.observation.metadata_published, result.observation.trap_registered,
      result.observation.debug_runtime_enabled, result.observation.native_vm_and_mappings_prepared,
    ]) expect(value).toBe(true);
    for (const value of [
      result.observation.queue_created, result.observation.kernel_dispatched,
      result.observation.gpu_trap_execution_qualified, result.observation.cleanup_acknowledged,
      result.observation.proc_snapshot_proves_general_foreign_exclusion,
    ]) expect(value).toBe(false);
    expect(result.observation.authority).toBe("registration_facts_only_no_queue_stop_or_launch_authority");
  });

  it("keeps exact artifact, device and logical retained-byte observations", () => {
    const o = actual.results[0].result.observation;
    expect(o.target).toBe("gfx950:xnack-");
    expect(o.wave_width).toBe(64);
    expect([o.node, o.gpu_id, o.unique_id]).toEqual([2, 39903, "16366993098680759275"]);
    expect(typeof o.unique_id).toBe("string");
    expect(o.selected_kernel).toBe("fe2o3_gfx950_observation_fixture");
    expect(o.artifact_bytes).toBe("5536");
    expect(o.artifact_sha256).toBe("d10b592732d91cf4c0d4289890fdd0a5328e84cb8208817eaabac4c62c1a34c6");
    expect([o.mapped_backing_bytes, o.metadata_retained_bytes, o.trap_bytes]).toEqual(["16384", "5744", 1116]);
    expect(o.retention).toBe("native_resources_retained_until_process_exit");
  });

  it("retains all eight exact early-refusal phases without accepting generic failures", () => {
    expect(negative.status).toBe("passed");
    expect(negative.mode).toBe("negative");
    const expected = [
      ["ambient-environment", "process_isolation_snapshot", "nonisolated_environment"],
      ["missing-activation-ack", "arguments", "closed_grammar_and_explicit_effect_acknowledgments"],
      ["artifact-size", "artifact_file", "expected_size_mismatch"],
      ["artifact-digest", "artifact_pin", "sha256_mismatch"],
      ["kernel-selection", "artifact_admission", "normal_kernel_selection_refused"],
      ["node-selection", "device_selection", "exact_identity_or_profile_mismatch"],
      ["gpu-selection", "device_selection", "exact_identity_or_profile_mismatch"],
      ["profile-selection", "device_selection", "exact_identity_or_profile_mismatch"],
    ];
    expect(negative.results.map(row => [row.name, row.result.failure.phase, row.result.failure.reason])).toEqual(expected);
    for (const row of negative.results) {
      expect(row.result.status).toBe("refused");
      expect(row.result.failure.native_effects).toBe("not_attempted");
      expect([row.process.code, row.process.signal, row.process.streams.stderr.bytes]).toEqual([1, null, 0]);
      expect(row.process.drain_abandoned).toBe(false);
      expect(row.process.signals.every(signal => signal.result === "group_absent")).toBe(true);
    }
  });

  it("does not promote direct-child observation into isolation or cleanup proof", () => {
    for (const report of [actual, negative]) {
      expect(report.boundaries.direct_children_reaped).toBe(true);
      for (const value of [
        report.boundaries.descendant_quiescence_proved,
        report.boundaries.general_external_injection_exclusion_proved,
        report.boundaries.queue_or_dispatch, report.boundaries.physical_capture,
        report.boundaries.trap_execution_qualified, report.boundaries.cleanup_acknowledged,
        report.boundaries.source_or_artifact_authority,
      ]) expect(value).toBe(false);
    }
    const note = read("docs/gfx950-noqueue-registration-qualification-20260924.md");
    for (const phrase of [
      "Attached-debugger acceptance was not observed", "not RSS",
      "HEAD alone is not asserted", "not a performance benchmark",
      "not a descendant-quiescence certificate", "32 feature-enabled documentation tests",
      "21ec4ba76dc2d9757e2404c1d2b684cb24a4bff20f90c85f68f9f6935dc6a6b4",
      "00945e915dedd256d9308ddd1ba5a971954ecd84358609dd094dab077526e37b",
      "e72382f9740fdcc76d5aa085d3378e0310c638238d0ac5b38a6a4a4997856240",
    ]) expect(note).toContain(phrase);
  });

  it("requires supervised clean execution and keeps the older cold command inactive", () => {
    const tutorial = read("docs/gfx950-noqueue-registration-v1.md");
    for (const phrase of [
      "unsafe consuming API", "no foreign GPU FDs", "/usr/bin/env -i",
      "--acknowledge-isolated-noqueue-activation", "env -i alone does not close",
      "Do not use cargo run", "complete supervisor", "20-second child deadline",
      "TMA is zero", "version 0", "remains **inactive**", "FE2O3_PIN",
    ]) expect(tutorial).toContain(phrase);
    const cold = read("docs/gfx950-cold-debug-preparation-v1.md");
    expect(cold).toContain("prepared_inactive");
    expect(cold).toContain("| Metadata version | 0 |");
    expect(cold).toContain("does not register or execute that trap");
  });
});
