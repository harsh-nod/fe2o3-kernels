#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const EXACT_OBJECT_NAME = /^[0-9a-f]{40}$/;
const REQUIRED_REPOSITORIES = new Set([
  "harsh-nod/fe2o3",
  "powderluv/fe2o3",
]);
const POLICY_URL = new URL("../config/publication-gate.json", import.meta.url);

function fail(message) {
  throw new Error(`publication gate: ${message}`);
}

export function validatePolicy(policy) {
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
    fail("policy is not an object");
  }
  if (!EXACT_OBJECT_NAME.test(policy.requiredCommit ?? "")) {
    fail("requiredCommit is not an exact lowercase Git object name");
  }
  if (!EXACT_OBJECT_NAME.test(policy.requiredTree ?? "")) {
    fail("requiredTree is not an exact lowercase Git object name");
  }
  if (policy.requiredRefRelationship !== "contains-required-commit") {
    fail("requiredRefRelationship must require the pinned commit as an ancestor");
  }
  if (!Array.isArray(policy.requiredRefs) || policy.requiredRefs.length !== 2) {
    fail("policy must contain exactly two required refs");
  }

  const repositories = new Set();
  for (const required of policy.requiredRefs) {
    if (!required || typeof required !== "object") {
      fail("required ref is not an object");
    }
    if (!REQUIRED_REPOSITORIES.has(required.repository)) {
      fail(`unexpected repository ${String(required.repository)}`);
    }
    if (required.ref !== "refs/heads/main") {
      fail(`unexpected ref for ${required.repository}`);
    }
    if (repositories.has(required.repository)) {
      fail(`duplicate repository ${required.repository}`);
    }
    repositories.add(required.repository);
  }
  if (repositories.size !== REQUIRED_REPOSITORIES.size) {
    fail("both required repositories are not present");
  }
  return policy;
}

export function parseLsRemote(output, expectedRef) {
  const lines = output.split(/\r?\n/u).filter((line) => line.length > 0);
  if (lines.length !== 1) {
    fail(`expected one ls-remote result for ${expectedRef}`);
  }
  const fields = lines[0].split("\t");
  if (fields.length !== 2) {
    fail(`malformed ls-remote result for ${expectedRef}`);
  }
  const [commit, observedRef] = fields;
  if (!EXACT_OBJECT_NAME.test(commit)) {
    fail(`malformed object name for ${expectedRef}`);
  }
  if (observedRef !== expectedRef) {
    fail(`resolved unexpected ref ${observedRef}`);
  }
  return commit;
}

export function parseGitHubCommit(payload, repository, requiredCommit) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    fail(`malformed Git commit response for ${repository}`);
  }
  if (payload.sha !== requiredCommit) {
    fail(
      `${repository} Git commit response resolved to ${String(payload.sha)}, required ${requiredCommit}`,
    );
  }
  const tree = payload.tree;
  if (!tree || typeof tree !== "object" || Array.isArray(tree)) {
    fail(`Git commit response for ${repository} has no tree`);
  }
  if (!EXACT_OBJECT_NAME.test(tree.sha ?? "")) {
    fail(`Git commit response for ${repository} has a malformed tree`);
  }
  return tree.sha;
}

export function parseGitHubComparison(
  payload,
  repository,
  requiredCommit,
  observedHead,
) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    fail(`malformed Git comparison response for ${repository}`);
  }
  if (!EXACT_OBJECT_NAME.test(observedHead)) {
    fail(`Git comparison for ${repository} has a malformed observed ref head`);
  }
  const expectedStatus = observedHead === requiredCommit ? "identical" : "ahead";
  if (payload.status !== expectedStatus) {
    fail(
      `${repository}@refs/heads/main does not contain required commit ${requiredCommit}`,
    );
  }
  if (payload.base_commit?.sha !== requiredCommit) {
    fail(`Git comparison for ${repository} substituted the required base commit`);
  }
  if (payload.merge_base_commit?.sha !== requiredCommit) {
    fail(`Git comparison for ${repository} has a different merge base`);
  }
}

export function requireTreeMatch(repository, commit, observed, required) {
  if (observed !== required) {
    fail(`${repository}@${commit}^{tree} resolved to ${observed}, required ${required}`);
  }
}

export function requireToken(token) {
  if (!token) {
    fail("GITHUB_TOKEN is required for authenticated ref resolution");
  }
  return token;
}

export function parseGitResult(result, repository, ref) {
  if (result.error) {
    fail(`git failed for ${repository}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`git exited ${String(result.status)} for ${repository}`);
  }
  return parseLsRemote(result.stdout, ref);
}

function loadPolicy() {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(POLICY_URL, "utf8"));
  } catch (error) {
    fail(`cannot read or parse checked-in policy: ${error.message}`);
  }
  return validatePolicy(parsed);
}

function resolveAuthenticated(repository, ref, token) {
  const basicCredential = Buffer.from(`x-access-token:${token}`, "utf8").toString(
    "base64",
  );
  const result = spawnSync(
    "git",
    [
      "-c",
      `http.extraHeader=Authorization: Basic ${basicCredential}`,
      "ls-remote",
      "--exit-code",
      "--refs",
      `https://github.com/${repository}.git`,
      ref,
    ],
    {
      encoding: "utf8",
      timeout: 60_000,
      maxBuffer: 1024 * 1024,
    },
  );
  return parseGitResult(result, repository, ref);
}

async function resolveAuthenticatedTree(repository, commit, token) {
  let response;
  try {
    response = await fetch(
      `https://api.github.com/repos/${repository}/git/commits/${commit}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: AbortSignal.timeout(60_000),
      },
    );
  } catch (error) {
    fail(`Git commit lookup failed for ${repository}: ${error.message}`);
  }
  if (!response.ok) {
    fail(`Git commit lookup returned HTTP ${String(response.status)} for ${repository}`);
  }
  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    fail(`cannot parse Git commit response for ${repository}: ${error.message}`);
  }
  return parseGitHubCommit(payload, repository, commit);
}

async function requireAuthenticatedContainment(
  repository,
  requiredCommit,
  observedHead,
  token,
) {
  let response;
  try {
    response = await fetch(
      `https://api.github.com/repos/${repository}/compare/${requiredCommit}...${observedHead}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: AbortSignal.timeout(60_000),
      },
    );
  } catch (error) {
    fail(`Git comparison failed for ${repository}: ${error.message}`);
  }
  if (!response.ok) {
    fail(`Git comparison returned HTTP ${String(response.status)} for ${repository}`);
  }
  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    fail(`cannot parse Git comparison response for ${repository}: ${error.message}`);
  }
  parseGitHubComparison(payload, repository, requiredCommit, observedHead);
}

async function runGate() {
  const token = requireToken(process.env.GITHUB_TOKEN);
  const policy = loadPolicy();
  for (const required of policy.requiredRefs) {
    const observed = resolveAuthenticated(
      required.repository,
      required.ref,
      token,
    );
    const observedTree = await resolveAuthenticatedTree(
      required.repository,
      policy.requiredCommit,
      token,
    );
    requireTreeMatch(
      required.repository,
      policy.requiredCommit,
      observedTree,
      policy.requiredTree,
    );
    await requireAuthenticatedContainment(
      required.repository,
      policy.requiredCommit,
      observed,
      token,
    );
    process.stdout.write(
      `publication gate: ${required.repository}@${required.ref} = ${observed}, contains ${policy.requiredCommit}, pinned tree = ${observedTree}\n`,
    );
  }
}

function expectFailure(operation, description) {
  try {
    operation();
  } catch {
    return;
  }
  throw new Error(`self-test expected failure: ${description}`);
}

function runSelfTest() {
  const commit = "a".repeat(40);
  const policy = {
    requiredCommit: commit,
    requiredTree: "b".repeat(40),
    requiredRefRelationship: "contains-required-commit",
    requiredRefs: [
      { repository: "harsh-nod/fe2o3", ref: "refs/heads/main" },
      { repository: "powderluv/fe2o3", ref: "refs/heads/main" },
    ],
  };
  validatePolicy(policy);
  requireToken("test-token");
  if (parseLsRemote(`${commit}\trefs/heads/main\n`, "refs/heads/main") !== commit) {
    throw new Error("self-test failed to parse a valid ref");
  }
  const tree = parseGitHubCommit(
    { sha: commit, tree: { sha: policy.requiredTree } },
    "harsh-nod/fe2o3",
    commit,
  );
  requireTreeMatch("harsh-nod/fe2o3", commit, tree, policy.requiredTree);
  parseGitHubComparison(
    {
      status: "identical",
      base_commit: { sha: commit },
      merge_base_commit: { sha: commit },
    },
    "harsh-nod/fe2o3",
    commit,
    commit,
  );
  const descendant = "c".repeat(40);
  parseGitHubComparison(
    {
      status: "ahead",
      base_commit: { sha: commit },
      merge_base_commit: { sha: commit },
    },
    "harsh-nod/fe2o3",
    commit,
    descendant,
  );
  expectFailure(() => validatePolicy({ ...policy, requiredRefs: [] }), "missing refs");
  expectFailure(
    () => validatePolicy({ ...policy, requiredCommit: "main" }),
    "symbolic required commit",
  );
  expectFailure(
    () => validatePolicy({ ...policy, requiredRefRelationship: "exact-head" }),
    "unsafe ref relationship",
  );
  expectFailure(() => parseLsRemote("", "refs/heads/main"), "empty output");
  expectFailure(() => requireToken(""), "missing authentication token");
  expectFailure(
    () =>
      parseGitResult(
        { error: new Error("network unavailable"), status: null, stdout: "" },
        "harsh-nod/fe2o3",
        "refs/heads/main",
      ),
    "git network failure",
  );
  expectFailure(
    () =>
      parseGitResult(
        { status: 128, stdout: "" },
        "harsh-nod/fe2o3",
        "refs/heads/main",
      ),
    "git nonzero exit",
  );
  expectFailure(
    () => parseLsRemote("not-a-sha\trefs/heads/main\n", "refs/heads/main"),
    "malformed object name",
  );
  expectFailure(
    () => parseLsRemote(`${commit}\trefs/heads/dev\n`, "refs/heads/main"),
    "wrong ref",
  );
  expectFailure(
    () =>
      parseLsRemote(
        `${commit}\trefs/heads/main\n${commit}\trefs/heads/main\n`,
        "refs/heads/main",
      ),
    "duplicate output",
  );
  expectFailure(
    () =>
      parseGitHubCommit(
        { sha: "c".repeat(40), tree: { sha: policy.requiredTree } },
        "harsh-nod/fe2o3",
        commit,
      ),
    "Git commit response mismatch",
  );
  expectFailure(
    () =>
      parseGitHubCommit(
        { sha: commit, tree: { sha: "main" } },
        "harsh-nod/fe2o3",
        commit,
      ),
    "malformed Git tree",
  );
  expectFailure(
    () =>
      requireTreeMatch(
        "harsh-nod/fe2o3",
        commit,
        "c".repeat(40),
        policy.requiredTree,
      ),
    "tree mismatch",
  );
  expectFailure(
    () =>
      parseGitHubComparison(
        {
          status: "diverged",
          base_commit: { sha: commit },
          merge_base_commit: { sha: "d".repeat(40) },
        },
        "harsh-nod/fe2o3",
        commit,
        descendant,
      ),
    "diverged history",
  );
  expectFailure(
    () =>
      parseGitHubComparison(
        {
          status: "ahead",
          base_commit: { sha: commit },
          merge_base_commit: { sha: commit },
        },
        "harsh-nod/fe2o3",
        commit,
        "main",
      ),
    "malformed observed head",
  );
  process.stdout.write("publication gate self-test: passed\n");
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    if (process.argv[2] === "--self-test" && process.argv.length === 3) {
      runSelfTest();
    } else if (process.argv.length === 2) {
      await runGate();
    } else {
      fail("usage: enforce-publication-gate.mjs [--self-test]");
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
