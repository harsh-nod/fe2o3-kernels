// Synthetic checker controls only. No compiler/simulator/native execution.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CASES, directory, readBounded, json } from "../public-authoring-inspector/lab.mjs";
import { CASE_COUNT, REPRESENTATIVE_CASE, LENGTHS, LIMITS, caseSpec, makeRequest,
  expectedWord, checkBodyInspection, checkResult, expectedSummary, prepare, checkFiles, main } from "./lab.mjs";

const WORDS = [0, 1, 3, 0x80000000, 0x5555aab9, 23];
const PAIRS = [[0, 64], [0, 128], [1, 64], [1, 128], [63, 64], [63, 128], [64, 64], [64, 128],
  [65, 128], [65, 192], [127, 128], [127, 192], [128, 128], [128, 192], [129, 192], [129, 256]];
function inspection() {
  return { kind: "diagnostic_ordered_program_inspection_example", authority: "observation_only",
    kernel: "ordered_u32_program", function: "ordered_u32_program",
    canonical: { wire_version: 17, sha256: "c".repeat(64), bytes: 1234 },
    declared_target: "gfx942:xnack-", declared_wave_width: 64, profile: "closed_u32_program_e32_v1",
    memory_effect: "NoMemory", ordered_region_effect: true,
    logical_observation_granularity: "whole_program_before_after", cpu_preflight_passed: true,
    source_authentication: false, source_map_available: false, physical_register_values_available: false,
    instruction_microsteps_available: false, register_lifetime_or_final_allocation_proof: false,
    proof_authority: false, artifact_authority: false, production_resume_authority: false,
    hardware_execution: false, pure_or_movable: false,
    register_plan: { scratch: 32, output: 33, inputs: [34, 35, 36], vgpr_high_water: 37 },
    declared_program: { count: 3, descriptors: [133, 307, 413, ...Array(13).fill(0)] },
    declared_instruction_steps: [
      { instruction: "v_xor_b32_e32", output: 32, inputs: [34, 35] },
      { instruction: "v_and_b32_e32", output: 32, inputs: [32, 36] },
      { instruction: "v_xor_b32_e32", output: 33, inputs: [35, 32] },
    ],
    coordinate: { function_ordinal: 0, block_ordinal: 0, operation_ordinal: 0 }, raw_block_id: 0,
    input_value_ids: [7, 2, 1], result_value_id: 11,
    declared_source_ids: { frontend_unit: "1".repeat(64), function: "2".repeat(64),
      contract: "3".repeat(64), statement: "4".repeat(64) },
    inspection_counts: { blocks: 7, operations: 8, ssa_definitions: 11, capability_entries: 9, name_bytes: 342 } };
}
function result(index) {
  const input = Math.floor(index / 16), [length, grid] = PAIRS[index % 16], size = 8 + 4 * grid;
  // Separate literal word/per-byte table, not helper expectedWord/expectedBuffer.
  const bytes = Array.from({ length: size }, (_, i) => i >= 4 && i < 4 + 4 * length
    ? Math.floor(WORDS[input] / 256 ** ((i - 4) % 4)) % 256 : 0xa5);
  const bitmap = Array.from({ length: size / 8 }, (_, i) => Array.from({ length: 8 }, (_, bit) =>
    i * 8 + bit >= 4 && i * 8 + bit < 4 + 4 * length ? 2 ** bit : 0).reduce((a, b) => a + b, 0));
  return { schema: "fe2o3-simulation-result-v1", status: "ok", authority: "observation_only", simulated: true,
    hardware_observed: false, hardware_validation: false, performance_prediction: false,
    target_profile: { identity: "amdgpu_64_little_endian_v1", index_bits: 64, max_workgroup_invocations: 1024 },
    kir: { sha256: "c".repeat(64), canonical_bytes: 1234 },
    counts: { arguments: 4, shared_buffers: 1, invocations_executed: grid, workgroups_visited: grid / 64,
      scheduled_slots_visited: grid, steps_executed: 1000, events_emitted: 0 },
    schedule: { identity: "workgroup_major_local_zyx_cooperative_v1", transcript_sha256: "d".repeat(64),
      coverage: { decisions: grid, workgroups: grid / 64, barrier_releases: 0, complete: true } },
    conflict_assessment: { status: "no_conflicts_observed" }, arguments: makeRequest(index).arguments,
    shared_buffers: [{ id: 1, buffer: { element: "u32", access: "read_write", alignment: 4,
      bytes: "0x" + Buffer.from(bytes).toString("hex"), initialized: "0x" + Buffer.from(bitmap).toString("hex") } }] };
}
function reject(index, change) {
  const value = result(index); change(value);
  assert.throws(() => checkResult(index, makeRequest(index), value, inspection()));
}
function temporary(body) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "fe2o3-guarded-body-control-"));
  try { return body(root); }
  finally { fs.rmSync(root, { recursive: true }); } // Only this freshly created test directory.
}
function writeJson(file, value) { fs.writeFileSync(file, JSON.stringify(value) + "\n", { flag: "wx", mode: 0o600 }); }

test("exact 96-case roster and one-wave representative inspection request", () => {
  assert.equal(CASE_COUNT, 96); assert.equal(CASES.length, 6);
  assert.deepEqual(LENGTHS, [0, 1, 63, 64, 65, 127, 128, 129]);
  assert.equal(new Set(Array.from({ length: 96 }, (_, i) => caseSpec(i).id)).size, 96);
  for (let input = 0; input < 6; input++) for (let j = 0; j < 16; j++) {
    const spec = caseSpec(input * 16 + j);
    assert.equal(spec.input, input); assert.deepEqual([spec.length, spec.grid], PAIRS[j]);
  }
  assert.deepEqual(caseSpec(REPRESENTATIVE_CASE), { index: 86, id: "case-87", input: 5, length: 64, grid: 64, extra: 0 });
  for (const bad of [-1, 96, 0.5, NaN, Infinity, "0", 0n]) assert.throws(() => caseSpec(bad));
});
test("independent literal bit-selection words include the unsigned high bit", () => {
  assert.deepEqual(CASES.map((_, i) => expectedWord(i)), WORDS);
  for (const bad of [-1, 6, 0.5, "0", NaN, 0n]) assert.throws(() => expectedWord(bad));
});
test("all 96 requests and complete results agree with separate byte-table oracle", () => {
  for (let i = 0; i < 96; i++) {
    const request = makeRequest(i), response = result(i), [length, grid] = PAIRS[i % 16];
    assert(Buffer.byteLength(JSON.stringify(request)) <= LIMITS.request);
    assert(Buffer.byteLength(JSON.stringify(response)) <= LIMITS.result);
    assert.deepEqual(request.grid, [grid, 1, 1]);
    assert.deepEqual(request.workgroup, [64, 1, 1]);
    assert.equal(request.arguments[0].elements, length); assert.equal(request.arguments[0].byte_offset, 4);
    assert.equal(request.shared_buffers[0].bytes, "0x" + "a5".repeat(8 + 4 * grid));
    assert.equal(request.shared_buffers[0].initialized, "0x" + "00".repeat((8 + 4 * grid) / 8));
    const checked = checkResult(i, request, response, inspection());
    assert.equal(checked.output_words, length); assert.equal(checked.expected_word, WORDS[Math.floor(i / 16)]);
  }
  // Requests are fresh mutable values; changing one cannot alter another.
  const altered = makeRequest(0); altered.arguments[0].elements = 100;
  assert.equal(makeRequest(0).arguments[0].elements, 0);
});
test("actual parser null-prototype objects compare by exact JSON values on both sides", () => temporary(root => {
  const reportFile = path.join(root, "inspection.json"); writeJson(reportFile, inspection());
  for (const index of [0, 95]) {
    const requestFile = path.join(root, index + "-request.json");
    const resultFile = path.join(root, index + "-result.json");
    writeJson(requestFile, makeRequest(index)); writeJson(resultFile, result(index));
    const request = json(requestFile, LIMITS.request), response = json(resultFile, LIMITS.result);
    assert.equal(Object.getPrototypeOf(request.arguments[0]), null);
    assert.equal(Object.getPrototypeOf(response.arguments[0]), null);
    checkResult(index, request, response, json(reportFile, LIMITS.inspection));
    response.arguments[0].elements++;
    assert.throws(() => checkResult(index, request, response, json(reportFile, LIMITS.inspection)));
  }
}));
test("packed initialization boundaries cover zero, partial, exact and overfull waves", () => {
  const prefixes = ["", "f0", "f0" + "ff".repeat(31), "f0" + "ff".repeat(31) + "0f",
    "f0" + "ff".repeat(32), "f0" + "ff".repeat(63), "f0" + "ff".repeat(63) + "0f", "f0" + "ff".repeat(64)];
  for (let row = 0; row < 8; row++) for (let launch = 0; launch < 2; launch++) {
    const index = row * 2 + launch, response = result(index), size = (8 + 4 * PAIRS[index][1]) / 8;
    assert.equal(response.shared_buffers[0].buffer.initialized, "0x" + prefixes[row].padEnd(size * 2, "0"));
    checkResult(index, makeRequest(index), response, inspection());
  }
});
test("first/last output, both guards and every selected inactive-tail boundary refuse corruption", () => {
  for (const index of [0, 1, 2, 3, 6, 7, 14, 15, 86, 95]) {
    const [length, grid] = PAIRS[index % 16], positions = new Set([0, 3, 4 + 4 * grid, 7 + 4 * grid]);
    if (length) { positions.add(4); positions.add(4 + 4 * length - 1); }
    if (grid > length) { positions.add(4 + 4 * length); positions.add(4 + 4 * grid - 1); }
    for (const offset of positions) reject(index, response => {
      const bytes = Buffer.from(response.shared_buffers[0].buffer.bytes.slice(2), "hex"); bytes[offset] ^= 1;
      response.shared_buffers[0].buffer.bytes = "0x" + bytes.toString("hex");
    });
  }
});
test("initialization flips refuse even when data bytes are unchanged", () => {
  for (const index of [0, 2, 4, 6, 8, 10, 12, 14, 15, 95]) {
    const [length, grid] = PAIRS[index % 16];
    for (const bit of new Set([0, 3, 4, 4 + 4 * length, 7 + 4 * grid])) reject(index, response => {
      const bits = Buffer.from(response.shared_buffers[0].buffer.initialized.slice(2), "hex"); bits[bit >> 3] ^= 1 << (bit & 7);
      response.shared_buffers[0].buffer.initialized = "0x" + bits.toString("hex");
    });
  }
});
test("exact requests, canonical joins, copied arguments and buffer rosters cannot drift", () => {
  for (const change of [
    r => { r.kir.sha256 = "a".repeat(64); }, r => { r.kir.canonical_bytes++; },
    r => { r.arguments[0].elements--; }, r => { r.arguments[1].bits = "0x00000000"; },
    r => { r.shared_buffers.push(structuredClone(r.shared_buffers[0])); },
    r => { r.shared_buffers[0].buffer.extra = true; }, r => { r.shared_buffers[0].id = 2; },
    r => { r.extra = true; }, r => { r.kir.extra = true; },
  ]) reject(95, change);
  for (const change of [
    r => { r.shared_buffers[0].initialized = "0xff"; }, r => { r.arguments[0].byte_offset = 0; },
    r => { r.grid[0] = 128; }, r => { r.workgroup[0] = 32; }, r => { r.kernel = "different"; },
  ]) { const request = makeRequest(95); change(request); assert.throws(() => checkResult(95, request, result(95), inspection())); }
  assert.throws(() => checkResult(94, makeRequest(95), result(95), inspection()));
});
test("CPU schedule, counts, conflict observations and authority remain bounded", () => {
  for (const change of [
    r => { r.counts.invocations_executed--; }, r => { r.counts.workgroups_visited++; },
    r => { r.counts.scheduled_slots_visited--; }, r => { r.counts.events_emitted = 1; },
    r => { r.counts.steps_executed = Number.MAX_SAFE_INTEGER + 1; }, r => { r.counts.steps_executed = 1000n; },
    r => { r.target_profile.index_bits = 32; }, r => { r.schedule.identity = "other"; },
    r => { r.schedule.transcript_sha256 = "0".repeat(64); }, r => { r.schedule.coverage.complete = false; },
    r => { r.schedule.coverage.decisions++; }, r => { r.schedule.coverage.workgroups++; },
    r => { r.schedule.coverage.barrier_releases = 1; }, r => { r.conflict_assessment.status = "conflicts_observed"; },
    r => { r.hardware_observed = true; }, r => { r.hardware_validation = true; },
    r => { r.performance_prediction = true; }, r => { r.status = "error"; },
    r => { r.authority = "proof"; }, r => { r.simulated = false; },
  ]) reject(95, change);
});
test("inspection distinguishes the no-leading-identity body and exact declared program", () => {
  for (const change of [
    r => { r.coordinate.operation_ordinal = 1; }, r => { r.coordinate.block_ordinal = 1; },
    r => { r.inspection_counts.operations = 9; }, r => { r.inspection_counts.blocks = 8; },
    r => { r.inspection_counts.name_bytes = Number.MAX_SAFE_INTEGER + 1; },
    r => { r.kernel = "different"; }, r => { r.function = "different"; },
    r => { r.declared_source_ids.statement = "0".repeat(64); }, r => { r.declared_program.descriptors[0] = 132; },
    r => { r.declared_program.descriptors[15] = 1; }, r => { r.register_plan.inputs[0] = 4; },
    r => { r.canonical.wire_version = 16; }, r => { r.physical_register_values_available = true; },
    r => { r.source_authentication = true; }, r => { r.memory_effect = "ReadWrite"; },
    r => { r.input_value_ids[0] = r.result_value_id; }, r => { r.declared_instruction_steps[0].output = 31; },
  ]) { const report = inspection(); change(report); assert.throws(() => checkBodyInspection(report)); }
  // These IDs are read from the selected report, not historical compiler pins.
  const fresh = inspection(); fresh.input_value_ids = [30, 31, 32]; fresh.result_value_id = 33;
  fresh.raw_block_id = 100; fresh.declared_source_ids.statement = "e".repeat(64);
  checkBodyInspection(fresh);
});
test("explicit aggregate table and worst-case input budget", () => {
  assert.deepEqual(expectedSummary(), { cases: 96, scalar_triples: 6, lengths: [0, 1, 63, 64, 65, 127, 128, 129],
    launches_per_length: 2, output_words: 6924, checked_backing_bytes: 52992, unchanged_bytes: 25296,
    invocations: 13056, source_authentication: false, native_functional_execution: false, hardware_observed: false });
  assert(LIMITS.kir + LIMITS.inspection + 96 * (LIMITS.request + LIMITS.result) <= LIMITS.total);
});
test("bounded duplicate-safe JSON refuses malformed encodings and never rounds large integers", () => temporary(root => {
  const file = path.join(root, "input.json");
  for (const text of ['{"x":1,"x":2}', '{"x":-1}', '{"x":1.5}', '{"x":1e3}',
    '{"x":18446744073709551616}', '\ufeff{"x":1}', '{"x":1} trailing']) {
    fs.writeFileSync(file, text); assert.throws(() => json(file, 256));
  }
  fs.writeFileSync(file, Buffer.from([0x22, 0xff, 0x22])); assert.throws(() => json(file, 256));
  fs.writeFileSync(file, '{"x":9007199254740993}');
  assert.equal(json(file, 256).x, 9007199254740993n);
  fs.writeFileSync(file, " ".repeat(257)); assert.throws(() => json(file, 256));
  fs.writeFileSync(file, ""); assert.throws(() => readBounded(file, 256));
}));
test("create-new request generation refuses reuse and noncanonical paths", () => temporary(root => {
  const destination = path.join(root, "run"); prepare(destination);
  assert.equal(fs.readdirSync(destination).length, 96);
  for (let i = 0; i < 96; i++) {
    const file = path.join(destination, caseSpec(i).id + "-request.json");
    assert.deepEqual(JSON.parse(readBounded(file, LIMITS.request)), makeRequest(i));
  }
  const before = fs.readFileSync(path.join(destination, "case-01-request.json"));
  assert.throws(() => prepare(destination), /EEXIST/u);
  assert.deepEqual(fs.readFileSync(path.join(destination, "case-01-request.json")), before);
  for (const bad of ["relative", destination + "/", root + "/../run", root + "/bad\nname"])
    assert.throws(() => prepare(bad));
}));
test("bounded file and directory readers refuse symlinks and wrong object types", () => temporary(root => {
  const file = path.join(root, "input.json"); writeJson(file, { x: 1 });
  const link = path.join(root, "input-link.json"); fs.symlinkSync(file, link);
  assert.throws(() => json(link, 256)); assert.throws(() => readBounded(root, 256));
  const real = path.join(root, "real"); fs.mkdirSync(real);
  const linked = path.join(root, "linked"); fs.symlinkSync(real, linked);
  assert.throws(() => directory(linked)); assert.throws(() => prepare(path.join(linked, "child")));
}));
test("retained-file checker checks all 96 but does not authenticate raw KIR custody", () => temporary(root => {
  const run = path.join(root, "run"); prepare(run);
  writeJson(path.join(run, "inspection.json"), inspection());
  // Deliberately NOT a KIR construction: arbitrary bytes prove this checker only
  // observes raw file length/hash; compiler-owned admission is a separate step.
  const kir = path.join(run, "source-body.kir"); fs.writeFileSync(kir, Buffer.alloc(1234, 0x78), { flag: "wx" });
  for (let i = 0; i < 96; i++) writeJson(path.join(run, caseSpec(i).id + "-result.json"), result(i));
  const first = checkFiles(run);
  assert.deepEqual(first.summary, expectedSummary()); assert.equal(first.canonical_identity, "c".repeat(64));
  fs.writeFileSync(kir, Buffer.alloc(1234, 0x79));
  const second = checkFiles(run);
  assert.notEqual(second.raw_kir_sha256, first.raw_kir_sha256);
  assert.equal(second.canonical_identity, first.canonical_identity);
  assert.equal(second.raw_kir_bytes, 1234);
  const wrong = result(95); wrong.counts.invocations_executed--;
  fs.writeFileSync(path.join(run, "case-96-result.json"), JSON.stringify(wrong));
  assert.throws(() => checkFiles(run));
}));
test("CLI rejects unknown or expanded argument rosters without side effects", () => {
  for (const args of [[], ["run", "/tmp"], ["check"], ["check", "/tmp", "extra"], ["prepare"]])
    assert.throws(() => main(args), /usage:/u);
});
