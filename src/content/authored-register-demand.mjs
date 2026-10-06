// Retained authored demand only. No compiler, native decoder, network or execution.
import { copyFinalNativeEvidence, projectFinalNativeComparison } from './final-native-comparison.mjs';
import { parseProgramJson } from './ordered-program-observation.mjs';

export const AUTHORED_DEMAND_LIMITS = Object.freeze({ capsuleBytes: 24576, reportBytes: 8192,
  reports: 2, instructions: 16, values: 19, uses: 33, boundaries: 34, asciiBytes: 8192 });
const FALSE = ['physical_allocation_observed', 'physical_register_values_available',
  'instruction_microsteps_available', 'source_authentication', 'artifact_authority',
  'production_resume_authority', 'hardware_execution'];
const JOINS = ['canonical', 'kernel', 'function', 'coordinate', 'raw_block_id', 'input_value_ids',
  'result_value_id', 'declared_target', 'declared_wave_width', 'declared_source_ids', 'register_plan'];
const BOUNDARY = '0=entry;2*i+1=read;2*i+2=write;2*n+1=region_result';
const INTERVAL = 'inclusive def..last_use;null last_use=unused;overwritten is not free';
const ACCOUNTING = "fixed plan/projection representations and 8192-byte output are separate from the dropped CPU preflight plan's 64-MiB resident budget; not total stack, allocator or RSS accounting";
function check(ok, message) { if (!ok) throw new Error(message); }
function keys(value, names) {
  check(value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === names.length && names.every(name => Object.hasOwn(value, name)),
  'Unexpected authored-demand fields.');
}
function integer(value, max, min = 0) {
  check(Number.isSafeInteger(value) && value >= min && value <= max, 'Authored-demand integer exceeds bounds.');
  return value;
}
function rows(value, max) {
  check(Array.isArray(value) && value.length <= max &&
    Array.from({ length: value.length }, (_, i) => Object.hasOwn(value, i)).every(Boolean),
  'Invalid authored-demand roster.'); return value;
}
function stable(value) {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort()
    .map(name => JSON.stringify(name) + ':' + stable(value[name])).join(',') + '}';
  return JSON.stringify(value);
}
function same(left, right) { check(stable(left) === stable(right), 'Authored-demand identity or plan mismatch.'); }
function digest(value) { check(typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value) && !/^0+$/u.test(value), 'Invalid authored-demand digest.'); return value; }
function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
function artifact(value, max) {
  keys(value, ['bytes', 'sha256', 'utf8']); integer(value.bytes, max, 1);
  check(typeof value.utf8 === 'string' && value.utf8.length <= max, 'Authored-demand text exceeds bound.');
  for (const point of value.utf8) { const n = point.codePointAt(0); check(n < 0xd800 || n > 0xdfff, 'Invalid authored-demand Unicode.'); }
  const bytes = new TextEncoder().encode(value.utf8);
  check(bytes.length === value.bytes, 'Authored-demand text size changed.');
  return Object.freeze({ bytes: value.bytes, sha256: digest(value.sha256), utf8: value.utf8 });
}
async function hash(text) {
  return Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))),
    x => x.toString(16).padStart(2, '0')).join('');
}

/** Independent browser derivation from already-validated declared instructions.
 * Fixed logical read/write boundaries, never ISA issue time or allocation/free. */
export function deriveAuthoredDemand(registers, instructions) {
  keys(registers, ['scratch', 'output', 'inputs', 'vgpr_high_water']);
  rows(registers.inputs, 3); check(registers.inputs.length === 3, 'Three input bindings required.');
  const bindings = [...registers.inputs, registers.scratch, registers.output];
  bindings.forEach(x => integer(x, 63)); check(new Set(bindings).size === 5, 'Distinct declared bindings required.');
  check(registers.vgpr_high_water === Math.max(...bindings) + 1, 'Declared high-water changed.');
  rows(instructions, 16); check(instructions.length > 0, 'At least one instruction required.');
  const roleNames = ['input0', 'input1', 'input2', 'scratch', 'out'];
  const values = bindings.slice(0, 3).map((binding, id) =>
    ({ id, role: roleNames[id], binding, def: 0, last_use: null, overwritten: null }));
  const current = new Map(bindings.slice(0, 3).map((binding, id) => [binding, id])), uses = [];
  // Read all operands first; installing a new value cannot rewrite an earlier operand.
  instructions.forEach((step, index) => {
    keys(step, ['instruction', 'output', 'inputs']);
    check(['v_xor_b32_e32', 'v_and_b32_e32', 'v_or_b32_e32', 'v_mov_b32_e32'].includes(step.instruction), 'Unsupported declared instruction.');
    check(step.output === registers.scratch || step.output === registers.output, 'Unsupported destination role.');
    const arity = step.instruction === 'v_mov_b32_e32' ? 1 : 2;
    rows(step.inputs, 2); check(step.inputs.length === arity, 'Wrong declared arity.');
    const readAt = 2 * index + 1;
    for (const [operand, binding] of step.inputs.entries()) {
      integer(binding, 63); const id = current.get(binding);
      check(id !== undefined, 'Declared read before definition.');
      const value = values[id]; check(value.overwritten === null, 'Stale definition used.');
      value.last_use = readAt;
      uses.push({ at: readAt, value: id, kind: arity === 1 ? 'move' : operand === 0 ? 'left' : 'right' });
    }
    const writeAt = readAt + 1, old = current.get(step.output);
    if (old !== undefined) values[old].overwritten = writeAt;
    const id = values.length;
    values.push({ id, role: roleNames[bindings.indexOf(step.output)], binding: step.output,
      def: writeAt, last_use: null, overwritten: null });
    current.set(step.output, id);
  });
  const result = current.get(registers.output), result_boundary = instructions.length * 2 + 1;
  check(result !== undefined, 'Missing region result.');
  values[result].last_use = result_boundary;
  uses.push({ at: result_boundary, value: result, kind: 'region_result' });
  check(values.length <= 19 && uses.length <= 33, 'Authored-demand representation bound.');
  return freeze({ steps: instructions.length, result_boundary, values, uses });
}
function grid(plan) {
  const boundaries = Array.from({ length: plan.result_boundary + 1 }, (_, i) => i);
  const values = plan.values.map(value => ({ ...value, cells: boundaries.map(at => {
    const use = plan.uses.find(use => use.value === value.id && use.at === at);
    return at === value.def ? 'D' : use ? use.kind === 'region_result' ? 'R' : 'r'
      : at === value.overwritten ? 'x' : at > value.def && value.last_use !== null && at < value.last_use ? '-' : '.';
  }) }));
  const ascii = ['Authored declared demand; NOT physical allocation or hardware time.',
    'D=definition r=read R=result -=demand x=overwritten .=no demand',
    'boundary ' + boundaries.map(at => at % 10).join(''),
    ...values.map(value => '#' + String(value.id).padStart(2, '0') + ' v' + value.binding + ' ' +
      value.role.padEnd(7) + ' ' + value.cells.join('') + ' def=' + value.def +
      (value.last_use === null ? ' unused' : ' last=' + value.last_use))].join('\n') + '\n';
  check(new TextEncoder().encode(ascii).length <= 8192, 'ASCII demand output exceeds bound.');
  return { boundaries, values, ascii };
}
function validateReport(report, inspection) {
  keys(report, ['schema', 'authority', 'provenance', ...JOINS, 'boundary_convention', 'interval_convention',
    'plan', ...FALSE, 'fixed_plan_bytes', 'fixed_projection_bytes', 'fixed_representations_limit_bytes', 'accounting_scope']);
  check(report.schema === 'fe2o3-declared-register-demand-v1' && report.authority === 'observation_only' &&
    report.provenance === 'derived_from_declared_ordered_program_not_physical_allocation', 'Unsupported authored-demand interpretation.');
  for (const name of FALSE) check(report[name] === false, 'Authored demand cannot grant ' + name + '.');
  for (const name of JOINS) same(report[name], inspection[name]);
  check(report.boundary_convention === BOUNDARY && report.interval_convention === INTERVAL, 'Demand boundary convention changed.');
  integer(report.fixed_plan_bytes, 4096, 1); integer(report.fixed_projection_bytes, 4096, 1);
  check(report.fixed_plan_bytes + report.fixed_projection_bytes <= 4096 &&
    report.fixed_representations_limit_bytes === 4096 && report.accounting_scope === ACCOUNTING, 'Reported Rust representation accounting changed.');
  const plan = deriveAuthoredDemand(inspection.register_plan, inspection.declared_instruction_steps);
  same(report.plan, plan);
  return { plan, ...grid(plan) };
}

export async function projectAuthoredDemand(nativeInput, expectedNativeJoin, input, expectedCapsuleSha256) {
  try {
    // All caller-controlled primitives are copied before the first await.
    const snapshot = copyFinalNativeEvidence(nativeInput);
    const closedNative = Object.fromEntries(Object.entries(snapshot).filter(([name]) => name !== 'retainedBytes'));
    const retained = artifact(input, AUTHORED_DEMAND_LIMITS.capsuleBytes);
    const expected = digest(expectedCapsuleSha256), joinExpected = digest(expectedNativeJoin);
    check(retained.sha256 === expected, 'Selected authored-demand capsule is stale.');
    if (!globalThis.crypto?.subtle) return { status: 'unavailable', detail: 'WebCrypto unavailable; no authored-demand rows shown.' };
    check(await hash(retained.utf8) === expected, 'Authored-demand capsule bytes changed.');
    const native = await projectFinalNativeComparison(closedNative, joinExpected);
    check(native.status === 'ready', 'The source/final-native binding is not ready.');
    const capsule = parseProgramJson(retained.utf8, AUTHORED_DEMAND_LIMITS.capsuleBytes);
    keys(capsule, ['schema', 'source_join_sha256', 'source_receipt_sha256', 'provenance', 'reports']);
    check(capsule.schema === 'fe2o3-authored-demand-capsule-v1', 'Unsupported demand capsule.');
    check(capsule.source_join_sha256 === native.joinSha256 &&
      capsule.source_receipt_sha256 === native.sourceReceiptSha256, 'Stale source/native capsule binding.');
    same(capsule.provenance, { kind: 'retained_genuine_cli_observation', producer_authenticated: false, hardware_execution: false });
    rows(capsule.reports, 2); check(capsule.reports.length === 2, 'Exactly two CLI reports required.');
    const source = parseProgramJson(snapshot.sourceReceipt.utf8, 262144), cases = [];
    for (const [index, profile] of ['default', 'edited'].entries()) {
      const row = capsule.reports[index]; keys(row, ['profile', 'artifact']);
      check(row.profile === profile, 'Demand profile roster changed.');
      const raw = artifact(row.artifact, AUTHORED_DEMAND_LIMITS.reportBytes);
      check(await hash(raw.utf8) === raw.sha256, 'Raw CLI report bytes changed.');
      const report = parseProgramJson(raw.utf8, AUTHORED_DEMAND_LIMITS.reportBytes);
      const variant = source.variants[index]; check(variant.label === profile, 'Source profile changed.');
      cases.push({ profile, reportSha256: raw.sha256, canonicalSha256: report.canonical.sha256,
        sourceIds: report.declared_source_ids, ...validateReport(report, variant.inspection) });
    }
    return freeze({ status: 'ready', capsuleSha256: expected, nativeJoinSha256: native.joinSha256,
      sourceReceiptSha256: native.sourceReceiptSha256, cases,
      interpretation: 'Authored declared-register demand; independent plan replay and retained-byte consistency only.',
      physicalAllocation: false, hardwareExecution: false });
  } catch (error) {
    return { status: 'invalid', detail: error instanceof Error ? error.message.slice(0, 240) : 'Invalid authored-demand evidence.' };
  }
}
