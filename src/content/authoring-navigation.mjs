// Private presentation projection, never a compiler wire format or editable owner.
import { parseProgramJson, programSha256 } from './ordered-program-observation.mjs';

export const NAVIGATION_LIMITS = Object.freeze({ captureBytes: 524288, sourceBytes: 16384, operations: 64, spans: 16, values: 16 });
export const NAVIGATION_AUTHORITY = Object.freeze({ observation_only: true, authenticates_compiler_execution: false, source_authenticated: false, grants_proof_authority: false, grants_production_resume: false, grants_load_or_launch: false });
export const NAVIGATION_AVAILABILITY = Object.freeze({ rust_text: 'census_joined_retained_bytes_diagnostic_only', source_to_kir: 'many_to_many_attribution_not_ssa_binding_ownership', canonical_simt_v11: 'available_exact_observation_and_selected_structural_boundary', typed_rust_hir: 'unavailable_no_typed_snapshot', semantic_mir: 'identity_only_no_body', scheduled_tile_rust: 'unavailable', separate_neutral_target_lineage: 'unavailable', compiler_handoff_llvm: 'unavailable_not_retained', final_artifact_isa: 'unavailable_export_precedes_artifact', physical_resources: 'unavailable_logical_canonical_stage', source_edit_boundary: 'unavailable', cpu_selected_values: 'unavailable_not_observed', traps: 'not_analyzed', convergence: 'not_analyzed', compiler_policy: 'unavailable_in_v6', runtime_closure: 'unavailable_selected_file_measurements_only' });
const absent = level => ({ level, read: 'unavailable', select: 'unavailable', materialize: 'unavailable', edit: 'unavailable', readmit: 'unavailable', simulate: 'unavailable', inspect: 'unavailable' });
export const NAVIGATION_CAPABILITIES = Object.freeze([
  Object.freeze({ ...absent('structured_rust'), read: 'source_locations_only' }), Object.freeze(absent('scheduled_tile_rust')),
  Object.freeze({ level: 'canonical_simt_v11', read: 'available', select: 'bounded_contiguous_block', materialize: 'bounded_u32_bitwise_or_validated_inline_isa_draft', edit: 'external_source_edit_only', readmit: 'requires_fresh_source_compilation_supported_subset', simulate: 'separate_existing_simulator_with_coverage_checks', inspect: 'available' }),
  Object.freeze(absent('physical_register_exact_region')),
]);
const check = (ok, message) => { if (!ok) throw new Error(message); };
function keys(value, expected) {
  check(value !== null && typeof value === 'object' && !Array.isArray(value), 'Expected object.');
  check(Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key)), 'Unexpected or missing fields.');
}
function array(value, maximum, minimum = 0) { check(Array.isArray(value) && value.length >= minimum && value.length <= maximum, 'Array bound.'); return value; }
function integer(value, maximum = 0xffffffff) { check(Number.isSafeInteger(value) && value >= 0 && value <= maximum, 'Integer bound.'); return value; }
function text(value, maximum) { check(typeof value === 'string' && new TextEncoder().encode(value).length <= maximum, 'Text bound.'); return value; }
function digest(value) { check(typeof value === 'string' && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value), 'Invalid digest.'); return value; }
function ordered(value) { return Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])])) : value; }
function same(left, right) { check(JSON.stringify(ordered(left)) === JSON.stringify(ordered(right)), 'Snapshot, declaration or attribution mismatch.'); }
function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
function decimal(value, maximum) { check(typeof value === 'string' && /^(0|[1-9][0-9]{0,19})$/u.test(value), 'Decimal byte bound.'); const n = BigInt(value); check(n <= BigInt(maximum), 'Decimal extent.'); return Number(n); }
export function navigationCoordinateKey(value) { keys(value, ['function', 'block', 'operation']); Object.values(value).forEach(n => integer(n)); return `${value.function}:${value.block}:${value.operation}`; }
function values(rows) { return array(rows, NAVIGATION_LIMITS.values).map(row => { keys(row, ['value', 'ty']); integer(row.value); text(row.ty, 512); return row; }); }
function spanRange(span, source) {
  keys(span, ['file_identity', 'display_path', 'byte_start', 'byte_end', 'line', 'column']);
  same(span.file_identity, source.file_identity); text(span.display_path, 4096);
  const start = decimal(span.byte_start, source.bytes), end = decimal(span.byte_end, source.bytes);
  check(start <= end, 'Reversed source range.');
  const bytes = new TextEncoder().encode(source.utf8);
  for (const n of [start, end]) check(n === bytes.length || (bytes[n] & 0xc0) !== 0x80, 'Source endpoint inside UTF-8 code point.');
  check(integer(span.line) > 0 && integer(span.column) > 0, 'Source line/column.');
  return { file_identity: span.file_identity, byte_start: start, byte_end: end };
}
function operation(row, source) {
  keys(row, ['coordinate', 'function_name', 'kind', 'semantic_detail', 'mnemonic', 'inline_assembly_source', 'inputs', 'results', 'local_memory_effects', 'complete_local_effect_summary', 'convergence', 'traps', 'physical_resources', 'source_binding', 'source_spans', 'materialization']);
  navigationCoordinateKey(row.coordinate); same(row.coordinate.function, 0); same(row.function_name, 'bitwise_chain');
  check(typeof row.kind === 'string' && /^[a-z_]{1,64}$/u.test(row.kind) && row.kind !== 'inline_assembly', 'Ordinary operation kind.');
  same(row.mnemonic, null); same(row.inline_assembly_source, null);
  if (row.semantic_detail !== null) text(row.semantic_detail, 512);
  values(row.inputs); values(row.results); array(row.local_memory_effects, 16).forEach(effect => text(effect, 4096));
  check(typeof row.complete_local_effect_summary === 'boolean', 'Effect completeness must be explicit.');
  same(row.convergence, 'not_analyzed'); same(row.traps, 'not_analyzed'); same(row.physical_resources, 'unavailable_logical_canonical_stage');
  const spans = array(row.source_spans, NAVIGATION_LIMITS.spans);
  same(row.source_binding, spans.length ? 'bundle_content_bound_not_authenticated' : 'unavailable_no_source_span');
  check(['diagnostic_rust_draft_available', 'unavailable_unsupported_operation_or_contract'].includes(row.materialization), 'Materialization availability.');
  return spans.map(span => ({ coordinate: row.coordinate, ...spanRange(span, source) }));
}
/** Source byte selection returns all overlapping occurrences. It never picks a unique operator. */
export function navigationOccurrences(view, start, end) {
  integer(start, view.source.bytes); integer(end, view.source.bytes); check(start < end, 'Nonempty half-open source selection required.');
  const bytes = new TextEncoder().encode(view.source.utf8);
  for (const n of [start, end]) check(n === bytes.length || (bytes[n] & 0xc0) !== 0x80, 'Source selection inside UTF-8 code point.');
  const keys = new Set(view.attributions.filter(row => row.file_identity === view.source_file_identity && row.byte_start < end && start < row.byte_end).map(row => navigationCoordinateKey(row.coordinate)));
  return view.operations.filter(row => keys.has(navigationCoordinateKey(row.coordinate)));
}
export async function projectAuthoringNavigation(input) {
  if (input === null) return { status: 'unavailable', detail: 'Retained source-navigation capture pending. No source or KIR observations supplied.' };
  try {
    keys(input, ['captureUtf8', 'expectedCaptureSha256']);
    const raw = text(input.captureUtf8, NAVIGATION_LIMITS.captureBytes), pin = digest(input.expectedCaptureSha256);
    if (!globalThis.crypto?.subtle) return { status: 'unavailable', detail: 'WebCrypto is required for retained-byte integrity.' };
    same(await programSha256(raw), pin);
    const envelope = parseProgramJson(raw, NAVIGATION_LIMITS.captureBytes);
    keys(envelope, ['schema', 'kind', 'authority', 'sourceCaptureSha256', 'navigation']);
    same(envelope.schema, 'fe2o3-tutorial-authoring-navigation-v1'); same(envelope.authority, 'display_only');
    check(['retained_source_navigation', 'synthetic_test_only'].includes(envelope.kind), 'Unknown capture kind.'); digest(envelope.sourceCaptureSha256);
    const view = envelope.navigation;
    keys(view, ['source', 'summary', 'source_file_identity', 'selector', 'region', 'operations', 'attributions', 'selected_range_occurrences', 'source_binding', 'authority', 'availability']);
    same(view.authority, NAVIGATION_AUTHORITY); same(view.availability, NAVIGATION_AVAILABILITY);
    same(view.source_binding, 'census_joined_attribution_not_ssa_ownership'); digest(view.source_file_identity);
    const source = view.source; keys(source, ['utf8', 'bytes', 'sha256', 'file_identity']);
    const encoded = new TextEncoder().encode(text(source.utf8, NAVIGATION_LIMITS.sourceBytes));
    same(encoded.length, integer(source.bytes, NAVIGATION_LIMITS.sourceBytes)); check(source.bytes > 0, 'Empty source.');
    check(!source.utf8.includes('\r') && !source.utf8.startsWith('\ufeff'), 'Normalized source offsets unavailable for CR/BOM.');
    check(source.utf8.includes('pub fn bitwise_chain(') && !source.utf8.includes('amdgpu_asm'), 'Closed ordinary source fixture.');
    same(source.file_identity, view.source_file_identity); same(await programSha256(source.utf8), digest(source.sha256));
    const summary = view.summary;
    keys(summary, ['schema', 'authority', 'bundle_identity', 'bundle_subject_identity', 'canonical_kir_version', 'canonical_kir_digest', 'canonical_kir_bytes', 'target', 'source_map_identity', 'semantic_mir_identity', 'rustc_identity_inventory_receipt_sha256', 'rustc_identity_inventory_receipt_bytes', 'rustc_preflight_plan_receipt_sha256', 'rustc_preflight_plan_receipt_bytes', 'compiler_policy_identity', 'final_artifact_identity', 'operation_count', 'eliminated_source_span_count', 'capabilities']);
    same(summary.schema, 'fe2o3-multilevel-authoring-observation-v1'); same(summary.authority, NAVIGATION_AUTHORITY);
    same(summary.target, 'gfx942:xnack-'); same(summary.canonical_kir_version, 11);
    for (const name of ['bundle_identity', 'bundle_subject_identity', 'canonical_kir_digest', 'source_map_identity', 'semantic_mir_identity', 'rustc_identity_inventory_receipt_sha256', 'rustc_preflight_plan_receipt_sha256']) digest(summary[name]);
    for (const name of ['canonical_kir_bytes', 'rustc_identity_inventory_receipt_bytes', 'rustc_preflight_plan_receipt_bytes']) check(decimal(summary[name], 4194304) > 0, 'Empty retained identity extent.');
    same(summary.compiler_policy_identity, 'unavailable_in_v6'); same(summary.final_artifact_identity, 'unavailable_extraction_precedes_final_artifact');
    same(summary.capabilities, NAVIGATION_CAPABILITIES); integer(summary.eliminated_source_span_count, 65536);
    const operations = array(view.operations, NAVIGATION_LIMITS.operations, 1); same(operations.length, integer(summary.operation_count, NAVIGATION_LIMITS.operations));
    const attributions = [], seen = new Set();
    for (const row of operations) {
      const key = navigationCoordinateKey(row.coordinate); check(!seen.has(key), 'Duplicate operation occurrence.'); seen.add(key);
      const prior = operations[seen.size - 2]?.coordinate;
      check(!prior || row.coordinate.block > prior.block || row.coordinate.block === prior.block && row.coordinate.operation === prior.operation + 1, 'Operation roster order.');
      check(prior?.block === row.coordinate.block || row.coordinate.operation === 0, 'Block roster origin.');
      attributions.push(...operation(row, source));
    }
    same(view.attributions, attributions);
    const selector = view.selector; keys(selector, ['bundle_identity', 'canonical_kir_digest', 'target', 'operations']);
    for (const name of ['bundle_identity', 'canonical_kir_digest', 'target']) same(selector[name], summary[name]);
    check(array(selector.operations, 1, 1).length === 1, 'One retained region.');
    const selected = operations.find(row => navigationCoordinateKey(row.coordinate) === navigationCoordinateKey(selector.operations[0]));
    check(selected && selected.kind === 'binary' && selected.semantic_detail === 'BitOr', 'Retained OR selection missing.');
    check(operations.filter(row => row.kind === 'binary' && row.semantic_detail === 'BitOr').length === 1, 'Ambiguous OR region selector.');
    check(selected.inputs.length === 2 && selected.results.length === 1 && [...selected.inputs, ...selected.results].every(value => value.ty === 'Scalar(U32)'), 'Selected scalar boundary.');
    const region = view.region; keys(region, ['authority', 'selector', 'structural_boundary', 'source_insertion_boundary', 'live_in', 'live_out', 'operations', 'materialization']);
    same(region.authority, NAVIGATION_AUTHORITY); same(region.selector, selector); same(region.operations, [selected]);
    same(values(region.live_in), selected.inputs); same(values(region.live_out), selected.results);
    same(region.structural_boundary, 'contiguous_operations_in_one_block_no_terminator_selected'); same(region.source_insertion_boundary, 'unavailable_source_application_not_admitted'); same(region.materialization, 'diagnostic_rust_draft_available');
    check(selected.complete_local_effect_summary && selected.local_memory_effects.length === 0, 'Selected complete local effect contract.');
    const selectedSpans = attributions.filter(row => navigationCoordinateKey(row.coordinate) === navigationCoordinateKey(selected.coordinate));
    check(selectedSpans.length > 0, 'Retained selected attribution missing.');
    const alternatives = attributions.filter(row => selectedSpans.some(span => span.file_identity === row.file_identity && span.byte_start === row.byte_start && span.byte_end === row.byte_end));
    same(view.selected_range_occurrences, alternatives);
    check(alternatives.some(row => navigationCoordinateKey(row.coordinate) !== navigationCoordinateKey(selected.coordinate)), 'Expected many-to-one attribution missing.');
    return freeze({ status: 'ready', captureKey: pin, kind: envelope.kind, sourceCaptureSha256: envelope.sourceCaptureSha256, navigation: view });
  } catch (error) { return { status: 'invalid', detail: error instanceof Error ? error.message.slice(0, 240) : 'Invalid navigation input.' }; }
}
