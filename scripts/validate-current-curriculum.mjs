#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";

function fail(detail) {
  throw new Error(`current curriculum: ${detail}`);
}

const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== "--compiler-repository" || !isAbsolute(args[1])) {
  fail("usage: node scripts/validate-current-curriculum.mjs --compiler-repository /ABS/compiler");
}
const site = realpathSync(fileURLToPath(new URL("../", import.meta.url)));
const compiler = realpathSync(args[1]);
const environment = { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0", GIT_TERMINAL_PROMPT: "0" };
for (const key of ["GIT_DIR", "GIT_COMMON_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_OBJECT_DIRECTORY", "GIT_ALTERNATE_OBJECT_DIRECTORIES"]) {
  delete environment[key];
}

function run(command, arguments_) {
  const result = spawnSync(command, arguments_, {
    cwd: site, env: environment, timeout: 180_000, maxBuffer: 16 * 1024 * 1024 + 1,
  });
  if (result.error || result.status !== 0) {
    fail(`${command} failed: ${result.error?.message ?? String(result.stderr).slice(-4096)}`);
  }
  return result.stdout;
}

function git(arguments_) {
  return run("git", ["--no-replace-objects", "-c", "core.fsmonitor=false", "-c", "core.untrackedCache=false",
    "-C", compiler, ...arguments_]).toString("utf8");
}

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function compilerInput() {
  if (git(["status", "--porcelain=v1", "-z", "--untracked-files=all"]) !== "") fail("compiler checkout must be clean");
  if (git(["ls-files", "-v", "-z"]).split("\0").filter(Boolean).some((row) => !row.startsWith("H "))) {
    fail("compiler tracked files may not hide skip-worktree or assume-unchanged content");
  }
  const commit = git(["rev-parse", "--verify", "HEAD^{commit}"]).trim();
  const tree = git(["show", "-s", "--format=%T", commit]).trim();
  if (!/^[0-9a-f]{40}$/u.test(commit) || !/^[0-9a-f]{40}$/u.test(tree)) fail("compiler identity is malformed");
  return { commit, tree, manifestSha256: sha256(readFileSync(join(compiler, "config/tutorial-kernel-manifest-v1.json"))) };
}

const before = compilerInput();
const directory = mkdtempSync(join(tmpdir(), "fe2o3-current-curriculum-"));
let summary;
let failed = false;
let failure;
try {
  const inventory = join(directory, "runtime.json");
  run(process.execPath, [join(site, "scripts/export-curriculum-inventory.mjs"), "--compiler-repository", compiler, "--output", inventory]);
  const checker = ["-I", "-B", join(compiler, "scripts/validate-tutorial-kernel-manifest.py"), "--repo-root", compiler];
  run("python3", [...checker, "--require-curriculum", "--site-inventory", inventory]);
  const pairs = run("python3", [...checker, "--emit-kernel-pairs", "--site-inventory", inventory]);
  const report = JSON.parse(pairs.toString("utf8"));
  const projection = readFileSync(inventory);
  if (report.schema !== "fe2o3-tutorial-kernel-pair-obligations-v2"
      || report.kernelInventory?.runtimeCensusValidated !== true
      || !isDeepStrictEqual(report.runtimeProjectionSite, JSON.parse(projection.toString("utf8")).site)) {
    fail("compiler did not return the exact current runtime census");
  }
  const after = compilerInput();
  if (JSON.stringify(before) !== JSON.stringify(after)) fail("compiler inputs changed during validation");
  summary = {
    compilerInput: before,
    runtimeProjectionSha256: sha256(projection),
    kernelPairReportSha256: sha256(pairs),
    runtimeProjectionSite: report.runtimeProjectionSite,
    qualified: report.qualified,
    inventoryComplete: report.inventoryComplete,
    runtimeCensusValidated: report.kernelInventory?.runtimeCensusValidated,
    requiredPairCount: report.requiredPairCount,
    knownKernelIdentityCount: report.kernelInventory?.knownKernelIdentityCount,
    knownVariantObligationCount: report.knownVariantObligationCount,
    pendingVariantCount: report.pendingVariantCount,
    sourceBoundVariantCount: report.sourceBoundVariantCount,
    sourceBoundPairCount: report.sourceBoundPairCount,
  };
} catch (error) {
  failed = true;
  failure = error;
} finally {
  try {
    rmSync(directory, { recursive: true });
  } catch (error) {
    if (!failed) {
      failed = true;
      failure = error;
    }
  }
}
if (failed) throw failure;
process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
