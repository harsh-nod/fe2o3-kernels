import { parseProgramJson } from './ordered-program-observation.mjs';
import { LinkedLineBytes, createLinkedLineReader } from './linked-region-line-reader.mjs';

export const LINKED_LINE_LIMITS = Object.freeze({ capsuleBytes: 262144, totalRawBytes: 131072,
  roles: 16, sourceBytes: 131072, llvmBytes: 65536, textBytes: 65536, elfBytes: 32768, cases: 2 });
export const LINKED_LINE_ROLES = Object.freeze(['acceptance', 'source', 'llvm', 'expected', 'pair', 'report',
  ...['O0', 'O3'].flatMap(level => [level + '_elf', level + '_verify_stdout', level + '_verify_stderr',
    level + '_line_stdout', level + '_line_stderr'])]);
const check = (v, m) => { if (!v) throw new Error(m); };
function keys(o, names) {
  check(o !== null && typeof o === 'object' && !Array.isArray(o) &&
    Object.keys(o).length === names.length && names.every(n => Object.hasOwn(o, n)), 'Unexpected linked-line fields.');
}
function same(a, b) {
  function canonical(v) {
    if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
    check(typeof v !== 'bigint' && !Object.is(v, -0), 'Inexact linked-line number.');
    return JSON.stringify(v);
  }
  check(canonical(a) === canonical(b), 'Linked-line identity or interval mismatch.');
}
function nat(n, cap) { check(Number.isSafeInteger(n) && !Object.is(n, -0) && n >= 0 && n <= cap, 'Linked-line extent exceeds bound.'); return n; }
function digest(s) { check(typeof s === 'string' && /^[0-9a-f]{64}$/u.test(s) && !/^0+$/u.test(s), 'Invalid linked-line digest.'); return s; }
function unicode(s, max) {
  check(typeof s === 'string' && s.length <= max, 'Linked-line text exceeds bound.');
  for (const point of s) { const n = point.codePointAt(0); check(n < 0xd800 || n > 0xdfff, 'Invalid linked-line Unicode.'); }
  return s;
}
function utf8(s, cap) { unicode(s, cap); const b = new LinkedLineBytes(new TextEncoder().encode(s)); nat(b.length, cap); return b; }
function freeze(o) { if (o && typeof o === 'object') { Object.values(o).forEach(freeze); Object.freeze(o); } return o; }
async function hash(bytes) {
  const out = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(out), b => b.toString(16).padStart(2, '0')).join('');
}
function copy(input, selected) {
  keys(input, ['bytes', 'sha256', 'utf8']);
  const expected = digest(selected), selectedSha = digest(input.sha256);
  check(expected === selectedSha, 'Selected linked-line capsule is stale.');
  const envelope = utf8(input.utf8, LINKED_LINE_LIMITS.capsuleBytes);
  check(envelope.length === nat(input.bytes, LINKED_LINE_LIMITS.capsuleBytes) && envelope.length > 0, 'Capsule byte extent changed.');
  const value = parseProgramJson(envelope.toString('utf8'), LINKED_LINE_LIMITS.capsuleBytes);
  keys(value, ['schema', 'provenance', 'records']);
  check(value.schema === 'fe2o3-linked-region-line-capsule-v1', 'Unsupported linked-line capsule.');
  same(value.provenance, { kind: 'retained_cpu_linked_line_observation', producer_authenticated: false,
    hardware_execution: false, launch_authority: false });
  check(Array.isArray(value.records) && value.records.length === LINKED_LINE_ROLES.length, 'Complete linked-line roster required.');
  let total = 0;
  const rows = value.records.map((r, index) => {
    keys(r, ['role', 'path', 'bytes', 'sha256', 'encoding', 'data']);
    check(r.role === LINKED_LINE_ROLES[index], 'Linked-line role order changed.');
    unicode(r.path, 4096); check(r.path.startsWith('/') && !r.path.includes('\0'), 'Invalid retained display path.');
    const binary = r.role.endsWith('_elf'), cap = binary ? LINKED_LINE_LIMITS.elfBytes
      : r.role === 'source' ? LINKED_LINE_LIMITS.sourceBytes : r.role === 'llvm' ? LINKED_LINE_LIMITS.llvmBytes : LINKED_LINE_LIMITS.textBytes;
    nat(r.bytes, cap); total += r.bytes; nat(total, LINKED_LINE_LIMITS.totalRawBytes);
    check(r.bytes > 0 || r.role.endsWith('_stderr'), 'Empty linked-line role.');
    check(r.encoding === (binary ? 'hex' : 'utf8'), 'Wrong linked-line encoding.');
    let bytes;
    if (binary) {
      check(typeof r.data === 'string' && r.data.length === 2 * r.bytes && /^[0-9a-f]+$/u.test(r.data), 'Invalid exact ELF hex.');
      bytes = new LinkedLineBytes(r.bytes);
      for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(r.data.slice(i * 2, i * 2 + 2), 16);
    } else {
      bytes = utf8(r.data, cap); check(bytes.length === r.bytes, 'Raw linked-line extent changed.');
    }
    return { role: r.role, path: r.path, bytes: r.bytes, sha256: digest(r.sha256), data: bytes };
  });
  // Every mutable caller primitive and decoded byte is private before hashing awaits.
  return { expected, envelope, rows };
}
export async function projectLinkedRegionLines(input, expectedCapsuleSha256) {
  try {
    const snapshot = copy(input, expectedCapsuleSha256);
    if (!globalThis.crypto?.subtle) return { status: 'unavailable', detail: 'WebCrypto unavailable; no linked-line rows shown.' };
    check(await hash(snapshot.envelope) === snapshot.expected, 'Linked-line capsule bytes changed.');
    const digests = new WeakMap(), byRole = Object.create(null);
    for (const row of snapshot.rows) {
      const observed = await hash(row.data);
      check(observed === row.sha256, 'Raw linked-line bytes changed: ' + row.role + '.');
      digests.set(row.data, observed); byRole[row.role] = row;
    }
    const reader = createLinkedLineReader(bytes => {
      check(digests.has(bytes), 'Unselected bytes requested by reader.'); return digests.get(bytes);
    });
    const bytes = role => byRole[role].data;
    const objects = {}, dumps = {};
    for (const level of ['O0', 'O3']) {
      objects[level] = bytes(level + '_elf'); dumps[level] = {};
      for (const kind of ['verify_stdout', 'verify_stderr', 'line_stdout', 'line_stderr']) dumps[level][kind] = bytes(level + '_' + kind);
    }
    const observed = reader.accept({ llvm: bytes('llvm'), expectedBytes: bytes('expected'),
      pairBytes: bytes('pair'), report: bytes('report'), objects, dumps });
    const retained = reader.json(bytes('acceptance'));
    keys(retained, [...Object.keys(observed), 'root_selected_inputs', 'read_accounting', 'normal_command_receipt_admission']);
    same(Object.fromEntries(Object.keys(observed).map(k => [k, retained[k]])), observed);
    const inputRoles = LINKED_LINE_ROLES.slice(2);
    keys(retained.root_selected_inputs, inputRoles);
    for (const role of inputRoles) {
      const row = byRole[role]; same(retained.root_selected_inputs[role], { path: row.path, bytes: row.bytes, sha256: row.sha256 });
    }
    keys(retained.read_accounting, ['reserved_content_plus_eof', 'read_calls']);
    same(retained.read_accounting.reserved_content_plus_eof, inputRoles.reduce((n, role) => n + byRole[role].bytes + 1, 0));
    check(nat(retained.read_accounting.read_calls, 4096) >= inputRoles.length, 'Read accounting cannot omit selected inputs.');
    check(retained.normal_command_receipt_admission === 'root prerequisite, not reconstructed by this pure output consumer', 'Unsupported command receipt claim.');
    same(observed.source_bytes, { bytes: byRole.source.bytes, sha256: byRole.source.sha256 });
    check(byRole.source.path === observed.span.display_path, 'Source file association changed.');
    const source = bytes('source').toString('utf8'), span = observed.span;
    // Recheck byte boundaries without confusing compiler file identity with a content hash.
    const prefix = new TextDecoder('utf-8', { fatal: true }).decode(bytes('source').subarray(0, span.byte_start));
    new TextDecoder('utf-8', { fatal: true }).decode(bytes('source').subarray(span.byte_start, span.byte_end));
    const lines = prefix.split('\n');
    check(lines.length === span.line && Array.from(lines[lines.length - 1]).length + 1 === span.column, 'Source line/column does not match the byte span.');
    return freeze({ status: 'ready', capsuleSha256: snapshot.expected, checkedArtifacts: snapshot.rows.length,
      source, sourceSha256: observed.source_bytes.sha256, canonical: observed.canonical,
      llvmSha256: observed.llvm.sha256, sourceIdentity: observed.source_identity, coordinate: observed.kir_site,
      span: observed.span, cases: observed.cases, target: 'gfx942:xnack-', scenario: 'edited',
      wholeRegionOnly: true, runtimeAddress: false, hardwareExecution: false, producerAuthenticated: false,
      interpretation: 'Retained CPU-linked whole-region line coverage; not runtime addresses or per-instruction source attribution.' });
  } catch (error) {
    return { status: 'invalid', detail: error instanceof Error ? error.message.slice(0, 240) : 'Invalid linked-line evidence.' };
  }
}
