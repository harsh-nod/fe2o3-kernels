// Separate versioned retained profile. Old final-native capsule/parser defaults are unchanged.
import { parseProgramJson } from './ordered-program-observation.mjs';
import { check, keys, rows, integer, text, digest, absolute, freeze, sha256, unhex, LABELS, OPTS } from './repeat-native-core.mjs';
import { assertRepeatNativeOuterText, repeatNativeEnvelopeBytes } from './repeat-native-envelope.mjs';
import { validateRepeatSourceJoin } from './repeat-native-source.mjs';
import { validateRepeatNativeJoin } from './repeat-native-machine.mjs';

export const REPEAT_NATIVE_LIMITS = Object.freeze({ chunkBytes: 65536, receiptBytes: 524288,
  artifactBytes: 65536, totalBytes: 2097152, outerBytes: 4194304, artifacts: 23, payloads: 8 });
const RECEIPTS = ['sourceReceipt', 'llvmReceipt', 'join'];
const ROSTER = Object.freeze([...RECEIPTS,
  ...LABELS.map(label => 'source/' + label), ...LABELS.map(label => 'llvm/' + label),
  ...LABELS.map(label => 'report/' + label), ...LABELS.flatMap(label => OPTS.map(opt => 'payload/' + label + '/' + opt))]);

/** Copies primitive chunks before async work. Checks all length budgets before any reassembly. */
export function copyRepeatNativeEvidence(input) {
  if (typeof input === 'string') assertRepeatNativeOuterText(input);
  const value = typeof input === 'string' ? parseProgramJson(input, REPEAT_NATIVE_LIMITS.outerBytes) : input;
  keys(value, ['schema', 'provenance', 'artifacts']);
  check(value.schema === 'fe2o3-repeat-native-comparison-example-v1', 'Unsupported repeat-native capsule.');
  const p = keys(value.provenance, ['capture_name', 'kind', 'producer_authenticated', 'qualified_release_pin']);
  check(['retained_source_native_observation', 'synthetic_test_only'].includes(p.kind) &&
    p.producer_authenticated === false && p.qualified_release_pin === null, 'Unsupported repeat-native provenance.');
  let total = 0;
  const artifacts = rows(value.artifacts, 23).map((raw, index) => {
    keys(raw, ['role', 'path', 'sha256', 'bytes', 'encoding', 'chunks']);
    const role = ROSTER[index], payload = role.startsWith('payload/'), cap = RECEIPTS.includes(role) ? 524288 : 65536;
    check(raw.role === role && raw.encoding === (payload ? 'hex' : 'utf8'), 'Repeat-native artifact roster or encoding changed.');
    const bytes = integer(raw.bytes, cap, 1); total += bytes; check(total <= 2097152, 'Repeat-native total artifact cap exceeded.');
    check(Array.isArray(raw.chunks) && raw.chunks.length > 0 && raw.chunks.length <= (payload ? 2 : cap / 65536), 'Repeat-native chunk count exceeds cap.');
    let observed = 0;
    const chunks = rows(raw.chunks, raw.chunks.length).map(chunk => {
      const copied = text(chunk, 65536, 1);
      if (payload) check(/^(?:[0-9a-f]{2})+$/u.test(copied), 'Invalid complete-payload chunk hex.');
      observed += payload ? copied.length / 2 : new TextEncoder().encode(copied).length;
      check(observed <= bytes, 'Chunks exceed declared artifact byte length.'); return copied;
    });
    check(observed === bytes, 'Chunks do not cover the complete artifact.');
    return { role, path: absolute(raw.path), sha256: digest(raw.sha256), bytes, encoding: raw.encoding, chunks };
  });
  // Objects from callers receive the same outer envelope bound as JSON transport.
  const copied = { schema: value.schema, provenance: { capture_name: text(p.capture_name, 128, 1),
    kind: p.kind, producer_authenticated: false, qualified_release_pin: null }, artifacts };
  repeatNativeEnvelopeBytes(copied);
  return freeze({ ...copied, retainedBytes: total });
}
export async function projectRepeatNativeComparison(input, expectedJoinSha256) {
  try {
    const copied = copyRepeatNativeEvidence(input); digest(expectedJoinSha256);
    check(copied.artifacts[2].sha256 === expectedJoinSha256, 'Wrong selected repeat-native join.');
    if (!globalThis.crypto?.subtle) return { status: 'unavailable', detail: 'WebCrypto SHA-256 is unavailable.' };
    const artifacts = new Map();
    for (const artifact of copied.artifacts) {
      // All 23 budgets were checked above; caller-owned chunks cannot change across await.
      const joined = artifact.chunks.join(''), bytes = artifact.encoding === 'hex' ? unhex(joined) : new TextEncoder().encode(joined);
      check(bytes.length === artifact.bytes && await sha256(bytes) === artifact.sha256, 'Repeat-native whole artifact hash differs.');
      artifacts.set(artifact.role, { ...artifact, utf8: artifact.encoding === 'utf8' ? joined : null, raw: bytes });
    }
    const source = parseProgramJson(artifacts.get('sourceReceipt').utf8, 524288);
    const llvm = parseProgramJson(artifacts.get('llvmReceipt').utf8, 524288);
    const join = parseProgramJson(artifacts.get('join').utf8, 524288);
    const origin = validateRepeatSourceJoin(source, llvm, join, artifacts);
    const cases = await validateRepeatNativeJoin(join, origin, artifacts);
    return freeze({ status: 'ready', kind: copied.provenance.kind, captureName: copied.provenance.capture_name,
      joinSha256: expectedJoinSha256, sourceReceiptSha256: artifacts.get('sourceReceipt').sha256,
      llvmReceiptSha256: artifacts.get('llvmReceipt').sha256, retainedBytes: copied.retainedBytes,
      checkedArtifacts: 23, sourceExportsReported: 4, cpuSimulationsReported: 120, cases,
      interpretation: 'Selected retained artifacts and reported capture relationships; static explicit instruction uses only.',
      unavailable: ['Producer/source authentication', 'Replay of the full producer input census or CPU runs',
        'Physical values and register lifetimes', 'Hardware execution or timing', 'Protected proof or production authority'] });
  } catch (error) {
    return { status: 'invalid', detail: error instanceof Error ? error.message : 'Repeat-native evidence is invalid.' };
  }
}
