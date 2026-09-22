// Read-only integrity projection of retained source/native observations.
// No compiler, decoder, filesystem, network, execution or authority is supplied.
import { parseProgramJson } from './ordered-program-observation.mjs';

export const FINAL_NATIVE_LIMITS = Object.freeze({ artifactBytes: 262144, sourceBytes: 65536,
  reportBytes: 65536, payloadBytes: 65536, totalBytes: 2097152, payloads: 4, artifacts: 14 });
const PROFILES = ['default', 'edited'], OPTS = ['O0', 'O3'];
const JOIN_FALSE = ['source_authentication', 'compiler_closure_attestation', 'protected_admission',
  'ranked_checks', 'proof_authority', 'artifact_authority', 'production_resume', 'hardware_execution',
  'native_whole_kernel_correctness', 'physical_register_allocation_or_lifetime_proof',
  'whole_kernel_order_or_byte_stability_claim'];
const SOURCE_FALSE = ['ranked_checks', 'protected_proof', 'compiler_closure_attestation', 'source_authentication',
  'native_qualified', 'physical_register_lifetime_proof', 'production_resume', 'hardware_observed'];
const NATIVE_FALSE = ['prefix_source_admitted', 'production_exact_program_admission', 'protected_finalizer_admission',
  'artifact_authority', 'source_authentication', 'compiler_closure_attestation', 'hardware_execution',
  'native_whole_kernel_correctness', 'physical_register_allocation_or_lifetime_proof', 'whole_kernel_order_or_byte_stability_claim'];
const INSPECT_FALSE = ['pure_or_movable', 'source_authentication', 'source_map_available',
  'physical_register_values_available', 'instruction_microsteps_available', 'register_lifetime_or_final_allocation_proof',
  'proof_authority', 'artifact_authority', 'production_resume_authority', 'hardware_execution'];
const EMIT_FALSE = ['source_authentication', 'compiler_closure_attestation', 'proof_authority',
  'protected_admission', 'final_artifact_authority', 'production_resume', 'physical_register_values', 'hardware_execution'];
const SOURCE_LIMITS = { source_bytes: 65536, command_stream_bytes: 1048576, command_ms: 300000,
  stages: 110, retained_pins: 384, retained_pin_bytes: 2147483648, cargo_jobs: 2,
  task_root_storage_accounting: 'external_root_supervisor_required_not_replaced_by_this_runner' };
const SHAPE = { typed_shape_positives: 4, typed_shape_negatives: 48, input_identity_positives: 1,
  input_identity_negatives: 3, file_snapshot_positives: 1, file_snapshot_negatives: 9,
  worker_or_target_machine_invoked: false, captured_llvm_mutated: false };
const MUTATIONS = { decoded_field_refusals: 7, stale_identity_refusals: 1, gapped_sequence_refusals: 1,
  raw_byte_mismatch_refusals: 1, redecoded_opposite_opcode_refusals: 1,
  opposite_profile_mutated_payload_observed: true, original_payload_unchanged: true,
  captured_llvm_mutated: false, mutated_payload_executed_on_hardware: false };
const LLVM_CLAIM = 'rocm7.2.1-packages-sha256:eb02c62693d6697017195f0abf5ebcf7e58f60e4d2acf8356de2e944bceec540';
const EDIT = 'one_exact_final_xor_to_or_original_and_surrounding_bytes_unchanged';
const ORACLE = 'default bitselect; edited b | (a & mask); independent BigInt whole-kernel simulation';
const POST_LINK = [
  'post_link.check=target status=ok arch=gfx942 code_object_version=6 e_flags=0x64c',
  'post_link.check=exports status=ok symbols=[choose_bits,choose_bits.kd]',
  'post_link.check=unresolved status=ok symbols=[]',
  'post_link.check=metadata status=ok kernels=1 target=amdgcn-amd-amdhsa--gfx942%3Axnack-',
];
function check(ok, text) { if (!ok) throw new Error(text); }
function keys(value, expected) {
  check(value !== null && typeof value === 'object' && !Array.isArray(value), 'Expected retained object.');
  check(Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key)), 'Unexpected retained fields.');
  return value;
}
function rows(value, count) {
  check(Array.isArray(value) && value.length === count &&
    Array.from({ length: count }, (_, i) => Object.hasOwn(value, i)).every(Boolean), 'Exact retained roster required.');
  return value;
}
function boundedRows(value, maximum) {
  check(Array.isArray(value) && value.length <= maximum, 'Retained roster exceeds bounds.');
  return rows(value, value.length);
}
function integer(value, max = 0xffffffff, min = 0) {
  check(Number.isSafeInteger(value) && value >= min && value <= max, 'Inexact or out-of-range observation.'); return value;
}
function text(value, maximum) {
  check(typeof value === 'string' && value.length <= maximum, 'Retained text exceeds bounds.');
  for (const point of value) { const code = point.codePointAt(0); check(code < 0xd800 || code > 0xdfff, 'Invalid retained Unicode.'); }
  check(new TextEncoder().encode(value).length <= maximum, 'Retained UTF-8 exceeds bounds.'); return value;
}
function digest(value) { check(typeof value === 'string' && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value), 'Invalid digest.'); return value; }
function key(value) {
  if (Array.isArray(value)) return '[' + value.map(key).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(name => JSON.stringify(name) + ':' + key(value[name])).join(',') + '}';
  return JSON.stringify(value);
}
function same(a, b, message = 'Retained observations disagree.') { check(key(a) === key(b), message); }
function flags(value, names) { for (const name of names) check(value[name] === false, 'Unsupported authority or availability claim: ' + name); }
function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
const descriptors = profile => [133, 307, profile === 'default' ? 413 : 412];
const declared = profile => [
  { instruction: 'v_xor_b32_e32', output: 4, inputs: [0, 1] },
  { instruction: 'v_and_b32_e32', output: 4, inputs: [4, 2] },
  { instruction: profile === 'default' ? 'v_xor_b32_e32' : 'v_or_b32_e32', output: 5, inputs: [1, 4] },
];
const encoded = profile => [
  ['V_XOR_B32_e32_vi', '0003082a', ['VGPR4', 'VGPR0', 'VGPR1']],
  ['V_AND_B32_e32_vi', '04050826', ['VGPR4', 'VGPR4', 'VGPR2']],
  [profile === 'default' ? 'V_XOR_B32_e32_vi' : 'V_OR_B32_e32_vi',
    profile === 'default' ? '01090a2a' : '01090a28', ['VGPR5', 'VGPR1', 'VGPR4']],
];
function parse(artifact) { return parseProgramJson(artifact.utf8, FINAL_NATIVE_LIMITS.artifactBytes); }
async function sha256(bytes) {
  const hashed = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hashed), byte => byte.toString(16).padStart(2, '0')).join('');
}
function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let at = 0; at < bytes.length; at++) bytes[at] = Number.parseInt(hex.slice(2 * at, 2 * at + 2), 16);
  return bytes;
}
const hexBytes = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

/** Copy bounded primitive fields before the first async boundary. No input path is fetched. */
export function copyFinalNativeEvidence(value) {
  keys(value, ['schema', 'provenance', 'join', 'sourceReceipt', 'sources', 'llvm', 'reports', 'payloads']);
  check(value.schema === 'fe2o3-final-native-comparison-example-v1', 'Unsupported final-native profile.');
  const provenance = keys(value.provenance, ['capture_name', 'kind', 'producer_authenticated', 'qualified_release_pin']);
  check(['retained_source_native_observation', 'synthetic_test_only'].includes(provenance.kind), 'Unsupported capture origin.');
  check(provenance.producer_authenticated === false && provenance.qualified_release_pin === null, 'Capture grants unsupported authority.');
  let total = 0;
  const artifact = (raw, cap) => {
    keys(raw, ['sha256', 'bytes', 'utf8']);
    const utf8 = text(raw.utf8, cap), bytes = new TextEncoder().encode(utf8).length;
    integer(raw.bytes, cap, 1); check(raw.bytes === bytes, 'Retained text byte length differs.');
    total += bytes; check(total <= FINAL_NATIVE_LIMITS.totalBytes, 'Total retained byte bound exceeded.');
    return { sha256: digest(raw.sha256), bytes, utf8 };
  };
  const join = artifact(value.join, FINAL_NATIVE_LIMITS.artifactBytes);
  const sourceReceipt = artifact(value.sourceReceipt, FINAL_NATIVE_LIMITS.artifactBytes);
  const sources = rows(value.sources, 3).map((row, index) => {
    keys(row, ['label', 'artifact']); check(row.label === ['original', 'default', 'edited'][index], 'Source roster changed.');
    return { label: row.label, artifact: artifact(row.artifact, FINAL_NATIVE_LIMITS.sourceBytes) };
  });
  const llvm = rows(value.llvm, 3).map((row, index) => {
    keys(row, ['label', 'artifact']); check(row.label === ['default', 'edited', 'repeat'][index], 'LLVM roster changed.');
    return { label: row.label, artifact: artifact(row.artifact, FINAL_NATIVE_LIMITS.sourceBytes) };
  });
  const reports = rows(value.reports, 2).map((row, index) => {
    keys(row, ['profile', 'artifact']); check(row.profile === PROFILES[index], 'Native report roster changed.');
    return { profile: row.profile, artifact: artifact(row.artifact, FINAL_NATIVE_LIMITS.reportBytes) };
  });
  const payloads = rows(value.payloads, 4).map((row, index) => {
    keys(row, ['profile', 'optimization', 'sha256', 'bytes', 'hex']);
    check(row.profile === PROFILES[Math.floor(index / 2)] && row.optimization === OPTS[index % 2], 'Payload profile or optimization swapped.');
    const bytes = integer(row.bytes, FINAL_NATIVE_LIMITS.payloadBytes, 1);
    check(typeof row.hex === 'string' && row.hex.length === 2 * bytes && /^(?:[0-9a-f]{2})+$/u.test(row.hex), 'Invalid complete payload hex.');
    total += bytes; check(total <= FINAL_NATIVE_LIMITS.totalBytes, 'Total retained byte bound exceeded.');
    return { profile: row.profile, optimization: row.optimization, sha256: digest(row.sha256), bytes, hex: row.hex };
  });
  return freeze({ schema: value.schema, provenance: { capture_name: text(provenance.capture_name, 128),
    kind: provenance.kind, producer_authenticated: false, qualified_release_pin: null },
    join, sourceReceipt, sources, llvm, reports, payloads, retainedBytes: total });
}
function pin(value, withLinks) {
  keys(value, ['path', 'bytes', 'sha256', 'device', 'inode', 'mode', 'mtime_ns', 'ctime_ns', ...(withLinks ? ['nlink'] : [])]);
  text(value.path, 4096); digest(value.sha256); integer(value.bytes, 536870912);
  for (const name of ['device', 'inode', 'mode', 'mtime_ns', 'ctime_ns', ...(withLinks ? ['nlink'] : [])])
    check(typeof value[name] === 'string' && /^(?:0|[1-9][0-9]{0,31})$/u.test(value[name]), 'Invalid retained file metadata.');
}
function ledger(value, maximum, expectedBytes, withLinks) {
  const result = new Map(); let total = 0;
  for (const item of boundedRows(value, maximum)) {
    pin(item, withLinks); check(!result.has(item.path), 'Duplicate retained input path.'); result.set(item.path, item);
    total += item.bytes; integer(total, 2157969408);
  }
  check(result.size > 0 && expectedBytes === total, 'Retained input accounting differs.'); return result;
}
function matches(artifact, expected) {
  check(artifact.sha256 === expected.sha256 && artifact.bytes === expected.bytes, 'Selected artifact is stale or substituted.');
}
function requirePin(ledger_, path, artifact) { const value = ledger_.get(path); check(value, 'Selected file missing from retained ledger.'); matches(artifact, value); }
function ids(value) {
  keys(value, ['frontend_unit', 'function', 'contract', 'statement']); Object.values(value).forEach(digest);
}
function inspection(value, summary, profile) {
  keys(value, ['kind', 'authority', 'canonical', 'kernel', 'function', 'coordinate', 'raw_block_id', 'input_value_ids',
    'result_value_id', 'declared_target', 'declared_wave_width', 'profile', 'register_plan', 'declared_program',
    'declared_instruction_steps', 'declared_source_ids', 'memory_effect', 'ordered_region_effect',
    'logical_observation_granularity', 'cpu_preflight_passed', 'inspection_counts',
    'inspection_max_canonical_bytes_after_admission', 'cpu_preflight_resident_limit_bytes', 'output_buffer_bytes',
    'accounting_scope', ...INSPECT_FALSE]);
  check(value.kind === 'diagnostic_ordered_program_inspection_example' && value.authority === 'observation_only', 'Unsupported source inspection.');
  flags(value, INSPECT_FALSE);
  check(value.function === 'choose_bits', 'Source function changed.');
  same(value.coordinate, { function_ordinal: 0, block_ordinal: 0, operation_ordinal: 0 });
  integer(value.raw_block_id); integer(value.result_value_id);
  rows(value.input_value_ids, 3).forEach(item => integer(item));
  check(new Set(value.input_value_ids).size === 3 && !value.input_value_ids.includes(value.result_value_id), 'Source SSA binding changed.');
  keys(value.inspection_counts, ['blocks', 'operations', 'ssa_definitions', 'capability_entries', 'name_bytes']);
  Object.values(value.inspection_counts).forEach(item => integer(item, 65536));
  check(value.inspection_max_canonical_bytes_after_admission === 65536 &&
    value.cpu_preflight_resident_limit_bytes === 67108864 && value.output_buffer_bytes === 8192 &&
    value.accounting_scope === 'shared canonical admission, CPU resident accounting, and this borrowed structural/output bound are separate; not a combined allocator or RSS cap',
  'Source inspection accounting contract changed.');
  same(value.canonical, { wire_version: 17, sha256: summary.canonical_kir_sha256, bytes: summary.canonical_kir_bytes });
  check(value.kernel === 'choose_bits' && value.declared_target === 'gfx942:xnack-' && value.declared_wave_width === 64 &&
    value.profile === 'closed_u32_program_e32_v1' && value.memory_effect === 'NoMemory' && value.ordered_region_effect === true &&
    value.logical_observation_granularity === 'whole_program_before_after' && value.cpu_preflight_passed === true, 'Source profile changed.');
  same(value.register_plan, { scratch: 4, output: 5, inputs: [0, 1, 2], vgpr_high_water: 6 });
  same(value.declared_program, { count: 3, descriptors: [...descriptors(profile), ...Array(13).fill(0)] });
  same(value.declared_instruction_steps, declared(profile)); ids(value.declared_source_ids);
  same(value.declared_source_ids, summary.declared_source_ids);
}
function emission(value, summary, profile) {
  keys(value, ['kind', 'authority', 'canonical_wire_version', 'canonical_identity', 'canonical_bytes',
    'input_file_sha256', 'llvm_sha256', 'llvm_bytes', 'program_count', 'descriptors', 'register_plan',
    'canonical_retained_storage_bytes', 'canonical_work_limit', 'canonical_storage_limit', 'max_input_bytes',
    'max_published_llvm_bytes', 'emitter_text_limit_bytes', 'canonical_and_emitter_accounting_are_separate', ...EMIT_FALSE]);
  flags(value, EMIT_FALSE);
  check(value.canonical_and_emitter_accounting_are_separate === true && value.canonical_work_limit === 67108864 &&
    value.canonical_storage_limit === 67108864 && value.max_input_bytes === 65536 &&
    value.max_published_llvm_bytes === 65536 && value.emitter_text_limit_bytes === 16777216,
  'LLVM observation accounting contract changed.');
  integer(value.canonical_retained_storage_bytes, value.canonical_storage_limit);
  check(value.kind === 'diagnostic_ordered_program_llvm_observation' && value.authority === 'observation_only' &&
    value.canonical_wire_version === 17 && value.canonical_identity === summary.canonical_kir_sha256 &&
    value.canonical_bytes === summary.canonical_kir_bytes && value.input_file_sha256 === summary.kir_file_sha256 &&
    value.llvm_sha256 === summary.llvm_sha256 && value.llvm_bytes === summary.llvm_bytes && value.program_count === 3,
  'Source LLVM observation differs.');
  same(value.descriptors, [...descriptors(profile), ...Array(13).fill(0)]); same(value.register_plan, [4, 5, 0, 1, 2]);
}
function replaceOnce(source, before, after) {
  check(source.split(before).length === 2, 'Exact source edit boundary changed.'); return source.replace(before, after);
}
function sourceJoin(join, source, retained) {
  keys(source, ['status', 'kind', 'normal_public_seed', 'actual_normal_exports', 'whole_kernel_simulations',
    'variants', 'stages', 'retained_file_pins', 'retained_pin_bytes', 'semantic_identity_join_qualified',
    'semantic_identity_availability', 'source_edit', ...SOURCE_FALSE, 'limits']);
  flags(source, SOURCE_FALSE); same(source.limits, SOURCE_LIMITS);
  check(source.status === 'passed' && source.kind === 'source_promotion_instruction_edit_diagnostic_v1' &&
    source.actual_normal_exports === 3 && source.whole_kernel_simulations === 90 &&
    source.semantic_identity_join_qualified === true && source.semantic_identity_availability === 'normal_live_exporter_observed' &&
    source.source_edit === EDIT, 'Unsupported source receipt.');
  same(source.normal_public_seed, join.normal_public_seed);
  keys(source.normal_public_seed, ['original_sha256', 'candidate_sha256', 'candidate_bytes']);
  digest(source.normal_public_seed.original_sha256); digest(source.normal_public_seed.candidate_sha256);
  integer(source.normal_public_seed.candidate_bytes, FINAL_NATIVE_LIMITS.sourceBytes, 1);
  const sourcePins = ledger(source.retained_file_pins, 384, source.retained_pin_bytes, false);
  const sourceRoot = join.source_receipt.path.slice(0, -'/receipt.json'.length);
  check(join.source_receipt.path === sourceRoot + '/receipt.json', 'Unsupported source receipt path label.');
  for (const [index, name] of ['original.rs', 'public-candidate.rs', 'instruction-edited.rs'].entries())
    requirePin(sourcePins, sourceRoot + '/' + name, retained.sources[index].artifact);
  check(retained.sources[0].artifact.sha256 === source.normal_public_seed.original_sha256 &&
    retained.sources[1].artifact.sha256 === source.normal_public_seed.candidate_sha256 &&
    retained.sources[1].artifact.bytes === source.normal_public_seed.candidate_bytes, 'Published source bytes differ.');
  const macro = 'fe2o3_device::amdgpu_ordered_program! {\n    gfx942_xnack_off_wave64;\n    scratch(4); out(5);\n' +
    '    in(0) = a;\n    in(1) = b;\n    in(2) = mask;\n    xor(scratch, input0, input1);\n' +
    '    and(scratch, scratch, input2);\n    xor(out, input1, scratch);\n}';
  check(retained.sources[1].artifact.utf8 === replaceOnce(retained.sources[0].artifact.utf8,
    '    let selected = b ^ ((a ^ b) & mask);\n', '    let selected = ' + macro + ';\n'), 'Published initializer or surrounding bytes differ.');
  check(retained.sources[2].artifact.utf8 === replaceOnce(retained.sources[1].artifact.utf8,
    '    xor(out, input1, scratch);\n', '    or(out, input1, scratch);\n'), 'Instruction edit is not exactly XOR to OR.');
  rows(source.stages, 100).forEach(stage => {
    keys(stage, ['label', 'executable', 'args', 'code', 'signal', 'reason', 'elapsed_ms',
      'stdout_bytes', 'stdout_sha256', 'stderr_bytes', 'stderr_sha256']);
    check(stage.code === 0 && stage.signal === null && stage.reason === null, 'Source stage did not complete successfully.');
    text(stage.label, 128); text(stage.executable, 4096); boundedRows(stage.args, 64).forEach(arg => text(arg, 4096));
    integer(stage.elapsed_ms, 310000); for (const stream of ['stdout', 'stderr']) {
      integer(stage[stream + '_bytes'], 1048576); digest(stage[stream + '_sha256']);
    }
  });
  const summaries = rows(join.source_variants, 3);
  rows(source.variants, 3).forEach((variant, index) => {
    const label = ['default', 'edited', 'repeat'][index], profile = index === 0 ? 'default' : 'edited', summary = summaries[index];
    keys(summary, ['label', 'profile', 'source_sha256', 'semantic_sha256', 'canonical_kir_sha256', 'canonical_kir_bytes',
      'kir_file_sha256', 'llvm_path', 'llvm_sha256', 'llvm_bytes', 'retained_source_inventory', 'retained_source_preflight',
      'declared_source_ids', 'simulations']);
    check(summary.label === label && summary.profile === profile && summary.simulations === 30, 'Source summary roster differs.');
    keys(variant, ['label', 'source_sha256', 'exported', 'inspection', 'emission', 'kir_file_sha256', 'llvm_sha256', 'simulations']);
    check(variant.label === label && variant.source_sha256 === retained.sources[index === 0 ? 1 : 2].artifact.sha256 &&
      summary.source_sha256 === variant.source_sha256 && summary.kir_file_sha256 === variant.kir_file_sha256 &&
      summary.llvm_sha256 === variant.llvm_sha256, 'Source variant identity changed.');
    same(variant.exported, { canonical_sha256: summary.canonical_kir_sha256, canonical_bytes: summary.canonical_kir_bytes,
      retained_source_inventory: summary.retained_source_inventory, retained_source_preflight: summary.retained_source_preflight,
      semantic_identity: summary.semantic_sha256 });
    for (const field of ['source_sha256', 'semantic_sha256', 'canonical_kir_sha256', 'kir_file_sha256', 'llvm_sha256',
      'retained_source_inventory', 'retained_source_preflight']) digest(summary[field]);
    matches(retained.llvm[index].artifact, { sha256: summary.llvm_sha256, bytes: summary.llvm_bytes });
    check(summary.llvm_path === sourceRoot + '/' + label + '.ll', 'LLVM path label changed.');
    requirePin(sourcePins, summary.llvm_path, retained.llvm[index].artifact);
    inspection(variant.inspection, summary, profile); emission(variant.emission, summary, profile);
    rows(variant.simulations, 30); // The strict producer/join checked raw CPU results; this UI does not replay them.
  });
  for (const field of ['source_sha256', 'semantic_sha256', 'canonical_kir_sha256', 'kir_file_sha256', 'llvm_sha256', 'retained_source_preflight']) {
    check(summaries[0][field] !== summaries[1][field] && summaries[1][field] === summaries[2][field], 'Changed or repeated source identity differs.');
  }
  check(summaries.every(item => item.retained_source_inventory === summaries[0].retained_source_inventory), 'Fixed-root inventory changed.');
  same(source.variants[1].inspection, source.variants[2].inspection); same(source.variants[1].emission, source.variants[2].emission);
  check(summaries[0].declared_source_ids.statement !== summaries[1].declared_source_ids.statement, 'Edited source statement is stale.');
  return summaries;
}
function validateJoin(join, evidence) {
  keys(join, ['kind', 'status', 'authority', 'source_receipt', 'native_reports', 'source_variants', 'normal_public_seed',
    'actual_normal_exports', 'producer_stages', 'whole_kernel_simulations', 'native_optimization_cases', 'complete_hsaco_payloads',
    'native_observations', 'native_repeat_execution', 'repeat_scope', 'full_payload_offset_join', 'source_edit', 'changed_oracle',
    ...JOIN_FALSE, 'runtime_closure_attestation', 'retained_input_pins', 'retained_input_bytes', 'limits']);
  flags(join, JOIN_FALSE);
  check(join.kind === 'private_instruction_edit_source_native_payload_join_v1' && join.status === 'joined_observation' &&
    join.authority === 'observation_only' && join.runtime_closure_attestation === 'unavailable', 'Unsupported strict source/native join.');
  check(join.actual_normal_exports === 3 && join.producer_stages === 100 && join.whole_kernel_simulations === 90 &&
    join.native_optimization_cases === 4 && join.complete_hsaco_payloads === 4 && join.native_repeat_execution === false, 'Join case accounting changed.');
  check(join.repeat_scope === 'same edited source semantic KIR LLVM identities; no separate native execution claimed' &&
    join.full_payload_offset_join === 'worker ELF file offsets and complete payload bytes; no byte scanning' &&
    join.source_edit === EDIT && join.changed_oracle === ORACLE, 'Join interpretation changed.');
  pin(join.source_receipt, true); matches(evidence.sourceReceipt, join.source_receipt);
  rows(join.native_reports, 2).forEach((item, index) => { pin(item, true); matches(evidence.reports[index].artifact, item); });
  const pins = ledger(join.retained_input_pins, 400, join.retained_input_bytes, true);
  requirePin(pins, join.source_receipt.path, evidence.sourceReceipt);
  join.native_reports.forEach((item, index) => requirePin(pins, item.path, evidence.reports[index].artifact));
  keys(join.limits, ['source', 'payload', 'json', 'sourcePins', 'sourcePinBytes', 'joinPins', 'joinPinBytes',
    'total_read_bytes', 'wall_clock_ms', 'actual_read_bytes', 'input_directory_custody', 'compiler_worker_execution',
    'total_RSS_or_task_storage_attestation']);
  integer(join.limits.actual_read_bytes, 6442450944, 1);
  same(join.limits, { source: 65536, payload: 1048576, json: 1048576, sourcePins: 384,
    sourcePinBytes: 2147483648, joinPins: 400, joinPinBytes: 2157969408,
    total_read_bytes: 6442450944, wall_clock_ms: 120000, actual_read_bytes: join.limits.actual_read_bytes,
    input_directory_custody: 'task-controlled parents; outer supervisor and post-exit snapshot required',
    compiler_worker_execution: false, total_RSS_or_task_storage_attestation: false }, 'Strict join limits changed.');
  return pins;
}
async function nativeRows(report, profile, summary, selectedPayloads, join, ledger_, sourceText, llvmText) {
  keys(report, ['report_kind', 'authority', 'profile', 'kernel_symbol', 'register_plan', 'descriptors',
    'result_use', 'llvm_sha256', 'llvm_bytes', 'expected_input_identity_matched', 'retained_file_identity_and_bytes_rechecked',
    'llvm_build_claim', 'worker_build_claim', 'target', 'wave_width', 'workgroup_size', 'code_object_version', 'shape_controls',
    'cases', 'source_ancestry', 'synthetic_worker_request_identity_fields', 'runtime_closure_attestation', ...NATIVE_FALSE]);
  flags(report, NATIVE_FALSE);
  check(report.report_kind === 'private-instruction-edit-native-observation-v1' &&
    report.authority === 'unauthenticated-test-transport' && report.profile === profile &&
    report.kernel_symbol === 'choose_bits' && report.result_use === 'sole-direct-nonvolatile-nonatomic-global-store' &&
    report.expected_input_identity_matched === true && report.retained_file_identity_and_bytes_rechecked === true &&
    report.source_ancestry === 'not-established-by-llvm-file' && report.synthetic_worker_request_identity_fields === true &&
    report.runtime_closure_attestation === 'unavailable', 'Unsupported native report or interpretation.');
  check(report.target === 'gfx942:xnack-' && report.wave_width === 64 && report.workgroup_size === 64 &&
    report.code_object_version === 6 && report.llvm_build_claim === LLVM_CLAIM &&
    /^fe2o3-worker-v1-sha256-[0-9a-f]{64}$/u.test(report.worker_build_claim) &&
    report.worker_build_claim !== 'fe2o3-worker-v1-sha256-' + '0'.repeat(64), 'Native target or build claim changed.');
  same(report.register_plan, [4, 5, 0, 1, 2]); same(report.descriptors, descriptors(profile)); same(report.shape_controls, SHAPE);
  check(report.llvm_sha256 === summary.llvm_sha256 && report.llvm_bytes === summary.llvm_bytes, 'Native LLVM subject is stale.');
  const result = [];
  for (const [index, wrapper] of rows(report.cases, 2).entries()) {
    keys(wrapper, ['machine_observation', 'mutation_controls', 'retained_payload']); same(wrapper.mutation_controls, MUTATIONS);
    const value = wrapper.machine_observation, retained = wrapper.retained_payload, selected = selectedPayloads[index];
    keys(value, ['optimization', 'llvm_sha256', 'llvm_bytes', 'hsaco_sha256', 'hsaco_bytes', 'entry_file_offset',
      'entry_code_bytes', 'static_instruction_count', 'program', 'descriptor', 'post_link_checks', 'derivation_identity',
      'boundary_value_or_lifetime_proof']);
    check(value.optimization === OPTS[index] && value.llvm_sha256 === summary.llvm_sha256 &&
      value.llvm_bytes === summary.llvm_bytes && value.boundary_value_or_lifetime_proof === false, 'Native case subject or authority changed.');
    digest(value.derivation_identity);
    keys(retained, ['path', 'bytes', 'sha256', 'matches_linked_worker_payload', 'create_new_only', 'production_artifact_authority']);
    check(retained.matches_linked_worker_payload === true && retained.create_new_only === true &&
      retained.production_artifact_authority === false, 'Payload provenance claim changed.');
    matches(selected, retained); check(value.hsaco_sha256 === retained.sha256 && value.hsaco_bytes === retained.bytes, 'Native payload subject differs.');
    requirePin(ledger_, retained.path, selected);
    const payload = fromHex(selected.hex), entry = integer(value.entry_file_offset, payload.length);
    const entryBytes = integer(value.entry_code_bytes, payload.length - entry, 12);
    const staticInstructions = integer(value.static_instruction_count, 512, 3);
    const steps = encoded(profile), program = rows(value.program, 3).map((site, at) => {
      keys(site, ['file_offset', 'opcode', 'bytes_hex', 'mc_flags', 'register_operands', 'implicit_reads', 'implicit_writes']);
      same([site.opcode, site.bytes_hex, site.register_operands], steps[at]);
      const offset = integer(site.file_offset, entry + entryBytes - 4, entry);
      check(offset === value.program[0].file_offset + 4 * at, 'Noncontiguous native sequence.');
      integer(site.mc_flags, 65535); check((site.mc_flags & ~16) === 0, 'Hidden native instruction effect.');
      same(site.implicit_reads, ['EXEC']); same(site.implicit_writes, []);
      check(hexBytes(payload.subarray(offset, offset + 4)) === site.bytes_hex, 'Instruction bytes differ at exact full-payload offset.');
      return { declaredInstruction: declared(profile)[at].instruction, opcode: site.opcode,
        bytesHex: site.bytes_hex, registers: [...site.register_operands], fileOffset: offset };
    });
    const descriptor = value.descriptor;
    keys(descriptor, ['file_offset', 'bytes', 'sha256', 'compute_pgm_rsrc1', 'compute_pgm_rsrc3',
      'vgpr_capacity', 'architected_vgpr_boundary', 'required_footprint_high_water', 'interpretation']);
    const offset = integer(descriptor.file_offset, payload.length - 64);
    check(descriptor.bytes === 64 && descriptor.required_footprint_high_water === 6 &&
      descriptor.interpretation === 'encoded-capacity-not-metadata-usage-or-lifetime', 'Descriptor interpretation changed.');
    check(offset + 64 <= entry || entry + entryBytes <= offset, 'Descriptor overlaps entry code.');
    const bytes = payload.slice(offset, offset + 64);
    check(await sha256(bytes) === digest(descriptor.sha256), 'Descriptor bytes differ.');
    const view = new DataView(bytes.buffer), rsrc1 = view.getUint32(48, true), rsrc3 = view.getUint32(44, true);
    integer(descriptor.compute_pgm_rsrc1); integer(descriptor.compute_pgm_rsrc3);
    check(rsrc1 === descriptor.compute_pgm_rsrc1 && rsrc3 === descriptor.compute_pgm_rsrc3, 'Encoded descriptor words differ.');
    const capacity = ((rsrc1 & 63) + 1) * 8, boundary = ((rsrc3 & 63) + 1) * 4;
    check(descriptor.vgpr_capacity === capacity && descriptor.architected_vgpr_boundary === boundary &&
      capacity >= boundary && boundary >= 6, 'Encoded capacity does not cover the declared register footprint.');
    const checks = rows(value.post_link_checks, 5); checks.forEach(item => text(item, 1024));
    same(checks.slice(0, 4), POST_LINK);
    const launch = /^post_link.kernel name=choose_bits symbol=choose_bits.kd kernarg_size=(0|[1-9][0-9]{0,9}) group_size=(0|[1-9][0-9]{0,9}) private_size=(0|[1-9][0-9]{0,9}) kernarg_align=([1-9][0-9]{0,4}) wavefront_size=64 max_workgroup_size=64 reqd_workgroup_size=\[64,1,1\]$/u.exec(checks[4]);
    check(launch, 'Native launch observation changed.');
    launch.slice(1, 4).forEach(item => integer(Number(item)));
    const alignment = integer(Number(launch[4]), 32768, 1);
    check((alignment & (alignment - 1)) === 0, 'Native kernarg alignment is not a power of two.');
    const joined = rows(join.native_observations, 4)[PROFILES.indexOf(profile) * 2 + index];
    same(joined, { profile, optimization: OPTS[index], llvm_sha256: summary.llvm_sha256, llvm_bytes: summary.llvm_bytes,
      payload_path: retained.path, hsaco_sha256: retained.sha256, hsaco_bytes: retained.bytes,
      exact_payload_instruction_offsets: program.map(item => item.fileOffset), descriptor_file_offset: offset,
      descriptor_sha256: descriptor.sha256, descriptor_bytes: 64, source_authentication: false,
      boundary_value_or_lifetime_proof: false }, 'Strict join native case differs from raw report.');
    result.push({ id: profile + '-' + OPTS[index], profile, optimization: OPTS[index],
      source: sourceText, sourceSha256: summary.source_sha256, semanticSha256: summary.semantic_sha256,
      canonicalKirSha256: summary.canonical_kir_sha256, llvm: llvmText, llvmSha256: summary.llvm_sha256,
      hsacoSha256: retained.sha256, hsacoBytes: retained.bytes, program, staticInstructions,
      declaredVgprHighWater: 6, encodedVgprCapacity: capacity, architectedVgprBoundary: boundary,
      descriptorOffset: offset, descriptorSha256: descriptor.sha256,
      resource1: rsrc1, resource3: rsrc3, llvmBuildClaim: report.llvm_build_claim, workerBuildClaim: report.worker_build_claim });
  }
  return result;
}
export async function projectFinalNativeComparison(input, expectedJoinSha256) {
  try {
    const retained = copyFinalNativeEvidence(input), expected = digest(expectedJoinSha256);
    check(retained.join.sha256 === expected, 'Selected strict join is stale or substituted.');
    if (!globalThis.crypto?.subtle) return { status: 'unavailable', detail: 'WebCrypto is unavailable; no final-native comparison is shown.' };
    const artifacts = [retained.join, retained.sourceReceipt, ...retained.sources.map(item => item.artifact),
      ...retained.llvm.map(item => item.artifact), ...retained.reports.map(item => item.artifact)];
    await Promise.all(artifacts.map(async artifact => check(await sha256(new TextEncoder().encode(artifact.utf8)) === artifact.sha256,
      'Retained text hash mismatch.')));
    await Promise.all(retained.payloads.map(async item => check(await sha256(fromHex(item.hex)) === item.sha256,
      'Complete HSACO payload hash mismatch.')));
    const join = parse(retained.join), source = parse(retained.sourceReceipt), pins = validateJoin(join, retained);
    const summaries = sourceJoin(join, source, retained), reports = retained.reports.map(item => parse(item.artifact));
    check(reports[0].worker_build_claim === reports[1].worker_build_claim &&
      reports[0].llvm_build_claim === reports[1].llvm_build_claim, 'Native build claims differ between profiles.');
    const cases = [];
    for (const [index, profile] of PROFILES.entries()) cases.push(...await nativeRows(reports[index], profile, summaries[index],
      retained.payloads.slice(index * 2, index * 2 + 2), join, pins, retained.sources[index + 1].artifact.utf8, retained.llvm[index].artifact.utf8));
    return freeze({ status: 'ready', kind: retained.provenance.kind, captureName: retained.provenance.capture_name,
      joinSha256: expected, sourceReceiptSha256: retained.sourceReceipt.sha256, retainedBytes: retained.retainedBytes,
      checkedArtifacts: 14, cases, sourceExportsReported: 3, cpuSimulationsReported: 90,
      interpretation: 'Retained byte integrity only; not trusted compiler provenance or native execution correctness.',
      unavailable: ['runtime physical-register values', 'register lifetime or allocation proof', 'native whole-kernel correctness',
        'hardware execution', 'performance', 'protected proof/admission', 'compiler/runtime closure authentication'] });
  } catch (error) {
    return { status: 'invalid', detail: error instanceof Error ? error.message.slice(0, 240) : 'Invalid final-native comparison.' };
  }
}
