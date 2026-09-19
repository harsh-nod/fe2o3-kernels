import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { projectAuthoringNavigation, navigationOccurrences, navigationCoordinateKey, NAVIGATION_LIMITS } from '../../src/content/authoring-navigation.mjs';
import { programSha256 } from '../../src/content/ordered-program-observation.mjs';
import { syntheticNavigationEnvelope, syntheticNavigationInput, navigationInputFor } from './fixtures/authoring-navigation-fixture.mjs';

test('retained actual ordinary-source capture preserves exact twelve-operation roster and selection', async () => {
  const captureUtf8 = fs.readFileSync(new URL('../../examples/ordinary_authoring_navigation_v1.json', import.meta.url), 'utf8');
  const result = await projectAuthoringNavigation({ captureUtf8, expectedCaptureSha256: '957b7a0ece3aaea5e474c3124bced44e28a73b616e8cddd0e663a8fa7380d6c1' });
  assert.equal(result.status, 'ready'); assert.equal(result.kind, 'retained_source_navigation');
  assert.equal(result.sourceCaptureSha256, '14d3f430b9d6a394de4874d02142c33c1edc29e4ba8fa338f8c424fd85aa0556');
  const view = result.navigation;
  assert.equal(view.operations.length, 12);
  assert.deepEqual(navigationOccurrences(view, 325, 334).map(row => navigationCoordinateKey(row.coordinate)), ['0:0:3', '0:0:4']);
  assert.deepEqual(view.region.live_in.map(row => row.value), [14, 15]);
  assert.deepEqual(view.region.live_out.map(row => row.value), [16]);
  assert.equal(view.region.source_insertion_boundary, 'unavailable_source_application_not_admitted');
});

test('synthetic same-span constant and OR remain distinct and deeply immutable', async () => {
  const result = await projectAuthoringNavigation(await syntheticNavigationInput());
  assert.equal(result.status, 'ready'); assert.equal(result.kind, 'synthetic_test_only');
  const view = result.navigation, range = view.attributions[0];
  assert.deepEqual(navigationOccurrences(view, range.byte_start, range.byte_end).map(row => navigationCoordinateKey(row.coordinate)), ['0:0:0', '0:0:1']);
  assert.deepEqual(navigationOccurrences(view, 0, 1), []);
  assert.deepEqual(navigationOccurrences(view, range.byte_end, range.byte_end + 1), []);
  assert.throws(() => navigationOccurrences(view, range.byte_start, range.byte_start));
  const continuation = new TextEncoder().encode(view.source.utf8).indexOf(0xa9);
  assert.throws(() => navigationOccurrences(view, continuation, continuation + 1));
  assert.notEqual(view.source.sha256, view.source_file_identity);
  assert.equal(view.region.live_out[0].value, 16); assert.equal(view.availability.source_edit_boundary, 'unavailable');
  assert(Object.isFrozen(view.operations[0].source_spans));
  assert.throws(() => { view.selector.operations[0].operation = 0; }, TypeError);
});
test('null, invalid pins and oversized input never provide fallback observations', async () => {
  assert.equal((await projectAuthoringNavigation(null)).status, 'unavailable');
  const input = await syntheticNavigationInput();
  assert.equal((await projectAuthoringNavigation({ ...input, expectedCaptureSha256: 'f'.repeat(64) })).status, 'invalid');
  assert.equal((await projectAuthoringNavigation({ ...input, captureUtf8: ' '.repeat(NAVIGATION_LIMITS.captureBytes + 1) })).status, 'invalid');
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  try { Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true }); assert.equal((await projectAuthoringNavigation(input)).status, 'unavailable'); }
  finally { Object.defineProperty(globalThis, 'crypto', descriptor); }
});
const controls = [
  ['source hash', v => { v.source.sha256 = 'f'.repeat(64); }],
  ['source length', v => { v.source.bytes++; }],
  ['path-only source association', v => { v.operations[0].source_spans[0].file_identity = 'e'.repeat(64); }],
  ['source owner claim', v => { v.source_binding = 'authenticated_ssa_owner'; }],
  ['wrong target', v => { v.selector.target = 'gfx950:xnack-'; }],
  ['stale snapshot', v => { v.selector.bundle_identity = 'e'.repeat(64); }],
  ['changed KIR', v => { v.summary.canonical_kir_digest = 'e'.repeat(64); }],
  ['incomplete roster', v => { v.operations.pop(); }],
  ['reordered roster', v => { v.operations.reverse(); }],
  ['reused coordinate', v => { v.operations[1].coordinate = v.operations[0].coordinate; }],
  ['cross-function SSA reuse', v => { v.operations[0].coordinate.function = 1; }],
  ['missing attribution', v => { v.attributions.pop(); }],
  ['reversed range', v => { v.operations[0].source_spans[0].byte_end = '0'; }],
  ['out of bounds range', v => { v.operations[0].source_spans[0].byte_end = '999999'; }],
  ['mid UTF8 endpoint', v => { const bytes = new TextEncoder().encode(v.source.utf8); v.operations[0].source_spans[0].byte_start = String(bytes.indexOf(0xa9)); }],
  ['invented selected live-out', v => { v.region.live_out[0].value = 99; }],
  ['invented selected live-in', v => { v.region.live_in[0].value = 99; }],
  ['missing selected boundary', v => { v.region = null; }],
  ['changed region effect', v => { v.region.operations[0].local_memory_effects = ['write']; }],
  ['false complete summary', v => { v.operations[1].complete_local_effect_summary = false; }],
  ['merged same-span occurrences', v => { v.selected_range_occurrences.pop(); }],
  ['invented LLVM body', v => { v.availability.compiler_handoff_llvm = 'available'; }],
  ['source edit authority', v => { v.authority.source_authenticated = true; }],
  ['launch authority', v => { v.summary.authority.grants_load_or_launch = true; }],
  ['physical observation', v => { v.operations[0].physical_resources = 'observed'; }],
  ['unknown field', v => { v.resume = true; }],
];
for (const [name, mutate] of controls) test(`rejects ${name}`, async () => {
  const envelope = await syntheticNavigationEnvelope(); mutate(envelope.navigation);
  assert.equal((await projectAuthoringNavigation(await navigationInputFor(envelope))).status, 'invalid');
});
test('unattributed extra occurrence remains inspectable and does not acquire a guessed span', async () => {
  const envelope = await syntheticNavigationEnvelope(), view = envelope.navigation;
  const extra = structuredClone(view.operations[0]); extra.coordinate.operation = 2; extra.source_spans = []; extra.source_binding = 'unavailable_no_source_span'; extra.complete_local_effect_summary = false;
  view.operations.push(extra); view.summary.operation_count++;
  const result = await projectAuthoringNavigation(await navigationInputFor(envelope));
  assert.equal(result.status, 'ready'); assert.equal(result.navigation.operations[2].source_spans.length, 0);
  assert.equal(result.navigation.operations[2].complete_local_effect_summary, false);
});
test('CR/BOM normalization, duplicate JSON keys and unsafe numeric coordinates reject', async () => {
  for (const prefix of ['\r', '\ufeff']) {
    const envelope = await syntheticNavigationEnvelope(), source = envelope.navigation.source;
    source.utf8 = prefix + source.utf8; source.bytes = new TextEncoder().encode(source.utf8).length; source.sha256 = await programSha256(source.utf8);
    assert.equal((await projectAuthoringNavigation(await navigationInputFor(envelope))).status, 'invalid');
  }
  for (const raw of ['{"kind":1,"kind":2}', '{"n":9007199254740992}', '"\\ud800"', '['.repeat(26) + '0' + ']'.repeat(26)]) {
    assert.equal((await projectAuthoringNavigation({ captureUtf8: raw, expectedCaptureSha256: await programSha256(raw) })).status, 'invalid');
  }
});
test('caller mutation during asynchronous hashing cannot substitute source selection', async () => {
  const input = await syntheticNavigationInput(), expected = input.expectedCaptureSha256;
  const pending = projectAuthoringNavigation(input); input.captureUtf8 = '{}'; input.expectedCaptureSha256 = await programSha256('{}');
  const result = await pending; assert.equal(result.status, 'ready'); assert.equal(result.captureKey, expected);
});
