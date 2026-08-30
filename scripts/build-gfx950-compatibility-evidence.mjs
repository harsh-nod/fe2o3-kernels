#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const sourceCommit = "c766ca761c492c4cd188047a497664f6b2ade278";
const sourceTree = "cbda6eba10b34acb3eec93c6e504462fca3c8705";
const campaignId = "gfx950-final-compatibility-c766ca761-gpu6";
const identityCampaignId = "gfx950-final-input-identity-c766ca761-gpu6";
const retainedRemoteRoot = `/home/harmenon/perf-runs/${campaignId}`;
const canonicalDigest = /^[0-9a-f]{64}$/u;
const canonicalGitObject = /^[0-9a-f]{40}$/u;

const args = process.argv.slice(2);
const [
  resultsArgument,
  identitiesArgument,
  logsArgument,
  coreRepositoryArgument,
  rejectionLogsArgument,
  outputArgument,
] = args;
if (
  args.length !== 6 ||
  !resultsArgument ||
  !identitiesArgument ||
  !logsArgument ||
  !coreRepositoryArgument ||
  !rejectionLogsArgument ||
  !outputArgument
) {
  throw new Error(
    "usage: build-gfx950-compatibility-evidence.mjs <results.tsv> <input-identities.jsonl> <campaign-logs-dir> <core-repo> <rejection-logs-dir> <output.json>",
  );
}

const resultsPath = resolve(resultsArgument);
const identitiesPath = resolve(identitiesArgument);
const logsPath = resolve(logsArgument);
const coreRepository = resolve(coreRepositoryArgument);
const rejectionLogsPath = resolve(rejectionLogsArgument);
const outputPath = resolve(outputArgument);

function fail(message) {
  throw new Error(`gfx950 compatibility evidence: ${message}`);
}

function requireCondition(condition, message) {
  if (!condition) fail(message);
}

function readRegularFile(path, label) {
  let metadata;
  try {
    metadata = statSync(path);
  } catch (error) {
    fail(`${label} is unavailable at ${path}: ${error.message}`);
  }
  requireCondition(metadata.isFile(), `${label} is not a regular file: ${path}`);
  return readFileSync(path);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function git(arguments_, encoding = "utf8") {
  const result = spawnSync("git", ["-C", coreRepository, ...arguments_], {
    encoding,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    fail(
      `git ${arguments_.join(" ")} failed in ${coreRepository}: ${result.error?.message ?? String(result.stderr).trim()}`,
    );
  }
  return result.stdout;
}

function parseKeyValue(bytes, label) {
  const entries = new Map();
  for (const [index, line] of bytes.toString("utf8").trimEnd().split(/\r?\n/u).entries()) {
    const separator = line.indexOf("=");
    requireCondition(separator > 0, `${label} line ${index + 1} is not key=value`);
    const key = line.slice(0, separator);
    const value = line.slice(separator + 1);
    requireCondition(!entries.has(key), `${label} repeats key ${key}`);
    entries.set(key, value);
  }
  return entries;
}

function parseChecksums(bytes, label) {
  const entries = new Map();
  for (const [index, line] of bytes.toString("utf8").trimEnd().split(/\r?\n/u).entries()) {
    const match = line.match(/^([0-9a-f]{64})  (\S.*)$/u);
    requireCondition(match !== null, `${label} line ${index + 1} is malformed`);
    const [, digest, path] = match;
    requireCondition(!entries.has(path), `${label} repeats path ${path}`);
    entries.set(path, digest);
  }
  return entries;
}

const expectedColumns = [
  "ordinal", "suite", "feature", "variant", "symbol", "binding",
  "llvm_sha256", "hsaco_sha256", "isa_sha256", "result", "log",
  "llvm", "hsaco", "isa",
];

const attentionKernel = "examples/gfx950_advanced_attention/src/kernel.rs";
const attentionAblation = "examples/gfx950_advanced_attention/src/ablation.rs";
const systemsKernel = "examples/gfx950_advanced_systems/src/kernel.rs";
const gptRoot = "examples/gfx950_gpt_oss_decode/src";
const expectedMatrix = [
  ["attention", "kernel-kda-decode", "baseline", "gfx950_kda_gdn_decode", attentionKernel],
  ["attention", "kernel-kda-decode-wave-tiled-v1", "wave-tiled", "gfx950_kda_gdn_decode", attentionAblation],
  ["attention", "kernel-kda-prefill", "baseline", "gfx950_kda_gdn_prefill", attentionKernel],
  ["attention", "kernel-kda-prefill-channel-mask-v1", "channel-mask", "gfx950_kda_gdn_prefill", attentionKernel],
  ["attention", "kernel-content-sparse-attention", "baseline", "gfx950_content_sparse_attention", attentionKernel],
  ["attention", "kernel-content-sparse-attention-reciprocal-reuse-v1", "reciprocal-reuse", "gfx950_content_sparse_attention", attentionAblation],
  ["attention", "kernel-compressed-hybrid-attention-division-baseline-v1", "division-baseline", "gfx950_compressed_hybrid_attention", attentionAblation],
  ["attention", "kernel-compressed-hybrid-attention", "reciprocal-reuse", "gfx950_compressed_hybrid_attention", attentionKernel],
  ["attention", "kernel-attnres-aggregate", "baseline", "gfx950_attnres_aggregate", attentionKernel],
  ["attention", "kernel-attnres-aggregate-explicit-reuse-v1", "explicit-reuse", "gfx950_attnres_aggregate", attentionAblation],
  ["attention", "kernel-four-branch-residual", "baseline", "gfx950_four_branch_residual", attentionKernel],
  ["attention", "kernel-four-branch-residual-explicit-v1", "explicit-reuse", "gfx950_four_branch_residual", attentionAblation],
  ["attention", "kernel-mhc-sinkhorn-mix-scalar-v1", "scalar", "gfx950_mhc_sinkhorn_mix", attentionAblation],
  ["attention", "kernel-mhc-sinkhorn-mix", "distributed-wave16", "gfx950_mhc_sinkhorn_mix", attentionKernel],
  ["systems", "kernel-moe-route", "canonical", "gfx950_moe_route_fp4_t16_e4_k2_v1", systemsKernel],
  ["systems", "kernel-moe-expert-rank", "canonical", "gfx950_moe_expert_rank_fp4_fp8_v1", systemsKernel],
  ["systems", "kernel-moe-expert-rank", "expert-serial", "gfx950_moe_expert_rank_fp4_fp8_v1", systemsKernel],
  ["systems", "kernel-combine-expert-ranks", "canonical", "gfx950_combine_expert_ranks_v1", systemsKernel],
  ["systems", "kernel-speculative-transaction", "canonical", "gfx950_speculative_transaction_v1", systemsKernel],
  ["systems", "kernel-speculative-transaction", "speculative-recompute-prefix", "gfx950_speculative_transaction_v1", systemsKernel],
  ["systems", "kernel-qwen-ngram-gather", "canonical", "gfx950_qwen_ngram_gather_v1", systemsKernel],
  ["systems", "kernel-qwen-ngram-gather", "ngram-reverse-probe", "gfx950_qwen_ngram_gather_v1", systemsKernel],
  ["systems", "kernel-stage-gradient-shard", "canonical", "gfx950_stage_gradient_shard_v1", systemsKernel],
  ["systems", "kernel-muon-update", "canonical", "gfx950_muon_update_4x4_v1", systemsKernel],
  ["systems", "kernel-muon-update", "muon-broadcast16", "gfx950_muon_update_4x4_v1", systemsKernel],
  ["gpt_oss", "kernel-gpt-oss-decode", "optimized", "gfx950_gpt_oss_120b_decode_megakernel_v1", `${gptRoot}/kernel.rs`],
  ["gpt_oss", "kernel-gpt-oss-decode-router-serial", "serial-router", "gfx950_gpt_oss_120b_decode_megakernel_v1", `${gptRoot}/kernel_router_serial.rs`],
  ["gpt_oss", "kernel-gpt-oss-decode-held-fragments", "held-fragments", "gfx950_gpt_oss_120b_decode_megakernel_v1", `${gptRoot}/kernel_held_fragments.rs`],
  ["gpt_oss", "kernel-gpt-oss-decode-interleaved-stores", "interleaved-stores", "gfx950_gpt_oss_120b_decode_megakernel_v1", `${gptRoot}/kernel_interleaved_stores.rs`],
  ["gpt_oss", "kernel-gpt-oss-router-component", "materialized-router", "gfx950_gpt_oss_120b_router_v1", `${gptRoot}/kernel_components.rs`],
  ["gpt_oss", "kernel-gpt-oss-attention-component", "materialized-attention", "gfx950_gpt_oss_120b_attention_v1", `${gptRoot}/kernel_components.rs`],
  ["gpt_oss", "kernel-gpt-oss-expert-component", "materialized-expert", "gfx950_gpt_oss_120b_expert_v1", `${gptRoot}/kernel_components.rs`],
];

const rejectionSpecifications = [
  {
    variant: "scalar-attention",
    feature: "kernel-gpt-oss-decode-scalar-attention",
    logFile: "scalar-attention.log",
    diagnostic: "a call terminator before exact callable memory-effect summaries are available",
    reasonFragments: ["call terminator", "exact callable memory-effect summaries"],
    sourcePath: `${gptRoot}/kernel_scalar_attention.rs`,
  },
  {
    variant: "pipelined-attention",
    feature: "kernel-gpt-oss-decode-pipelined-attention",
    logFile: "pipelined-attention.log",
    diagnostic: "a pipeline scalar is not an exact unsigned index expression",
    reasonFragments: ["pipeline scalar", "exact unsigned index expression"],
    sourcePath: `${gptRoot}/kernel_pipelined_attention.rs`,
  },
];

requireCondition(
  git(["rev-parse", "--is-inside-work-tree"]).trim() === "true",
  `${coreRepository} is not a Git worktree`,
);
git(["cat-file", "-e", `${sourceCommit}^{commit}`]);
requireCondition(
  git(["show", "-s", "--format=%T", sourceCommit]).trim() === sourceTree,
  `source commit ${sourceCommit} does not resolve to tree ${sourceTree}`,
);

const registryPath = "examples/gfx950_gpt_oss_decode/ablation-variants-v1.json";
const sourcePaths = [
  ...new Set([
    ...expectedMatrix.map((entry) => entry[4]),
    ...rejectionSpecifications.map((entry) => entry.sourcePath),
    registryPath,
  ]),
].sort();
const dirtySources = git([
  "status", "--porcelain=v1", "--untracked-files=all", "--", ...sourcePaths,
]).trim();
requireCondition(dirtySources.length === 0, `core source paths are dirty:\n${dirtySources}`);

const sourceProvenance = new Map();
for (const sourcePath of sourcePaths) {
  git(["cat-file", "-e", `${sourceCommit}:${sourcePath}`]);
  const bytes = git(["show", `${sourceCommit}:${sourcePath}`], null);
  const blob = git(["rev-parse", `${sourceCommit}:${sourcePath}`]).trim();
  requireCondition(canonicalGitObject.test(blob), `${sourcePath} has malformed Git blob ${blob}`);
  requireCondition(
    git(["hash-object", sourcePath]).trim() === blob,
    `${sourcePath} in the core worktree does not match ${sourceCommit}`,
  );
  sourceProvenance.set(sourcePath, { blob, sha256: sha256(bytes) });
}

const environmentPath = join(logsPath, "environment.txt");
const checksumsPath = join(logsPath, "SHA256SUMS");
const inputChecksumPath = join(logsPath, "input-identities.SHA256");
const environmentBytes = readRegularFile(environmentPath, "campaign environment");
const checksumsBytes = readRegularFile(checksumsPath, "campaign checksum manifest");
const inputChecksumBytes = readRegularFile(inputChecksumPath, "input identity checksum");
const environment = parseKeyValue(environmentBytes, "campaign environment");
const expectedEnvironment = new Map([
  ["source_commit", sourceCommit],
  ["source_tree", sourceTree],
  ["hostname", "smci350-rck-g03-b19-03"],
  ["physical_gpu", "6"],
  ["gpu_unique_id", "0x92050148915dd40c"],
  ["rocr_visible_devices", "6"],
  ["hip_visible_devices", "unset"],
  ["rocm_version", "7.2.1"],
  ["rust_toolchain", "nightly-2026-04-03"],
  ["code_object_version", "6"],
  ["target", "gfx950:xnack-"],
]);
requireCondition(
  environment.size === expectedEnvironment.size,
  "campaign environment has unexpected or missing fields",
);
for (const [key, value] of expectedEnvironment) {
  requireCondition(environment.get(key) === value, `campaign environment ${key} is not ${value}`);
}
const campaignChecksums = parseChecksums(checksumsBytes, "campaign checksum manifest");
const expectedCampaignChecksumPaths = new Set(["environment.txt", "results.tsv"]);
requireCondition(
  campaignChecksums.get("environment.txt") === sha256(environmentBytes),
  "campaign environment does not match SHA256SUMS",
);

const resultsBytes = readRegularFile(resultsPath, "results TSV");
const resultLines = resultsBytes.toString("utf8").trimEnd().split(/\r?\n/u);
requireCondition(resultLines.length === expectedMatrix.length + 1, "results TSV must contain exactly 32 rows");
requireCondition(
  resultLines[0] === expectedColumns.join("\t"),
  `results TSV header must be ${expectedColumns.join("\\t")}`,
);
const results = resultLines.slice(1).map((line, rowIndex) => {
  const fields = line.split("\t");
  requireCondition(
    fields.length === expectedColumns.length,
    `results TSV row ${rowIndex + 2} has ${fields.length} fields`,
  );
  return Object.fromEntries(expectedColumns.map((column, index) => [column, fields[index]]));
});
const resultsDigest = sha256(resultsBytes);
requireCondition(
  campaignChecksums.get("results.tsv") === resultsDigest,
  "results TSV does not match campaign SHA256SUMS",
);

const identityBytes = readRegularFile(identitiesPath, "input identities JSONL");
const identityDigest = sha256(identityBytes);
const inputChecksumMatch = inputChecksumBytes
  .toString("utf8")
  .trim()
  .match(/^([0-9a-f]{64})  (\S*input-identities\.jsonl)$/u);
requireCondition(inputChecksumMatch !== null, "input identity checksum file is malformed");
requireCondition(inputChecksumMatch[1] === identityDigest, "input identities do not match their checksum file");
const identities = identityBytes
  .toString("utf8")
  .trimEnd()
  .split(/\r?\n/u)
  .map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      fail(`input identity line ${index + 1} is not JSON: ${error.message}`);
    }
  });
requireCondition(identities.length > 0, "input identities JSONL is empty");

const recordIds = new Set();
const expectedVariantIds = new Set(
  expectedMatrix.map(
    ([, feature, variant], index) =>
      `${String(index + 1).padStart(2, "0")}-${feature}-${variant}`,
  ),
);
for (const [index, identity] of identities.entries()) {
  const label = `input identity line ${index + 1}`;
  requireCondition(identity.schema === "fe2o3.gfx950.advanced-dispatch-sample.v1", `${label} has wrong schema`);
  requireCondition(identity.campaign_id === identityCampaignId, `${label} has wrong campaign ID`);
  requireCondition(identity.implementation?.id === "fe2o3-rust-compatibility", `${label} has wrong implementation ID`);
  requireCondition(expectedVariantIds.has(identity.implementation?.variant), `${label} has unknown variant`);
  requireCondition(!recordIds.has(identity.record_id), `${label} repeats record ID ${identity.record_id}`);
  recordIds.add(identity.record_id);
  requireCondition(
    identity.record_id.startsWith(`${identityCampaignId}:${identity.implementation.variant}:`),
    `${label} record ID is outside its campaign or variant`,
  );
  requireCondition(identity.artifact?.source_commit === sourceCommit, `${label} has wrong source commit`);
  requireCondition(identity.artifact?.source_tree === sourceTree, `${label} has wrong source tree`);
  requireCondition(
    identity.environment?.rocr_visible_devices === environment.get("rocr_visible_devices"),
    `${label} has wrong ROCr-visible device`,
  );
  requireCondition(
    identity.environment?.hip_visible_devices === null,
    `${label} has an unexpected HIP-visible device override`,
  );
  requireCondition(identity.environment?.physical_device?.target === "gfx950:xnack-", `${label} has wrong target`);
  requireCondition(identity.environment?.physical_device?.hip_ordinal === 0, `${label} has wrong visible HIP ordinal`);
  requireCondition(identity.correctness?.passed === true, `${label} did not pass correctness`);
  requireCondition(identity.correctness?.guard_canaries_checked === true, `${label} lacks canary validation`);
  requireCondition(identity.correctness?.preflight_dispatch_checked === true, `${label} lacks preflight validation`);
  requireCondition(identity.correctness?.post_block_checked === true, `${label} lacks post-block validation`);
  requireCondition(identity.correctness?.oracle === "current-repository-cpu-reference", `${label} has wrong oracle`);
  requireCondition(canonicalDigest.test(identity.workload?.input_sha256), `${label} has malformed workload digest`);
  requireCondition(Array.isArray(identity.workload?.buffers) && identity.workload.buffers.length > 0, `${label} has no buffers`);
  for (const buffer of identity.workload.buffers) {
    requireCondition(canonicalDigest.test(buffer.initial_sha256), `${label} has malformed buffer digest`);
    requireCondition(typeof buffer.oracle?.kind === "string" && buffer.oracle.kind.length > 0, `${label} has malformed buffer oracle`);
  }
}

function checkedWorkloads(result, ordinalText) {
  const variantId = `${ordinalText}-${result.feature}-${result.variant}`;
  const matching = identities.filter(
    (identity) => identity.implementation.variant === variantId,
  );
  requireCondition(matching.length > 0, `no input identity for ${variantId}`);
  const unique = new Map();
  for (const identity of matching) {
    const artifact = identity.artifact;
    requireCondition(artifact.kernel_export === result.symbol, `${variantId} identity has wrong kernel export`);
    for (const [field, expected] of [
      ["crate_binding_sha256", result.binding],
      ["llvm_sha256", result.llvm_sha256],
      ["hsaco_sha256", result.hsaco_sha256],
      ["isa_sha256", result.isa_sha256],
    ]) {
      requireCondition(artifact[field] === expected, `${variantId} identity disagrees on ${field}`);
    }
    const workload = identity.workload;
    const key = `${workload.id}:${workload.input_sha256}`;
    const serialized = JSON.stringify(workload);
    if (unique.has(key)) {
      requireCondition(unique.get(key).serialized === serialized, `${variantId} has conflicting duplicate workload ${key}`);
    } else {
      unique.set(key, { serialized, workload });
    }
  }
  return [...unique.values()].map((entry) => entry.workload);
}

function checkedNumericalLog(result, expectedLogFile) {
  const logBytes = readRegularFile(join(logsPath, expectedLogFile), `case log ${expectedLogFile}`);
  const text = logBytes.toString("utf8");
  const passLines = [...text.matchAll(/^PASS (.+)$/gmu)].map((match) => match[1].trim());
  const numerical = passLines.filter((line) =>
    /(?:\boutputs=\d+\b|\bexact_(?:i32|u32)_outputs=\d+\b|\bmax_absolute_error=)/u.test(line),
  );
  requireCondition(numerical.length > 0, `${expectedLogFile} has no numerical PASS result`);
  requireCondition(
    passLines.some((line) => line.includes("production HSA verification")),
    `${expectedLogFile} lacks the production HSA verification PASS`,
  );
  requireCondition(
    passLines.includes(`${result.symbol} production Rust gfx950 build and numerical run`),
    `${expectedLogFile} lacks the final symbol-scoped production PASS`,
  );
  return { digest: sha256(logBytes), numerical };
}

const expectedCampaignLogFiles = expectedMatrix.map(
  ([suite, feature, variant], index) =>
    `case${String(index + 1).padStart(2, "0")}-${suite}-${feature}-${variant}.log`,
).sort();
const campaignLogFiles = readdirSync(logsPath)
  .filter((path) => path.startsWith("case") && path.endsWith(".log"))
  .sort();
requireCondition(
  JSON.stringify(campaignLogFiles) === JSON.stringify(expectedCampaignLogFiles),
  "campaign log directory must contain exactly the ordered matrix's 32 case logs",
);

const consumedIdentityVariants = new Set();
const cases = results.map((result, index) => {
  const ordinalText = String(index + 1).padStart(2, "0");
  const [suite, feature, variant, symbol, sourcePath] = expectedMatrix[index];
  for (const [field, expected] of [
    ["ordinal", ordinalText], ["suite", suite], ["feature", feature],
    ["variant", variant], ["symbol", symbol],
  ]) {
    requireCondition(result[field] === expected, `results row ${index + 1} has wrong ${field}`);
  }
  requireCondition(result.result === "PASS", `results row ${ordinalText} is not PASS`);
  for (const field of ["binding", "llvm_sha256", "hsaco_sha256", "isa_sha256"]) {
    requireCondition(canonicalDigest.test(result[field]), `results row ${ordinalText} has malformed ${field}`);
  }

  const caseStem = `case${ordinalText}-${suite}-${feature}-${variant}`;
  const expectedLogFile = `${caseStem}.log`;
  requireCondition(result.log === `${retainedRemoteRoot}/${expectedLogFile}`, `results row ${ordinalText} has wrong log path`);
  for (const [field, extension] of [["llvm", "ll"], ["hsaco", "hsaco"], ["isa", "isa"]]) {
    const artifactPrefix = `${retainedRemoteRoot}/${caseStem}/attempt.`;
    requireCondition(result[field].startsWith(artifactPrefix), `results row ${ordinalText} has wrong ${field} path`);
    const artifactSuffix = result[field].slice(artifactPrefix.length);
    const artifactMatch = artifactSuffix.match(/^([A-Za-z0-9]+)\/(.+)$/u);
    requireCondition(
      artifactMatch !== null && artifactMatch[2] === `${feature}.${extension}`,
      `results row ${ordinalText} has wrong ${field} attempt or filename`,
    );
    const relativePath = result[field].slice(retainedRemoteRoot.length + 1);
    expectedCampaignChecksumPaths.add(relativePath);
    requireCondition(
      campaignChecksums.get(relativePath) === result[`${field}_sha256`],
      `results row ${ordinalText} ${field} digest disagrees with SHA256SUMS`,
    );
  }

  const variantId = `${ordinalText}-${feature}-${variant}`;
  consumedIdentityVariants.add(variantId);
  const workloads = checkedWorkloads(result, ordinalText);
  const log = checkedNumericalLog(result, expectedLogFile);
  const source = sourceProvenance.get(sourcePath);
  const validatedPass = result.result.toLowerCase();
  return {
    ordinal: index + 1,
    suite,
    feature,
    variant,
    kernel_export: symbol,
    source_path: sourcePath,
    source_blob: source.blob,
    source_sha256: source.sha256,
    artifact: {
      crate_binding_sha256: result.binding,
      llvm_sha256: result.llvm_sha256,
      hsaco_sha256: result.hsaco_sha256,
      isa_sha256: result.isa_sha256,
      target: environment.get("target"),
      code_object_version: Number(environment.get("code_object_version")),
      wavefront_size: 64,
    },
    run_log: { file: expectedLogFile, sha256: log.digest },
    workloads,
    gates: {
      production_rust_extraction: validatedPass,
      exact_target_and_abi_metadata: validatedPass,
      symbol_scoped_isa: validatedPass,
      digest_pinned_hsa_launch: validatedPass,
      independent_cpu_reference: validatedPass,
      output_canaries: validatedPass,
      immutable_inputs: validatedPass,
      finite_output_policy: validatedPass,
    },
    numerical_results: log.numerical,
    result: validatedPass,
  };
});
requireCondition(
  campaignChecksums.size === expectedCampaignChecksumPaths.size &&
    [...expectedCampaignChecksumPaths].every((path) => campaignChecksums.has(path)),
  "campaign SHA256SUMS must contain exactly environment.txt, results.tsv, and the matrix's 96 artifacts",
);
requireCondition(
  consumedIdentityVariants.size === expectedVariantIds.size &&
    [...expectedVariantIds].every((variantId) => consumedIdentityVariants.has(variantId)),
  "not every expected identity variant was consumed",
);

const registryBytes = git(["show", `${sourceCommit}:${registryPath}`], null);
let rejectedRegistry;
try {
  rejectedRegistry = JSON.parse(registryBytes.toString("utf8"));
} catch (error) {
  fail(`core rejection registry is not JSON: ${error.message}`);
}
requireCondition(
  Array.isArray(rejectedRegistry.rejected),
  "core registry has no rejected candidate list",
);
const compilerRejected = rejectedRegistry.rejected.filter(
  (candidate) => candidate.status === "compiler-rejected",
);
requireCondition(compilerRejected.length === 2, "core registry must contain exactly two compiler-rejected candidates");
const rejectionLogFiles = readdirSync(rejectionLogsPath)
  .filter((path) => path.endsWith(".log"))
  .sort();
requireCondition(
  JSON.stringify(rejectionLogFiles) ===
    JSON.stringify(rejectionSpecifications.map((entry) => entry.logFile).sort()),
  "rejection log directory must contain exactly scalar-attention.log and pipelined-attention.log",
);
const rejectedCandidates = rejectionSpecifications.map((specification) => {
  const candidate = compilerRejected.find(
    (entry) => entry.variant === specification.variant,
  );
  requireCondition(candidate !== undefined, `core registry lacks rejected ${specification.variant}`);
  requireCondition(candidate.feature === specification.feature, `${specification.variant} has wrong feature`);
  for (const fragment of specification.reasonFragments) {
    requireCondition(candidate.reason.includes(fragment), `${specification.variant} registry reason lacks ${fragment}`);
  }
  const logBytes = readRegularFile(
    join(rejectionLogsPath, specification.logFile),
    `${specification.variant} rejection log`,
  );
  const logText = logBytes.toString("utf8");
  requireCondition(logText.includes(specification.diagnostic), `${specification.variant} log lacks exact diagnostic`);
  requireCondition(logText.includes(`feature=\"${specification.feature}\"`), `${specification.variant} log lacks feature identity`);
  requireCondition(logText.includes(campaignId), `${specification.variant} log is outside final campaign ${campaignId}`);
  requireCondition(logText.includes("error: could not compile"), `${specification.variant} log lacks compilation failure`);
  requireCondition(logText.includes("exit status: 1"), `${specification.variant} log lacks failed exit status`);
  const source = sourceProvenance.get(specification.sourcePath);
  return {
    variant: candidate.variant,
    feature: candidate.feature,
    status: candidate.status,
    reason: candidate.reason,
    retained_conclusion: candidate.retained_conclusion,
    diagnostic: specification.diagnostic,
    source_path: specification.sourcePath,
    source_blob: source.blob,
    source_sha256: source.sha256,
    rejection_log: { file: specification.logFile, sha256: sha256(logBytes) },
  };
});

const evidence = {
  schema: "fe2o3.gfx950.integrated-compatibility-matrix.v1",
  claim_boundary: {
    scope: "exact fixed-shape production Rust artifacts and ablation variants",
    performance_measurements_included: false,
    universal_state_of_the_art_claim: false,
    whole_model_claim: false,
    note: "This timing-free matrix records compilation, ISA, ABI, workload identity, and numerical compatibility. Historical performance evidence remains a separate artifact.",
  },
  campaign: {
    id: campaignId,
    observed_date: "2026-08-30",
    source_commit: sourceCommit,
    source_tree: sourceTree,
    source_registry_path: registryPath,
    source_registry_blob: sourceProvenance.get(registryPath).blob,
    source_registry_sha256: sourceProvenance.get(registryPath).sha256,
    host: environment.get("hostname"),
    ssh_alias: "mi350",
    physical_gpu: Number(environment.get("physical_gpu")),
    gpu_unique_id: environment.get("gpu_unique_id"),
    rocr_visible_devices: environment.get("rocr_visible_devices"),
    hip_visible_devices: null,
    rocm_version: environment.get("rocm_version"),
    rust_toolchain: environment.get("rust_toolchain"),
    environment_sha256: sha256(environmentBytes),
    results_tsv_sha256: resultsDigest,
    campaign_checksums_sha256: sha256(checksumsBytes),
    input_identity_jsonl_sha256: identityDigest,
    input_identity_checksum_file_sha256: sha256(inputChecksumBytes),
    retained_remote_root: retainedRemoteRoot,
  },
  summary: {
    cases: cases.length,
    passed: results.filter((entry) => entry.result === "PASS").length,
    rejected_candidates: rejectedCandidates.length,
  },
  cases,
  rejected_candidates: rejectedCandidates,
};

writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
