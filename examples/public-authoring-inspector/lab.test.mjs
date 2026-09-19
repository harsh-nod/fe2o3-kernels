// Pure synthetic controls only. These do not run or authenticate a compiler.
import assert from "node:assert/strict";
import test from "node:test";
import { CASES, checkInspection, checkResult, expectedWord, makeRequest } from "./lab.mjs";

function inspection(variant = "original") {
  return {
    kind: "diagnostic_ordered_program_inspection_example", authority: "observation_only",
    canonical: { wire_version: 17, sha256: (variant === "original" ? "1" : "2").repeat(64), bytes: 1024 },
    declared_target: "gfx942:xnack-", declared_wave_width: 64, profile: "closed_u32_program_e32_v1",
    memory_effect: "NoMemory", ordered_region_effect: true,
    logical_observation_granularity: "whole_program_before_after", cpu_preflight_passed: true,
    source_authentication: false, source_map_available: false, physical_register_values_available: false,
    instruction_microsteps_available: false, register_lifetime_or_final_allocation_proof: false,
    proof_authority: false, artifact_authority: false, production_resume_authority: false,
    hardware_execution: false, pure_or_movable: false,
    register_plan: { scratch: 32, output: 33, inputs: [34, 35, 36], vgpr_high_water: 37 },
    declared_program: { count: 3, descriptors: [variant === "original" ? 133 : 132, 307, 413, ...Array(13).fill(0)] },
    declared_instruction_steps: [
      { instruction: variant === "original" ? "v_xor_b32_e32" : "v_or_b32_e32", output: 32, inputs: [34, 35] },
      { instruction: "v_and_b32_e32", output: 32, inputs: [32, 36] },
      { instruction: "v_xor_b32_e32", output: 33, inputs: [35, 32] },
    ],
    coordinate: { function_ordinal: 0, block_ordinal: 2, operation_ordinal: 4 },
    raw_block_id: 12, input_value_ids: [10, 11, 12], result_value_id: 13,
    declared_source_ids: { frontend_unit: "3".repeat(64), function: "4".repeat(64),
      contract: "5".repeat(64), statement: "6".repeat(64) },
  };
}
function output(variant = "original", index = 5) {
  const plan = inspection(variant), request = makeRequest(index), bytes = Buffer.alloc(264, 0xa5);
  for (let lane = 0; lane < 64; lane++) bytes.writeUInt32LE(expectedWord(variant, index), 4 + lane * 4);
  return { schema: "fe2o3-simulation-result-v1", status: "ok", authority: "observation_only",
    simulated: true, hardware_observed: false, hardware_validation: false, performance_prediction: false,
    kir: { sha256: plan.canonical.sha256, canonical_bytes: plan.canonical.bytes },
    counts: { arguments: 4, shared_buffers: 1, invocations_executed: 64, workgroups_visited: 1, scheduled_slots_visited: 64 },
    arguments: request.arguments,
    shared_buffers: [{ id: 1, buffer: { element: "u32", access: "read_write", alignment: 4,
      bytes: "0x" + bytes.toString("hex"), initialized: "0xf0" + "ff".repeat(31) + "0f" } }],
  };
}
test("independent formulas and requests have fixed, reviewed input/guard bounds", () => {
  assert.equal(CASES.length, 6);
  assert.deepEqual(CASES.map((_value, index) => expectedWord("original", index)),
    [0, 1, 3, 2147483648, 1431677625, 23]);
  assert.equal(expectedWord("edited", 5), 21);
  const request = makeRequest(5);
  assert.equal(request.shared_buffers[0].bytes.length, 530);
  assert.equal(request.shared_buffers[0].initialized, "0x" + "00".repeat(33));
  assert.equal(request.arguments[0].byte_offset, 4);
  assert.equal(request.arguments[0].elements, 64);
  assert.throws(() => makeRequest(6));
  assert.throws(() => expectedWord("future", 0));
});
test("synthetic schema controls exercise both formula branches and all six requests", () => {
  for (const variant of ["original", "edited"]) for (let index = 0; index < CASES.length; index++) {
    assert.equal(checkResult(variant, index, makeRequest(index), output(variant, index), inspection(variant)),
      expectedWord(variant, index));
  }
});
test("the independent oracle detects a wrong output, both canaries and initialization corruption", () => {
  for (const offset of [0, 4, 128, 256, 260, 263]) {
    const result = output();
    const bytes = Buffer.from(result.shared_buffers[0].buffer.bytes.slice(2), "hex");
    bytes[offset] ^= 1;
    result.shared_buffers[0].buffer.bytes = "0x" + bytes.toString("hex");
    assert.throws(() => checkResult("original", 5, makeRequest(5), result, inspection()), /output words/u);
  }
  const initialized = output();
  initialized.shared_buffers[0].buffer.initialized = "0x" + "ff".repeat(33);
  assert.throws(() => checkResult("original", 5, makeRequest(5), initialized, inspection()), /initialization/u);
});
test("old inspection/results, changed declarations and renamed authority do not pass", () => {
  assert.throws(() => checkResult("edited", 5, makeRequest(5), output(), inspection("edited")), /canonical inspection/u);
  assert.throws(() => checkInspection("edited", inspection()), /descriptors/u);
  for (const key of ["hardware_execution", "source_authentication", "production_resume_authority"]) {
    const report = inspection(); report[key] = true;
    assert.throws(() => checkInspection("original", report));
  }
  const changed = output(); changed.kir.sha256 = "f".repeat(64);
  assert.throws(() => checkResult("original", 5, makeRequest(5), changed, inspection()), /canonical inspection/u);
  const input = makeRequest(5); input.arguments[1].bits = "0x00000000";
  assert.throws(() => checkResult("original", 5, input, output(), inspection()), /independent input case/u);
});
test("wrong wave/target/bindings/padding and output counts refuse explicitly", () => {
  for (const change of [
    report => { report.declared_wave_width = 32; },
    report => { report.declared_target = "gfx950"; },
    report => { report.register_plan.output = 32; },
    report => { report.declared_program.descriptors[15] = 1; },
    report => { report.declared_instruction_steps[0].inputs[0] = 33; },
  ]) {
    const report = inspection(); change(report); assert.throws(() => checkInspection("original", report));
  }
  const partial = output(); partial.counts.invocations_executed = 63;
  assert.throws(() => checkResult("original", 5, makeRequest(5), partial, inspection()), /invocations_executed/u);
});
