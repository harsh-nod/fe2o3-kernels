// Synthetic parser/control fixture ONLY. No compiler/CPU/native execution or ELF qualification.
import { createHash } from 'node:crypto';
import { LABELS, COUNTS, PLAN, CONSTRAINTS, LLVM_BUILD, EMIT_FALSE, SOURCE_FALSE, NATIVE_FALSE, declaredProgram, declaredSteps } from '../../src/content/repeat-native-core.mjs';
import { SOURCE_LIMITS, LLVM_LIMITS, REFUSALS, expectedSimulationRows, sourceStageLabels } from '../../src/content/repeat-native-source.mjs';
import { NATIVE_LIMITS, SHAPE, MUTATIONS, POST_LINK } from '../../src/content/repeat-native-machine.mjs';
const H = bytes => createHash('sha256').update(bytes).digest('hex');
const clone = value => structuredClone(value);
const negative = fields => Object.fromEntries(fields.map(field => [field, false]));
const sourceRoot = '/synthetic/source', llvmRoot = '/synthetic/llvm', nativeRoot = '/synthetic/native';
const originalSource = '// Future normal-source fixture, not a claim of completed frontend admission.\n' +
  '#![no_std]\nuse fe2o3_device::{DisjointSlice, amdgpu_ordered_program, kernel, thread};\n\n' +
  '#[kernel(typed, launch(required = [64, 1, 1], max = [64, 1, 1]))]\n' +
  'pub fn ordered_repeat_u32(\n    mut output: DisjointSlice<u32>,\n    a: u32,\n    b: u32,\n    c: u32,\n) {\n' +
  '    let result = amdgpu_ordered_program! {\n        gfx942_xnack_off_wave64;\n' +
  '        scratch(32); out(33); in(34) = a; in(35) = b; in(36) = c;\n' +
  '        init { mov(out, input0); }\n        repeat(1) { add(out, out, input1); }\n    };\n' +
  '    if let Some(element) = output.get_mut(thread::index_1d()) {\n        *element = result;\n    }\n}\n';
function edit(target, role, edits) {
  for (const item of edits.filter(item => item.role === role)) {
    let owner = target;
    for (const key of item.path.slice(0, -1)) owner = owner[key];
    owner[item.path.at(-1)] = clone(item.value);
  }
}
function artifact(role, path, bytes, encoding = 'utf8') {
  const buffer = typeof bytes === 'string' ? Buffer.from(bytes) : bytes;
  const value = encoding === 'hex' ? buffer.toString('hex') : buffer.toString('utf8'), chunks = [];
  for (let at = 0; at < value.length; at += 65536) chunks.push(value.slice(at, at + 65536));
  return { role, path, bytes: buffer.length, sha256: H(buffer), encoding, chunks };
}
const jsonArtifact = (role, path, value) => artifact(role, path, JSON.stringify(value));
const filePin = value => ({ path: value.path, bytes: value.bytes, sha256: value.sha256,
  device: '1', inode: '2', mode: '33152', nlink: '1', mtime_ns: '3', ctime_ns: '4' });
const fakePin = (path, text = '') => filePin(artifact('not-selected', path, text));
const stage = (label, executable, args, output = '') => ({ label, executable, args, code: 0, signal: null,
  reason: null, elapsed_ms: 1, stdout_bytes: Buffer.byteLength(output), stdout_sha256: H(output),
  stderr_bytes: 0, stderr_sha256: H('') });
const ledger = () => {
  const pins = new Map();
  return { add: pin => { pins.set(pin.path, clone(pin)); return pin; },
    rows: () => [...pins.values()], bytes: () => [...pins.values()].reduce((n, pin) => n + pin.bytes, 0) };
};
function inspection(exported, repetitions) {
  return { kind: 'diagnostic_ordered_program_inspection_example', authority: 'observation_only',
    canonical: { wire_version: 17, sha256: exported.canonical_sha256, bytes: exported.canonical_bytes },
    kernel: 'ordered_repeat_u32', function: 'ordered_repeat_u32', coordinate: { function_ordinal: 0, block_ordinal: 0, operation_ordinal: 0 },
    raw_block_id: 1, input_value_ids: [0, 3, 8], result_value_id: 11, declared_target: 'gfx942:xnack-',
    declared_wave_width: 64, profile: 'closed_u32_program_e32_v1',
    register_plan: { scratch: 32, output: 33, inputs: [34, 35, 36], vgpr_high_water: 37 },
    declared_program: declaredProgram(repetitions), declared_instruction_steps: declaredSteps(repetitions),
    declared_source_ids: { frontend_unit: H('unit' + repetitions), function: H('function'), contract: H('contract'), statement: H('statement' + repetitions) },
    memory_effect: 'NoMemory', ordered_region_effect: true, pure_or_movable: false,
    logical_observation_granularity: 'whole_program_before_after', source_authentication: false, source_map_available: false,
    physical_register_values_available: false, instruction_microsteps_available: false, register_lifetime_or_final_allocation_proof: false,
    proof_authority: false, artifact_authority: false, production_resume_authority: false, hardware_execution: false, cpu_preflight_passed: true,
    inspection_counts: { blocks: 7, operations: 8, ssa_definitions: 11, capability_entries: 9, name_bytes: 339 },
    inspection_max_canonical_bytes_after_admission: 65536, cpu_preflight_resident_limit_bytes: 67108864, output_buffer_bytes: 8192,
    accounting_scope: 'shared canonical admission, CPU resident accounting, and this borrowed structural/output bound are separate; not a combined allocator or RSS cap' };
}
function llvmText(repetitions) {
  const assembly = '  %v11 = call i32 asm sideeffect "' +
    ['v_mov_b32_e32 $0, $1', ...Array(repetitions).fill('v_add_u32_e32 $0, $0, $2')].join('\\0A\\09') +
    '", "' + CONSTRAINTS + '"(i32 %arg1, i32 %arg2, i32 %arg3)';
  return { text: ['target triple = "amdgcn-amd-amdhsa"',
    'define amdgpu_kernel void @ordered_repeat_u32(ptr addrspace(1) %arg0.data, i64 %arg0.len, i32 %arg1, i32 %arg2, i32 %arg3) #0 !reqd_work_group_size !0 {',
    '  ; ordered-program-v17 vgpr-high-water=37 (binding extent; final descriptor unverified)', assembly,
    '  store i32 %v11, ptr addrspace(1) %v16, align 4', '}',
    'attributes #0 = { "amdgpu-flat-work-group-size"="64,64" "target-features"="-wavefrontsize32,+wavefrontsize64,-xnack" "target-cpu"="gfx942" }',
    '!0 = !{i32 64, i32 1, i32 1}', ''].join('\n'),
  observed: { result_ssa: '%v11', assembly_line: assembly, instruction_count: repetitions + 1,
    constraints: CONSTRAINTS, result_store_line: '  store i32 %v11, ptr addrspace(1) %v16, align 4' } };
}
function emission(original, llvm) {
  return { kind: 'diagnostic_ordered_program_llvm_observation', authority: 'observation_only', canonical_wire_version: 17,
    canonical_identity: original.exported.canonical_sha256, canonical_bytes: original.exported.canonical_bytes,
    input_file_sha256: original.kir_file_sha256, llvm_sha256: llvm.sha256, llvm_bytes: llvm.bytes,
    program_count: original.repetitions + 1, descriptors: declaredProgram(original.repetitions).descriptors, register_plan: [...PLAN],
    canonical_retained_storage_bytes: 26785, canonical_work_limit: 67108864, canonical_storage_limit: 67108864,
    max_input_bytes: 65536, max_published_llvm_bytes: 65536, emitter_text_limit_bytes: 16777216,
    canonical_and_emitter_accounting_are_separate: true, ...negative(EMIT_FALSE) };
}
function nativeCase(label, repetitions, optimization, llvm) {
  const bytes = Buffer.alloc(256); bytes[200] = optimization === 'O0' ? 1 : 2; bytes[201] = repetitions;
  bytes.writeUInt32LE(optimization === 'O0' ? 6 : 4, 48); bytes.writeUInt32LE(9, 44);
  const program = Array.from({ length: repetitions + 1 }, (_, at) => {
    const bytes_hex = at === 0 ? '2203427e' : '21474268', file_offset = 80 + at * 4;
    Buffer.from(bytes_hex, 'hex').copy(bytes, file_offset);
    return { file_offset, opcode: at === 0 ? 'V_MOV_B32_e32_vi' : 'V_ADD_U32_e32_gfx9', bytes_hex,
      mc_flags: 0, register_operands: at === 0 ? ['VGPR33', 'VGPR34'] : ['VGPR33', 'VGPR33', 'VGPR35'],
      implicit_reads: ['EXEC'], implicit_writes: [] };
  });
  const selected = artifact('payload/' + label + '/' + optimization, nativeRoot + '/' + label + '-payloads/' + optimization + '.hsaco', bytes, 'hex');
  const payload = { path: selected.path, bytes: selected.bytes, sha256: selected.sha256,
    matches_linked_worker_payload: true, create_new_only: true, production_artifact_authority: false };
  const descriptor = { file_offset: 0, bytes: 64, sha256: H(bytes.subarray(0, 64)),
    compute_pgm_rsrc1: bytes.readUInt32LE(48), compute_pgm_rsrc3: 9,
    vgpr_capacity: optimization === 'O0' ? 56 : 40, architected_vgpr_boundary: 40,
    required_footprint_high_water: 37, interpretation: 'encoded-capacity-not-metadata-usage-or-lifetime' };
  const machine = { optimization, llvm_sha256: llvm.llvm_sha256, llvm_bytes: llvm.llvm_bytes,
    hsaco_sha256: selected.sha256, hsaco_bytes: selected.bytes, entry_file_offset: 64, entry_code_bytes: 128,
    static_instruction_count: 40, program, descriptor, post_link_checks: [...POST_LINK,
      'post_link.kernel name=ordered_repeat_u32 symbol=ordered_repeat_u32.kd kernarg_size=288 group_size=0 private_size=0 kernarg_align=8 wavefront_size=64 max_workgroup_size=64 reqd_workgroup_size=[64,1,1]'],
    derivation_identity: H(label + optimization), boundary_value_or_lifetime_proof: false, repetitions, unique_sequence_matches: 1 };
  return { selected, wrapper: { machine_observation: machine, mutation_controls: clone(MUTATIONS), retained_payload: payload } };
}
export function repeatFixture(edits = [], profile = 'legacy') {
  if (!['legacy', 'origin-v1'].includes(profile)) throw new Error('Closed synthetic export profile.');
  const sourcePins = ledger(), llvmPins = ledger(), nativePins = ledger();
  const sourceTool = sourcePins.add(fakePin('/synthetic/source-tool', 'tool'));
  const sources = LABELS.map((label, index) => artifact('source/' + label,
    sourceRoot + '/' + LABELS[Math.min(index, 2)] + '-source/src/lib.rs', originalSource.replace('repeat(1)', 'repeat(' + COUNTS[index] + ')')));
  sources.forEach(value => sourcePins.add(filePin(value)));
  const sourceVariants = LABELS.map((label, index) => {
    const repetitions = COUNTS[index], kir = sourcePins.add(fakePin(sourceRoot + '/' + label + '.kir', 'KIR' + repetitions));
    const exported = { canonical_sha256: H('canonical' + repetitions), canonical_bytes: kir.bytes,
      retained_source_inventory: H('inventory'), retained_source_preflight: H('preflight' + repetitions), semantic_identity: H('semantic' + repetitions) };
    return { label, repetitions, source_path: sources[index].path, source_sha256: sources[index].sha256,
      kir_path: kir.path, kir_file_sha256: kir.sha256, exported, inspection: inspection(exported, repetitions),
      simulations: expectedSimulationRows(repetitions) };
  });
  if (profile === 'origin-v1') {
    for (const label of LABELS) sourcePins.add(fakePin(sourceRoot + '/' + label + '.origin.json', 'synthetic sidecar pin only'));
    for (const name of ['ordered-repeat-source-smoke.mjs', 'ordered-repeat-origin-v1.mjs'])
      sourcePins.add(fakePin('/synthetic/compiler/scripts/' + name, 'synthetic helper pin only'));
  }
  const sourceStages = sourceStageLabels().map((label, at) => {
    let args = [];
    if (label.endsWith('-export')) {
      const name = label.slice(0, -'-export'.length), negative = name.startsWith('refuse-');
      const sourceLabel = name === 'repeat' ? 'fifteen' : name;
      args = ['--diagnostic-kir-v17', '--crate', 'fe2o3_assembly_authoring_v30_fixture',
        '--output', sourceRoot + '/' + name + '.kir', '--target', 'gfx942',
        '--target-dir', sourceRoot + '/' + name + '-extraction',
        ...(profile === 'origin-v1' && !negative ? ['--diagnostic-ordered-origin-v1', sourceRoot + '/' + name + '.origin.json'] : []),
        '--', '--manifest-path', sourceRoot + '/' + sourceLabel + '-source/Cargo.toml', '--lib', '--offline',
        ...(negative ? ['--message-format=json'] : [])];
    }
    const s = stage(label, sourceTool.path, args); if (at >= 128) s.code = 1;
    for (const stream of ['stdout', 'stderr']) sourcePins.add(fakePin(sourceRoot + '/' + label + '.' + stream));
    return s;
  });
  const refusals = REFUSALS.map(([label, kind, diagnostic]) => {
    const p = sourcePins.add(fakePin(sourceRoot + '/refuse-' + label + '-source/src/lib.rs', label));
    return { label, kind, diagnostic, source_path: p.path, cargo_exit: 101, exporter_exit: 1, kir_absent: true, source_sha256: p.sha256 };
  });
  const source = { schema: 'task-ordered-repeat-source-acceptance-v1', status: 'passed', authority: 'observation_only',
    origin: 'fresh_rust_normal_exporter_v17_inspector_and_cpu_simulator', successful_exports: 4, exact_frontend_refusals: 8,
    whole_kernel_simulations: 120, variants: sourceVariants, refusals, stages: sourceStages, retained_file_pins: sourcePins.rows(),
    retained_pin_bytes: sourcePins.bytes(), limits: clone(SOURCE_LIMITS),
    bundle_identity: 'unavailable_this_normal_export_route_is_raw_diagnostic_kir_v17_not_bundle_v6',
    compiler_identity_source: 'normal_live_exporter_never_inferred_from_preflight_or_file_hash',
    inventory_semantics: 'retained_root_contract_census_not_body_digest_repeat_requires_exact_equality',
    declared_instruction_count: '2_3_16_steps_one_ordered_region_whole_region_logical_observation',
    ...negative(SOURCE_FALSE), task_resource_accounting: 'external_current_scope_supervisor_and_complete_input_census_required' };
  edit(source, 'sourceReceipt', edits);
  const sourceReceipt = jsonArtifact('sourceReceipt', sourceRoot + '/receipt.json', source);
  sourcePins.rows().forEach(p => llvmPins.add(p)); const sourceCapture = llvmPins.add(filePin(sourceReceipt));
  const lowerer = llvmPins.add(fakePin('/synthetic/lowerer', 'lowerer')), llvmStages = [];
  const llvmArtifacts = LABELS.map((label, at) => artifact('llvm/' + label, llvmRoot + '/' + label + '.ll', llvmText(COUNTS[at]).text));
  const llvmVariants = LABELS.map((label, at) => {
    const original = sourceVariants[at], selected = llvmArtifacts[at], report = emission(original, selected);
    llvmPins.add(filePin(selected));
    const s = stage(label, lowerer.path, [original.kir_path, selected.path], JSON.stringify(report)); llvmStages.push(s);
    llvmPins.add(fakePin(llvmRoot + '/' + label + '.stdout', JSON.stringify(report))); llvmPins.add(fakePin(llvmRoot + '/' + label + '.stderr'));
    return { label, repetitions: original.repetitions, source_path: original.source_path, source_sha256: original.source_sha256,
      semantic_identity: original.exported.semantic_identity, retained_source_preflight: original.exported.retained_source_preflight,
      retained_source_inventory: original.exported.retained_source_inventory, kir_path: original.kir_path, kir_file_sha256: original.kir_file_sha256,
      canonical_identity: original.exported.canonical_sha256, llvm_path: selected.path, llvm_bytes: selected.bytes, llvm_sha256: selected.sha256,
      report, observed: llvmText(original.repetitions).observed };
  });
  const llvm = { schema: 'task-ordered-repeat-llvm-observation-v1', status: 'passed', authority: 'observation_only',
    source_capture: sourceCapture, lowerer, fresh_lowerer_calls: 4, retained_simulations_revalidated: 120,
    fresh_simulations: 0, retained_frontend_refusals_revalidated: 8, stages: llvmStages, variants: llvmVariants,
    selected_pins: llvmPins.rows(), selected_pin_bytes: llvmPins.bytes(), selected_inputs_unchanged: true, limits: clone(LLVM_LIMITS),
    ...negative(EMIT_FALSE), ...negative(['native_qualified', 'llvm_verified_by_new_parser', 'physical_register_lifetime_proof', 'runtime_loop_or_schedule_added', 'milestone_completion']),
    accounting: 'selected file custody and bounded process output only; outer build provenance, process-group and full-root guards remain required' };
  edit(llvm, 'llvmReceipt', edits);
  const llvmReceipt = jsonArtifact('llvmReceipt', llvmRoot + '/receipt.json', llvm);
  llvmPins.rows().forEach(p => nativePins.add(p)); const llvmCapture = nativePins.add(filePin(llvmReceipt));
  const observer = nativePins.add(fakePin('/synthetic/observer', 'observer')), payloads = [], reports = [], native = [], nativeStages = [];
  LABELS.forEach((label, at) => {
    const original = llvmVariants[at], retained = ['O0', 'O3'].map(opt => nativeCase(label, COUNTS[at], opt, original));
    retained.forEach(value => { payloads.push(value.selected); nativePins.add(filePin(value.selected)); });
    const report = { report_kind: 'task-ordered-repeat-native-observation-v1', authority: 'unauthenticated-test-transport',
      repetitions: COUNTS[at], program_count: COUNTS[at] + 1, kernel_symbol: 'ordered_repeat_u32', register_plan: [...PLAN],
      constraints: CONSTRAINTS, required_binding_extent: 37, result_use: 'sole-direct-nonvolatile-nonatomic-global-store',
      llvm_sha256: original.llvm_sha256, llvm_bytes: original.llvm_bytes, expected_input_identity_matched: true,
      retained_file_identity_and_bytes_rechecked: true, llvm_build_claim: LLVM_BUILD, worker_build_claim: 'fe2o3-worker-v1-sha256-' + H('worker'),
      target: 'gfx942:xnack-', wave_width: 64, workgroup_size: 64, code_object_version: 6, shape_controls: clone(SHAPE),
      cases: retained.map(value => value.wrapper), source_ancestry: 'not-established-by-llvm-file',
      synthetic_worker_request_identity_fields: true, runtime_closure_attestation: 'unavailable', ...negative(NATIVE_FALSE) };
    edit(report, 'report/' + label, edits);
    const selected = jsonArtifact('report/' + label, nativeRoot + '/' + label + '.stdout', report); reports.push(selected);
    nativePins.add(filePin(selected)); nativePins.add(fakePin(nativeRoot + '/' + label + '.stderr'));
    nativeStages.push(stage(label, observer.path, [String(COUNTS[at]), original.llvm_path, original.llvm_sha256,
      String(original.llvm_bytes), nativeRoot + '/' + label + '-payloads'], selected.chunks.join('')));
    native.push({ label, report, observations: report.cases.map(wrapper => {
      const m = wrapper.machine_observation;
      return { optimization: m.optimization, repetitions: m.repetitions, llvm_sha256: m.llvm_sha256, llvm_bytes: m.llvm_bytes,
        payload: clone(wrapper.retained_payload), instruction_offsets: m.program.map(site => site.file_offset),
        descriptor: clone(m.descriptor), unique_sequence_matches: 1, boundary_value_or_lifetime_proof: false };
    }) });
  });
  const join = { schema: 'task-ordered-repeat-source-native-join-v1', status: 'passed', authority: 'observation_only',
    source_capture: sourceCapture, llvm_capture: llvmCapture, observer,
    source_variants: sourceVariants.map(v => ({ label: v.label, repetitions: v.repetitions, source_sha256: v.source_sha256,
      exported: v.exported, kir_file_sha256: v.kir_file_sha256 })), llvm_variants: llvmVariants,
    retained_source_exports: 4, retained_cpu_simulations_revalidated: 120, retained_frontend_refusals_revalidated: 8,
    retained_llvm_lowerings: 4, fresh_source_exports: 0, fresh_llvm_lowerings: 0, fresh_cpu_simulations: 0,
    fresh_native_invocations: 4, native_optimization_cases: 8, complete_hsaco_payloads: 8,
    stages: nativeStages, native, selected_inputs_unchanged: true, selected_pins: nativePins.rows(), selected_pin_bytes: nativePins.bytes(),
    actual_read_bytes: nativePins.bytes(), limits: clone(NATIVE_LIMITS),
    full_payload_offset_join: 'worker ELF file offsets and whole bytes; no byte scanning',
    native_repeat_scope: 'fresh O0/O3 repeated exact LLVM; finite whole-payload equality, not global stability',
    ...negative(NATIVE_FALSE), ...negative(['proof_authority', 'runtime_loop_or_schedule_added', 'production_resume', 'performance_prediction', 'native_qualified', 'milestone_completion']),
    runtime_closure_attestation: 'unavailable',
    accounting: 'outer pinned build/SDK/source census, task-parent custody, process-group and full-root guards required' };
  edit(join, 'join', edits);
  const joinArtifact = jsonArtifact('join', nativeRoot + '/receipt.json', join);
  return { capsule: { schema: 'fe2o3-repeat-native-comparison-example-v1',
    provenance: { capture_name: 'synthetic repeat parser control; not a native capture', kind: 'synthetic_test_only',
      producer_authenticated: false, qualified_release_pin: null },
    artifacts: [sourceReceipt, llvmReceipt, joinArtifact, ...sources, ...llvmArtifacts, ...reports, ...payloads] },
  joinSha256: joinArtifact.sha256 };
}
