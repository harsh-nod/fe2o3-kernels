import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { projectRepeatNativeComparison } from '../src/content/repeat-native-comparison.mjs';
import { validateRepeatSourceProfile, type RepeatSourceProfileInput, type RepeatSourceProfilePin } from '../src/content/repeat-native-source-profile.mjs';
import { repeatFixture } from './fixtures/repeat-native-synthetic.mjs';

beforeEach(() => { vi.stubGlobal('crypto', webcrypto); });
afterEach(() => { vi.unstubAllGlobals(); });

type Profile = 'legacy' | 'origin-v1';
type Capture = RepeatSourceProfileInput & { retained_file_pins: RepeatSourceProfilePin[] };
const ROOT = '/synthetic/source';
const FLAG = '--diagnostic-ordered-origin-v1';
const LABELS = ['one', 'two', 'fifteen', 'repeat'];
const fixtures = { legacy: repeatFixture(), 'origin-v1': repeatFixture([], 'origin-v1') };
function capture(profile: Profile = 'origin-v1'): Capture {
  const selected = fixtures[profile].capsule.artifacts.find(value => value.role === 'sourceReceipt');
  if (!selected) throw new Error('Missing synthetic source receipt.');
  return JSON.parse(selected.chunks.join('')) as Capture;
}
function pins(value: Capture) { return new Map(value.retained_file_pins.map(row => [row.path, row])); }
function args(value: Capture, label = 'one'): string[] {
  const selected = value.stages.find(row => row.label === label + '-export');
  if (!selected) throw new Error('Missing synthetic export stage.');
  return selected.args;
}
const validate = (value: Capture) => validateRepeatSourceProfile(value, ROOT, pins(value));
function sidecar(value: Capture, label = 'one') {
  const row = value.retained_file_pins.find(pin => pin.path === ROOT + '/' + label + '.origin.json');
  if (!row) throw new Error('Missing synthetic origin pin.');
  return row;
}
function helper(value: Capture) {
  const row = value.retained_file_pins.find(pin => pin.path.endsWith('/ordered-repeat-origin-v1.mjs'));
  if (!row) throw new Error('Missing synthetic helper pin.');
  return row;
}

describe('closed retained repeat exporter profiles (synthetic controls, not native qualification)', () => {
  it.each(['legacy', 'origin-v1'] as const)('accepts the exact %s command/ledger profile', async profile => {
    expect(validate(capture(profile))).toBe(profile);
    const fixture = fixtures[profile];
    const result = await projectRepeatNativeComparison(fixture.capsule, fixture.joinSha256);
    if (result.status !== 'ready') throw new Error(result.detail);
    expect(result.cases).toHaveLength(8);
    expect(fixture.capsule.artifacts).toHaveLength(23);
  });
  it('keeps all sidecars outside the capsule artifact roster', () => {
    expect(fixtures['origin-v1'].capsule.artifacts.some(row => row.path.endsWith('.origin.json'))).toBe(false);
  });
  it('accepts legacy without the new producer-helper ledger requirement', () => {
    expect(capture('legacy').retained_file_pins.some(row => row.path.endsWith('/ordered-repeat-origin-v1.mjs'))).toBe(false);
    expect(validate(capture('legacy'))).toBe('legacy');
  });
  it('never treats a rehashed capsule as the independently selected join pin', async () => {
    const fixture = fixtures['origin-v1'];
    expect((await projectRepeatNativeComparison(fixture.capsule, 'e'.repeat(64))).status).toBe('invalid');
  });

  const argvMutations: [string, (value: string[]) => void][] = [
    ['empty argv', value => value.splice(0)],
    ['unknown extra flag', value => value.push('--unexpected')],
    ['duplicate diagnostic flag', value => value.unshift('--diagnostic-kir-v17')],
    ['wrong crate', value => { value[value.indexOf('--crate') + 1] = 'other'; }],
    ['wrong target', value => { value[value.indexOf('--target') + 1] = 'gfx950'; }],
    ['wrong KIR path', value => { value[value.indexOf('--output') + 1] = ROOT + '/two.kir'; }],
    ['wrong extraction path', value => { value[value.indexOf('--target-dir') + 1] = ROOT + '/two-extraction'; }],
    ['wrong source manifest', value => { value[value.indexOf('--manifest-path') + 1] = ROOT + '/two-source/Cargo.toml'; }],
    ['missing offline', value => value.splice(value.indexOf('--offline'), 1)],
    ['missing separator', value => value.splice(value.indexOf('--'), 1)],
    ['equals-form unsupported flag', value => value.splice(0, 1, '--diagnostic-kir-v17=true')],
    ['unrequested cargo message format', value => value.push('--message-format=json')],
  ];
  for (const profile of ['legacy', 'origin-v1'] as const) {
    it.each(argvMutations)('refuses ' + profile + ' %s', (_name, mutate) => {
      const value = capture(profile); mutate(args(value)); expect(() => validate(value)).toThrow();
    });
  }
  it.each(LABELS)('refuses a missing %s sidecar in the origin profile', label => {
    const value = capture(); value.retained_file_pins = value.retained_file_pins.filter(row => row !== sidecar(value, label));
    expect(() => validate(value)).toThrow();
  });
  it.each(LABELS)('refuses mixed origin/legacy argv at %s', label => {
    const value = capture(); const row = args(value, label); row.splice(row.indexOf(FLAG), 2);
    expect(() => validate(value)).toThrow();
  });
  it('refuses a duplicate origin flag', () => {
    const value = capture(); args(value).splice(9, 0, FLAG, ROOT + '/one.origin.json');
    expect(() => validate(value)).toThrow();
  });
  it('refuses a wrong sidecar output argument', () => {
    const value = capture(); const row = args(value); row[row.indexOf(FLAG) + 1] = ROOT + '/two.origin.json';
    expect(() => validate(value)).toThrow();
  });
  it('refuses a renamed sidecar ledger row', () => {
    const value = capture(); sidecar(value).path = ROOT + '/wrong.origin.json';
    expect(() => validate(value)).toThrow();
  });
  it('refuses a sidecar ledger row when no origin was requested', () => {
    const value = capture('legacy'); value.retained_file_pins.push(sidecar(capture()));
    expect(() => validate(value)).toThrow();
  });
  it.each(['legacy', 'origin-v1'] as const)('refuses a negative-export origin flag in %s', profile => {
    const value = capture(profile); args(value, 'refuse-zero').splice(9, 0, FLAG, ROOT + '/refuse-zero.origin.json');
    expect(() => validate(value)).toThrow();
  });
  it.each(['legacy', 'origin-v1'] as const)('refuses a negative sidecar pin in %s', profile => {
    const value = capture(profile), row = structuredClone(sidecar(capture())); row.path = ROOT + '/refuse-zero.origin.json';
    value.retained_file_pins.push(row); expect(() => validate(value)).toThrow();
  });
  it.each([0, 16385, -1, 1.5])('refuses sidecar byte count %s', bytes => {
    const value = capture(); sidecar(value).bytes = bytes; expect(() => validate(value)).toThrow();
  });
  it('accepts the inclusive 16 KiB sidecar pin limit', () => {
    const value = capture(); sidecar(value).bytes = 16384; expect(validate(value)).toBe('origin-v1');
  });
  it.each(['0'.repeat(64), 'A'.repeat(64), 'a'.repeat(63)])('refuses invalid sidecar digest %s', sha256 => {
    const value = capture(); sidecar(value).sha256 = sha256; expect(() => validate(value)).toThrow();
  });
  it('refuses a missing helper pin', () => {
    const value = capture(), selected = helper(value);
    value.retained_file_pins = value.retained_file_pins.filter(row => row !== selected);
    expect(() => validate(value)).toThrow();
  });
  it('refuses a helper from a different source checkout', () => {
    const value = capture(); helper(value).path = '/other/scripts/ordered-repeat-origin-v1.mjs';
    expect(() => validate(value)).toThrow();
  });
  it('refuses a missing source producer pin', () => {
    const value = capture();
    value.retained_file_pins = value.retained_file_pins.filter(row => !row.path.endsWith('/ordered-repeat-source-smoke.mjs'));
    expect(() => validate(value)).toThrow();
  });
  it('refuses ambiguous source producer pins', () => {
    const value = capture(), extra = structuredClone(helper(value));
    extra.path = '/other/scripts/ordered-repeat-source-smoke.mjs'; value.retained_file_pins.push(extra);
    expect(() => validate(value)).toThrow();
  });
  it.each([0, 1048577])('refuses helper byte count %s', bytes => {
    const value = capture(); helper(value).bytes = bytes; expect(() => validate(value)).toThrow();
  });
  it('refuses duplicate source stage labels', () => {
    const value = capture(); value.stages[1].label = value.stages[0].label;
    expect(() => validate(value)).toThrow();
  });
  it('refuses changed repeat source identity in the export argv', () => {
    const value = capture(); const row = args(value, 'repeat');
    row[row.indexOf('--manifest-path') + 1] = ROOT + '/repeat-source/Cargo.toml';
    expect(() => validate(value)).toThrow();
  });
  it('rejects invalid profile argv through the full independently pinned capsule route', async () => {
    const fixture = repeatFixture([{ role: 'sourceReceipt', path: ['stages', 0, 'args'], value: [] }]);
    expect((await projectRepeatNativeComparison(fixture.capsule, fixture.joinSha256)).status).toBe('invalid');
  });
  it('rejects duplicate sidecar ledger rows through the full capsule route', async () => {
    const original = capture(), rows = original.retained_file_pins;
    const fixture = repeatFixture([{ role: 'sourceReceipt', path: ['retained_file_pins'], value: [...rows, sidecar(original)] }], 'origin-v1');
    expect((await projectRepeatNativeComparison(fixture.capsule, fixture.joinSha256)).status).toBe('invalid');
  });
});
