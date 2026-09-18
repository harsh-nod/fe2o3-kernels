import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { MAX_LDS_FIXTURE_BYTES, MAX_LDS_TRANSCRIPT_BYTES, readBoundedLdsFile, validateResourceLdsObservation } from "./validate-resource-query-lds-observation.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const pin = "1d1ab41c25693745d233af08f856834d123f8abbb8888f418b1cf5db4a63b494";
const fixtureBytes = readBoundedLdsFile(new URL("../examples/source_lds_resource_v1.json", import.meta.url), MAX_LDS_FIXTURE_BYTES);
const requests = readBoundedLdsFile(new URL("../examples/source_lds_resource_v1.requests.jsonl", import.meta.url), MAX_LDS_TRANSCRIPT_BYTES);
const responses = readBoundedLdsFile(new URL("../examples/source_lds_resource_v1.responses.jsonl", import.meta.url), MAX_LDS_TRANSCRIPT_BYTES);
const fresh = () => JSON.parse(fixtureBytes.toString("utf8"));
function rejects(fixture, requestBytes = requests, responseBytes = responses) {
  const bytes = Buffer.from(JSON.stringify(fixture));
  assert.throws(() => validateResourceLdsObservation(bytes, requestBytes, responseBytes, sha(bytes)));
}

test("exact retained actual LDS capture joins all selected pairs against full transcripts", () => {
  assert.deepEqual(validateResourceLdsObservation(fixtureBytes, requests, responses, pin), {
    requests: 219, responses: 219, selected_pairs: 19, checkpoints: 4, fixture_bytes: 321691,
    request_bytes: 205776, response_bytes: 1280347, compiler_execution_authenticated: false, hardware_observed: false,
  });
});

test("independent envelope pin and unchanged full transcript bytes are mandatory", () => {
  assert.throws(() => validateResourceLdsObservation(fixtureBytes, requests, responses, "1".repeat(64)));
  assert.throws(() => validateResourceLdsObservation(fixtureBytes, Buffer.concat([requests, Buffer.from("\n")]), responses, pin));
  assert.throws(() => validateResourceLdsObservation(fixtureBytes, requests, responses.subarray(1), pin));
});

test("rehashed negative copies cannot substitute independent anchors or cross-pair whole records", () => {
  // These copies are deliberately malformed negative inputs, never retained as execution evidence.
  for (const mutate of [
    (fixture) => { fixture.checkpoints[2].expectedSnapshot.cursor.state_revision++; },
    (fixture) => { fixture.checkpoints[2].control = fixture.checkpoints[0].control; },
    (fixture) => { fixture.checkpoints[2].inventory.request = fixture.checkpoints[2].accessPages[0].request; },
    (fixture) => { fixture.checkpoints[2].accessPages[0].response = fixture.checkpoints[2].accessPages[1].response; },
    (fixture) => { fixture.checkpoints[2].memories[0].response = fixture.checkpoints[2].memories[1].response; },
    (fixture) => { fixture.checkpoints[2].memories[0].request.byte_len = 128; },
    (fixture) => { fixture.checkpoints[2].memories[0].request.allocation.generation = 1; },
    (fixture) => { fixture.checkpoints[2].accessPages[0].response.result.accesses.pop(); },
    (fixture) => { fixture.checkpoints[2].accessPages[0].request.schema = "fe2o3-debug-request-v1"; },
    (fixture) => { fixture.checkpoints[2].control.response.result.stop.exact = false; },
    (fixture) => { fixture.checkpoints[2].memories[0].addressSpace = "global"; },
    (fixture) => { fixture.context.variantIdentity = "2".repeat(64); },
  ]) {
    const fixture = fresh(); mutate(fixture); rejects(fixture);
  }
});

test("receipt integrity and unavailable-fact declarations cannot be elevated", () => {
  for (const [field, value] of [
    ["schema", "other"], ["logical_wave_width", 64], ["hardware_observed", true],
    ["grants_launch_authority", true], ["owning_scope", "workgroup"],
    ["lifetime", "known"], ["physical_base", "captured"], ["compiler_closure_attestation", "verified"],
  ]) {
    const fixture = fresh(), receipt = JSON.parse(fixture.receipt.utf8);
    receipt[field] = value;
    fixture.receipt.utf8 = JSON.stringify(receipt);
    fixture.receipt.sha256 = sha(fixture.receipt.utf8);
    rejects(fixture);
  }
  const fixture = fresh(); fixture.receipt.utf8 += "\n"; rejects(fixture);
});

test("all receipt digest fields require nonzero lowercase SHA-256 even in rehashed negative copies", () => {
  for (const field of ["source_sha256", "bundle_sha256", "export_observation_sha256",
    "simulation_request_sha256", "simulation_stdout_sha256", "debug_requests_sha256", "debug_responses_sha256"]) {
    for (const value of ["not-a-sha", "0".repeat(64), "A".repeat(64), "1".repeat(63), 123]) {
      const fixture = fresh(), receipt = JSON.parse(fixture.receipt.utf8);
      receipt[field] = value;
      if (field === "bundle_sha256") fixture.context.variantIdentity = value;
      if (field === "debug_responses_sha256") fixture.context.captureIdentity = value;
      fixture.receipt.utf8 = JSON.stringify(receipt); fixture.receipt.sha256 = sha(fixture.receipt.utf8);
      const bytes = Buffer.from(JSON.stringify(fixture));
      assert.throws(() => validateResourceLdsObservation(bytes, requests, responses, sha(bytes)),
        /exact nonzero lowercase SHA-256 required/);
    }
  }
  const fixture = fresh(); fixture.receipt.sha256 = "0".repeat(64);
  const bytes = Buffer.from(JSON.stringify(fixture));
  assert.throws(() => validateResourceLdsObservation(bytes, requests, responses, sha(bytes)),
    /exact nonzero lowercase SHA-256 required/);
});

test("even rehashed transcript copies reject duplicate/out-of-order IDs and malformed UTF-8", () => {
  const originalLines = requests.toString("utf8").trimEnd().split("\n");
  const duplicate = originalLines.slice(); duplicate[100] = duplicate[99];
  const reversed = originalLines.slice(); [reversed[100], reversed[101]] = [reversed[101], reversed[100]];
  for (const bytes of [
    Buffer.from(duplicate.join("\n") + "\n"), Buffer.from(reversed.join("\n") + "\n"),
    Buffer.concat([Buffer.from([0xff]), requests.subarray(1)]), requests.subarray(0, requests.length - 1),
  ]) {
    const fixture = fresh(), receipt = JSON.parse(fixture.receipt.utf8);
    receipt.debug_requests_sha256 = sha(bytes);
    fixture.receipt.utf8 = JSON.stringify(receipt); fixture.receipt.sha256 = sha(fixture.receipt.utf8);
    rejects(fixture, bytes);
  }
});

test("bounded file reader refuses symlinks, directories, oversized files and oversized fixture buffers", () => {
  const directory = mkdtempSync(join(tmpdir(), "fe2o3-lds-validator-negative-"));
  try {
    const regular = join(directory, "bytes"), link = join(directory, "link");
    writeFileSync(regular, "x"); symlinkSync(regular, link);
    assert.throws(() => readBoundedLdsFile(link, MAX_LDS_FIXTURE_BYTES));
    assert.throws(() => readBoundedLdsFile(directory, MAX_LDS_FIXTURE_BYTES));
    writeFileSync(regular, Buffer.alloc(MAX_LDS_FIXTURE_BYTES + 1));
    assert.throws(() => readBoundedLdsFile(regular, MAX_LDS_FIXTURE_BYTES));
    const oversized = Buffer.alloc(MAX_LDS_FIXTURE_BYTES + 1);
    assert.throws(() => validateResourceLdsObservation(oversized, requests, responses, sha(oversized)));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
