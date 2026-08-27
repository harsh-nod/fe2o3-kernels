#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { createServer } from "vite";

const args = process.argv.slice(2);
const repositoryIndex = args.indexOf("--repository");
const repositoryArgument = repositoryIndex >= 0
  ? args[repositoryIndex + 1]
  : "../fe2o3";
if (!repositoryArgument || repositoryArgument.startsWith("--")) {
  throw new Error("evidence validation: --repository requires a path");
}
const repository = resolve(repositoryArgument);
const checkIssues = args.includes("--check-issues");

function fail(message) {
  throw new Error(`evidence validation: ${message}`);
}

function git(arguments_, encoding = "utf8") {
  const result = spawnSync("git", ["-C", repository, ...arguments_], {
    encoding,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    fail(
      `git ${arguments_.join(" ")} failed: ${result.error?.message ?? String(result.stderr).trim()}`,
    );
  }
  return result.stdout;
}

function requireObject(commit, label) {
  git(["cat-file", "-e", `${commit}^{commit}`]);
  const tree = git(["show", "-s", "--format=%T", commit]).trim();
  if (!/^[0-9a-f]{40}$/u.test(tree)) {
    fail(`${label} resolved a malformed tree`);
  }
  return tree;
}

function requirePath(commit, sourcePath, label) {
  if (
    sourcePath.startsWith("/") ||
    sourcePath.split("/").includes("..") ||
    sourcePath.trim().length === 0
  ) {
    fail(`${label} contains an invalid source path`);
  }
  git(["cat-file", "-e", `${commit}:${sourcePath}`]);
}

async function validateIssues(issues) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) fail("GITHUB_TOKEN is required with --check-issues");
  for (const issue of issues) {
    const response = await fetch(
      `https://api.github.com/repos/harsh-nod/fe2o3/issues/${issue.number}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (!response.ok) {
      fail(`issue #${issue.number} lookup returned HTTP ${response.status}`);
    }
    const payload = await response.json();
    if (payload.pull_request || payload.state !== issue.state) {
      fail(
        `issue #${issue.number} is ${String(payload.state)}, manifest requires ${issue.state}`,
      );
    }
  }
}

const vite = await createServer({
  appType: "custom",
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true },
});
try {
  const module = await vite.ssrLoadModule("/src/content/evidence-catalog.ts");
  const catalog = module.evidenceCatalog;
  const commits = new Map();
  const paths = new Set();
  const sourceBytes = new Map();

  function observedTree(commit, label) {
    let tree = commits.get(commit);
    if (!tree) {
      tree = requireObject(commit, label);
      commits.set(commit, tree);
    }
    return tree;
  }

  function validatePath(commit, sourcePath, label) {
    const key = `${commit}:${sourcePath}`;
    if (paths.has(key)) return;
    requirePath(commit, sourcePath, label);
    paths.add(key);
  }

  function pinnedSourceBytes(commit, sourcePath) {
    const key = `${commit}:${sourcePath}`;
    let bytes = sourceBytes.get(key);
    if (!bytes) {
      bytes = git(["show", key], null);
      sourceBytes.set(key, bytes);
    }
    return bytes;
  }

  for (const object of catalog.gitObjects) {
    const tree = observedTree(object.commit, object.label);
    if (object.tree && tree !== object.tree) {
      fail(
        `${object.label} commit ${object.commit} resolves to tree ${tree}, required ${object.tree}`,
      );
    }
    for (const sourcePath of new Set(object.sourcePaths)) {
      validatePath(object.commit, sourcePath, object.label);
    }
  }

  for (const source of catalog.sources) {
    observedTree(source.commit, source.label);
    validatePath(source.commit, source.sourcePath, source.label);
    if (source.fileSha256) {
      const observed = createHash("sha256")
        .update(pinnedSourceBytes(source.commit, source.sourcePath))
        .digest("hex");
      if (observed !== source.fileSha256) {
        fail(
          `${source.label} whole-file digest is ${observed}, required ${source.fileSha256}`,
        );
      }
    }
    if (source.displayedSha256) {
      if (typeof source.displayedSource !== "string") {
        fail(`${source.label} has a displayed digest without displayed source`);
      }
      const displayedBytes = Buffer.from(source.displayedSource, "utf8");
      const observed = createHash("sha256").update(displayedBytes).digest("hex");
      if (observed !== source.displayedSha256) {
        fail(
          `${source.label} displayed excerpt digest is ${observed}, required ${source.displayedSha256}`,
        );
      }
      const pinned = pinnedSourceBytes(source.commit, source.sourcePath);
      if (!Array.isArray(source.displayedFragments) || source.displayedFragments.length === 0) {
        fail(`${source.label} has no displayed source fragments`);
      }
      if (source.displayedFragments.join("\n\n") !== source.displayedSource) {
        fail(`${source.label} displayed fragments do not reconstruct the displayed source`);
      }
      for (const fragment of source.displayedFragments) {
        if (typeof fragment !== "string" || fragment.length === 0) {
          fail(`${source.label} has an empty displayed source fragment`);
        }
        if (pinned.indexOf(Buffer.from(fragment, "utf8")) < 0) {
          fail(`${source.label} displayed fragment is absent from the pinned source file`);
        }
      }
    }
  }

  if (checkIssues) await validateIssues(catalog.issues);
  process.stdout.write(
    `evidence validation: ${commits.size} commits, ${catalog.gitObjects.length} records, ${catalog.sources.length} source tabs, and ${checkIssues ? catalog.issues.length : 0} issue states passed\n`,
  );
} finally {
  await vite.close();
}
