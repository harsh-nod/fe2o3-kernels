// Synthetic schema controls plus retained real canonical-byte vectors.
// These do not run or authenticate a compiler, admit KIR or create execution evidence.
import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CASES, LIMITS, checkCanonicalBytes, checkFiles, checkInspection, checkResult, expectedWord, makeRequest } from "./lab.mjs";

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

const retained = JSON.parse(fs.readFileSync(new URL("./canonical-v17-vectors.json", import.meta.url), "utf8"));
const knownVectors = [
  ["default", "c8c7099621ed88bca7fffb51bc10edbccb556cc0638ebe0dffa69cbfdbfac26c",
    "bd24d1fc942ca247fc258f3f29af3c64fdee65a624731188a1c1ce6da30877de"],
  ["edited", "1bc1158210e003f30fee45a2fddf33d2b4dcf550fa32399967d0164089cb3675",
    "57fcb93e5af78855f44da324572f38fdcbdbaa41a886d4b556a1446e0c11f63e"],
];
function retainedBytes(index = 0) { return Buffer.from(retained.rows[index].base64, "base64"); }
function retainedIdentity(index = 0) { return { ...retained.rows[index].canonical }; }
function independentFraming(bytes, { domain = "FE2O3/VERIFIED-CANONICAL-KERNEL-IR/V17\0",
  policy = 1, length = bytes.length, bigEndian = false } = {}) {
  const d = Buffer.from(domain, "utf8"), prefix = Buffer.alloc(4), p = Buffer.alloc(2), n = Buffer.alloc(8);
  if (bigEndian) { prefix.writeUInt32BE(d.length); p.writeUInt16BE(policy); n.writeBigUInt64BE(BigInt(length)); }
  else { prefix.writeUInt32LE(d.length); p.writeUInt16LE(policy); n.writeBigUInt64LE(BigInt(length)); }
  return createHash("sha256").update(Buffer.concat([prefix, d, p, n, bytes])).digest("hex");
}
test("two retained real V17 exports match separately retained raw and canonical identities", () => {
  assert.equal(retained.provenance.capture, "phase19b-instruction-native-join-r1");
  const published = fs.readFileSync(new URL("../source_instruction_native_comparison_v1.json", import.meta.url));
  assert.equal(published.length, 503416);
  assert.equal(createHash("sha256").update(published).digest("hex"),
    "0b4a9689524965929d1e9b102d7802e737e068293f74fa28d0148ab49238cc04");
  const sourceRows = JSON.parse(JSON.parse(published).join.utf8).source_variants;
  assert.equal(retained.rows.length, 2);
  for (let index = 0; index < 2; index++) {
    const bytes = retainedBytes(index), identity = retainedIdentity(index);
    const [label, raw, canonical] = knownVectors[index];
    assert.equal(retained.rows[index].label, label);
    assert.equal(bytes.length, 993);
    assert.equal(bytes.toString("base64"), retained.rows[index].base64);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), raw);
    assert.equal(retained.rows[index].raw_sha256, raw);
    assert.deepEqual(identity, { wire_version: 17, bytes: 993, sha256: canonical });
    const sourceRow = sourceRows.find(row => row.label === label);
    assert.equal(sourceRow.canonical_kir_sha256, canonical);
    assert.equal(sourceRow.canonical_kir_bytes, bytes.length);
    assert.equal(sourceRow.kir_file_sha256, raw);
    assert.equal(checkCanonicalBytes(bytes, identity), undefined);
  }
});
test("same-size cross-variant substitution and first/middle/last byte changes refuse", () => {
  assert.equal(retainedBytes(0).length, retainedBytes(1).length);
  assert.throws(() => checkCanonicalBytes(retainedBytes(1), retainedIdentity(0)), /canonical file identity/u);
  assert.throws(() => checkCanonicalBytes(retainedBytes(0), retainedIdentity(1)), /canonical file identity/u);
  for (const offset of [0, 496, 992]) {
    const bytes = retainedBytes(); bytes[offset] ^= 1;
    assert.throws(() => checkCanonicalBytes(bytes, retainedIdentity()), /canonical file identity/u);
  }
});
test("changed or malformed report digest never falls back to length or raw SHA", () => {
  for (const sha256 of ["f".repeat(64), knownVectors[0][1], knownVectors[1][2]]) {
    assert.throws(() => checkCanonicalBytes(retainedBytes(), { ...retainedIdentity(), sha256 }),
      /canonical file identity/u);
  }
  for (const sha256 of ["0".repeat(64), "A".repeat(64), "g".repeat(64), "", null]) {
    assert.throws(() => checkCanonicalBytes(retainedBytes(), { ...retainedIdentity(), sha256 }),
      /SHA-256 shape/u);
  }
});
test("domain terminator, version domain, policy, length framing and endian are exact", () => {
  const bytes = retainedBytes();
  assert.equal(independentFraming(bytes), knownVectors[0][2]);
  for (const options of [
    { domain: "FE2O3/VERIFIED-CANONICAL-KERNEL-IR/V17" },
    { domain: "FE2O3/VERIFIED-CANONICAL-KERNEL-IR/V18\0" },
    { policy: 2 }, { length: bytes.length + 1 }, { bigEndian: true },
  ]) {
    const sha256 = independentFraming(bytes, options);
    assert.notEqual(sha256, knownVectors[0][2]);
    assert.throws(() => checkCanonicalBytes(bytes, { ...retainedIdentity(), sha256 }), /canonical file identity/u);
  }
});
test("only exact V17 fields, bounded positive lengths and Buffer inputs are accepted", () => {
  for (const wire_version of [16, 18, "17", null]) {
    assert.throws(() => checkCanonicalBytes(retainedBytes(), { ...retainedIdentity(), wire_version }),
      /wire version/u);
  }
  for (const bytes of [0, -1, 1.5, "993", LIMITS.kir + 1, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => checkCanonicalBytes(retainedBytes(), { ...retainedIdentity(), bytes }));
  }
  assert.throws(() => checkCanonicalBytes(new Uint8Array(retainedBytes()), retainedIdentity()), /Buffer/u);
  assert.throws(() => checkCanonicalBytes(Buffer.alloc(LIMITS.kir + 1), retainedIdentity()), /file bound/u);
  assert.throws(() => checkCanonicalBytes(retainedBytes(), { ...retainedIdentity(), policy: 1 }), /field roster/u);
  const missing = retainedIdentity(); delete missing.sha256;
  assert.throws(() => checkCanonicalBytes(retainedBytes(), missing), /field roster/u);
});
test("truncated, appended and malformed selected bytes refuse without decoding or admission", () => {
  const bytes = retainedBytes(), identity = retainedIdentity();
  for (const length of [0, 1, 55, 56, 64, bytes.length - 1]) {
    assert.throws(() => checkCanonicalBytes(bytes.subarray(0, length), identity), /file bound|file length/u);
  }
  assert.throws(() => checkCanonicalBytes(Buffer.concat([bytes, Buffer.from([0])]), identity), /file length/u);
  assert.throws(() => checkCanonicalBytes(Buffer.alloc(bytes.length), identity), /file identity/u);
  const wrongWire = Buffer.from(bytes); wrongWire[8] = 18;
  assert.throws(() => checkCanonicalBytes(wrongWire, identity), /file identity/u);
});
test("existing file-check route binds bytes before checking its synthetic result fixtures", () => {
  // Real retained bytes plus deliberately synthetic schema/oracle controls.
  // This is route coverage, not a new source-produced lesson or CPU observation.
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "fe2o3-lab-byte-binding-"));
  try {
    fs.mkdirSync(path.join(root, "cases"));
    const report = inspection(); report.canonical = retainedIdentity();
    fs.writeFileSync(path.join(root, "original-inspection.json"), JSON.stringify(report), { flag: "wx" });
    fs.writeFileSync(path.join(root, "original.kir"), retainedBytes(), { flag: "wx" });
    for (let index = 0; index < CASES.length; index++) {
      fs.writeFileSync(path.join(root, "cases", "case-" + (index + 1) + ".json"),
        JSON.stringify(makeRequest(index)), { flag: "wx" });
      const result = output("original", index);
      result.kir = { sha256: report.canonical.sha256, canonical_bytes: report.canonical.bytes };
      fs.writeFileSync(path.join(root, "original-case-" + (index + 1) + ".json"),
        JSON.stringify(result), { flag: "wx" });
    }
    assert.deepEqual(checkFiles("original", root).words, CASES.map((_value, index) => expectedWord("original", index)));
    // Missing results cannot mask the earlier byte-identity refusal.
    fs.unlinkSync(path.join(root, "original-case-1.json"));
    fs.writeFileSync(path.join(root, "original.kir"), retainedBytes(1));
    assert.throws(() => checkFiles("original", root), /canonical file identity/u);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
