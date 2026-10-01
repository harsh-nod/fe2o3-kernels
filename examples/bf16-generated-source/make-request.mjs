// Tutorial-only request construction. No compiler, source owner or replay runs.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export const REPORT_LIMIT = 16 * 1024;
export const REQUEST_LIMIT = 8192;
const ORIGINAL_SHA256 = 'fcb26135ad4f931bb8dda63d631639a34dd8461e7801c22a1f6a383e0e735a3e';
const DIGESTS = ['semantic_sha256', 'canonical_sha256', 'mir_sha256', 'original_sha256'];
const digest = value => assert(typeof value === 'string' && /^[0-9a-f]{64}$/.test(value) && value !== '0'.repeat(64), 'nonzero lowercase selector digest');

/** Copy inert selectors for this exact lesson. The actual publisher must rejoin
 * them to a fresh source owner; this function cannot establish their authenticity
 * or currentness, or prove the process that wrote the report exited successfully.
 */
export function makeRequest(report, order) {
  assert(report && typeof report === 'object' && !Array.isArray(report));
  assert(['identity', 'swap01'].includes(order), 'choose identity or swap01');
  assert.equal(report.schema, 'fe2o3-bf16-tile-source-action-v1');
  assert.equal(report.mode, 'inspect');
  assert.equal(report.status, 'inspected');
  assert.equal(report.actual_rustc_callback, true);
  assert.equal(report.source_postflight_ok, true);
  assert.equal(report.target, 'gfx942:xnack-');
  assert.equal(report.wave_width, 64);
  assert.equal(report.canonical_digest_domain, 'compiler_identity_digest_not_sha256_serialized_bytes');
  assert.equal(report.publication_effect, 'not_attempted');
  for (const field of ['requested_selection', 'request_sha256', 'publication', 'publication_error']) assert.equal(report[field], null);
  for (const field of ['selection_is_compiler_custody', 'candidate_compiled', 'simulation_performed', 'normal_ranked_admission_performed', 'native_execution', 'hardware_observed', 'grants_artifact_or_launch_authority']) assert.equal(report[field], false);
  assert.equal(report.candidate_requires_fresh_frontend, true);
  assert.equal(report.memory_measurement, 'unavailable');
  const s = report.selection;
  assert(s && typeof s === 'object' && !Array.isArray(s), 'inspection selection required');
  assert.deepEqual(Object.keys(s).sort(), [...DIGESTS, 'original_bytes', 'publication_eligibility'].sort());
  for (const field of DIGESTS) digest(s[field]);
  assert.equal(s.original_bytes, 3950);
  assert.equal(s.original_sha256, ORIGINAL_SHA256, 'this helper is only for the exact tutorial source');
  assert.equal(s.publication_eligibility, 'rechecked_by_explicit_source_action');
  const request = {
    schema: 'fe2o3-bf16-tile-source-promotion-request-v1',
    ...Object.fromEntries(DIGESTS.map(field => [field, s[field]])),
    original_path: 'original/src/lib.rs',
    candidate_path: order + '/src/lib.rs',
    helper_name: '__fe2o3_bf16_tile_' + order,
    return_order: order,
  };
  const bytes = Buffer.from(JSON.stringify(request, null, 2) + '\n');
  assert(bytes.length <= REQUEST_LIMIT);
  return bytes;
}

const identity = stat => ['dev', 'ino', 'mode', 'size', 'mtimeNs', 'ctimeNs'].map(key => String(stat[key]));
export function readInspection(file) {
  // Linux matches the public publisher's supported host profile.
  assert.equal(process.platform, 'linux');
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
  try {
    const before = fs.fstatSync(fd, {bigint: true});
    assert(before.isFile() && before.size > 0n && before.size <= BigInt(REPORT_LIMIT), 'bounded regular inspection file');
    const bytes = Buffer.alloc(Number(before.size));
    let at = 0;
    while (at < bytes.length) {
      const n = fs.readSync(fd, bytes, at, bytes.length - at, at);
      assert(n > 0, 'inspection truncated');
      at += n;
    }
    assert.equal(fs.readSync(fd, Buffer.alloc(1), 0, 1, at), 0, 'inspection grew');
    assert.deepEqual(identity(fs.fstatSync(fd, {bigint: true})), identity(before));
    assert.deepEqual(identity(fs.lstatSync(file, {bigint: true})), identity(before));
    const text = bytes.toString('utf8');
    assert(bytes.equals(Buffer.from(text)), 'inspection UTF8');
    // This is not an authentication parser. Compiler request admission and the
    // fresh owner check remain mandatory, including for manually edited JSON.
    return JSON.parse(text);
  } finally {
    fs.closeSync(fd);
  }
}
export function writeRequest(file, bytes) {
  assert(Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= REQUEST_LIMIT);
  const fd = fs.openSync(file, 'wx', 0o600);
  try {
    let at = 0;
    while (at < bytes.length) {
      const n = fs.writeSync(fd, bytes, at, bytes.length - at);
      assert(n > 0, 'request write stopped');
      at += n;
    }
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assert.equal(process.argv.length, 5, 'usage: node make-request.mjs INSPECTION_JSON identity|swap01 NEW_REQUEST_JSON');
    const bytes = makeRequest(readInspection(process.argv[2]), process.argv[3]);
    writeRequest(process.argv[4], bytes);
  } catch (error) {
    console.error('BF16 request construction failed: ' + error.message + '; retain any partial request file and use a new output name');
    process.exitCode = 1;
  }
}
