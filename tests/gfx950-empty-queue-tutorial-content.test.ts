import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import local from "../docs/evidence/gfx950-empty-queue-20260924/local-observation.json";
import summary from "../docs/evidence/gfx950-empty-queue-20260924/local-summary.json";
import inner from "../docs/evidence/gfx950-empty-queue-20260924/inner-cleanup.json";
import outer from "../docs/evidence/gfx950-empty-queue-20260924/outer-family.json";
import startup from "../docs/evidence/gfx950-empty-queue-20260924/startup-qualified.json";
import o0 from "../docs/evidence/gfx950-empty-queue-20260924/one-stop-O0-report.json";
import o3 from "../docs/evidence/gfx950-empty-queue-20260924/one-stop-O3-report.json";

const root = "docs/evidence/gfx950-empty-queue-20260924/";
const read = (path: string) => readFileSync(resolve(path), "utf8");
const tutorial = () => read("docs/gfx950-empty-queue-lifecycle-v1.md");

describe("historical gfx950 empty-queue lifecycle tutorial", () => {
  it("retains seven original evidence byte sequences without reserialization", () => {
    for (const [name, bytes, sha256] of [
      ["local-observation.json", 1336, "0992c06ee4801e7f19ad7d85a39bb28c7b4e9ba7607c9acbb86c5b0244a8085b"],
      ["local-summary.json", 475, "67e061ac3c74f711d9d01338b2c97d33f2cc38ca51f04532747e326e4fac0c8a"],
      ["inner-cleanup.json", 842, "725cf7a4da5781c5806fc08dc98ffc3ed3c85c8a0495d750318a74d13ae6bdab"],
      ["outer-family.json", 1586, "e70cc98571a99bca5d9f1ec60c76fd9efa0b383d8ef9243a09e8b1a968072531"],
      ["startup-qualified.json", 529, "6353777415da0b0147d06681760205ef013bd4bc9a512e81d098a3dcfed6dd0f"],
      ["one-stop-O0-report.json", 22970, "90cdca4b1143ee1ff981bb385140c0853e96cb858f9220c75004a56dfacf359b"],
      ["one-stop-O3-report.json", 22970, "a0a147beb824f931c91887181b519511599e82f39fc417bd756be7644ea103af"],
    ] as const) {
      const data = readFileSync(resolve(root, name));
      expect(data.length).toBe(bytes);
      expect(createHash("sha256").update(data).digest("hex")).toBe(sha256);
    }
  });

  it("records packet-incapable local retirement and exact logical accounting", () => {
    expect(local.schema).toBe("fe2o3-gfx950-empty-queue-local-observation-v1");
    expect(local.profile).toBe("fe2o3.gfx950.empty-queue-local.v1");
    expect(local.status).toBe("local_retired");
    expect(local.trace).toEqual({
      last_returned: "local_retired", native_effects: "local_retired", zero_gpu_fd_fence: true,
    });
    expect(local.failure).toBeNull();
    expect([local.valid_packet_publications, local.doorbell_stores]).toEqual([0, 0]);
    expect(local.invalid_ring_initialization_required_on_create).toBe(true);
    expect(local.facts.queue_backing_bytes).toBe("190296064");
    const native = BigInt(local.facts.mapped_backing_bytes) + BigInt(local.facts.queue_backing_bytes) + 4096n;
    expect(native).toBe(190316544n);
    expect(BigInt(local.facts.projected_native_bytes)).toBe(native);
    expect(BigInt(local.facts.projected_logical_bytes)).toBe(
      native + BigInt(local.facts.artifact_bytes) + BigInt(local.facts.metadata_retained_bytes),
    );
    expect(summary.historical_local_retirement_observed).toBe(true);
    expect(summary.packet_incapable).toBe(true);
    expect(summary.historical_only).toBe(true);
    expect(summary.zero_gpu_fd_fence).toBe(local.trace.zero_gpu_fd_fence);
  });

  it("joins local identity to separate cleanup rather than promoting a local flag", () => {
    expect(local.family_cleanup_established).toBe(false);
    expect(local.completion_requires_exit_zero).toBe(true);
    expect(inner.controller_pid).toBe(local.process_id);
    expect(inner.controller_wait_status).toBe(0);
    expect(inner.reason).toBe("complete");
    expect(inner.nonce).toBe(outer.nonce);
    expect(inner.request_sha256).toBe(outer.request_sha256);
    expect(inner.invocation_id).toBe("495f03a776b04065aba6219bd24cb329");
    expect(inner.invocation_id).not.toBe(inner.nonce);
    for (const fact of [
      inner.pidfd_exit_observed, inner.wait_echild, inner.cgroup_populated_zero,
      inner.no_child_cgroups, inner.owner_current, inner.streams_eof,
      inner.cleanup_complete, inner.observation_complete,
    ]) expect(fact).toBe(true);
    expect([inner.kill_attempts, inner.kill_failures, inner.adopted_reaped]).toEqual([0, 0, 0]);
    expect([inner.proof_error, inner.stream_error, inner.cleanup_deadline_expired]).toEqual([false, false, false]);
    for (const fact of [
      outer.accepted, outer.scope_empty, outer.exact_direct_exec_joined,
      outer.inner_cleanup, outer.outer_cleanup, outer.terminal_acknowledged,
      outer.outer_child_reaped, outer.cleanup_is_not_manager_emptiness,
      outer.cleanup_is_not_rollback, outer.completion_requires_runner_exit_zero,
      outer.completion_requires_external_runner_receipt,
    ]) expect(fact).toBe(true);
    expect([outer.outer_status, outer.outer_signal, outer.error]).toEqual([0, null, null]);
    expect(outer.standalone_marker_is_authority).toBe(false);
  });

  it("preserves unknown debugger/TTMP/sampler facts and absence of runtime authority", () => {
    for (const record of [local, summary]) {
      for (const fact of [
        record.attached_debugger, record.loaded_success, record.event_acknowledged,
        record.ttmp_readback, record.sampler_exclusion,
      ]) expect(fact).toBeNull();
      expect(record.physical_capture).toBe(false);
      expect(record.source_or_launch_authority).toBe(false);
    }
    expect(local.kernel_dispatched).toBe(false);
    expect(local.proc_snapshot_proves_general_exclusion).toBe(false);
    expect(summary.gpu_dispatch).toBe(false);
    expect(outer.native_possible).toBe(true);
    expect(outer.native_attempted).toBeNull();
    for (const fact of [
      outer.debugger_acceptance, outer.runtime_acceptance, outer.physical_capture,
      outer.gpu_dispatch, outer.source_authority, outer.strong_isolation,
    ]) expect(fact).toBe(false);
  });

  it("keeps the fresh batch-startup marker separate from GPU-thread acceptance", () => {
    expect(startup.schema).toBe("fe2o3-debugger-startup-qualified-v1");
    expect(startup.closure_review_required).toBe(true);
    for (const fact of [
      startup.debugger_acceptance, startup.runtime_acceptance,
      startup.physical_capture, startup.complete_import_history,
    ]) expect(fact).toBe(false);
    expect(startup.summary_sha256).toBe("ca0dc3304e5f2f304d2db008bc75d04fdbabbcbe2f94a2208a98ad3600d5c4a3");
    expect(startup.outer_sha256).toBe("f958ac9e4c93358812c535fe29a91206802143f3dff24a4cbcd72a52366fd841");
  });

  it("retains both ordinary static builds and complete entry/hidden ABI boundaries", () => {
    expect([o0.optimization, o3.optimization]).toEqual(["O0", "O3"]);
    for (const report of [o0, o3]) {
      expect(report.schema).toBe("diagnostic-gfx950-one-stop-fixture-v1");
      expect([report.target, report.wave_width, report.code_object_version]).toEqual(["gfx950:xnack-", 64, 6]);
      expect(report.workgroup).toEqual([64, 1, 1]);
      expect(report.grid).toEqual([64, 1, 1]);
      expect([report.entry.instructions, report.entry.bytes]).toEqual([16, 84]);
      expect([report.executable_section.bytes, report.executable_section.prefetch_padding_bytes]).toEqual([1152, 1068]);
      expect(report.executable_section.prefetch_padding_word).toBe("bf800000");
      expect([report.metadata.kernarg_bytes, report.metadata.kernarg_alignment]).toEqual([264, 8]);
      expect(report.metadata.arguments).toHaveLength(14);
      expect(report.metadata.arguments.filter(arg => arg.kind.startsWith("hidden_"))).toHaveLength(13);
      expect(report.metadata.arguments[0]).toEqual({
        address_space: "global", kind: "global_buffer", name: "out", offset: 0, size: 8,
      });
      expect([
        report.metadata.group_bytes, report.metadata.private_bytes, report.metadata.agprs,
        report.metadata.sgpr_spills, report.metadata.vgpr_spills,
      ]).toEqual([0, 0, 0, 0, 0]);
    }
    expect(o0.artifact_sha256).toBe(o3.artifact_sha256);
    expect(o0.artifact_bytes).toBe(5312);
    expect(o0.artifact_sha256).not.toBe(local.facts.artifact_sha256);
    expect(local.facts.artifact_bytes).toBe(5536);
  });

  it("keeps all static mutation refusals without converting expected PC/output into observations", () => {
    for (const report of [o0, o3]) {
      expect(report.input_refusals.map(row => row.mutation)).toEqual(["missing_launch", "wrong_cpu"]);
      expect(report.input_refusals.every(row => row.accepted === false)).toBe(true);
      expect(report.mutations).toHaveLength(83);
      expect(new Set(report.mutations.map(row => row.mutation)).size).toBe(83);
      expect(report.mutations.every(row => row.accepted === false && row.reason.length > 0)).toBe(true);
      expect(report.trap).toEqual({
        entry_offset: 76, future_query_pc_source_hypothesis_offset: 80, id: 3,
        native_expected_pc_authorized: false, observed_wave_info_pc: null, posttrap_entry_offset: 80,
      });
      expect(report.trace.filter(row => row.opcode === "S_TRAP_vi")).toHaveLength(1);
      const output = report.future_output_contract;
      expect([output.logical_bytes, output.payload_offset, output.payload_bytes, output.backing_bytes]).toEqual([272, 8, 256, 4096]);
      expect(output.expected_u32_words).toHaveLength(64);
      expect(output.allocated_or_observed).toBe(false);
      for (const fact of [
        report.gpu_execution, report.stopped_wave_observed, report.runtime_authority,
        report.source_authentication, report.protected_publication, report.milestone_complete,
      ]) expect(fact).toBe(false);
    }
  });

  it("links exact historical receipts and the immutable implementation revision", () => {
    const text = tutorial();
    expect(text).toContain("Compiler implementation commit: `634ec52439fb6ae8329d0cc6ba52be41fdee3739`.");
    expect(text).not.toContain("PENDING_ROOT_PUBLICATION");
    expect(text).not.toContain("/blob/main/");
    expect(text).toContain("/blob/634ec52439fb6ae8329d0cc6ba52be41fdee3739/docs/gfx950-debug-empty-queue-qualification-20260924.md");
    for (const digest of [
      "0d3efc22d6577f8b0d9ae901340131f24c5b878b1ac4494c19d67ad9cd3f8e8b",
      "2fe2986f3e1fd3bb3ff2c9b96366949d8c1bd1411741e912425f04226c6a3dae",
      "ea06a78526d13469c3c0be5ee727ce96f4491c9899015474593635539f0e699d",
    ]) expect(text).toContain(digest);
    for (const phrase of [
      "no native replay command", "Drop is not native cleanup",
      "not RSS", "not a debugger-session import format",
      "not allocated or observed", "source-derived future WAVE_INFO_PC",
      "No live adapter or importer", "V4 remains open",
      "M1/V1/V2/U1/U2/U3 (6/18)", "FE2O3_PIN",
    ]) expect(text).toContain(phrase);
  });

  it("adds only a separate lesson without reclassifying the older noqueue command", () => {
    const noqueue = read("docs/gfx950-noqueue-registration-v1.md");
    expect(noqueue).toContain("gfx950-empty-queue-lifecycle-v1.md");
    expect(noqueue).toContain("creates\n**no queue**");
    expect(noqueue).toContain("Cleanup acknowledged | false");
    expect(noqueue).toContain("does not change this no-queue command");
    expect(tutorial()).toContain("physical-lds-recorded-debug-v22.md");
    expect(tutorial()).toContain("those gfx942 CPU\nrecords are not gfx950 hardware observations");
  });
});
