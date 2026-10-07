// Read-only presentation of the existing actual nested-macro diagnostic.
// Byte consistency is not compiler authentication or executable authority.
import { parseProgramJson, programSha256 } from './ordered-program-observation.mjs';

export const MACRO_CAPTURE_LIMIT = 512 * 1024;
export const MACRO_REPORT_LIMIT = 128 * 1024;
export const MACRO_SOURCE_LIMIT = 64 * 1024;
const FIXTURE = 'crates/rustc-codegen-fe2o3/tests/fixtures/production-extraction-device/src/ordered_program_v32.rs';
const DEFINITION = 'crates/fe2o3-device/src/ordered_program.rs';
const SPAN_FIELDS = ['file_identity', 'byte_start', 'byte_end', 'line_start', 'column_start', 'line_end', 'column_end'];
const encoder = new TextEncoder();
function check(ok, message) { if (!ok) throw new Error(message); }
function keys(value, names) {
  check(value !== null && typeof value === 'object' && !Array.isArray(value), 'Expected an object.');
  check(Object.keys(value).length === names.length && names.every(name => Object.hasOwn(value, name)), 'Unexpected or missing fields.');
  return value;
}
function uint(value, max = 0xffffffff) { check(Number.isSafeInteger(value) && value >= 0 && value <= max, 'Inexact or out-of-range integer.'); return value; }
function digest(value) { check(typeof value === 'string' && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value), 'Invalid digest.'); return value; }
function text(value, limit) {
  check(typeof value === 'string' && value.length > 0 && value.length <= limit, 'Text limit exceeded.');
  for (const point of value) { const code = point.codePointAt(0); check(code < 0xd800 || code > 0xdfff, 'Invalid Unicode.'); }
  check(encoder.encode(value).length <= limit, 'UTF-8 byte limit exceeded.'); return value;
}
function array(value, count) {
  check(Array.isArray(value) && value.length === count && Array.from({ length: count }, (_, i) => Object.hasOwn(value, i)).every(Boolean), 'Wrong or sparse array.');
  return value;
}
function hex(value) { return array(value, 32).map(byte => uint(byte, 255).toString(16).padStart(2, '0')).join(''); }
function stable(value) {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stable(value[key])).join(',') + '}';
  return typeof value === 'bigint' ? 'u64:' + value : JSON.stringify(value);
}
function same(left, right, message = 'Retained records disagree.') { check(stable(left) === stable(right), message); }
function freeze(value) { if (value && typeof value === 'object') { for (const item of Object.values(value)) freeze(item); Object.freeze(value); } return value; }
function bytesFromHex(value) {
  check(typeof value === 'string' && value.length > 0 && value.length <= 131072 && /^(?:[0-9a-f]{2})+$/u.test(value), 'Invalid canonical byte payload.');
  return Uint8Array.from(value.match(/../gu), byte => parseInt(byte, 16));
}
async function bytesSha(bytes) {
  const result = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(result), byte => byte.toString(16).padStart(2, '0')).join('');
}
function span(value, numericIdentity = true) {
  keys(value, numericIdentity ? ['availability', ...SPAN_FIELDS] : SPAN_FIELDS);
  if (numericIdentity) check(value.availability === 'available', 'This fixed nested profile requires available origin coordinates.');
  const fileIdentity = digest(numericIdentity ? hex(value.file_identity) : value.file_identity);
  const start = uint(value.byte_start), end = uint(value.byte_end);
  check(start <= end, 'Reversed source range.');
  for (const key of ['line_start', 'column_start', 'line_end', 'column_end']) check(uint(value[key]) > 0, 'Unknown source coordinate.');
  check(value.line_start <= value.line_end && (value.line_start !== value.line_end || value.column_start <= value.column_end), 'Reversed source coordinates.');
  return { fileIdentity, start, end, lineStart: value.line_start, columnStart: value.column_start, lineEnd: value.line_end, columnEnd: value.column_end };
}
function sourceLocation(value, source, expectedFile) {
  same(value.fileIdentity, expectedFile, 'Source-file identity substitution.');
  if (source === null) return { ...value, path: null, excerpt: null, availability: 'source_bytes_unavailable' };
  const bytes = encoder.encode(source.utf8);
  check(value.end <= bytes.length && value.end - value.start <= 4096, 'Source interval exceeds the selected file or display bound.');
  const decoder = new TextDecoder('utf-8', { fatal: true });
  function coordinate(at) {
    const prefix = decoder.decode(bytes.subarray(0, at)), lines = prefix.split('\n');
    return [lines.length, [...lines[lines.length - 1]].length + 1];
  }
  same(coordinate(value.start), [value.lineStart, value.columnStart], 'Source start coordinate differs from exact bytes.');
  same(coordinate(value.end), [value.lineEnd, value.columnEnd], 'Source end coordinate differs from exact bytes.');
  return { ...value, path: source.path, excerpt: decoder.decode(bytes.subarray(value.start, value.end)), availability: 'selected_source_bytes' };
}
// Independent fixed-fixture anchors, matching the existing producer's source
// expectations. This is not a Rust parser or a compiler source-map decoder.
function uniqueRange(source, needle) {
  const at = source.indexOf(needle);
  check(at >= 0 && source.indexOf(needle, at + 1) < 0, 'Fixed source anchor is absent or ambiguous.');
  const start = encoder.encode(source.slice(0, at)).length;
  return [start, start + encoder.encode(needle).length];
}
function requireFixtureIntervals(rows, fixture, definition) {
  const wrapperStart = uniqueRange(fixture.utf8, 'macro_rules! ordered_program_wrapper')[0];
  const close = uniqueRange(fixture.utf8, '\n    };\n}\n\n#[cfg_attr(feature = "ordered-program-wrong-launch-v32",')[0];
  const wrapper = [wrapperStart, close + encoder.encode('\n    };\n}').length];
  const prefix = '#[cfg(feature = "ordered-program-nested-v32")]\nmacro_rules! ordered_program_wrapper {\n    ($a:expr, $b:expr, $c:expr) => {\n        ';
  const innerStart = uniqueRange(fixture.utf8, prefix)[1];
  const innerEnd = uniqueRange(fixture.utf8, '\n        }\n    };')[0] + encoder.encode('\n        }').length;
  check(wrapper[0] < wrapper[1] && innerStart < innerEnd, 'Invalid independently derived source ranges.');
  function exact(location, interval) { same([location.start, location.end], interval, 'Fixed producer source interval differs.'); }
  exact(rows[0].callSite, [innerStart, innerEnd]);
  exact(rows[1].expansion, [innerStart, innerEnd]);
  exact(rows[1].callSite, uniqueRange(fixture.utf8, 'ordered_program_wrapper!(a, b, c)'));
  exact(rows[1].definitionSite, wrapper);
  if (definition) exact(rows[0].definitionSite, uniqueRange(definition.utf8, 'macro_rules! amdgpu_ordered_program'));
}
function retained(value, limit) { keys(value, ['utf8', 'sha256']); return { utf8: text(value.utf8, limit), sha256: digest(value.sha256) }; }
function selection(value) {
  keys(value, ['reportSha256', 'canonicalSha256', 'sourceSha256', 'expansionChainSha256']);
  return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, digest(val)]));
}

/** Copies all caller-owned text and selection before the first await.
 * Only the producer's actual two-level, one-instruction fixture is supported.
 * No source map, compiler owner, trace, artifact or physical state is decoded. */
export async function projectOrderedMacroFrames(input) {
  if (input === null) return { status: 'unavailable', detail: 'Retained macro-frame capture pending.' };
  try {
    keys(input, ['captureUtf8', 'expectedCaptureSha256', 'selection']);
    const raw = text(input.captureUtf8, MACRO_CAPTURE_LIMIT), expected = digest(input.expectedCaptureSha256), selected = selection(input.selection);
    const capture = parseProgramJson(raw, MACRO_CAPTURE_LIMIT);
    keys(capture, ['schema', 'report', 'baseline', 'baselineHex', 'sources']);
    check(capture.schema === 'fe2o3-ordered-macro-frames-display-v1', 'Unsupported display capture.');
    const report = retained(capture.report, MACRO_REPORT_LIMIT), baseline = retained(capture.baseline, 16384);
    const canonical = bytesFromHex(capture.baselineHex);
    keys(capture.sources, ['fixture', 'definition']);
    function copySource(value, path) {
      keys(value, ['path', 'utf8', 'sha256']); same(value.path, path, 'Unsupported source role.');
      return { path, ...retained({ utf8: value.utf8, sha256: value.sha256 }, MACRO_SOURCE_LIMIT) };
    }
    const fixture = copySource(capture.sources.fixture, FIXTURE);
    const definition = capture.sources.definition === null ? null : copySource(capture.sources.definition, DEFINITION);
    if (!globalThis.crypto?.subtle) return { status: 'unavailable', detail: 'WebCrypto is unavailable; no source or frames are shown.' };
    same(await programSha256(raw), expected, 'Capture selection changed.');
    for (const item of [report, baseline, fixture, ...(definition ? [definition] : [])]) same(await programSha256(item.utf8), item.sha256, 'Retained byte digest mismatch.');
    same(report.sha256, selected.reportSha256, 'Report belongs to another selection.');
    same(fixture.sha256, selected.sourceSha256, 'Source belongs to another variant.');
    const r = parseProgramJson(report.utf8, MACRO_REPORT_LIMIT), b = parseProgramJson(baseline.utf8, 16384);
    keys(r, ['schema', 'invocation', 'observation', 'source_sha256', 'baseline_sha256', 'source_rechecked_after_callback', 'compiler_sessions', 'native_emitted', 'hardware_observed', 'artifact_or_launch_authority']);
    check(r.schema === 'fe2o3-actual-ordered-macro-frames-fixture-v1' && r.source_rechecked_after_callback === true && r.compiler_sessions === 1, 'Unsupported macro observation.');
    for (const key of ['native_emitted', 'hardware_observed', 'artifact_or_launch_authority']) same(r[key], false, 'Capture elevates authority.');
    keys(b, ['schema', 'case', 'feature', 'invocation', 'baseline', 'original_unchanged_source_export_route', 'actual_rustc_sessions', 'source_authentication_exported', 'artifact_or_launch_authority']);
    check(b.schema === 'fe2o3-ordered-stage-original-baseline-v1' && b.case === 'nested' && b.feature === 'ordered-program-nested-v32' && b.original_unchanged_source_export_route === true && b.actual_rustc_sessions === 1 && b.source_authentication_exported === false && b.artifact_or_launch_authority === false, 'Unsupported baseline provenance.');
    same(b.invocation, r.invocation, 'Different source/export invocations.');
    const inv = r.invocation;
    keys(inv, ['schema', 'case', 'feature', 'args', 'source_files', 'preparation_files', 'cargo_observation', 'crate_binding']);
    check(inv.schema === 'fe2o3-ordered-stage-prepared-invocation-v1' && inv.case === 'nested' && inv.feature === b.feature, 'Wrong source profile.');
    check(Array.isArray(inv.args) && inv.args.length > 0 && inv.args.length <= 128, 'Invocation extent.');
    inv.args.forEach(arg => text(arg, 4096)); digest(inv.cargo_observation); digest(inv.crate_binding);
    const sourceRows = array(inv.source_files, 6);
    const seen = new Set();
    for (const row of [...sourceRows, ...array(inv.preparation_files, 3)]) {
      keys(row, ['path', 'bytes', 'sha256']); text(row.path, 4096); uint(row.bytes, 16 * 1024 * 1024); digest(row.sha256);
      check(!seen.has(row.path), 'Duplicate source/preparation role.'); seen.add(row.path);
    }
    for (const source of [fixture, ...(definition ? [definition] : [])]) {
      const pin = sourceRows.find(row => row.path === source.path); check(pin, 'Source absent from actual invocation.');
      same(pin.sha256, source.sha256, 'Source differs from invocation.'); same(pin.bytes, encoder.encode(source.utf8).length);
    }
    same(r.source_sha256, fixture.sha256);
    keys(b.baseline, ['path', 'bytes', 'sha256']); same(b.baseline.path, 'nested.baseline-v17.bin');
    same(b.baseline.bytes, canonical.length); same(b.baseline.sha256, r.baseline_sha256);
    same(await bytesSha(canonical), digest(r.baseline_sha256), 'Independent baseline bytes differ.');
    const obs = keys(r.observation, ['actual', 'origin', 'macro_frames', 'full_original_baseline_equal_while_owner_live', 'inert_stale_canonical_callsite_inline_refusals', 'inert_nested_order_omission_outer_definition_identity_refusals']);
    for (const key of ['full_original_baseline_equal_while_owner_live', 'inert_stale_canonical_callsite_inline_refusals', 'inert_nested_order_omission_outer_definition_identity_refusals']) same(obs[key], true);
    const o = keys(obs.origin, ['schema', 'stage', 'canonical_version', 'canonical_sha256', 'canonical_bytes', 'semantic_version', 'semantic_sha256', 'source_inventory_sha256', 'source_preflight_sha256', 'target', 'wave_width', 'compiler_policy_identity', 'edit_epoch', 'schedule_identity', 'source_map_identity', 'final_artifact', 'physical_register_values', 'physical_register_lifetimes', 'fine_step_origins', 'macro_expansion_frames', 'diagnostic_only', 'authenticates_compiler_execution', 'authenticates_source', 'grants_proof_resume_artifact_launch_authority', 'origin_association', 'origin_scope', 'kir_raw_block', 'kir_roster_coordinate', 'rustc_mir_block', 'rustc_mir_body_sha256', 'semantic_block', 'semantic_block_identity', 'semantic_function', 'root_function_sha256', 'root_monomorphization_sha256', 'declared_source_ids', 'declared_register_roles', 'declared_instructions', 'call_site', 'expansion', 'expansion_chain_sha256', 'expansion_depth', 'limits']);
    const f = obs.macro_frames, actual = keys(obs.actual, ['baseline_equal_while_owner_live', 'canonical_identity', 'canonical_bytes', 'semantic_identity', 'source_inventory_identity', 'source_preflight_identity', 'steps', 'descriptors', 'call_correspondence_receipt_bytes', 'canonical_executable_receipt_bytes', 'retained_receipts_sum_bytes', 'complete_peak_owner_bytes', 'complete_retained_owner_bytes']);
    for (const key of ['call_correspondence_receipt_bytes', 'canonical_executable_receipt_bytes', 'retained_receipts_sum_bytes']) uint(actual[key]);
    same(actual.retained_receipts_sum_bytes, actual.call_correspondence_receipt_bytes + actual.canonical_executable_receipt_bytes);
    check(o.schema === 'fe2o3-diagnostic-ordered-program-origin-v1' && o.stage === 'pre_ranked_diagnostic' && o.canonical_version === 17 && o.semantic_version === 32 && o.target === 'gfx942:xnack-' && o.wave_width === 64 && o.origin_scope === 'whole_ordered_region', 'Unsupported origin stage/target.');
    for (const key of ['authenticates_compiler_execution', 'authenticates_source', 'grants_proof_resume_artifact_launch_authority']) same(o[key], false, 'Origin elevates authority.');
    same(o.diagnostic_only, true);
    for (const [key, val] of Object.entries({ compiler_policy_identity: 'unavailable_in_this_diagnostic', edit_epoch: 'unavailable', schedule_identity: 'unavailable', source_map_identity: 'unavailable_no_debug_map_exported', final_artifact: 'unavailable_no_native_compilation', physical_register_values: 'unavailable', physical_register_lifetimes: 'unavailable', fine_step_origins: 'unavailable_flat_descriptor_program', macro_expansion_frames: 'unavailable_only_digest_and_depth_retained' })) same(o[key], val, 'Origin availability changed.');
    same(o.origin_association, 'retained_semantic_correspondence_and_live_rustc_block_identity');
    same(digest(o.canonical_sha256), selected.canonicalSha256, 'Stale canonical selection.'); same(digest(o.expansion_chain_sha256), selected.expansionChainSha256, 'Stale expansion selection.');
    keys(f, ['schema', 'canonical_sha256', 'source_frontend_unit', 'source_contract', 'source_function', 'source_statement', 'expansion_chain_sha256', 'expansion_depth', 'frame_order', 'origin_scope', 'frames', 'source_reobservation_work_used', 'maximum_frames', 'maximum_name_bytes', 'maximum_report_bytes', 'rustc_internal_allocations_accounted', 'is_llvm_inline_stack', 'instruction_specific_origins_available', 'allocator_lifetime_trace_available', 'authenticates_source', 'grants_artifact_or_launch_authority']);
    check(f.schema === 'fe2o3-diagnostic-ordered-region-macro-frames-v1' && f.frame_order === 'innermost_to_outermost' && f.origin_scope === 'whole_ordered_region', 'Wrong frame contract.');
    for (const key of ['rustc_internal_allocations_accounted', 'is_llvm_inline_stack', 'instruction_specific_origins_available', 'allocator_lifetime_trace_available', 'authenticates_source', 'grants_artifact_or_launch_authority']) same(f[key], false, 'Frames elevate availability or authority.');
    same([f.maximum_frames, f.maximum_name_bytes, f.maximum_report_bytes], [32, 256, 65536]);
    same([f.expansion_depth, o.expansion_depth], [2, 2]);
    same(hex(f.canonical_sha256), o.canonical_sha256); same(hex(f.expansion_chain_sha256), o.expansion_chain_sha256);
    keys(o.declared_source_ids, ['frontend_unit', 'function', 'contract', 'statement']);
    for (const key of ['frontend_unit', 'function', 'contract', 'statement']) same(hex(f['source_' + key]), digest(o.declared_source_ids[key]), 'Source provenance changed.');
    for (const [origin, field] of [['canonical_sha256', 'canonical_identity'], ['semantic_sha256', 'semantic_identity'], ['source_inventory_sha256', 'source_inventory_identity'], ['source_preflight_sha256', 'source_preflight_identity']]) same(digest(o[origin]), hex(actual[field]), 'Original owner identity mismatch.');
    same(actual.baseline_equal_while_owner_live, true); same(actual.canonical_bytes, canonical.length); same(o.canonical_bytes, canonical.length);
    same(actual.steps, 1); same(array(actual.descriptors, 16), [8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    same(actual.complete_peak_owner_bytes, null); same(actual.complete_retained_owner_bytes, null);
    same(o.declared_instructions, [{ descriptor: 8, ordinal: 0, source_association: 'whole_ordered_region_only' }]);
    same(o.declared_register_roles, { scratch: 32, output: 33, inputs: [34, 35, 36] });
    same(o.root_function_sha256, o.declared_source_ids.function);
    for (const key of ['root_monomorphization_sha256', 'rustc_mir_body_sha256', 'semantic_block_identity']) digest(o[key]);
    array(o.kir_roster_coordinate, 3).forEach(n => uint(n)); uint(o.kir_raw_block); uint(o.rustc_mir_block); uint(o.semantic_block); uint(o.semantic_function);
    keys(o.limits, ['maximum_expansion_depth', 'report_bytes', 'rustc_internal_allocations_accounted', 'source_reobservation_work', 'source_reobservation_work_used']);
    same([o.limits.maximum_expansion_depth, o.limits.report_bytes, o.limits.source_reobservation_work, o.limits.rustc_internal_allocations_accounted], [256, 16384, 1048576, false]);
    same(f.source_reobservation_work_used, o.limits.source_reobservation_work_used); uint(f.source_reobservation_work_used, 1048576);
    const rows = array(f.frames, 2).map((row, ordinal) => {
      keys(row, ['ordinal', 'kind', 'macro_name', 'expansion_identity', 'expansion', 'call_site', 'definition_site']);
      same(row.ordinal, ordinal); same(row.kind, 'macro');
      same(text(row.macro_name, 256), ['amdgpu_ordered_program', 'ordered_program_wrapper'][ordinal], 'Reordered or unsupported expansion.');
      return { ordinal, name: row.macro_name, expansionIdentity: digest(hex(row.expansion_identity)), expansion: span(row.expansion), callSite: span(row.call_site), definitionSite: span(row.definition_site) };
    });
    check(rows[0].expansionIdentity !== rows[1].expansionIdentity, 'Repeated expansion identity.');
    requireFixtureIntervals(rows, fixture, definition);
    same(span(o.expansion, false), rows[0].expansion); same(span(o.call_site, false), rows[1].callSite);
    same(rows[1].expansion, rows[0].callSite, 'Broken expansion chain.');
    const fixtureId = rows[1].callSite.fileIdentity, definitionId = rows[0].expansion.fileIdentity;
    check(fixtureId !== definitionId, 'Ambiguous source-role mapping.');
    const mapped = rows.map((row, index) => ({
      ordinal: row.ordinal, name: row.name, expansionIdentity: row.expansionIdentity,
      callSite: sourceLocation(row.callSite, fixture, fixtureId),
      expansion: sourceLocation(row.expansion, index === 0 ? definition : fixture, index === 0 ? definitionId : fixtureId),
      definitionSite: sourceLocation(row.definitionSite, index === 0 ? definition : fixture, index === 0 ? definitionId : fixtureId),
    }));
    check(mapped[0].callSite.excerpt.startsWith('amdgpu_ordered_program! {') && mapped[1].callSite.excerpt === 'ordered_program_wrapper!(a, b, c)' && mapped[1].definitionSite.excerpt.startsWith('macro_rules! ordered_program_wrapper {'), 'Selected source spelling differs.');
    if (definition) same(mapped[0].definitionSite.excerpt, 'macro_rules! amdgpu_ordered_program', 'Definition source differs.');
    return freeze({ status: 'ready', captureKey: expected, reportSha256: report.sha256, baselineSha256: baseline.sha256,
      canonicalSha256: o.canonical_sha256, canonicalBytesSha256: r.baseline_sha256, canonicalBytes: canonical.length,
      sourceSha256: fixture.sha256, expansionChainSha256: o.expansion_chain_sha256, sourceIds: { ...o.declared_source_ids },
      target: o.target, waveWidth: o.wave_width, coordinate: [...o.kir_roster_coordinate], frames: mapped,
      authority: 'display_only', finalArtifact: 'unavailable', physicalLifetimes: 'unavailable', instructionOrigins: 'whole_region_only', llvmInlineStack: false });
  } catch (error) { return { status: 'invalid', detail: error instanceof Error ? error.message.slice(0, 240) : 'Invalid macro capture.' }; }
}
