import collectionHexRaw from "../../examples/source_isa_agent_v1/collection.hex?raw";
import requestsRaw from "../../examples/source_isa_agent_v1/requests.jsonl?raw";
import responsesRaw from "../../examples/source_isa_agent_v1/responses.jsonl?raw";
import characteristicCollectionHexRaw from "../../examples/source_isa_characteristic_v1/collection.hex?raw";
import characteristicRequestsRaw from "../../examples/source_isa_characteristic_v1/requests.jsonl?raw";
import characteristicResponsesRaw from "../../examples/source_isa_characteristic_v1/responses.jsonl?raw";
import milestoneData from "../../config/source-isa-agent-milestone.json";
import characteristicMilestoneData from "../../config/source-isa-characteristic-tutorial.json";
import { deepFreeze } from "./registry";

interface JsonRecord {
  [key: string]: unknown;
}

function parseJsonl(raw: string, label: string): JsonRecord[] {
  const lines = raw.trimEnd().split("\n");
  if (lines.length !== 3 || lines.some((line) => line.trim() !== line)) {
    throw new Error(`${label} must contain exactly three canonical JSONL records`);
  }
  return lines.map((line, index) => {
    const value: unknown = JSON.parse(line);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`${label} record ${index + 1} is not an object`);
    }
    return value as JsonRecord;
  });
}

const requests = parseJsonl(requestsRaw, "source/ISA agent requests");
const responses = parseJsonl(responsesRaw, "source/ISA agent responses");
const collectionHex = collectionHexRaw.trimEnd();
const exactObject = /^[0-9a-f]{40}$/u;
const exactDigest = /^[0-9a-f]{64}$/u;

if (
  milestoneData.schema !== "fe2o3-source-isa-agent-tutorial-milestone-v1" ||
  milestoneData.status !== "implemented-synthetic-fixture" ||
  !exactObject.test(milestoneData.compilerCommit) ||
  !exactObject.test(milestoneData.compilerTree) ||
  !exactDigest.test(milestoneData.fixtureSha256) ||
  !exactDigest.test(milestoneData.collectionEvidenceDigest) ||
  milestoneData.issue !== 215 ||
  milestoneData.issueState !== "open" ||
  milestoneData.protectedMatrixRun !== false ||
  collectionHex.length !== milestoneData.fixtureCanonicalBytes * 2 ||
  !/^[0-9a-f]+$/u.test(collectionHex)
) {
  throw new Error("source/ISA agent tutorial milestone is malformed");
}

for (let index = 0; index < 3; index += 1) {
  if (
    requests[index]?.schema !== milestoneData.requestSchema ||
    responses[index]?.schema !== milestoneData.responseSchema ||
    requests[index]?.request_id !== index + 1 ||
    responses[index]?.request_id !== index + 1 ||
    responses[index]?.response_revision !== index + 1
  ) {
    throw new Error(`source/ISA agent transcript record ${index + 1} is not correlated`);
  }
}

if (
  requests[0]?.operation !== "discover_capabilities" ||
  requests[1]?.operation !== "inspect_source_isa_collection" ||
  requests[1]?.collection_hex !== collectionHex ||
  responses[0]?.status !== "ok" ||
  responses[1]?.status !== "ok" ||
  responses[2]?.status !== "error" ||
  responses[2]?.error !== "invalid_collection" ||
  responses[2]?.terminal !== false
) {
  throw new Error("source/ISA agent transcript does not preserve the exact workflow");
}

const collectionResult = responses[1]?.result as JsonRecord | undefined;
const authority = collectionResult?.authority as JsonRecord | undefined;
const collection = collectionResult?.collection as JsonRecord | undefined;
const collectionEvidence = collection?.collection_evidence as JsonRecord | undefined;
const completeness = collection?.completeness as JsonRecord | undefined;
const page = collectionResult?.page as JsonRecord | undefined;
const items = page?.items as JsonRecord[] | undefined;

if (
  authority?.observation_only !== true ||
  authority?.compiler_authority !== false ||
  authority?.proof_authority !== false ||
  authority?.artifact_authority !== false ||
  authority?.runtime_authority !== false ||
  authority?.hardware_execution_observed !== false ||
  authority?.complete_machine_coverage_proved !== false ||
  authority?.semantic_refinement_proved !== false ||
  collectionEvidence?.digest !== milestoneData.collectionEvidenceDigest ||
  collectionEvidence?.canonical_byte_len !== milestoneData.fixtureCanonicalBytes ||
  completeness?.state !== "incomplete" ||
  page?.page_exhausted !== true ||
  items?.length !== 1 ||
  items[0]?.unit_state !== "missing"
) {
  throw new Error("source/ISA agent fixture elevated or lost its observation truth");
}

export const sourceIsaAgentMilestone = deepFreeze(milestoneData);
export const sourceIsaAgentCollectionHex = collectionHex;
export const sourceIsaAgentRequests = deepFreeze(requests);
export const sourceIsaAgentResponses = deepFreeze(responses);

export const sourceIsaAgentCommands = deepFreeze([
  "xxd -r -p examples/source_isa_agent_v1/collection.hex > observations.bin",
  "cargo fe2o3 inspect --format source-isa-observation --output agent-json-v1 observations.bin",
  "cargo fe2o3 inspect --output agent-json-v1 < requests.jsonl",
]);

export const sourceIsaAgentSources = deepFreeze([
  { label: "Frozen observation format", path: "docs/source-isa-observation-collection-v1.md" },
  { label: "Authority-free protocol", path: "crates/fe2o3-source-isa-observation/src/agent_v1.rs" },
  { label: "Observer boundary", path: "crates/fe2o3-source-isa-observation/README.md" },
  { label: "Cargo inspection entry", path: "crates/cargo-fe2o3/src/main.rs" },
  { label: "Exact CLI acceptance", path: "crates/cargo-fe2o3/tests/inspect_cli.rs" },
]);

export function sourceIsaAgentSourceUrl(path: string): string {
  return `https://github.com/harsh-nod/fe2o3/blob/${sourceIsaAgentMilestone.compilerCommit}/${path}`;
}

type SourceIsaCharacteristicPlaneId = "capability" | "targets" | "facts" | "intervals";

interface SourceIsaCharacteristicMilestone {
  schema: string;
  status: "awaiting-exact-compiler-fixture" | "implemented-exact-fixture";
  reviewedOn: string;
  compilerCommit: string | null;
  compilerTree: string | null;
  issue: number;
  issueState: "open";
  requestSchema: string;
  responseSchema: string;
  fixtureKind: string;
  fixtureCanonicalBytes: number | null;
  fixtureSha256: string | null;
  collectionIdentity: string | null;
  synthetic: true;
  hardwareExecuted: false;
  archiveAuthenticated: false;
  protectedMatrixRun: false;
  expectedPlaneCount: number;
}

interface SourceIsaCharacteristicPlane {
  id: SourceIsaCharacteristicPlaneId;
  label: string;
  operation: string;
  state: "pending" | "available";
  summary: string;
  contract: readonly string[];
  request: JsonRecord | null;
  response: JsonRecord | null;
}

interface SourceIsaCharacteristicLineageStage {
  id: string;
  label: string;
  value: string | null;
  status: "pending" | "present";
}

const characteristicMilestone = characteristicMilestoneData as SourceIsaCharacteristicMilestone;
const pendingCollection = "PENDING_EXACT_T4_CHARACTERISTIC_ARCHIVE";
const pendingRequests = "# PENDING_EXACT_T4_CHARACTERISTIC_REQUESTS";
const pendingResponses = "# PENDING_EXACT_T4_CHARACTERISTIC_RESPONSES";
const characteristicCollectionHex = characteristicCollectionHexRaw.trimEnd();
const characteristicRequestText = characteristicRequestsRaw.trimEnd();
const characteristicResponseText = characteristicResponsesRaw.trimEnd();
const characteristicOperations = [
  "discover_capabilities",
  "query_targets",
  "query_facts",
  "query_intervals",
] as const;
const characteristicResultKinds = [
  "capabilities",
  "target_page",
  "fact_page",
  "interval_page",
] as const;

function requireRecord(value: unknown, label: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} is not an object`);
  }
  return value as JsonRecord;
}

function requireRecords(value: unknown, label: string): JsonRecord[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} is not an array`);
  }
  return value.map((item, index) => requireRecord(item, `${label}[${index}]`));
}

function parseCharacteristicJsonl(raw: string, label: string): JsonRecord[] {
  const lines = raw.trimEnd().split("\n");
  if (
    lines.length !== characteristicMilestone.expectedPlaneCount ||
    lines.some((line) => line.trim() !== line)
  ) {
    throw new Error(`${label} must contain four canonical JSONL records`);
  }
  return lines.map((line, index) =>
    requireRecord(JSON.parse(line) as unknown, `${label} record ${index + 1}`),
  );
}

function shortIdentity(value: unknown): string | null {
  return typeof value === "string" && exactDigest.test(value)
    ? `${value.slice(0, 12)}...${value.slice(-6)}`
    : null;
}

function coordinate(
  value: unknown,
  fields: readonly [string, string, string],
  prefixes: readonly [string, string, string],
): string | null {
  const record = value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : null;
  if (!record || fields.some((field) => typeof record[field] !== "number")) {
    return null;
  }
  return fields
    .map((field, index) => `${prefixes[index]}${String(record[field])}`)
    .join(" / ");
}

function resultOf(response: JsonRecord): JsonRecord {
  return requireRecord(response.result, "source/ISA characteristic response result");
}

function pageOf(response: JsonRecord): JsonRecord {
  return requireRecord(resultOf(response).page, "source/ISA characteristic response page");
}

function authorityIsNonElevated(response: JsonRecord): boolean {
  const authority = requireRecord(resultOf(response).authority, "characteristic authority");
  return authority.observation_only === true &&
    authority.service_provenance === "canonical_self_claimed_archive" &&
    authority.canonical_self_claimed_archive === true &&
    authority.archive_authenticity_proved === false &&
    authority.producer_evidence_authenticated === false &&
    authority.compiler_authority === false &&
    authority.proof_authority === false &&
    authority.publication_authority === false &&
    authority.runtime_authority === false &&
    authority.hardware_observation_authority === false &&
    authority.complete_machine_instruction_coverage_proved === false &&
    authority.schedule_proved === false &&
    authority.semantic_refinement_proved === false &&
    authority.final_llvm_classification_proved === false &&
    authority.final_isa_opcode_classification_proved === false &&
    authority.decoded_isa === false;
}

function duplicateCorrelationKey(fact: JsonRecord): string | null {
  const outcome = requireRecord(fact.outcome, "characteristic fact outcome");
  if (outcome.fact_kind !== "target_correlation") return null;
  const correlation = requireRecord(outcome.correlation, "target correlation");
  const semanticCorrelation = Object.fromEntries(
    Object.entries(correlation).filter(([key]) => key !== "catalog_record_ordinal"),
  );
  return JSON.stringify({
    characteristic_identity: fact.characteristic_identity,
    category: fact.category,
    kind: fact.kind,
    target_kir: fact.target_kir,
    correlation: semanticCorrelation,
  });
}

function validateImplementedCharacteristicFixture(
  requests: JsonRecord[],
  responses: JsonRecord[],
): void {
  if (
    characteristicMilestone.compilerCommit === null ||
    characteristicMilestone.compilerTree === null ||
    characteristicMilestone.fixtureCanonicalBytes === null ||
    characteristicMilestone.fixtureSha256 === null ||
    characteristicMilestone.collectionIdentity === null ||
    characteristicMilestone.fixtureKind !==
      "synthetic-canonical-self-claimed-characteristic-archive" ||
    characteristicMilestone.synthetic !== true ||
    characteristicMilestone.hardwareExecuted !== false ||
    characteristicMilestone.archiveAuthenticated !== false ||
    !exactObject.test(characteristicMilestone.compilerCommit) ||
    !exactObject.test(characteristicMilestone.compilerTree) ||
    !exactDigest.test(characteristicMilestone.fixtureSha256) ||
    !exactDigest.test(characteristicMilestone.collectionIdentity) ||
    characteristicCollectionHex.length !== characteristicMilestone.fixtureCanonicalBytes * 2 ||
    !/^[0-9a-f]+$/u.test(characteristicCollectionHex)
  ) {
    throw new Error("implemented source/ISA characteristic fixture lacks exact pins");
  }

  for (let index = 0; index < characteristicOperations.length; index += 1) {
    const request = requests[index];
    const response = responses[index];
    const result = resultOf(response);
    if (
      request?.schema !== characteristicMilestone.requestSchema ||
      response?.schema !== characteristicMilestone.responseSchema ||
      request?.request_id !== index + 1 ||
      response?.request_id !== index + 1 ||
      response?.response_revision !== index + 1 ||
      request?.operation !== characteristicOperations[index] ||
      response?.operation !== characteristicOperations[index] ||
      response?.status !== "ok" ||
      result.result !== characteristicResultKinds[index] ||
      !authorityIsNonElevated(response)
    ) {
      throw new Error(`source/ISA characteristic plane ${index + 1} is not exact`);
    }
  }

  const capabilityCollection = requireRecord(
    resultOf(responses[0]).collection,
    "characteristic capability collection",
  );
  const capabilityBinding = requireRecord(
    capabilityCollection.binding,
    "characteristic capability binding",
  );
  const targetProfile = requireRecord(
    capabilityBinding.target_profile,
    "characteristic target profile",
  );
  const capabilityScan = requireRecord(
    capabilityCollection.scan,
    "characteristic capability scan",
  );
  if (
    capabilityCollection.identity !== characteristicMilestone.collectionIdentity ||
    capabilityCollection.canonical_byte_len !== characteristicMilestone.fixtureCanonicalBytes ||
    capabilityBinding.kir_version !== 8 ||
    targetProfile.label !== "gfx942" ||
    capabilityCollection.target_count !== 2 ||
    capabilityScan.classified_target_count !== 2 ||
    capabilityScan.retained_target_correlation_count !== 2 ||
    capabilityScan.correlation_count !== 2 ||
    capabilityCollection.decoded_isa !== false
  ) {
    throw new Error("characteristic collection metadata differs from the exact milestone pin");
  }
  for (const request of requests.slice(1)) {
    if (request.collection_identity !== characteristicMilestone.collectionIdentity) {
      throw new Error("characteristic query is not bound to the exact collection");
    }
  }

  const targets = requireRecords(pageOf(responses[1]).targets, "characteristic targets");
  const structuralTarget = targets.find((target) => target.correlation_count === 0);
  const memoryTarget = targets.find((target) => {
    const kind = requireRecord(target.kind, "characteristic target kind");
    const memoryForm = kind.memory_form;
    if (memoryForm === null) return false;
    const projected = requireRecord(memoryForm, "target memory form");
    return typeof projected.code === "number" &&
      ["plain", "guarded", "matrix_tile"].includes(String(projected.label));
  });
  if (targets.length !== 2 || !structuralTarget || !memoryTarget) {
    throw new Error("characteristic target page lacks structural-only or exact memory-form evidence");
  }

  const facts = requireRecords(pageOf(responses[2]).facts, "characteristic facts");
  const sourceFact = facts.find((fact) => {
    const outcome = requireRecord(fact.outcome, "characteristic fact outcome");
    if (outcome.fact_kind !== "target_correlation") return false;
    const correlation = requireRecord(outcome.correlation, "target correlation");
    return correlation.source !== null &&
      correlation.mir !== null &&
      correlation.neutral_kir !== null &&
      correlation.target_kir !== null &&
      typeof correlation.semantic_operation_identity === "string" &&
      correlation.compiler_handoff_llvm !== null &&
      typeof correlation.interval_count === "number" &&
      correlation.interval_count > 0;
  });
  const duplicatePair = facts.flatMap((left, leftIndex) =>
    facts.slice(leftIndex + 1).map((right) => [left, right] as const),
  ).find(([left, right]) =>
    duplicateCorrelationKey(left) !== null &&
    duplicateCorrelationKey(left) === duplicateCorrelationKey(right) &&
    left.occurrence_identity !== right.occurrence_identity &&
    requireRecord(requireRecord(left.outcome, "left fact outcome").correlation, "left correlation")
      .catalog_record_ordinal !==
      requireRecord(requireRecord(right.outcome, "right fact outcome").correlation, "right correlation")
        .catalog_record_ordinal,
  );
  if (facts.length !== 2 || !sourceFact || !duplicatePair) {
    throw new Error("characteristic facts lack full lineage or duplicate multiplicity");
  }

  const intervalPage = pageOf(responses[3]);
  const intervals = requireRecords(intervalPage.intervals, "characteristic intervals");
  if (
    !facts.some((fact) => fact.occurrence_identity === intervalPage.occurrence_identity) ||
    requests[3].occurrence_identity !== intervalPage.occurrence_identity ||
    intervals.length !== 2 ||
    intervals[0]?.identity === intervals[1]?.identity ||
    intervals[0]?.ordinal === intervals[1]?.ordinal ||
    JSON.stringify(intervals[0]?.interval) !== JSON.stringify(intervals[1]?.interval)
  ) {
    throw new Error("characteristic interval page is not bound to one returned fact");
  }
}

if (
  characteristicMilestone.schema !== "fe2o3-source-isa-characteristic-tutorial-milestone-v1" ||
  characteristicMilestone.issue !== 215 ||
  characteristicMilestone.issueState !== "open" ||
  characteristicMilestone.synthetic !== true ||
  characteristicMilestone.hardwareExecuted !== false ||
  characteristicMilestone.archiveAuthenticated !== false ||
  characteristicMilestone.protectedMatrixRun !== false ||
  characteristicMilestone.expectedPlaneCount !== 4
) {
  throw new Error("source/ISA characteristic tutorial milestone is malformed");
}

let characteristicRequests: JsonRecord[] = [];
let characteristicResponses: JsonRecord[] = [];
if (characteristicMilestone.status === "awaiting-exact-compiler-fixture") {
  if (
    characteristicMilestone.compilerCommit !== null ||
    characteristicMilestone.compilerTree !== null ||
    characteristicMilestone.fixtureCanonicalBytes !== null ||
    characteristicMilestone.fixtureSha256 !== null ||
    characteristicMilestone.collectionIdentity !== null ||
    characteristicCollectionHex !== pendingCollection ||
    characteristicRequestText !== pendingRequests ||
    characteristicResponseText !== pendingResponses
  ) {
    throw new Error("pending characteristic tutorial contains unreviewed fixture claims");
  }
} else {
  characteristicRequests = parseCharacteristicJsonl(
    characteristicRequestText,
    "source/ISA characteristic requests",
  );
  characteristicResponses = parseCharacteristicJsonl(
    characteristicResponseText,
    "source/ISA characteristic responses",
  );
  validateImplementedCharacteristicFixture(characteristicRequests, characteristicResponses);
}

const characteristicPlaneContracts = [
  {
    id: "capability",
    label: "Capability",
    operation: "discover_capabilities",
    summary: "Collection identity, hard limits, scan truth, and explicit non-authority.",
    contract: ["One preloaded collection", "Four bounded operations", "No execution authority"],
  },
  {
    id: "targets",
    label: "Targets",
    operation: "query_targets",
    summary: "One structural occurrence per classified target, including zero-correlation targets.",
    contract: ["Exact kind and memory form", "Target-KIR coordinate", "Correlation count may be zero"],
  },
  {
    id: "facts",
    label: "Facts",
    operation: "query_facts",
    summary: "Occurrence-preserving compiler lineage, typed absence, and transformation state.",
    contract: ["Source and MIR when present", "Neutral and target KIR", "LLVM ordinal and semantic op"],
  },
  {
    id: "intervals",
    label: "Intervals",
    operation: "query_intervals",
    summary: "Sparse final-HSACO intervals paged separately and bound to one fact occurrence.",
    contract: ["Fact-bound cursor", "Duplicate intervals retained", "Sparse anchors are not decoded ISA"],
  },
] as const;

export const sourceIsaCharacteristicMilestone = deepFreeze(characteristicMilestone);
export const sourceIsaCharacteristicFixtureReady =
  characteristicMilestone.status === "implemented-exact-fixture";
export const sourceIsaCharacteristicFixtureDirectory =
  "examples/source_isa_characteristic_v1";
export const sourceIsaCharacteristicCollectionHex = characteristicCollectionHex;
export const sourceIsaCharacteristicRequests = deepFreeze(characteristicRequests);
export const sourceIsaCharacteristicResponses = deepFreeze(characteristicResponses);
export const sourceIsaCharacteristicCommands = deepFreeze([
  "xxd -r -p examples/source_isa_characteristic_v1/collection.hex > characteristics.bin",
  "cargo fe2o3 inspect --format source-isa-characteristic-v1 --output agent-json-v1 characteristics.bin < examples/source_isa_characteristic_v1/requests.jsonl",
]);
export const sourceIsaCharacteristicPlanes = deepFreeze(
  characteristicPlaneContracts.map((plane, index): SourceIsaCharacteristicPlane => ({
    ...plane,
    state: sourceIsaCharacteristicFixtureReady ? "available" : "pending",
    request: characteristicRequests[index] ?? null,
    response: characteristicResponses[index] ?? null,
  })),
);

const exactTargets = sourceIsaCharacteristicFixtureReady
  ? requireRecords(pageOf(characteristicResponses[1]).targets, "characteristic targets")
  : [];
const exactFacts = sourceIsaCharacteristicFixtureReady
  ? requireRecords(pageOf(characteristicResponses[2]).facts, "characteristic facts")
  : [];
const exactIntervals = sourceIsaCharacteristicFixtureReady
  ? requireRecords(pageOf(characteristicResponses[3]).intervals, "characteristic intervals")
  : [];
const exactSourceFact = exactFacts.find((fact) => {
  const outcome = requireRecord(fact.outcome, "characteristic fact outcome");
  return outcome.fact_kind === "target_correlation" &&
    requireRecord(outcome.correlation, "target correlation").source !== null;
}) ?? null;
const exactCorrelation = exactSourceFact
  ? requireRecord(requireRecord(exactSourceFact.outcome, "fact outcome").correlation, "target correlation")
  : null;
const exactSource = exactCorrelation
  ? requireRecord(exactCorrelation.source, "source coordinate")
  : null;
const exactSpan = exactSource ? requireRecord(exactSource.span, "source span") : null;

export const sourceIsaCharacteristicLineage = deepFreeze([
  {
    id: "source",
    label: "Source",
    value: exactSource && exactSpan
      ? `${shortIdentity(exactSource.node_identity) ?? "invalid"} / bytes ${String(exactSpan.byte_start)}..${String(exactSpan.byte_end)}`
      : null,
  },
  {
    id: "mir",
    label: "MIR",
    value: exactCorrelation
      ? coordinate(exactCorrelation.mir, ["body_ordinal", "block_ordinal", "statement_ordinal"], ["body ", "block ", "stmt "])
      : null,
  },
  {
    id: "neutral-kir",
    label: "Neutral KIR",
    value: exactCorrelation
      ? coordinate(exactCorrelation.neutral_kir, ["function_ordinal", "block_ordinal", "operation_ordinal"], ["fn ", "block ", "op "])
      : null,
  },
  {
    id: "target-kir",
    label: "Target KIR",
    value: exactCorrelation
      ? coordinate(exactCorrelation.target_kir, ["function_ordinal", "block_ordinal", "operation_ordinal"], ["fn ", "block ", "op "])
      : null,
  },
  {
    id: "semantic-op",
    label: "Semantic op",
    value: exactCorrelation ? shortIdentity(exactCorrelation.semantic_operation_identity) : null,
  },
  {
    id: "llvm",
    label: "LLVM handoff",
    value: exactCorrelation
      ? coordinate(exactCorrelation.compiler_handoff_llvm, ["function_ordinal", "block_ordinal", "instruction_ordinal"], ["fn ", "block ", "inst "])
      : null,
  },
  {
    id: "isa",
    label: "Sparse ISA",
    value: exactCorrelation
      ? `${String(exactCorrelation.interval_count)} interval${exactCorrelation.interval_count === 1 ? "" : "s"}`
      : null,
  },
].map((stage): SourceIsaCharacteristicLineageStage => ({
  ...stage,
  status: stage.value === null ? "pending" : "present",
})));

export const sourceIsaCharacteristicStructuralTarget = deepFreeze(
  exactTargets.find((target) => target.correlation_count === 0) ?? null,
);
export const sourceIsaCharacteristicMemoryTarget = deepFreeze(
  exactTargets.find((target) => {
    const kind = requireRecord(target.kind, "characteristic target kind");
    return kind.memory_form !== null;
  }) ?? null,
);
export const sourceIsaCharacteristicDuplicateFacts = deepFreeze(
  exactFacts.flatMap((left, leftIndex) =>
    exactFacts.slice(leftIndex + 1).map((right) => [left, right] as const),
  ).find(([left, right]) =>
    duplicateCorrelationKey(left) !== null &&
    duplicateCorrelationKey(left) === duplicateCorrelationKey(right) &&
    left.occurrence_identity !== right.occurrence_identity &&
    requireRecord(requireRecord(left.outcome, "left fact outcome").correlation, "left correlation")
      .catalog_record_ordinal !==
      requireRecord(requireRecord(right.outcome, "right fact outcome").correlation, "right correlation")
        .catalog_record_ordinal,
  ) ?? null,
);
export const sourceIsaCharacteristicIntervals = deepFreeze(exactIntervals);

export const sourceIsaCharacteristicSources = deepFreeze([
  { label: "Characteristic observer schema", path: "crates/fe2o3-source-isa-observation/src/characteristic_v1.rs" },
  { label: "Characteristic agent protocol", path: "crates/fe2o3-source-isa-observation/src/characteristic_agent_v1.rs" },
  { label: "Production release adapter", path: "crates/fe2o3-hsaco-finalize/src/production_source_isa_characteristic_observer_v1.rs" },
  { label: "Production classifier", path: "crates/fe2o3-hsaco-finalize/src/production_source_isa_characteristic_v1.rs" },
  { label: "Cargo archive service", path: "crates/cargo-fe2o3/src/inspect.rs" },
]);

export function sourceIsaCharacteristicSourceUrl(path: string): string | null {
  return characteristicMilestone.compilerCommit
    ? `https://github.com/harsh-nod/fe2o3/blob/${characteristicMilestone.compilerCommit}/${path}`
    : null;
}
