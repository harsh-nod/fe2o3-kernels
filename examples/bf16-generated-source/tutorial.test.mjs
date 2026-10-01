// Inert lesson/content checks only. No compiler, simulator or child process runs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {makeRequest, readInspection, writeRequest, REPORT_LIMIT, REQUEST_LIMIT} from './make-request.mjs';

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

test('lesson separates earlier CPU evidence public source action and normal-route gaps', () => {
  const text = lesson().replace(/\s+/g, ' ');
  for (const claim of [
    '12 supervised child processes and four actual compiler sessions',
    '72 positives and 64 refusals',
    '105,440-byte',
    'not a complete GEMM output kernel',
    'private supervised parent',
    'public source-only driver',
    '13 supervised processes',
    '36 positive CPU requests and 32 expected CPU refusals',
    'nine-process cohort',
    'not a public CPU replay command',
    'BF16 nominal source-ranked projection',
    'whole-action memory bounds or milestone completion',
  ]) assert(text.includes(claim), claim);
  assert(text.includes('GPU launch'));
  assert(text.includes('not general BF16 rounding or hardware execution'));
});

test('documented public commands require fresh selection and no private adapter', () => {
  const text = lesson();
  assert(text.includes('https://github.com/harsh-nod/fe2o3/commit/89e06d9619ef89302e1399906b293a86f6f4d6ad'));
  assert(text.includes('https://github.com/harsh-nod/fe2o3/blob/main/docs/bf16-source-authoring.md'));
  assert(text.includes('FE2O3_EXTRACT_BF16_TILE_SOURCE_DIRECTORY_V1'));
  assert(text.includes('FE2O3_EXTRACT_BF16_TILE_PROMOTION_REQUEST_V1'));
  for (const command of [...text.matchAll(/~~~bash\n([\s\S]*?)\n~~~/g)].map(m => m[1])) {
    assert(!command.includes('--ignored'));
    assert(!command.includes('run.mjs'));
    assert(!command.includes('FE2O3_BF16_GENERATED_CONFIG_V1'));
    assert(!command.includes('/home/'));
  }
  for (const value of ['candidate_compiled: false', 'fresh_compilation_required: true', 'may_have_created_candidate', 'not reusable current requests']) assert(text.includes(value));
});

const inspectionExample = () => JSON.parse(load('public-inspection.example.json'));
test('copied public example data pins remain distinct from exact original wire', () => {
  const evidence = JSON.parse(load('public-evidence.json'));
  assert.equal(evidence.schema, 'fe2o3-bf16-public-source-tutorial-evidence-v1');
  assert.equal(evidence.implementation_commit, '89e06d9619ef89302e1399906b293a86f6f4d6ad');
  for (const row of evidence.examples) {
    const bytes = load(row.file);
    assert.equal(bytes.length, row.published_example.bytes);
    assert.equal(digest(bytes), row.published_example.sha256);
    assert.notEqual(row.published_example.sha256, row.original_record.sha256);
    assert(row.transform.includes('not exact original wire'));
  }
});
test('public evidence keeps positive negative and historical cohorts distinct', () => {
  const evidence = JSON.parse(load('public-evidence.json'));
  assert.deepEqual([evidence.positive.totals.direct_children, evidence.positive.totals.public_cli_calls, evidence.positive.totals.positive_cpu_requests, evidence.positive.totals.negative_cpu_requests], [13, 3, 36, 32]);
  assert.deepEqual([evidence.negative.totals.direct_children, evidence.negative.totals.public_cli_calls, evidence.negative.totals.expected_cli_refusals], [9, 5, 4]);
  assert.equal(evidence.positive.totals.raw_sidecar_bytes, 210880);
  assert.deepEqual(evidence.limits.milestones_closed, []);
  for (const [key, value] of Object.entries(evidence.limits)) if (key !== 'milestones_closed') assert.equal(value, false);
  for (const row of evidence.source_candidates) assert(matches(load(row.order + '.rs'), [row.order, row.bytes, row.sha256]));
});
test('fresh selectors produce exact complete Identity and Swap01 example shape', () => {
  for (const order of ['identity', 'swap01']) {
    const bytes = makeRequest(inspectionExample(), order);
    assert(bytes.equals(load('public-' + order + '-request.example.json')));
    assert(bytes.length <= REQUEST_LIMIT);
    const request = JSON.parse(bytes);
    assert.deepEqual(Object.keys(request).sort(), ['schema', 'semantic_sha256', 'canonical_sha256', 'mir_sha256', 'original_sha256', 'original_path', 'candidate_path', 'helper_name', 'return_order'].sort());
    assert.equal(request.canonical_sha256, inspectionExample().selection.canonical_sha256);
  }
});
test('request helper rejects failure authority and digest-domain substitutions', () => {
  for (const [field, value] of [['status', 'failed'], ['mode', 'promote'], ['source_postflight_ok', false], ['candidate_compiled', true], ['hardware_observed', true], ['memory_measurement', 'passed'], ['canonical_digest_domain', 'sha256_serialized_bytes']]) {
    const report = inspectionExample();
    report[field] = value;
    assert.throws(() => makeRequest(report, 'identity'));
  }
});
test('request helper is limited to this source and two exact return orders', () => {
  for (const order of ['', 'Identity', 'other', '../file']) assert.throws(() => makeRequest(inspectionExample(), order));
  for (const field of ['semantic_sha256', 'canonical_sha256', 'mir_sha256', 'original_sha256']) {
    const report = inspectionExample();
    report.selection[field] = '0'.repeat(64);
    assert.throws(() => makeRequest(report, 'identity'));
  }
  const changed = inspectionExample();
  changed.selection.original_bytes++;
  assert.throws(() => makeRequest(changed, 'identity'));
  changed.selection.original_bytes--;
  changed.selection.original_sha256 = 'a'.repeat(64);
  assert.throws(() => makeRequest(changed, 'identity'));
});
test('copying changed nonzero selectors does not authenticate their currentness', () => {
  const report = inspectionExample();
  report.selection.mir_sha256 = 'a'.repeat(64);
  assert.equal(JSON.parse(makeRequest(report, 'identity')).mir_sha256, 'a'.repeat(64));
  // The genuine publisher, not this inert builder, must refuse stale selectors.
});
function withTemporaryDirectory(operation) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fe2o3-public-request-'));
  try { operation(directory); } finally { fs.rmSync(directory, {recursive: true, force: true}); }
}
test('bounded report reader admits exact extent and rejects extra empty and malformed bytes', {skip: process.platform !== 'linux'}, () => {
  withTemporaryDirectory(directory => {
    const file = path.join(directory, 'inspection.json');
    const exact = Buffer.alloc(REPORT_LIMIT, 32);
    load('public-inspection.example.json').copy(exact);
    fs.writeFileSync(file, exact);
    assert.equal(readInspection(file).status, 'inspected');
    for (const bytes of [Buffer.alloc(0), Buffer.alloc(REPORT_LIMIT + 1, 32), Buffer.from([255]), Buffer.from('{')]) {
      fs.writeFileSync(file, bytes);
      assert.throws(() => readInspection(file));
    }
  });
});
test('report reader refuses nonregular files and symlink basenames', {skip: process.platform !== 'linux'}, () => {
  withTemporaryDirectory(directory => {
    const file = path.join(directory, 'inspection.json'), link = path.join(directory, 'link.json');
    fs.writeFileSync(file, load('public-inspection.example.json'));
    fs.symlinkSync(file, link);
    assert.throws(() => readInspection(link));
    assert.throws(() => readInspection(directory));
  });
});
test('request writer creates once with private permissions and never replaces a file', {skip: process.platform !== 'linux'}, () => {
  withTemporaryDirectory(directory => {
    const file = path.join(directory, 'request.json'), bytes = makeRequest(inspectionExample(), 'identity');
    writeRequest(file, bytes);
    const before = fs.statSync(file, {bigint: true});
    assert.equal(Number(before.mode) & 0o077, 0);
    assert.throws(() => writeRequest(file, makeRequest(inspectionExample(), 'swap01')));
    const after = fs.statSync(file, {bigint: true});
    assert.equal(after.ino, before.ino);
    assert(fs.readFileSync(file).equals(bytes));
    assert.throws(() => writeRequest(path.join(directory, 'empty.json'), Buffer.alloc(0)));
    assert.throws(() => writeRequest(path.join(directory, 'large.json'), Buffer.alloc(REQUEST_LIMIT + 1)));
  });
});

test('public Cargo lesson binds the published implementation and keeps earlier evidence separate', () => {
  const text = lesson();
  const evidence = JSON.parse(load('cargo-evidence.json'));
  assert.equal(evidence.schema, 'fe2o3-bf16-cargo-tutorial-evidence-v1');
  assert.equal(evidence.implementation_commit, 'd125dd02b91f60756c052f5d9f734d24731765cc');
  assert(text.includes('/commit/' + evidence.implementation_commit));
  assert(text.includes('scripts/bf16-source-workflow.mjs'));
  for (const option of ['--repo', '--extractor', '--cargo', '--rustc', '--work', '--deadline'])
    assert(text.includes(option));
  assert(text.includes('cargo-evidence.json'));
  assert.equal(JSON.parse(load('public-evidence.json')).implementation_commit,
    '89e06d9619ef89302e1399906b293a86f6f4d6ad');
});
test('Cargo evidence has five actual actions and two exact freshly admitted candidate orders', () => {
  const e = JSON.parse(load('cargo-evidence.json'));
  assert.deepEqual(e.actions, ['inspect', 'publish-identity', 'publish-swap01', 'admit-identity', 'admit-swap01']);
  assert.equal(e.source_publications, 2);
  assert.equal(e.fresh_nominal_source_admissions, 2);
  for (const [index, order] of ['identity', 'swap01'].entries()) {
    const row = e.candidates[index];
    assert.equal(row.order, order);
    assert(matches(load(order + '.rs'), [order, row.bytes, row.sha256]));
    assert.deepEqual(row.return_permutation, index === 0 ? [0, 1, 2, 3] : [1, 0, 2, 3]);
  }
});
test('Cargo evidence does not promote source inspection to executable qualification', () => {
  const e = JSON.parse(load('cargo-evidence.json'));
  assert.equal(e.normal_ranked_refusal, 'BF16 nominal source-ranked projection');
  assert.equal(e.normal_ranked_admissions, 0);
  assert.equal(e.kernel_artifacts, 0);
  for (const flag of ['cpu_numerical_replay', 'native_execution', 'complete_runtime_census',
    'whole_compiler_memory_bound', 'unprovisioned_clean_checkout'])
    assert.equal(e[flag], false);
  assert.deepEqual(e.milestones_closed, []);
  assert.equal(e.extractor_profile, 'debug');
  for (const p of [e.outer_receipt, e.root_audit, e.workflow_report]) {
    assert(Number.isSafeInteger(p.bytes) && p.bytes > 0);
    assert.match(p.sha256, /^[0-9a-f]{64}$/);
  }
});
test('Cargo lesson states current request cwd, fresh reports and outer-supervisor boundary', () => {
  const text = lesson().replace(/\s+/g, ' ');
  for (const value of ['original_path: "src/lib.rs"', 'different working directory',
    'previously absent report', 'outer supervisor', 'inherited process group',
    'no CPU numerical replay', 'debug build', 'whole-compiler memory limits'])
    assert(text.includes(value), value);
});
