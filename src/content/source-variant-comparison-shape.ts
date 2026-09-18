/** Closed, bounded presentation shapes, not compiler or source authority. */
export const SOURCE_VARIANT_IDS = ["ordinary", "no-edit", "edited-instruction"] as const;
export type SourceVariantId = typeof SOURCE_VARIANT_IDS[number];
export const SOURCE_VARIANT_MAX_ARTIFACT_BYTES = 65_536;
export const SOURCE_VARIANT_MAX_TOTAL_BYTES = 524_288;
export const SOURCE_VARIANT_MAX_OPERATIONS = 64;
export const SOURCE_VARIANT_MAX_SOURCE_BYTES = 16_384;
export type JsonRecord = Record<string, unknown>;
export interface RetainedArtifact { readonly sha256: string; readonly utf8: string }
export interface RetainedVariant {
  readonly id: SourceVariantId;
  readonly source: RetainedArtifact;
  readonly snapshot: RetainedArtifact;
  readonly operations: RetainedArtifact;
  readonly simulation: RetainedArtifact;
  readonly change: RetainedArtifact | null;
}
export interface RetainedComparison {
  readonly captureName: string;
  readonly receipt: RetainedArtifact;
  readonly materialization: RetainedArtifact;
  readonly variants: readonly RetainedVariant[];
}
export interface VariantCoordinate { readonly function: number; readonly block: number; readonly operation: number }
export interface VariantValue { readonly value: number; readonly ty: string }
export interface VariantOperation {
  readonly coordinate: VariantCoordinate;
  readonly functionName: string;
  readonly kind: string;
  readonly detail: string | null;
  readonly mnemonic: string | null;
  readonly inputs: readonly VariantValue[];
  readonly results: readonly VariantValue[];
  readonly sourceReferences: Readonly<Record<string, string>> | null;
  readonly sourceSpans: readonly { readonly displayPath: string; readonly byteStart: string; readonly byteEnd: string }[];
}
export function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
export function object(value: unknown): JsonRecord {
  check(value !== null && typeof value === "object" && !Array.isArray(value), "Expected a retained JSON object.");
  return value as JsonRecord;
}
export function exactKeys(value: unknown, names: readonly string[]): JsonRecord {
  const row = object(value);
  check(Object.keys(row).length === names.length && names.every((name) => Object.hasOwn(row, name)), "Unexpected retained fields.");
  return row;
}
export function boundedString(value: unknown, limit = 1024): string {
  check(typeof value === "string" && value.length <= limit, "Unbounded retained text.");
  return value;
}
export function digest(value: unknown): string {
  check(typeof value === "string" && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value), "Invalid exact digest.");
  return value;
}
export function integer(value: unknown, maximum = 0xffff_ffff): number {
  check(typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= maximum, "Inexact or out-of-range coordinate.");
  return value;
}
export function dense(value: unknown, maximum: number): unknown[] {
  check(Array.isArray(value) && value.length <= maximum, "Oversized retained array.");
  for (let index = 0; index < value.length; index++) check(Object.hasOwn(value, index), "Sparse retained array.");
  return value;
}
export function authority(value: unknown): void {
  const row = exactKeys(value, ["observation_only", "authenticates_compiler_execution", "source_authenticated", "grants_proof_authority", "grants_production_resume", "grants_load_or_launch"]);
  check(row.observation_only === true && Object.entries(row).every(([key, flag]) => key === "observation_only" || flag === false), "Retained observation attempts to grant authority.");
}
export function coordinate(value: unknown): VariantCoordinate {
  const row = exactKeys(value, ["function", "block", "operation"]);
  return Object.freeze({ function: integer(row.function), block: integer(row.block), operation: integer(row.operation) });
}
export function coordinateKey(value: VariantCoordinate): string {
  return `${value.function}:${value.block}:${value.operation}`;
}
function values(value: unknown): readonly VariantValue[] {
  return Object.freeze(dense(value, 16).map((item) => {
    const row = exactKeys(item, ["value", "ty"]);
    return Object.freeze({ value: integer(row.value), ty: boundedString(row.ty, 512) });
  }));
}
function decimal(value: unknown): string {
  check(typeof value === "string" && /^(0|[1-9][0-9]{0,19})$/u.test(value) && BigInt(value) <= 18_446_744_073_709_551_615n, "Inexact source range.");
  return value;
}
export function operation(value: unknown): VariantOperation {
  const row = object(value);
  check(row.convergence === "not_analyzed" && row.traps === "not_analyzed" &&
    row.physical_resources === "unavailable_logical_canonical_stage" && row.source_binding === "bundle_content_bound_not_authenticated", "Operation availability changed.");
  const kind = boundedString(row.kind, 64);
  check(/^[a-z_]+$/u.test(kind), "Unknown operation label.");
  const mnemonic = row.mnemonic === null ? null : boundedString(row.mnemonic, 16);
  let sourceReferences: Readonly<Record<string, string>> | null = null;
  if (row.inline_assembly_source !== null) {
    const source = exactKeys(row.inline_assembly_source, ["frontend_unit", "function", "contract", "statement", "authority"]);
    check(source.authority === "inert_references_not_source_authentication", "Source references are not authentication.");
    sourceReferences = Object.freeze({ frontend_unit: digest(source.frontend_unit), function: digest(source.function), contract: digest(source.contract), statement: digest(source.statement) });
  }
  check(kind === "inline_assembly" ? mnemonic !== null && sourceReferences !== null : mnemonic === null && sourceReferences === null,
    "Instruction/reference shape mismatch.");
  const sourceSpans = Object.freeze(dense(row.source_spans, 16).map((item) => {
    const span = object(item);
    digest(span.file_identity);
    const byteStart = decimal(span.byte_start), byteEnd = decimal(span.byte_end);
    check(BigInt(byteStart) <= BigInt(byteEnd), "Reversed source range.");
    return Object.freeze({ displayPath: boundedString(span.display_path), byteStart, byteEnd });
  }));
  return Object.freeze({ coordinate: coordinate(row.coordinate), functionName: boundedString(row.function_name, 256), kind,
    detail: row.semantic_detail === null ? null : boundedString(row.semantic_detail, 256), mnemonic,
    inputs: values(row.inputs), results: values(row.results), sourceReferences, sourceSpans });
}

/** Copy only bounded strings and fixed fields, then freeze before the first await. */
export function copyRetainedComparison(value: unknown): RetainedComparison {
  const outer = exactKeys(value, ["schema", "provenance", "receipt", "materialization", "variants"]);
  check(outer.schema === "fe2o3-source-variant-comparison-example-v1", "Unsupported comparison schema.");
  const provenance = exactKeys(outer.provenance, ["capture_name", "capture_kind", "compiler_build", "compiler_commit", "qualified_release_pin", "producer_authenticated", "script"]);
  check(provenance.capture_kind === "retained_actual_source_export_and_cpu_case" && provenance.compiler_build === "work_in_progress" &&
    provenance.compiler_commit === null && provenance.qualified_release_pin === null && provenance.producer_authenticated === false &&
    provenance.script === "scripts/ordinary-bitwise-promotion-smoke.mjs", "Unsupported or elevated capture provenance.");
  const captureName = boundedString(provenance.capture_name, 128);
  let total = 0;
  function artifact(value: unknown, limit = SOURCE_VARIANT_MAX_ARTIFACT_BYTES): RetainedArtifact {
    const row = exactKeys(value, ["sha256", "utf8"]);
    const utf8 = boundedString(row.utf8, limit);
    // TextEncoder replaces lone surrogates; reject them instead of hashing other bytes.
    for (const point of utf8) { const code = point.codePointAt(0)!; check(code < 0xd800 || code > 0xdfff, "Invalid retained Unicode."); }
    const length = new TextEncoder().encode(utf8).length;
    total += length;
    check(length > 0 && length <= limit && total <= SOURCE_VARIANT_MAX_TOTAL_BYTES, "Retained byte budget exceeded.");
    return Object.freeze({ sha256: digest(row.sha256), utf8 });
  }
  const receipt = artifact(outer.receipt), materialization = artifact(outer.materialization);
  const variants = dense(outer.variants, 3);
  check(variants.length === 3, "Exactly three source variants are required.");
  return Object.freeze({ captureName, receipt, materialization, variants: Object.freeze(variants.map((value, index) => {
    const row = exactKeys(value, ["id", "source", "snapshot", "operations", "simulation", "change"]);
    check(row.id === SOURCE_VARIANT_IDS[index], "Source variant order or identity mismatch.");
    return Object.freeze({ id: SOURCE_VARIANT_IDS[index], source: artifact(row.source, SOURCE_VARIANT_MAX_SOURCE_BYTES),
      snapshot: artifact(row.snapshot), operations: artifact(row.operations), simulation: artifact(row.simulation),
      change: row.change === null ? null : artifact(row.change) });
  })) });
}
