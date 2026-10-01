import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const prelude = String.raw`
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolveAuthenticated } from "./scripts/enforce-publication-gate.mjs";
const token = "publication-control-not-a-real-token";
const encoded = Buffer.from("x-access-token:" + token).toString("base64");
const header = "Authorization: Basic " + encoded;
const argument = "--config-env=http.extraHeader=FE2O3_PUBLICATION_AUTH_HEADER";
const repository = "harsh-nod/fe2o3";
const ref = "refs/heads/main";
const commit = "a".repeat(40);
const success = { status: 0, stdout: commit + "\t" + ref + "\n" };
const cleanEnvironment = {
  PATH: process.env.PATH,
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_SYSTEM: "/dev/null",
};
function checkConfig(args, options, key) {
  const result = spawnSync("git", [args[0], "config", "--get-all", key], {
    ...options, cwd: "/",
  });
  assert.equal(result.status, 0);
  return result.stdout.trimEnd().split("\n");
}
`;

function control(source: string) {
  return execFileSync(process.execPath, ["--input-type=module", "-e", prelude + source], {
    cwd: process.cwd(), encoding: "utf8", timeout: 10_000, maxBuffer: 64 * 1024,
    stdio: "pipe",
  });
}

describe("publication Git credential handling", () => {
  it("keeps credentials out of argv for both exact authenticated repositories", () => {
    expect(control(String.raw`
for (const owner of ["harsh-nod/fe2o3", "powderluv/fe2o3"]) {
  const environment = Object.freeze({ PATH: process.env.PATH, KEEP: "retained",
    FE2O3_PUBLICATION_AUTH_HEADER: "old private slot" });
  const result = resolveAuthenticated(owner, ref, token, (command, args, options) => {
    assert.equal(command, "git");
    assert.deepEqual(args, [argument, "ls-remote", "--exit-code", "--refs",
      "https://github.com/" + owner + ".git", ref]);
    assert(!JSON.stringify(args).includes(token));
    assert(!JSON.stringify(args).includes(encoded));
    assert.deepEqual(options, { encoding: "utf8", timeout: 60000, maxBuffer: 1048576,
      env: { ...environment, FE2O3_PUBLICATION_AUTH_HEADER: header } });
    assert.notEqual(options.env, environment);
    return success;
  }, environment);
  assert.equal(result, commit);
  assert.equal(environment.FE2O3_PUBLICATION_AUTH_HEADER, "old private slot");
  assert(!Object.hasOwn(environment, "GIT_CONFIG_COUNT"));
}
`)).toBe("");
  });

  it("preserves inherited counted and legacy configuration through real offline Git", () => {
    expect(control(String.raw`
const environment = Object.freeze({ ...cleanEnvironment,
  GIT_CONFIG_COUNT: "2", GIT_CONFIG_KEY_0: "control.fromCount", GIT_CONFIG_VALUE_0: "retained count",
  GIT_CONFIG_KEY_1: "http.extraHeader", GIT_CONFIG_VALUE_1: "X-Retained: yes",
  GIT_CONFIG_PARAMETERS: "'control.fromParameters=retained legacy'",
});
assert.equal(resolveAuthenticated(repository, ref, token, (_command, args, options) => {
  for (const [key, value] of Object.entries(environment)) assert.equal(options.env[key], value);
  assert.deepEqual(checkConfig(args, options, "control.fromCount"), ["retained count"]);
  assert.deepEqual(checkConfig(args, options, "control.fromParameters"), ["retained legacy"]);
  assert.deepEqual(checkConfig(args, options, "http.extraHeader"), ["X-Retained: yes", header]);
  return success;
}, environment), commit);
`)).toBe("");
  });

  it("preserves Git behavior for absent, empty and zero count without injecting pairs", () => {
    expect(control(String.raw`
for (const count of [undefined, "", "0"]) {
  const environment = { ...cleanEnvironment };
  if (count !== undefined) environment.GIT_CONFIG_COUNT = count;
  resolveAuthenticated(repository, ref, token, (_command, args, options) => {
    assert.equal(options.env.GIT_CONFIG_COUNT, count);
    assert.equal(Object.hasOwn(options.env, "GIT_CONFIG_KEY_0"), false);
    assert.deepEqual(checkConfig(args, options, "http.extraHeader"), [header]);
    return success;
  }, environment);
}
`)).toBe("");
  });

  it("lets Git refuse malformed inherited configuration without exposing diagnostics", () => {
    expect(control(String.raw`
for (const inherited of [
  { GIT_CONFIG_COUNT: "not-a-number" },
  { GIT_CONFIG_COUNT: "-1" },
  { GIT_CONFIG_COUNT: "1" },
  { GIT_CONFIG_COUNT: "1", GIT_CONFIG_KEY_0: "control.missingValue" },
  { GIT_CONFIG_PARAMETERS: "'unterminated" },
]) {
  let observedStatus;
  assert.throws(() => resolveAuthenticated(repository, ref, token, (_command, args, options) => {
    const result = spawnSync("git", [args[0], "config", "--list"], { ...options, cwd: "/" });
    observedStatus = result.status;
    return result;
  }, { ...cleanEnvironment, ...inherited }), /^Error: publication gate: git exited [0-9]+ for harsh-nod\/fe2o3$/);
  assert.notEqual(observedStatus, 0);
}
`)).toBe("");
  });

  it("sanitizes thrown and returned spawn errors containing secret-bearing objects", () => {
    expect(control(String.raw`
for (const behavior of ["throw", "error", "status"]) {
  assert.throws(() => resolveAuthenticated(repository, ref, token, () => {
    const message = token + encoded + JSON.stringify({ env: { credential: header } });
    if (behavior === "throw") throw new Error(message);
    if (behavior === "error") return { error: new Error(message), status: null };
    return { status: 128, stdout: message, stderr: message };
  }, cleanEnvironment), new RegExp("^Error: publication gate: git " +
    (behavior === "status" ? "exited 128" : "failed") + " for harsh-nod/fe2o3$"));
}
`)).toBe("");
  });

  it("retains exact ref parsing and refuses unauthenticated invocation before spawning", () => {
    expect(control(String.raw`
let calls = 0;
assert.throws(() => resolveAuthenticated(repository, ref, "", () => { calls += 1; }, cleanEnvironment),
  /GITHUB_TOKEN is required/);
assert.equal(calls, 0);
for (const stdout of ["", token, commit + "\trefs/heads/dev\n", success.stdout.repeat(2)]) {
  assert.throws(() => resolveAuthenticated(repository, ref, token,
    () => ({ status: 0, stdout }), cleanEnvironment));
}
assert.equal(resolveAuthenticated(repository, ref, token, () => success, cleanEnvironment), commit);
`)).toBe("");
  });
});
