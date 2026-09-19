import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, statSync } from 'node:fs';
import { parseProgramJson, projectOrderedProgramObservation, programSha256, PROGRAM_CAPTURE_LIMIT } from '../../src/content/ordered-program-observation.mjs';
import { exact, syntheticProgramCapture, inputForCapture, syntheticProgramInput } from './fixtures/ordered-program-observation-fixture.mjs';
import { selectedProgramPairs } from '../export-ordered-program-observation.mjs';

test('retained public capture binds exact receipts and independently checks all 36 observed logical results', async () => {
  const filename = new URL('../../examples/ordered_program_observation_v1.json', import.meta.url);
  assert.equal(statSync(filename).size, 941567);
  const captureUtf8 = readFileSync(filename, 'utf8');
  const expectedCaptureSha256 = '6ae5be6ed1843aff7c84ab9d57cb5bee740d44c5f2ec254baa5270eb46fce468';
  const capture = parseProgramJson(captureUtf8);
  assert.equal(capture.sourceReceiptSha256, 'e0efff8694beb6e9decebe3f95f5ba0940aecdc63e06dc58941ef985401dde9f');
  assert.equal(capture.aggregateReceiptSha256, '7b61dfb1f581830779da2352afbcf3589b437f6d62dd3653abf7809201167893');
  const result = await projectOrderedProgramObservation({ captureUtf8, expectedCaptureSha256 });
  assert.equal(result.status, 'ready'); assert.equal(result.kind, 'retained_public_diagnostic');
  assert.equal(result.variants.length, 6);
  const cases = [[0, 0, 0], [4294967295, 0, 1], [4294967295, 1, 2], [2147483648, 0, 2147483648], [2863289685, 1431677610, 19], [19, 23, 42]];
  const bits = value => '0x' + value.toString(16).padStart(8, '0');
  const u32 = value => BigInt.asUintN(32, value);
  let sessions = 0;
  for (const variant of result.variants) {
    assert.equal(variant.cases.length, 6);
    for (const observed of variant.cases) {
      const inputs = cases[observed.index], [a, b, c] = inputs.map(BigInt);
      // Independent source arithmetic, not descriptor execution or displayed intermediate values.
      let out = (a ^ b) & c;
      out = u32(u32((out | b) + c) - a);
      out = ((out ^ b) | a) & c;
      const sixteen = u32(u32(out + a) - b) ^ c;
      const expected = { one: a, three: b ^ ((a ^ b) & c), sixteen }[variant.profile];
      const [before, after, reverse, repeat] = observed.checkpoints;
      assert.deepEqual(before.values.slice(0, 3).map(value => value.bits), inputs.map(value => bits(BigInt(value))));
      assert.equal(before.values[3].reason, 'not_in_scope');
      assert.equal(after.values[0].bits, bits(expected));
      assert.deepEqual(reverse.values, before.values.slice(0, 3));
      assert.deepEqual(repeat.values, after.values);
      assert.equal(before.anchor.cursor.event_sequence, reverse.anchor.cursor.event_sequence);
      assert.notEqual(before.anchor.cursor.state_revision, reverse.anchor.cursor.state_revision);
      assert.equal(after.anchor.cursor.event_sequence, repeat.anchor.cursor.event_sequence);
      assert.notEqual(after.anchor.cursor.state_revision, repeat.anchor.cursor.state_revision);
      assert.equal(before.anchor.scope.active_mask, 0xffffffffffffffffn);
      assert.equal(before.anchor.scope.lane, 0);
      assert.equal(before.anchor.site.source.status, 'unavailable');
      sessions++;
    }
  }
  assert.equal(sessions, 36);
});

test('lossless parser preserves full u64, distinguishes strings, and rejects malformed/duplicate/unbounded JSON', () => {
  const value = parseProgramJson('{"mask":18446744073709551615,"text":"18446744073709551615","small":0}');
  assert.equal(value.mask, 0xffffffffffffffffn); assert.equal(value.text, '18446744073709551615'); assert.equal(value.small, 0);
  for (const raw of ['{"a":1,"a":2}', '{"a":1,"\\u0061":2}', '{"n":1e3}', '{"n":-1}', '{"n":1.5}', '{"n":01}', '{"n":18446744073709551616}', '[1,]', '{"a":true,}', 'null true', '"\\ud800"', ' '.repeat(PROGRAM_CAPTURE_LIMIT + 1), '['.repeat(26) + '0' + ']'.repeat(26)]) assert.throws(() => parseProgramJson(raw), raw.slice(0, 100));
});
test('synthetic fixture projects 6 variants, 36 distinct lane-zero sessions and real parsed phase values only', async () => {
  const input = await syntheticProgramInput(), result = await projectOrderedProgramObservation(input);
  assert.equal(result.status, 'ready'); assert.equal(result.kind, 'synthetic_test_only'); assert.equal(result.variants.length, 6);
  assert.deepEqual(result.variants.map(v => v.steps.length), [1, 1, 3, 3, 16, 16]);
  const checkpoints = result.variants[0].cases[0].checkpoints;
  assert.deepEqual(checkpoints.map(p => [p.anchor.cursor.event_sequence, p.anchor.cursor.state_revision]), [[3, 2], [4, 3], [3, 4], [4, 5]]);
  assert.equal(checkpoints[0].values[0].bits, '0x00000000'); assert.equal(checkpoints[0].values[3].status, 'unavailable');
  assert.equal(checkpoints[1].values.length, 1); assert.equal(checkpoints[2].values.length, 3);
  assert.equal(checkpoints[0].anchor.scope.active_mask, 0xffffffffffffffffn); assert(Object.isFrozen(checkpoints));
});
test('missing capture, changed pins, oversize content and missing hashing never retain a ready projection', async () => {
  assert.equal((await projectOrderedProgramObservation(null)).status, 'unavailable');
  const input = await syntheticProgramInput();
  assert.equal((await projectOrderedProgramObservation({ ...input, expectedCaptureSha256: 'f'.repeat(64) })).status, 'invalid');
  assert.equal((await projectOrderedProgramObservation({ ...input, captureUtf8: ' '.repeat(PROGRAM_CAPTURE_LIMIT + 1) })).status, 'invalid');
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  try { Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true }); assert.equal((await projectOrderedProgramObservation(input)).status, 'unavailable'); }
  finally { Object.defineProperty(globalThis, 'crypto', descriptor); }
});
const mutations = [
  ['physical authority', c => { c.authority = 'launch'; }],
  ['reused variant', c => { c.variants[1] = c.variants[0]; }],
  ['missing request case', c => { c.variants[0].cases.pop(); }],
  ['reused configuration', c => { c.variants[0].cases[1] = c.variants[0].cases[0]; }],
  ['changed inspection hash', c => { c.variants[0].inspectionUtf8 = c.variants[0].inspectionUtf8.replace('NoMemory', 'Memory'); }],
];
for (const [name, mutation] of mutations) test(`rejects ${name}`, async () => {
  const capture = syntheticProgramCapture(); mutation(capture); assert.equal((await projectOrderedProgramObservation(await inputForCapture(capture))).status, 'invalid');
});
const responseMutations = [
  ['wrong request ID', r => { r.request_id = 999; }], ['foreign configuration', r => { r.session.configuration_identity = 'f'.repeat(64); }],
  ['stale revision', r => { r.result.snapshot.cursor.state_revision++; }], ['another lane', r => { r.result.snapshot.scope.lane = 1; }],
  ['rounded active mask', r => { r.result.snapshot.scope.active_mask = 18446744073709551614n; }], ['wave32 relabel', r => { r.result.snapshot.scope.wave_width = 32; }],
  ['wrong SSA path', r => { r.result.values[0].path.root.value_ordinal = 8; }], ['wrong type', r => { r.result.values[0].availability.value_type.bits = 64; }],
  ['fabricated provenance', r => { r.result.values[0].availability.provenance = 'hardware'; }], ['truncated values', r => { r.result.values.pop(); }],
  ['extra future page', r => { r.result.next_cursor = 'next'; }], ['source upgrade', r => { r.result.snapshot.site.source = { status: 'resolved' }; }],
  ['result changed against reverse', r => { r.result.values[0].availability.value.bits = '0xffffffff'; }],
];
for (const [name, mutation] of responseMutations) test(`rejects ${name}`, async () => {
  const capture = syntheticProgramCapture(), pair = capture.variants[0].cases[0].pairs[1], response = parseProgramJson(pair.responseUtf8); mutation(response); pair.responseUtf8 = exact(response);
  assert.equal((await projectOrderedProgramObservation(await inputForCapture(capture))).status, 'invalid');
});
test('descriptor order, padding and repeated steps are checked against declaration, not executed to invent observations', async () => {
  for (const mutate of [v => { v.declared_program.descriptors[15] = 8; }, v => { v.declared_instruction_steps[0].output = 32; }, v => { v.instruction_microsteps_available = true; }, v => { v.register_plan.inputs[0] = 32; }]) {
    const capture = syntheticProgramCapture(), row = capture.variants[0], view = parseProgramJson(row.inspectionUtf8); mutate(view); row.inspectionUtf8 = exact(view);
    assert.equal((await projectOrderedProgramObservation(await inputForCapture(capture))).status, 'invalid');
  }
});
test('input snapshot is captured before asynchronous hashing', async () => {
  const input = await syntheticProgramInput(), original = input.captureUtf8, pending = projectOrderedProgramObservation(input); input.captureUtf8 = '{}'; input.expectedCaptureSha256 = await programSha256('{}');
  const result = await pending; assert.equal(result.status, 'ready'); assert.equal(result.captureKey, await programSha256(original));
});
test('exporter preserves exact selected lines and pairs requests with responses', () => {
  const pairs = syntheticProgramCapture().variants[0].cases[0].pairs;
  const streams = { request: [], response: [] };
  for (let id = 1; id <= 17; id++) {
    const pair = pairs.find(item => parseProgramJson(item.requestUtf8).request_id === id);
    for (const kind of ['request', 'response']) streams[kind].push(pair ? pair[kind + 'Utf8'] : JSON.stringify({ request_id: id, operation: 'synthetic_unused_control' }));
  }
  const requests = streams.request.join('\n') + '\n', responses = streams.response.join('\n') + '\n';
  assert.deepEqual(selectedProgramPairs(requests, responses, 17), pairs);
  assert.throws(() => selectedProgramPairs(requests, responses.slice(0, -1), 17));
  assert.throws(() => selectedProgramPairs(requests, responses, 18));
  assert.throws(() => selectedProgramPairs(requests, responses.replace('"request_id":1,', '"request_id":2,'), 17));
  assert.throws(() => selectedProgramPairs('x'.repeat(1048577), responses, 17));
});
