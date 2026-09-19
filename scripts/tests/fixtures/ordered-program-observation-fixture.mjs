// Synthetic presentation controls only. Never import this into application content.
import { PROGRAM_VARIANTS, PROGRAM_PAIR_ROLES, programSha256 } from '../../../src/content/ordered-program-observation.mjs';
const digest = number => number.toString(16).padStart(64, '0');
export const exact = value => JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? JSON.rawJSON(item.toString()) : item);
export function syntheticProgramCapture() {
  return { schema: 'fe2o3-tutorial-ordered-program-observation-v1', kind: 'synthetic_test_only', authority: 'display_only', sourceReceiptSha256: digest(1), aggregateReceiptSha256: digest(2),
    variants: PROGRAM_VARIANTS.map((variant, vi) => {
      const count = { one: 1, three: 3, sixteen: 16 }[variant.profile];
      const descriptors = [8, ...Array(count - 1).fill(72), ...Array(16 - count).fill(0)];
      const view = { kind: 'diagnostic_ordered_program_inspection_example', authority: 'observation_only', kernel: 'ordered_u32_program', function: 'synthetic_test_only', canonical: { wire_version: 17, sha256: digest(10 + vi), bytes: 256 }, coordinate: { function_ordinal: 0, block_ordinal: 1, operation_ordinal: 0 }, raw_block_id: 8,
        input_value_ids: [0, 1, 2], result_value_id: 3, declared_target: 'gfx942:xnack-', declared_wave_width: 64, profile: 'closed_u32_program_e32_v1', memory_effect: 'NoMemory', ordered_region_effect: true, logical_observation_granularity: 'whole_program_before_after', cpu_preflight_passed: true,
        register_plan: { scratch: 32, output: 33, inputs: [34, 35, 36], vgpr_high_water: 37 }, declared_program: { count, descriptors }, declared_instruction_steps: Array.from({ length: count }, (_, i) => ({ instruction: 'v_mov_b32_e32', output: 33, inputs: [i ? 33 : 34] })), declared_source_ids: { frontend_unit: digest(20), function: digest(21), contract: digest(22), statement: digest(23) } };
      for (const key of ['source_authentication', 'source_map_available', 'physical_register_values_available', 'instruction_microsteps_available', 'register_lifetime_or_final_allocation_proof', 'proof_authority', 'artifact_authority', 'production_resume_authority', 'hardware_execution', 'pure_or_movable']) view[key] = false;
      const inspectionUtf8 = exact(view) + '\n';
      const cases = Array.from({ length: 6 }, (_, ci) => {
        const configurationIdentity = digest(100 + vi * 6 + ci), lane = { level: 'lane', workgroup: [0, 0, 0], wave: 0, lane: 0 };
        const anchor = (revision, event) => ({ cursor: { configuration_identity: configurationIdentity, event_sequence: event, state_revision: revision }, scope: { ...lane, logical_workitem: [0, 0, 0], active_mask: 0xffffffffffffffffn, wave_width: 64, interpretation: 'logical_visualization' }, site: { kir: { function_ordinal: 0, block_ordinal: 1, point: { kind: 'operation', operation_ordinal: 0 } }, source: { status: 'unavailable', reason: 'requires_authenticated_map' } } });
        const ssa = id => ({ root: { kind: 'ssa', function_ordinal: 0, frame: 1, value_ordinal: id }, components: [] });
        const pair = (role, id, revision, event, operation, fields, result, mutate) => {
          const current = anchor(revision, event);
          return { role, requestUtf8: exact({ schema: 'fe2o3-debug-request-v1', request_id: id, expected_revision: revision - (mutate ? 1 : 0), operation, ...fields }), responseUtf8: exact({ schema: 'fe2o3-debug-response-v1', request_id: id, operation, status: 'ok', session: { backend: 'cpu_kir_simulator', execution_kind: 'cpu_kir_simulation', state: 'stopped', revision, configuration_identity: configurationIdentity, cursor: current.cursor, simulated: true, hardware_observed: false, performance_prediction: false }, result }) };
        };
        const control = (role, id, revision, event, direction) => pair(role, id, revision, event, direction === 'start' ? 'continue' : 'step', direction === 'start' ? { max_events: 16384 } : { direction, granularity: 'event', count: 1 }, { result: 'control', stop: { reason: direction === 'start' ? 'breakpoint' : 'step', exact: true, outcome: 'active' }, snapshot: { status: 'captured', snapshot: { anchor: anchor(revision, event) } } }, true);
        const values = (role, id, revision, event, ids, absent = false) => pair(role, id, revision, event, 'inspect_values', { scope: lane, frame: 1, selector: { selector: 'paths', paths: ids.map(ssa) }, page: { limit: 16 } }, { result: 'values', snapshot: { ...anchor(revision, event), frame: 1, occurrence: 1 }, values: ids.map(value => ({ path: ssa(value), availability: absent ? { status: 'unavailable', reason: 'not_in_scope' } : { status: 'captured', value_type: { kind: 'integer', signed: false, bits: 32 }, value: { encoding: 'bits', bits: '0x' + (ci + (value === 3 ? 0 : value)).toString(16).padStart(8, '0') }, provenance: 'simulated_observation' } })) }, false);
        return { index: ci, configurationIdentity, simulationRequestSha256: digest(200 + ci), requestsSha256: digest(300 + vi * 6 + ci), responsesSha256: digest(400 + vi * 6 + ci), pairs: [
          control(PROGRAM_PAIR_ROLES[0], 4, 2, 3, 'start'), values(PROGRAM_PAIR_ROLES[1], 5, 2, 3, [0, 1, 2]), values(PROGRAM_PAIR_ROLES[2], 6, 2, 3, [3], true),
          control(PROGRAM_PAIR_ROLES[3], 9, 3, 4, 'forward'), values(PROGRAM_PAIR_ROLES[4], 10, 3, 4, [3]),
          control(PROGRAM_PAIR_ROLES[5], 14, 4, 3, 'reverse'), values(PROGRAM_PAIR_ROLES[6], 15, 4, 3, [0, 1, 2]),
          control(PROGRAM_PAIR_ROLES[7], 16, 5, 4, 'forward'), values(PROGRAM_PAIR_ROLES[8], 17, 5, 4, [3]),
        ] };
      });
      return { ...variant, inspectionUtf8, inspectionSha256: '', cases };
    }),
  };
}
export async function inputForCapture(capture) {
  for (const variant of capture.variants) variant.inspectionSha256 = await programSha256(variant.inspectionUtf8);
  const captureUtf8 = exact(capture) + '\n'; return { captureUtf8, expectedCaptureSha256: await programSha256(captureUtf8) };
}
export async function syntheticProgramInput() { return inputForCapture(syntheticProgramCapture()); }
