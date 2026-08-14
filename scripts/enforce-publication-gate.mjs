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

export function requireMatch(repository, observed, required) {
  if (observed !== required) {
    fail(`${repository}@refs/heads/main resolved to ${observed}, required ${required}`);
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

function runGate() {
  const token = requireToken(process.env.GITHUB_TOKEN);
  const policy = loadPolicy();
  for (const required of policy.requiredRefs) {
    const observed = resolveAuthenticated(
      required.repository,
      required.ref,
      token,
    );
    requireMatch(required.repository, observed, policy.requiredCommit);
    process.stdout.write(
      `publication gate: ${required.repository}@${required.ref} = ${observed}\n`,
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
  requireMatch("harsh-nod/fe2o3", commit, commit);
  expectFailure(() => validatePolicy({ ...policy, requiredRefs: [] }), "missing refs");
  expectFailure(
    () => validatePolicy({ ...policy, requiredCommit: "main" }),
    "symbolic required commit",
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
    () => requireMatch("harsh-nod/fe2o3", commit, "c".repeat(40)),
    "commit mismatch",
  );
  process.stdout.write("publication gate self-test: passed\n");
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    if (process.argv[2] === "--self-test" && process.argv.length === 3) {
      runSelfTest();
    } else if (process.argv.length === 2) {
      runGate();
    } else {
      fail("usage: enforce-publication-gate.mjs [--self-test]");
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
