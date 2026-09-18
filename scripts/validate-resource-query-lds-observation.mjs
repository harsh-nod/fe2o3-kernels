import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { closeSync, constants, fstatSync, openSync, readSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const MAX_LDS_FIXTURE_BYTES = 512 * 1024;
export const MAX_LDS_TRANSCRIPT_BYTES = 4 * 1024 * 1024;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const decode = (bytes) => new TextDecoder("utf-8", { fatal: true }).decode(bytes);
const ids = ["pre_write", "first_write", "reduction", "final"];

function digest(value) {
  assert(typeof value === "string" && /^[0-9a-f]{64}$/.test(value) && !/^0+$/.test(value),
    "exact nonzero lowercase SHA-256 required");
  return value;
}

function parsed(text) {
  const value = JSON.parse(text), pending = [{ value, depth: 0 }];
  let nodes = 0;
  while (pending.length) {
    const item = pending.pop();
    assert(++nodes <= 65536 && item.depth <= 32, "retained JSON structure exceeds its bound");
    if (item.value !== null && typeof item.value === "object") {
      const children = Object.values(item.value);
      assert(children.length <= 256, "retained JSON collection exceeds its bound");
      for (const child of children) pending.push({ value: child, depth: item.depth + 1 });
    }
  }
  return value;
}

export function readBoundedLdsFile(path, maximum) {
  assert([MAX_LDS_FIXTURE_BYTES, MAX_LDS_TRANSCRIPT_BYTES].includes(maximum));
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const stat = fstatSync(fd);
    assert(stat.isFile() && stat.size > 0 && stat.size <= maximum, "regular bounded evidence file required");
    const bytes = Buffer.alloc(stat.size + 1);
    let count = 0;
    while (count < bytes.length) {
      const read = readSync(fd, bytes, count, bytes.length - count, null);
      if (read === 0) break;
      count += read;
    }
    assert.equal(count, stat.size, "evidence size changed during reading");
    return bytes.subarray(0, count);
  } finally { closeSync(fd); }
}

function transcript(bytes) {
  assert(bytes.length > 0 && bytes.length <= MAX_LDS_TRANSCRIPT_BYTES, "transcript byte cap exceeded");
  const text = decode(bytes);
  assert(text.endsWith("\n"), "transcript lost its final newline");
  const lines = text.slice(0, -1).split("\n");
  assert(lines.length > 0 && lines.length <= 1024, "transcript record cap exceeded");
  const records = new Map();
  let previous = 0;
  for (const line of lines) {
    assert(Buffer.byteLength(line) <= 1024 * 1024, "transcript line cap exceeded");
    const row = parsed(line);
    assert(Number.isSafeInteger(row.request_id) && row.request_id > previous, "duplicate or out-of-order transcript request ID");
    records.set(row.request_id, row);
    previous = row.request_id;
  }
  return records;
}

function session(response, anchor) {
  assert.equal(response.status, "ok");
  assert.equal(response.session.backend, "cpu_kir_simulator");
  assert.equal(response.session.execution_kind, "cpu_kir_simulation");
  assert.equal(response.session.state, "stopped");
  assert.equal(response.session.simulated, true);
  assert.equal(response.session.hardware_observed, false);
  assert.equal(response.session.performance_prediction, false);
  assert.equal(response.session.configuration_identity, anchor.cursor.configuration_identity);
  assert.equal(response.session.revision, anchor.cursor.state_revision);
  assert.deepEqual(response.session.cursor, anchor.cursor);
}

/** Exact retained-byte and transcript projection joins; no producer authentication,
 * compilation, simulation, source mutation, or hardware work is performed here. */
export function validateResourceLdsObservation(fixtureBytes, requestBytes, responseBytes, expectedSha256) {
  assert(fixtureBytes.length > 0 && fixtureBytes.length <= MAX_LDS_FIXTURE_BYTES, "fixture byte cap exceeded");
  assert(requestBytes.length > 0 && requestBytes.length <= MAX_LDS_TRANSCRIPT_BYTES &&
    responseBytes.length > 0 && responseBytes.length <= MAX_LDS_TRANSCRIPT_BYTES, "transcript byte cap exceeded");
  digest(expectedSha256);
  assert.equal(sha(fixtureBytes), expectedSha256, "fixture differs from its independent display pin");
  const fixture = parsed(decode(fixtureBytes));
  assert.equal(fixture.schema, "fe2o3-retained-lds-resource-view-v1");
  assert(Buffer.byteLength(fixture.receipt.utf8) <= 16384);
  digest(fixture.receipt.sha256);
  assert.equal(sha(fixture.receipt.utf8), fixture.receipt.sha256, "receipt bytes changed");
  const receipt = parsed(fixture.receipt.utf8);
  for (const field of ["source_sha256", "bundle_sha256", "export_observation_sha256",
    "simulation_request_sha256", "simulation_stdout_sha256", "debug_requests_sha256", "debug_responses_sha256"]) digest(receipt[field]);
  assert.equal(receipt.schema, "fe2o3-lds-resource-query-source-smoke-v1");
  assert.equal(receipt.evidence_kind, "actual_v5_admission_and_cpu_simulation_observation");
  assert.equal(receipt.metadata_authority, "inert_cross_file_consistency_not_compiler_authentication");
  assert.equal(receipt.compiler_closure_attestation, "unavailable");
  assert.equal(receipt.source_path, "crates/rustc-codegen-fe2o3/tests/fixtures/production-ranked-bounds-device/src/lib.rs");
  assert.equal(receipt.allocation_generation, "producer_profile_zero_not_lifetime_evidence");
  for (const key of ["source_edited", "hardware_observed", "performance_prediction", "grants_production_resume", "grants_load_authority", "grants_launch_authority"]) assert.equal(receipt[key], false);
  for (const key of ["owning_scope", "lifetime", "physical_base", "physical_registers", "access_source_association"]) assert.equal(receipt[key], "not_represented");
  assert.deepEqual(receipt.workgroup, [64, 1, 1]);
  assert.equal(receipt.logical_wave_width, 32);
  assert.equal(receipt.expected_u32, 128);
  assert.equal(sha(requestBytes), receipt.debug_requests_sha256, "full request transcript changed");
  assert.equal(sha(responseBytes), receipt.debug_responses_sha256, "full response transcript changed");
  assert.equal(responseBytes.length, receipt.response_bytes);
  assert.deepEqual(fixture.context, {
    connectionId: "retained-lds-v5-r3", captureIdentity: receipt.debug_responses_sha256,
    target: "gfx942:xnack-", variantIdentity: receipt.bundle_sha256,
  });
  const requests = transcript(requestBytes), responses = transcript(responseBytes);
  assert.equal(requests.size, receipt.commands);
  assert.deepEqual([...requests.keys()], [...responses.keys()], "incomplete request/response transcript");
  assert(Array.isArray(fixture.checkpoints) && fixture.checkpoints.length === 4);
  assert.deepEqual(fixture.checkpoints.map((row) => row.id), ids);
  const selected = new Set();
  function pair(pair, operation, anchor, resource = false) {
    const { request, response } = pair;
    assert(!selected.has(request.request_id), "duplicate selected request");
    selected.add(request.request_id);
    assert.deepEqual(requests.get(request.request_id), request, "selected request differs from raw transcript");
    assert.deepEqual(responses.get(response.request_id), response, "selected response differs from raw transcript");
    assert.equal(request.request_id, response.request_id, "cross-paired request/response");
    assert.equal(request.operation, operation);
    assert.equal(response.operation, operation);
    assert.equal(request.schema, resource ? "fe2o3-debug-resource-request-v1" : "fe2o3-debug-request-v1");
    assert.equal(response.schema, resource ? "fe2o3-debug-resource-response-v1" : "fe2o3-debug-response-v1");
    session(response, anchor);
    if (operation === "step") {
      assert.equal(request.expected_revision + 1, anchor.cursor.state_revision);
      assert.equal(request.granularity, "operation");
      assert.equal(request.count, 1);
      assert(["forward", "reverse"].includes(request.direction));
      assert.equal(response.result.result, "control");
      assert.equal(response.result.snapshot.status, "captured");
      assert.deepEqual(response.result.stop, { reason: "step", outcome: "active", exact: true });
      assert.equal(response.result.events_advanced, 1);
      assert.deepEqual(response.result.snapshot.snapshot.stop, response.result.stop);
      assert.deepEqual(response.result.snapshot.snapshot.anchor, anchor, "independent full anchor changed");
    } else {
      assert.equal(request.expected_revision, anchor.cursor.state_revision);
      if (resource) {
        assert.deepEqual(request.expected_snapshot, anchor);
        assert.deepEqual(response.snapshot, anchor);
        assert.equal(response.physical_registers, "not_represented");
        assert(Number.isSafeInteger(request.page.max_items) && request.page.max_items >= 1 && request.page.max_items <= 256);
        assert(Number.isSafeInteger(request.page.max_scanned) && request.page.max_scanned >= 1 && request.page.max_scanned <= 256);
        assert(response.page.scanned <= request.page.max_scanned);
        const rows = operation === "query_allocations" ? response.result.allocations : response.result.accesses;
        assert(Array.isArray(rows) && rows.length <= request.page.max_items);
      } else assert.deepEqual(response.result.snapshot, anchor);
    }
  }
  for (const checkpoint of fixture.checkpoints) {
    const anchor = checkpoint.expectedSnapshot;
    assert.equal(anchor.scope.level, "lane");
    assert.equal(anchor.scope.wave_width, 32);
    assert.equal(anchor.scope.active_mask, 0xffffffff);
    assert.deepEqual(anchor.scope.workgroup, [0, 0, 0]);
    pair(checkpoint.control, "step", anchor);
    pair(checkpoint.inventory, "query_allocations", anchor, true);
    assert.equal(checkpoint.inventory.response.result.result, "allocations");
    for (const row of checkpoint.inventory.response.result.allocations) {
      for (const field of ["owning_scope", "lifetime", "physical_base"]) assert.equal(row[field], "not_represented");
    }
    assert(Array.isArray(checkpoint.memories) && checkpoint.memories.length >= 1 && checkpoint.memories.length <= 2);
    assert(Array.isArray(checkpoint.accessPages) && checkpoint.accessPages.length <= 2);
    for (const [kind, windows] of [["memory", checkpoint.memories], ["access", checkpoint.accessPages]]) {
      const spaces = new Set();
      for (const window of windows) {
        assert(["workgroup", "global"].includes(window.addressSpace) && !spaces.has(window.addressSpace), "duplicate or unknown address space");
        spaces.add(window.addressSpace);
        const allocation = receipt[window.addressSpace === "workgroup" ? "workgroup_allocation" : "global_allocation"];
        assert.equal(allocation.generation, 0);
        if (kind === "memory") {
          pair(window, "read_memory", anchor);
          assert.equal(window.response.result.result, "memory");
          const read = window.response.result.memory;
          assert.deepEqual(window.request.allocation, allocation);
          assert.deepEqual(read.allocation, allocation);
          assert.equal(window.request.byte_offset, read.byte_offset);
          assert.equal(window.request.byte_len, read.requested_bytes);
          assert.equal(read.returned_bytes, read.requested_bytes);
          assert.equal(read.availability.status, "captured");
          assert.equal(read.availability.truncated, false);
          assert.equal(read.availability.address_space, window.addressSpace);
          assert.equal(read.requested_bytes, window.addressSpace === "workgroup" ? 256 : 264);
          assert.equal(read.byte_offset, 0);
        } else {
          pair(window, "query_memory_accesses", anchor, true);
          assert.equal(window.response.result.result, "memory_accesses");
          assert.equal(window.request.filter.address_space, window.addressSpace);
          assert.deepEqual(window.request.filter.allocation, allocation);
          assert.deepEqual(window.request.filter.scope, { level: "workgroup", workgroup: [0, 0, 0] });
          for (const row of window.response.result.accesses) {
            assert.equal(row.address_space, window.addressSpace);
            assert.deepEqual(row.allocation, allocation);
            assert(row.occurrence.event_sequence <= anchor.cursor.event_sequence);
            for (const field of ["call_frame", "operation_occurrence", "source_association"]) assert.equal(row[field], "not_represented");
          }
        }
      }
    }
  }
  const memory = (id, space) => fixture.checkpoints.find((row) => row.id === id).memories.find((row) => row.addressSpace === space).response.result.memory.availability;
  assert.equal(memory("pre_write", "workgroup").initialized, "0x" + "00".repeat(32));
  assert.equal(memory("first_write", "workgroup").initialized, "0x0f" + "00".repeat(31));
  assert.equal(memory("first_write", "workgroup").bytes.slice(0, 10), "0x02000000");
  const tree = [128, 64, 32, 32, ...Array(4).fill(16), ...Array(8).fill(8), ...Array(16).fill(4), ...Array(32).fill(2)];
  const treeBytes = Buffer.alloc(256); tree.forEach((value, index) => treeBytes.writeUInt32LE(value, index * 4));
  assert.equal(memory("reduction", "workgroup").bytes, "0x" + treeBytes.toString("hex"));
  assert.equal(memory("reduction", "workgroup").initialized, "0x" + "ff".repeat(32));
  assert.equal(memory("final", "global").bytes, "0x" + "80000000".repeat(64) + "deadbeefcafebabe");
  assert.equal(memory("final", "global").initialized, "0x" + "ff".repeat(33));
  return Object.freeze({ requests: requests.size, responses: responses.size, selected_pairs: selected.size,
    checkpoints: fixture.checkpoints.length, fixture_bytes: fixtureBytes.length, request_bytes: requestBytes.length,
    response_bytes: responseBytes.length, compiler_execution_authenticated: false, hardware_observed: false });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length, 6, "usage: node validate-resource-query-lds-observation.mjs FIXTURE REQUESTS RESPONSES EXPECTED_SHA256");
  console.log("Validated retained LDS observation:", validateResourceLdsObservation(
    readBoundedLdsFile(resolve(process.argv[2]), MAX_LDS_FIXTURE_BYTES),
    readBoundedLdsFile(resolve(process.argv[3]), MAX_LDS_TRANSCRIPT_BYTES),
    readBoundedLdsFile(resolve(process.argv[4]), MAX_LDS_TRANSCRIPT_BYTES), process.argv[5],
  ));
}
