import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import nativeIndex from "../docs/evidence/physical-global-copy-native-v21-20260924/index.json";
import debugIndex from "../docs/evidence/physical-entry-cpu-debug-v20-20260924/index.json";

const nativeDir = "docs/evidence/physical-global-copy-native-v21-20260924/";
const debugDir = "docs/evidence/physical-entry-cpu-debug-v20-20260924/";
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
interface Pin {
  name: string; source_bytes: number; source_sha256: string;
  retained_bytes: number; retained_sha256: string; normalization: string;
}
function verify(dir: string, pin: Pin) {
  const b = readFileSync(dir + pin.name);
  expect(b.length).toBe(pin.retained_bytes);
  expect(hash(b)).toBe(pin.retained_sha256);
  expect(["none", "append-one-final-newline"]).toContain(pin.normalization);
  if (pin.normalization === "append-one-final-newline") expect(b.at(-1)).toBe(10);
  const original = pin.normalization === "append-one-final-newline" ? b.subarray(0, -1) : b;
  expect(original.length).toBe(pin.source_bytes);
  expect(hash(original)).toBe(pin.source_sha256);
}
interface Refusal { accepted: boolean; mutation: string }
interface NativeReport {
  canonical_claimed_sha256: string; llvm_sha256: string; expectation_sha256: string;
  hsaco_sha256: string;
  metadata_arguments: { name: string; offset: number; size: number; kind: string; address_space: string }[];
  native_mutation_refusals: Refusal[];
  expectation_refusals: Refusal[];
  input_refusals: Refusal[];
  post_link_checks: string[];
  decoded_cfg: { instructions: number; ordinal: number; successors: number[] }[];
  trace: {
    opcode: string; memory_access: number; memory_width: number;
    register_operands: string[]; implicit_reads: string[];
  }[];
}
const native = (name: string, opt: string) =>
  JSON.parse(readFileSync(nativeDir + name + "-" + opt + ".json", "utf8")) as NativeReport;
const source = JSON.parse(readFileSync(
  "docs/evidence/physical-global-copy-source-v21-20260924/source-ladder.json", "utf8",
)) as { observations: { feature: string; mode: string; observation: {
  canonical_identity: string; llvm_sha256: string; native_observation_sha256: string;
} }[] };

describe("separate V21 native and V20 CPU-debug qualification records", () => {
  it("pins exact native stdout slices without treating the site census as compiler custody", () => {
    expect(nativeIndex.compiler_publication).toBe("dbfb61e7186e5fa37dd9d544d85de29c7a1080eb");
    expect(nativeIndex.compiler_functional_tree).toBe("f49a2fc98386e443440c5b11cd9f0345f47db063");
    expect(nativeIndex.records).toHaveLength(4);
    expect(nativeIndex.gate).toMatchObject({
      source_bytes: 108498,
      source_sha256: "d43943b2efe3053402782d553889c58070738fb745e59a8a67c8d2283c2a57b3",
      monitored_repository: "site", status: "command-passed",
      exit_code: 0, signal: null, errors: [],
      receipt_retained: false, summary_is_selected_fields_not_full_receipt: true,
      hardware_observed: false, production_qualified: false,
    });
    expect(nativeIndex.gate.source_before).toEqual(nativeIndex.gate.source_after);
    expect(nativeIndex.gate_source_census_scope).toContain("site repository");
    expect(nativeIndex.matrix_stdout).toMatchObject({
      source_bytes: 199402,
      source_sha256: "e73b10d2b06ead351ec6d9f5cd81e31eca022ab56c8bc46a54c555a9f78d8abe",
      retained: false,
    });
    expect(nativeIndex.records.map(pin => pin.source_byte_offset)).toEqual([275, 49959, 99643, 149385]);
    for (const pin of nativeIndex.records) verify(nativeDir, pin);
    expect(nativeIndex.source_custody_exported).toBe(false);
    expect(nativeIndex.grants_artifact_or_launch_authority).toBe(false);
  });

  for (const name of ["one", "registers"]) for (const opt of ["o0", "o3"]) {
    it("joins " + name + "/" + opt + " static instructions to unchanged source diagnostics", () => {
      const r = native(name, opt);
      const observed = source.observations.find(
        row => row.feature === "physical-global-copy-" + name + "-v21" && row.mode === "observe",
      )!.observation;
      expect(r).toMatchObject({
        schema: "private-canonical-physical-global-copy-native-observation-v21-r1",
        entry: "physical_global_copy_" + name, optimization: opt.toUpperCase(),
        target: "gfx942:xnack-", wave_width: 64, code_object_version: 6,
        workgroup: [64, 1, 1], maximum_workgroups_premise: [2, 1, 1],
        authored_instructions: 24, entry_bytes: 128,
        compiler_prologue_instructions: 0, compiler_tail_instructions: 0,
        llvm_function_shell: "ordinary",
        descriptor: { sgpr_capacity: 32, vgpr_capacity: name === "one" ? 16 : 24,
          rsrc2: 132, code_properties: 8, kernarg_preload: 0 },
        expected_sgpr_minimum: 20, expected_vgpr_minimum: name === "one" ? 12 : 23,
        expectations_are_inert: true, external_same_source_owner_join_required: true,
        synthetic_worker_identity_fields: true,
        canonical_owner_admission: false, source_authentication: false,
        live_rust_source_abi_qualified: false, protected_finalizer_admission: false,
        hardware_execution: false, native_functional_execution: false,
        runtime_input_bounds_proved: false, runtime_output_bounds_proved: false,
        runtime_pointer_validity_proved: false, initialized_input_proved: false,
        host_input_output_disjointness_proved: false, general_hazard_model_qualified: false,
        owner_contract_accepted: false, milestone_completion: false,
      });
      expect(r.canonical_claimed_sha256).toBe(observed.canonical_identity);
      expect(r.llvm_sha256).toBe(observed.llvm_sha256);
      expect(r.expectation_sha256).toBe(observed.native_observation_sha256);
      expect(r.hsaco_sha256).toBe(native(name, opt === "o0" ? "o3" : "o0").hsaco_sha256);
      expect(r.decoded_cfg).toHaveLength(1);
      expect(r.decoded_cfg[0]).toMatchObject({ instructions: 24, ordinal: 0, successors: [] });
      expect(r.trace).toHaveLength(24);
      expect(r.trace[12]).toMatchObject({
        opcode: "GLOBAL_LOAD_DWORD_vi", memory_access: 1, memory_width: 4,
        implicit_reads: ["EXEC"], register_operands: [name === "one" ? "VGPR8" : "VGPR22", "VGPR6_VGPR7"],
      });
      expect(r.metadata_arguments).toHaveLength(17);
      expect(r.metadata_arguments.slice(0, 4)).toEqual([
        { name: "input_data", offset: 0, size: 8, kind: "global_buffer", address_space: "global" },
        { name: "input_length", offset: 8, size: 8, kind: "by_value", address_space: "" },
        { name: "output_data", offset: 16, size: 8, kind: "global_buffer", address_space: "global" },
        { name: "output_length", offset: 24, size: 8, kind: "by_value", address_space: "" },
      ]);
      expect(r.post_link_checks.some(line => line.includes("kernarg_size=288"))).toBe(true);
      expect(r.native_mutation_refusals).toHaveLength(71);
      expect(r.expectation_refusals).toHaveLength(12);
      expect(r.input_refusals).toHaveLength(2);
      for (const row of [...r.native_mutation_refusals, ...r.expectation_refusals, ...r.input_refusals])
        expect(row.accepted).toBe(false);
      for (const name of ["kernarg_offset_0", "kernarg_origin_base_0", "pointer_high_carry_source_11",
        "load_destination_12", "vm_wait_one_pending_13", "exec_mask_removed_19",
        "store_actual_load_register_20", "missing_kernarg_enable", "hidden_grid_dims"])
        expect(r.native_mutation_refusals.map(row => row.mutation)).toContain(name);
    });
  }

  it("pins the 21 focused CPU tests without laundering the ignored actual-input test", () => {
    expect(debugIndex.compiler_publication).toBe("dbfb61e7186e5fa37dd9d544d85de29c7a1080eb");
    expect(debugIndex.records).toHaveLength(1);
    for (const pin of debugIndex.records) verify(debugDir, pin);
    expect(debugIndex.gate).toMatchObject({
      source_bytes: 21147,
      source_sha256: "dcd0567a06c408fd1721caa5ab8ab92cafb9552c1abbb4be6e984c1fa9cbd727",
      status: "command-passed", monitored_repository: "compiler",
      exit_code: 0, signal: null, errors: [],
      receipt_retained: false, summary_is_selected_fields_not_full_receipt: true,
    });
    expect(debugIndex.gate.source_before).toEqual(debugIndex.gate.source_after);
    expect(debugIndex.qualification).toEqual({
      reader_tests: 3, admission_tests: 3, cli_tests: 11, debugger_tests: 4,
      actual_source_input_test: "ignored in this gate; separately qualified by the actual-input packet",
      hardware_execution: false,
    });
    const stdout = readFileSync(debugDir + "focused-tests.stdout", "utf8");
    expect(stdout).toContain("supplied_actual_v20_input_uses_same_public_loader_and_jsonl_session ... ignored");
    expect(stdout.match(/test result: ok\. ([1-9][0-9]*) passed;/gu)).toEqual([
      "test result: ok. 3 passed;", "test result: ok. 3 passed;",
      "test result: ok. 11 passed;", "test result: ok. 4 passed;",
    ]);
    const lesson = readFileSync("docs/physical-entry-cpu-debug-v20.md", "utf8");
    expect(lesson).toContain("11 CLI tests and four debugger session tests");
    expect(lesson).toContain("explicitly ignored in this gate");
  });
});
