/** Integrity-checked display of retained source runs. Not an executable format,
 * semantic correspondence checker, source authenticator, or production receipt. */
import {
  authority, boundedString, check, coordinate, coordinateKey, copyRetainedComparison,
  dense, digest, integer, object, operation, SOURCE_VARIANT_MAX_OPERATIONS,
  type JsonRecord, type RetainedArtifact, type SourceVariantId, type VariantCoordinate, type VariantOperation,
} from "./source-variant-comparison-shape";

// Display-integrity pin for this retained example, not a release or producer pin.
// The original smoke receipt does not include the operation-page file digests.
export const SOURCE_VARIANT_ARTIFACT_MANIFEST_SHA256 = "b01d59d0220730435834af1bec6dc5b6fb5d0511dfc2dded20df16b7cd539ea3";

export interface SourceVariantCase {
  readonly id: SourceVariantId;
  readonly label: string;
  readonly source: string;
  readonly sourceSha256: string;
  readonly helper: string | null;
  readonly helperSha256: string | null;
  readonly bundleSha256: string;
  readonly bundleIdentity: string;
  readonly kirDigest: string;
  readonly semanticMirIdentity: string;
  readonly preflightIdentity: string;
  readonly target: "gfx942:xnack-";
  readonly operations: readonly VariantOperation[];
  readonly operationsJson: string;
  readonly simulationJson: string;
  readonly expectedWord: number;
  readonly bytes: string;
  readonly initialized: string;
}
export type SourceVariantComparisonProjection = {
  readonly status: "ready";
  readonly receiptSha256: string;
  readonly captureName: string;
  readonly sourcePath: string;
  readonly generatedHelper: string;
  readonly generatedHelperSha256: string;
  readonly originalSelection: VariantCoordinate;
  readonly variants: readonly SourceVariantCase[];
} | { readonly status: "invalid" | "unavailable"; readonly detail: string };

async function sha256(utf8: string): Promise<string> {
  const bytes = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(utf8));
  return Array.from(new Uint8Array(bytes), (value) => value.toString(16).padStart(2, "0")).join("");
}
function parsed(artifact: RetainedArtifact): JsonRecord {
  const value: unknown = JSON.parse(artifact.utf8);
  const pending = [{ value, depth: 0 }];
  let nodes = 0;
  while (pending.length > 0) {
    const item = pending.pop()!;
    check(++nodes <= 8192 && item.depth <= 20, "Retained JSON structure exceeds display bounds.");
    if (item.value !== null && typeof item.value === "object") {
      const children = Array.isArray(item.value) ? dense(item.value, 256) : Object.values(item.value);
      check(children.length <= 256, "Oversized retained JSON object.");
      for (const child of children) pending.push({ value: child, depth: item.depth + 1 });
    }
  }
  return object(value);
}
function selector(value: unknown, summary: JsonRecord): VariantCoordinate {
  const row = object(value);
  check(row.bundle_identity === summary.bundle_identity && row.canonical_kir_digest === summary.canonical_kir_digest && row.target === summary.target,
    "Selection belongs to another exact snapshot.");
  const entries = dense(row.operations, 1);
  check(entries.length === 1, "This retained example selects exactly one operation.");
  return coordinate(entries[0]);
}
function same(value: unknown, expected: unknown, message: string): void {
  check(JSON.stringify(value) === JSON.stringify(expected), message);
}
function checkSimulation(report: JsonRecord, summary: JsonRecord, expectedWord: number): { bytes: string; initialized: string } {
  check(report.schema === "fe2o3-simulation-result-v1" && report.status === "ok" && report.authority === "observation_only" &&
    report.simulated === true && report.hardware_observed === false && report.hardware_validation === false && report.performance_prediction === false,
  "Unsupported or elevated simulation report.");
  const kir = object(report.kir), counts = object(report.counts);
  check(kir.sha256 === summary.canonical_kir_digest && String(integer(kir.canonical_bytes, 16_777_216)) === summary.canonical_kir_bytes,
    "Simulation belongs to another canonical program.");
  check(counts.invocations_executed === 4 && counts.workgroups_visited === 1 && counts.arguments === 3 && counts.shared_buffers === 0,
    "This display requires the exact four-output CPU case.");
  const arguments_ = dense(report.arguments, 3);
  check(arguments_.length === 3 && dense(report.shared_buffers, 0).length === 0, "Simulation argument shape changed.");
  same(arguments_[1], { kind: "scalar", type: "u32", bits: "0xfffffff0" }, "First scalar input changed.");
  same(arguments_[2], { kind: "scalar", type: "u32", bits: "0x00000025" }, "Second scalar input changed.");
  const first = object(arguments_[0]), buffer = object(first.value);
  const word = expectedWord === 469 ? "d5010000" : "00000000";
  const bytes = `0x${word.repeat(4)}deadbeefcafebabe`;
  check(first.kind === "buffer" && buffer.element === "u32" && buffer.access === "read_write" && buffer.alignment === 4 &&
    buffer.bytes === bytes && buffer.initialized === "0xffffff", "Complete output, initialization or canaries differ from the independent case.");
  return { bytes, initialized: "0xffffff" };
}

export async function projectSourceVariantComparison(
  value: unknown,
  expectedReceiptSha256: string,
): Promise<SourceVariantComparisonProjection> {
  try {
    const evidence = copyRetainedComparison(value); // No caller-owned object survives this copy.
    const expected = digest(expectedReceiptSha256);
    check(evidence.receipt.sha256 === expected, "The selected capture receipt is stale or substituted.");
    if (!globalThis.crypto?.subtle) return { status: "unavailable", detail: "Byte-integrity checking requires WebCrypto; no retained source is shown." };
    const artifacts = [evidence.receipt, evidence.materialization, ...evidence.variants.flatMap((item) =>
      [item.source, item.snapshot, item.operations, item.simulation, ...(item.change ? [item.change] : [])])];
    check(await sha256(JSON.stringify(artifacts.map((artifact) => artifact.sha256))) === SOURCE_VARIANT_ARTIFACT_MANIFEST_SHA256,
      "Retained artifact roster differs from this displayed capture.");
    await Promise.all(artifacts.map(async (artifact) => {
      check(await sha256(artifact.utf8) === artifact.sha256, "Retained artifact bytes do not match their SHA-256.");
    }));
    const receipt = parsed(evidence.receipt), draft = parsed(evidence.materialization);
    check(receipt.schema === "fe2o3-ordinary-bitwise-promotion-smoke-v1" && receipt.hardware_observed === false && receipt.production_qualification === false &&
      receipt.final_machine_inspection === "not_exercised" && receipt.equivalence === "one_independent_differential_case_not_universal_proof" &&
      receipt.source_change === "named_concrete_variants_not_generic_reconstruction", "Capture is not the supported source/CPU observation.");
    check(receipt.source === "crates/rustc-codegen-fe2o3/tests/fixtures/ordinary-bitwise-promotion-v1/src/lib.rs", "Unexpected source fixture.");
    const summaries = evidence.variants.map((item) => parsed(item.snapshot));
    const originalSummary = object(receipt.ordinary_summary), cases = dense(receipt.cases, 2).map(object);
    check(cases.length === 2 && cases[0].label === "no-edit" && cases[1].label === "edited-instruction", "Retained case identities changed.");
    same(summaries[0], originalSummary, "Original snapshot differs from the selected receipt.");
    const selection = selector(receipt.selector, originalSummary);
    same(draft.selector, receipt.selector, "Generated helper selects another original region.");
    authority(draft.authority);
    check(draft.helper_name === "bitwise_promoted_region" && draft.status === "diagnostic_source_draft_only" &&
      draft.semantic_equivalence === "unproved" && draft.exact_machine_contract === "unproved" &&
      draft.frontend_readmission === "not_performed_requires_fresh_source_compilation" &&
      draft.source_application === "unavailable_requires_explicit_new_source_and_normal_frontend", "Materializer authority or status changed.");
    const generatedHelper = boundedString(draft.source, 16_384);
    const generatedHelperSha256 = await sha256(generatedHelper);
    const original = evidence.variants[0].source;
    check(original.sha256 === digest(receipt.original_source_sha256) && !original.utf8.includes("amdgpu_asm"), "Original ordinary source differs.");
    const variants: SourceVariantCase[] = [];
    for (const [index, retained] of evidence.variants.entries()) {
      const summary = summaries[index], page = parsed(retained.operations), simulation = parsed(retained.simulation);
      authority(summary.authority); authority(page.authority);
      check(summary.schema === "fe2o3-multilevel-authoring-observation-v1" && summary.canonical_kir_version === 11 && summary.target === "gfx942:xnack-" &&
        summary.compiler_policy_identity === "unavailable_in_v6" && summary.final_artifact_identity === "unavailable_extraction_precedes_final_artifact", "Snapshot availability changed.");
      const count = integer(summary.operation_count, SOURCE_VARIANT_MAX_OPERATIONS);
      check(page.bundle_identity === summary.bundle_identity && page.canonical_kir_digest === summary.canonical_kir_digest && page.target === summary.target &&
        page.start === 0 && page.next_start === null && page.total_operations === count, "Operation page differs from its complete snapshot.");
      const operations = Object.freeze(dense(page.operations, SOURCE_VARIANT_MAX_OPERATIONS).map(operation));
      check(operations.length === count && count > 0 && new Set(operations.map((item) => coordinateKey(item.coordinate))).size === count, "Incomplete or duplicate operation page.");
      const assembly = operations.filter((item) => item.mnemonic !== null);
      let helper: string | null = null, helperSha256: string | null = null;
      const expectedWord = index === 2 ? Number(((0xfffffff0n ^ 0x25n) & 255n) & 256n) : Number(((0xfffffff0n ^ 0x25n) & 255n) | 256n);
      if (index === 0) {
        check(retained.change === null && assembly.length === 0, "Ordinary source must not be relabeled as assembly.");
        const selected = operations.find((item) => coordinateKey(item.coordinate) === coordinateKey(selection));
        check(selected?.kind === "binary" && selected.detail === "BitOr" && selected.sourceReferences === null, "The selected original operation is not BitOr.");
        same(draft.live_in, selected.inputs, "Helper input order differs from the original selection.");
        same(draft.live_out, selected.results, "Helper outputs differ from the original selection.");
        check(object(receipt.ordinary_result).expected_word === expectedWord && object(receipt.ordinary_result).simulation_sha256 === retained.simulation.sha256,
          "Original simulation differs from the receipt.");
      } else {
        const recorded = cases[index - 1];
        same(summary, recorded.summary, "Variant snapshot differs from the selected receipt.");
        check(recorded.source_sha256 === retained.source.sha256 && recorded.simulation_sha256 === retained.simulation.sha256 && recorded.expected_word === expectedWord,
          "Variant source or result differs from the receipt.");
        check(assembly.length === 1 && assembly[0].mnemonic === (index === 1 ? "v_or_b32" : "v_and_b32") &&
          operations.some((item) => item.kind === "call" && item.coordinate.function !== assembly[0].coordinate.function) &&
          !operations.some((item) => item.kind === "binary" && item.detail === "BitOr"), "Retained call/helper instruction shape changed.");
        for (const detail of ["BitXor", "BitAnd"]) check(operations.some((item) => item.kind === "binary" && item.detail === detail), "Outer ordinary compute disappeared.");
        check(retained.change !== null, "Variant lacks its explicit source change.");
        const change = parsed(retained.change);
        same(change.selector, receipt.selector, "Source edit refers to another selection.");
        check(change.original_source_sha256 === original.sha256 && change.source_sha256 === retained.source.sha256 &&
          change.application === "explicit_known_fixture_replacement_named_concrete_variant_original_untouched" &&
          change.instruction_edit === (index === 1 ? null : "v_or_b32 -> v_and_b32"), "Source-change boundary differs.");
        const before = boundedString(change.replaced_text), after = boundedString(change.replacement_text);
        check(before === "    let result = low | 256;" && after === "    let result = bitwise_promoted_region(low, 256).0;" && original.utf8.split(before).length === 2,
          "This display admits only the retained explicit fixture replacement.");
        const prefix = `${original.utf8.replace(before, after)}\n`;
        check(retained.source.utf8.startsWith(prefix), "Original source prefix was changed beyond the recorded expression.");
        helper = retained.source.utf8.slice(prefix.length);
        check(generatedHelper.split("amdgpu_asm!(v_or_b32(").length === 2 &&
          helper === (index === 1 ? generatedHelper : generatedHelper.replace("amdgpu_asm!(v_or_b32(", "amdgpu_asm!(v_and_b32(")), "Generated helper differs from the explicit instruction edit.");
        helperSha256 = await sha256(helper);
        check(helperSha256 === recorded.helper_sha256 && helperSha256 === change.appended_helper_sha256, "Helper identity differs.");
      }
      const output = checkSimulation(simulation, summary, expectedWord);
      variants.push(Object.freeze({ id: retained.id, label: ["Original ordinary Rust", "Unchanged generated helper", "Edited OR to AND helper"][index],
        source: retained.source.utf8, sourceSha256: retained.source.sha256, helper, helperSha256,
        bundleSha256: digest(index === 0 ? receipt.ordinary_bundle_sha256 : cases[index - 1].bundle_sha256),
        bundleIdentity: digest(summary.bundle_identity), kirDigest: digest(summary.canonical_kir_digest),
        semanticMirIdentity: digest(summary.semantic_mir_identity), preflightIdentity: digest(summary.rustc_preflight_plan_receipt_sha256), target: "gfx942:xnack-",
        operations, operationsJson: retained.operations.utf8, simulationJson: retained.simulation.utf8, expectedWord, ...output }));
    }
    for (const key of ["sourceSha256", "bundleIdentity", "kirDigest", "semanticMirIdentity", "preflightIdentity"] as const)
      check(new Set(variants.map((variant) => variant[key])).size === 3, "Variant identity was reused.");
    return Object.freeze({ status: "ready", receiptSha256: expected, captureName: evidence.captureName, sourcePath: receipt.source,
      generatedHelper, generatedHelperSha256, originalSelection: selection, variants: Object.freeze(variants) });
  } catch (error) {
    return { status: "invalid", detail: error instanceof Error ? error.message.slice(0, 240) : "Invalid retained comparison." };
  }
}
