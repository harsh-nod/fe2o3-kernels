import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  appendFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync,
  readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const siteRoot = realpathSync(fileURLToPath(new URL("../../", import.meta.url)));
const configuredCompiler = process.env.FE2O3_CURRICULUM_COMPILER_REPOSITORY;
assert.ok(configuredCompiler && isAbsolute(configuredCompiler),
  "set FE2O3_CURRICULUM_COMPILER_REPOSITORY to an absolute compiler checkout containing the historical evidence pin");
const compilerRoot = realpathSync(configuredCompiler);
const dependencies = realpathSync(join(siteRoot, "node_modules"));
const environment = { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_NO_LAZY_FETCH: "1", GIT_OPTIONAL_LOCKS: "0" };
for (const key of ["GIT_DIR", "GIT_COMMON_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_OBJECT_DIRECTORY", "GIT_ALTERNATE_OBJECT_DIRECTORIES"]) {
  delete environment[key];
}

function git(repository, args) {
  const result = spawnSync("git", ["--no-replace-objects", "-c", "core.hooksPath=/dev/null", "-c", "commit.gpgsign=false",
    "-C", repository, ...args], { encoding: "utf8", env: environment, timeout: 60_000, maxBuffer: 1024 * 1024 });
  assert.ifError(result.error);
  assert.equal(result.signal, null, result.stderr);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

const commit = git(siteRoot, ["rev-parse", "--verify", "HEAD^{commit}"]).trim();

function withFixture(run) {
  const directory = mkdtempSync(join(tmpdir(), "fe2o3-inventory-cli-test-"));
  try {
    const site = join(directory, "site");
    // Only this fresh private clone is changed; the source and compiler repos are read-only.
    git(directory, ["clone", "--shared", "--no-checkout", "--quiet", "--", siteRoot, site]);
    git(site, ["checkout", "--quiet", "--detach", commit]);
    for (const relative of [
      "scripts/export-curriculum-inventory.mjs", "scripts/curriculum-inventory.ts",
      "scripts/curriculum-inventory-files.mjs", "scripts/tests/curriculum-inventory-cli.test.mjs",
      "scripts/validate-current-curriculum.mjs",
    ]) {
      assert.deepEqual(readFileSync(join(site, relative)), readFileSync(join(siteRoot, relative)),
        "CLI qualification requires these candidate files to be committed before the test");
    }
    symlinkSync(dependencies, join(site, "node_modules"), "dir");
    const cache = join(directory, "cache");
    const outputs = join(directory, "outputs");
    mkdirSync(cache);
    mkdirSync(outputs);
    const output = join(outputs, "runtime.json");
    function runCli(relative, args) {
      const result = spawnSync(process.execPath, [join(site, relative), ...args], {
        cwd: site, encoding: "utf8", timeout: 600_000, maxBuffer: 1024 * 1024,
        env: { ...environment, TMPDIR: cache, TMP: cache, TEMP: cache },
      });
      assert.ifError(result.error);
      assert.equal(result.signal, null, result.stderr);
      assert.deepEqual(readdirSync(cache), [], "Vite cache must be removed on every result");
      assert.ok(readdirSync(outputs).every((name) => !name.startsWith(".fe2o3-curriculum-inventory-")),
        "publication staging must be removed on every result");
      return result;
    }
    function exportInventory(options = {}) {
      return runCli("scripts/export-curriculum-inventory.mjs", [
        "--compiler-repository", options.compiler ?? compilerRoot, "--output", options.output ?? output,
      ]);
    }
    function checkCurrent(compiler = compilerRoot) {
      return runCli("scripts/validate-current-curriculum.mjs", ["--compiler-repository", compiler]);
    }
    function refuse(pattern, options) {
      const result = exportInventory(options);
      assert.notEqual(result.status, 0, "the real CLI must refuse the hostile input");
      assert.match(result.stderr, pattern);
      assert.equal(existsSync(output), false, "no default report may be published on refusal");
    }
    function commitFixture(relative) {
      git(site, ["add", "--", relative]);
      git(site, ["-c", "user.name=Inventory CLI Test", "-c", "user.email=inventory-test@invalid",
        "commit", "--quiet", "--no-verify", "-m", "Private inventory CLI adversarial fixture"]);
    }
    run({ directory, site, cache, outputs, output, exportInventory, checkCurrent, refuse, commitFixture });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("real Git/Vite CLI exports exact current site identity with no qualification fields", () => {
  withFixture(({ site, output, exportInventory }) => {
    const result = exportInventory();
    assert.equal(result.status, 0, result.stderr);
    const inventory = JSON.parse(readFileSync(output, "utf8"));
    assert.deepEqual(Object.keys(inventory).sort(), ["lessons", "schema", "site"]);
    assert.equal(inventory.schema, "fe2o3-tutorial-runtime-projection-v1");
    assert.deepEqual(inventory.site, { repository: "harsh-nod/fe2o3-kernels", commit,
      tree: git(site, ["show", "-s", "--format=%T", commit]).trim() });
    assert.equal(inventory.lessons.length, 56);
    assert.equal(inventory.lessons.flatMap((lesson) => lesson.codeTabs).length, 307);
    assert.equal(lstatSync(output).mode & 0o777, 0o600);
    assert.equal(git(site, ["status", "--porcelain=v1", "--untracked-files=all"]), "");
  });
});

test("real CLI refuses tracked and untracked dirty source", () => {
  for (const relative of [".nvmrc", "inventory-untracked-control"]) {
    withFixture(({ site, refuse }) => {
      appendFileSync(join(site, relative), "\nchanged\n");
      refuse(/site checkout must be clean/u);
    });
  }
});

test("real CLI refuses both hidden index flags even when bytes are unchanged", () => {
  for (const flag of ["--assume-unchanged", "--skip-worktree"]) {
    withFixture(({ site, refuse }) => {
      git(site, ["update-index", flag, "--", ".nvmrc"]);
      refuse(/skip-worktree or assume-unchanged/u);
    });
  }
});

test("real CLI refuses a clean committed tracked symlink", () => {
  withFixture(({ site, refuse, commitFixture }) => {
    rmSync(join(site, ".nvmrc"));
    symlinkSync("package.json", join(site, ".nvmrc"));
    commitFixture(".nvmrc");
    refuse(/ordinary stage-zero files/u);
  });
});

test("real CLI refuses missing historical compiler objects", () => {
  withFixture(({ directory, refuse }) => {
    const empty = join(directory, "empty-compiler");
    mkdirSync(empty);
    git(empty, ["init", "--quiet"]);
    refuse(/read-only git show failed/u, { compiler: empty });
  });
});

test("real CLI refuses stale historical tree and blob pins", () => {
  for (const [field, pattern] of [["tree", /pinned compiler tree differs/u], ["sha256", /manifest blob SHA256 differs from its pin/u]]) {
    withFixture(({ site, refuse, commitFixture }) => {
      const relative = "config/curriculum-source-contract.json";
      const pin = JSON.parse(readFileSync(join(site, relative), "utf8"));
      pin[field] = "0".repeat(field === "tree" ? 40 : 64);
      writeFileSync(join(site, relative), JSON.stringify(pin) + "\n");
      commitFixture(relative);
      refuse(pattern);
    });
  }
});

test("real CLI preserves existing outputs and dangling output symlinks", () => {
  withFixture(({ outputs, exportInventory }) => {
    const occupied = join(outputs, "occupied.json");
    writeFileSync(occupied, "original");
    const existing = exportInventory({ output: occupied });
    assert.notEqual(existing.status, 0);
    assert.match(existing.stderr, /EEXIST/u);
    assert.equal(readFileSync(occupied, "utf8"), "original");
    const dangling = join(outputs, "dangling.json");
    symlinkSync("missing.json", dangling);
    const alias = exportInventory({ output: dangling });
    assert.notEqual(alias.status, 0);
    assert.match(alias.stderr, /EEXIST/u);
    assert.ok(lstatSync(dangling).isSymbolicLink());
    assert.equal(existsSync(join(outputs, "missing.json")), false);
  });
});

test("real CLI refuses relative and in-site output paths before creating files", () => {
  withFixture(({ site, refuse }) => {
    refuse(/usage:/u, { output: "relative.json" });
    refuse(/output must be outside/u, { output: join(site, "in-site.json") });
    assert.equal(existsSync(join(site, "relative.json")), false);
    assert.equal(existsSync(join(site, "in-site.json")), false);
  });
});

test("real CLI removes Vite scratch when runtime module evaluation fails", () => {
  withFixture(({ site, refuse, commitFixture }) => {
    const relative = "src/content/curriculum.ts";
    appendFileSync(join(site, relative), '\nthrow new Error("inventory-test-runtime-refusal");\n');
    commitFixture(relative);
    refuse(/inventory-test-runtime-refusal/u);
  });
});

test("real CLI detects tracked mutation during runtime evaluation before publication", () => {
  withFixture(({ site, refuse, commitFixture }) => {
    const relative = "src/content/curriculum.ts";
    appendFileSync(join(site, relative), '\nimport { appendFileSync as mutateInventoryTest } from "node:fs";\n'
      + `mutateInventoryTest(${JSON.stringify(join(site, ".nvmrc"))}, "\\nchanged-during-load\\n");\n`);
    commitFixture(relative);
    refuse(/site checkout must be clean/u);
  });
});

test("current compiler wrapper validates the real Vite projection through the actual compiler consumer", () => {
  withFixture(({ output, checkCurrent }) => {
    const result = checkCurrent();
    assert.equal(result.status, 0, result.stderr);
    const summary = JSON.parse(result.stdout);
    assert.equal(summary.runtimeCensusValidated, true);
    assert.equal(summary.runtimeProjectionSite.commit, commit);
    assert.equal(summary.compilerInput.commit, git(compilerRoot, ["rev-parse", "--verify", "HEAD^{commit}"]).trim());
    assert.equal(typeof summary.qualified, "boolean");
    assert.equal(typeof summary.inventoryComplete, "boolean");
    assert.equal(existsSync(output), false, "the wrapper must not retain its temporary projection");
  });
});

test("wrapper refuses synthetic consumer protocol faults and cleans real Vite scratch", () => {
  for (const [fault, pattern] of [
    ["schema", /exact current runtime census/u],
    ["census", /exact current runtime census/u],
    ["site", /exact current runtime census/u],
    ["malformed", /JSON/u],
    ["refused", /inventory-test-consumer-refusal/u],
    ["mutated", /compiler checkout must be clean/u],
  ]) {
    withFixture(({ directory, output, checkCurrent }) => {
      // This tests wrapper refusal handling only, never compiler execution or proof.
      // Existing historical objects remain readable, but current HEAD is a tiny
      // private synthetic consumer fixture instead of the production compiler.
      const fixture = join(directory, "protocol-compiler");
      git(directory, ["clone", "--shared", "--no-checkout", "--quiet", "--", compilerRoot, fixture]);
      git(fixture, ["symbolic-ref", "HEAD", "refs/heads/inventory-protocol-fixture"]);
      git(fixture, ["read-tree", "--empty"]);
      mkdirSync(join(fixture, "scripts"));
      mkdirSync(join(fixture, "config"));
      writeFileSync(join(fixture, "config/tutorial-kernel-manifest-v1.json"), "{}\n");
      writeFileSync(join(fixture, "scripts/validate-tutorial-kernel-manifest.py"), `import json, sys
from pathlib import Path
fault = ${JSON.stringify(fault)}
if fault == "refused":
    raise SystemExit("inventory-test-consumer-refusal")
if "--require-curriculum" in sys.argv:
    if fault == "mutated":
        manifest = Path(__file__).resolve().parents[1] / "config/tutorial-kernel-manifest-v1.json"
        manifest.write_text("{ \\n}\\n")
    raise SystemExit(0)
if fault == "malformed":
    print("not valid JSON")
    raise SystemExit(0)
site = json.loads(Path(sys.argv[sys.argv.index("--site-inventory") + 1]).read_text())["site"]
if fault == "site":
    site["commit"] = "0" * 40
print(json.dumps({
    "schema": "stale" if fault == "schema" else "fe2o3-tutorial-kernel-pair-obligations-v2",
    "kernelInventory": {"runtimeCensusValidated": fault != "census"},
    "runtimeProjectionSite": site,
}))
`);
      git(fixture, ["add", "--", "scripts", "config"]);
      git(fixture, ["-c", "user.name=Inventory CLI Test", "-c", "user.email=inventory-test@invalid",
        "commit", "--quiet", "--no-verify", "-m", "Private synthetic consumer refusal fixture"]);
      const result = checkCurrent(fixture);
      assert.notEqual(result.status, 0, "synthetic protocol faults must not pass the actual wrapper");
      assert.match(result.stderr, pattern);
      assert.equal(result.stdout, "", "a refused census must not emit a success summary");
      assert.equal(existsSync(output), false);
    });
  }
});
