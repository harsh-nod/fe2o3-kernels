// Closed retained command/ledger profiles only; no execution or producer authentication.
import { absolute, check, digest, integer, rows, same, text, LABELS } from './repeat-native-core.mjs';

const FLAG = '--diagnostic-ordered-origin-v1';
const REFUSALS = ['zero', 'sixteen', 'huge', 'expanded-seventeen', 'dynamic', 'bad-init', 'nested', 'physical-alias'];
const PRODUCER = '/scripts/ordered-repeat-source-smoke.mjs';
const HELPER = 'ordered-repeat-origin-v1.mjs';
const ORIGIN_BYTES = 16384;

function expectedArgs(root, label, sourceLabel, origin, negative) {
  return ['--diagnostic-kir-v17', '--crate', 'fe2o3_assembly_authoring_v30_fixture',
    '--output', root + '/' + label + '.kir', '--target', 'gfx942',
    '--target-dir', root + '/' + label + '-extraction',
    ...(origin ? [FLAG, root + '/' + label + '.origin.json'] : []),
    '--', '--manifest-path', root + '/' + sourceLabel + '-source/Cargo.toml', '--lib', '--offline',
    ...(negative ? ['--message-format=json'] : [])];
}

/** The caller has already validated the bounded source ledger and exact stage schema. */
export function validateRepeatSourceProfile(source, root, pins) {
  absolute(root);
  const stages = new Map(rows(source.stages, 136).map(value => [value.label, value]));
  check(stages.size === 136, 'Duplicate repeat source stage.');
  const first = stages.get('one-export');
  check(first && Array.isArray(first.args) && first.args.length <= 32, 'Missing bounded first export.');
  const origin = first.args.includes(FLAG);
  rows(source.variants, 4).forEach((value, index) => {
    const label = LABELS[index], sourceLabel = LABELS[Math.min(index, 2)];
    check(value.label === label && value.source_path === root + '/' + sourceLabel + '-source/src/lib.rs',
      'Repeat exporter source path differs.');
    same(stages.get(label + '-export')?.args, expectedArgs(root, label, sourceLabel, origin, false),
      'Unsupported or mixed repeat exporter profile.');
  });
  rows(source.refusals, 8).forEach((value, index) => {
    const label = 'refuse-' + REFUSALS[index];
    check(value.label === REFUSALS[index] && value.source_path === root + '/' + label + '-source/src/lib.rs',
      'Repeat refusal source path differs.');
    same(stages.get(label + '-export')?.args, expectedArgs(root, label, label, false, true),
      'Unsupported repeat refusal exporter profile.');
  });
  for (const label of [...LABELS, ...REFUSALS.map(value => 'refuse-' + value)]) {
    const retained = pins.get(root + '/' + label + '.origin.json');
    if (origin && LABELS.includes(label)) {
      check(retained, 'Same-invocation origin sidecar pin is missing.');
      integer(retained.bytes, ORIGIN_BYTES, 1); digest(retained.sha256);
    } else check(retained === undefined, 'Unrequested origin sidecar is present.');
  }
  if (origin) {
    // Only the selected ledger's sole source producer establishes the helper's sibling path.
    // These are reported content pins, not filesystem custody or source authentication.
    const producers = [...pins.values()].filter(value => value.path.endsWith(PRODUCER));
    rows(producers, 1);
    const producer = producers[0], helperPath = producer.path.slice(0, -'ordered-repeat-source-smoke.mjs'.length) + HELPER;
    const helper = pins.get(helperPath);
    check(helper, 'Origin profile helper is absent from the source ledger.');
    for (const value of [producer, helper]) {
      text(value.path, 4096, 1); integer(value.bytes, 1048576, 1); digest(value.sha256);
    }
  }
  return origin ? 'origin-v1' : 'legacy';
}
