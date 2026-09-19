// Synthetic presentation controls. No source compilation, census capture or GPU observation.
import { NAVIGATION_AUTHORITY, NAVIGATION_AVAILABILITY, NAVIGATION_CAPABILITIES } from '../../../src/content/authoring-navigation.mjs';
import { programSha256 } from '../../../src/content/ordered-program-observation.mjs';

const pin = n => n.toString(16).padStart(64, '0');
export async function syntheticNavigationEnvelope() {
  const utf8 = '// Synthetic presentation control: café. Not compiler evidence.\npub fn bitwise_chain(low: u32) -> u32 { low | 256 }\n';
  const sourceBytes = new TextEncoder().encode(utf8), file = pin(1);
  const start = new TextEncoder().encode(utf8.slice(0, utf8.lastIndexOf('low | 256'))).length;
  const source = { utf8, bytes: sourceBytes.length, sha256: await programSha256(utf8), file_identity: file };
  const span = { file_identity: file, display_path: 'synthetic.rs', byte_start: String(start), byte_end: String(start + 9), line: 2, column: 1 };
  const inputs = [{ value: 14, ty: 'Scalar(U32)' }, { value: 15, ty: 'Scalar(U32)' }];
  const operations = [0, 1].map(i => ({ coordinate: { function: 0, block: 0, operation: i }, function_name: 'bitwise_chain', kind: i ? 'binary' : 'constant', semantic_detail: i ? 'BitOr' : 'U32(256)', mnemonic: null, inline_assembly_source: null, inputs: i ? inputs : [], results: [{ value: i ? 16 : 15, ty: 'Scalar(U32)' }], local_memory_effects: [], complete_local_effect_summary: true, convergence: 'not_analyzed', traps: 'not_analyzed', physical_resources: 'unavailable_logical_canonical_stage', source_binding: 'bundle_content_bound_not_authenticated', source_spans: [span], materialization: i ? 'diagnostic_rust_draft_available' : 'unavailable_unsupported_operation_or_contract' }));
  const summary = { schema: 'fe2o3-multilevel-authoring-observation-v1', authority: NAVIGATION_AUTHORITY, bundle_identity: pin(2), bundle_subject_identity: pin(3), canonical_kir_version: 11, canonical_kir_digest: pin(4), canonical_kir_bytes: '400', target: 'gfx942:xnack-', source_map_identity: pin(5), semantic_mir_identity: pin(6), rustc_identity_inventory_receipt_sha256: pin(7), rustc_identity_inventory_receipt_bytes: '544', rustc_preflight_plan_receipt_sha256: pin(8), rustc_preflight_plan_receipt_bytes: '1700', compiler_policy_identity: 'unavailable_in_v6', final_artifact_identity: 'unavailable_extraction_precedes_final_artifact', operation_count: 2, eliminated_source_span_count: 0, capabilities: NAVIGATION_CAPABILITIES };
  const selector = { bundle_identity: summary.bundle_identity, canonical_kir_digest: summary.canonical_kir_digest, target: summary.target, operations: [operations[1].coordinate] };
  const region = { authority: NAVIGATION_AUTHORITY, selector, structural_boundary: 'contiguous_operations_in_one_block_no_terminator_selected', source_insertion_boundary: 'unavailable_source_application_not_admitted', live_in: inputs, live_out: operations[1].results, operations: [operations[1]], materialization: 'diagnostic_rust_draft_available' };
  const attributions = operations.map(row => ({ coordinate: row.coordinate, file_identity: file, byte_start: start, byte_end: start + 9 }));
  return JSON.parse(JSON.stringify({ schema: 'fe2o3-tutorial-authoring-navigation-v1', kind: 'synthetic_test_only', authority: 'display_only', sourceCaptureSha256: pin(9), navigation: { source, summary, source_file_identity: file, selector, region, operations, attributions, selected_range_occurrences: attributions, source_binding: 'census_joined_attribution_not_ssa_ownership', authority: NAVIGATION_AUTHORITY, availability: NAVIGATION_AVAILABILITY } }));
}
export async function navigationInputFor(envelope) {
  const captureUtf8 = JSON.stringify(envelope) + '\n';
  return { captureUtf8, expectedCaptureSha256: await programSha256(captureUtf8) };
}
export async function syntheticNavigationInput() { return navigationInputFor(await syntheticNavigationEnvelope()); }
