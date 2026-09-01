import collectionHexRaw from "../../examples/source_isa_agent_v1/collection.hex?raw";
import requestsRaw from "../../examples/source_isa_agent_v1/requests.jsonl?raw";
import responsesRaw from "../../examples/source_isa_agent_v1/responses.jsonl?raw";
import milestoneData from "../../config/source-isa-agent-milestone.json";
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
