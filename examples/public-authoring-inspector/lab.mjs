#!/usr/bin/env node
// Tutorial input/oracle helper only. No compiler, debugger, subprocess, network,
// source authentication, production admission or hardware action.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseProgramJson } from "../../src/content/ordered-program-observation.mjs";

export const CASES = Object.freeze([
  [0, 0, 0], [0xffff_ffff, 0, 1], [0xffff_ffff, 1, 2],
  [0x8000_0000, 0, 0x8000_0000], [0xaaaa_5555, 0x5555_aaaa, 19],
  [19, 23, 42],
].map(Object.freeze));
export const LIMITS = Object.freeze({ request: 4096, inspection: 8192, result: 65536, kir: 65536 });
const flags = ["source_authentication", "source_map_available", "physical_register_values_available",
  "instruction_microsteps_available", "register_lifetime_or_final_allocation_proof",
  "proof_authority", "artifact_authority", "production_resume_authority", "hardware_execution", "pure_or_movable"];
const descriptorSets = { original: [133, 307, 413], edited: [132, 307, 413] };
function variantName(value) {
  assert(value === "original" || value === "edited", "variant must be original or edited");
  return value;
}
function digest(value) {
  assert(typeof value === "string" && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value), "nonzero lowercase SHA-256 shape");
}
function natural(value, max = Number.MAX_SAFE_INTEGER) {
  assert(Number.isSafeInteger(value) && value >= 0 && value <= max, "exact bounded unsigned integer");
}
function row(value) { assert(value && typeof value === "object" && !Array.isArray(value), "object required"); return value; }
function exact(value, keys) {
  row(value);
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), "exact field roster");
}
function same(actual, expected, message) {
  // Both inputs are bounded parsed JSON. Ignore null-vs-default object prototypes,
  // not values, unknown fields, array length or numeric representations.
  assert.equal(JSON.stringify(actual), JSON.stringify(expected), message);
}
export function makeRequest(index) {
  natural(index, CASES.length - 1);
  return {
    schema: "fe2o3-simulation-request-v1", kernel: "ordered_u32_program",
    grid: [64, 1, 1], workgroup: [64, 1, 1],
    arguments: [
      { kind: "buffer_view", backing: 1, element: "u32", access: "read_write",
        alignment: 4, byte_offset: 4, elements: 64 },
      ...CASES[index].map(value => ({ kind: "scalar", type: "u32", bits: "0x" + value.toString(16).padStart(8, "0") })),
    ],
    shared_buffers: [{ id: 1, element: "u32", access: "read_write", alignment: 4,
      bytes: "0x" + "a5".repeat(264), initialized: "0x" + "00".repeat(33) }],
  };
}
export function expectedWord(variant, index) {
  variantName(variant); natural(index, CASES.length - 1);
  const [a, b, mask] = CASES[index].map(BigInt);
  // Independent algebra, not the compiler's interpreter or decoded descriptors.
  return Number(BigInt.asUintN(32, b ^ ((variant === "original" ? a ^ b : a | b) & mask)));
}
export function checkInspection(variant, report) {
  variantName(variant); row(report);
  assert.equal(report.kind, "diagnostic_ordered_program_inspection_example");
  assert.equal(report.authority, "observation_only");
  assert.equal(report.canonical.wire_version, 17);
  digest(report.canonical.sha256); natural(report.canonical.bytes, LIMITS.kir);
  assert(report.canonical.bytes > 0);
  assert.equal(report.declared_target, "gfx942:xnack-");
  assert.equal(report.declared_wave_width, 64);
  assert.equal(report.profile, "closed_u32_program_e32_v1");
  assert.equal(report.memory_effect, "NoMemory");
  assert.equal(report.ordered_region_effect, true);
  assert.equal(report.logical_observation_granularity, "whole_program_before_after");
  assert.equal(report.cpu_preflight_passed, true);
  for (const flag of flags) assert.equal(report[flag], false, flag + " is unavailable/unauthorized");
  same(report.register_plan, { scratch: 32, output: 33, inputs: [34, 35, 36], vgpr_high_water: 37 }, "exact register plan");
  assert.equal(report.declared_program.count, 3);
  same(report.declared_program.descriptors, [...descriptorSets[variant], ...Array(13).fill(0)], "active descriptors and zero padding");
  same(report.declared_instruction_steps, [
    { instruction: variant === "original" ? "v_xor_b32_e32" : "v_or_b32_e32", output: 32, inputs: [34, 35] },
    { instruction: "v_and_b32_e32", output: 32, inputs: [32, 36] },
    { instruction: "v_xor_b32_e32", output: 33, inputs: [35, 32] },
  ], "exact declared instructions, not native instruction observation");
  exact(report.coordinate, ["function_ordinal", "block_ordinal", "operation_ordinal"]);
  for (const value of Object.values(report.coordinate)) natural(value, 4096);
  natural(report.raw_block_id, 0xffff_ffff);
  assert(Array.isArray(report.input_value_ids) && report.input_value_ids.length === 3);
  for (const value of report.input_value_ids) natural(value, 0xffff_ffff);
  natural(report.result_value_id, 0xffff_ffff);
  assert.equal(new Set([...report.input_value_ids, report.result_value_id]).size, 4);
  exact(report.declared_source_ids, ["frontend_unit", "function", "contract", "statement"]);
  for (const value of Object.values(report.declared_source_ids)) digest(value);
  return report;
}
export function checkResult(variant, index, request, result, inspection) {
  checkInspection(variant, inspection);
  same(request, makeRequest(index), "request must match this independent input case, including guards");
  row(result);
  assert.equal(result.schema, "fe2o3-simulation-result-v1");
  assert.equal(result.status, "ok"); assert.equal(result.authority, "observation_only");
  assert.equal(result.simulated, true);
  for (const flag of ["hardware_observed", "hardware_validation", "performance_prediction"]) assert.equal(result[flag], false, flag);
  assert.equal(result.kir.sha256, inspection.canonical.sha256, "result belongs to selected canonical inspection");
  assert.equal(result.kir.canonical_bytes, inspection.canonical.bytes);
  for (const [key, value] of Object.entries({ arguments: 4, shared_buffers: 1, invocations_executed: 64,
    workgroups_visited: 1, scheduled_slots_visited: 64 })) assert.equal(result.counts[key], value, key);
  same(result.arguments, request.arguments, "all copied arguments, scalar inputs and buffer view");
  assert(Array.isArray(result.shared_buffers) && result.shared_buffers.length === 1);
  exact(result.shared_buffers[0], ["id", "buffer"]);
  assert.equal(result.shared_buffers[0].id, 1);
  const expected = Buffer.alloc(264, 0xa5);
  for (let lane = 0; lane < 64; lane++) expected.writeUInt32LE(expectedWord(variant, index), 4 + lane * 4);
  same(result.shared_buffers[0].buffer, { element: "u32", access: "read_write", alignment: 4,
    bytes: "0x" + expected.toString("hex"), initialized: "0xf0" + "ff".repeat(31) + "0f" },
  "all 64 output words, eight unchanged guard bytes and exact initialization bits");
  return expectedWord(variant, index);
}
function absolute(value) {
  assert(typeof value === "string" && Buffer.byteLength(value) <= 4096 &&
    path.isAbsolute(value) && path.resolve(value) === value && !/[\x00-\x1f\x7f]/u.test(value), "canonical absolute path");
  return value;
}
export function directory(value) {
  absolute(value);
  assert.equal(fs.realpathSync(value), value, "directory may not traverse a symlink");
  assert(fs.lstatSync(value).isDirectory(), "directory required");
  return value;
}
export function readBounded(file, limit) {
  absolute(file); directory(path.dirname(file));
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
  try {
    const before = fs.fstatSync(fd, { bigint: true });
    assert(before.isFile() && before.size > 0n && before.size <= BigInt(limit), "nonempty bounded regular file");
    const bytes = Buffer.alloc(limit + 1);
    let used = 0;
    while (used <= limit) {
      const count = fs.readSync(fd, bytes, used, bytes.length - used, used);
      if (!count) break;
      used += count;
    }
    assert(used <= limit && BigInt(used) === before.size, "file grew/shrank during bounded read");
    const after = fs.fstatSync(fd, { bigint: true });
    for (const key of ["dev", "ino", "size", "mtimeNs", "ctimeNs"]) assert.equal(after[key], before[key], "input changed");
    return bytes.subarray(0, used);
  } finally { fs.closeSync(fd); }
}
export function json(file, limit) {
  const bytes = readBounded(file, limit);
  assert(!(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf), "no BOM");
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  return parseProgramJson(text, limit);
}
function prepare(destination) {
  absolute(destination); directory(path.dirname(destination));
  fs.mkdirSync(destination, { mode: 0o700 }); // Fresh child only; failures remain.
  for (let index = 0; index < CASES.length; index++) {
    const text = JSON.stringify(makeRequest(index)) + "\n";
    assert(Buffer.byteLength(text) <= LIMITS.request);
    fs.writeFileSync(path.join(destination, "case-" + (index + 1) + ".json"), text, { flag: "wx", mode: 0o600 });
  }
  console.log("Created six bounded simulation requests. No compiler or simulator was run.");
}
function checkFiles(variant, root) {
  variantName(variant); directory(root); directory(path.join(root, "cases"));
  const inspection = checkInspection(variant, json(path.join(root, variant + "-inspection.json"), LIMITS.inspection));
  const kir = readBounded(path.join(root, variant + ".kir"), LIMITS.kir);
  assert.equal(kir.length, inspection.canonical.bytes, "canonical file length");
  // Do not equate file SHA-256 with the compiler's canonical identity domain.
  const words = CASES.map((_inputs, index) => checkResult(variant, index,
    json(path.join(root, "cases", "case-" + (index + 1) + ".json"), LIMITS.request),
    json(path.join(root, variant + "-case-" + (index + 1) + ".json"), LIMITS.result), inspection));
  return { inspection, words };
}
export function main(args) {
  assert.equal(process.platform, "linux", "this reproduction profile is Linux");
  assert(Number(process.versions.node.split(".")[0]) >= 22, "Node.js 22 or newer");
  if (args[0] === "prepare" && args.length === 2) { prepare(args[1]); return; }
  if (args[0] === "check" && args.length === 3) {
    const result = checkFiles(args[1], args[2]);
    console.log(args[1] + ": six local CPU results match independent arithmetic, 384 words, 48 guard bytes and exact initialization.");
    console.log("Words by case: " + result.words.join(", ") + ". Caller-selected files are not source/producer/GPU authentication.");
    return;
  }
  if (args[0] === "compare" && args.length === 2) {
    const original = checkFiles("original", args[1]), edited = checkFiles("edited", args[1]);
    assert.notEqual(original.inspection.canonical.sha256, edited.inspection.canonical.sha256, "edited operation needs fresh canonical identity");
    assert.equal(original.words[5], 23); assert.equal(edited.words[5], 21);
    console.log("Original and edited results checked separately; case 6 changes 23 -> 21. Different digests do not prove source custody or production re-admission.");
    return;
  }
  if (args[0] === "ids" && args.length === 3) {
    const variant = variantName(args[1]), root = directory(args[2]);
    const report = checkInspection(variant, json(path.join(root, variant + "-inspection.json"), LIMITS.inspection));
    const ids = report.declared_source_ids;
    console.log([ids.frontend_unit, ids.function, ids.contract, ids.statement].join(","));
    return;
  }
  throw new Error("usage: lab.mjs prepare NEW_ABSOLUTE_CASES_DIR | check original|edited ABSOLUTE_RUN | compare ABSOLUTE_RUN | ids original|edited ABSOLUTE_RUN");
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); }
  catch (error) {
    console.error("Tutorial check refused: " + String(error instanceof Error ? error.message : error).slice(0, 768));
    process.exitCode = 1;
  }
}
