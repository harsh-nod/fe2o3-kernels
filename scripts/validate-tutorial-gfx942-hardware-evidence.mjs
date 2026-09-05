#!/usr/bin/env node

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { tutorialCorpusContractSha256 } from "./tutorial-corpus-contract.mjs";

const SCHEMA_SHA256 = "4ab38389760f904b1782a54aed9960c7e174039b192590c042968aafaaed1346";
const SHA256 = /^[0-9a-f]{64}$/u;
const TARGET = "gfx942:xnack-";
const SOURCE_ISA_V2_FIXTURE_PATH = "crates/fe2o3-hsaco-finalize/tests/fixtures/production-v12-source-isa-characteristic-v2.json";
const SOURCE_ISA_V2_IMPLEMENTATION = {
  collectionBytes: 4797,
  collectionSha256: "0a5627abbf4550e209adb923f873caa68065237e21ee5219fba9272647891072",
  fixturePath: SOURCE_ISA_V2_FIXTURE_PATH,
  schema: "fe2o3-source-isa-characteristic-v2",
  status: "admitted-production-shaped-worker-v3-v12",
  targetProfile: TARGET,
};
const SOURCE_ISA_V2_UNAVAILABLE = {
  collectionBytes: 0,
  collectionSha256: null,
  inspectionStatus: "not-contained-pre-finalization",
  status: "unavailable-direct-link-no-protected-finalizer",
};
const MAX_FILE_BYTES = 256 * 1024 * 1024;
const IDENTITY_FIELDS = [
  "schema", "compiler_commit", "compiler_tree", "target", "hardware_observed",
  "toolchain", "rustc", "cargo", "rocminfo_sha256", "kernel_count",
];

function fail(message) {
  throw new Error(`tutorial gfx942 hardware evidence: ${message}`);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sameJson(left, right) {
  const normalize = (value) => {
    if (Array.isArray(value)) return value.map(normalize);
    if (value !== null && typeof value === "object") {
      return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]));
    }
    return value;
  };
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

function readJson(path, label) {
  try {
    const bytes = readFileSync(path);
    return { bytes, document: JSON.parse(bytes.toString("utf8")) };
  } catch (error) {
    fail(`cannot read ${label} ${path}: ${error.message}`);
  }
}

function validateSourceIsaFixture(path, evidence) {
  let metadata;
  try { metadata = lstatSync(path); } catch (error) { fail(`cannot inspect Source/ISA V2 fixture: ${error.message}`); }
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size !== SOURCE_ISA_V2_IMPLEMENTATION.collectionBytes) {
    fail("Source/ISA V2 fixture must be the exact bounded regular compiler fixture");
  }
  const bytes = readFileSync(path);
  if (
    sha256(bytes) !== SOURCE_ISA_V2_IMPLEMENTATION.collectionSha256 ||
    !sameJson(evidence, SOURCE_ISA_V2_IMPLEMENTATION)
  ) {
    fail("Source/ISA V2 implementation evidence differs from the compiler contract");
  }
}

function schemaTypeMatches(value, type) {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  if (type === "integer") return Number.isSafeInteger(value);
  return typeof value === type;
}

function validateSchema(value, rawRule, root, label = "evidence") {
  let rule = rawRule;
  if (rule.$ref) {
    if (!rule.$ref.startsWith("#/$defs/")) fail(`${label} schema contains an unsupported reference`);
    rule = root.$defs[rule.$ref.slice("#/$defs/".length)];
    if (!rule) fail(`${label} schema reference does not resolve`);
  }
  if (rule.anyOf) {
    const accepted = rule.anyOf.some((candidate) => {
      try { validateSchema(value, candidate, root, label); return true; } catch { return false; }
    });
    if (!accepted) fail(`${label} does not match any admitted shape`);
    return;
  }
  if (Object.hasOwn(rule, "const") && !Object.is(value, rule.const)) fail(`${label} differs from its required constant`);
  if (rule.type) {
    const types = Array.isArray(rule.type) ? rule.type : [rule.type];
    if (!types.some((type) => schemaTypeMatches(value, type))) fail(`${label} has the wrong type`);
  }
  if (typeof value === "number") {
    if (rule.minimum !== undefined && value < rule.minimum) fail(`${label} is below its minimum`);
    if (rule.maximum !== undefined && value > rule.maximum) fail(`${label} exceeds its maximum`);
  }
  if (typeof value === "string") {
    if (rule.minLength !== undefined && value.length < rule.minLength) fail(`${label} is too short`);
    if (rule.pattern !== undefined && !new RegExp(rule.pattern, "u").test(value)) fail(`${label} has an invalid form`);
  }
  if (Array.isArray(value)) {
    if (rule.minItems !== undefined && value.length < rule.minItems) fail(`${label} has too few items`);
    if (rule.maxItems !== undefined && value.length > rule.maxItems) fail(`${label} has too many items`);
    if (rule.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) fail(`${label} contains duplicates`);
    if (rule.items) value.forEach((item, index) => validateSchema(item, rule.items, root, `${label}[${index}]`));
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const required = new Set(rule.required ?? []);
    for (const key of required) if (!Object.hasOwn(value, key)) fail(`${label}.${key} is required`);
    if (rule.additionalProperties === false) {
      for (const key of Object.keys(value)) if (!Object.hasOwn(rule.properties ?? {}, key)) fail(`${label}.${key} is not admitted`);
    }
    for (const [key, childRule] of Object.entries(rule.properties ?? {})) {
      if (Object.hasOwn(value, key)) validateSchema(value[key], childRule, root, `${label}.${key}`);
    }
  }
}

function manifestCases(manifest) {
  return manifest.compilerFixtures
    .filter((fixture) => fixture.target === "gfx942" && fixture.matrix !== null)
    .map((fixture) => ({
      artifactName: fixture.matrix.artifactName,
      caseId: fixture.matrix.caseId,
      environment: fixture.matrix.environment,
      fixtureId: fixture.fixtureId,
      runnerArguments: fixture.matrix.runnerArguments,
      runnerPath: fixture.matrix.runnerPath,
      testId: fixture.testId,
    }));
}

function checkFileRecord(root, record, label, seen) {
  if (seen.has(record.path)) fail(`duplicate file record path ${record.path}`);
  seen.add(record.path);
  const path = resolve(root, record.path);
  if (isAbsolute(relative(root, path))) fail(`${label} escapes the artifact root`);
  let cursor = root;
  for (const component of record.path.split("/").slice(0, -1)) {
    cursor = resolve(cursor, component);
    let directoryMetadata;
    try { directoryMetadata = lstatSync(cursor); } catch (error) { fail(`cannot inspect ${label} directory: ${error.message}`); }
    if (!directoryMetadata.isDirectory() || directoryMetadata.isSymbolicLink()) fail(`${label} contains a symlink or non-directory path component`);
  }
  let metadata;
  try { metadata = lstatSync(path); } catch (error) { fail(`cannot inspect ${label}: ${error.message}`); }
  const limit = record.path.endsWith("identity.txt") ? 64 * 1024
    : record.path.endsWith("commands.txt") || record.path.endsWith("results.tsv") ? 4 * 1024 * 1024
      : record.path.endsWith("rocminfo.txt") ? 16 * 1024 * 1024
        : record.path.endsWith("summary.tsv") ? 1024 * 1024
          : record.path.startsWith("logs/") ? 64 * 1024 * 1024
            : MAX_FILE_BYTES;
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size <= 0 || metadata.size > limit) {
    fail(`${label} must be a bounded regular file`);
  }
  const bytes = readFileSync(path);
  if (bytes.length !== record.bytes || sha256(bytes) !== record.sha256) fail(`${label} bytes do not match the evidence record`);
  return { path, bytes };
}

function canonicalText(bytes, label) {
  const text = bytes.toString("ascii");
  if (!text.endsWith("\n") || text.includes("\r") || !Buffer.from(text, "ascii").equals(bytes)) {
    fail(`${label} is not canonical ASCII line text`);
  }
  return text;
}

function shellWords(line, label) {
  const words = [];
  let word = "";
  let quote = null;
  let active = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quote === "'") {
      if (character === "'") quote = null;
      else word += character;
    } else if (quote === '"') {
      if (character === '"') quote = null;
      else if (character === "\\") {
        index += 1;
        if (index >= line.length) fail(`${label} ends in an escape`);
        word += line[index];
      } else word += character;
    } else if (character === "'" || character === '"') {
      quote = character;
      active = true;
    } else if (character === "\\") {
      index += 1;
      if (index >= line.length) fail(`${label} ends in an escape`);
      word += line[index];
      active = true;
    } else if (/\s/u.test(character)) {
      if (active) { words.push(word); word = ""; active = false; }
    } else {
      word += character;
      active = true;
    }
  }
  if (quote !== null) fail(`${label} contains an unterminated quote`);
  if (active) words.push(word);
  if (words.length === 0 || words.some((value) => value.length === 0)) fail(`${label} contains an empty shell word`);
  return words;
}

function assignment(token, label) {
  const separator = token.indexOf("=");
  if (separator <= 0 || separator === token.length - 1) fail(`${label} contains an invalid environment assignment`);
  const name = token.slice(0, separator);
  const value = token.slice(separator + 1);
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/u.test(name) || /[\0\r\n\t]/u.test(value)) fail(`${label} contains an invalid environment assignment`);
  return [name, value];
}

function absoluteCanonical(value, label) {
  if (!value.startsWith("/") || value.startsWith("//") || value.split("/").includes("..") || resolve(value) !== value) {
    fail(`${label} is not a canonical absolute path`);
  }
  return value;
}

function parseBuild(words, toolchain, packageName, binary, label) {
  if (words.length !== 14 || words[0] !== "env") fail(`${label} does not have the admitted build shape`);
  const [name, target] = assignment(words[1], label);
  if (name !== "CARGO_TARGET_DIR") fail(`${label} does not bind CARGO_TARGET_DIR`);
  absoluteCanonical(target, `${label} target`);
  absoluteCanonical(words[9], `${label} manifest`);
  const expected = ["env", words[1], "rustup", "run", toolchain, "cargo", "build", "--locked", "--manifest-path", words[9], "-p", packageName, "--bin", binary];
  if (JSON.stringify(words) !== JSON.stringify(expected) || !target.endsWith("/cargo-target") || !words[9].endsWith("/Cargo.toml")) {
    fail(`${label} differs from the admitted compiler build`);
  }
  return { target, repo: words[9].slice(0, -"/Cargo.toml".length) };
}

function validateCommands(bytes, cases) {
  const lines = canonicalText(bytes, "command record").trimEnd().split("\n");
  if (lines.length !== cases.length + 2 || lines.some((line) => line.length === 0)) fail("command record does not contain two builds and every case");
  const firstWords = shellWords(lines[0], "extractor build command");
  const toolchain = firstWords[4];
  const extractor = parseBuild(firstWords, toolchain, "rustc-codegen-fe2o3", "fe2o3-rustc-extract", "extractor build command");
  const inspector = parseBuild(shellWords(lines[1], "inspector build command"), toolchain, "cargo-fe2o3", "cargo-fe2o3", "inspector build command");
  if (extractor.target !== inspector.target || extractor.repo !== inspector.repo) fail("build commands do not share compiler checkout and target identities");
  cases.forEach((item, ordinal) => {
    const label = `case command ${item.caseId}`;
    const words = shellWords(lines[ordinal + 2], label);
    if (words[0] !== "env") fail(`${label} does not use the admitted environment`);
    const bash = words.indexOf("bash", 1);
    if (bash < 0 || bash + 1 >= words.length) fail(`${label} does not invoke its runner`);
    const expectedAssignments = [
      ["CARGO_TARGET_DIR", extractor.target], ["FE2O3_EXAMPLE_COMPILE_ONLY", "0"],
      ["FE2O3_EXAMPLE_RETAIN_COMPILER_OUTPUT", "1"], ["FE2O3_ROOT_TARGET_DIR", extractor.target],
      ["FE2O3_RUSTC_EXTRACTOR", `${extractor.target}/debug/fe2o3-rustc-extract`],
      ["FE2O3_OUTPUT_DIR", `${extractor.target.slice(0, -"/cargo-target".length)}/cases/${item.caseId}/output`],
      ["TMPDIR", `${extractor.target.slice(0, -"/cargo-target".length)}/cases/${item.caseId}/tmp`],
      ...item.environment.map((value) => assignment(value, `manifest environment ${item.caseId}`)),
    ];
    const observedAssignments = words.slice(1, bash).map((value) => assignment(value, label));
    if (JSON.stringify(observedAssignments) !== JSON.stringify(expectedAssignments)) fail(`${label} environment differs from the manifest`);
    if (words[bash + 1] !== `${extractor.repo}/${item.runnerPath}` || JSON.stringify(words.slice(bash + 2)) !== JSON.stringify(item.runnerArguments)) {
      fail(`${label} runner or arguments differ from the manifest`);
    }
  });
}

function validateResults(bytes, cases, evidenceCases) {
  const lines = canonicalText(bytes, "result record").trimEnd().split("\n");
  if (lines.length !== cases.length) fail("result record case count differs from the manifest");
  lines.forEach((line, index) => {
    const fields = line.split("\t");
    if (fields.length !== 7) fail(`result row ${index} does not have seven fields`);
    const expected = cases[index];
    const evidence = evidenceCases[index];
    if (JSON.stringify(fields.slice(0, 4)) !== JSON.stringify([expected.fixtureId, expected.testId, expected.caseId, "PASS"])) fail(`result row ${index} differs from its manifest case`);
    if (![fields[4], fields[5], fields[6]].every((value) => SHA256.test(value))) fail(`result row ${index} contains an invalid digest`);
    if (fields[4] !== evidence.artifacts.hsaco.sha256 || fields[5] !== evidence.artifacts.llvmIr.sha256 || fields[6] !== evidence.artifacts.compilerInspection.sha256) {
      fail(`result row ${index} does not bind the retained artifacts`);
    }
  });
}

function validateIdentity(bytes, evidence, cases, rocminfoSha) {
  const lines = canonicalText(bytes, "identity record").trimEnd().split("\n");
  const pairs = lines.map((line) => {
    const separator = line.indexOf("=");
    if (separator <= 0 || separator === line.length - 1) fail("identity record contains a malformed field");
    return [line.slice(0, separator), line.slice(separator + 1)];
  });
  if (JSON.stringify(pairs.map(([key]) => key)) !== JSON.stringify(IDENTITY_FIELDS)) fail("identity record fields or order differ from the contract");
  const identity = Object.fromEntries(pairs);
  const expected = {
    schema: "fe2o3-tutorial-gfx942-hardware-evidence-v1",
    compiler_commit: evidence.compiler.commit,
    compiler_tree: evidence.compiler.tree,
    target: TARGET,
    hardware_observed: "true",
    rocminfo_sha256: rocminfoSha,
    kernel_count: String(cases.length),
  };
  for (const [key, value] of Object.entries(expected)) if (identity[key] !== value) fail(`identity record ${key} mismatch`);
  for (const key of ["toolchain", "rustc", "cargo"]) if (!identity[key]) fail(`identity record ${key} is empty`);
  return identity.toolchain;
}

function resourceFromFields(fields, offset, vgprGranule, sgprGranule, label) {
  const values = fields.slice(offset, offset + 12).map((value) => {
    if (!/^[0-9]+$/u.test(value)) fail(`${label} contains a non-decimal resource`);
    return Number(value);
  });
  const ldsText = fields[offset + 12];
  const lds = ldsText === "na" ? null : Number(ldsText);
  if (lds !== null && (!Number.isSafeInteger(lds) || lds < 1)) fail(`${label} has an invalid LDS limit`);
  const estimated = Number(fields[offset + 13]);
  const flags = fields.slice(offset + 14, offset + 16);
  if (flags.some((value) => value !== "0" && value !== "1")) fail(`${label} has invalid boolean flags`);
  const [livenessValues, livenessWork, peakVgprDwordsPerLane, peakVgprFunction, peakSgprDwordsPerWave, peakSgprFunction, allocatedVgprDwordsPerLane, allocatedSgprDwordsPerWave, requiredVgprSpillDwordsPerLane, requiredSgprSpillDwordsPerWave, vgprLimitedWavesPerEu, sgprLimitedWavesPerEu] = values;
  const result = {
    allocatedSgprDwordsPerWave, allocatedVgprDwordsPerLane, estimatedWavesPerEu: estimated,
    ldsLimitedWavesPerEu: lds, livenessValues, livenessWork, occupancyComplete: flags[0] === "1",
    peakSgprDwordsPerWave, peakSgprFunction, peakVgprDwordsPerLane, peakVgprFunction,
    requiredSgprSpillDwordsPerWave, requiredVgprSpillDwordsPerLane, sgprLimitedWavesPerEu,
    spillAdmissible: flags[1] === "1", vgprLimitedWavesPerEu,
  };
  const limits = [vgprLimitedWavesPerEu, sgprLimitedWavesPerEu, ...(lds === null ? [] : [lds])];
  if (
    allocatedVgprDwordsPerLane < peakVgprDwordsPerLane || allocatedVgprDwordsPerLane % vgprGranule !== 0 ||
    allocatedSgprDwordsPerWave < peakSgprDwordsPerWave || allocatedSgprDwordsPerWave % sgprGranule !== 0 ||
    vgprLimitedWavesPerEu < 1 || sgprLimitedWavesPerEu < 1 || estimated !== Math.min(...limits) ||
    result.occupancyComplete !== (lds !== null) ||
    result.spillAdmissible !== (requiredVgprSpillDwordsPerLane === 0 && requiredSgprSpillDwordsPerWave === 0)
  ) fail(`${label} is internally inconsistent`);
  return result;
}

function validateModelSummary(bytes, model, policy, inspectionSha) {
  const fields = canonicalText(bytes, "compiler-model summary").trimEnd().split("\t");
  if (fields.length !== 55) fail("compiler-model summary does not have the exact 55-field V2 shape");
  const integers = fields.slice(0, 14).map((value) => Number(value));
  if (integers.some((value, index) => !Number.isSafeInteger(value) || String(value) !== fields[index])) fail("compiler-model summary prefix is not canonical decimal");
  if (JSON.stringify(integers.slice(0, 4)) !== JSON.stringify([policy, 2, 2, 12]) || integers.slice(4, 8).some((value) => value <= 0) || JSON.stringify(integers.slice(8, 10)) !== JSON.stringify([9, 7])) {
    fail("compiler-model summary does not identify the complete admitted pipeline");
  }
  if (![fields[14], fields[15], fields[16]].every((value) => SHA256.test(value))) fail("compiler-model summary contains an invalid identity");
  const revision = Number(fields[17]);
  const vgprGranule = Number(fields[18]);
  const sgprGranule = Number(fields[19]);
  if (revision !== 3 || vgprGranule < 1 || sgprGranule < 1) fail("compiler-model summary does not identify resource model V3");
  if (
    fields[52] !== SOURCE_ISA_V2_UNAVAILABLE.inspectionStatus ||
    fields[53] !== "none" ||
    fields[54] !== "0"
  ) fail("compiler-model summary invents protected-finalizer Source/ISA V2 evidence");
  const expected = {
    amdCostModelRevision: 2, amdPolicyVersion: 2, canonicalKirVersion: 12,
    inputResources: resourceFromFields(fields, 20, vgprGranule, sgprGranule, "input resource summary"),
    inspectionRecordSha256: fields[14], neutralPolicyVersion: policy,
    outputResources: resourceFromFields(fields, 36, vgprGranule, sgprGranule, "output resource summary"),
    resourceModelRevision: 3, sgprAllocationGranuleDwordsPerWave: sgprGranule,
    sourceIsaCharacteristicV2: SOURCE_ISA_V2_UNAVAILABLE,
    summaryFieldCount: 55, targetKirSha256: fields[15], verifiedTargetKirSha256: fields[16],
    vgprAllocationGranuleDwordsPerLane: vgprGranule,
  };
  const observed = Object.fromEntries(Object.entries(model).filter(([key]) => !["hardwareObserved", "kind", "record"].includes(key)));
  if (!sameJson(observed, expected)) fail("compiler-model JSON differs from its authenticated summary artifact");
  if (model.inspectionRecordSha256 !== inspectionSha || model.targetKirSha256 !== model.verifiedTargetKirSha256) fail("compiler-model final verification identities do not bind the retained inspection");
}

function validateHsacoSummary(bytes, metadata) {
  const fields = canonicalText(bytes, "HSACO resource summary").trimEnd().split("\t");
  if (fields.length !== 11 || fields.slice(0, 9).some((value) => !/^[0-9]+$/u.test(value))) fail("HSACO resource summary has a malformed shape");
  const values = fields.slice(0, 9).map(Number);
  const optional = fields.slice(9).map((value) => value === "na" ? null : Number(value));
  if (values[7] < 1 || values[8] !== 64 || (optional[0] === null) !== (optional[1] === null) || optional.some((value) => value !== null && (!Number.isSafeInteger(value) || value < 1))) fail("HSACO resource summary violates the wave64 occupancy contract");
  const names = ["agprCount", "sgprCount", "vgprCount", "sgprSpillCount", "vgprSpillCount", "groupSegmentFixedBytes", "privateSegmentFixedBytes", "maxFlatWorkgroupSize", "wavefrontSize"];
  const expected = { ...Object.fromEntries(names.map((name, index) => [name, values[index]])), minimumWavesPerEu: optional[0], maximumWavesPerEu: optional[1] };
  const observed = Object.fromEntries(Object.entries(metadata).filter(([key]) => !["hardwareObserved", "kind", "record"].includes(key)));
  if (!sameJson(observed, expected)) fail("HSACO metadata JSON differs from its retained summary artifact");
}

function parseArguments(arguments_) {
  const result = {};
  for (let index = 0; index < arguments_.length; index += 1) {
    const key = arguments_[index];
    const value = arguments_[index + 1];
    if (!value || value.startsWith("--")) fail(`${key} requires a value`);
    index += 1;
    if (key === "--manifest") result.manifest = value;
    else if (key === "--schema") result.schema = value;
    else if (key === "--evidence") result.evidence = value;
    else if (key === "--artifact-root") result.artifactRoot = value;
    else if (key === "--source-isa-v2-fixture") result.sourceIsaV2Fixture = value;
    else fail(`unknown argument ${key}`);
  }
  if (!result.evidence || !result.artifactRoot) fail("--evidence and --artifact-root are required");
  return result;
}

function main() {
  const repositoryRoot = resolve(new URL("..", import.meta.url).pathname);
  const arguments_ = parseArguments(process.argv.slice(2));
  const manifestPath = resolve(arguments_.manifest ?? resolve(repositoryRoot, "config/tutorial-kernel-manifest-v1.json"));
  const schemaPath = resolve(arguments_.schema ?? resolve(repositoryRoot, "config/tutorial-gfx942-hardware-evidence-schema-v1.json"));
  const artifactRoot = resolve(arguments_.artifactRoot);
  let rootMetadata;
  try { rootMetadata = lstatSync(artifactRoot); } catch (error) { fail(`cannot inspect artifact root: ${error.message}`); }
  if (!rootMetadata.isDirectory() || rootMetadata.isSymbolicLink()) fail("artifact root must be a real directory");
  const manifest = readJson(manifestPath, "manifest");
  const schema = readJson(schemaPath, "schema");
  if (sha256(schema.bytes) !== SCHEMA_SHA256) fail("hardware evidence schema differs from the compiler contract");
  const evidence = readJson(resolve(arguments_.evidence), "evidence").document;
  validateSchema(evidence, schema.document, schema.document);
  validateSourceIsaFixture(
    resolve(arguments_.sourceIsaV2Fixture ?? resolve(repositoryRoot, SOURCE_ISA_V2_FIXTURE_PATH)),
    evidence.sourceIsaCharacteristicV2,
  );

  const cases = manifestCases(manifest.document);
  if (
    evidence.manifest.schema !== manifest.document.schema || evidence.manifest.sha256 !== sha256(manifest.bytes) ||
    evidence.manifest.bytes !== manifest.bytes.length || evidence.manifest.caseCount !== cases.length ||
    evidence.manifest.corpusContractSha256 !== tutorialCorpusContractSha256(manifest.document)
  ) fail("evidence does not bind the exact raw manifest and stable corpus contract");
  if (!sameJson(evidence.productionContract, manifest.document.productionContract)) fail("evidence production contract differs from the manifest");
  if (evidence.productionContract.requiredPolicyVersion !== 4) fail("hardware evidence requires production neutral policy V4");
  if (evidence.cases.length !== cases.length) fail("evidence case count differs from the manifest gfx942 matrix");

  const seen = new Set();
  const records = new Map();
  const capture = (record, label) => {
    const result = checkFileRecord(artifactRoot, record, label, seen);
    records.set(record.path, result);
    return result.bytes;
  };
  const commandBytes = capture(evidence.records.commands, "command record");
  const identityBytes = capture(evidence.records.identity, "identity record");
  const resultBytes = capture(evidence.records.results, "result record");
  const rocminfoBytes = capture(evidence.records.rocminfo, "rocminfo record");
  evidence.records.buildLogs.forEach((record, index) => capture(record, `build log ${index}`));
  if (
    evidence.records.commands.path !== "commands.txt" || evidence.records.identity.path !== "identity.txt" ||
    evidence.records.results.path !== "results.tsv" || evidence.records.rocminfo.path !== "rocminfo.txt" ||
    JSON.stringify(evidence.records.buildLogs.map((record) => record.path)) !== JSON.stringify(["logs/build-extractor.log", "logs/build-inspector.log"])
  ) fail("top-level record paths differ from the completed hardware-run contract");
  if (!/(?:^|\n)\s*Name:\s+gfx942\s*(?:\n|$)/u.test(rocminfoBytes.toString("ascii"))) fail("rocminfo record does not identify gfx942");
  validateIdentity(identityBytes, evidence, cases, sha256(rocminfoBytes));
  validateCommands(commandBytes, cases);

  evidence.cases.forEach((item, index) => {
    const expected = cases[index];
    if (item.ordinal !== index || item.fixtureId !== expected.fixtureId || item.testId !== expected.testId || item.caseId !== expected.caseId) fail(`case ${index} differs from the manifest matrix`);
    const expectedPrefix = `artifacts/${item.caseId}/`;
    const llvm = item.artifacts.llvmIr;
    const hsaco = item.artifacts.hsaco;
    const inspection = item.artifacts.compilerInspection;
    if (!llvm.path.startsWith(expectedPrefix) || !llvm.path.endsWith(".ll") || hsaco.path !== `${expectedPrefix}${expected.artifactName}` || inspection.path !== `${llvm.path}.fe2o3-compiler-inspection-v2`) {
      fail(`case ${item.caseId} artifact paths differ from the manifest and inspection V2 contract`);
    }
    capture(llvm, `LLVM IR ${item.caseId}`);
    capture(hsaco, `HSACO ${item.caseId}`);
    const inspectionBytes = capture(inspection, `inspection V2 ${item.caseId}`);
    if (!inspectionBytes.subarray(0, 8).equals(Buffer.from("F2KIRP02", "ascii"))) fail(`case ${item.caseId} inspection artifact is not inspection V2`);
    const model = item.observations.compilerModel;
    const metadata = item.observations.hsacoMetadata;
    const execution = item.observations.hardwareExecution;
    if (model.neutralPolicyVersion !== 4 || model.amdPolicyVersion !== 2 || model.amdCostModelRevision !== 2 || model.resourceModelRevision !== 3 || model.canonicalKirVersion !== 12) fail(`case ${item.caseId} does not bind the complete admitted compiler model`);
    if (model.record.path !== `${expectedPrefix}inspection-summary.tsv` || metadata.record.path !== `${expectedPrefix}resource-summary.tsv` || execution.hostLog.path !== `logs/${item.caseId}.log`) fail(`case ${item.caseId} observation paths differ from the matrix contract`);
    const modelBytes = capture(model.record, `compiler-model summary ${item.caseId}`);
    const metadataBytes = capture(metadata.record, `HSACO summary ${item.caseId}`);
    const hostBytes = capture(execution.hostLog, `hardware host log ${item.caseId}`);
    const lowered = hostBytes.toString("utf8").toLowerCase();
    if (lowered.includes("compile pass:") || lowered.includes("hardware execution skipped") || lowered.includes("hardware_observed=false")) fail(`case ${item.caseId} host log is compile-only evidence`);
    validateModelSummary(modelBytes, model, 4, inspection.sha256);
    validateHsacoSummary(metadataBytes, metadata);
  });
  validateResults(resultBytes, cases, evidence.cases);
  console.log(`validated tutorial gfx942 hardware evidence: ${cases.length} cases, production V4 / inspection V2 / AMD resource V3`);
}

try { main(); } catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
