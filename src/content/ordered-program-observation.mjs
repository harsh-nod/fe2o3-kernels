// Pure, bounded presentation of retained diagnostic pairs. No backend or compiler authority.
export const PROGRAM_CAPTURE_LIMIT = 3 * 1024 * 1024;
export const PROGRAM_VARIANTS = Object.freeze([
  ['ordered-program-one-v32', 'one'], ['ordered-program-v32', 'three'],
  ['ordered-program-sixteen-v32', 'sixteen'],
].flatMap(([name, profile]) => [
  Object.freeze({ name, profile, resultMode: 'used' }),
  Object.freeze({ name: name + '-unused', profile, resultMode: 'unused' }),
]));
export const PROGRAM_PAIR_ROLES = Object.freeze([
  'before-control', 'before-inputs', 'before-result', 'after-control', 'after-result',
  'reverse-control', 'reverse-inputs', 'repeat-control', 'repeat-result',
]);
const U64 = 0xffffffffffffffffn;
function check(ok, message) { if (!ok) throw new Error(message); }
function record(value) { check(value !== null && typeof value === 'object' && !Array.isArray(value), 'Expected an object.'); return value; }
function keys(value, required, optional = []) {
  record(value); check(required.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => required.includes(key) || optional.includes(key)), 'Unexpected or missing fields.'); return value;
}
function integer(value, max = 0xffffffff) { check(Number.isSafeInteger(value) && value >= 0 && value <= max, 'Inexact or out-of-range integer.'); return value; }
function digest(value) { check(typeof value === 'string' && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value), 'Invalid SHA-256.'); return value; }
function array(value, length) { check(Array.isArray(value) && value.length === length && Array.from({ length }, (_, i) => Object.hasOwn(value, i)).every(Boolean), 'Unexpected or sparse array.'); return value; }
function same(a, b) { check(exactKey(a) === exactKey(b), 'Retained identities or observations disagree.'); }
function exactKey(value) {
  if (typeof value === 'bigint') return `u64:${value}`;
  if (Array.isArray(value)) return '[' + value.map(exactKey).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + exactKey(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
function freeze(value) { if (value && typeof value === 'object') { for (const item of Object.values(value)) freeze(item); Object.freeze(value); } return value; }

/** Deliberately small JSON grammar: duplicate keys and non-unsigned numbers reject.
 * Large unsigned wire integers remain bigint, including the full wave64 mask.
 * This does not depend on optional JSON.parse reviver-source browser support. */
export function parseProgramJson(raw, maximum = PROGRAM_CAPTURE_LIMIT) {
  check(typeof raw === 'string' && new TextEncoder().encode(raw).length <= maximum, 'JSON byte limit exceeded.');
  let at = 0, nodes = 0;
  const space = () => { while (at < raw.length && /[ \t\r\n]/u.test(raw[at])) at++; };
  function string() {
    const start = at++; check(raw[start] === '"', 'Expected JSON string.');
    for (;;) {
      check(at < raw.length, 'Unterminated JSON string.');
      const char = raw[at++];
      if (char === '\\') { check(at < raw.length, 'Invalid JSON escape.'); at++; }
      else if (char === '"') break;
    }
    const value = JSON.parse(raw.slice(start, at));
    check(value.length <= 262144, 'JSON string limit exceeded.');
    for (const point of value) { const code = point.codePointAt(0); check(code < 0xd800 || code > 0xdfff, 'Invalid Unicode.'); }
    return value;
  }
  function value(depth) {
    check(++nodes <= 65536 && depth <= 24, 'JSON graph limit exceeded.'); space();
    if (raw[at] === '"') return string();
    if (raw[at] === '{') {
      at++; space(); const result = Object.create(null); let count = 0;
      if (raw[at] === '}') { at++; return result; }
      for (;;) {
        space(); const key = string(); check(!Object.hasOwn(result, key) && ++count <= 128, 'Duplicate key or object limit.');
        space(); check(raw[at++] === ':', 'Expected colon.'); result[key] = value(depth + 1); space();
        const next = raw[at++]; if (next === '}') return result; check(next === ',', 'Expected object separator.');
      }
    }
    if (raw[at] === '[') {
      at++; space(); const result = []; if (raw[at] === ']') { at++; return result; }
      for (;;) { check(result.length < 1024, 'Array limit exceeded.'); result.push(value(depth + 1)); space(); const next = raw[at++]; if (next === ']') return result; check(next === ',', 'Expected array separator.'); }
    }
    for (const [text, result] of [['true', true], ['false', false], ['null', null]]) if (raw.startsWith(text, at)) { at += text.length; return result; }
    const match = /^(?:0|[1-9][0-9]*)/u.exec(raw.slice(at)); check(match, 'Expected unsigned JSON value.');
    check(match[0].length <= 20, 'JSON integer exceeds u64.'); at += match[0].length; const number = BigInt(match[0]); check(number <= U64, 'JSON integer exceeds u64.');
    return number <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(number) : number;
  }
  const result = value(0); space(); check(at === raw.length, 'Trailing or malformed JSON.'); return result;
}
export async function programSha256(raw) {
  check(globalThis.crypto?.subtle, 'WebCrypto is unavailable.');
  const hash = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}
function inspection(raw) {
  const view = parseProgramJson(raw, 8192); record(view);
  check(view.kind === 'diagnostic_ordered_program_inspection_example' && view.authority === 'observation_only', 'Wrong inspection kind or authority.');
  check(view.kernel === 'ordered_u32_program' && typeof view.function === 'string' && view.function.length > 0 && view.function.length <= 1024, 'Unsupported kernel or function.');
  keys(view.canonical, ['wire_version', 'sha256', 'bytes']); check(view.canonical.wire_version === 17, 'Expected canonical V17.'); digest(view.canonical.sha256); check(integer(view.canonical.bytes, 65536) > 0, 'Empty canonical owner.');
  check(view.declared_target === 'gfx942:xnack-' && view.declared_wave_width === 64 && view.profile === 'closed_u32_program_e32_v1', 'Unsupported target profile.');
  check(view.memory_effect === 'NoMemory' && view.ordered_region_effect === true && view.logical_observation_granularity === 'whole_program_before_after' && view.cpu_preflight_passed === true, 'Unsupported observation granularity.');
  for (const field of ['source_authentication', 'source_map_available', 'physical_register_values_available', 'instruction_microsteps_available', 'register_lifetime_or_final_allocation_proof', 'proof_authority', 'artifact_authority', 'production_resume_authority', 'hardware_execution', 'pure_or_movable']) check(view[field] === false, 'Inspection elevates authority or available data.');
  keys(view.coordinate, ['function_ordinal', 'block_ordinal', 'operation_ordinal']); same(view.coordinate.function_ordinal, 0); integer(view.coordinate.block_ordinal, 127); integer(view.coordinate.operation_ordinal, 4095); integer(view.raw_block_id);
  array(view.input_value_ids, 3).forEach(x => integer(x)); integer(view.result_value_id); check(new Set([...view.input_value_ids, view.result_value_id]).size === 4, 'SSA roles overlap.');
  keys(view.register_plan, ['scratch', 'output', 'inputs', 'vgpr_high_water']);
  const registers = [...array(view.register_plan.inputs, 3), view.register_plan.scratch, view.register_plan.output]; registers.forEach(x => integer(x, 63)); check(new Set(registers).size === 5, 'Register roles overlap.'); same(view.register_plan.vgpr_high_water, Math.max(...registers) + 1);
  keys(view.declared_source_ids, ['frontend_unit', 'function', 'contract', 'statement']); Object.values(view.declared_source_ids).forEach(digest);
  keys(view.declared_program, ['count', 'descriptors']); const count = integer(view.declared_program.count, 16); check(count > 0, 'Empty program.'); const words = array(view.declared_program.descriptors, 16); words.forEach(x => integer(x, 65535));
  const defined = [true, true, true, false, false], names = ['v_mov_b32_e32', 'v_add_u32_e32', 'v_sub_u32_e32', 'v_and_b32_e32', 'v_or_b32_e32', 'v_xor_b32_e32'];
  const steps = words.slice(0, count).map(word => {
    const op = word & 7, dest = 3 + ((word >> 3) & 1), left = (word >> 4) & 7, right = (word >> 7) & 7;
    check(word < 1024 && op <= 5 && left <= 4 && right <= 4 && (op !== 0 || right === 0) && defined[left] && (op === 0 || defined[right]), 'Invalid program descriptor or initialization.');
    defined[dest] = true; return { instruction: names[op], output: registers[dest], inputs: op === 0 ? [registers[left]] : [registers[left], registers[right]] };
  });
  check(defined[4] && words.slice(count).every(x => x === 0), 'Invalid output or descriptor padding.'); same(view.declared_instruction_steps, steps);
  return view;
}
function scope() { return { level: 'lane', workgroup: [0, 0, 0], wave: 0, lane: 0 }; }
function ssa(view, id) { return { root: { kind: 'ssa', function_ordinal: view.coordinate.function_ordinal, frame: 1, value_ordinal: id }, components: [] }; }
function anchor(value, configuration, view) {
  keys(value, ['cursor', 'scope', 'site']); keys(value.cursor, ['configuration_identity', 'event_sequence', 'state_revision']);
  same(value.cursor.configuration_identity, configuration); integer(value.cursor.event_sequence); integer(value.cursor.state_revision);
  same(value.scope, { ...scope(), logical_workitem: [0, 0, 0], active_mask: U64, wave_width: 64, interpretation: 'logical_visualization' });
  same(value.site, { kir: { function_ordinal: view.coordinate.function_ordinal, block_ordinal: view.coordinate.block_ordinal, point: { kind: 'operation', operation_ordinal: view.coordinate.operation_ordinal } }, source: { status: 'unavailable', reason: 'requires_authenticated_map' } });
  return value;
}
function pair(value, role, configuration) {
  keys(value, ['role', 'requestUtf8', 'responseUtf8']); same(value.role, role);
  const request = parseProgramJson(value.requestUtf8, 65536), response = parseProgramJson(value.responseUtf8, 65536);
  keys(response, ['schema', 'request_id', 'operation', 'status', 'session', 'result']);
  same(request.schema, 'fe2o3-debug-request-v1'); same(response.schema, 'fe2o3-debug-response-v1'); same(response.status, 'ok');
  integer(request.request_id); integer(request.expected_revision); same(response.request_id, request.request_id); same(response.operation, request.operation);
  keys(response.session, ['backend', 'execution_kind', 'state', 'revision', 'configuration_identity', 'cursor', 'simulated', 'hardware_observed', 'performance_prediction']);
  const session = response.session; same(session.backend, 'cpu_kir_simulator'); same(session.execution_kind, 'cpu_kir_simulation'); same(session.state, 'stopped'); same(session.simulated, true); same(session.hardware_observed, false); same(session.performance_prediction, false); same(session.configuration_identity, configuration);
  keys(session.cursor, ['configuration_identity', 'event_sequence', 'state_revision']); same(session.cursor.configuration_identity, configuration); same(session.cursor.state_revision, integer(session.revision)); integer(session.cursor.event_sequence);
  return { request, response };
}
function control(item, view, configuration, direction, previous) {
  const { request, response } = item;
  if (direction === 'start') { keys(request, ['schema', 'request_id', 'expected_revision', 'operation', 'max_events']); same(request.operation, 'continue'); same(request.max_events, 16384); }
  else { keys(request, ['schema', 'request_id', 'expected_revision', 'operation', 'direction', 'granularity', 'count']); same(request.operation, 'step'); same(request.direction, direction); same(request.granularity, 'event'); same(request.count, 1); same(request.expected_revision, previous.cursor.state_revision); }
  same(response.session.revision, request.expected_revision + 1); same(response.result.result, 'control'); same(response.result.snapshot.status, 'captured'); same(response.result.stop.exact, true); same(response.result.stop.outcome, 'active'); same(response.result.stop.reason, direction === 'start' ? 'breakpoint' : 'step');
  const value = anchor(response.result.snapshot.snapshot.anchor, configuration, view); same(value.cursor, response.session.cursor);
  if (previous) same(value.cursor.event_sequence, previous.cursor.event_sequence + (direction === 'reverse' ? -1 : 1));
  return value;
}
function values(item, view, expectedAnchor, ids, unavailable = false) {
  const { request, response } = item;
  keys(request, ['schema', 'request_id', 'expected_revision', 'operation', 'scope', 'frame', 'selector', 'page']); same(request.operation, 'inspect_values'); same(request.scope, scope()); same(request.frame, 1); same(request.page, { limit: 16 }); same(request.selector, { selector: 'paths', paths: ids.map(id => ssa(view, id)) });
  same(request.expected_revision, expectedAnchor.cursor.state_revision); same(response.session.revision, request.expected_revision); same(response.session.cursor, expectedAnchor.cursor);
  keys(response.result, ['result', 'snapshot', 'values']); same(response.result.result, 'values'); same(response.result.snapshot, { ...expectedAnchor, frame: 1, occurrence: 1 });
  return array(response.result.values, ids.length).map((row, index) => {
    keys(row, ['path', 'availability']); same(row.path, ssa(view, ids[index]));
    if (unavailable) { same(row.availability, { status: 'unavailable', reason: 'not_in_scope' }); return { id: ids[index], status: 'unavailable', reason: 'not_in_scope' }; }
    keys(row.availability, ['status', 'value_type', 'value', 'provenance']); same(row.availability.status, 'captured'); same(row.availability.value_type, { kind: 'integer', signed: false, bits: 32 }); same(row.availability.provenance, 'simulated_observation'); keys(row.availability.value, ['encoding', 'bits']); same(row.availability.value.encoding, 'bits'); check(/^0x[0-9a-f]{8}$/u.test(row.availability.value.bits), 'Expected exact u32 bits.');
    return { id: ids[index], status: 'captured', bits: row.availability.value.bits };
  });
}
function projectCase(row, index, view) {
  keys(row, ['index', 'configurationIdentity', 'simulationRequestSha256', 'requestsSha256', 'responsesSha256', 'pairs']); same(row.index, index);
  for (const field of ['configurationIdentity', 'simulationRequestSha256', 'requestsSha256', 'responsesSha256']) digest(row[field]);
  const pairs = array(row.pairs, 9).map((value, i) => pair(value, PROGRAM_PAIR_ROLES[i], row.configurationIdentity));
  check(new Set(pairs.map(p => p.request.request_id)).size === 9, 'Repeated retained request.');
  check(pairs.every((p, i) => i === 0 || p.request.request_id > pairs[i - 1].request.request_id), 'Reordered retained requests.');
  const before = control(pairs[0], view, row.configurationIdentity, 'start');
  const inputs = values(pairs[1], view, before, view.input_value_ids), absent = values(pairs[2], view, before, [view.result_value_id], true);
  const after = control(pairs[3], view, row.configurationIdentity, 'forward', before), result = values(pairs[4], view, after, [view.result_value_id]);
  const reverse = control(pairs[5], view, row.configurationIdentity, 'reverse', after), restored = values(pairs[6], view, reverse, view.input_value_ids); same(inputs, restored);
  const repeat = control(pairs[7], view, row.configurationIdentity, 'forward', reverse), repeated = values(pairs[8], view, repeat, [view.result_value_id]); same(result, repeated);
  return { index, configurationIdentity: row.configurationIdentity, simulationRequestSha256: row.simulationRequestSha256, checkpoints: [
    { label: 'Before whole program', anchor: before, values: [...inputs, ...absent] },
    { label: 'After whole program', anchor: after, values: result },
    { label: 'Reverse-restored before', anchor: reverse, values: restored },
    { label: 'Repeated after', anchor: repeat, values: repeated },
  ] };
}
/** Hash consistency and presentation guards only; not detached-transcript admission. */
export async function projectOrderedProgramObservation(input) {
  if (input === null) return { status: 'unavailable', detail: 'Retained V17 capture pending. No logical or physical values are supplied.' };
  try {
    keys(input, ['captureUtf8', 'expectedCaptureSha256']); const raw = input.captureUtf8, expected = digest(input.expectedCaptureSha256);
    check(typeof raw === 'string' && new TextEncoder().encode(raw).length <= PROGRAM_CAPTURE_LIMIT, 'Capture byte limit exceeded.');
    if (!globalThis.crypto?.subtle) return { status: 'unavailable', detail: 'WebCrypto is required for byte integrity checks.' };
    same(await programSha256(raw), expected);
    const capture = parseProgramJson(raw); keys(capture, ['schema', 'kind', 'authority', 'sourceReceiptSha256', 'aggregateReceiptSha256', 'variants']);
    same(capture.schema, 'fe2o3-tutorial-ordered-program-observation-v1'); check(['retained_public_diagnostic', 'synthetic_test_only'].includes(capture.kind), 'Unknown capture kind.'); same(capture.authority, 'display_only'); digest(capture.sourceReceiptSha256); digest(capture.aggregateReceiptSha256);
    const variants = [];
    for (const [index, row] of array(capture.variants, 6).entries()) {
      keys(row, ['name', 'profile', 'resultMode', 'inspectionUtf8', 'inspectionSha256', 'cases']); const variant = PROGRAM_VARIANTS[index]; for (const key of ['name', 'profile', 'resultMode']) same(row[key], variant[key]);
      same(await programSha256(row.inspectionUtf8), digest(row.inspectionSha256)); const view = inspection(row.inspectionUtf8);
      same(view.declared_program.count, { one: 1, three: 3, sixteen: 16 }[variant.profile]);
      const cases = array(row.cases, 6).map((item, i) => projectCase(item, i, view));
      variants.push({ ...variant, canonical: view.canonical, coordinate: view.coordinate, rawBlockId: view.raw_block_id, inputIds: view.input_value_ids, resultId: view.result_value_id, roles: view.register_plan, steps: view.declared_instruction_steps, sourceIds: view.declared_source_ids, cases });
    }
    check(new Set(variants.flatMap(v => v.cases.map(c => c.configurationIdentity))).size === 36, 'Capture configurations are reused.');
    check(new Set(variants.map(v => v.canonical.sha256)).size === 6, 'Variant canonical identities are reused.');
    return freeze({ status: 'ready', captureKey: expected, kind: capture.kind, variants });
  } catch (error) { return { status: 'invalid', detail: error instanceof Error ? error.message.slice(0, 240) : 'Invalid retained observation.' }; }
}
