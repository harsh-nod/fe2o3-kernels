import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import { MACRO_CAPTURE_LIMIT, projectOrderedMacroFrames } from '../../src/content/ordered-macro-frames.mjs';
Object.defineProperty(globalThis, 'crypto', { value: webcrypto, writable: true, configurable: true });
const selected = JSON.parse(fs.readFileSync(new URL('../../examples/ordered_macro_frames_v1.json', import.meta.url), 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
const copy = () => structuredClone(selected);
function update(input, change, reportSelection = true) {
  const c = JSON.parse(input.captureUtf8), r = JSON.parse(c.report.utf8), b = JSON.parse(c.baseline.utf8);
  change(c, r, b);
  c.report.utf8 = JSON.stringify(r); c.report.sha256 = sha(c.report.utf8);
  c.baseline.utf8 = JSON.stringify(b); c.baseline.sha256 = sha(c.baseline.utf8);
  if (reportSelection) input.selection.reportSha256 = c.report.sha256;
  input.captureUtf8 = JSON.stringify(c); input.expectedCaptureSha256 = sha(input.captureUtf8);
  return input;
}
async function invalid(input) { const out = await projectOrderedMacroFrames(input); assert.equal(out.status, 'invalid', JSON.stringify(out)); assert.equal(out.frames, undefined); }
test('actual retained nested producer, baseline and two exact source files join', async () => {
  const out = await projectOrderedMacroFrames(copy());
  assert.equal(out.status, 'ready', out.detail);
  assert.deepEqual(out.frames.map(row => row.name), ['amdgpu_ordered_program', 'ordered_program_wrapper']);
  assert.equal(out.frames[1].callSite.excerpt, 'ordered_program_wrapper!(a, b, c)');
  assert.equal(out.frames[0].definitionSite.excerpt, 'macro_rules! amdgpu_ordered_program');
  assert.equal(out.frames[1].callSite.lineStart, 31);
  assert.equal(out.authority, 'display_only'); assert.equal(out.llvmInlineStack, false); assert.equal(out.finalArtifact, 'unavailable');
  assert.notEqual(out.canonicalSha256, out.canonicalBytesSha256);
  assert.ok(Object.isFrozen(out) && Object.isFrozen(out.frames[0].callSite));
});
test('missing input is unavailable, not an empty successful chain', async () => {
  assert.deepEqual(await projectOrderedMacroFrames(null), { status: 'unavailable', detail: 'Retained macro-frame capture pending.' });
});
test('selected source variant cannot be silently rebound', async () => {
  const input = copy(); input.selection.sourceSha256 = '1'.repeat(64); await invalid(input);
});
test('selected canonical owner cannot be silently rebound', async () => {
  const input = copy(); input.selection.canonicalSha256 = '2'.repeat(64); await invalid(input);
});
test('selected chain cannot be silently rebound', async () => {
  const input = copy(); input.selection.expansionChainSha256 = '3'.repeat(64); await invalid(input);
});
test('truthfully repinned different report still requires explicit selection', async () => {
  await invalid(update(copy(), (_, r) => { r.observation.actual.retained_receipts_sum_bytes++; }, false));
});
test('raw report byte mutation refuses before display', async () => {
  const input = copy(), c = JSON.parse(input.captureUtf8); c.report.utf8 += ' ';
  input.captureUtf8 = JSON.stringify(c); input.expectedCaptureSha256 = sha(input.captureUtf8); await invalid(input);
});
test('independent original baseline invocation mismatch refuses', async () => {
  await invalid(update(copy(), (_, __, b) => { b.invocation.args[1] = '--different'; }));
});
test('baseline payload content substitution refuses', async () => {
  await invalid(update(copy(), c => { c.baselineHex = '00' + c.baselineHex.slice(2); }));
});
test('canonical identity is never substituted with raw-byte hash', async () => {
  await invalid(update(copy(), (_, r) => { r.observation.origin.canonical_sha256 = r.baseline_sha256; }));
});
test('same-name different expansion identity cannot form a duplicate chain', async () => {
  await invalid(update(copy(), (_, r) => { r.observation.macro_frames.frames[1].expansion_identity = r.observation.macro_frames.frames[0].expansion_identity; }));
});
test('reversed frames with renumbered ordinals refuse', async () => {
  await invalid(update(copy(), (_, r) => { r.observation.macro_frames.frames.reverse().forEach((row, index) => { row.ordinal = index; }); }));
});
test('omitted frame and adjusted depth cannot turn nested profile into one-frame', async () => {
  await invalid(update(copy(), (_, r) => { r.observation.macro_frames.frames.pop(); r.observation.macro_frames.expansion_depth = 1; r.observation.origin.expansion_depth = 1; }));
});
test('stale outer source offset refuses even with truthful report hashes', async () => {
  await invalid(update(copy(), (_, r) => { r.observation.macro_frames.frames[1].call_site.byte_start--; r.observation.origin.call_site.byte_start--; }));
});
test('stale outer definition source interval refuses', async () => {
  await invalid(update(copy(), (_, r) => { r.observation.macro_frames.frames[1].definition_site.column_end++; }));
});
test('different source-file identity cannot be guessed from equal bytes', async () => {
  await invalid(update(copy(), (_, r) => { r.observation.macro_frames.frames[0].call_site.file_identity[0] ^= 1; }));
});
test('broken inner-callsite to outer-expansion link refuses', async () => {
  await invalid(update(copy(), (_, r) => { r.observation.macro_frames.frames[1].expansion.byte_end++; }));
});
test('substituted source bytes refuse without a matching original invocation', async () => {
  await invalid(update(copy(), c => { c.sources.fixture.utf8 += '\n'; c.sources.fixture.sha256 = sha(c.sources.fixture.utf8); }));
});
test('missing definition file keeps coordinates but invents no text or path', async () => {
  const out = await projectOrderedMacroFrames(update(copy(), c => { c.sources.definition = null; }));
  assert.equal(out.status, 'ready', out.detail);
  assert.equal(out.frames[0].definitionSite.path, null); assert.equal(out.frames[0].definitionSite.excerpt, null);
  assert.equal(out.frames[0].definitionSite.availability, 'source_bytes_unavailable');
  assert.equal(out.frames[1].definitionSite.availability, 'selected_source_bytes');
});
test('wrong supplied definition file bytes cannot hide as unavailable', async () => {
  await invalid(update(copy(), c => { c.sources.definition.utf8 += 'x'; c.sources.definition.sha256 = sha(c.sources.definition.utf8); }));
});
test('LLVM inline, physical-lifetime, source or artifact authority promotion refuses', async () => {
  for (const field of ['is_llvm_inline_stack', 'allocator_lifetime_trace_available', 'instruction_specific_origins_available', 'authenticates_source', 'grants_artifact_or_launch_authority']) {
    await invalid(update(copy(), (_, r) => { r.observation.macro_frames[field] = true; }));
  }
});
test('final artifact or hardware fields cannot be promoted', async () => {
  await invalid(update(copy(), (_, r) => { r.hardware_observed = true; }));
  await invalid(update(copy(), (_, r) => { r.observation.origin.final_artifact = 'qualified'; }));
});
test('target, source identity and same-owner actual joins refuse substitutions', async () => {
  await invalid(update(copy(), (_, r) => { r.observation.origin.target = 'gfx950'; }));
  await invalid(update(copy(), (_, r) => { r.observation.macro_frames.source_statement[0] ^= 1; }));
  await invalid(update(copy(), (_, r) => { r.observation.actual.canonical_identity[0] ^= 1; }));
});
test('duplicate keys and additional authority fields are not silently ignored', async () => {
  const input = copy(); input.captureUtf8 = input.captureUtf8.replace('"schema":', '"schema":"duplicate","schema":'); input.expectedCaptureSha256 = sha(input.captureUtf8); await invalid(input);
  await invalid(update(copy(), (_, r) => { r.observation.origin.extra_authority = false; }));
});
test('limits, malformed digest bytes and source ranges are release-active checks', async () => {
  await invalid(update(copy(), (_, r) => { r.observation.macro_frames.maximum_frames = 33; }));
  await invalid(update(copy(), (_, r) => { r.observation.macro_frames.canonical_sha256[0] = 256; }));
  await invalid(update(copy(), (_, r) => { r.observation.macro_frames.frames[0].call_site.byte_end = Number.MAX_SAFE_INTEGER + 1; }));
  await invalid({ ...copy(), captureUtf8: ' '.repeat(MACRO_CAPTURE_LIMIT + 1) });
});
test('caller mutation during hashing cannot change selected source or identities', async () => {
  const input = copy(), promise = projectOrderedMacroFrames(input);
  input.captureUtf8 = '{}'; input.selection.canonicalSha256 = '4'.repeat(64);
  const out = await promise; assert.equal(out.status, 'ready', out.detail); assert.equal(out.canonicalSha256, selected.selection.canonicalSha256);
});
test('missing crypto remains unavailable without a weaker hash path', async () => {
  const saved = globalThis.crypto;
  try { globalThis.crypto = undefined; const out = await projectOrderedMacroFrames(copy()); assert.equal(out.status, 'unavailable'); }
  finally { globalThis.crypto = saved; }
});
test('out-of-profile dummy definition is explicit refusal, never a fabricated span', async () => {
  await invalid(update(copy(), (_, r) => { r.observation.macro_frames.frames[0].definition_site = { availability: 'unavailable_dummy_definition' }; }));
});
test('whole wrapper definition cannot be replaced with an exact header-only span', async () => {
  for (const header of ['macro_rules! ordered_program_wrapper', 'macro_rules! ordered_program_wrapper {']) {
    await invalid(update(copy(), (_, r) => {
      const span = r.observation.macro_frames.frames[1].definition_site;
      span.byte_end = span.byte_start + Buffer.byteLength(header);
      span.line_end = span.line_start; span.column_end = span.column_start + header.length;
    }));
  }
});
test('inner call cannot be truncated to its matching header with correct coordinates', async () => {
  await invalid(update(copy(), (_, r) => {
    for (const span of [r.observation.macro_frames.frames[0].call_site, r.observation.macro_frames.frames[1].expansion]) {
      const header = 'amdgpu_ordered_program! {';
      span.byte_end = span.byte_start + Buffer.byteLength(header);
      span.line_end = span.line_start; span.column_end = span.column_start + header.length;
    }
  }));
});
