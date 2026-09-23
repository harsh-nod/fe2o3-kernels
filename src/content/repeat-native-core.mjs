// Private implementation helpers for the closed repeat-native observation profile.
// No I/O, compiler session, runtime state, decoder or authority is supplied.
export const LABELS = Object.freeze(['one', 'two', 'fifteen', 'repeat']);
export const COUNTS = Object.freeze([1, 2, 15, 15]);
export const OPTS = Object.freeze(['O0', 'O3']);
export const PLAN = Object.freeze([32, 33, 34, 35, 36]);
export const CONSTRAINTS = '=&{v33},{v34},{v35},{v36},~{v32}';
export const LLVM_BUILD = 'rocm7.2.1-packages-sha256:eb02c62693d6697017195f0abf5ebcf7e58f60e4d2acf8356de2e944bceec540';
export function check(ok, message = 'Repeat-native observations disagree.') { if (!ok) throw new Error(message); }
export function keys(value, fields) {
  check(value && typeof value === 'object' && !Array.isArray(value), 'Expected repeat-native object.');
  check(Object.keys(value).length === fields.length && fields.every(field => Object.hasOwn(value, field)), 'Unexpected repeat-native fields.');
  return value;
}
export function rows(value, count) {
  check(Array.isArray(value) && value.length === count &&
    Array.from({ length: count }, (_, at) => Object.hasOwn(value, at)).every(Boolean), 'Exact repeat-native roster required.');
  return value;
}
export function bounded(value, maximum, minimum = 0) {
  check(Array.isArray(value) && value.length >= minimum && value.length <= maximum, 'Repeat-native roster exceeds bounds.');
  return rows(value, value.length);
}
export function integer(value, maximum = 0xffffffff, minimum = 0) {
  check(Number.isSafeInteger(value) && value >= minimum && value <= maximum, 'Invalid repeat-native integer.'); return value;
}
export function text(value, cap, minimum = 0) {
  check(typeof value === 'string' && value.length <= cap && value.length >= minimum, 'Repeat-native text exceeds bounds.');
  for (const point of value) { const code = point.codePointAt(0); check(code < 0xd800 || code > 0xdfff, 'Invalid retained Unicode.'); }
  check(new TextEncoder().encode(value).length <= cap, 'Repeat-native UTF-8 exceeds bounds.'); return value;
}
export function digest(value) { check(typeof value === 'string' && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value), 'Invalid repeat-native digest.'); return value; }
export function absolute(value) {
  text(value, 4096, 1);
  check(value.startsWith('/') && !value.endsWith('/') && !/[\u0000-\u001f\u007f]/u.test(value) &&
    value.slice(1).split('/').every(part => part !== '' && part !== '.' && part !== '..'), 'Noncanonical retained path label.');
  return value;
}
export function stable(value) {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
export function same(a, b, message) { check(stable(a) === stable(b), message); }
export function flags(value, fields) { for (const name of fields) check(value[name] === false, 'Unsupported authority claim: ' + name); }
export function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
export async function sha256(bytes) {
  const result = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(result), byte => byte.toString(16).padStart(2, '0')).join('');
}
export const hex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
export function unhex(value) {
  const result = new Uint8Array(value.length / 2);
  for (let at = 0; at < result.length; at++) result[at] = Number.parseInt(value.slice(2 * at, 2 * at + 2), 16);
  return result;
}
export function pin(value) {
  keys(value, ['path', 'bytes', 'sha256', 'device', 'inode', 'mode', 'nlink', 'mtime_ns', 'ctime_ns']);
  absolute(value.path); integer(value.bytes, 536870912); digest(value.sha256);
  for (const key of ['device', 'inode', 'mode', 'nlink', 'mtime_ns', 'ctime_ns'])
    check(typeof value[key] === 'string' && /^(?:0|[1-9][0-9]{0,23})$/u.test(value[key]), 'Invalid retained file metadata.');
  return value;
}
export function ledger(value, maximum, cap, expectedBytes) {
  const result = new Map(); let total = 0;
  for (const item of bounded(value, maximum, 1)) {
    pin(item); check(!result.has(item.path), 'Duplicate retained path.');
    total += item.bytes; integer(total, cap); result.set(item.path, item);
  }
  check(total === expectedBytes, 'Retained ledger accounting differs.'); return result;
}
export function matchArtifact(artifact, expected) {
  check(artifact.bytes === expected.bytes && artifact.sha256 === expected.sha256, 'Selected whole artifact is stale or substituted.');
}
export function requirePin(pins, path, artifact) {
  absolute(path); const got = pins.get(path); check(got, 'Selected artifact missing from retained ledger.'); matchArtifact(artifact, got); return got;
}
export function receiptRoot(artifact) {
  check(artifact.path.endsWith('/receipt.json'), 'Expected receipt path label.'); return artifact.path.slice(0, -13);
}
export function count(value) { check([1, 2, 15].includes(value), 'Unsupported repeat count.'); return value; }
export function declaredProgram(value) { count(value); return { count: value + 1, descriptors: [8, ...Array(value).fill(201), ...Array(15 - value).fill(0)] }; }
export function declaredSteps(value) {
  count(value); return [{ instruction: 'v_mov_b32_e32', output: 33, inputs: [34] },
    ...Array.from({ length: value }, () => ({ instruction: 'v_add_u32_e32', output: 33, inputs: [33, 35] }))];
}
export const EMIT_FALSE = ['source_authentication', 'compiler_closure_attestation', 'proof_authority',
  'protected_admission', 'final_artifact_authority', 'production_resume', 'physical_register_values', 'hardware_execution'];
export const SOURCE_FALSE = ['runtime_loop_or_schedule_added', 'native_qualified', 'source_authentication',
  'compiler_closure_attestation', 'protected_proof', 'production_resume', 'hardware_observed', 'physical_register_lifetime_proof', 'milestone_completion'];
export const NATIVE_FALSE = ['prefix_source_admitted', 'production_exact_program_admission', 'protected_finalizer_admission',
  'artifact_authority', 'source_authentication', 'compiler_closure_attestation', 'hardware_execution', 'native_whole_kernel_correctness',
  'physical_register_allocation_or_lifetime_proof', 'whole_kernel_order_or_byte_stability_claim'];
export const STAGE_KEYS = ['label', 'executable', 'args', 'code', 'signal', 'reason', 'elapsed_ms', 'stdout_bytes', 'stdout_sha256', 'stderr_bytes', 'stderr_sha256'];
export function stage(value, label, code, ms, streamCap) {
  keys(value, STAGE_KEYS); check(value.label === label && value.code === code && value.signal === null && value.reason === null, 'Unsuccessful or relabeled retained stage.');
  absolute(value.executable); bounded(value.args, 32).forEach(arg => text(arg, 4096));
  integer(value.elapsed_ms, ms);
  for (const stream of ['stdout', 'stderr']) { integer(value[stream + '_bytes'], streamCap); digest(value[stream + '_sha256']); }
}
