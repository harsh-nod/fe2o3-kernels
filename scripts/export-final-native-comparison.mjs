#!/usr/bin/env node
// Retain explicit pinned originals for a separate browser comparison profile.
// Reads fourteen selected files, creates one new output, never compiles or runs code.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseProgramJson } from '../src/content/ordered-program-observation.mjs';
import { FINAL_NATIVE_LIMITS as LIMITS, projectFinalNativeComparison } from '../src/content/final-native-comparison.mjs';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
function absolute(value) {
  assert.ok(typeof value === 'string' && path.isAbsolute(value) && path.resolve(value) === value &&
    Buffer.byteLength(value) <= 4096 && !/[\u0000-\u001f\u007f]/u.test(value)); return value;
}
function within(parent, child) {
  const relative = path.relative(parent, child);
  return relative !== '' && !path.isAbsolute(relative) && relative !== '..' && !relative.startsWith('../');
}
export function options(argv) {
  const names = ['join', 'expected-join-sha256', 'source-root', 'default-native-root', 'edited-native-root', 'output'];
  assert.equal(argv.length, names.length * 2); const result = {};
  for (let at = 0; at < argv.length; at += 2) {
    assert.ok(argv[at].startsWith('--')); const name = argv[at].slice(2);
    assert.ok(names.includes(name) && !Object.hasOwn(result, name)); result[name] = argv[at + 1];
  }
  for (const name of names.filter(name => name !== 'expected-join-sha256')) absolute(result[name]);
  assert.match(result['expected-join-sha256'], /^[0-9a-f]{64}$/u);
  assert.notEqual(result['expected-join-sha256'], '0'.repeat(64));
  const directories = ['source-root', 'default-native-root', 'edited-native-root'].map(name => result[name]);
  assert.equal(new Set(directories).size, 3);
  for (const input of [result.join, ...directories]) assert.ok(result.output !== input && !within(input, result.output));
  return result;
}
function observation(file, cap) {
  assert.equal(fs.realpathSync(file), file, 'no input symlink traversal');
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
  try {
    const before = fs.fstatSync(fd, { bigint: true });
    assert.ok(before.isFile() && before.size > 0n && before.size <= BigInt(cap));
    const storage = Buffer.alloc(Number(before.size) + 1); let length = 0;
    while (length < storage.length) {
      const count = fs.readSync(fd, storage, length, storage.length - length, null);
      if (!count) break; length += count;
    }
    assert.equal(BigInt(length), before.size);
    const after = fs.fstatSync(fd, { bigint: true }), named = fs.lstatSync(file, { bigint: true });
    for (const key of ['dev', 'ino', 'mode', 'nlink', 'size', 'mtimeNs', 'ctimeNs']) {
      assert.equal(after[key], before[key]); assert.equal(named[key], before[key]);
    }
    const bytes = storage.subarray(0, length);
    return { bytes, pin: { path: file, bytes: length, sha256: sha256(bytes),
      device: String(before.dev), inode: String(before.ino), mode: String(before.mode), nlink: String(before.nlink),
      mtime_ns: String(before.mtimeNs), ctime_ns: String(before.ctimeNs) } };
  } finally { fs.closeSync(fd); }
}
async function run(opt) {
  const pins = new Map(); let total = 0;
  const read = (file, cap) => {
    const observed = observation(file, cap);
    assert.ok(!pins.has(file) && pins.size < LIMITS.artifacts, 'exact distinct selected input roster');
    pins.set(file, observed.pin); total += observed.bytes.length; assert.ok(total <= LIMITS.totalBytes);
    return observed;
  };
  const artifact = (file, cap = LIMITS.artifactBytes) => {
    const value = read(file, cap);
    return { sha256: value.pin.sha256, bytes: value.pin.bytes,
      utf8: new TextDecoder('utf-8', { fatal: true }).decode(value.bytes) };
  };
  for (const directory of [opt['source-root'], opt['default-native-root'], opt['edited-native-root'], path.dirname(opt.output)])
    assert.equal(fs.realpathSync(directory), directory);
  const join = artifact(opt.join); assert.equal(join.sha256, opt['expected-join-sha256'], 'selected join identity differs');
  const selected = parseProgramJson(join.utf8, LIMITS.artifactBytes);
  assert.equal(selected.source_receipt.path, path.join(opt['source-root'], 'receipt.json'));
  const evidence = { schema: 'fe2o3-final-native-comparison-example-v1',
    provenance: { capture_name: path.basename(path.dirname(opt.join)), kind: 'retained_source_native_observation',
      producer_authenticated: false, qualified_release_pin: null },
    join, sourceReceipt: artifact(selected.source_receipt.path),
    sources: ['original', 'default', 'edited'].map((label, index) => ({ label,
      artifact: artifact(path.join(opt['source-root'], ['original.rs', 'public-candidate.rs', 'instruction-edited.rs'][index]), LIMITS.sourceBytes) })),
    llvm: ['default', 'edited', 'repeat'].map(label => ({ label,
      artifact: artifact(path.join(opt['source-root'], label + '.ll'), LIMITS.sourceBytes) })),
    reports: ['default', 'edited'].map((profile, index) => {
      const file = path.join(opt[profile + '-native-root'], 'command.stdout');
      assert.equal(selected.native_reports[index].path, file);
      return { profile, artifact: artifact(file, LIMITS.reportBytes) };
    }),
    payloads: ['default', 'edited'].flatMap((profile, index) => ['O0', 'O3'].map((optimization, at) => {
      const file = path.join(opt[profile + '-native-root'], 'payloads', optimization + '.hsaco');
      assert.equal(selected.native_observations[index * 2 + at].payload_path, file);
      const value = read(file, LIMITS.payloadBytes);
      return { profile, optimization, sha256: value.pin.sha256, bytes: value.pin.bytes, hex: value.bytes.toString('hex') };
    })) };
  assert.equal(pins.size, LIMITS.artifacts);
  const projection = await projectFinalNativeComparison(evidence, opt['expected-join-sha256']);
  assert.equal(projection.status, 'ready', projection.detail ?? 'browser profile rejected retained originals');
  for (const [file, observed] of pins) {
    if (file === opt.join) continue; // The caller selected this original by complete digest.
    const expected = selected.retained_input_pins.find(pin => pin.path === file);
    assert.ok(expected, 'selected original is absent from strict join ledger');
    // The lossless JSON reader uses null-prototype records. Compare every own
    // field after the adapter's closed-schema validation, not JS prototypes.
    assert.deepEqual(observed, { ...expected }, 'selected original identity or metadata changed');
  }
  for (const [file, expected] of pins) assert.deepEqual(observation(file, expected.bytes).pin, expected, 'selected input changed');
  const bytes = Buffer.from(JSON.stringify(evidence, null, 2) + '\n');
  assert.ok(bytes.length <= LIMITS.totalBytes);
  // Validate the serialized capsule's lossless parser boundary as well.
  parseProgramJson(bytes.toString('utf8'), LIMITS.totalBytes);
  const fd = fs.openSync(opt.output, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
  try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  assert.equal(observation(opt.output, LIMITS.totalBytes).pin.sha256, sha256(bytes));
  const parent = fs.openSync(path.dirname(opt.output), fs.constants.O_RDONLY | fs.constants.O_DIRECTORY);
  try { fs.fsyncSync(parent); } finally { fs.closeSync(parent); }
  process.stdout.write(JSON.stringify({ status: 'retained_observation_exported', output: opt.output,
    bytes: bytes.length, sha256: sha256(bytes), expected_join_sha256: opt['expected-join-sha256'],
    selected_input_files: pins.size, selected_input_bytes: total, create_new_only: true,
    source_authentication: false, compiler_execution: false, native_execution: false,
    hardware_execution: false, milestone_completion: false }) + '\n');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(options(process.argv.slice(2))).catch(error => {
    process.stderr.write(String(error).slice(0, 4096) + '\nOutput may be partial; no cleanup or rollback claimed.\n');
    process.exitCode = 1;
  });
}
