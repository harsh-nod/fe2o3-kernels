#!/usr/bin/env node
// Extract exact pairs from a completed bounded public V17 batch. This is a
// presentation export, not source authentication or a compiler admission API.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { PROGRAM_CAPTURE_LIMIT, PROGRAM_VARIANTS, PROGRAM_PAIR_ROLES, parseProgramJson, projectOrderedProgramObservation } from '../src/content/ordered-program-observation.mjs';

const MiB = 1024 * 1024;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const ids = [4, 5, 6, 9, 10, 14, 15, 16, 17];
const text = bytes => new TextDecoder('utf-8', { fatal: true }).decode(bytes);
function absolute(filename) {
  assert(typeof filename === 'string' && filename.length <= 4096 && path.isAbsolute(filename) && path.resolve(filename) === filename && !/[\x00-\x1f\x7f]/u.test(filename), 'canonical absolute path required'); return filename;
}
function read(filename, maximum, pin) {
  absolute(filename); assert.equal(fs.realpathSync(filename), filename, 'redirected input');
  const fd = fs.openSync(filename, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
  try {
    const before = fs.fstatSync(fd, { bigint: true }); assert(before.isFile() && before.size <= BigInt(maximum), 'input bound/type');
    const bytes = Buffer.alloc(Number(before.size)), extra = Buffer.alloc(1); let used = 0;
    while (used < bytes.length) { const count = fs.readSync(fd, bytes, used, bytes.length - used, null); assert(count > 0, 'input shrank'); used += count; }
    assert.equal(fs.readSync(fd, extra, 0, 1, null), 0, 'input grew');
    const after = fs.fstatSync(fd, { bigint: true });
    for (const key of ['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs']) assert.equal(after[key], before[key], 'input changed during read');
    if (pin) { assert.equal(pin.path, filename); assert.equal(pin.bytes, bytes.length); assert.equal(pin.sha256, sha(bytes)); }
    return bytes;
  } finally { fs.closeSync(fd); }
}
function findPin(pins, filename) { assert(Array.isArray(pins) && pins.length <= 640); const rows = pins.filter(p => p.path === filename); assert.equal(rows.length, 1, 'missing or duplicate retained pin'); return rows[0]; }
export function selectedProgramPairs(requestsUtf8, responsesUtf8, commands) {
  assert(typeof requestsUtf8 === 'string' && Buffer.byteLength(requestsUtf8) <= MiB);
  assert(typeof responsesUtf8 === 'string' && Buffer.byteLength(responsesUtf8) <= 8 * MiB);
  assert(Number.isSafeInteger(commands) && commands >= 17 && commands <= 192);
  const lines = raw => { assert(raw.endsWith('\n')); const result = raw.slice(0, -1).split('\n'); assert.equal(result.length, commands); assert(result.every(line => line.length > 0 && Buffer.byteLength(line) <= 262144)); return result; };
  const requests = lines(requestsUtf8), responses = lines(responsesUtf8);
  for (let i = 0; i < commands; i++) {
    const request = parseProgramJson(requests[i], 262144), response = parseProgramJson(responses[i], 262144);
    assert.equal(request.request_id, i + 1); assert.equal(response.request_id, request.request_id); assert.equal(response.operation, request.operation);
  }
  return ids.map((id, index) => ({ role: PROGRAM_PAIR_ROLES[index], requestUtf8: requests[id - 1], responseUtf8: responses[id - 1] }));
}
export async function exportOrderedProgramCapture(batchDirectory, outputFile) {
  const batch = absolute(batchDirectory), output = absolute(outputFile);
  assert.equal(fs.realpathSync(batch), batch); assert.equal(fs.realpathSync(path.dirname(output)), path.dirname(output));
  assert(!fs.existsSync(output), 'output must be new');
  const receiptBytes = read(path.join(batch, 'receipt.json'), MiB), receipt = parseProgramJson(text(receiptBytes), MiB);
  assert.equal(receipt.kind, 'task_phase9_public_ordered_program_debugger_batch'); assert.equal(receipt.status, 'passed');
  for (const name of ['source_authentication', 'compiler_closure_attestation', 'protected_admission', 'hardware_observed', 'physical_register_values', 'instruction_microsteps', 'production_resume', 'artifact_or_launch_authority', 'proof_authority', 'all_64_lane_logical_values_checked']) assert.equal(receipt[name], false);
  assert.equal(receipt.selected_lane, 0); assert.equal(receipt.counts.variants, 6); assert.equal(receipt.counts.sessions, 36); assert.equal(receipt.counts.input_cases_per_variant, 6);
  assert.equal(receipt.sessions.length, 36); assert.equal(receipt.inspections.length, 6);
  const capture = { schema: 'fe2o3-tutorial-ordered-program-observation-v1', kind: 'retained_public_diagnostic', authority: 'display_only', sourceReceiptSha256: receipt.source_receipt.sha256, aggregateReceiptSha256: sha(receiptBytes), variants: [] };
  const retainedReads = [];
  const pinned = (filename, maximum) => { const pin = findPin(receipt.stable_file_pins, filename), bytes = read(filename, maximum, pin); retainedReads.push({ filename, maximum, pin }); return bytes; };
  for (const variant of PROGRAM_VARIANTS) {
    const row = { ...variant, inspectionUtf8: null, inspectionSha256: null, cases: [] };
    for (let index = 0; index < 6; index++) {
      const directory = path.join(batch, `${variant.name}-case-${index}`), reportPath = path.join(directory, 'smoke.json');
      const sessionRow = receipt.sessions.filter(item => item.name === variant.name && item.case === index); assert.equal(sessionRow.length, 1);
      assert.equal(sessionRow[0].report.path, reportPath); assert.equal(sessionRow[0].profile, variant.profile); assert.equal(sessionRow[0].result_mode, variant.resultMode);
      const report = parseProgramJson(text(pinned(reportPath, 262144)), 262144);
      const reportPin = findPin(receipt.stable_file_pins, reportPath);
      assert.equal(sessionRow[0].report.sha256, reportPin.sha256); assert.equal(sessionRow[0].report.bytes, reportPin.bytes);
      assert.equal(report.kind, 'ordered_program_debugger_smoke_observation_draft_v1'); assert.equal(report.status, 'passed');
      assert.equal(report.selected_lane, 0); assert.equal(report.all_64_lane_logical_values_checked, false); assert.equal(report.physical_register_values, 'unavailable'); assert.equal(report.instruction_microsteps, 'unavailable');
      for (const name of ['source_authentication', 'hardware_observed', 'grants_proof_or_resume_authority', 'grants_artifact_or_launch_authority']) assert.equal(report[name], false);
      assert.equal(report.configuration_identity, sessionRow[0].configuration_identity); assert.equal(report.commands, sessionRow[0].commands);
      const inspectPath = path.join(directory, 'inspection.stdout'), inspectionBytes = pinned(inspectPath, 8192);
      assert.equal(sha(inspectionBytes), findPin(report.retained_file_pins, inspectPath).sha256);
      const inspectionUtf8 = text(inspectionBytes);
      const inspected = parseProgramJson(inspectionUtf8, 8192);
      for (const key of ['canonical', 'coordinate', 'raw_block_id', 'input_value_ids', 'result_value_id']) assert.deepEqual(report[key], inspected[key], 'report and inspector owner metadata differ');
      assert.deepEqual(report.canonical, sessionRow[0].canonical);
      assert.deepEqual(report.declared_register_plan, inspected.register_plan); assert.deepEqual(report.declared_program, inspected.declared_program); assert.deepEqual(report.declared_source_ids, inspected.declared_source_ids);
      if (index === 0) { row.inspectionUtf8 = inspectionUtf8; row.inspectionSha256 = sha(inspectionBytes); }
      else assert.equal(inspectionUtf8, row.inspectionUtf8, 'same variant owner inspection changed between requests');
      const session = parseProgramJson(text(pinned(path.join(directory, 'session/observation.json'), 262144)), 262144);
      assert.equal(session.kind, 'ordered_program_debugger_observation_draft_v1'); assert.equal(session.status, 'passed'); assert.equal(session.commands, report.commands); assert.equal(session.configurationIdentity, report.configuration_identity);
      assert.equal(session.exact_streams_truncated, false); assert.equal(session.forced_drain_deadline_exceeded, false); assert.equal(session.exit.code, 0); assert.equal(session.exit.signal, null);
      assert.equal(session.inputs.kir.sha256, findPin(report.retained_file_pins, session.inputs.kir.path).sha256);
      assert.equal(session.expected.canonicalIdentity, inspected.canonical.sha256);
      assert.deepEqual(session.expected.inputValueIds, inspected.input_value_ids); assert.equal(session.expected.resultValueId, inspected.result_value_id);
      const streams = {};
      for (const [name, cap] of [['requests.jsonl', MiB], ['responses.jsonl', 8 * MiB]]) {
        const filename = path.join(directory, 'session', name), bytes = pinned(filename, cap), expected = session.artifacts[name];
        assert.equal(bytes.length, expected.bytes); assert.equal(sha(bytes), expected.sha256); assert.equal(sha(bytes), findPin(report.retained_file_pins, filename).sha256); streams[name] = text(bytes);
      }
      const requestPin = findPin(report.retained_file_pins, session.inputs.request.path); assert.equal(requestPin.sha256, session.inputs.request.sha256); assert.equal(requestPin.bytes, session.inputs.request.bytes);
      row.cases.push({ index, configurationIdentity: report.configuration_identity, simulationRequestSha256: requestPin.sha256, requestsSha256: session.artifacts['requests.jsonl'].sha256, responsesSha256: session.artifacts['responses.jsonl'].sha256, pairs: selectedProgramPairs(streams['requests.jsonl'], streams['responses.jsonl'], report.commands) });
    }
    capture.variants.push(row);
  }
  const captureUtf8 = JSON.stringify(capture) + '\n'; assert(Buffer.byteLength(captureUtf8) <= PROGRAM_CAPTURE_LIMIT);
  const expectedCaptureSha256 = sha(Buffer.from(captureUtf8)), projection = await projectOrderedProgramObservation({ captureUtf8, expectedCaptureSha256 });
  assert.equal(projection.status, 'ready', projection.detail); assert.equal(projection.kind, 'retained_public_diagnostic');
  assert.equal(sha(read(path.join(batch, 'receipt.json'), MiB)), sha(receiptBytes), 'aggregate changed');
  for (const input of retainedReads) read(input.filename, input.maximum, input.pin);
  // Create-new only. A write failure may retain an incomplete new file; never
  // overwrite another capture or remove evidence automatically.
  const fd = fs.openSync(output, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
  try { fs.writeFileSync(fd, captureUtf8); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  return { output, bytes: Buffer.byteLength(captureUtf8), sha256: expectedCaptureSha256, variants: 6, sessions: 36, lane: 0, authority: 'display_only' };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { assert.equal(process.argv.length, 4, 'usage: node scripts/export-ordered-program-observation.mjs ABS_BATCH_DIRECTORY NEW_ABS_OUTPUT_JSON'); console.log(JSON.stringify(await exportOrderedProgramCapture(process.argv[2], process.argv[3]))); }
  catch (error) { console.error(String(error.stack ?? error).slice(0, 8192)); process.exitCode = 1; }
}
