// Closed final-payload joins. Instruction offsets come from the report, never a byte search.
import { parseProgramJson } from './ordered-program-observation.mjs';
import { buildDeclaredRegisterUseGrid } from './final-native-register-roles.mjs';
import { buildOrderedRoleLiveness } from './ordered-role-liveness.mjs';
import { check, keys, rows, integer, text, digest, same, flags, pin, ledger, requirePin, matchArtifact,
  receiptRoot, stage, sha256, hex, LABELS, COUNTS, OPTS, PLAN, CONSTRAINTS, LLVM_BUILD, NATIVE_FALSE } from './repeat-native-core.mjs';
export const NATIVE_LIMITS = { calls: 4, cases: 8, command_ms: 180000, wall_ms: 1140000,
  stream_bytes: 65536, payload_bytes: 1048576, receipt_bytes: 1048576, selected_file_bytes: 536870912,
  pins: 600, pin_bytes: 3221225472, read_bytes: 12884901888, output_bytes: 33554432,
  output_files: 32, output_directories: 5, min_ram_bytes: 68719476736 };
export const SHAPE = { typed_shape_positives: 6, typed_shape_negatives: 78, input_identity_positives: 1,
  input_identity_negatives: 3, file_snapshot_positives: 1, file_snapshot_negatives: 9,
  count_selector_positives: 3, count_selector_negatives: 4, worker_or_target_machine_invoked: false, captured_llvm_mutated: false };
export const MUTATIONS = { decoded_field_refusals: 28, stale_identity_refusals: 1, synthetic_view_positives: 1,
  gapped_sequence_refusals: 1, duplicate_sequence_refusals: 1, extra_add_refusals: 1, wrong_count_refusals: 1,
  raw_byte_mismatch_refusals: 1, redecoded_opposite_opcode_refusals: 1, opposite_opcode_mutated_payload_observed: true,
  descriptor_capacity_positives: 1, descriptor_capacity_refusals: 3, original_payload_unchanged: true,
  captured_llvm_mutated: false, mutated_payload_executed_on_hardware: false };
const JOIN_EXTRA_FALSE = ['proof_authority', 'runtime_loop_or_schedule_added', 'production_resume',
  'performance_prediction', 'native_qualified', 'milestone_completion'];
export const POST_LINK = [
  'post_link.check=target status=ok arch=gfx942 code_object_version=6 e_flags=0x64c',
  'post_link.check=exports status=ok symbols=[ordered_repeat_u32,ordered_repeat_u32.kd]',
  'post_link.check=unresolved status=ok symbols=[]',
  'post_link.check=metadata status=ok kernels=1 target=amdgcn-amd-amdhsa--gfx942%3Axnack-',
];
function launch(lines) {
  rows(lines, 5).forEach(line => text(line, 1024));
  same(lines.slice(0, 4), POST_LINK);
  const m = /^post_link.kernel name=ordered_repeat_u32 symbol=ordered_repeat_u32\.kd kernarg_size=([0-9]{1,10}) group_size=([0-9]{1,10}) private_size=([0-9]{1,10}) kernarg_align=([1-9][0-9]{0,4}) wavefront_size=64 max_workgroup_size=64 reqd_workgroup_size=\[64,1,1\]$/u.exec(lines[4]);
  check(m, 'Exact repeat-native launch reporting contract differs.');
  for (const n of m.slice(1, 4)) { check(/^(?:0|[1-9][0-9]*)$/u.test(n)); integer(Number(n)); }
  const alignment = integer(Number(m[4]), 32768, 1); check((alignment & (alignment - 1)) === 0);
}
async function machine(wrapper, selected, original, optimization, payloadDirectory) {
  keys(wrapper, ['machine_observation', 'mutation_controls', 'retained_payload']); same(wrapper.mutation_controls, MUTATIONS);
  const value = wrapper.machine_observation, payload = wrapper.retained_payload;
  keys(value, ['optimization', 'llvm_sha256', 'llvm_bytes', 'hsaco_sha256', 'hsaco_bytes',
    'entry_file_offset', 'entry_code_bytes', 'static_instruction_count', 'program', 'descriptor',
    'post_link_checks', 'derivation_identity', 'boundary_value_or_lifetime_proof', 'repetitions', 'unique_sequence_matches']);
  check(value.optimization === optimization && value.repetitions === original.repetitions &&
    value.unique_sequence_matches === 1 && value.boundary_value_or_lifetime_proof === false, 'Native optimization/count or proof claim differs.');
  check(value.llvm_sha256 === original.llvm_sha256 && value.llvm_bytes === original.llvm_bytes, 'Native LLVM identity differs.');
  digest(value.derivation_identity);
  keys(payload, ['path', 'bytes', 'sha256', 'matches_linked_worker_payload', 'create_new_only', 'production_artifact_authority']);
  check(payload.path === payloadDirectory + '/' + optimization + '.hsaco' && selected.path === payload.path &&
    payload.matches_linked_worker_payload === true && payload.create_new_only === true && payload.production_artifact_authority === false,
  'Payload role/path or authority differs.');
  matchArtifact(selected, payload); matchArtifact(selected, { bytes: value.hsaco_bytes, sha256: value.hsaco_sha256 });
  const bytes = selected.raw, count = original.repetitions + 1;
  integer(value.entry_file_offset, bytes.length); integer(value.entry_code_bytes, bytes.length - value.entry_file_offset, count * 4);
  integer(value.static_instruction_count, 512, count);
  const program = rows(value.program, count).map((site, at) => {
    keys(site, ['file_offset', 'opcode', 'bytes_hex', 'mc_flags', 'register_operands', 'implicit_reads', 'implicit_writes']);
    const opcode = at === 0 ? 'V_MOV_B32_e32_vi' : 'V_ADD_U32_e32_gfx9', bytesHex = at === 0 ? '2203427e' : '21474268';
    const registers = at === 0 ? ['VGPR33', 'VGPR34'] : ['VGPR33', 'VGPR33', 'VGPR35'];
    check(site.opcode === opcode && site.bytes_hex === bytesHex, 'Native opcode/encoding differs.'); same(site.register_operands, registers);
    integer(site.file_offset, value.entry_file_offset + value.entry_code_bytes - 4, value.entry_file_offset);
    integer(site.mc_flags, 65535); check((site.mc_flags & ~16) === 0, 'Unsupported native instruction effects.');
    same(site.implicit_reads, ['EXEC']); same(site.implicit_writes, []);
    check(site.file_offset === value.program[0].file_offset + 4 * at, 'Native instruction offsets are not contiguous.');
    check(hex(bytes.subarray(site.file_offset, site.file_offset + 4)) === bytesHex, 'Whole-payload instruction bytes differ at reported offset.');
    return { declaredInstruction: at === 0 ? 'v_mov_b32_e32' : 'v_add_u32_e32', opcode, bytesHex,
      registers, fileOffset: site.file_offset };
  });
  const d = value.descriptor;
  keys(d, ['file_offset', 'bytes', 'sha256', 'compute_pgm_rsrc1', 'compute_pgm_rsrc3',
    'vgpr_capacity', 'architected_vgpr_boundary', 'required_footprint_high_water', 'interpretation']);
  integer(d.file_offset, bytes.length - 64); digest(d.sha256);
  check(d.bytes === 64 && d.required_footprint_high_water === 37 &&
    d.interpretation === 'encoded-capacity-not-metadata-usage-or-lifetime', 'Unsupported descriptor interpretation.');
  check(d.file_offset + 64 <= value.entry_file_offset || value.entry_file_offset + value.entry_code_bytes <= d.file_offset, 'Descriptor overlaps entry code.');
  const raw = bytes.subarray(d.file_offset, d.file_offset + 64), view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  check(await sha256(raw) === d.sha256, 'Descriptor slice hash differs.');
  integer(d.compute_pgm_rsrc1); integer(d.compute_pgm_rsrc3);
  check(view.getUint32(48, true) === d.compute_pgm_rsrc1 && view.getUint32(44, true) === d.compute_pgm_rsrc3, 'Descriptor little-endian words differ.');
  check(d.vgpr_capacity === ((d.compute_pgm_rsrc1 & 63) + 1) * 8 &&
    d.architected_vgpr_boundary === ((d.compute_pgm_rsrc3 & 63) + 1) * 4 &&
    d.vgpr_capacity >= d.architected_vgpr_boundary && d.architected_vgpr_boundary >= 37, 'Descriptor capacity does not cover binding extent.');
  launch(value.post_link_checks);
  const registerGrid = buildDeclaredRegisterUseGrid(PLAN, program.map((s, at) =>
    ({ output: 33, inputs: at === 0 ? [34] : [33, 35], fileOffset: s.fileOffset })));
  return { summary: { optimization, repetitions: original.repetitions, llvm_sha256: original.llvm_sha256,
    llvm_bytes: original.llvm_bytes, payload: { ...payload }, instruction_offsets: program.map(s => s.fileOffset),
    descriptor: { ...d }, unique_sequence_matches: 1, boundary_value_or_lifetime_proof: false },
  projection: { program, registerGrid, hsacoSha256: selected.sha256, hsacoBytes: selected.bytes,
    staticInstructions: value.static_instruction_count, declaredVgprHighWater: 37, encodedVgprCapacity: d.vgpr_capacity,
    architectedVgprBoundary: d.architected_vgpr_boundary, descriptorOffset: d.file_offset,
    descriptorSha256: d.sha256, resource1: d.compute_pgm_rsrc1, resource3: d.compute_pgm_rsrc3 } };
}
export async function validateRepeatNativeJoin(join, origin, artifacts) {
  keys(join, ['schema', 'status', 'authority', 'source_capture', 'llvm_capture', 'observer', 'source_variants', 'llvm_variants',
    'retained_source_exports', 'retained_cpu_simulations_revalidated', 'retained_frontend_refusals_revalidated', 'retained_llvm_lowerings',
    'fresh_source_exports', 'fresh_llvm_lowerings', 'fresh_cpu_simulations', 'fresh_native_invocations', 'native_optimization_cases',
    'complete_hsaco_payloads', 'stages', 'native', 'selected_inputs_unchanged', 'selected_pins', 'selected_pin_bytes',
    'actual_read_bytes', 'limits', 'full_payload_offset_join', 'native_repeat_scope', ...NATIVE_FALSE, ...JOIN_EXTRA_FALSE,
    'runtime_closure_attestation', 'accounting']);
  flags(join, [...NATIVE_FALSE, ...JOIN_EXTRA_FALSE]); same(join.limits, NATIVE_LIMITS);
  check(join.schema === 'task-ordered-repeat-source-native-join-v1' && join.status === 'passed' && join.authority === 'observation_only' &&
    join.selected_inputs_unchanged === true && join.runtime_closure_attestation === 'unavailable', 'Unsupported repeat-native join.');
  for (const [field, n] of [['retained_source_exports', 4], ['retained_cpu_simulations_revalidated', 120],
    ['retained_frontend_refusals_revalidated', 8], ['retained_llvm_lowerings', 4], ['fresh_source_exports', 0],
    ['fresh_llvm_lowerings', 0], ['fresh_cpu_simulations', 0], ['fresh_native_invocations', 4],
    ['native_optimization_cases', 8], ['complete_hsaco_payloads', 8]]) check(join[field] === n, 'Native capture counts differ.');
  check(join.full_payload_offset_join === 'worker ELF file offsets and whole bytes; no byte scanning' &&
    join.native_repeat_scope === 'fresh O0/O3 repeated exact LLVM; finite whole-payload equality, not global stability' &&
    join.accounting === 'outer pinned build/SDK/source census, task-parent custody, process-group and full-root guards required',
  'Native interpretation boundary differs.');
  integer(join.actual_read_bytes, 12884901888);
  for (const [field, role] of [['source_capture', 'sourceReceipt'], ['llvm_capture', 'llvmReceipt']]) {
    pin(join[field]); check(join[field].path === artifacts.get(role).path); matchArtifact(artifacts.get(role), join[field]);
  }
  same(join.source_capture, origin.llvm.source_capture);
  pin(join.observer);
  const pins = ledger(join.selected_pins, 600, 3221225472, join.selected_pin_bytes), root = receiptRoot(artifacts.get('join'));
  for (const p of origin.llvmPins.values()) same(pins.get(p.path), p, 'Native historical LLVM ledger differs.');
  same(pins.get(join.llvm_capture.path), join.llvm_capture); same(pins.get(join.observer.path), join.observer);
  rows(join.stages, 4); rows(join.native, 4); const cases = [];
  for (let index = 0; index < 4; index++) {
    const label = LABELS[index], n = COUNTS[index], llvm = origin.llvm.variants[index], source = origin.source.variants[index];
    const selected = artifacts.get('report/' + label), wrapper = join.native[index], report = parseProgramJson(selected.utf8, 65536);
    keys(wrapper, ['label', 'report', 'observations']); check(wrapper.label === label); same(report, wrapper.report, 'Raw native report does not match retained join.');
    check(selected.path === root + '/' + label + '.stdout'); requirePin(pins, selected.path, selected);
    keys(report, ['report_kind', 'authority', 'repetitions', 'program_count', 'kernel_symbol', 'register_plan',
      'constraints', 'required_binding_extent', 'result_use', 'llvm_sha256', 'llvm_bytes', 'expected_input_identity_matched',
      'retained_file_identity_and_bytes_rechecked', 'llvm_build_claim', 'worker_build_claim', 'target', 'wave_width',
      'workgroup_size', 'code_object_version', 'shape_controls', 'cases', 'source_ancestry', 'synthetic_worker_request_identity_fields',
      'runtime_closure_attestation', ...NATIVE_FALSE]);
    flags(report, NATIVE_FALSE); same(report.shape_controls, SHAPE); same(report.register_plan, PLAN);
    check(report.report_kind === 'task-ordered-repeat-native-observation-v1' && report.authority === 'unauthenticated-test-transport' &&
      report.repetitions === n && report.program_count === n + 1 && report.kernel_symbol === 'ordered_repeat_u32' &&
      report.constraints === CONSTRAINTS && report.required_binding_extent === 37 &&
      report.result_use === 'sole-direct-nonvolatile-nonatomic-global-store' && report.llvm_sha256 === llvm.llvm_sha256 &&
      report.llvm_bytes === llvm.llvm_bytes && report.expected_input_identity_matched === true &&
      report.retained_file_identity_and_bytes_rechecked === true && report.llvm_build_claim === LLVM_BUILD &&
      report.target === 'gfx942:xnack-' && report.wave_width === 64 && report.workgroup_size === 64 && report.code_object_version === 6 &&
      report.source_ancestry === 'not-established-by-llvm-file' && report.synthetic_worker_request_identity_fields === true &&
      report.runtime_closure_attestation === 'unavailable', 'Unsupported native report profile or identity.');
    check(typeof report.worker_build_claim === 'string' && /^fe2o3-worker-v1-sha256-[0-9a-f]{64}$/u.test(report.worker_build_claim) &&
      !report.worker_build_claim.endsWith('0'.repeat(64)), 'Invalid worker build claim.');
    if (index) check(report.worker_build_claim === join.native[0].report.worker_build_claim, 'Worker claims differ across cases.');
    const payloadDirectory = root + '/' + label + '-payloads', s = join.stages[index];
    stage(s, label, 0, 180000, 65536);
    check(s.executable === join.observer.path && s.stdout_bytes === selected.bytes && s.stdout_sha256 === selected.sha256 && s.stderr_bytes === 0);
    same(s.args, [String(n), llvm.llvm_path, llvm.llvm_sha256, String(llvm.llvm_bytes), payloadDirectory]);
    requirePin(pins, root + '/' + label + '.stderr', { bytes: s.stderr_bytes, sha256: s.stderr_sha256 });
    rows(report.cases, 2); rows(wrapper.observations, 2);
    for (let opt = 0; opt < 2; opt++) {
      const optimization = OPTS[opt], payload = artifacts.get('payload/' + label + '/' + optimization);
      requirePin(pins, payload.path, payload);
      const result = await machine(report.cases[opt], payload, llvm, optimization, payloadDirectory);
      same(result.summary, wrapper.observations[opt], 'Native summary is stale or substituted.');
      cases.push({ id: label + '-' + optimization, label, repetitions: n, optimization,
        source: artifacts.get('source/' + label).utf8, sourceSha256: source.source_sha256,
        semanticSha256: source.exported.semantic_identity, canonicalKirSha256: source.exported.canonical_sha256,
        kirFileSha256: source.kir_file_sha256, sourceInventorySha256: source.exported.retained_source_inventory,
        sourcePreflightSha256: source.exported.retained_source_preflight,
        logicalLiveness: buildOrderedRoleLiveness({
          descriptors: source.inspection.declared_program.descriptors.slice(0, source.inspection.declared_program.count),
          inputValueIds: source.inspection.input_value_ids, resultValueId: source.inspection.result_value_id,
          coordinate: [source.inspection.coordinate.function_ordinal, source.inspection.coordinate.block_ordinal,
            source.inspection.coordinate.operation_ordinal], rawBlockId: source.inspection.raw_block_id }),
        originBinding: { canonicalBytes: source.inspection.canonical.bytes,
          target: source.inspection.declared_target, waveWidth: source.inspection.declared_wave_width,
          declaredSourceIds: { ...source.inspection.declared_source_ids },
          coordinate: [source.inspection.coordinate.function_ordinal, source.inspection.coordinate.block_ordinal,
            source.inspection.coordinate.operation_ordinal], rawBlock: source.inspection.raw_block_id,
          declaredDescriptors: source.inspection.declared_program.descriptors.slice(0, source.inspection.declared_program.count),
          registerRoles: { scratch: source.inspection.register_plan.scratch, output: source.inspection.register_plan.output,
            inputs: [...source.inspection.register_plan.inputs] } },
        llvm: artifacts.get('llvm/' + label).utf8, llvmSha256: llvm.llvm_sha256,
        reportSha256: selected.sha256, payloadPath: payload.path, llvmBuildClaim: report.llvm_build_claim,
        workerBuildClaim: report.worker_build_claim, ...result.projection });
    }
  }
  for (const optimization of OPTS) {
    const a = artifacts.get('payload/fifteen/' + optimization), b = artifacts.get('payload/repeat/' + optimization);
    check(a.path !== b.path && a.bytes === b.bytes && a.sha256 === b.sha256 && hex(a.raw) === hex(b.raw),
      'Repeated native invocation is collapsed or its finite whole payload differs.');
  }
  return cases;
}
