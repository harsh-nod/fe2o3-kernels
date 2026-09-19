#!/usr/bin/env node
// Explicit trusted validator code + exact private capture -> display-only bytes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { NAVIGATION_LIMITS, projectAuthoringNavigation } from '../src/content/authoring-navigation.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function absolute(filename) { assert(typeof filename === 'string' && filename.length <= 4096 && path.isAbsolute(filename) && path.resolve(filename) === filename && !/[\x00-\x1f\x7f]/u.test(filename)); return filename; }
function read(filename, maximum) {
  absolute(filename); assert.equal(fs.realpathSync(filename), filename, 'redirected input');
  const fd = fs.openSync(filename, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
  try {
    const before = fs.fstatSync(fd, { bigint: true }); assert(before.isFile() && before.size > 0 && before.size <= BigInt(maximum));
    const bytes = Buffer.alloc(Number(before.size)), extra = Buffer.alloc(1); let at = 0;
    while (at < bytes.length) { const n = fs.readSync(fd, bytes, at, bytes.length - at, null); assert(n > 0); at += n; }
    assert.equal(fs.readSync(fd, extra, 0, 1, null), 0);
    const after = fs.fstatSync(fd, { bigint: true }); for (const key of ['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs']) assert.equal(before[key], after[key]);
    return bytes;
  } finally { fs.closeSync(fd); }
}
export async function exportAuthoringNavigation(validatorPath, capturePath, expectedSha256, outputPath) {
  for (const value of [validatorPath, capturePath, outputPath]) absolute(value);
  assert(/^[0-9a-f]{64}$/u.test(expectedSha256)); assert.equal(path.basename(validatorPath), 'authoring-navigation-v1-smoke.mjs');
  const validatorBytes = read(validatorPath, 1048576), captureBytes = read(capturePath, 2097152);
  assert.equal(sha(captureBytes), expectedSha256, 'capture pin mismatch');
  assert.equal(fs.realpathSync(path.dirname(outputPath)), path.dirname(outputPath)); assert(!fs.existsSync(outputPath), 'output must be new');
  // The caller selects trusted compiler-repository code. This is not a sandbox
  // for untrusted modules and never accepts executable code from capture JSON.
  const { validateNavigationCapture } = await import(pathToFileURL(validatorPath).href);
  assert.equal(typeof validateNavigationCapture, 'function');
  const { navigation } = await validateNavigationCapture(captureBytes);
  const value = { schema: 'fe2o3-tutorial-authoring-navigation-v1', kind: 'retained_source_navigation', authority: 'display_only', sourceCaptureSha256: expectedSha256, navigation };
  const captureUtf8 = JSON.stringify(value) + '\n'; assert(Buffer.byteLength(captureUtf8) <= NAVIGATION_LIMITS.captureBytes);
  const pin = sha(Buffer.from(captureUtf8));
  const projection = await projectAuthoringNavigation({ captureUtf8, expectedCaptureSha256: pin }); assert.equal(projection.status, 'ready', projection.detail);
  assert.equal(sha(read(capturePath, 2097152)), expectedSha256); assert.equal(sha(read(validatorPath, 1048576)), sha(validatorBytes));
  const fd = fs.openSync(outputPath, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
  try { fs.writeFileSync(fd, captureUtf8); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  return { output: outputPath, bytes: Buffer.byteLength(captureUtf8), sha256: pin, sourceCaptureSha256: expectedSha256, authority: 'display_only' };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { assert.equal(process.argv.length, 6, 'usage: node scripts/export-authoring-navigation.mjs ABS_TRUSTED_VALIDATOR ABS_CAPTURE EXPECTED_CAPTURE_SHA256 NEW_ABS_OUTPUT'); console.log(JSON.stringify(await exportAuthoringNavigation(...process.argv.slice(2)))); }
  catch (error) { console.error(String(error.stack ?? error).slice(0, 8192)); process.exitCode = 1; }
}
