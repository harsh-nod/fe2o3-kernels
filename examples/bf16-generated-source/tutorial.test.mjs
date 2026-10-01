// Inert lesson/content checks only. No compiler, simulator or child process runs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

const compiler = '254eb55f43aabc40b627d5dca2e80725b52ac599';
const pins = [
  ['original.rs', 3950, 'fcb26135ad4f931bb8dda63d631639a34dd8461e7801c22a1f6a383e0e735a3e'],
  ['identity.rs', 4381, 'cf90e7f1e7f7031bc4845af0f80d52423d5c6e5e56c06e7e487953e30faa785d'],
  ['swap01.rs', 4377, 'f6a51a0d339eeae1c1aebeebb4e87bb44244a9a1f22dccc7412ae300148dfd86'],
];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const load = name => fs.readFileSync(new URL(name, import.meta.url));
const matches = (bytes, pin) => bytes.length === pin[1] && digest(bytes) === pin[2];
const lesson = () => fs.readFileSync(new URL('../../docs/bf16-generated-source-promotion-v1.md', import.meta.url), 'utf8');
const active = bytes => bytes.toString('utf8').split('// Statement-level')[0];

test('all three source files retain the exact audited bytes', () => {
  for (const pin of pins) assert(matches(load(pin[0]), pin), pin[0]);
});

test('source pin checks reject truncation extra bytes and one-byte mutation', () => {
  for (const pin of pins) {
    const bytes = load(pin[0]);
    const changed = Buffer.from(bytes);
    changed[0] ^= 1;
    for (const candidate of [bytes.subarray(1), Buffer.concat([bytes, Buffer.from('\n')]), changed]) {
      assert.equal(matches(candidate, pin), false, pin[0]);
    }
  }
});

test('published helpers preserve the matrix expression and expose the selected Return order', () => {
  const original = active(load('original.rs'));
  assert(!original.includes('fn __fe2o3_bf16_tile_'));
  assert(original.includes('let result = matrix\n        .multiply_accumulate(lhs, rhs, accumulator)\n        .into_values();'));
  for (const [name, order] of [
    ['identity', '[values[0], values[1], values[2], values[3]]'],
    ['swap01', '[values[1], values[0], values[2], values[3]]'],
  ]) {
    const source = active(load(name + '.rs'));
    assert(source.includes('#[inline(never)]\n    fn __fe2o3_bf16_tile_' + name + "<'wave>("));
    for (const argument of [
      'matrix: &::fe2o3_device::DeviceMatrix',
      "lhs: ::fe2o3_device::Bf16MfmaAFragment<'wave>",
      "rhs: ::fe2o3_device::Bf16MfmaBFragment<'wave>",
      "accumulator: ::fe2o3_device::F32AccumulatorFragment<'wave>",
    ]) assert(source.includes(argument), argument);
    assert(source.includes('let values = matrix.multiply_accumulate(lhs, rhs, accumulator).into_values();'));
    assert(source.includes(order));
    assert(source.includes('let result = __fe2o3_bf16_tile_' + name + '(&matrix, lhs, rhs, accumulator);'));
    assert.equal((source.match(/fn __fe2o3_bf16_tile_/g) ?? []).length, 1);
  }
});

test('source copies retain the sole active component-zero store and disabled alternate root', () => {
  const original = load('original.rs');
  const marker = Buffer.from('// Statement-level');
  const at = original.indexOf(marker);
  assert(at > 0);
  const tail = original.subarray(at);
  for (const [name] of pins) {
    const bytes = load(name), source = active(bytes);
    assert.equal((source.match(/\*output = result\[0\];/g) ?? []).length, 1);
    assert(!/\*output = result\[[123]\];/.test(source));
    assert(source.includes('out.get_mut(thread::index_1d())'));
    assert(source.includes('max_grid = [1, 1, 1]'));
    assert(bytes.subarray(bytes.length - tail.length).equals(tail), name);
  }
});

test('lesson links the exact implementation and all three local source files', () => {
  const text = lesson();
  assert(text.includes('https://github.com/harsh-nod/fe2o3/commit/' + compiler));
  for (const [name] of pins) assert(text.includes('../examples/bf16-generated-source/' + name));
  assert(!/COMPILER_COMMIT_PENDING|TODO_COMMIT|PLACEHOLDER/.test(text));
  assert(text.includes('(bf16-helper-source-cpu-observation-v1.md)'));
});

test('lesson preserves finite CPU counts and public driver and normal-route gaps', () => {
  const text = lesson().replace(/\s+/g, ' ');
  for (const claim of [
    '12 supervised child processes and four actual compiler sessions',
    '72 positives and 64 refusals',
    '105,440-byte',
    'not a complete GEMM output kernel',
    'private supervised parent',
    'public end-to-end driver remains a gap',
    'BF16 nominal source-ranked projection',
    'whole-action memory bounds or milestone completion',
  ]) assert(text.includes(claim), claim);
  assert(text.includes('GPU launch'));
  assert(text.includes('not general BF16 rounding or hardware execution'));
});

test('documented commands are only local content tests and nonignored focused compiler units', () => {
  const commands = [...lesson().matchAll(/~~~bash\n([\s\S]*?)\n~~~/g)].map(match => match[1]);
  assert.equal(commands.length, 2);
  assert.equal(commands[0], 'node --test examples/bf16-generated-source/tutorial.test.mjs');
  assert(commands[1].includes('cargo +nightly-2026-04-03 test --offline --locked -j2'));
  assert(commands[1].includes('-p rustc-codegen-fe2o3 --lib gfx942_bf16_generated'));
  for (const command of commands) {
    assert(!command.includes('--ignored'));
    assert(!command.includes('run.mjs'));
    assert(!command.includes('FE2O3_'));
    assert(!command.includes(' install '));
  }
});
