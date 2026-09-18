import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmdirSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readRetainedResourceObservation, validateResourceQueryObservation } from "../validate-resource-query-observation.mjs";

const retained = readRetainedResourceObservation();
test("actual resource projection is drawn byte-for-byte from the retained transcript", () => {
  const result = validateResourceQueryObservation(retained.fixture, retained.requests, retained.responses);
  assert.equal(result.responses, 34);
  assert.equal(result.response_bytes, 68805);
  assert.equal(result.compiler_execution_authenticated, false);
});

test("changed transcript, projected response, request or anchor cannot pass integrity checks", () => {
  for (const mutate of [
    f => { f.memoryResponse.request_id += 1; },
    f => { f.expectedSnapshot.cursor.state_revision += 1; },
    f => { f.accessRequest.page.max_items = 1; },
    f => { f.allocationRequest = f.accessRequest; },
    f => { f.allocationResponse = f.accessResponse; },
    f => { f.context.variantIdentity = "00".repeat(32); },
    f => { f.evidence.hardware_observed = true; },
  ]) {
    const fixture = structuredClone(retained.fixture);
    mutate(fixture);
    assert.throws(() => validateResourceQueryObservation(fixture, retained.requests, retained.responses));
  }
  const bytes = Buffer.from(retained.responses);
  bytes[bytes.length - 2] ^= 1;
  assert.throws(() => validateResourceQueryObservation(retained.fixture, retained.requests, bytes));
});

test("a local FIFO evidence path rejects before a blocking read", { skip: process.platform !== "linux" }, () => {
  const directory = mkdtempSync(join(tmpdir(), "fe2o3-resource-evidence-test-"));
  const path = join(directory, "not-a-regular-file");
  let created = false;
  try {
    const make = spawnSync("mkfifo", [path], { timeout: 1000 });
    assert.equal(make.status, 0);
    created = true;
    const module = new URL("../validate-resource-query-observation.mjs", import.meta.url).href;
    const child = spawnSync(process.execPath, ["--input-type=module", "-e",
      `import { readBounded } from ${JSON.stringify(module)}; readBounded(process.argv[1]);`, path],
    { timeout: 1000, encoding: "utf8" });
    assert.equal(child.error, undefined, "reader must reject without hitting its deadline");
    assert.equal(child.status, 1);
    assert.match(child.stderr, /regular bounded evidence file required/u);
  } finally {
    if (created) unlinkSync(path);
    rmdirSync(directory);
  }
});
