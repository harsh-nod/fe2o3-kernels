import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { closeSync, constants, fstatSync, openSync, readSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const maxBytes = 256 * 1024;

export function readBounded(path) {
  const fd = openSync(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
  try {
    const stat = fstatSync(fd);
    assert(stat.isFile() && stat.size <= maxBytes, "regular bounded evidence file required");
    const bytes = Buffer.alloc(maxBytes + 1);
    let count = 0;
    while (count < bytes.length) {
      const read = readSync(fd, bytes, count, bytes.length - count, null);
      if (read === 0) break;
      count += read;
    }
    assert(count <= maxBytes, "evidence grew beyond its bound");
    return bytes.subarray(0, count);
  } finally {
    closeSync(fd);
  }
}

function sha(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function decode(bytes) { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
function transcript(bytes) {
  assert(bytes.length <= maxBytes, "transcript exceeds byte bound");
  const text = decode(bytes);
  assert(text.endsWith("\n"), "transcript must preserve its final newline");
  const lines = text.slice(0, -1).split("\n");
  assert(lines.length > 0 && lines.length <= 1024, "transcript exceeds record bound");
  const records = new Map();
  for (const line of lines) {
    const record = JSON.parse(line);
    assert(record && typeof record === "object" && !Array.isArray(record));
    assert(Number.isSafeInteger(record.request_id) && record.request_id > 0);
    assert(!records.has(record.request_id), "duplicate request identity");
    records.set(record.request_id, record);
  }
  return records;
}

/** Integrity/projection checks only: these bytes do not attest their producer. */
export function validateResourceQueryObservation(fixture, requestBytes, responseBytes) {
  const evidence = fixture.evidence;
  assert.equal(evidence.fixture_kind, "actual_retained_source_produced_cpu_responses");
  assert.equal(evidence.schema, "fe2o3-resource-query-source-smoke-v1");
  assert.equal(evidence.hardware_observed, false);
  assert.equal(evidence.source_edited, false);
  assert.equal(evidence.curriculum_publication, "not_performed");
  assert.equal(evidence.physical_registers, "not_represented");
  assert.equal(evidence.allocation_lifetime, "not_represented");
  assert.equal(sha(requestBytes), evidence.debug_requests_sha256);
  assert.equal(sha(responseBytes), evidence.debug_responses_sha256);
  assert.equal(fixture.context.captureIdentity, evidence.debug_responses_sha256);
  assert.equal(fixture.context.variantIdentity, evidence.bundle_identity);
  assert.equal(fixture.context.target, "gfx942:xnack-");
  const requests = transcript(requestBytes);
  const responses = transcript(responseBytes);
  assert.equal(requests.size, responses.size, "incomplete request/response transcript");
  for (const id of responses.keys()) assert(requests.has(id), "unpaired response");
  for (const [operation, request, response] of [
    ["query_allocations", fixture.allocationRequest, fixture.allocationResponse],
    ["query_memory_accesses", fixture.accessRequest, fixture.accessResponse],
  ]) {
    assert.deepEqual(requests.get(request.request_id), request, "projected request changed");
    assert.equal(request.schema, "fe2o3-debug-resource-request-v1");
    assert.equal(response.schema, "fe2o3-debug-resource-response-v1");
    assert.equal(request.operation, operation);
    assert.equal(response.operation, operation);
    assert.equal(response.status, "ok");
    assert.equal(response.request_id, request.request_id, "projected request/response pair changed");
    assert.equal(request.expected_revision, fixture.expectedSnapshot.cursor.state_revision);
    assert.deepEqual(request.expected_snapshot, fixture.expectedSnapshot);
  }
  for (const response of [fixture.independentAnchorResponse, fixture.allocationResponse,
    fixture.accessResponse, fixture.memoryResponse]) {
    assert.deepEqual(responses.get(response.request_id), response, "projected response changed");
    assert.equal(response.session.simulated, true);
    assert.equal(response.session.hardware_observed, false);
    assert.equal(response.session.performance_prediction, false);
    assert.deepEqual(response.session.cursor, fixture.expectedSnapshot.cursor);
  }
  assert.deepEqual(fixture.independentAnchorResponse.result.snapshot.snapshot.anchor,
    fixture.expectedSnapshot, "independent control anchor changed");
  assert.deepEqual(fixture.allocationResponse.snapshot, fixture.expectedSnapshot);
  assert.deepEqual(fixture.accessResponse.snapshot, fixture.expectedSnapshot);
  assert.deepEqual(fixture.memoryResponse.result.snapshot, fixture.expectedSnapshot);
  const memory = fixture.memoryResponse;
  const memoryRequest = requests.get(memory.request_id);
  assert.equal(memoryRequest.schema, "fe2o3-debug-request-v1");
  assert.equal(memory.schema, "fe2o3-debug-response-v1");
  assert.equal(memoryRequest.operation, "read_memory");
  assert.equal(memory.operation, "read_memory");
  assert.equal(memory.status, "ok");
  assert.equal(memoryRequest.expected_revision, fixture.expectedSnapshot.cursor.state_revision);
  assert.deepEqual(memoryRequest.allocation, memory.result.memory.allocation);
  assert.equal(memoryRequest.byte_offset, memory.result.memory.byte_offset);
  assert.equal(memoryRequest.byte_len, memory.result.memory.requested_bytes);
  assert.equal(evidence.expected_u32, 469);
  return Object.freeze({ requests: requests.size, responses: responses.size,
    request_bytes: requestBytes.length, response_bytes: responseBytes.length,
    compiler_execution_authenticated: false, hardware_observed: false });
}

export function readRetainedResourceObservation() {
  return {
    fixture: JSON.parse(decode(readBounded(resolve(site, "examples/resource_query_v6.json")))),
    requests: readBounded(resolve(site, "examples/resource-query-v6/debug-requests.jsonl")),
    responses: readBounded(resolve(site, "examples/resource-query-v6/debug-responses.jsonl")),
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length, 2, "this read-only validator takes no arguments");
  const { fixture, requests, responses } = readRetainedResourceObservation();
  console.log("Validated retained resource observation:",
    validateResourceQueryObservation(fixture, requests, responses));
}
