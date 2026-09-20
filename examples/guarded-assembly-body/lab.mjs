#!/usr/bin/env node
// Tutorial request/oracle helper only. No compiler, debugger, subprocess,
// network, KIR construction, production admission or hardware action.
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CASES, makeRequest as oneWaveRequest, checkInspection,
  directory, readBounded, json } from "../public-authoring-inspector/lab.mjs";

export const LENGTHS = Object.freeze([0, 1, 63, 64, 65, 127, 128, 129]);
export const CASE_COUNT = 96;
export const REPRESENTATIVE_CASE = 86; // case-87: (19,23,42), length/grid 64.
export const LIMITS = Object.freeze({ request: 4096, inspection: 8192,
  result: 65536, kir: 65536, total: 8 * 1024 * 1024 });
function natural(value, max) {
  assert(Number.isSafeInteger(value) && value >= 0 && value <= max, "exact bounded unsigned integer");
}
function exact(value, keys) {
  assert(value !== null && typeof value === "object" && !Array.isArray(value), "object required");
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), "exact field roster");
}
function same(actual, expected, label) {
  // Parsed JSON may have null prototypes. Preserve all values/fields/lengths;
  // large bigint wire integers cannot be silently coerced through this check.
  assert.deepEqual(JSON.parse(JSON.stringify(actual)), JSON.parse(JSON.stringify(expected)), label);
}
function digest(value) {
  assert(typeof value === "string" && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value), "nonzero SHA-256 shape");
}
export function caseSpec(index) {
  natural(index, CASE_COUNT - 1);
  const input = Math.floor(index / 16), length = LENGTHS[Math.floor(index % 16 / 2)], extra = index % 2;
  const grid = Math.max(64, Math.ceil(length / 64) * 64) + 64 * extra;
  return { index, id: "case-" + String(index + 1).padStart(2, "0"), input, length, grid, extra };
}
export function makeRequest(index) {
  const { input, length, grid } = caseSpec(index), bytes = 8 + 4 * grid;
  const request = oneWaveRequest(input);
  request.grid = [grid, 1, 1];
  request.arguments[0].elements = length;
  request.shared_buffers[0].bytes = "0x" + "a5".repeat(bytes);
  request.shared_buffers[0].initialized = "0x" + "00".repeat(Math.ceil(bytes / 8));
  return request;
}
export function expectedWord(input) {
  natural(input, CASES.length - 1);
  const [a, b, mask] = CASES[input].map(BigInt);
  // Independent bit-selection algebra, not the authored XOR/AND/XOR sequence.
  return Number(BigInt.asUintN(32, (a & mask) | (b & ~mask)));
}
function expectedBuffer(index) {
  const { input, length, grid } = caseSpec(index), bytes = Buffer.alloc(8 + 4 * grid, 0xa5);
  const initialized = Buffer.alloc(Math.ceil(bytes.length / 8), 0);
  for (let element = 0; element < length; element++) bytes.writeUInt32LE(expectedWord(input), 4 + 4 * element);
  for (let byte = 4; byte < 4 + 4 * length; byte++) initialized[byte >> 3] |= 1 << (byte & 7);
  return { element: "u32", access: "read_write", alignment: 4,
    bytes: "0x" + bytes.toString("hex"), initialized: "0x" + initialized.toString("hex") };
}
export function checkBodyInspection(report) {
  checkInspection("original", report);
  assert.equal(report.kernel, "ordered_u32_program");
  assert.equal(report.function, "ordered_u32_program");
  exact(report.canonical, ["wire_version", "sha256", "bytes"]);
  // This fixture has no leading identity instruction, unlike the older lab.
  // Report shape is observational, not verification of the complete KIR graph.
  same(report.coordinate, { function_ordinal: 0, block_ordinal: 0, operation_ordinal: 0 }, "first operation is the program");
  exact(report.inspection_counts, ["blocks", "operations", "ssa_definitions", "capability_entries", "name_bytes"]);
  assert.equal(report.inspection_counts.blocks, 7);
  assert.equal(report.inspection_counts.operations, 8);
  for (const key of ["ssa_definitions", "capability_entries", "name_bytes"]) natural(report.inspection_counts[key], 65536);
  // NoMemory refers to the assembly unit, not this complete storing kernel.
  return report;
}
export function checkResult(index, request, result, inspection) {
  const spec = caseSpec(index);
  checkBodyInspection(inspection);
  same(request, makeRequest(index), "exact independent request, including every initial byte/bit");
  exact(result, ["schema", "status", "authority", "simulated", "hardware_observed", "hardware_validation",
    "performance_prediction", "target_profile", "kir", "counts", "schedule", "conflict_assessment", "arguments", "shared_buffers"]);
  assert.equal(result.schema, "fe2o3-simulation-result-v1");
  assert.equal(result.status, "ok");
  assert.equal(result.authority, "observation_only");
  assert.equal(result.simulated, true);
  for (const key of ["hardware_observed", "hardware_validation", "performance_prediction"]) assert.equal(result[key], false, key);
  same(result.target_profile, { identity: "amdgpu_64_little_endian_v1", index_bits: 64,
    max_workgroup_invocations: 1024 }, "CPU target profile");
  exact(result.kir, ["sha256", "canonical_bytes"]);
  assert.equal(result.kir.sha256, inspection.canonical.sha256, "selected canonical inspection identity");
  assert.equal(result.kir.canonical_bytes, inspection.canonical.bytes, "selected canonical byte count");
  exact(result.counts, ["arguments", "shared_buffers", "invocations_executed", "workgroups_visited",
    "scheduled_slots_visited", "steps_executed", "events_emitted"]);
  for (const [key, value] of Object.entries({ arguments: 4, shared_buffers: 1,
    invocations_executed: spec.grid, workgroups_visited: spec.grid / 64,
    scheduled_slots_visited: spec.grid, events_emitted: 0 })) assert.equal(result.counts[key], value, key);
  natural(result.counts.steps_executed, 1000000);
  exact(result.schedule, ["identity", "transcript_sha256", "coverage"]);
  assert.equal(result.schedule.identity, "workgroup_major_local_zyx_cooperative_v1");
  digest(result.schedule.transcript_sha256);
  same(result.schedule.coverage, { decisions: spec.grid, workgroups: spec.grid / 64,
    barrier_releases: 0, complete: true }, "complete selected CPU schedule");
  same(result.conflict_assessment, { status: "no_conflicts_observed" }, "selected run's conflict observation only");
  same(result.arguments, request.arguments, "all copied arguments and scalar inputs");
  assert(Array.isArray(result.shared_buffers) && result.shared_buffers.length === 1);
  exact(result.shared_buffers[0], ["id", "buffer"]);
  assert.equal(result.shared_buffers[0].id, 1);
  same(result.shared_buffers[0].buffer, expectedBuffer(index), "all output bytes, initialization bits, inactive tail and both guards");
  return { ...spec, expected_word: expectedWord(spec.input), output_words: spec.length,
    checked_backing_bytes: 8 + 4 * spec.grid, unchanged_bytes: 8 + 4 * (spec.grid - spec.length) };
}
export function expectedSummary() {
  const cases = Array.from({ length: CASE_COUNT }, (_, index) => caseSpec(index));
  return { cases: CASE_COUNT, scalar_triples: CASES.length, lengths: [...LENGTHS], launches_per_length: 2,
    output_words: cases.reduce((n, c) => n + c.length, 0),
    checked_backing_bytes: cases.reduce((n, c) => n + 8 + 4 * c.grid, 0),
    unchanged_bytes: cases.reduce((n, c) => n + 8 + 4 * (c.grid - c.length), 0),
    invocations: cases.reduce((n, c) => n + c.grid, 0),
    source_authentication: false, native_functional_execution: false, hardware_observed: false };
}
export function prepare(destination) {
  assert(typeof destination === "string" && Buffer.byteLength(destination) <= 4096 &&
    path.isAbsolute(destination) && path.resolve(destination) === destination &&
    !/[\x00-\x1f\x7f]/u.test(destination), "canonical absolute path");
  directory(path.dirname(destination));
  fs.mkdirSync(destination, { mode: 0o700 }); // Fresh child only; failures remain.
  for (let index = 0; index < CASE_COUNT; index++) {
    const text = JSON.stringify(makeRequest(index)) + "\n";
    assert(Buffer.byteLength(text) <= LIMITS.request);
    fs.writeFileSync(path.join(destination, caseSpec(index).id + "-request.json"), text, { flag: "wx", mode: 0o600 });
  }
}
export function checkFiles(root) {
  directory(root);
  // Exactly 194 bounded reads, sequentially: this maximum precharges every
  // input against the aggregate budget, even when each file uses its full cap.
  assert(LIMITS.kir + LIMITS.inspection + CASE_COUNT * (LIMITS.request + LIMITS.result) <= LIMITS.total);
  const inspection = checkBodyInspection(json(path.join(root, "inspection.json"), LIMITS.inspection));
  const kir = readBounded(path.join(root, "source-body.kir"), LIMITS.kir);
  assert.equal(kir.length, inspection.canonical.bytes, "caller-selected KIR length only");
  const rawKirSha256 = crypto.createHash("sha256").update(kir).digest("hex");
  for (let index = 0; index < CASE_COUNT; index++) {
    const id = caseSpec(index).id;
    checkResult(index, json(path.join(root, id + "-request.json"), LIMITS.request),
      json(path.join(root, id + "-result.json"), LIMITS.result), inspection);
  }
  return { summary: expectedSummary(), canonical_identity: inspection.canonical.sha256,
    raw_kir_sha256: rawKirSha256, raw_kir_bytes: kir.length };
}
export function main(args) {
  assert.equal(process.platform, "linux", "this reproduction profile is Linux");
  assert(Number(process.versions.node.split(".")[0]) >= 22, "Node.js 22 or newer");
  if (args.length === 2 && args[0] === "prepare") {
    prepare(args[1]);
    console.log("Created 96 bounded simulation requests. No compiler or simulator was run.");
    return;
  }
  if (args.length === 2 && args[0] === "check") {
    const checked = checkFiles(args[1]), s = checked.summary;
    console.log(`${s.cases} local CPU results match independent arithmetic: ${s.output_words} output words, ${s.checked_backing_bytes} backing bytes, ${s.unchanged_bytes} unchanged bytes and exact initialization; ${s.invocations} invocations.`);
    console.log("Typed canonical identity: " + checked.canonical_identity);
    console.log("Caller-selected raw KIR SHA-256: " + checked.raw_kir_sha256 + " (" + checked.raw_kir_bytes + " bytes).");
    console.log("These are different identity domains. Local files do not authenticate source, producers, simulator input custody, native behavior or hardware execution.");
    return;
  }
  throw new Error("usage: lab.mjs prepare NEW_ABSOLUTE_RUN | check ABSOLUTE_RUN");
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); }
  catch (error) {
    console.error("Guarded-body tutorial check refused: " + String(error instanceof Error ? error.message : error).slice(0, 768));
    process.exitCode = 1;
  }
}
