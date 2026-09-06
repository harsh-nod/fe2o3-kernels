#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { tutorialCorpusContractSha256 } from "./tutorial-corpus-contract.mjs";
import { validateQualificationRecord } from "./tutorial-qualification-record.mjs";

const TOP_LEVEL_KEYS = [
  "baseline",
  "compilerFixtures",
  "entries",
  "productionContract",
  "qualification",
  "roadmapIssue",
  "schema",
];
const ENTRY_KEYS = [
  "classification",
  "compilerFixtureIds",
  "lessonId",
  "packageManifest",
  "requiredGates",
  "siteEvidenceKind",
  "sourcePaths",
];
const FIXTURE_KEYS = ["compilerInput", "fixtureId", "matrix", "target", "testId", "testPath"];
const COMPILER_INPUT_KEYS = [
  "cargoLockPath",
  "cargoLockSha256",
  "cargoTarget",
  "contractSha256",
  "defaultFeatures",
  "features",
  "kernelSymbols",
  "packageManifest",
  "packageManifestSha256",
  "sourceClosureSha256",
  "sourcePaths",
];
const CARGO_TARGET_KEYS = ["kind", "name", "sourcePath"];
const MATRIX_KEYS = [
  "artifactName",
  "caseId",
  "environment",
  "runnerArguments",
  "runnerPath",
];
const COMPILER_EVIDENCE = new Set([
  "compiler-checked",
  "compiler-hsaco-observed",
  "gpu-observed",
  "runnable-now",
]);
const ALLOWED_EVIDENCE = new Set([
  ...COMPILER_EVIDENCE,
  "design-only",
  "source-example",
  "source-model-verified",
  "source-tested",
]);
const ALLOWED_CLASSIFICATIONS = new Set([
  "compiler-produced",
  "design-only",
  "external-baseline",
  "simulator-only",
]);
const ALLOWED_GATES = new Set([
  "cpu-reference",
  "hardware",
  "production-compile",
  "semantic-simulation",
]);
const SIDECAR_SUFFIX = ".ll.fe2o3-compiler-inspection-v2";
const SIDECAR_MAGIC = Buffer.from("F2KIRP02", "ascii");
const SHA256 = /^[0-9a-f]{64}$/u;
const GIT_ID = /^[0-9a-f]{40}$/u;
const TARGET = /^gfx[0-9]{3}$/u;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const RUST_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/u;
const FIXTURE_INPUT_DIGEST_DOMAIN = Buffer.from(
  "fe2o3-tutorial-fixture-compiler-input-v1\0",
  "ascii",
);
const MAX_SIDECAR_BYTES = 3 * 16 * 1024 * 1024 + 256 * 1024;
const SHARED_SCHEMA_SHA256 = new Map([
  ["tutorial-compiler-baseline-report-schema-v1.json", "a2704e6a7b843b4f11e1e27ea6095d8aaeb55853809c5f3a57e5b3be759b42d1"],
  ["tutorial-compiler-no-regression-threshold-schema-v1.json", "dc4b321174fdbed4be2dddea6392b7a6d46ca61745621f127322eaf204f4bb6e"],
  ["tutorial-gfx942-hardware-evidence-schema-v1.json", "4ab38389760f904b1782a54aed9960c7e174039b192590c042968aafaaed1346"],
  ["tutorial-compiler-qualification-record-schema-v1.json", "ab8797566eeb11fd7d12b01e84e7ea1f6e878c51d7dbd6856dd7e8c0deb95317"],
]);
const SOURCE_ISA_V2_FIXTURE_PATH = "crates/fe2o3-hsaco-finalize/tests/fixtures/production-v12-source-isa-characteristic-v2.json";
const SOURCE_ISA_V2_IMPLEMENTATION = {
  collectionBytes: 4797,
  collectionSha256: "0a5627abbf4550e209adb923f873caa68065237e21ee5219fba9272647891072",
  fixturePath: SOURCE_ISA_V2_FIXTURE_PATH,
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
  throw new Error(`tutorial compiler corpus: ${message}`);
}

function exactKeys(value, expected, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    fail(`${label} keys differ: got ${actual.join(", ")}`);
  }
  return value;
}

function string(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    fail(`${label} must be a nonempty string`);
  }
  return value;
}

function stringArray(value, label, { nonempty = false } = {}) {
  if (!Array.isArray(value) || (nonempty && value.length === 0)) {
    fail(`${label} must be ${nonempty ? "a nonempty" : "an"} array`);
  }
  const result = value.map((item, index) => string(item, `${label}[${index}]`));
  if (new Set(result).size !== result.length) {
    fail(`${label} must be duplicate-free`);
  }
  return result;
}

function canonicalPath(value, label) {
  const path = string(value, label);
  if (
    path.includes("\\") ||
    path.startsWith("/") ||
    path.split("/").includes("..") ||
    path.split("/").includes(".")
  ) {
    fail(`${label} must be a canonical repository-relative path`);
  }
  return path;
}

function parseJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`cannot read ${label} ${path}: ${error.message}`);
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function exactSourceIsaV2(value, expected, label) {
  const record = exactKeys(value, Object.keys(expected), label);
  if (Object.entries(expected).some(([key, expectedValue]) => record[key] !== expectedValue)) {
    fail(`${label} differs from the exact Source/ISA V2 evidence contract`);
  }
  return record;
}

function validateSourceIsaFixture(path) {
  let metadata;
  try { metadata = lstatSync(path); } catch (error) { fail(`cannot inspect Source/ISA V2 fixture: ${error.message}`); }
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size !== SOURCE_ISA_V2_IMPLEMENTATION.collectionBytes) {
    fail("Source/ISA V2 fixture must be the exact bounded regular compiler fixture");
  }
  const bytes = readFileSync(path);
  if (sha256(bytes) !== SOURCE_ISA_V2_IMPLEMENTATION.collectionSha256) {
    fail("Source/ISA V2 fixture digest differs from the compiler contract");
  }
  return bytes;
}

function integerAtLeast(value, minimum, label) {
  if (!Number.isSafeInteger(value) || value < minimum) {
    fail(`${label} must be an integer of at least ${minimum}`);
  }
  return value;
}

function canonicalDigestValue(value) {
  if (Array.isArray(value)) return value.map(canonicalDigestValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalDigestValue(value[key])]),
    );
  }
  return value;
}

function validateCompilerInput(fixture, label) {
  const input = exactKeys(fixture.compilerInput, COMPILER_INPUT_KEYS, `${label}.compilerInput`);
  const packageManifest = canonicalPath(input.packageManifest, `${label}.compilerInput.packageManifest`);
  if (!packageManifest.endsWith("/Cargo.toml")) {
    fail(`${label}.compilerInput.packageManifest must name a Cargo.toml`);
  }
  const sourcePaths = stringArray(input.sourcePaths, `${label}.compilerInput.sourcePaths`, { nonempty: true });
  for (const [index, path] of sourcePaths.entries()) {
    canonicalPath(path, `${label}.compilerInput.sourcePaths[${index}]`);
  }
  canonicalPath(input.cargoLockPath, `${label}.compilerInput.cargoLockPath`);
  for (const field of [
    "cargoLockSha256",
    "contractSha256",
    "packageManifestSha256",
    "sourceClosureSha256",
  ]) {
    if (!SHA256.test(input[field])) fail(`${label}.compilerInput.${field} must be a lowercase SHA-256`);
  }
  const cargoTarget = exactKeys(input.cargoTarget, CARGO_TARGET_KEYS, `${label}.compilerInput.cargoTarget`);
  if (cargoTarget.kind !== "lib") fail(`${label}.compilerInput.cargoTarget.kind must be lib`);
  if (!RUST_IDENTIFIER.test(string(cargoTarget.name, `${label}.compilerInput.cargoTarget.name`))) {
    fail(`${label}.compilerInput.cargoTarget.name must be a Rust identifier`);
  }
  canonicalPath(cargoTarget.sourcePath, `${label}.compilerInput.cargoTarget.sourcePath`);
  if (typeof input.defaultFeatures !== "boolean") {
    fail(`${label}.compilerInput.defaultFeatures must be boolean`);
  }
  const features = stringArray(input.features, `${label}.compilerInput.features`);
  if (JSON.stringify(features) !== JSON.stringify([...features].sort())) {
    fail(`${label}.compilerInput.features must be sorted`);
  }
  const symbols = stringArray(input.kernelSymbols, `${label}.compilerInput.kernelSymbols`, { nonempty: true });
  if (
    JSON.stringify(symbols) !== JSON.stringify([...symbols].sort()) ||
    symbols.some((symbol) => !RUST_IDENTIFIER.test(symbol))
  ) {
    fail(`${label}.compilerInput.kernelSymbols must be sorted Rust identifiers`);
  }
  const contract = {
    fixtureId: fixture.fixtureId,
    target: fixture.target,
    matrix: fixture.matrix,
    compilerInput: Object.fromEntries(
      Object.entries(input).filter(([key]) => key !== "contractSha256"),
    ),
  };
  const observed = createHash("sha256")
    .update(FIXTURE_INPUT_DIGEST_DOMAIN)
    .update(JSON.stringify(canonicalDigestValue(contract)), "ascii")
    .digest("hex");
  if (input.contractSha256 !== observed) {
    fail(`${label}.compilerInput.contractSha256 is stale`);
  }
}

function validateFixture(rawFixture, index, fixtureById, testIds, matrixCases) {
  const label = `compilerFixtures[${index}]`;
  const fixture = exactKeys(rawFixture, FIXTURE_KEYS, label);
  const fixtureId = string(fixture.fixtureId, `${label}.fixtureId`);
  if (!SLUG.test(fixtureId)) fail(`${label}.fixtureId must be a lowercase ASCII slug`);
  if (fixtureById.has(fixtureId)) fail(`duplicate fixtureId: ${fixtureId}`);

  const testId = string(fixture.testId, `${label}.testId`);
  if (/[|\r\n]/u.test(testId)) fail(`${label}.testId contains a record delimiter`);
  if (testIds.has(testId)) fail(`duplicate testId: ${testId}`);
  testIds.add(testId);

  const target = string(fixture.target, `${label}.target`);
  if (!TARGET.test(target)) fail(`${label}.target is unsupported: ${target}`);
  const testPath = canonicalPath(fixture.testPath, `${label}.testPath`);
  validateCompilerInput(fixture, label);

  if (fixture.matrix === null) {
    if (!testId.startsWith("compiler-test/")) {
      fail(`${label}.testId must identify a compiler-test`);
    }
  } else {
    const matrix = exactKeys(fixture.matrix, MATRIX_KEYS, `${label}.matrix`);
    const caseId = string(matrix.caseId, `${label}.matrix.caseId`);
    if (!SLUG.test(caseId)) fail(`${label}.matrix.caseId must be a lowercase ASCII slug`);
    const matrixKey = `${target}/${caseId}`;
    if (matrixCases.has(matrixKey)) fail(`duplicate matrix case: ${matrixKey}`);
    matrixCases.add(matrixKey);
    if (testId !== `kernel-compile-matrix/${matrixKey}`) {
      fail(`${label}.testId does not match its target and caseId`);
    }
    if (testPath !== "scripts/tests/kernel-compile-matrix.sh") {
      fail(`${label}.testPath must name the compiler compile-matrix test`);
    }
    const runnerPath = canonicalPath(matrix.runnerPath, `${label}.matrix.runnerPath`);
    if (!runnerPath.startsWith("examples/") || !runnerPath.endsWith(".sh")) {
      fail(`${label}.matrix.runnerPath must name an example shell runner`);
    }
    const artifactName = string(matrix.artifactName, `${label}.matrix.artifactName`);
    if (artifactName.includes("/") || !artifactName.endsWith(".hsaco")) {
      fail(`${label}.matrix.artifactName must be an HSACO basename`);
    }
    const arguments_ = stringArray(matrix.runnerArguments, `${label}.matrix.runnerArguments`);
    const environment = stringArray(matrix.environment, `${label}.matrix.environment`);
    if (arguments_.length > 1 || environment.length > 1) {
      fail(`${label}.matrix exceeds the v1 argument/environment bounds`);
    }
    for (const value of [...arguments_, ...environment]) {
      if (/[|\r\n]/u.test(value)) fail(`${label}.matrix contains a record delimiter`);
    }
    for (const assignment of environment) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*=.+$/u.test(assignment)) {
        fail(`${label}.matrix.environment contains an invalid assignment`);
      }
    }
  }
  fixtureById.set(fixtureId, fixture);
  return fixtureId;
}

function validateEntry(rawEntry, index, fixtureById, referencedFixtures) {
  const label = `entries[${index}]`;
  const entry = exactKeys(rawEntry, ENTRY_KEYS, label);
  const lessonId = string(entry.lessonId, `${label}.lessonId`);
  const evidence = string(entry.siteEvidenceKind, `${label}.siteEvidenceKind`);
  const classification = string(entry.classification, `${label}.classification`);
  if (!ALLOWED_EVIDENCE.has(evidence)) fail(`${lessonId} has unsupported evidence ${evidence}`);
  if (!ALLOWED_CLASSIFICATIONS.has(classification)) {
    fail(`${lessonId} has unsupported classification ${classification}`);
  }
  if (COMPILER_EVIDENCE.has(evidence) && classification !== "compiler-produced") {
    fail(`${lessonId} cannot downgrade ${evidence} out of compiler coverage`);
  }
  const packageManifest = canonicalPath(entry.packageManifest, `${label}.packageManifest`);
  if (!/^examples\/[^/]+\/Cargo\.toml$/u.test(packageManifest)) {
    fail(`${label}.packageManifest must name an example Cargo.toml`);
  }
  const sourcePaths = stringArray(entry.sourcePaths, `${label}.sourcePaths`, { nonempty: true });
  for (const [sourceIndex, sourcePath] of sourcePaths.entries()) {
    const path = canonicalPath(sourcePath, `${label}.sourcePaths[${sourceIndex}]`);
    if (!/^examples\/[^/]+\/src\/.+\.rs$/u.test(path)) {
      fail(`${label}.sourcePaths must name Rust example sources`);
    }
  }

  const fixtureIds = stringArray(entry.compilerFixtureIds, `${label}.compilerFixtureIds`);
  if (classification === "compiler-produced" && fixtureIds.length === 0) {
    fail(`${lessonId} must resolve at least one compiler fixture`);
  }
  if (classification !== "compiler-produced" && fixtureIds.length !== 0) {
    fail(`${lessonId} cannot claim compiler fixtures outside compiler coverage`);
  }
  for (const fixtureId of fixtureIds) {
    if (!fixtureById.has(fixtureId)) {
      fail(`${lessonId} references non-resolving fixture ID ${fixtureId}`);
    }
    referencedFixtures.add(fixtureId);
  }

  const gates = stringArray(entry.requiredGates, `${label}.requiredGates`, { nonempty: true });
  if (gates.some((gate) => !ALLOWED_GATES.has(gate))) {
    fail(`${lessonId} contains an unsupported qualification gate`);
  }
  if (classification === "compiler-produced" && !gates.includes("production-compile")) {
    fail(`${lessonId} must require production-compile`);
  }
  if (classification !== "compiler-produced" && gates.includes("production-compile")) {
    fail(`${lessonId} cannot require production-compile outside compiler coverage`);
  }
  if (gates.includes("hardware") && fixtureIds.length === 0) {
    fail(`${lessonId} cannot require hardware without an exact compiler target`);
  }
  return entry;
}

function validateManifest(document) {
  const root = exactKeys(document, TOP_LEVEL_KEYS, "root");
  if (root.schema !== "fe2o3-tutorial-kernel-manifest-v1") fail("unsupported schema");
  if (root.roadmapIssue !== "https://github.com/harsh-nod/fe2o3/issues/271") {
    fail("roadmapIssue must bind issue #271");
  }
  const baseline = exactKeys(root.baseline, ["compilerCommit", "compilerTree", "status"], "baseline");
  if (!GIT_ID.test(baseline.compilerCommit) || !GIT_ID.test(baseline.compilerTree)) {
    fail("baseline compiler commit and tree must be lowercase Git identities");
  }
  if (!new Set(["migration", "qualified"]).has(baseline.status)) {
    fail("baseline.status must be migration or qualified");
  }
  const contract = exactKeys(root.productionContract, [
    "allowsFallback",
    "allowsPipelineSelection",
    "pipelineEntry",
    "requiredPolicyVersion",
    "requiresFinalOptimizedGraphVerification",
  ], "productionContract");
  if (contract.pipelineEntry !== "rustc-codegen-fe2o3::production_pipeline") {
    fail("productionContract must name the sole production pipeline");
  }
  if (contract.requiredPolicyVersion !== 4) fail("production policy must be exact V4");
  if (contract.requiresFinalOptimizedGraphVerification !== true) {
    fail("final optimized graph verification is mandatory");
  }
  if (contract.allowsPipelineSelection !== false || contract.allowsFallback !== false) {
    fail("pipeline selection and fallback must remain forbidden");
  }

  if (!Array.isArray(root.compilerFixtures) || root.compilerFixtures.length === 0) {
    fail("compilerFixtures must be a nonempty array");
  }
  const fixtureById = new Map();
  const testIds = new Set();
  const matrixCases = new Set();
  const fixtureIds = root.compilerFixtures.map((fixture, index) =>
    validateFixture(fixture, index, fixtureById, testIds, matrixCases));
  if (JSON.stringify(fixtureIds) !== JSON.stringify([...fixtureIds].sort())) {
    fail("compilerFixtures must be sorted by fixtureId");
  }

  if (!Array.isArray(root.entries) || root.entries.length === 0) {
    fail("entries must be a nonempty array");
  }
  const referencedFixtures = new Set();
  const entries = root.entries.map((entry, index) =>
    validateEntry(entry, index, fixtureById, referencedFixtures));
  const lessonIds = entries.map((entry) => entry.lessonId);
  if (new Set(lessonIds).size !== lessonIds.length) fail("entries contain duplicate lessonId values");
  if (JSON.stringify(lessonIds) !== JSON.stringify([...lessonIds].sort())) {
    fail("entries must be sorted by lessonId");
  }
  const staleFixtures = fixtureIds.filter((fixtureId) => !referencedFixtures.has(fixtureId));
  if (staleFixtures.length !== 0) fail(`stale compiler fixture IDs: ${staleFixtures.join(", ")}`);
  return { baseline, contract, entries, fixtureById };
}

function validateDigest(manifestPath, digestPath, manifestBytes, manifestDocument, repositoryRoot) {
  const [expected, recordedPath, ...extra] = readFileSync(digestPath, "ascii").trimEnd().split("  ");
  if (extra.length !== 0 || !SHA256.test(expected)) fail("manifest digest record is malformed");
  const expectedPath = relative(repositoryRoot, manifestPath).replaceAll("\\", "/");
  if (recordedPath !== expectedPath) fail("manifest digest record names the wrong path");
  const actual = sha256(manifestBytes);
  if (actual !== expected) fail(`manifest digest mismatch: expected ${expected}, got ${actual}`);
  let corpusContractSha256;
  try {
    corpusContractSha256 = tutorialCorpusContractSha256(manifestDocument);
  } catch (error) {
    fail(`cannot compute stable corpus contract: ${error.message}`);
  }
  return { rawSha256: actual, corpusContractSha256 };
}

function gitBytes(repository, arguments_, label) {
  const result = spawnSync("git", ["-C", repository, ...arguments_], {
    encoding: null,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    fail(`cannot resolve ${label} from compiler repository`);
  }
  return result.stdout;
}

function validateCompilerManifestParity(repositoryPath, manifestBytes, digestBytes, baseline) {
  const repository = resolve(repositoryPath);
  let metadata;
  try {
    metadata = lstatSync(repository);
  } catch (error) {
    fail(`cannot inspect compiler repository ${repository}: ${error.message}`);
  }
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    fail("compiler repository must be a real directory");
  }
  const head = gitBytes(repository, ["rev-parse", "--verify", "HEAD"], "compiler HEAD")
    .toString("ascii").trimEnd();
  if (!GIT_ID.test(head)) fail("compiler repository HEAD is malformed");
  for (const [path, expected] of [
    ["config/tutorial-kernel-manifest-v1.json", manifestBytes],
    ["config/tutorial-kernel-manifest-v1.sha256", digestBytes],
  ]) {
    const observed = gitBytes(repository, ["show", `${head}:${path}`], path);
    if (!observed.equals(expected)) {
      fail(`site ${path} differs byte-for-byte from compiler ${head}:${path}`);
    }
  }
  const measuredTree = gitBytes(
    repository,
    ["show", "-s", "--format=%T", baseline.compilerCommit],
    "measured compiler tree",
  ).toString("ascii").trimEnd();
  if (measuredTree !== baseline.compilerTree) {
    fail("top-level baseline compiler tree differs from its compiler commit");
  }
  const ancestry = spawnSync(
    "git",
    ["-C", repository, "merge-base", "--is-ancestor", baseline.compilerCommit, head],
    { encoding: "utf8" },
  );
  if (ancestry.error || ancestry.status !== 0) {
    fail("compiler repository HEAD does not contain the measured baseline commit");
  }
}

function validateSharedSchema(path, expectedName) {
  let bytes;
  try {
    bytes = readFileSync(path);
    JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    fail(`cannot read shared schema ${path}: ${error.message}`);
  }
  const expected = SHARED_SCHEMA_SHA256.get(expectedName);
  if (!expected || sha256(bytes) !== expected) {
    fail(`${expectedName} differs from the compiler M9 contract`);
  }
}

function validateResourceEstimateV3(resource, granules, label) {
  const fields = [
    "livenessValues", "livenessWorkUnits", "peakLiveVgprDwordsPerLane", "peakLiveVgprFunction",
    "peakLiveSgprDwordsPerWave", "peakLiveSgprFunction", "allocatedVgprDwordsPerLane",
    "allocatedSgprDwordsPerWave", "requiredVgprSpillDwordsPerLane",
    "requiredSgprSpillDwordsPerWave", "vgprLimitedWavesPerExecutionUnit",
    "sgprLimitedWavesPerExecutionUnit", "ldsLimitedWavesPerExecutionUnit",
    "estimatedWavesPerExecutionUnit", "occupancyComplete", "spillAdmissible",
  ];
  exactKeys(resource, fields, label);
  for (const field of fields.slice(0, 10)) integerAtLeast(resource[field], 0, `${label}.${field}`);
  for (const field of ["vgprLimitedWavesPerExecutionUnit", "sgprLimitedWavesPerExecutionUnit", "estimatedWavesPerExecutionUnit"]) {
    integerAtLeast(resource[field], 1, `${label}.${field}`);
  }
  if (resource.ldsLimitedWavesPerExecutionUnit !== null) {
    integerAtLeast(resource.ldsLimitedWavesPerExecutionUnit, 1, `${label}.ldsLimitedWavesPerExecutionUnit`);
  }
  if (
    resource.allocatedVgprDwordsPerLane < resource.peakLiveVgprDwordsPerLane ||
    resource.allocatedVgprDwordsPerLane % granules.vgpr !== 0 ||
    resource.allocatedSgprDwordsPerWave < resource.peakLiveSgprDwordsPerWave ||
    resource.allocatedSgprDwordsPerWave % granules.sgpr !== 0
  ) fail(`${label} has an invalid register allocation`);
  const occupancyComplete = resource.ldsLimitedWavesPerExecutionUnit !== null;
  if (resource.occupancyComplete !== occupancyComplete) fail(`${label} does not represent dynamic LDS conservatively`);
  const limits = [resource.vgprLimitedWavesPerExecutionUnit, resource.sgprLimitedWavesPerExecutionUnit];
  if (occupancyComplete) limits.push(resource.ldsLimitedWavesPerExecutionUnit);
  if (resource.estimatedWavesPerExecutionUnit !== Math.min(...limits)) fail(`${label} has an invalid occupancy estimate`);
  const spillAdmissible = resource.requiredVgprSpillDwordsPerLane === 0 && resource.requiredSgprSpillDwordsPerWave === 0;
  if (resource.spillAdmissible !== spillAdmissible) fail(`${label} has an invalid spill admission result`);
  return resource;
}

function validateReport(path, manifestDigests, manifest) {
  const report = exactKeys(parseJson(path, "baseline report"), [
    "cases", "compiler", "manifest", "measurement", "pipelineContract", "schema", "sourceIsaCharacteristicV2",
  ], `baseline report ${path}`);
  if (report.schema !== "fe2o3-tutorial-compiler-baseline-report-v1") fail(`${path} has unsupported report schema`);
  const binding = exactKeys(report.manifest, ["path", "sha256", "corpusContractSha256"], `${path}.manifest`);
  if (
    binding.path !== "config/tutorial-kernel-manifest-v1.json" ||
    binding.sha256 !== manifestDigests.rawSha256 ||
    binding.corpusContractSha256 !== manifestDigests.corpusContractSha256
  ) {
    fail(`${path} does not bind the exact tutorial manifest`);
  }
  const compiler = exactKeys(report.compiler, ["commit", "tree", "worktreeClean"], `${path}.compiler`);
  if (!GIT_ID.test(compiler.commit) || !GIT_ID.test(compiler.tree) || compiler.worktreeClean !== true) {
    fail(`${path} does not identify a clean exact compiler tree`);
  }
  const measurement = exactKeys(report.measurement, ["command", "durationClock", "measuredAtUtc", "target", "toolchain"], `${path}.measurement`);
  if (!TARGET.test(measurement.target) || measurement.durationClock !== "CLOCK_MONOTONIC") {
    fail(`${path} has an invalid measurement contract`);
  }
  string(measurement.command, `${path}.measurement.command`);
  string(measurement.toolchain, `${path}.measurement.toolchain`);
  if (Number.isNaN(Date.parse(measurement.measuredAtUtc))) fail(`${path} has an invalid measuredAtUtc`);
  const pipeline = exactKeys(report.pipelineContract, [
    "entry", "requiredPolicyVersion", "requiredCanonicalKirVersion", "requiredAmdPolicyVersion",
    "requiredAmdCostModelRevision", "requiredAmdResourceModelRevision",
    "requiresFinalOptimizedGraphVerification",
  ], `${path}.pipelineContract`);
  if (
    pipeline.entry !== manifest.contract.pipelineEntry ||
    pipeline.requiredPolicyVersion !== 4 ||
    pipeline.requiredCanonicalKirVersion !== 12 ||
    pipeline.requiredAmdPolicyVersion !== 2 ||
    pipeline.requiredAmdCostModelRevision !== 2 ||
    pipeline.requiredAmdResourceModelRevision !== 3 ||
    pipeline.requiresFinalOptimizedGraphVerification !== true
  ) fail(`${path} does not bind the exact production V4/AMD V2/resource V3 pipeline contract`);
  exactSourceIsaV2(
    report.sourceIsaCharacteristicV2,
    SOURCE_ISA_V2_IMPLEMENTATION,
    `${path}.sourceIsaCharacteristicV2`,
  );
  if (!Array.isArray(report.cases) || report.cases.length === 0) fail(`${path}.cases must be nonempty`);
  const cases = new Map();
  for (const [index, rawCase] of report.cases.entries()) {
    const label = `${path}.cases[${index}]`;
    const item = exactKeys(rawCase, [
      "artifactResources", "compilerMetrics", "compileTimeNanoseconds", "familyIds", "fixtureId", "irSizes", "pipelineOutcome", "runtimeMetrics", "semanticOutcome", "target", "testId",
    ], label);
    const fixture = manifest.fixtureById.get(item.fixtureId);
    if (!fixture || fixture.testId !== item.testId || fixture.target !== item.target || item.target !== measurement.target) {
      fail(`${label} does not resolve its exact manifest fixture`);
    }
    if (cases.has(item.fixtureId)) fail(`${path} contains duplicate case ${item.fixtureId}`);
    integerAtLeast(item.compileTimeNanoseconds, 0, `${label}.compileTimeNanoseconds`);
    const familyIds = stringArray(item.familyIds, `${label}.familyIds`, { nonempty: true });
    const expectedFamilies = manifest.entries
      .filter((entry) => entry.compilerFixtureIds.includes(item.fixtureId))
      .map((entry) => entry.lessonId)
      .sort();
    if (JSON.stringify(familyIds) !== JSON.stringify(expectedFamilies)) {
      fail(`${label}.familyIds do not match the manifest lesson owners`);
    }
    const sizes = exactKeys(item.irSizes, ["canonicalKirBytes", "hsacoBytes", "inputNeutralKirBytes", "llvmIrBytes", "llvmIrFileCount", "optimizedNeutralKirBytes"], `${label}.irSizes`);
    if (![sizes.inputNeutralKirBytes, sizes.optimizedNeutralKirBytes, sizes.canonicalKirBytes, sizes.hsacoBytes, sizes.llvmIrBytes].every((value) => Number.isSafeInteger(value) && value > 0) || sizes.llvmIrFileCount !== 1) {
      fail(`${label} has invalid measured IR sizes`);
    }
    const outcome = exactKeys(item.pipelineOutcome, [
      "amdCostModelRevisionObserved", "amdPolicyVersionObserved", "amdResourceModelRevisionObserved",
      "canonicalKirVersionObserved", "compileOnly", "finalOptimizedGraphVerificationObserved",
      "finalTargetKirSha256", "finalVerifiedKirSha256", "inspectionRecordSha256", "policyVersionObserved",
      "sourceIsaCharacteristicV2",
    ], `${label}.pipelineOutcome`);
    if (
      outcome.compileOnly !== "passed" ||
      outcome.policyVersionObserved !== 4 ||
      outcome.amdPolicyVersionObserved !== 2 ||
      outcome.amdCostModelRevisionObserved !== 2 ||
      outcome.amdResourceModelRevisionObserved !== 3 ||
      outcome.canonicalKirVersionObserved !== 12 ||
      outcome.finalOptimizedGraphVerificationObserved !== true ||
      ![outcome.inspectionRecordSha256, outcome.finalTargetKirSha256, outcome.finalVerifiedKirSha256].every((value) => SHA256.test(value))
    ) fail(`${label} does not carry exact authenticated V4/AMD V2/resource V3 optimized output facts`);
    exactSourceIsaV2(
      outcome.sourceIsaCharacteristicV2,
      SOURCE_ISA_V2_UNAVAILABLE,
      `${label}.pipelineOutcome.sourceIsaCharacteristicV2`,
    );
    const metrics = exactKeys(item.compilerMetrics, [
      "diagnosticBytes", "inspectionRecordBytes", "inspectionSidecarBytes", "neutralGraphGrowthBytes",
      "neutralPassCount", "neutralPassWork", "optimizerApplied", "optimizerCandidates", "peakResidentSetBytes",
      "targetBindingAndOptimizationGrowthBytes", "targetPassCount", "targetPassWork", "targetResourceModelV3",
    ], `${label}.compilerMetrics`);
    for (const field of ["peakResidentSetBytes", "inspectionSidecarBytes", "inspectionRecordBytes", "neutralPassCount", "targetPassCount"]) {
      integerAtLeast(metrics[field], 1, `${label}.compilerMetrics.${field}`);
    }
    for (const field of ["diagnosticBytes", "neutralPassWork", "targetPassWork", "optimizerCandidates", "optimizerApplied", "neutralGraphGrowthBytes", "targetBindingAndOptimizationGrowthBytes"]) {
      integerAtLeast(metrics[field], 0, `${label}.compilerMetrics.${field}`);
    }
    const resourceModel = exactKeys(metrics.targetResourceModelV3, [
      "comparisonPolicy", "comparisonRationale", "hardwareObserved", "input", "modelRevision", "output",
      "sgprAllocationGranuleDwordsPerWave", "vgprAllocationGranuleDwordsPerLane",
    ], `${label}.compilerMetrics.targetResourceModelV3`);
    if (
      resourceModel.modelRevision !== 3 || resourceModel.hardwareObserved !== false ||
      resourceModel.comparisonPolicy !== "compiler-policy-identity-only" ||
      resourceModel.comparisonRationale !== "replay-validated compiler estimates are policy evidence, not hardware observations"
    ) fail(`${label} has an invalid target resource model authority boundary`);
    const granules = {
      vgpr: integerAtLeast(resourceModel.vgprAllocationGranuleDwordsPerLane, 1, `${label}.resourceModel.vgprGranule`),
      sgpr: integerAtLeast(resourceModel.sgprAllocationGranuleDwordsPerWave, 1, `${label}.resourceModel.sgprGranule`),
    };
    validateResourceEstimateV3(resourceModel.input, granules, `${label}.compilerMetrics.targetResourceModelV3.input`);
    validateResourceEstimateV3(resourceModel.output, granules, `${label}.compilerMetrics.targetResourceModelV3.output`);
    const resources = exactKeys(item.artifactResources, [
      "agprCount", "ldsBytes", "maximumWavesPerExecutionUnit", "maxFlatWorkgroupSize", "minimumWavesPerExecutionUnit", "occupancyStatus", "privateSegmentBytes", "sgprCount", "sgprSpillCount", "vgprCount", "vgprSpillCount", "wavefrontSize",
    ], `${label}.artifactResources`);
    for (const field of ["agprCount", "sgprCount", "vgprCount", "sgprSpillCount", "vgprSpillCount", "ldsBytes", "privateSegmentBytes"]) {
      integerAtLeast(resources[field], 0, `${label}.artifactResources.${field}`);
    }
    integerAtLeast(resources.maxFlatWorkgroupSize, 1, `${label}.artifactResources.maxFlatWorkgroupSize`);
    integerAtLeast(resources.wavefrontSize, 1, `${label}.artifactResources.wavefrontSize`);
    const minimumWaves = resources.minimumWavesPerExecutionUnit;
    const maximumWaves = resources.maximumWavesPerExecutionUnit;
    if (resources.occupancyStatus === "unavailable-not-emitted") {
      if (minimumWaves !== null || maximumWaves !== null) fail(`${label} invents occupancy for unavailable HSACO metadata`);
    } else if (resources.occupancyStatus === "reported-by-hsaco-metadata") {
      integerAtLeast(minimumWaves, 1, `${label}.artifactResources.minimumWavesPerExecutionUnit`);
      integerAtLeast(maximumWaves, 1, `${label}.artifactResources.maximumWavesPerExecutionUnit`);
      if (maximumWaves < minimumWaves) fail(`${label} has an inverted HSACO occupancy interval`);
    } else fail(`${label} has an unsupported occupancy status`);
    const runtime = exactKeys(item.runtimeMetrics, ["runtimeNanoseconds", "status"], `${label}.runtimeMetrics`);
    if (runtime.status === "measured") {
      integerAtLeast(runtime.runtimeNanoseconds, 0, `${label}.runtimeMetrics.runtimeNanoseconds`);
    } else if (runtime.status === "not-run-compile-only" || runtime.status === "unavailable") {
      if (runtime.runtimeNanoseconds !== null) fail(`${label} invents a runtime measurement for status ${runtime.status}`);
    } else fail(`${label} has an unsupported runtime status`);
    const semantic = exactKeys(item.semanticOutcome, ["reference", "simulator"], `${label}.semanticOutcome`);
    const semanticStatuses = new Set(["failed", "not-required", "not-run", "passed", "unavailable"]);
    if (!semanticStatuses.has(semantic.reference) || !semanticStatuses.has(semantic.simulator)) {
      fail(`${label} has an unsupported semantic outcome`);
    }
    cases.set(item.fixtureId, item);
  }
  return cases;
}

function validateDecodedInspection(output, expected, expectedTarget, expectedCase, expectedSha) {
  const lines = output.split(/\r?\n/u).filter(Boolean);
  const required = [
    "format: fe2o3-production-compiler-inspection-v2",
    "authority: inspection-only",
    "compiler-authority: false",
    "publication-authority: false",
    "load-authority: false",
    "launch-authority: false",
    "source-isa-characteristic-v2: status=not-contained-pre-finalization sha256=none bytes=0 authority=observation-only",
    `target: ${expectedTarget}:xnack-`,
    "policies: neutral=4 amd=2 amd-cost-model=2",
    "remarks: 16",
  ];
  for (const line of required) if (lines.filter((candidate) => candidate === line).length !== 1) fail(`inspector omitted canonical line ${line}`);
  if (!lines.includes(`record: sha256=${expectedSha} bytes=${expected.length}`)) fail("inspector record identity differs from the sidecar bytes");
  const resourceModel = expectedCase.compilerMetrics.targetResourceModelV3;
  const expectedResourceLines = [
    `resources-v3-model: revision=3 vgpr-allocation-granule-dwords-per-lane=${resourceModel.vgprAllocationGranuleDwordsPerLane} sgpr-allocation-granule-dwords-per-wave=${resourceModel.sgprAllocationGranuleDwordsPerWave} hardware-observed=false`,
    resourceInspectionLine("input", resourceModel.input),
    resourceInspectionLine("output", resourceModel.output),
  ];
  for (const line of expectedResourceLines) {
    if (lines.filter((candidate) => candidate === line).length !== 1) fail(`inspector omitted exact replayed resource line ${line}`);
  }
  const snapshots = lines.filter((line) => /^kir\.(before-neutral|after-neutral|target): version=12 sha256=[0-9a-f]{64} bytes=[1-9][0-9]* verified-canonical=[0-9a-f]{64}$/u.test(line));
  if (snapshots.length !== 3 || !["before-neutral", "after-neutral", "target"].every((name) => snapshots.some((line) => line.startsWith(`kir.${name}:`)))) {
    fail("inspector did not independently verify the exact three canonical KIR V12 snapshots");
  }
  const expectedSnapshotBytes = new Map([
    ["before-neutral", expectedCase.irSizes.inputNeutralKirBytes],
    ["after-neutral", expectedCase.irSizes.optimizedNeutralKirBytes],
    ["target", expectedCase.irSizes.canonicalKirBytes],
  ]);
  for (const line of snapshots) {
    const match = /^kir\.(before-neutral|after-neutral|target): version=12 sha256=([0-9a-f]{64}) bytes=([1-9][0-9]*) verified-canonical=([0-9a-f]{64})$/u.exec(line);
    if (!match) fail("inspector emitted a malformed KIR snapshot");
    if (Number(match[3]) !== expectedSnapshotBytes.get(match[1])) fail(`inspector ${match[1]} KIR size differs from the measured report`);
    if (match[1] === "target" && (match[2] !== expectedCase.pipelineOutcome.finalTargetKirSha256 || match[4] !== expectedCase.pipelineOutcome.finalVerifiedKirSha256)) {
      fail("inspector target KIR identities differ from the measured report");
    }
  }
  const remarks = lines.flatMap((line) => {
    const match = /^remark\[([0-9]+)\]: .+$/u.exec(line);
    return match ? [Number(match[1])] : [];
  }).sort((left, right) => left - right);
  if (JSON.stringify(remarks) !== JSON.stringify(Array.from({ length: 16 }, (_, index) => index))) {
    fail("inspector did not emit the closed ordered 16-pass record");
  }
}

function resourceInspectionLine(stage, resource) {
  const lds = resource.ldsLimitedWavesPerExecutionUnit ?? "na";
  return `resources-v3-${stage}: basis=canonical-kir-ssa-policy liveness-values=${resource.livenessValues} liveness-work=${resource.livenessWorkUnits} peak-vgpr-dwords-per-lane=${resource.peakLiveVgprDwordsPerLane} peak-vgpr-function=${resource.peakLiveVgprFunction} peak-sgpr-dwords-per-wave=${resource.peakLiveSgprDwordsPerWave} peak-sgpr-function=${resource.peakLiveSgprFunction} allocated-vgpr-dwords-per-lane=${resource.allocatedVgprDwordsPerLane} allocated-sgpr-dwords-per-wave=${resource.allocatedSgprDwordsPerWave} required-vgpr-spill-dwords-per-lane=${resource.requiredVgprSpillDwordsPerLane} required-sgpr-spill-dwords-per-wave=${resource.requiredSgprSpillDwordsPerWave} vgpr-limited-waves-per-eu=${resource.vgprLimitedWavesPerExecutionUnit} sgpr-limited-waves-per-eu=${resource.sgprLimitedWavesPerExecutionUnit} lds-limited-waves-per-eu=${lds} estimated-waves-per-eu=${resource.estimatedWavesPerExecutionUnit} occupancy-complete=${resource.occupancyComplete} spill-admissible=${resource.spillAdmissible} hardware-observed=false`;
}

function validateSidecar(path, inspector, expectedCase, expectedTarget) {
  if (!path.endsWith(SIDECAR_SUFFIX)) fail(`sidecar path must be the LLVM primary output plus ${SIDECAR_SUFFIX.slice(3)}`);
  let metadata;
  try {
    metadata = lstatSync(path);
  } catch (error) {
    fail(`missing inspection sidecar ${path}: ${error.message}`);
  }
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size <= SIDECAR_MAGIC.length || metadata.size > MAX_SIDECAR_BYTES) {
    fail(`inspection sidecar must be a bounded nonempty regular file: ${path}`);
  }
  const bytes = readFileSync(path);
  if (!bytes.subarray(0, SIDECAR_MAGIC.length).equals(SIDECAR_MAGIC)) fail(`inspection sidecar ${path} has forged magic`);
  const digest = sha256(bytes);
  if (digest !== expectedCase.pipelineOutcome.inspectionRecordSha256) fail(`inspection sidecar ${path} SHA-256 does not match its measured report`);
  if (metadata.size !== expectedCase.compilerMetrics.inspectionSidecarBytes || metadata.size !== expectedCase.compilerMetrics.inspectionRecordBytes) {
    fail(`inspection sidecar ${path} byte count does not match its measured report`);
  }
  let inspectorMetadata;
  try {
    inspectorMetadata = lstatSync(inspector);
  } catch (error) {
    fail(`cannot inspect compiler decoder ${inspector}: ${error.message}`);
  }
  if (!inspectorMetadata.isFile() || inspectorMetadata.isSymbolicLink()) fail("compiler inspector must be a regular executable");
  const decoded = spawnSync(inspector, ["inspect", "--format", "compiler-inspection-v2", path], {
    encoding: "utf8",
    maxBuffer: 100 * 1024 * 1024,
  });
  if (decoded.error || decoded.status !== 0) fail(`authenticated compiler inspector rejected ${path}`);
  validateDecodedInspection(decoded.stdout, bytes, expectedTarget, expectedCase, digest);
}

function parseArguments(arguments_) {
  const values = { rawArtifacts: false, reports: [], sidecars: new Map() };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    const next = () => {
      index += 1;
      if (index >= arguments_.length || arguments_[index].startsWith("--")) fail(`${argument} requires a value`);
      return arguments_[index];
    };
    if (argument === "--manifest") values.manifest = next();
    else if (argument === "--digest") values.digest = next();
    else if (argument === "--baseline-schema") values.baselineSchema = next();
    else if (argument === "--threshold-schema") values.thresholdSchema = next();
    else if (argument === "--hardware-schema") values.hardwareSchema = next();
    else if (argument === "--qualification-schema") values.qualificationSchema = next();
    else if (argument === "--qualification-record") values.qualificationRecord = next();
    else if (argument === "--qualification-record-digest") values.qualificationRecordDigest = next();
    else if (argument === "--source-isa-v2-fixture") values.sourceIsaV2Fixture = next();
    else if (argument === "--compiler-repository") values.compilerRepository = next();
    else if (argument === "--raw-artifacts") values.rawArtifacts = true;
    else if (argument === "--baseline-report") values.reports.push(next());
    else if (argument === "--inspector") values.inspector = next();
    else if (argument === "--sidecar") {
      const assignment = next();
      const separator = assignment.indexOf("=");
      if (separator <= 0 || separator === assignment.length - 1) fail("--sidecar must be FIXTURE_ID=PATH");
      const fixtureId = assignment.slice(0, separator);
      if (values.sidecars.has(fixtureId)) fail(`duplicate sidecar argument for ${fixtureId}`);
      values.sidecars.set(fixtureId, assignment.slice(separator + 1));
    } else fail(`unknown argument ${argument}`);
  }
  return values;
}

function main() {
  const repositoryRoot = resolve(new URL("..", import.meta.url).pathname);
  const arguments_ = parseArguments(process.argv.slice(2));
  const manifestPath = resolve(arguments_.manifest ?? resolve(repositoryRoot, "config/tutorial-kernel-manifest-v1.json"));
  if (isAbsolute(relative(repositoryRoot, manifestPath)) && !arguments_.manifest) fail("default manifest escaped repository root");
  const manifestBytes = readFileSync(manifestPath);
  const manifestDocument = JSON.parse(manifestBytes.toString("utf8"));
  const manifest = validateManifest(manifestDocument);
  const digestPath = resolve(arguments_.digest ?? (manifestPath.endsWith(".json") ? `${manifestPath.slice(0, -5)}.sha256` : `${manifestPath}.sha256`));
  const digestBytes = readFileSync(digestPath);
  const manifestDigests = validateDigest(manifestPath, digestPath, manifestBytes, manifestDocument, repositoryRoot);
  const compilerRepository = arguments_.compilerRepository ?? process.env.FE2O3_COMPILER_REPOSITORY;
  if (compilerRepository) {
    validateCompilerManifestParity(
      compilerRepository,
      manifestBytes,
      digestBytes,
      manifest.baseline,
    );
  }
  const sourceIsaFixturePath = resolve(
    arguments_.sourceIsaV2Fixture ?? resolve(repositoryRoot, SOURCE_ISA_V2_FIXTURE_PATH),
  );
  validateSourceIsaFixture(sourceIsaFixturePath);
  validateSharedSchema(
    resolve(arguments_.baselineSchema ?? resolve(repositoryRoot, "config/tutorial-compiler-baseline-report-schema-v1.json")),
    "tutorial-compiler-baseline-report-schema-v1.json",
  );
  validateSharedSchema(
    resolve(arguments_.thresholdSchema ?? resolve(repositoryRoot, "config/tutorial-compiler-no-regression-threshold-schema-v1.json")),
    "tutorial-compiler-no-regression-threshold-schema-v1.json",
  );
  validateSharedSchema(
    resolve(arguments_.hardwareSchema ?? resolve(repositoryRoot, "config/tutorial-gfx942-hardware-evidence-schema-v1.json")),
    "tutorial-gfx942-hardware-evidence-schema-v1.json",
  );
  validateSharedSchema(
    resolve(arguments_.qualificationSchema ?? resolve(repositoryRoot, "config/tutorial-compiler-qualification-record-schema-v1.json")),
    "tutorial-compiler-qualification-record-schema-v1.json",
  );

  const qualifiedFixtureIds = manifest.baseline.status === "qualified"
    ? new Set(manifest.fixtureById.keys())
    : new Set();
  const defaultRecord = resolve(repositoryRoot, "config/tutorial-compiler-qualification-record-v1.json");
  const defaultRecordDigest = resolve(repositoryRoot, "config/tutorial-compiler-qualification-record-v1.sha256");
  const rawInputsPresent = arguments_.reports.length !== 0 || arguments_.sidecars.size !== 0 || arguments_.inspector;
  if (arguments_.rawArtifacts) {
    if (qualifiedFixtureIds.size === 0) {
      if (rawInputsPresent) fail("qualification evidence is stale because no fixture is qualified");
    } else {
    if (arguments_.reports.length === 0) fail("qualified fixtures require measured baseline reports");
    if (!arguments_.inspector) fail("qualified fixtures require the authenticated compiler inspector");
    const observedCases = new Map();
    for (const reportPath of arguments_.reports) {
      for (const [fixtureId, item] of validateReport(resolve(reportPath), manifestDigests, manifest)) {
        if (observedCases.has(fixtureId)) fail(`duplicate qualified fixture report ${fixtureId}`);
        observedCases.set(fixtureId, item);
      }
    }
    for (const fixtureId of qualifiedFixtureIds) {
      const item = observedCases.get(fixtureId);
      if (!item) fail(`qualified fixture ${fixtureId} is missing a measured report`);
      const sidecarPath = arguments_.sidecars.get(fixtureId);
      if (!sidecarPath) fail(`qualified fixture ${fixtureId} is missing its inspection sidecar`);
      validateSidecar(resolve(sidecarPath), resolve(arguments_.inspector), item, item.target);
    }
    for (const fixtureId of arguments_.sidecars.keys()) {
      if (!qualifiedFixtureIds.has(fixtureId)) fail(`sidecar supplied for unqualified fixture ${fixtureId}`);
    }
    }
  } else {
    if (rawInputsPresent) fail("raw baseline/sidecar reproduction requires explicit --raw-artifacts");
    const recordPath = resolve(arguments_.qualificationRecord ?? defaultRecord);
    const recordDigestPath = resolve(arguments_.qualificationRecordDigest ?? defaultRecordDigest);
    if (qualifiedFixtureIds.size === 0) {
      if (arguments_.qualificationRecord || arguments_.qualificationRecordDigest || existsSync(defaultRecord) || existsSync(defaultRecordDigest)) {
        fail("qualification record is stale because no fixture is qualified");
      }
    } else {
      validateQualificationRecord({
        recordPath,
        digestPath: recordDigestPath,
        manifest,
        manifestDigests,
        sourceIsaFixturePath,
      });
    }
  }
  console.log(`validated tutorial compiler corpus: ${manifest.entries.length} lessons, ${manifest.fixtureById.size} compiler fixtures, neutral V4 / AMD V2 / resource V3 / inspection V2`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
