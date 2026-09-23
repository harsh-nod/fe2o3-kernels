// Closed selected-source/LLVM integrity joins, not re-execution of historical producers.
import { check, keys, rows, integer, text, digest, same, flags, pin, ledger,
  matchArtifact, requirePin, receiptRoot, count, declaredProgram, declaredSteps, stage, EMIT_FALSE, SOURCE_FALSE,
  LABELS, COUNTS, PLAN, CONSTRAINTS } from './repeat-native-core.mjs';

export const SOURCE_LIMITS = { source_bytes: 65536, json_bytes: 1048576, kir_bytes: 65536,
  command_stream_bytes: 1048576, export_ms: 300000, query_ms: 60000, wall_ms: 1140000,
  stages: 136, pins: 512, pin_bytes: 2147483648, selected_file_bytes: 536870912,
  receipt_bytes: 1048576, cargo_messages: 256, cargo_jobs: 2, min_available_ram_bytes: 68719476736 };
export const LLVM_LIMITS = { calls: 4, command_ms: 60000, wall_ms: 270000, stream_bytes: 4096,
  llvm_bytes: 65536, receipt_bytes: 1048576, output_bytes: 67108864, output_files: 32,
  historical_pins: 512, historical_pin_bytes: 2147483648, selected_file_bytes: 536870912,
  all_pins: 560, all_pin_bytes: 3221225472 };
const LLVM_EXTRA_FALSE = ['native_qualified', 'llvm_verified_by_new_parser', 'physical_register_lifetime_proof',
  'runtime_loop_or_schedule_added', 'milestone_completion'];
const INSPECT_FALSE = ['pure_or_movable', 'source_authentication', 'source_map_available',
  'physical_register_values_available', 'instruction_microsteps_available', 'register_lifetime_or_final_allocation_proof',
  'proof_authority', 'artifact_authority', 'production_resume_authority', 'hardware_execution'];
export const SOURCE_HASHES = ['fa7634a5a1bc841db4b2a8ed5240b0184dfce8c79259fad6e04e60c66f5d08af',
  'a8bd4ddbb76a6e59871f06ce4b3ee958b7b24b6a7cfd95ca0e804c094e3351f1',
  'd1d3f3812f459be5583c377c2a1d1690a85b24abb483555ed53b6150453f55c3'];
const INPUTS = [[0, 0xffffffff, 0], [0xffffffff, 1, 42], [0xaaaaaaaa, 0x55555555, 0x0f0f0f0f],
  [0x80000000, 0x80000000, 0xffffffff], [19, 23, 42]], LENGTHS = [0, 1, 65];
export const REFUSALS = [
  ['zero', 'const', 'ordered repeat count must be 1..15'],
  ['sixteen', 'const', 'ordered repeat count must be 1..15'],
  ['huge', 'const', 'ordered repeat count must be 1..15'],
  ['expanded-seventeen', 'const', 'expanded ordered program exceeds 16 steps'],
  ['dynamic', 'macro', 'unsupported amdgpu_ordered_program! syntax; use the closed gfx942 u32 program with literal VGPR bindings'],
  ['bad-init', 'const', 'ordered program reads an undefined source'],
  ['nested', 'macro', 'unsupported amdgpu_ordered_program! syntax; use the closed gfx942 u32 program with literal VGPR bindings'],
  ['physical-alias', 'owner', 'fe2o3 rustc extraction: ordered-program source stages: production compilation semantic importer rejected semantic body construction: semantic body construction rejected inconsistent ordered program physical roles must be distinct v0..v63'],
];
export function expectedSimulationRows(count) {
  const result = [];
  for (let input = 0; input < 5; input++) for (const elements of LENGTHS) for (let replay = 0; replay < 2; replay++)
    result.push({ input, elements, replay,
      expected_word: Number((BigInt(INPUTS[input][0]) + BigInt(count) * BigInt(INPUTS[input][1])) & 0xffffffffn),
      output_words: elements, backing_bytes: 8 + 4 * elements, guard_bytes: 8 });
  return result;
}
export function sourceStageLabels() {
  const result = [];
  for (const label of LABELS) {
    result.push(label + '-export', label + '-inspect');
    for (let input = 0; input < 5; input++) for (const elements of LENGTHS) for (let replay = 0; replay < 2; replay++)
      result.push(label + '-case-' + input + '-length-' + elements + '-replay-' + replay);
  }
  return [...result, ...REFUSALS.map(row => 'refuse-' + row[0] + '-export')];
}
function validateInspection(value, exported, count) {
  keys(value, ['kind', 'authority', 'canonical', 'kernel', 'function', 'coordinate', 'raw_block_id',
    'input_value_ids', 'result_value_id', 'declared_target', 'declared_wave_width', 'profile', 'register_plan',
    'declared_program', 'declared_instruction_steps', 'declared_source_ids', 'memory_effect', 'ordered_region_effect',
    'logical_observation_granularity', 'cpu_preflight_passed', 'inspection_counts',
    'inspection_max_canonical_bytes_after_admission', 'cpu_preflight_resident_limit_bytes', 'output_buffer_bytes',
    'accounting_scope', ...INSPECT_FALSE]);
  flags(value, INSPECT_FALSE);
  check(value.kind === 'diagnostic_ordered_program_inspection_example' && value.authority === 'observation_only' &&
    value.kernel === 'ordered_repeat_u32' && value.declared_target === 'gfx942:xnack-' &&
    value.declared_wave_width === 64 && value.profile === 'closed_u32_program_e32_v1', 'Unsupported repeat inspection.');
  text(value.function, 1024, 1);
  same(value.canonical, { wire_version: 17, sha256: exported.canonical_sha256, bytes: exported.canonical_bytes });
  same(value.register_plan, { scratch: 32, output: 33, inputs: [34, 35, 36], vgpr_high_water: 37 });
  same(value.declared_program, declaredProgram(count)); same(value.declared_instruction_steps, declaredSteps(count));
  keys(value.declared_source_ids, ['frontend_unit', 'function', 'contract', 'statement']); Object.values(value.declared_source_ids).forEach(digest);
  keys(value.coordinate, ['function_ordinal', 'block_ordinal', 'operation_ordinal']);
  Object.values(value.coordinate).forEach(n => integer(n, 8192)); integer(value.raw_block_id, 8192); integer(value.result_value_id, 8192);
  rows(value.input_value_ids, 3).forEach(n => integer(n, 8192));
  check(new Set([...value.input_value_ids, value.result_value_id]).size === 4, 'Source SSA roles overlap.');
  check(value.memory_effect === 'NoMemory' && value.ordered_region_effect === true && value.cpu_preflight_passed === true &&
    value.logical_observation_granularity === 'whole_program_before_after', 'Unsupported repeat observation granularity.');
  const caps = { blocks: 128, operations: 4096, ssa_definitions: 8192, capability_entries: 256, name_bytes: 16384 };
  keys(value.inspection_counts, Object.keys(caps)); for (const [field, cap] of Object.entries(caps)) integer(value.inspection_counts[field], cap);
  check(value.inspection_max_canonical_bytes_after_admission === 65536 && value.cpu_preflight_resident_limit_bytes === 67108864 &&
    value.output_buffer_bytes === 8192 && value.accounting_scope ===
    'shared canonical admission, CPU resident accounting, and this borrowed structural/output bound are separate; not a combined allocator or RSS cap',
  'Repeat inspection accounting differs.');
}
function validateEmission(value, original, llvm) {
  keys(value, ['kind', 'authority', 'canonical_wire_version', 'canonical_identity', 'canonical_bytes',
    'input_file_sha256', 'llvm_sha256', 'llvm_bytes', 'program_count', 'descriptors', 'register_plan',
    'canonical_retained_storage_bytes', 'canonical_work_limit', 'canonical_storage_limit', 'max_input_bytes',
    'max_published_llvm_bytes', 'emitter_text_limit_bytes', 'canonical_and_emitter_accounting_are_separate', ...EMIT_FALSE]);
  flags(value, EMIT_FALSE); const p = declaredProgram(original.repetitions);
  check(value.kind === 'diagnostic_ordered_program_llvm_observation' && value.authority === 'observation_only' &&
    value.canonical_wire_version === 17 && value.canonical_identity === original.exported.canonical_sha256 &&
    value.canonical_bytes === original.exported.canonical_bytes && value.input_file_sha256 === original.kir_file_sha256 &&
    value.llvm_sha256 === llvm.sha256 && value.llvm_bytes === llvm.bytes && value.program_count === p.count,
  'Repeat LLVM source identity differs.');
  same(value.descriptors, p.descriptors); same(value.register_plan, PLAN);
  integer(value.canonical_retained_storage_bytes, 67108864, 1);
  check(value.canonical_work_limit === 67108864 && value.canonical_storage_limit === 67108864 &&
    value.max_input_bytes === 65536 && value.max_published_llvm_bytes === 65536 &&
    value.emitter_text_limit_bytes === 16777216 && value.canonical_and_emitter_accounting_are_separate === true,
  'Repeat LLVM accounting differs.');
}
export function inspectRepeatLlvm(llvm, original) {
  count(original.repetitions); text(llvm, 65536, 1); check(!llvm.includes('\0') && !llvm.includes('\r'), 'Unsupported LLVM text.');
  const lines = llvm.split('\n'), value = '%v' + integer(original.inspection.result_value_id, 8192);
  const program = ['v_mov_b32_e32 $0, $1', ...Array(original.repetitions).fill('v_add_u32_e32 $0, $0, $2')].join('\\0A\\09');
  const assembly = '  ' + value + ' = call i32 asm sideeffect "' + program +
    '", "' + CONSTRAINTS + '"(i32 %arg1, i32 %arg2, i32 %arg3)';
  same(lines.filter(line => /\basm\b/u.test(line)), [assembly], 'Expected one exact ordered assembly region.');
  same(lines.filter(line => line.startsWith('define ')),
    ['define amdgpu_kernel void @ordered_repeat_u32(ptr addrspace(1) %arg0.data, i64 %arg0.len, i32 %arg1, i32 %arg2, i32 %arg3) #0 !reqd_work_group_size !0 {']);
  same(lines.filter(line => line.startsWith('target triple')), ['target triple = "amdgcn-amd-amdhsa"']);
  same(lines.filter(line => line.includes('; ordered-program-v17')),
    ['  ; ordered-program-v17 vgpr-high-water=37 (binding extent; final descriptor unverified)']);
  same(lines.filter(line => line.startsWith('!0 =')), ['!0 = !{i32 64, i32 1, i32 1}']);
  const attributes = rows(lines.filter(line => line.startsWith('attributes #0 =')), 1)[0];
  for (const literal of ['"amdgpu-flat-work-group-size"="64,64"', '"target-features"="-wavefrontsize32,+wavefrontsize64,-xnack"', '"target-cpu"="gfx942"'])
    check(attributes.split(literal).length === 2, 'LLVM target attributes differ.');
  const store = rows(lines.filter(line => /^\s*store\b/u.test(line)), 1)[0];
  check(new RegExp('^  store i32 ' + value + ', ptr addrspace\\(1\\) %v[0-9]+, align 4$').test(store), 'LLVM result store differs.');
  return { result_ssa: value, assembly_line: assembly, instruction_count: original.repetitions + 1,
    constraints: CONSTRAINTS, result_store_line: store };
}
export function validateRepeatSourceJoin(source, llvm, join, artifacts) {
  keys(source, ['schema', 'status', 'authority', 'origin', 'successful_exports', 'exact_frontend_refusals',
    'whole_kernel_simulations', 'variants', 'refusals', 'stages', 'retained_file_pins', 'retained_pin_bytes',
    'limits', 'bundle_identity', 'compiler_identity_source', 'inventory_semantics', 'declared_instruction_count',
    ...SOURCE_FALSE, 'task_resource_accounting']);
  flags(source, SOURCE_FALSE); same(source.limits, SOURCE_LIMITS);
  check(source.schema === 'task-ordered-repeat-source-acceptance-v1' && source.status === 'passed' &&
    source.authority === 'observation_only' && source.origin === 'fresh_rust_normal_exporter_v17_inspector_and_cpu_simulator' &&
    source.successful_exports === 4 && source.exact_frontend_refusals === 8 && source.whole_kernel_simulations === 120,
  'Unsupported repeat source receipt.');
  check(source.bundle_identity === 'unavailable_this_normal_export_route_is_raw_diagnostic_kir_v17_not_bundle_v6' &&
    source.compiler_identity_source === 'normal_live_exporter_never_inferred_from_preflight_or_file_hash' &&
    source.inventory_semantics === 'retained_root_contract_census_not_body_digest_repeat_requires_exact_equality' &&
    source.declared_instruction_count === '2_3_16_steps_one_ordered_region_whole_region_logical_observation' &&
    source.task_resource_accounting === 'external_current_scope_supervisor_and_complete_input_census_required', 'Source authority boundary differs.');
  const sourceArtifact = artifacts.get('sourceReceipt'), sourceRoot = receiptRoot(sourceArtifact);
  const sourcePins = ledger(source.retained_file_pins, 512, 2147483648, source.retained_pin_bytes);
  rows(source.variants, 4).forEach((variant, index) => {
    keys(variant, ['label', 'repetitions', 'source_path', 'source_sha256', 'kir_path', 'kir_file_sha256', 'exported', 'inspection', 'simulations']);
    const label = LABELS[index], selected = artifacts.get('source/' + label), sourceLabel = LABELS[Math.min(index, 2)];
    check(variant.label === label && variant.repetitions === COUNTS[index] &&
      variant.source_path === sourceRoot + '/' + sourceLabel + '-source/src/lib.rs' &&
      variant.kir_path === sourceRoot + '/' + label + '.kir', 'Source label/count/path differs.');
    check(selected.path === variant.source_path && selected.sha256 === variant.source_sha256 &&
      selected.sha256 === SOURCE_HASHES[Math.min(index, 2)], 'Reviewed whole source bytes differ.');
    requirePin(sourcePins, selected.path, selected);
    digest(variant.kir_file_sha256);
    keys(variant.exported, ['canonical_sha256', 'canonical_bytes', 'retained_source_inventory', 'retained_source_preflight', 'semantic_identity']);
    for (const field of ['canonical_sha256', 'retained_source_inventory', 'retained_source_preflight', 'semantic_identity']) digest(variant.exported[field]);
    integer(variant.exported.canonical_bytes, 65536, 1);
    requirePin(sourcePins, variant.kir_path, { sha256: variant.kir_file_sha256, bytes: variant.exported.canonical_bytes });
    validateInspection(variant.inspection, variant.exported, variant.repetitions);
    same(variant.simulations, expectedSimulationRows(variant.repetitions), 'Reported CPU matrix differs; no summary-only acceptance.');
  });
  const a = artifacts.get('source/one').utf8, exactLine = '        repeat(1) { add(out, out, input1); }\n';
  check(a.split(exactLine).length === 2, 'Exact repeat source boundary missing.');
  for (const [label, n] of [['two', 2], ['fifteen', 15]])
    check(artifacts.get('source/' + label).utf8 === a.replace(exactLine, exactLine.replace('repeat(1)', 'repeat(' + n + ')')), 'Surrounding source bytes differ.');
  check(artifacts.get('source/repeat').utf8 === artifacts.get('source/fifteen').utf8, 'Repeated whole source differs.');
  for (const field of ['source_sha256', 'kir_file_sha256']) {
    check(new Set(source.variants.slice(0, 3).map(v => v[field])).size === 3, 'Changed source identities collapsed.');
    check(source.variants[2][field] === source.variants[3][field], 'Repeated source identity differs.');
  }
  for (const field of ['canonical_sha256', 'semantic_identity', 'retained_source_preflight'])
    check(new Set(source.variants.slice(0, 3).map(v => v.exported[field])).size === 3, 'Changed executable identities collapsed.');
  check(new Set(source.variants.slice(0, 3).map(v => v.inspection.declared_source_ids.statement)).size === 3, 'Changed statements collapsed.');
  same(source.variants[2].exported, source.variants[3].exported); same(source.variants[2].inspection, source.variants[3].inspection);
  const labels = sourceStageLabels();
  rows(source.stages, 136).forEach((s, at) => {
    stage(s, labels[at], at >= 128 ? 1 : 0, 1140000, 1048576);
    check(sourcePins.has(s.executable), 'Source executable absent from reported census.');
    for (const stream of ['stdout', 'stderr'])
      requirePin(sourcePins, sourceRoot + '/' + s.label + '.' + stream, { bytes: s[stream + '_bytes'], sha256: s[stream + '_sha256'] });
  });
  rows(source.refusals, 8).forEach((refusal, at) => {
    keys(refusal, ['label', 'kind', 'diagnostic', 'source_path', 'cargo_exit', 'exporter_exit', 'kir_absent', 'source_sha256']);
    const [label, kind, diagnostic] = REFUSALS[at];
    check(refusal.label === label && refusal.kind === kind && refusal.diagnostic === diagnostic &&
      refusal.cargo_exit === 101 && refusal.exporter_exit === 1 && refusal.kir_absent === true &&
      refusal.source_path === sourceRoot + '/refuse-' + label + '-source/src/lib.rs', 'Reported source refusal differs.');
    digest(refusal.source_sha256); const retained = sourcePins.get(refusal.source_path);
    check(retained && retained.sha256 === refusal.source_sha256 && retained.bytes > 0 && retained.bytes <= 65536, 'Refusal source pin differs.');
  });
  keys(llvm, ['schema', 'status', 'authority', 'source_capture', 'lowerer', 'fresh_lowerer_calls',
    'retained_simulations_revalidated', 'fresh_simulations', 'retained_frontend_refusals_revalidated', 'stages',
    'variants', 'selected_pins', 'selected_pin_bytes', 'selected_inputs_unchanged', 'limits', ...EMIT_FALSE, ...LLVM_EXTRA_FALSE, 'accounting']);
  flags(llvm, [...EMIT_FALSE, ...LLVM_EXTRA_FALSE]); same(llvm.limits, LLVM_LIMITS);
  check(llvm.schema === 'task-ordered-repeat-llvm-observation-v1' && llvm.status === 'passed' && llvm.authority === 'observation_only' &&
    llvm.fresh_lowerer_calls === 4 && llvm.retained_simulations_revalidated === 120 && llvm.fresh_simulations === 0 &&
    llvm.retained_frontend_refusals_revalidated === 8 && llvm.selected_inputs_unchanged === true &&
    llvm.accounting === 'selected file custody and bounded process output only; outer build provenance, process-group and full-root guards remain required',
  'Unsupported repeat LLVM receipt.');
  pin(llvm.source_capture); matchArtifact(sourceArtifact, llvm.source_capture); check(sourceArtifact.path === llvm.source_capture.path);
  pin(llvm.lowerer);
  const llvmPins = ledger(llvm.selected_pins, 560, 3221225472, llvm.selected_pin_bytes), llvmRoot = receiptRoot(artifacts.get('llvmReceipt'));
  for (const value of sourcePins.values()) same(llvmPins.get(value.path), value, 'Historical source ledger differs.');
  same(llvmPins.get(llvm.source_capture.path), llvm.source_capture); same(llvmPins.get(llvm.lowerer.path), llvm.lowerer);
  rows(llvm.stages, 4); rows(llvm.variants, 4).forEach((variant, index) => {
    keys(variant, ['label', 'repetitions', 'source_path', 'source_sha256', 'semantic_identity', 'retained_source_preflight',
      'retained_source_inventory', 'kir_path', 'kir_file_sha256', 'canonical_identity', 'llvm_path', 'llvm_bytes', 'llvm_sha256', 'report', 'observed']);
    const original = source.variants[index], selected = artifacts.get('llvm/' + LABELS[index]);
    for (const field of ['label', 'repetitions', 'source_path', 'source_sha256', 'kir_path', 'kir_file_sha256']) check(variant[field] === original[field], 'LLVM source label/identity differs.');
    for (const [field, origin] of [['semantic_identity', 'semantic_identity'], ['retained_source_preflight', 'retained_source_preflight'],
      ['retained_source_inventory', 'retained_source_inventory'], ['canonical_identity', 'canonical_sha256']])
      check(variant[field] === original.exported[origin], 'LLVM executable identity differs.');
    check(variant.llvm_path === llvmRoot + '/' + variant.label + '.ll' && selected.path === variant.llvm_path);
    matchArtifact(selected, { bytes: variant.llvm_bytes, sha256: variant.llvm_sha256 }); requirePin(llvmPins, selected.path, selected);
    validateEmission(variant.report, original, selected); same(variant.observed, inspectRepeatLlvm(selected.utf8, original));
    const s = llvm.stages[index]; stage(s, variant.label, 0, 60000, 4096);
    check(s.executable === llvm.lowerer.path && s.stderr_bytes === 0); same(s.args, [original.kir_path, selected.path]);
    for (const stream of ['stdout', 'stderr'])
      requirePin(llvmPins, llvmRoot + '/' + variant.label + '.' + stream, { bytes: s[stream + '_bytes'], sha256: s[stream + '_sha256'] });
  });
  check(new Set(llvm.variants.slice(0, 3).map(v => v.llvm_sha256)).size === 3, 'Changed LLVM identities collapsed.');
  for (const field of ['llvm_sha256', 'llvm_bytes', 'report', 'observed']) same(llvm.variants[2][field], llvm.variants[3][field]);
  check(artifacts.get('llvm/fifteen').utf8 === artifacts.get('llvm/repeat').utf8);
  // This join never replays KIR/CPU/refusal streams not among the exact 23 selected artifacts.
  same(join.source_variants, source.variants.map(v => ({ label: v.label, repetitions: v.repetitions,
    source_sha256: v.source_sha256, exported: v.exported, kir_file_sha256: v.kir_file_sha256 })));
  same(join.llvm_variants, llvm.variants);
  return { source, llvm, sourcePins, llvmPins };
}
