#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { authenticateTrackedTree, publishInventoryExclusive } from "./curriculum-inventory-files.mjs";

function fail(detail) {
  throw new Error(`curriculum inventory: ${detail}`);
}

const args = process.argv.slice(2);
if (args.length !== 4 || args[0] !== "--compiler-repository" || args[2] !== "--output"
    || !isAbsolute(args[1]) || !isAbsolute(args[3])) {
  fail("usage: node scripts/export-curriculum-inventory.mjs --compiler-repository /ABS/compiler --output /ABS/fresh.json");
}
const siteRoot = realpathSync(fileURLToPath(new URL("../", import.meta.url)));
const compilerRoot = realpathSync(args[1]);
const output = join(realpathSync(dirname(args[3])), basename(args[3]));
const outputRelative = relative(siteRoot, output);
if (outputRelative === "" || (!outputRelative.startsWith(`..${sep}`) && !isAbsolute(outputRelative))) {
  fail("output must be outside the authenticated site checkout");
}

function git(repository, arguments_, encoding = "utf8") {
  const environment = { ...process.env, GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0" };
  for (const key of ["GIT_DIR", "GIT_COMMON_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_OBJECT_DIRECTORY", "GIT_ALTERNATE_OBJECT_DIRECTORIES"]) {
    delete environment[key];
  }
  const result = spawnSync("git", ["--no-replace-objects", "-c", "core.fsmonitor=false", "-c", "core.untrackedCache=false", "-C", repository, ...arguments_], {
    encoding,
    maxBuffer: 8 * 1024 * 1024,
    env: environment,
  });
  if (result.error || result.status !== 0) {
    fail(`read-only git ${arguments_[0]} failed: ${result.error?.message ?? String(result.stderr).slice(-4096)}`);
  }
  return result.stdout;
}

function cleanSite() {
  if (git(siteRoot, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]) !== "") {
    fail("site checkout must be clean, including untracked files");
  }
  const flags = git(siteRoot, ["ls-files", "-v", "-z"]).split("\0").filter(Boolean);
  if (flags.some((row) => !row.startsWith("H "))) {
    fail("site tracked files may not hide skip-worktree or assume-unchanged content");
  }
  const entries = git(siteRoot, ["ls-files", "--stage", "-z"]).split("\0").filter(Boolean);
  if (entries.some((row) => !/^100(?:644|755) [0-9a-f]{40} 0\t/u.test(row))) {
    fail("site tracked files must be ordinary stage-zero files, not symlinks or submodules");
  }
  const commit = git(siteRoot, ["rev-parse", "--verify", "HEAD^{commit}"]).trim();
  if (!/^[0-9a-f]{40}$/u.test(commit)) fail("site commit is malformed");
  authenticateTrackedTree(siteRoot, git(siteRoot, ["ls-tree", "-r", "-z", "--full-tree", commit], null));
  return {
    repository: "harsh-nod/fe2o3-kernels",
    commit,
    tree: git(siteRoot, ["show", "-s", "--format=%T", commit]).trim(),
  };
}

const before = cleanSite();
const cache = mkdtempSync(join(tmpdir(), "fe2o3-curriculum-inventory-"));
let vite;
let encoded;
let lessonCount;
let checkSite;
let failed = false;
let failure;
function retainFailure(error) {
  if (!failed) {
    failed = true;
    failure = error;
  }
}
try {
  vite = await createServer({
    root: siteRoot,
    configFile: false,
    appType: "custom",
    cacheDir: cache,
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, watch: null },
  });
  const { validateCurriculumSourcePin } = await vite.ssrLoadModule("/scripts/curriculum-evidence.ts");
  const { exportCurriculumInventory, requireUnchangedCurriculumSite } = await vite.ssrLoadModule("/scripts/curriculum-inventory.ts");
  checkSite = requireUnchangedCurriculumSite;
  const pin = validateCurriculumSourcePin(JSON.parse(readFileSync(join(siteRoot, "config/curriculum-source-contract.json"), "utf8")));
  const tree = git(compilerRoot, ["show", "-s", "--format=%T", pin.commit]).trim();
  if (tree !== pin.tree) fail("pinned compiler tree differs");
  const bytes = git(compilerRoot, ["show", `${pin.commit}:${pin.path}`], null);
  const { lessons } = await vite.ssrLoadModule("/src/content/curriculum.ts");
  const inventory = exportCurriculumInventory(lessons, bytes, pin, before);
  encoded = Buffer.from(JSON.stringify(inventory) + "\n", "utf8");
  lessonCount = inventory.lessons.length;
} catch (error) {
  retainFailure(error);
} finally {
  try {
    await vite?.close();
  } catch (error) {
    retainFailure(error);
  }
  try {
    rmSync(cache, { recursive: true });
  } catch (error) {
    retainFailure(error);
  }
}
if (failed) throw failure;
// Include runtime shutdown in the before/after tracked-source check.
checkSite(before, cleanSite());
publishInventoryExclusive(output, encoded);
process.stderr.write(`Exported ${lessonCount} ordered lesson inventories; source/display data only, qualification not established.\n`);
