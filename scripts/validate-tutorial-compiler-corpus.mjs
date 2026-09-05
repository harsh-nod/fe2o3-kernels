#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

const TOP_LEVEL_KEYS = [
  "baseline",
  "compilerFixtures",
  "entries",
  "productionContract",
  "roadmapIssue",
  "schema",
];
const ENTRY_KEYS = [
  "classification",
  "compilerFixtureIds",
  "lessonId",
  "packageManifest",
  "qualificationStatus",
  "requiredGates",
  "siteEvidenceKind",
  "sourcePaths",
];
const FIXTURE_KEYS = ["fixtureId", "matrix", "target", "testId", "testPath"];
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
const SIDECAR_SUFFIX = ".ll.fe2o3-compiler-inspection-v1";
const SIDECAR_MAGIC = Buffer.from("F2KIRP01", "ascii");
const SHA256 = /^[0-9a-f]{64}$/u;
const GIT_ID = /^[0-9a-f]{40}$/u;
const TARGET = /^gfx[0-9]{3}$/u;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const MAX_SIDECAR_BYTES = 3 * 16 * 1024 * 1024 + 256 * 1024;

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
  if (!new Set(["pending", "qualified"]).has(entry.qualificationStatus)) {
    fail(`${lessonId} has unsupported qualificationStatus`);
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
  if (baseline.status === "qualified" && entries.some((entry) => entry.qualificationStatus !== "qualified")) {
    fail("a qualified baseline requires every tutorial entry to be qualified");
  }
  return { baseline, contract, entries, fixtureById };
}

function validateDigest(manifestPath, digestPath, manifestBytes, repositoryRoot) {
  const [expected, recordedPath, ...extra] = readFileSync(digestPath, "ascii").trimEnd().split("  ");
  if (extra.length !== 0 || !SHA256.test(expected)) fail("manifest digest record is malformed");
  const expectedPath = relative(repositoryRoot, manifestPath).replaceAll("\\", "/");
  if (recordedPath !== expectedPath) fail("manifest digest record names the wrong path");
  const actual = sha256(manifestBytes);
  if (actual !== expected) fail(`manifest digest mismatch: expected ${expected}, got ${actual}`);
  return actual;
}

function validateReport(path, manifestDigest, manifest) {
  const report = exactKeys(parseJson(path, "baseline report"), [
    "cases", "compiler", "manifest", "measurement", "pipelineContract", "schema",
  ], `baseline report ${path}`);
  if (report.schema !== "fe2o3-tutorial-compiler-baseline-report-v1") fail(`${path} has unsupported report schema`);
  const binding = exactKeys(report.manifest, ["path", "sha256"], `${path}.manifest`);
  if (binding.path !== "config/tutorial-kernel-manifest-v1.json" || binding.sha256 !== manifestDigest) {
    fail(`${path} does not bind the exact tutorial manifest`);
  }
  const compiler = exactKeys(report.compiler, ["commit", "tree", "worktreeClean"], `${path}.compiler`);
  if (!GIT_ID.test(compiler.commit) || !GIT_ID.test(compiler.tree) || compiler.worktreeClean !== true) {
    fail(`${path} does not identify a clean exact compiler tree`);
  }
  if (compiler.commit !== manifest.baseline.compilerCommit || compiler.tree !== manifest.baseline.compilerTree) {
    fail(`${path} does not bind the manifest compiler commit and tree`);
  }
  const measurement = exactKeys(report.measurement, ["command", "durationClock", "measuredAtUtc", "target", "toolchain"], `${path}.measurement`);
  if (!TARGET.test(measurement.target) || measurement.durationClock !== "CLOCK_MONOTONIC") {
    fail(`${path} has an invalid measurement contract`);
  }
  string(measurement.command, `${path}.measurement.command`);
  string(measurement.toolchain, `${path}.measurement.toolchain`);
  if (Number.isNaN(Date.parse(measurement.measuredAtUtc))) fail(`${path} has an invalid measuredAtUtc`);
  const pipeline = exactKeys(report.pipelineContract, ["entry", "requiredPolicyVersion", "requiresFinalOptimizedGraphVerification"], `${path}.pipelineContract`);
  if (
    pipeline.entry !== manifest.contract.pipelineEntry ||
    pipeline.requiredPolicyVersion !== 4 ||
    pipeline.requiresFinalOptimizedGraphVerification !== true
  ) fail(`${path} does not bind the exact production V4 pipeline contract`);
  if (!Array.isArray(report.cases) || report.cases.length === 0) fail(`${path}.cases must be nonempty`);
  const cases = new Map();
  for (const [index, rawCase] of report.cases.entries()) {
    const label = `${path}.cases[${index}]`;
    const item = exactKeys(rawCase, [
      "compileTimeNanoseconds", "familyIds", "fixtureId", "irSizes", "pipelineOutcome", "semanticOutcome", "target", "testId",
    ], label);
    const fixture = manifest.fixtureById.get(item.fixtureId);
    if (!fixture || fixture.testId !== item.testId || fixture.target !== item.target || item.target !== measurement.target) {
      fail(`${label} does not resolve its exact manifest fixture`);
    }
    if (cases.has(item.fixtureId)) fail(`${path} contains duplicate case ${item.fixtureId}`);
    if (!Number.isSafeInteger(item.compileTimeNanoseconds) || item.compileTimeNanoseconds < 0) fail(`${label} has invalid compile time`);
    const familyIds = stringArray(item.familyIds, `${label}.familyIds`, { nonempty: true });
    const expectedFamilies = manifest.entries
      .filter((entry) => entry.compilerFixtureIds.includes(item.fixtureId))
      .map((entry) => entry.lessonId)
      .sort();
    if (JSON.stringify(familyIds) !== JSON.stringify(expectedFamilies)) {
      fail(`${label}.familyIds do not match the manifest lesson owners`);
    }
    const sizes = exactKeys(item.irSizes, ["canonicalKirBytes", "hsacoBytes", "llvmIrBytes", "llvmIrFileCount"], `${label}.irSizes`);
    if (![sizes.canonicalKirBytes, sizes.hsacoBytes, sizes.llvmIrBytes].every((value) => Number.isSafeInteger(value) && value > 0) || sizes.llvmIrFileCount !== 1) {
      fail(`${label} has invalid measured IR sizes`);
    }
    const outcome = exactKeys(item.pipelineOutcome, [
      "amdCostModelRevisionObserved", "amdPolicyVersionObserved", "compileOnly", "finalOptimizedGraphVerificationObserved", "finalTargetKirSha256", "finalVerifiedV11Sha256", "inspectionRecordSha256", "policyVersionObserved",
    ], `${label}.pipelineOutcome`);
    if (
      outcome.compileOnly !== "passed" ||
      outcome.policyVersionObserved !== 4 ||
      outcome.amdPolicyVersionObserved !== 1 ||
      outcome.amdCostModelRevisionObserved !== 1 ||
      outcome.finalOptimizedGraphVerificationObserved !== true ||
      ![outcome.inspectionRecordSha256, outcome.finalTargetKirSha256, outcome.finalVerifiedV11Sha256].every((value) => SHA256.test(value))
    ) fail(`${label} does not carry exact authenticated V4/V1/V1 optimized output facts`);
    const semantic = exactKeys(item.semanticOutcome, ["reference", "simulator"], `${label}.semanticOutcome`);
    const semanticStatuses = new Set(["failed", "not-required", "not-run", "passed", "unavailable"]);
    if (!semanticStatuses.has(semantic.reference) || !semanticStatuses.has(semantic.simulator)) {
      fail(`${label} has an unsupported semantic outcome`);
    }
    cases.set(item.fixtureId, item);
  }
  return cases;
}

function validateDecodedInspection(output, expected, expectedTarget, expectedSha) {
  const lines = output.split(/\r?\n/u).filter(Boolean);
  const required = [
    "format: fe2o3-production-compiler-inspection-v1",
    "authority: inspection-only",
    "compiler-authority: false",
    "publication-authority: false",
    "load-authority: false",
    "launch-authority: false",
    `target: ${expectedTarget}:xnack-`,
    "policies: neutral=4 amd=1 amd-cost-model=1",
    "remarks: 16",
  ];
  for (const line of required) if (lines.filter((candidate) => candidate === line).length !== 1) fail(`inspector omitted canonical line ${line}`);
  if (!lines.includes(`record: sha256=${expectedSha} bytes=${expected.length}`)) fail("inspector record identity differs from the sidecar bytes");
  const snapshots = lines.filter((line) => /^kir\.(before-neutral|after-neutral|target): version=11 sha256=[0-9a-f]{64} bytes=[1-9][0-9]* verified-v11=[0-9a-f]{64}$/u.test(line));
  if (snapshots.length !== 3 || !["before-neutral", "after-neutral", "target"].every((name) => snapshots.some((line) => line.startsWith(`kir.${name}:`)))) {
    fail("inspector did not independently verify the exact three KIR V11 snapshots");
  }
  const remarks = lines.flatMap((line) => {
    const match = /^remark\[([0-9]+)\]: .+$/u.exec(line);
    return match ? [Number(match[1])] : [];
  }).sort((left, right) => left - right);
  if (JSON.stringify(remarks) !== JSON.stringify(Array.from({ length: 16 }, (_, index) => index))) {
    fail("inspector did not emit the closed ordered 16-pass record");
  }
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
  let inspectorMetadata;
  try {
    inspectorMetadata = lstatSync(inspector);
  } catch (error) {
    fail(`cannot inspect compiler decoder ${inspector}: ${error.message}`);
  }
  if (!inspectorMetadata.isFile() || inspectorMetadata.isSymbolicLink()) fail("compiler inspector must be a regular executable");
  const decoded = spawnSync(inspector, ["inspect", "--format", "compiler-inspection-v1", path], {
    encoding: "utf8",
    maxBuffer: 100 * 1024 * 1024,
  });
  if (decoded.error || decoded.status !== 0) fail(`authenticated compiler inspector rejected ${path}`);
  validateDecodedInspection(decoded.stdout, bytes, expectedTarget, digest);
}

function parseArguments(arguments_) {
  const values = { reports: [], sidecars: new Map() };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    const next = () => {
      index += 1;
      if (index >= arguments_.length || arguments_[index].startsWith("--")) fail(`${argument} requires a value`);
      return arguments_[index];
    };
    if (argument === "--manifest") values.manifest = next();
    else if (argument === "--digest") values.digest = next();
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
  const manifestDigest = validateDigest(manifestPath, digestPath, manifestBytes, repositoryRoot);

  const qualifiedFixtureIds = new Set(manifest.entries.filter((entry) => entry.qualificationStatus === "qualified").flatMap((entry) => entry.compilerFixtureIds));
  if (qualifiedFixtureIds.size === 0) {
    if (arguments_.reports.length !== 0 || arguments_.sidecars.size !== 0 || arguments_.inspector) fail("qualification evidence is stale because no fixture is qualified");
  } else {
    if (arguments_.reports.length === 0) fail("qualified fixtures require measured baseline reports");
    if (!arguments_.inspector) fail("qualified fixtures require the authenticated compiler inspector");
    const observedCases = new Map();
    for (const reportPath of arguments_.reports) {
      for (const [fixtureId, item] of validateReport(resolve(reportPath), manifestDigest, manifest)) {
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
  console.log(`validated tutorial compiler corpus: ${manifest.entries.length} lessons, ${manifest.fixtureById.size} compiler fixtures, policy V4`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
