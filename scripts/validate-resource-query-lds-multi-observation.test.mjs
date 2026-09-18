import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { MAX_LDS_MULTI_FIXTURE_BYTES, MAX_LDS_MULTI_TRANSCRIPT_BYTES,
  readBoundedLdsMultiFile, validateResourceLdsMultiObservation } from "./validate-resource-query-lds-multi-observation.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url))), stem = join(root, "examples/source_lds_multi_workgroup_v1");
const fixtureBytes = readFileSync(stem + ".json"), requestBytes = readFileSync(stem + ".requests.jsonl"), responseBytes = readFileSync(stem + ".responses.jsonl");
const pin = "13165393fd04bb857f80886984b0e7a31262209cc2546d117d650cc2179fe441", sha = (value) => createHash("sha256").update(value).digest("hex");
const run = (fixture = fixtureBytes, requests = requestBytes, responses = responseBytes, expected = sha(fixture)) => validateResourceLdsMultiObservation(fixture, requests, responses, expected);

// Mutations, including rehashed raw lines, are negative controls only. They are
// never retained as captures or presented as successful source observations.
function mutation(change, syncSelected = false) {
  const fixture = JSON.parse(fixtureBytes); change(fixture);
  if (!syncSelected) return [Buffer.from(JSON.stringify(fixture)), requestBytes, responseBytes];
  const records = (bytes) => new Map(bytes.toString().trimEnd().split("\n").map((line) => { const row = JSON.parse(line); return [row.request_id, row]; }));
  const requests = records(requestBytes), responses = records(responseBytes);
  for (const checkpoint of fixture.checkpoints) for (const pair of [checkpoint.control, checkpoint.inventory, ...checkpoint.memories, ...checkpoint.unavailableWindows, ...checkpoint.accessPages]) {
    requests.set(pair.request.request_id, pair.request); responses.set(pair.response.request_id, pair.response);
  }
  const serialize = (records) => Buffer.from([...records.values()].map((row) => JSON.stringify(row) + "\n").join(""));
  const requestRaw = serialize(requests), responseRaw = serialize(responses), receipt = JSON.parse(fixture.receipt.utf8);
  receipt.debug_requests_sha256 = sha(requestRaw); receipt.debug_responses_sha256 = sha(responseRaw); receipt.response_bytes = responseRaw.length;
  fixture.receipt.utf8 = JSON.stringify(receipt); fixture.receipt.sha256 = sha(fixture.receipt.utf8); fixture.context.captureIdentity = receipt.debug_responses_sha256;
  return [Buffer.from(JSON.stringify(fixture)), requestRaw, responseRaw];
}
function receiptChange(field, value) {
  return mutation((fixture) => {
    const receipt = JSON.parse(fixture.receipt.utf8); receipt[field] = value;
    fixture.receipt.utf8 = JSON.stringify(receipt); fixture.receipt.sha256 = sha(fixture.receipt.utf8);
  });
}

test("actual independent raw/display validation retains 33 complete pairs and seven checkpoints", () => {
  assert.equal(sha(fixtureBytes), pin);
  assert.deepEqual(run(), { requests: 930, responses: 930, selected_pairs: 33, checkpoints: 7,
    fixture_bytes: 222854, request_bytes: 935119, response_bytes: 4162581,
    compiler_execution_authenticated: false, hardware_observed: false, lifecycle_authority: false });
  const fixture = JSON.parse(fixtureBytes);
  assert.equal(fixture.checkpoints[4].accessPages[0].request.filter.allocation.ordinal, 2);
  assert.deepEqual(fixture.checkpoints[4].inventory.response.result.allocations.map((row) => row.allocation.ordinal), [1, 3]);
  assert.equal(fixture.checkpoints[4].accessPages[1].response.result.accesses.length, 0);
  assert.equal(typeof fixture.checkpoints[4].accessPages[1].response.page.next_token, "string");
});

test("changed display pins, transcript bytes and selected whole records are refused", () => {
  assert.throws(() => run(fixtureBytes, requestBytes, responseBytes, "1".repeat(64)), /pin/u);
  assert.throws(() => run(fixtureBytes, Buffer.concat([requestBytes, Buffer.from("\n")]), responseBytes));
  assert.throws(() => run(fixtureBytes, requestBytes, responseBytes.subarray(0, -1)), /newline/u);
  for (const change of [
    (f) => { f.checkpoints[0].memories[0].response.result.memory.availability.bytes = "0x" + "00".repeat(256); },
    (f) => { f.checkpoints[4].accessPages[0].response = f.checkpoints[4].accessPages[1].response; },
    (f) => { f.checkpoints[0].inventory.request = f.checkpoints[4].accessPages[0].request; },
    (f) => { f.checkpoints[0].control.response.request_id = f.checkpoints[0].inventory.request.request_id; },
    (f) => { f.checkpoints[5].accessPages[0].response.result.accesses.splice(0, 1); },
  ]) assert.throws(() => run(...mutation(change)));
});

test("receipt digests, original receipt bytes and authority literals remain strict after rehashing", () => {
  for (const field of ["source_sha256", "bundle_sha256", "export_observation_sha256", "simulation_request_sha256", "simulation_stdout_sha256",
    "debug_requests_sha256", "debug_responses_sha256", "results_sha256", "script_sha256", "helper_sha256"]) {
    for (const value of ["not-a-sha", "0".repeat(64), "A".repeat(64)]) assert.throws(() => run(...receiptChange(field, value)), /SHA-256/u);
  }
  for (const field of ["simulator", "debugger"]) assert.throws(() => run(...mutation((f) => {
    const receipt = JSON.parse(f.receipt.utf8); receipt.executable_sha256[field] = "not-a-sha";
    f.receipt.utf8 = JSON.stringify(receipt); f.receipt.sha256 = sha(f.receipt.utf8);
  })), /SHA-256/u);
  for (const [field, value] of [["lifetime", "known"], ["owning_scope", "wg0"], ["hardware_observed", true], ["physical_reuse_observed", true],
    ["allocation_release_event_captured", true], ["source_helper_or_loop_qualification", true], ["compiler_closure_attestation", "authenticated"],
    ["logical_wave_width", 64], ["disk_reserve_bytes", "1"], ["unknown", true]]) assert.throws(() => run(...receiptChange(field, value)));
  assert.throws(() => run(...mutation((f) => { f.receipt.sha256 = "0".repeat(64); })), /SHA-256/u);
});

test("same-cursor restored revision and independent anchors cannot be substituted", () => {
  for (const change of [
    (f) => { f.checkpoints[3].expectedSnapshot.cursor.state_revision = 9; },
    (f) => { f.checkpoints[4].expectedSnapshot.scope.lane = 1; },
    (f) => { f.checkpoints[4].expectedSnapshot.site.source.location.byte_start++; },
    (f) => { f.checkpoints[4].inventory.response.session.configuration_identity = "2".repeat(64); },
    (f) => { f.checkpoints[3].control.request.direction = "forward"; },
    (f) => { f.checkpoints[4].inventory.request.expected_revision--; },
  ]) assert.throws(() => run(...mutation(change, true)));
});

test("independent semantics reject fabricated current memory, generations, canaries and unavailable bytes", () => {
  for (const change of [
      (f) => { f.checkpoints[0].inventory.response.result.allocations[1].allocation.generation = 1; },
      (f) => { f.checkpoints[1].inventory.request.address_space = "global"; },
      (f) => { f.checkpoints[1].inventory.request.page.token = "resource.1.1"; },
      (f) => { f.checkpoints[1].inventory.response.page.source_count = 2; },
    (f) => { f.checkpoints[1].unavailableWindows[0].response.result.memory.returned_bytes = 256; },
    (f) => { f.checkpoints[1].unavailableWindows[0].response.result.memory.availability = { status: "captured", address_space: "workgroup", bytes: "0x" + "00".repeat(256), initialized: "0x" + "00".repeat(32), truncated: false }; },
    (f) => { f.checkpoints[2].memories[0].response.result.memory.availability.initialized = "0x" + "ff".repeat(32); },
    (f) => { f.checkpoints[6].memories[0].response.result.memory.availability.bytes = "0x" + "80000000".repeat(128) + "00".repeat(8); },
    (f) => { f.checkpoints[0].memories[0].response.result.memory.availability.bytes = "0x" + "00".repeat(256); },
  ]) assert.throws(() => run(...mutation(change, true)));
});

test("historical scope/allocation and whole continuation page bindings reject reinterpretation", () => {
  for (const change of [
    (f) => { f.checkpoints[4].accessPages[0].request.filter.scope.workgroup[0] = 1; },
    (f) => { f.checkpoints[4].accessPages[0].request.filter.allocation.ordinal = 3; },
    (f) => { f.checkpoints[4].accessPages[0].response.result.accesses[0].occurrence.event_sequence = 99999; },
    (f) => { f.checkpoints[4].accessPages[0].response.result.accesses[0].range.byte_offset = "18446744073709551616"; },
    (f) => { f.checkpoints[4].accessPages[0].response.result.accesses[0].range.byte_offset = "00"; },
    (f) => { f.checkpoints[4].accessPages[0].request.page.max_scanned = 257; },
    (f) => { f.checkpoints[4].accessPages[0].response.physical_registers = "captured"; },
    (f) => { f.checkpoints[4].accessPages[0].response.page.next_token = "x".repeat(257); },
    (f) => { f.checkpoints[4].accessPages[0].response.result.accesses[0].source_association = "compiler_bound"; },
  ]) assert.throws(() => run(...mutation(change, true)));
});

test("fixture/transcript caps, Unicode, nesting, collections and duplicate IDs fail closed", () => {
  assert.throws(() => run(Buffer.alloc(MAX_LDS_MULTI_FIXTURE_BYTES + 1)), /fixture byte cap/u);
  assert.throws(() => run(fixtureBytes, Buffer.alloc(MAX_LDS_MULTI_TRANSCRIPT_BYTES + 1), responseBytes), /transcript byte cap/u);
  const invalid = Buffer.from([0xff]); assert.throws(() => run(invalid));
  const nested = Buffer.from("[".repeat(34) + "0" + "]".repeat(34)); assert.throws(() => run(nested), /structure/u);
  assert.throws(() => run(...mutation((f) => { f.checkpoints.push(f.checkpoints[0]); })));
  assert.throws(() => run(...mutation((f) => { f.checkpoints[1].control = f.checkpoints[0].control; })));
  const duplicate = Buffer.from(requestBytes.toString().replace(/^([^\n]+)\n([^\n]+)\n/u, "$1\n$1\n"));
  assert.throws(() => run(fixtureBytes, duplicate, responseBytes), /duplicate/u);
});

test("bounded regular-file reads reject symlinks, directories, oversize and nonblocking FIFO", () => {
  const directory = mkdtempSync(join(tmpdir(), "fe2o3-lds-multi-validator-"));
  try {
    const path = join(directory, "regular"); writeFileSync(path, "data");
    assert.equal(readBoundedLdsMultiFile(path, MAX_LDS_MULTI_FIXTURE_BYTES).toString(), "data");
    const link = join(directory, "symlink"); symlinkSync(path, link);
    assert.throws(() => readBoundedLdsMultiFile(link, MAX_LDS_MULTI_FIXTURE_BYTES), /ELOOP/u);
    assert.throws(() => readBoundedLdsMultiFile(directory, MAX_LDS_MULTI_FIXTURE_BYTES), /regular bounded/u);
    writeFileSync(path, Buffer.alloc(MAX_LDS_MULTI_FIXTURE_BYTES + 1));
    assert.throws(() => readBoundedLdsMultiFile(path, MAX_LDS_MULTI_FIXTURE_BYTES), /regular bounded/u);
    const fifo = join(directory, "fifo"), made = spawnSync("mkfifo", [fifo], { encoding: "utf8", timeout: 5000 });
    assert.equal(made.status, 0, made.stderr);
    const url = new URL("./validate-resource-query-lds-multi-observation.mjs", import.meta.url).href;
    const control = `import{readBoundedLdsMultiFile,MAX_LDS_MULTI_FIXTURE_BYTES}from${JSON.stringify(url)};try{readBoundedLdsMultiFile(process.argv[1],MAX_LDS_MULTI_FIXTURE_BYTES);process.exit(2)}catch(e){if(!String(e).includes("regular bounded"))throw e}`;
    const checked = spawnSync(process.execPath, ["--input-type=module", "-e", control, fifo], { encoding: "utf8", timeout: 1000, maxBuffer: 4096 });
    assert.equal(checked.error, undefined); assert.equal(checked.status, 0, checked.stderr);
  } finally { rmSync(directory, { recursive: true }); }
});
