import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { basename } from "node:path";

const RECORD_SCHEMA = "fe2o3-tutorial-compiler-qualification-record-v1";
const ROADMAP = "https://github.com/harsh-nod/fe2o3/issues/271";
const MAX_RECORD_BYTES = 8 * 1024 * 1024;
const MAX_FIXTURES = 256;
const MAX_TARGETS = 16;
const MAX_SUITES = 64;
const SHA256 = /^[0-9a-f]{64}$/u;
const GIT_ID = /^[0-9a-f]{40}$/u;
const TARGET = /^gfx[0-9]{3}$/u;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SOURCE_ISA_V2_IMPLEMENTATION = {
  collectionBytes: 4797,
  collectionSha256: "0a5627abbf4550e209adb923f873caa68065237e21ee5219fba9272647891072",
  fixturePath: "crates/fe2o3-hsaco-finalize/tests/fixtures/production-v12-source-isa-characteristic-v2.json",
  schema: "fe2o3-source-isa-characteristic-v2",
  status: "admitted-production-shaped-worker-v3-v12",
  targetProfile: "gfx942:xnack-",
};
const SOURCE_ISA_V2_UNAVAILABLE = {
  collectionBytes: 0,
  collectionSha256: null,
  inspectionStatus: "not-contained-pre-finalization",
  status: "unavailable-direct-link-no-protected-finalizer",
};

function fail(message) {
  throw new Error(`tutorial qualification record: ${message}`);
}

function exactKeys(value, keys, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${label} keys differ: got ${actual.join(", ")}`);
  }
  return value;
}

function boundedArray(value, maximum, label, nonempty = false) {
  if (!Array.isArray(value) || value.length > maximum || (nonempty && value.length === 0)) {
    fail(`${label} must be a bounded${nonempty ? " nonempty" : ""} array`);
  }
  return value;
}

function text(value, label) {
  if (
    typeof value !== "string" || value.length === 0 || value.length > 4096 ||
    /[^\x20-\x7e]|[\t\r\n]/u.test(value)
  ) {
    fail(`${label} must be bounded single-line ASCII`);
  }
  return value;
}

function digest(value, label) {
  if (typeof value !== "string" || !SHA256.test(value)) fail(`${label} must be a lowercase SHA-256`);
  return value;
}

function gitIdentity(value, label) {
  if (typeof value !== "string" || !GIT_ID.test(value)) fail(`${label} must be a lowercase Git identity`);
  return value;
}

function slug(value, label) {
  if (typeof value !== "string" || !SLUG.test(value)) fail(`${label} must be a lowercase ASCII slug`);
  return value;

}

function target(value, label) {
  if (typeof value !== "string" || !TARGET.test(value)) fail(`${label} must be a supported target`);
  return value;
}

function positiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) fail(`${label} must be a positive integer`);
  return value;
}

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])]),
    );
  }
  return value;
}

function canonicalJson(document) {
  return `${JSON.stringify(canonicalValue(document), null, 2)}\n`;
}

function regularBytes(path, limit, label) {
  let metadata;
  try {
    metadata = lstatSync(path);
  } catch (error) {
    fail(`cannot inspect ${label} ${path}: ${error.message}`);
  }
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size <= 0 || metadata.size > limit) {
    fail(`${label} must be a bounded nonempty regular file`);
  }
  try {
    return readFileSync(path);
  } catch (error) {
    fail(`cannot read ${label} ${path}: ${error.message}`);
  }
}

function evidenceIdentity(value, label, targetRequired) {
  const keys = ["bytes", "schema", "sha256"];
  if (targetRequired) keys.push("target");
  const identity = exactKeys(value, keys, label);
  positiveInteger(identity.bytes, `${label}.bytes`);
  text(identity.schema, `${label}.schema`);
  digest(identity.sha256, `${label}.sha256`);
  if (targetRequired) target(identity.target, `${label}.target`);
  return identity;
}

function candidate(value) {
  const result = exactKeys(value, ["commit", "tree", "worktreeClean"], "candidate");
  gitIdentity(result.commit, "candidate.commit");
  gitIdentity(result.tree, "candidate.tree");
  if (result.worktreeClean !== true) fail("candidate must be a clean measured compiler tree");
  return result;
}

function sourceIsaV2Implementation(value, fixtureBytes, label) {
  const evidence = exactKeys(value, [
    "collectionBytes", "collectionSha256", "fixturePath", "schema", "status", "targetProfile",
  ], label);
  if (JSON.stringify(evidence) !== JSON.stringify(SOURCE_ISA_V2_IMPLEMENTATION)) {
    fail(`${label} does not bind the exact target-scoped protected-finalizer fixture`);
  }
  if (
    fixtureBytes.length !== evidence.collectionBytes ||
    createHash("sha256").update(fixtureBytes).digest("hex") !== evidence.collectionSha256
  ) {
    fail(`${label} fixture bytes differ from its admitted identity`);
  }
  return evidence;
}

function unavailableSourceIsaV2(value, label) {
  const evidence = exactKeys(value, [
    "collectionBytes", "collectionSha256", "inspectionStatus", "status",
  ], label);
  if (JSON.stringify(evidence) !== JSON.stringify(SOURCE_ISA_V2_UNAVAILABLE)) {
    fail(`${label} invents protected-finalizer Source/ISA V2 evidence`);
  }
  return evidence;
}

function manifestRequirements(manifest) {
  if (manifest.baseline.status !== "qualified") {
    fail("a tracked qualification record requires a qualified top-level baseline");
  }
  const fixtureById = manifest.fixtureById;
  const requirements = new Map(
    [...fixtureById.keys()].map((fixtureId) => [fixtureId, { hardware: false, reference: false, simulator: false }]),
  );
  for (const entry of manifest.entries) {
    for (const fixtureId of entry.compilerFixtureIds) {
      const gates = requirements.get(fixtureId);
      if (!gates) fail(`entry references unknown fixture ${fixtureId}`);
      gates.hardware ||= entry.requiredGates.includes("hardware");
      gates.reference ||= entry.requiredGates.includes("cpu-reference");
      gates.simulator ||= entry.requiredGates.includes("semantic-simulation");
    }
  }
  return requirements;
}

function validateDocument(document, manifest, manifestDigests, sourceIsaFixtureBytes) {
  const record = exactKeys(document, [
    "authority", "candidate", "contracts", "evidence", "fixtures", "measuredCorpus", "roadmapIssue", "schema",
    "sourceIsaCharacteristicV2",
  ], "record");
  if (record.schema !== RECORD_SCHEMA || record.roadmapIssue !== ROADMAP) fail("record schema or roadmap identity differs");
  const authority = exactKeys(record.authority, [
    "compilerAuthority", "hardwareAuthority", "launchAuthority", "loadAuthority", "publicationAuthority",
  ], "authority");
  if (Object.values(authority).some((value) => value !== false)) fail("record must grant no authority");
  const measuredCandidate = candidate(record.candidate);
  if (
    manifest.baseline.status === "qualified" &&
    (manifest.baseline.compilerCommit !== measuredCandidate.commit || manifest.baseline.compilerTree !== measuredCandidate.tree)
  ) {
    fail("publication pin differs from measured Candidate A");
  }
  const contracts = exactKeys(record.contracts, [
    "amdCostModelRevision", "amdPolicyVersion", "amdResourceModelRevision", "canonicalKirVersion",
    "finalOptimizedGraphVerification", "inspectionFormatVersion", "neutralPolicyVersion", "pipelineEntry",
    "targetReplayEvidenceVersion",
  ], "contracts");
  const expectedContracts = {
    amdCostModelRevision: 2,
    amdPolicyVersion: 2,
    amdResourceModelRevision: 3,
    canonicalKirVersion: 12,
    finalOptimizedGraphVerification: true,
    inspectionFormatVersion: 2,
    neutralPolicyVersion: 4,
    pipelineEntry: "rustc-codegen-fe2o3::production_pipeline",
    targetReplayEvidenceVersion: 9,
  };
  if (JSON.stringify(contracts) !== JSON.stringify(expectedContracts)) fail("record has a non-production compiler contract");
  sourceIsaV2Implementation(
    record.sourceIsaCharacteristicV2,
    sourceIsaFixtureBytes,
    "sourceIsaCharacteristicV2",
  );
  const corpus = exactKeys(record.measuredCorpus, [
    "corpusContractSha256", "manifestBytes", "manifestPath", "rawManifestSha256",
  ], "measuredCorpus");
  if (corpus.manifestPath !== "config/tutorial-kernel-manifest-v1.json") fail("record names the wrong manifest path");
  digest(corpus.rawManifestSha256, "measuredCorpus.rawManifestSha256");
  positiveInteger(corpus.manifestBytes, "measuredCorpus.manifestBytes");
  if (digest(corpus.corpusContractSha256, "measuredCorpus.corpusContractSha256") !== manifestDigests.corpusContractSha256) {
    fail("current stable corpus differs from measured Candidate A");
  }

  const evidence = exactKeys(record.evidence, ["baselineReports", "hardware", "semantic", "thresholds"], "evidence");
  const semanticEvidence = evidenceIdentity(evidence.semantic, "evidence.semantic", false);
  if (semanticEvidence.schema !== "fe2o3-tutorial-semantic-qualification-evidence-v1") {
    fail("record references an unsupported semantic evidence contract");
  }
  const baselines = boundedArray(evidence.baselineReports, MAX_TARGETS, "evidence.baselineReports", true)
    .map((item, index) => evidenceIdentity(item, `evidence.baselineReports[${index}]`, true));
  const hardwareRecords = boundedArray(evidence.hardware, MAX_TARGETS, "evidence.hardware")
    .map((item, index) => evidenceIdentity(item, `evidence.hardware[${index}]`, true));
  const thresholds = boundedArray(evidence.thresholds, MAX_TARGETS, "evidence.thresholds", true)
    .map((item, index) => {
      const label = `evidence.thresholds[${index}]`;
      const threshold = exactKeys(item, [
        "baselineReportSha256", "bytes", "schema", "selfGate", "sha256", "target",
      ], label);
      evidenceIdentity({
        bytes: threshold.bytes,
        schema: threshold.schema,
        sha256: threshold.sha256,
        target: threshold.target,
      }, label, true);
      digest(threshold.baselineReportSha256, `${label}.baselineReportSha256`);
      if (
        threshold.schema !== "fe2o3-tutorial-compiler-no-regression-thresholds-v1" ||
        threshold.selfGate !== "passed"
      ) fail(`${label} lacks the exact self-gated threshold contract`);
      return threshold;
    });
  for (const [label, values] of [["baseline", baselines], ["hardware", hardwareRecords], ["threshold", thresholds]]) {
    const targets = values.map((item) => item.target);
    if (new Set(targets).size !== targets.length || JSON.stringify(targets) !== JSON.stringify([...targets].sort())) {
      fail(`${label} evidence targets must be sorted and unique`);
    }
  }
  for (const baseline of baselines) {
    if (baseline.schema !== "fe2o3-tutorial-compiler-baseline-report-v1") fail(`${baseline.target} baseline schema differs`);
  }
  for (const hardware of hardwareRecords) {
    if (hardware.schema !== `fe2o3-tutorial-${hardware.target}-hardware-evidence-v1`) fail(`${hardware.target} hardware schema differs`);
  }
  const baselineByTarget = new Map(baselines.map((item) => [item.target, item.sha256]));
  const thresholdByTarget = new Map(thresholds.map((item) => [item.target, item]));
  if (JSON.stringify([...thresholdByTarget.keys()]) !== JSON.stringify([...baselineByTarget.keys()])) {
    fail("threshold evidence target coverage differs from baseline evidence");
  }
  for (const [targetName, baselineSha256] of baselineByTarget) {
    if (thresholdByTarget.get(targetName).baselineReportSha256 !== baselineSha256) {
      fail(`${targetName} threshold evidence does not join its baseline report`);
    }
  }
  const hardwareByTarget = new Map(hardwareRecords.map((item) => [item.target, item.sha256]));
  const requirements = manifestRequirements(manifest);
  const fixtures = boundedArray(record.fixtures, MAX_FIXTURES, "fixtures", true);
  const fixtureIds = [];
  const hardwareTargetsUsed = new Set();
  for (const [index, rawFixture] of fixtures.entries()) {
    const label = `fixtures[${index}]`;
    const fixture = exactKeys(rawFixture, ["fixtureId", "hardware", "productionCompile", "semantic", "target", "testId"], label);
    const fixtureId = slug(fixture.fixtureId, `${label}.fixtureId`);
    fixtureIds.push(fixtureId);
    const expectedFixture = manifest.fixtureById.get(fixtureId);
    if (!expectedFixture || expectedFixture.target !== fixture.target || expectedFixture.testId !== fixture.testId) {
      fail(`${label} does not resolve the exact manifest fixture`);
    }
    target(fixture.target, `${label}.target`);
    text(fixture.testId, `${label}.testId`);
    if (!baselineByTarget.has(fixture.target)) fail(`${label} lacks target baseline evidence`);
    const production = exactKeys(fixture.productionCompile, [
      "finalTargetKirSha256", "finalVerifiedKirSha256", "inspectionRecordSha256", "sourceIsaCharacteristicV2", "status",
    ], `${label}.productionCompile`);
    if (production.status !== "passed") fail(`${label} production compile did not pass`);
    for (const field of ["finalTargetKirSha256", "finalVerifiedKirSha256", "inspectionRecordSha256"]) {
      digest(production[field], `${label}.productionCompile.${field}`);
    }
    unavailableSourceIsaV2(
      production.sourceIsaCharacteristicV2,
      `${label}.productionCompile.sourceIsaCharacteristicV2`,
    );
    const semantic = exactKeys(fixture.semantic, [
      "evidenceSha256", "reference", "referenceSuiteIds", "simulator", "simulatorSuiteIds",
    ], `${label}.semantic`);
    if (semantic.evidenceSha256 !== semanticEvidence.sha256) fail(`${label} has a forged semantic evidence join`);
    const required = requirements.get(fixtureId);
    for (const gate of ["reference", "simulator"]) {
      if (!new Set(["not-required", "passed"]).has(semantic[gate])) fail(`${label} has an invalid ${gate} status`);
      const suiteIds = boundedArray(semantic[`${gate}SuiteIds`], MAX_SUITES, `${label}.${gate}SuiteIds`);
      for (const suiteId of suiteIds) slug(suiteId, `${label}.${gate}SuiteIds`);
      if (new Set(suiteIds).size !== suiteIds.length || (semantic[gate] === "passed") !== (suiteIds.length > 0)) {
        fail(`${label} has an inconsistent ${gate} suite binding`);
      }
      if (required[gate] && semantic[gate] !== "passed") fail(`${label} is missing required ${gate} evidence`);
    }
    const hardware = exactKeys(fixture.hardware, [
      "caseId", "compilerInspectionSha256", "evidenceSha256", "hostLogSha256", "hsacoSha256",
      "llvmIrSha256", "required", "status",
    ], `${label}.hardware`);
    const hardwareFields = [
      "caseId", "compilerInspectionSha256", "evidenceSha256", "hostLogSha256", "hsacoSha256", "llvmIrSha256",
    ];
    if (hardware.required === false && hardware.status === "not-required") {
      if (hardwareFields.some((field) => hardware[field] !== null)) fail(`${label} invents non-required hardware evidence`);
    } else if (hardware.required === true && hardware.status === "passed") {
      slug(hardware.caseId, `${label}.hardware.caseId`);
      for (const field of hardwareFields.slice(1)) digest(hardware[field], `${label}.hardware.${field}`);
      if (hardware.evidenceSha256 !== hardwareByTarget.get(fixture.target)) fail(`${label} has a forged hardware evidence join`);
      if (hardware.compilerInspectionSha256 !== production.inspectionRecordSha256) fail(`${label} inspection identities disagree`);
      hardwareTargetsUsed.add(fixture.target);
    } else {
      fail(`${label} hardware requirement and status disagree`);
    }
    if (hardware.required !== required.hardware) fail(`${label} hardware requirement differs from the manifest`);
  }
  if (fixtureIds.length !== requirements.size || new Set(fixtureIds).size !== fixtureIds.length || JSON.stringify(fixtureIds) !== JSON.stringify([...fixtureIds].sort())) {
    fail("record fixture coverage must be exact, sorted, and unique");
  }
  if (fixtureIds.some((fixtureId) => !requirements.has(fixtureId))) fail("record contains an unknown fixture");
  const expectedTargets = [...new Set([...requirements.keys()].map((fixtureId) => manifest.fixtureById.get(fixtureId).target))].sort();
  if (JSON.stringify([...baselineByTarget.keys()]) !== JSON.stringify(expectedTargets)) fail("baseline target coverage differs from the manifest");
  if (JSON.stringify([...hardwareByTarget.keys()]) !== JSON.stringify([...hardwareTargetsUsed].sort())) fail("hardware target evidence is stale or missing");
  return record;
}

export function validateQualificationRecord({
  recordPath,
  digestPath,
  manifest,
  manifestDigests,
  sourceIsaFixturePath,
}) {
  const sourceIsaFixtureBytes = regularBytes(
    sourceIsaFixturePath,
    8192,
    "Source/ISA V2 implementation fixture",
  );
  const bytes = regularBytes(recordPath, MAX_RECORD_BYTES, "qualification record");
  let document;
  try {
    document = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    fail(`cannot decode qualification record: ${error.message}`);
  }
  if (bytes.toString("utf8") !== canonicalJson(document)) fail("qualification record bytes are not canonical");
  const digestBytes = regularBytes(digestPath, 4096, "qualification record digest");
  let digestText;
  try {
    digestText = digestBytes.toString("ascii").trimEnd();
  } catch (error) {
    fail(`cannot decode qualification record digest: ${error.message}`);
  }
  const parts = digestText.split("  ");
  if (parts.length !== 2 || !SHA256.test(parts[0]) || parts[1] !== basename(recordPath)) {
    fail("qualification record digest is malformed or names a different record");
  }
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== parts[0]) fail("qualification record digest does not match its bytes");
  return validateDocument(document, manifest, manifestDigests, sourceIsaFixtureBytes);
}
