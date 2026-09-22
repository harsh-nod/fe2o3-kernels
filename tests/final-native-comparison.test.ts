import { createHash, webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copyFinalNativeEvidence, projectFinalNativeComparison } from "../src/content/final-native-comparison.mjs";

// Closed-schema synthetic parser/control data. These bytes are not compiler output,
// executable ELF, source admission, CPU simulation, or native qualification.
const H = (input: string | Uint8Array) => createHash("sha256").update(input).digest("hex");
const artifact = (utf8: string) => ({ utf8, bytes: Buffer.byteLength(utf8), sha256: H(utf8) });
const document = (value: unknown) => artifact(JSON.stringify(value));
type Artifact = ReturnType<typeof artifact>;
const filePin = (path: string, value: { bytes: number; sha256: string }, links: boolean) => ({
  path, bytes: value.bytes, sha256: value.sha256, device: "1", inode: "2", mode: "33152",
  mtime_ns: "3", ctime_ns: "4", ...(links ? { nlink: "1" } : {}),
});
const unlinked = (value: ReturnType<typeof filePin>) => {
  const copy = { ...value }; delete copy.nlink; return copy;
};
const instructions = (edited: boolean) => [
  { instruction: "v_xor_b32_e32", output: 4, inputs: [0, 1] },
  { instruction: "v_and_b32_e32", output: 4, inputs: [4, 2] },
  { instruction: edited ? "v_or_b32_e32" : "v_xor_b32_e32", output: 5, inputs: [1, 4] },
];
const descriptorCodes = (edited: boolean) => [133, 307, edited ? 412 : 413];
const sourceRoot = "/synthetic/source";
const macro = "fe2o3_device::amdgpu_ordered_program! {\n    gfx942_xnack_off_wave64;\n    scratch(4); out(5);\n" +
  "    in(0) = a;\n    in(1) = b;\n    in(2) = mask;\n    xor(scratch, input0, input1);\n" +
  "    and(scratch, scratch, input2);\n    xor(out, input1, scratch);\n}";
const SOURCE_BASE = {
  "status": "passed",
  "kind": "source_promotion_instruction_edit_diagnostic_v1",
  "actual_normal_exports": 3,
  "whole_kernel_simulations": 90,
  "semantic_identity_join_qualified": true,
  "semantic_identity_availability": "normal_live_exporter_observed",
  "source_edit": "one_exact_final_xor_to_or_original_and_surrounding_bytes_unchanged",
  "ranked_checks": false,
  "protected_proof": false,
  "compiler_closure_attestation": false,
  "source_authentication": false,
  "native_qualified": false,
  "physical_register_lifetime_proof": false,
  "production_resume": false,
  "hardware_observed": false,
  "limits": {
    "source_bytes": 65536,
    "command_stream_bytes": 1048576,
    "command_ms": 300000,
    "stages": 110,
    "retained_pins": 384,
    "retained_pin_bytes": 2147483648,
    "cargo_jobs": 2,
    "task_root_storage_accounting": "external_root_supervisor_required_not_replaced_by_this_runner"
  }
};
const JOIN_BASE = {
  "kind": "private_instruction_edit_source_native_payload_join_v1",
  "status": "joined_observation",
  "authority": "observation_only",
  "actual_normal_exports": 3,
  "producer_stages": 100,
  "whole_kernel_simulations": 90,
  "native_optimization_cases": 4,
  "complete_hsaco_payloads": 4,
  "native_repeat_execution": false,
  "repeat_scope": "same edited source semantic KIR LLVM identities; no separate native execution claimed",
  "full_payload_offset_join": "worker ELF file offsets and complete payload bytes; no byte scanning",
  "source_edit": "one_exact_final_xor_to_or_original_and_surrounding_bytes_unchanged",
  "changed_oracle": "default bitselect; edited b | (a & mask); independent BigInt whole-kernel simulation",
  "source_authentication": false,
  "compiler_closure_attestation": false,
  "runtime_closure_attestation": "unavailable",
  "protected_admission": false,
  "ranked_checks": false,
  "proof_authority": false,
  "artifact_authority": false,
  "production_resume": false,
  "hardware_execution": false,
  "native_whole_kernel_correctness": false,
  "physical_register_allocation_or_lifetime_proof": false,
  "whole_kernel_order_or_byte_stability_claim": false,
  "limits": {
    "source": 65536,
    "payload": 1048576,
    "json": 1048576,
    "sourcePins": 384,
    "sourcePinBytes": 2147483648,
    "joinPins": 400,
    "joinPinBytes": 2157969408,
    "total_read_bytes": 6442450944,
    "wall_clock_ms": 120000,
    "actual_read_bytes": 274812711,
    "input_directory_custody": "task-controlled parents; outer supervisor and post-exit snapshot required",
    "compiler_worker_execution": false,
    "total_RSS_or_task_storage_attestation": false
  }
};
const NATIVE_BASE = {
  "artifact_authority": false,
  "authority": "unauthenticated-test-transport",
  "code_object_version": 6,
  "compiler_closure_attestation": false,
  "expected_input_identity_matched": true,
  "hardware_execution": false,
  "kernel_symbol": "choose_bits",
  "llvm_build_claim": "rocm7.2.1-packages-sha256:eb02c62693d6697017195f0abf5ebcf7e58f60e4d2acf8356de2e944bceec540",
  "native_whole_kernel_correctness": false,
  "physical_register_allocation_or_lifetime_proof": false,
  "prefix_source_admitted": false,
  "production_exact_program_admission": false,
  "protected_finalizer_admission": false,
  "register_plan": [
    4,
    5,
    0,
    1,
    2
  ],
  "report_kind": "private-instruction-edit-native-observation-v1",
  "result_use": "sole-direct-nonvolatile-nonatomic-global-store",
  "retained_file_identity_and_bytes_rechecked": true,
  "runtime_closure_attestation": "unavailable",
  "shape_controls": {
    "captured_llvm_mutated": false,
    "file_snapshot_negatives": 9,
    "file_snapshot_positives": 1,
    "input_identity_negatives": 3,
    "input_identity_positives": 1,
    "typed_shape_negatives": 48,
    "typed_shape_positives": 4,
    "worker_or_target_machine_invoked": false
  },
  "source_ancestry": "not-established-by-llvm-file",
  "source_authentication": false,
  "synthetic_worker_request_identity_fields": true,
  "target": "gfx942:xnack-",
  "wave_width": 64,
  "whole_kernel_order_or_byte_stability_claim": false,
  "worker_build_claim": "fe2o3-worker-v1-sha256-f5fee9cf41ca39587c47114f112b70681084dba62dd61e3cc79484ed66c7646d",
  "workgroup_size": 64
};
const INSPECT_BASE = {
  "kind": "diagnostic_ordered_program_inspection_example",
  "authority": "observation_only",
  "kernel": "choose_bits",
  "function": "choose_bits",
  "coordinate": {
    "function_ordinal": 0,
    "block_ordinal": 0,
    "operation_ordinal": 0
  },
  "raw_block_id": 5,
  "input_value_ids": [
    4,
    10,
    9
  ],
  "result_value_id": 11,
  "declared_target": "gfx942:xnack-",
  "declared_wave_width": 64,
  "profile": "closed_u32_program_e32_v1",
  "register_plan": {
    "scratch": 4,
    "output": 5,
    "inputs": [
      0,
      1,
      2
    ],
    "vgpr_high_water": 6
  },
  "memory_effect": "NoMemory",
  "ordered_region_effect": true,
  "pure_or_movable": false,
  "logical_observation_granularity": "whole_program_before_after",
  "source_authentication": false,
  "source_map_available": false,
  "physical_register_values_available": false,
  "instruction_microsteps_available": false,
  "register_lifetime_or_final_allocation_proof": false,
  "proof_authority": false,
  "artifact_authority": false,
  "production_resume_authority": false,
  "hardware_execution": false,
  "cpu_preflight_passed": true,
  "inspection_counts": {
    "blocks": 7,
    "operations": 8,
    "ssa_definitions": 11,
    "capability_entries": 9,
    "name_bytes": 318
  },
  "inspection_max_canonical_bytes_after_admission": 65536,
  "cpu_preflight_resident_limit_bytes": 67108864,
  "output_buffer_bytes": 8192,
  "accounting_scope": "shared canonical admission, CPU resident accounting, and this borrowed structural/output bound are separate; not a combined allocator or RSS cap"
};
const EMIT_BASE = {
  "kind": "diagnostic_ordered_program_llvm_observation",
  "authority": "observation_only",
  "canonical_wire_version": 17,
  "program_count": 3,
  "register_plan": [
    4,
    5,
    0,
    1,
    2
  ],
  "canonical_retained_storage_bytes": 26743,
  "canonical_work_limit": 67108864,
  "canonical_storage_limit": 67108864,
  "max_input_bytes": 65536,
  "max_published_llvm_bytes": 65536,
  "emitter_text_limit_bytes": 16777216,
  "canonical_and_emitter_accounting_are_separate": true,
  "source_authentication": false,
  "compiler_closure_attestation": false,
  "proof_authority": false,
  "protected_admission": false,
  "final_artifact_authority": false,
  "production_resume": false,
  "physical_register_values": false,
  "hardware_execution": false
};

function fixture() {
  const original = artifact("// Synthetic uncompiled text only.\nfn choose_bits(a:u32,b:u32,mask:u32) {\n    let selected = b ^ ((a ^ b) & mask);\n}\n");
  const baseline = artifact(original.utf8.replace("    let selected = b ^ ((a ^ b) & mask);\n", "    let selected = " + macro + ";\n"));
  const edited = artifact(baseline.utf8.replace("    xor(out, input1, scratch);\n", "    or(out, input1, scratch);\n"));
  const sources = [original, baseline, edited].map((value, index) => ({ label: ["original", "default", "edited"][index], artifact: value }));
  const llvm = ["default", "edited", "repeat"].map(label => ({ label,
    artifact: artifact("; synthetic, not LLVM compilation evidence: " + (label === "default" ? "xor" : "or") + "\n") }));
  const seed = { original_sha256: original.sha256, candidate_sha256: baseline.sha256, candidate_bytes: baseline.bytes };
  const summaries = ["default", "edited", "repeat"].map((label, index) => {
    const profile = index === 0 ? "default" : "edited";
    return { label, profile, source_sha256: sources[index === 0 ? 1 : 2].artifact.sha256,
      semantic_sha256: H(profile + ":semantic"), canonical_kir_sha256: H(profile + ":canonical"), canonical_kir_bytes: 993,
      kir_file_sha256: H(profile + ":wire"), llvm_path: sourceRoot + "/" + label + ".ll",
      llvm_sha256: llvm[index].artifact.sha256, llvm_bytes: llvm[index].artifact.bytes,
      retained_source_inventory: H("fixed-root-inventory"), retained_source_preflight: H(profile + ":preflight"),
      declared_source_ids: { frontend_unit: H(profile + ":frontend"), function: H("function"),
        contract: H("contract"), statement: H(profile + ":statement") }, simulations: 30 };
  });
  const variants = summaries.map(summary => ({
    label: summary.label, source_sha256: summary.source_sha256,
    exported: { canonical_sha256: summary.canonical_kir_sha256, canonical_bytes: 993,
      retained_source_inventory: summary.retained_source_inventory, retained_source_preflight: summary.retained_source_preflight,
      semantic_identity: summary.semantic_sha256 },
    inspection: { ...INSPECT_BASE, canonical: { wire_version: 17, sha256: summary.canonical_kir_sha256, bytes: 993 },
      declared_program: { count: 3, descriptors: [...descriptorCodes(summary.profile === "edited"), ...Array(13).fill(0)] },
      declared_instruction_steps: instructions(summary.profile === "edited"), declared_source_ids: summary.declared_source_ids },
    emission: { ...EMIT_BASE, canonical_identity: summary.canonical_kir_sha256, canonical_bytes: 993,
      input_file_sha256: summary.kir_file_sha256, llvm_sha256: summary.llvm_sha256, llvm_bytes: summary.llvm_bytes,
      descriptors: [...descriptorCodes(summary.profile === "edited"), ...Array(13).fill(0)] },
    kir_file_sha256: summary.kir_file_sha256, llvm_sha256: summary.llvm_sha256,
    // Deliberately no invented raw simulator result: the adapter reports, not replays, the producer's count.
    simulations: Array.from({ length: 30 }, () => ({ synthetic: "not a simulation result" })),
  }));
  const sourcePins = [
    ...sources.map((item, index) => filePin(sourceRoot + "/" + ["original.rs", "public-candidate.rs", "instruction-edited.rs"][index], item.artifact, true)),
    ...llvm.map(item => filePin(sourceRoot + "/" + item.label + ".ll", item.artifact, true)),
  ];
  const source = { ...SOURCE_BASE, normal_public_seed: seed, variants,
    stages: Array.from({ length: 100 }, (_, index) => ({ label: "synthetic-stage-" + index,
      executable: "/synthetic/not-executed", args: [], code: 0, signal: null, reason: null, elapsed_ms: 1,
      stdout_bytes: 0, stdout_sha256: H(""), stderr_bytes: 0, stderr_sha256: H("") })),
    retained_file_pins: sourcePins.map(unlinked), retained_pin_bytes: sourcePins.reduce((sum, item) => sum + item.bytes, 0) };
  const sourceReceipt = document(source);
  const payloads = ["default", "edited"].flatMap(profile => ["O0", "O3"].map(optimization => {
    const bytes = new Uint8Array(192), view = new DataView(bytes.buffer);
    // Not ELF; exact closed fixture slices only. Complete bytes still have to hash.
    view.setUint32(44, 1, true); view.setUint32(48, optimization === "O0" ? 2 : 0, true);
    bytes.set(Buffer.from("0003082a04050826" + (profile === "default" ? "01090a2a" : "01090a28"), "hex"), 96);
    bytes[191] = profile === "default" ? 1 : 2;
    return { profile, optimization, sha256: H(bytes), bytes: bytes.length, hex: Buffer.from(bytes).toString("hex") };
  }));
  const payloadPins = payloads.map(item => filePin("/synthetic/native-" + item.profile + "/payloads/" + item.optimization + ".hsaco", item, true));
  const native = ["default", "edited"].map((profile, index) => ({ ...NATIVE_BASE, profile,
    llvm_sha256: summaries[index].llvm_sha256, llvm_bytes: summaries[index].llvm_bytes,
    descriptors: descriptorCodes(profile === "edited"),
    cases: payloads.slice(index * 2, index * 2 + 2).map((payload, opt) => {
      const raw = Buffer.from(payload.hex, "hex");
      return { machine_observation: { optimization: payload.optimization,
        llvm_sha256: summaries[index].llvm_sha256, llvm_bytes: summaries[index].llvm_bytes,
        hsaco_sha256: payload.sha256, hsaco_bytes: payload.bytes, entry_file_offset: 96, entry_code_bytes: 12,
        static_instruction_count: 3,
        program: [
          ["V_XOR_B32_e32_vi", "0003082a", ["VGPR4", "VGPR0", "VGPR1"]],
          ["V_AND_B32_e32_vi", "04050826", ["VGPR4", "VGPR4", "VGPR2"]],
          [profile === "default" ? "V_XOR_B32_e32_vi" : "V_OR_B32_e32_vi",
            profile === "default" ? "01090a2a" : "01090a28", ["VGPR5", "VGPR1", "VGPR4"]],
        ].map(([opcode, bytes_hex, register_operands], at) => ({ file_offset: 96 + 4 * at, opcode, bytes_hex,
          register_operands, mc_flags: 0, implicit_reads: ["EXEC"], implicit_writes: [] })),
        descriptor: { file_offset: 0, bytes: 64, sha256: H(raw.subarray(0, 64)), compute_pgm_rsrc1: opt === 0 ? 2 : 0,
          compute_pgm_rsrc3: 1, vgpr_capacity: opt === 0 ? 24 : 8, architected_vgpr_boundary: 8,
          required_footprint_high_water: 6, interpretation: "encoded-capacity-not-metadata-usage-or-lifetime" },
        post_link_checks: [
          "post_link.check=target status=ok arch=gfx942 code_object_version=6 e_flags=0x64c",
          "post_link.check=exports status=ok symbols=[choose_bits,choose_bits.kd]",
          "post_link.check=unresolved status=ok symbols=[]",
          "post_link.check=metadata status=ok kernels=1 target=amdgcn-amd-amdhsa--gfx942%3Axnack-",
          "post_link.kernel name=choose_bits symbol=choose_bits.kd kernarg_size=288 group_size=0 private_size=0 kernarg_align=8 wavefront_size=64 max_workgroup_size=64 reqd_workgroup_size=[64,1,1]",
        ], derivation_identity: H(profile + ":" + opt + ":derivation"), boundary_value_or_lifetime_proof: false },
        mutation_controls: { decoded_field_refusals: 7, stale_identity_refusals: 1, gapped_sequence_refusals: 1,
          raw_byte_mismatch_refusals: 1, redecoded_opposite_opcode_refusals: 1,
          opposite_profile_mutated_payload_observed: true, original_payload_unchanged: true,
          captured_llvm_mutated: false, mutated_payload_executed_on_hardware: false },
        retained_payload: { path: payloadPins[index * 2 + opt].path, bytes: payload.bytes, sha256: payload.sha256,
          matches_linked_worker_payload: true, create_new_only: true, production_artifact_authority: false } };
    }),
  }));
  const reports = native.map((value, index) => ({ profile: ["default", "edited"][index], artifact: document(value) }));
  const nativePins = reports.map(item => filePin("/synthetic/native-" + item.profile + "/command.stdout", item.artifact, true));
  const receiptPin = filePin(sourceRoot + "/receipt.json", sourceReceipt, true);
  const retainedPins = [...sourcePins, receiptPin, ...nativePins, ...payloadPins];
  const join = document({ ...JOIN_BASE, normal_public_seed: seed, source_receipt: receiptPin, native_reports: nativePins,
    source_variants: summaries, native_observations: native.flatMap(report => report.cases.map(wrapper => {
      const value = wrapper.machine_observation;
      return { profile: report.profile, optimization: value.optimization, llvm_sha256: report.llvm_sha256,
        llvm_bytes: report.llvm_bytes, payload_path: wrapper.retained_payload.path,
        hsaco_sha256: value.hsaco_sha256, hsaco_bytes: value.hsaco_bytes,
        exact_payload_instruction_offsets: value.program.map(step => step.file_offset),
        descriptor_file_offset: 0, descriptor_sha256: value.descriptor.sha256, descriptor_bytes: 64,
        source_authentication: false, boundary_value_or_lifetime_proof: false };
    })), retained_input_pins: retainedPins, retained_input_bytes: retainedPins.reduce((sum, item) => sum + item.bytes, 0) });
  return { schema: "fe2o3-final-native-comparison-example-v1",
    provenance: { capture_name: "Synthetic controls: never compiled", kind: "synthetic_test_only",
      producer_authenticated: false, qualified_release_pin: null },
    join, sourceReceipt, sources, llvm, reports, payloads };
}
type Evidence = ReturnType<typeof fixture>;
// Test-only JSON mutation keeps retained hashes/accounting coherent so semantic
// negative cases reach the intended deep validator, not merely an outer hash check.
const object = (value: Artifact) => JSON.parse(value.utf8);
function rewriteJoin(value: Evidence, update: (join: ReturnType<typeof object>) => void) {
  const join = object(value.join); update(join);
  join.retained_input_bytes = join.retained_input_pins.reduce((sum: number, item: { bytes: number }) => sum + item.bytes, 0);
  value.join = document(join);
}
function rewriteReport(value: Evidence, index: number, update: (report: ReturnType<typeof object>) => void) {
  const report = object(value.reports[index].artifact); update(report); value.reports[index].artifact = document(report);
  rewriteJoin(value, join => {
    const path = join.native_reports[index].path;
    const replacement = filePin(path, value.reports[index].artifact, true);
    join.native_reports[index] = replacement;
    join.retained_input_pins = join.retained_input_pins.map((pin: { path: string }) => pin.path === path ? replacement : pin);
  });
}
function rewriteSource(value: Evidence, update: (source: ReturnType<typeof object>) => void) {
  const source = object(value.sourceReceipt); update(source); value.sourceReceipt = document(source);
  rewriteJoin(value, join => {
    const path = join.source_receipt.path, replacement = filePin(path, value.sourceReceipt, true);
    join.source_receipt = replacement;
    join.retained_input_pins = join.retained_input_pins.map((pin: { path: string }) => pin.path === path ? replacement : pin);
  });
}
function rewritePayload(value: Evidence, index: number, update: (bytes: Buffer) => void) {
  const payload = value.payloads[index], bytes = Buffer.from(payload.hex, "hex"); update(bytes);
  Object.assign(payload, { hex: bytes.toString("hex"), bytes: bytes.length, sha256: H(bytes) });
  rewriteReport(value, Math.floor(index / 2), report => {
    const target = report.cases[index % 2]; target.retained_payload.bytes = bytes.length;
    target.retained_payload.sha256 = payload.sha256;
    target.machine_observation.hsaco_bytes = bytes.length; target.machine_observation.hsaco_sha256 = payload.sha256;
  });
  rewriteJoin(value, join => {
    const row = join.native_observations[index]; row.hsaco_bytes = bytes.length; row.hsaco_sha256 = payload.sha256;
    const replacement = filePin(row.payload_path, payload, true);
    join.retained_input_pins = join.retained_input_pins.map((pin: { path: string }) => pin.path === row.payload_path ? replacement : pin);
  });
}
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe("closed final-native retained byte integrity", () => {
  it("projects four synthetic cases with exact slices and distinct declared versus encoded capacity", async () => {
    const value = fixture(), result = await projectFinalNativeComparison(value, value.join.sha256);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error(result.detail);
    expect(result.kind).toBe("synthetic_test_only"); expect(result.checkedArtifacts).toBe(14);
    expect(result.cases.map(item => [item.id, item.declaredVgprHighWater, item.encodedVgprCapacity, item.architectedVgprBoundary]))
      .toEqual([["default-O0", 6, 24, 8], ["default-O3", 6, 8, 8], ["edited-O0", 6, 24, 8], ["edited-O3", 6, 8, 8]]);
    expect(result.cases[0].program.map(item => item.fileOffset)).toEqual([96, 100, 104]);
    expect(result.cases[2].program[2].bytesHex).toBe("01090a28");
    expect(Object.isFrozen(result.cases[0].program)).toBe(true);
    expect(result.interpretation).toMatch(/not trusted compiler provenance/u);
    expect(result.unavailable).toContain("native whole-kernel correctness");
  });
  it("copies primitives before the first asynchronous hash and never fetches referenced paths", async () => {
    const value = fixture(), fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const pending = projectFinalNativeComparison(value, value.join.sha256);
    value.payloads[0].hex = ""; value.join.utf8 = "{}"; value.sources[1].artifact.utf8 = "changed";
    expect((await pending).status).toBe("ready"); expect(fetch).not.toHaveBeenCalled();
  });
  it("fails unavailable without WebCrypto", async () => {
    const value = fixture(); vi.stubGlobal("crypto", {});
    expect((await projectFinalNativeComparison(value, value.join.sha256)).status).toBe("unavailable");
  });
  it("rejects a stale caller-selected join digest", async () => {
    const value = fixture();
    expect(await projectFinalNativeComparison(value, H("stale"))).toMatchObject({ status: "invalid", detail: expect.stringMatching(/stale/u) });
  });
  it("rejects complete-payload changes outside every reported slice", async () => {
    const value = fixture(); value.payloads[0].hex = "ff" + value.payloads[0].hex.slice(2);
    expect(await projectFinalNativeComparison(value, value.join.sha256)).toMatchObject({ status: "invalid", detail: "Complete HSACO payload hash mismatch." });
  });
  it("rejects a swapped payload even after its envelope hash is correct", async () => {
    const value = fixture();
    Object.assign(value.payloads[0], { hex: value.payloads[2].hex, sha256: value.payloads[2].sha256 });
    expect((await projectFinalNativeComparison(value, value.join.sha256)).status).toBe("invalid");
  });
  it("rejects a rehashed instruction mutation at the exact observer offset", async () => {
    const value = fixture(); rewritePayload(value, 0, bytes => { bytes[96] ^= 1; });
    expect(await projectFinalNativeComparison(value, value.join.sha256)).toMatchObject({ status: "invalid",
      detail: "Instruction bytes differ at exact full-payload offset." });
  });
  it("rejects a rehashed descriptor mutation independently of the whole payload digest", async () => {
    const value = fixture(); rewritePayload(value, 0, bytes => { bytes[0] = 7; });
    expect(await projectFinalNativeComparison(value, value.join.sha256)).toMatchObject({ status: "invalid", detail: "Descriptor bytes differ." });
  });
  it("rejects out-of-entry offsets rather than scanning for matching byte patterns", async () => {
    const value = fixture();
    rewriteReport(value, 0, report => { report.cases[0].machine_observation.program[0].file_offset = 108; });
    expect((await projectFinalNativeComparison(value, value.join.sha256)).status).toBe("invalid");
  });
  it("rejects descriptor words and capacities that disagree with actual retained bytes", async () => {
    for (const field of ["compute_pgm_rsrc1", "compute_pgm_rsrc3", "vgpr_capacity", "architected_vgpr_boundary"]) {
      const value = fixture(); rewriteReport(value, 0, report => { report.cases[0].machine_observation.descriptor[field] += 1; });
      expect((await projectFinalNativeComparison(value, value.join.sha256)).status, field).toBe("invalid");
    }
  });
  it("rejects descriptor/entry overlap and malformed metadata alignment", async () => {
    const value = fixture(); rewriteReport(value, 0, report => { report.cases[0].machine_observation.descriptor.file_offset = 96; });
    expect((await projectFinalNativeComparison(value, value.join.sha256)).status).toBe("invalid");
    const align = fixture(); rewriteReport(align, 0, report => {
      const row = report.cases[0].machine_observation; row.post_link_checks[4] = row.post_link_checks[4].replace("kernarg_align=8", "kernarg_align=3");
    });
    expect((await projectFinalNativeComparison(align, align.join.sha256)).status).toBe("invalid");
  });
  it("rejects hidden effects and opposite-profile native steps", async () => {
    for (const field of ["opcode", "mc_flags", "implicit_writes"]) {
      const value = fixture(); rewriteReport(value, 0, report => {
        report.cases[0].machine_observation.program[2][field] =
          field === "opcode" ? "V_OR_B32_e32_vi" : field === "mc_flags" ? 1 : ["VCC"];
      });
      expect((await projectFinalNativeComparison(value, value.join.sha256)).status, field).toBe("invalid");
    }
  });
  it("rejects stale native LLVM identity and strict-join offsets", async () => {
    const value = fixture(); rewriteReport(value, 0, report => { report.llvm_sha256 = H("stale llvm"); });
    expect((await projectFinalNativeComparison(value, value.join.sha256)).status).toBe("invalid");
    const offsets = fixture(); rewriteJoin(offsets, join => { join.native_observations[0].exact_payload_instruction_offsets[0] += 4; });
    expect((await projectFinalNativeComparison(offsets, offsets.join.sha256)).status).toBe("invalid");
  });
  it("rejects fabricated authority at every retained interpretation layer", async () => {
    for (const layer of ["envelope", "join", "source", "inspection", "emission", "native", "payload", "machine", "join-case"]) {
      const value = fixture();
      if (layer === "envelope") value.provenance.producer_authenticated = true;
      else if (layer === "join") rewriteJoin(value, join => { join.proof_authority = true; });
      else if (layer === "source") rewriteSource(value, source => { source.native_qualified = true; });
      else if (layer === "inspection") rewriteSource(value, source => { source.variants[0].inspection.physical_register_values_available = true; });
      else if (layer === "emission") rewriteSource(value, source => { source.variants[0].emission.final_artifact_authority = true; });
      else if (layer === "native") rewriteReport(value, 0, report => { report.native_whole_kernel_correctness = true; });
      else if (layer === "payload") rewriteReport(value, 0, report => { report.cases[0].retained_payload.production_artifact_authority = true; });
      else if (layer === "machine") rewriteReport(value, 0, report => { report.cases[0].machine_observation.boundary_value_or_lifetime_proof = true; });
      else rewriteJoin(value, join => { join.native_observations[0].source_authentication = true; });
      expect((await projectFinalNativeComparison(value, value.join.sha256)).status, layer).toBe("invalid");
    }
  });
  it("rejects repeat identity drift and a stale edited source statement", async () => {
    const value = fixture(); rewriteJoin(value, join => { join.source_variants[2].semantic_sha256 = H("drift"); });
    expect((await projectFinalNativeComparison(value, value.join.sha256)).status).toBe("invalid");
    const source = fixture(); rewriteSource(source, receipt => {
      receipt.variants[1].inspection.declared_source_ids.statement = receipt.variants[0].inspection.declared_source_ids.statement;
    });
    expect((await projectFinalNativeComparison(source, source.join.sha256)).status).toBe("invalid");
  });
  it("rejects re-labeled CPU profiles, extra fields, duplicate JSON keys, and altered raw text", async () => {
    const profile = fixture(); profile.schema = "fe2o3-source-variant-comparison-v1";
    expect((await projectFinalNativeComparison(profile, profile.join.sha256)).status).toBe("invalid");
    const extra = fixture(); Object.assign(extra.provenance, { authority: "trusted" });
    expect((await projectFinalNativeComparison(extra, extra.join.sha256)).status).toBe("invalid");
    const duplicate = fixture(); duplicate.join = artifact(duplicate.join.utf8.replace("{", "{\"kind\":\"forged\","));
    expect((await projectFinalNativeComparison(duplicate, duplicate.join.sha256)).status).toBe("invalid");
    const text = fixture(); text.reports[0].artifact.utf8 += " ";
    expect((await projectFinalNativeComparison(text, text.join.sha256)).status).toBe("invalid");
  });
  it("bounds text, payload sizes and roster count before hashing", () => {
    const oversized = fixture(); oversized.payloads[0].bytes = 65537; oversized.payloads[0].hex = "00".repeat(65537);
    expect(() => copyFinalNativeEvidence(oversized)).toThrow();
    const roster = fixture(); roster.payloads.push(roster.payloads[0]); expect(() => copyFinalNativeEvidence(roster)).toThrow();
    const text = fixture(); text.join.utf8 = " ".repeat(262145); text.join.bytes = 262145;
    expect(() => copyFinalNativeEvidence(text)).toThrow();
    const malformed = fixture(); malformed.sources[0].artifact.utf8 = "\ud800"; malformed.sources[0].artifact.bytes = 3;
    expect(() => copyFinalNativeEvidence(malformed)).toThrow();
  });
});
