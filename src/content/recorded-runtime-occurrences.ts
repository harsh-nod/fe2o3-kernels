/** Read-only presentation of one bounded CPU observer report.
 * This is not a debugger wire format, capture admission, source authentication,
 * execution replay, or compiler authority. No I/O occurs in this module. */
import { parseProgramJson, programSha256 } from "./ordered-program-observation.mjs";

export const RUNTIME_OCCURRENCE_LIMITS = Object.freeze({
  reportBytes: 512 * 1024, cases: 6, rowsPerCase: 1024, totalRows: 4096,
});
export type RuntimeOccurrenceCoordinate = readonly [number, number, number];
export type RuntimeOccurrencePhase = "before_operation" | "after_operation" | "write_committed";
export interface RuntimeOccurrenceRow {
  readonly key: string;
  readonly ordinal: number;
  readonly decision: number;
  readonly invocation: number;
  readonly site: RuntimeOccurrenceCoordinate;
  readonly phase: RuntimeOccurrencePhase;
  readonly activation: number;
  readonly attempt: number;
  readonly committedWrite: null | {
    readonly allocation: number; readonly byteOffset: number; readonly u32Bits: number;
  };
}
export interface RuntimeOccurrenceAttempt {
  readonly key: string;
  readonly site: RuntimeOccurrenceCoordinate;
  readonly invocation: number;
  readonly activation: number;
  readonly attempt: number;
  readonly beforeRow: number;
  readonly afterRow: number;
  readonly writeRows: readonly number[];
}
export interface RuntimeHelperOccurrence {
  readonly key: string;
  readonly invocation: number;
  readonly activation: number;
  readonly callerAttemptKey: string;
  readonly callBeforeRow: number;
  readonly callAfterRow: number;
  readonly firstRow: number;
  readonly lastRow: number;
  readonly attemptKeys: readonly string[];
}
export interface RuntimeOccurrenceCase {
  readonly key: string;
  readonly index: number;
  readonly rounds: 0 | 1 | 3;
  readonly schedule: "canonical" | "seeded_71";
  readonly expectedWord: number;
  readonly steps: number;
  readonly rows: readonly RuntimeOccurrenceRow[];
  readonly attempts: readonly RuntimeOccurrenceAttempt[];
  readonly helpers: readonly RuntimeHelperOccurrence[];
}
export interface RuntimeOccurrenceTopology {
  readonly entry: number;
  readonly helper: number;
  readonly callSite: RuntimeOccurrenceCoordinate;
  readonly callAuthoringCoordinate: RuntimeOccurrenceCoordinate;
  readonly cycleBlockIds: readonly number[];
  readonly helperSites: readonly RuntimeOccurrenceCoordinate[];
  readonly helperAuthoringCoordinates: readonly RuntimeOccurrenceCoordinate[];
}
export interface RecordedRuntimeOccurrences {
  readonly reportSha256: string;
  readonly reportBytes: number;
  readonly rawUtf8: string;
  readonly bundleSha256: string;
  readonly identities: {
    readonly bundleIdentity: string;
    readonly canonicalKirSha256: string;
    readonly canonicalKirDigest: string;
    readonly canonicalKirBytes: number;
    readonly kernelAbiIdentity: string;
    readonly semanticMirIdentity: string;
    readonly productionKirIdentity: string;
    readonly target: "gfx942:xnack-";
  };
  readonly topology: RuntimeOccurrenceTopology;
  readonly cases: readonly RuntimeOccurrenceCase[];
  readonly provenance: {
    readonly kind: "caller_supplied_unverified";
    readonly sourceAuthentication: false;
    readonly compilerResumeAuthority: false;
    readonly hardwareObserved: false;
    readonly performancePrediction: false;
    readonly sourceMapsAvailable: false;
    readonly snapshotsAvailable: false;
    readonly fullCallStacksAvailable: false;
    readonly optOutRowsAvailable: false;
    readonly producerReportsOptOutEquality: true;
  };
}
export interface RuntimeOccurrencePins {
  readonly reportSha256: string;
  readonly bundleSha256: string;
}
export class RuntimeOccurrenceImportError extends Error {
  constructor(detail: string) { super(detail); this.name = "RuntimeOccurrenceImportError"; }
}
type Data = Record<string, unknown>;
function need(ok: unknown, detail: string): asserts ok {
  if (!ok) throw new RuntimeOccurrenceImportError(detail);
}
function aborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Runtime occurrence import cancelled.", "AbortError");
}
function exact(value: unknown, fields: readonly string[]): Data {
  need(value !== null && typeof value === "object" && !Array.isArray(value),
    "Expected a recorded object.");
  const row = value as Data;
  need(Object.keys(row).length === fields.length && fields.every(field => Object.hasOwn(row, field)),
    "Missing or unsupported recorded fields.");
  return row;
}
function uint(value: unknown, maximum: number, label: string, minimum = 0): number {
  need(typeof value === "number" && Number.isSafeInteger(value) && value >= minimum && value <= maximum,
    label + " must be an exact bounded integer.");
  return value;
}
function digest(value: unknown): string {
  need(typeof value === "string" && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value),
    "Expected an exact nonzero lowercase SHA256 identity.");
  return value;
}
function array(value: unknown, minimum: number, maximum: number, label: string): unknown[] {
  need(Array.isArray(value) && value.length >= minimum && value.length <= maximum &&
    Array.from({ length: value.length }, (_, index) => Object.hasOwn(value, index)).every(Boolean),
  label + " has an unsupported shape or size.");
  return value;
}
function coordinate(value: unknown, blockMaximum = 0xffffffff): RuntimeOccurrenceCoordinate {
  const row = array(value, 3, 3, "Coordinate");
  return [uint(row[0], 7, "Function ordinal"), uint(row[1], blockMaximum, "Block coordinate"),
    uint(row[2], 255, "Operation index")];
}
function coordinateKey(value: RuntimeOccurrenceCoordinate): string { return value.join(":"); }
function sameSite(first: RuntimeOccurrenceCoordinate, second: RuntimeOccurrenceCoordinate): boolean {
  return coordinateKey(first) === coordinateKey(second);
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
}
function topology(value: unknown): RuntimeOccurrenceTopology {
  const row = exact(value, ["entry", "helper", "call", "call_authoring_coordinate", "cycle",
    "helper_sites", "helper_authoring_coordinates"]);
  const entry = uint(row.entry, 7, "Entry ordinal"), helper = uint(row.helper, 7, "Helper ordinal");
  need(entry !== helper, "Entry and helper must be distinct.");
  const callSite = coordinate(row.call), callAuthoringCoordinate = coordinate(row.call_authoring_coordinate, 63);
  need(callSite[0] === entry && callAuthoringCoordinate[0] === entry &&
    callSite[2] === callAuthoringCoordinate[2], "Recorded call coordinate domains disagree.");
  const cycleBlockIds = array(row.cycle, 1, 64, "Cycle blocks").map(value => uint(value, 0xffffffff, "Raw block ID"));
  need(new Set(cycleBlockIds).size === cycleBlockIds.length && cycleBlockIds.includes(callSite[1]),
    "Recorded cycle is missing or ambiguous.");
  const helperSites = array(row.helper_sites, 3, 3, "Helper sites").map(value => coordinate(value));
  const helperAuthoringCoordinates = array(row.helper_authoring_coordinates, 3, 3, "Helper authoring coordinates")
    .map(value => coordinate(value, 63));
  helperSites.forEach((site, index) => {
    need(site[0] === helper && site[1] === helperSites[0][1] && site[2] === index,
      "Unsupported retained helper topology.");
    need(sameSite(helperAuthoringCoordinates[index], [helper, 0, index]),
      "Helper authoring roster differs from its recorded topology.");
  });
  // The two coordinate domains are retained independently. BlockId is never
  // used as a block-roster position, nor turned into a source location.
  return { entry, helper, callSite, callAuthoringCoordinate, cycleBlockIds, helperSites, helperAuthoringCoordinates };
}
const CASE_ROUNDS = [0, 1, 3] as const;
const EXPECTED_WORDS = [0xabcd1234, 0x479e, 0x479d] as const;
const PHASES: readonly RuntimeOccurrencePhase[] = ["before_operation", "after_operation", "write_committed"];
function projectedCase(value: unknown, index: number, reportHash: string,
  selected: RuntimeOccurrenceTopology): RuntimeOccurrenceCase {
  const row = exact(value, ["rounds", "schedule", "expected_word", "invocations", "steps", "output_bytes",
    "observation", "full_execution_equal", "compact_legacy_records_equal"]);
  const rounds = CASE_ROUNDS[Math.floor(index / 2)], expectedWord = EXPECTED_WORDS[Math.floor(index / 2)];
  const schedule = index % 2 ? "seeded_71" : "canonical";
  need(row.rounds === rounds && row.schedule === schedule && row.expected_word === expectedWord &&
    row.invocations === 4 && row.full_execution_equal === true && row.compact_legacy_records_equal === true,
  "Case roster, oracle or producer-reported comparison differs.");
  const steps = uint(row.steps, 4096, "Executed steps", 1);
  const output = array(row.output_bytes, 24, 24, "Final output");
  const expectedWords = [0xdeadbeef, expectedWord, expectedWord, expectedWord, expectedWord, 0xcafebabe];
  output.forEach((value, byte) => need(uint(value, 255, "Output byte") ===
    ((expectedWords[Math.floor(byte / 4)] >>> (8 * (byte % 4))) & 255),
  "Recorded final output or canary differs."));
  const observation = exact(row.observation, ["records", "call_attempts", "helper_activations", "global_writes", "rows"]);
  const sourceRows = array(observation.rows, 1, RUNTIME_OCCURRENCE_LIMITS.rowsPerCase, "Observation rows");
  need(observation.records === sourceRows.length && observation.call_attempts === rounds * 4 &&
    observation.helper_activations === rounds * 4 && observation.global_writes === 4,
  "Reported case counts differ from the supported profile.");
  const key = "runtime-occurrence:" + reportHash + ":case:" + index;
  const rows: RuntimeOccurrenceRow[] = [], attempts: RuntimeOccurrenceAttempt[] = [];
  const pending = new Map<string, { row: RuntimeOccurrenceRow; writeRows: number[] }>();
  const active = new Set<string>(), lastAttempt = new Map<string, number>();
  const helpers = new Map<string, { invocation: number; activation: number;
    firstRow: number; lastRow: number; attemptKeys: Set<string> }>();
  const writes = new Set<number>();
  let allocation: number | null = null;
  const helperSites = new Set(selected.helperSites.map(coordinateKey));
  for (const [ordinal, raw] of sourceRows.entries()) {
    const fields = array(raw, 10, 10, "Compact row");
    need(fields[0] === ordinal, "Row order is missing, duplicated or stale.");
    const decision = uint(fields[1], 4097, "Schedule decision");
    const invocation = uint(fields[2], 3, "Logical invocation"), site = coordinate(fields[3]);
    const kind = uint(fields[4], 2, "Row kind");
    const activation = uint(fields[5], 4097, "Activation", 1), attempt = uint(fields[6], 4097, "Attempt", 1);
    const rowAllocation = uint(fields[7], 16, "Allocation"), byteOffset = uint(fields[8], 24, "Write offset");
    const u32Bits = uint(fields[9], 0xffffffff, "Write scalar");
    need(site[0] === selected.entry || site[0] === selected.helper, "Unsupported runtime function.");
    need(site[0] !== selected.entry || activation === 1, "Root operation has the wrong activation.");
    need(site[0] !== selected.helper || (activation !== 1 && helperSites.has(coordinateKey(site))),
      "Helper operation has an unsupported site or activation.");
    need(kind === 2 || (rowAllocation === 0 && byteOffset === 0 && u32Bits === 0),
      "Before/after rows cannot carry invented memory.");
    const item: RuntimeOccurrenceRow = { key: key + ":row:" + ordinal, ordinal, decision, invocation,
      site, phase: PHASES[kind], activation, attempt,
      committedWrite: kind === 2 ? { allocation: rowAllocation, byteOffset, u32Bits } : null };
    rows.push(item);
    const scope = invocation + ":" + activation;
    const attemptKey = key + ":invocation:" + invocation + ":activation:" + activation + ":attempt:" + attempt;
    if (kind === 0) {
      need(attempt === (lastAttempt.get(scope) ?? 0) + 1 && !pending.has(attemptKey) && !active.has(scope),
        "Attempt is repeated, skipped or overlaps another operation in its activation.");
      pending.set(attemptKey, { row: item, writeRows: [] }); active.add(scope); lastAttempt.set(scope, attempt);
    } else {
      const before = pending.get(attemptKey);
      need(before && sameSite(before.row.site, site) && before.row.ordinal < ordinal,
        "After/write row lacks its exact earlier attempt.");
      if (kind === 1) {
        pending.delete(attemptKey); active.delete(scope);
        attempts.push({ key: attemptKey, site, invocation, activation, attempt,
          beforeRow: before.row.ordinal, afterRow: ordinal, writeRows: before.writeRows });
      } else {
        need(site[0] === selected.entry && rowAllocation > 0 && byteOffset === 4 + 4 * invocation &&
          u32Bits === expectedWord && !writes.has(invocation) &&
          (allocation === null || allocation === rowAllocation),
        "Committed write is outside the exact recorded output profile.");
        allocation = rowAllocation; writes.add(invocation); before.writeRows.push(ordinal);
      }
    }
    if (site[0] === selected.helper) {
      const helper = helpers.get(scope) ?? { invocation, activation, firstRow: ordinal,
        lastRow: ordinal, attemptKeys: new Set<string>() };
      helper.lastRow = ordinal; helper.attemptKeys.add(attemptKey); helpers.set(scope, helper);
    }
  }
  need(pending.size === 0 && active.size === 0 && writes.size === 4, "Unclosed attempts or missing committed writes.");
  attempts.sort((first, second) => first.beforeRow - second.beforeRow);
  const attemptsByKey = new Map(attempts.map(item => [item.key, item]));
  const calls = attempts.filter(item => sameSite(item.site, selected.callSite));
  need(calls.length === rounds * 4 && helpers.size === rounds * 4, "Derived call/helper counts differ.");
  need(calls.every(call => call.writeRows.length === 0), "Pure helper calls cannot own committed writes.");
  const projectedHelpers: RuntimeHelperOccurrence[] = [];
  for (let invocation = 0; invocation < 4; invocation++) {
    const localCalls = calls.filter(item => item.invocation === invocation);
    const localHelpers = [...helpers.values()].filter(item => item.invocation === invocation)
      .sort((first, second) => first.firstRow - second.firstRow);
    need(localCalls.length === rounds && localHelpers.length === rounds,
      "Each invocation must retain its actual zero/single/repeated calls.");
    for (const helper of localHelpers) {
      const parents = localCalls.filter(call => call.beforeRow < helper.firstRow && helper.lastRow < call.afterRow);
      need(parents.length === 1, "Helper does not have exactly one recorded caller interval.");
      const caller = parents[0];
      const helperAttempts = [...helper.attemptKeys].map(attemptKey => {
        const item = attemptsByKey.get(attemptKey);
        need(item, "Helper attempt is incomplete."); return item;
      }).sort((first, second) => first.beforeRow - second.beforeRow);
      need(helperAttempts.length === 3 && helperAttempts.every((item, ordinal) =>
        item.attempt === ordinal + 1 && sameSite(item.site, selected.helperSites[ordinal]) && item.writeRows.length === 0),
      "Helper must retain the three exact pure operation attempts.");
      projectedHelpers.push({ key: key + ":helper:" + invocation + ":" + helper.activation,
        invocation, activation: helper.activation, callerAttemptKey: caller.key,
        callBeforeRow: caller.beforeRow, callAfterRow: caller.afterRow,
        firstRow: helper.firstRow, lastRow: helper.lastRow, attemptKeys: helperAttempts.map(item => item.key) });
    }
    for (const call of localCalls)
      need(localHelpers.filter(helper => call.beforeRow < helper.firstRow && helper.lastRow < call.afterRow).length === 1,
        "Recorded caller interval lacks exactly one helper activation.");
  }
  projectedHelpers.sort((first, second) => first.firstRow - second.firstRow);
  return { key, index, rounds, schedule, expectedWord, steps, rows, attempts, helpers: projectedHelpers };
}

/** Exact byte agreement is not authentication. The supplied expected hashes
 * must come from the caller's selected recording; this function never fetches,
 * compiles, launches, reconstructs snapshots or promotes diagnostic authority. */
export async function importRecordedRuntimeOccurrences(rawUtf8: string, expected: RuntimeOccurrencePins,
  signal?: AbortSignal): Promise<RecordedRuntimeOccurrences> {
  aborted(signal);
  const pins = exact(expected, ["reportSha256", "bundleSha256"]);
  // Copy primitive pins before the async boundary so caller mutation cannot rebind.
  const reportSha256 = digest(pins.reportSha256), bundleSha256 = digest(pins.bundleSha256);
  need(typeof rawUtf8 === "string" && rawUtf8.length > 0 && rawUtf8.length <= RUNTIME_OCCURRENCE_LIMITS.reportBytes,
    "Report must be nonempty and at most 512 KiB.");
  const reportBytes = new TextEncoder().encode(rawUtf8).byteLength;
  need(reportBytes <= RUNTIME_OCCURRENCE_LIMITS.reportBytes && rawUtf8.charCodeAt(0) !== 0xfeff,
    "Report UTF-8 byte limit or BOM is unsupported.");
  for (const point of rawUtf8) {
    const code = point.codePointAt(0)!;
    need(code < 0xd800 || code > 0xdfff, "Report contains invalid Unicode.");
  }
  let measured: string;
  try { measured = await programSha256(rawUtf8); }
  catch {
    aborted(signal); throw new RuntimeOccurrenceImportError("WebCrypto is required to check the report bytes.");
  }
  aborted(signal);
  need(measured === reportSha256, "Report differs from the exact selected bytes.");
  let parsed: unknown;
  try { parsed = parseProgramJson(rawUtf8, RUNTIME_OCCURRENCE_LIMITS.reportBytes); }
  catch { throw new RuntimeOccurrenceImportError("Malformed, duplicate-key or out-of-bounds report JSON."); }
  const data = exact(parsed, ["schema", "status", "bundle_sha256", "bundle_identity", "canonical_kir_sha256",
    "canonical_kir_digest", "canonical_kir_bytes", "production_kir_identity", "kernel_abi_identity",
    "semantic_mir_identity", "target", "topology", "cases", "contextual_runs", "opt_out_runs", "helper_activations",
    "source_authenticated", "hardware_observed", "compiler_resume_authority", "scope"]);
  need(data.schema === "task-runtime-origin-source-observer-v1" && data.status === "passed" &&
    data.target === "gfx942:xnack-" && data.bundle_sha256 === bundleSha256,
  "Unsupported observer report or different selected bundle.");
  need(data.source_authenticated === false && data.hardware_observed === false && data.compiler_resume_authority === false &&
    data.scope === "exact retained ordinary-source CPU cases; no per-frame or serialized debugger identity",
  "Observer scope or authority claims are unsupported.");
  need(typeof data.production_kir_identity === "string" && data.production_kir_identity.length > 0 &&
    data.production_kir_identity.length <= 512 && Array.from(data.production_kir_identity).every(character =>
      character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127),
  "Production lineage must remain a bounded opaque observation.");
  const selected = topology(data.topology);
  const cases = array(data.cases, 6, 6, "Case roster").map((value, index) =>
    projectedCase(value, index, reportSha256, selected));
  need(cases.reduce((sum, item) => sum + item.rows.length, 0) <= RUNTIME_OCCURRENCE_LIMITS.totalRows,
    "Cumulative observation rows exceed the display bound.");
  const helperCount = cases.reduce((sum, item) => sum + item.helpers.length, 0);
  need(data.contextual_runs === 6 && data.opt_out_runs === 6 && data.helper_activations === helperCount && helperCount === 32,
    "Aggregate contextual/opt-out/helper observations differ.");
  aborted(signal);
  return freeze<RecordedRuntimeOccurrences>({ reportSha256, reportBytes, rawUtf8, bundleSha256,
    identities: { bundleIdentity: digest(data.bundle_identity), canonicalKirSha256: digest(data.canonical_kir_sha256),
      canonicalKirDigest: digest(data.canonical_kir_digest),
      canonicalKirBytes: uint(data.canonical_kir_bytes, 256 * 1024, "Canonical bytes", 1),
      kernelAbiIdentity: digest(data.kernel_abi_identity), semanticMirIdentity: digest(data.semantic_mir_identity),
      productionKirIdentity: data.production_kir_identity, target: "gfx942:xnack-" },
    topology: selected, cases,
    provenance: { kind: "caller_supplied_unverified", sourceAuthentication: false, compilerResumeAuthority: false,
      hardwareObserved: false, performancePrediction: false, sourceMapsAvailable: false, snapshotsAvailable: false,
      fullCallStacksAvailable: false, optOutRowsAvailable: false, producerReportsOptOutEquality: true } });
}
