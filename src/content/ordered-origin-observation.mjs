// Separate bounded inert origin report, never a compiler/source authority or capsule format.
import { parseProgramJson } from './ordered-program-observation.mjs';
import { check, keys, rows, integer, digest, freeze, stable } from './repeat-native-core.mjs';

export const ORDERED_ORIGIN_MAX_BYTES = 16384;
const IDS = ['frontend_unit', 'function', 'contract', 'statement'];
const DIGESTS = ['canonical_sha256', 'semantic_sha256', 'source_inventory_sha256',
  'source_preflight_sha256', 'root_function_sha256', 'root_monomorphization_sha256',
  'rustc_mir_body_sha256', 'semantic_block_identity', 'expansion_chain_sha256'];
const UNAVAILABLE = {
  macro_expansion_frames: 'unavailable_only_digest_and_depth_retained',
  fine_step_origins: 'unavailable_flat_descriptor_program',
  compiler_policy_identity: 'unavailable_in_this_diagnostic',
  source_map_identity: 'unavailable_no_debug_map_exported',
  edit_epoch: 'unavailable', schedule_identity: 'unavailable',
  final_artifact: 'unavailable_no_native_compilation',
  physical_register_values: 'unavailable', physical_register_lifetimes: 'unavailable',
};
const FIELDS = ['schema', 'diagnostic_only', 'authenticates_source', 'authenticates_compiler_execution',
  'grants_proof_resume_artifact_launch_authority', 'stage', 'target', 'wave_width',
  'canonical_version', 'canonical_bytes', 'semantic_version', ...DIGESTS,
  'rustc_mir_block', 'semantic_function', 'semantic_block', 'kir_roster_coordinate', 'kir_raw_block',
  'declared_source_ids', 'origin_association', 'origin_scope', 'expansion', 'call_site',
  'expansion_depth', 'declared_instructions', 'declared_register_roles', ...Object.keys(UNAVAILABLE), 'limits'];

/** Refuse before TextEncoder or JSON allocation, including exact UTF-8 byte count. */
function boundedText(raw) {
  check(typeof raw === 'string' && raw.length > 0 && raw.length <= ORDERED_ORIGIN_MAX_BYTES,
    'Origin JSON exceeds its 16 KiB bound.');
  check(raw.charCodeAt(0) !== 0xfeff, 'Origin JSON must not contain a BOM.');
  let bytes = 0;
  for (const point of raw) {
    const code = point.codePointAt(0);
    check(code < 0xd800 || code > 0xdfff, 'Origin JSON contains invalid Unicode.');
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
    check(bytes <= ORDERED_ORIGIN_MAX_BYTES, 'Origin JSON exceeds its 16 KiB bound.');
  }
}
function span(value) {
  keys(value, ['file_identity', 'byte_start', 'byte_end', 'line_start', 'column_start', 'line_end', 'column_end']);
  digest(value.file_identity);
  for (const field of ['byte_start', 'byte_end']) integer(value[field], Number.MAX_SAFE_INTEGER);
  for (const field of ['line_start', 'line_end']) integer(value[field], 0xffffffff, 1);
  for (const field of ['column_start', 'column_end']) integer(value[field]);
  check(value.byte_start <= value.byte_end && (value.line_start < value.line_end ||
    (value.line_start === value.line_end && value.column_start <= value.column_end)), 'Reversed origin span.');
  return value;
}
function instructions(value) {
  check(Array.isArray(value) && value.length >= 1 && value.length <= 16, 'Origin instruction count exceeds bounds.');
  const defined = [true, true, true, false, false];
  rows(value, value.length).forEach((item, ordinal) => {
    keys(item, ['ordinal', 'descriptor', 'source_association']);
    check(item.ordinal === ordinal && item.source_association === 'whole_ordered_region_only', 'Unsupported fine-step origin.');
    const word = integer(item.descriptor, 1023), op = word & 7, dest = 3 + ((word >> 3) & 1);
    const left = (word >> 4) & 7, right = (word >> 7) & 7;
    check(op <= 5 && left <= 4 && right <= 4 && (op !== 0 || right === 0) &&
      defined[left] && (op === 0 || defined[right]), 'Invalid declared origin program.');
    defined[dest] = true;
  });
  check(defined[4], 'Origin program does not define its output.');
  return value;
}
export function parseOrderedOriginJson(raw) {
  boundedText(raw);
  const value = keys(parseProgramJson(raw, ORDERED_ORIGIN_MAX_BYTES), FIELDS);
  check(value.schema === 'fe2o3-diagnostic-ordered-program-origin-v1' && value.diagnostic_only === true &&
    value.stage === 'pre_ranked_diagnostic' && value.target === 'gfx942:xnack-' && value.wave_width === 64 &&
    value.canonical_version === 17 && value.semantic_version === 32, 'Unsupported ordered-origin profile.');
  for (const field of ['authenticates_source', 'authenticates_compiler_execution', 'grants_proof_resume_artifact_launch_authority'])
    check(value[field] === false, 'Origin report elevates authority.');
  for (const field of DIGESTS) digest(value[field]);
  integer(value.canonical_bytes, 65536, 1);
  for (const field of ['rustc_mir_block', 'semantic_function', 'semantic_block', 'kir_raw_block']) integer(value[field]);
  rows(value.kir_roster_coordinate, 3).forEach(n => integer(n));
  keys(value.declared_source_ids, IDS); Object.values(value.declared_source_ids).forEach(digest);
  check(value.root_function_sha256 === value.declared_source_ids.function, 'Origin root function differs.');
  check(value.origin_association === 'retained_semantic_correspondence_and_live_rustc_block_identity' &&
    value.origin_scope === 'whole_ordered_region', 'Unsupported origin association.');
  span(value.expansion); span(value.call_site); integer(value.expansion_depth, 256);
  for (const [field, expected] of Object.entries(UNAVAILABLE)) check(value[field] === expected, 'Unavailable origin field was replaced.');
  instructions(value.declared_instructions);
  keys(value.declared_register_roles, ['scratch', 'output', 'inputs']);
  rows(value.declared_register_roles.inputs, 3);
  const registers = [value.declared_register_roles.scratch, value.declared_register_roles.output, ...value.declared_register_roles.inputs];
  registers.forEach(n => integer(n, 63)); check(new Set(registers).size === 5, 'Origin register roles overlap.');
  keys(value.limits, ['source_reobservation_work', 'source_reobservation_work_used', 'maximum_expansion_depth',
    'report_bytes', 'rustc_internal_allocations_accounted']);
  check(value.limits.source_reobservation_work === 1048576 && value.limits.maximum_expansion_depth === 256 &&
    value.limits.report_bytes === 16384 && value.limits.rustc_internal_allocations_accounted === false, 'Origin accounting profile differs.');
  integer(value.limits.source_reobservation_work_used, 1048576, 1);
  return freeze({
    canonicalSha256: value.canonical_sha256, canonicalBytes: value.canonical_bytes, semanticSha256: value.semantic_sha256,
    sourceInventorySha256: value.source_inventory_sha256, sourcePreflightSha256: value.source_preflight_sha256,
    declaredSourceIds: value.declared_source_ids, target: value.target, waveWidth: value.wave_width,
    coordinate: value.kir_roster_coordinate, rawBlock: value.kir_raw_block,
    declaredDescriptors: value.declared_instructions.map(item => item.descriptor), registerRoles: value.declared_register_roles,
    rootFunctionSha256: value.root_function_sha256, rootMonomorphizationSha256: value.root_monomorphization_sha256,
    rustcMirBodySha256: value.rustc_mir_body_sha256, rustcMirBlock: value.rustc_mir_block,
    semanticFunction: value.semantic_function, semanticBlock: value.semantic_block, semanticBlockIdentity: value.semantic_block_identity,
    expansion: value.expansion, callSite: value.call_site, expansionChainSha256: value.expansion_chain_sha256,
    expansionDepth: value.expansion_depth, workUsed: value.limits.source_reobservation_work_used,
  });
}

/** Only exact reported-identity consistency; never authenticates the uploaded report. */
export function compareOrderedOrigin(origin, selected) {
  const pairs = [
    ['Canonical KIR identity', origin.canonicalSha256, selected.canonicalKirSha256],
    ['Semantic MIR identity', origin.semanticSha256, selected.semanticSha256],
    ['Source inventory identity', origin.sourceInventorySha256, selected.sourceInventorySha256],
    ['Source preflight identity', origin.sourcePreflightSha256, selected.sourcePreflightSha256],
    ['Declared source IDs', origin.declaredSourceIds, selected.originBinding.declaredSourceIds],
    ['Canonical byte length', origin.canonicalBytes, selected.originBinding.canonicalBytes],
    ['Target', origin.target, selected.originBinding.target],
    ['Wave width', origin.waveWidth, selected.originBinding.waveWidth],
    ['KIR roster coordinate', origin.coordinate, selected.originBinding.coordinate],
    ['KIR raw block', origin.rawBlock, selected.originBinding.rawBlock],
    ['Declared descriptors', origin.declaredDescriptors, selected.originBinding.declaredDescriptors],
    ['Declared register roles', origin.registerRoles, selected.originBinding.registerRoles],
  ];
  const mismatches = pairs.filter(([, actual, expected]) => stable(actual) !== stable(expected)).map(([label]) => label);
  return freeze({ status: mismatches.length ? 'mismatch' : 'matching_reported_identities', mismatches });
}
