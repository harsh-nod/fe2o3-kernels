import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import requests from "./fixtures/recorded-watchpoint-requests.jsonl?raw";
import responses from "./fixtures/recorded-watchpoint-responses.jsonl?raw";
import provenanceText from "./fixtures/recorded-watchpoint-provenance.json?raw";
import guide from "../docs/recorded-watchpoint-lab-v1.md?raw";

it("keeps the tutorial, original excerpt hashes and non-authentication provenance aligned", () => {
  const provenance = JSON.parse(provenanceText);
  expect(provenance.schema).toBe("fe2o3-site-recorded-watchpoint-fixture-v1");
  expect(provenance.files).toHaveLength(2);
  for (const [index, raw] of [requests, responses].entries()) {
    const recorded = provenance.files[index];
    expect(recorded.side).toBe(index === 0 ? "requests" : "responses");
    expect(new TextEncoder().encode(raw).length).toBe(recorded.bytes);
    expect(createHash("sha256").update(raw).digest("hex")).toBe(recorded.sha256);
    expect(guide).toContain(recorded.sha256);
    expect(raw.endsWith("\n")).toBe(true);
    expect(raw).not.toContain("\r");
    const ids = raw.slice(0, -1).split("\n").map(line => JSON.parse(line).request_id);
    expect(ids).toEqual([1, 2, 4, 5, 6, 7, 12]);
    expect(recorded.request_ids).toEqual(ids);
    expect(recorded.original_bytes).toBeGreaterThan(recorded.bytes);
    expect(recorded.original_sha256).toMatch(/^[a-f0-9]{64}$/u);
    expect(recorded.original_sha256).not.toBe(recorded.sha256);
  }
  expect(provenance.tested_source_observation.head).toBe(provenance.tested_parent);
  expect(provenance.published_implementation).not.toBe(provenance.tested_parent);
  expect(provenance.tested_source_observation.status).toContain("scripts/resource-query-v6-watchpoint.mjs");
  expect(guide).toContain(provenance.tested_parent);
  expect(guide).toContain(provenance.published_implementation);
  for (const name of ["source_authentication", "compiler_build_attestation", "hardware_observed", "performance_prediction"]) {
    expect(provenance[name]).toBe(false);
  }
});

it("pins the unavailable stop separately from the later captured response, without proving the original run", () => {
  const provenance = JSON.parse(provenanceText);
  const rows = responses.slice(0, -1).split("\n").map(line => JSON.parse(line));
  const stop = rows.find(row => row.request_id === 6);
  const checkpoint = rows.find(row => row.request_id === 7);
  const memory = rows.find(row => row.request_id === 12);
  expect(stop.result.snapshot).toEqual({ status: "unavailable", reason: provenance.observations.stop.snapshot });
  expect(stop.session.cursor.event_sequence).toBe(provenance.observations.stop.event_sequence);
  expect(stop.session.cursor.state_revision).toBe(provenance.observations.stop.state_revision);
  expect(checkpoint.session.cursor.event_sequence).toBe(provenance.observations.later_checkpoint.event_sequence);
  expect(checkpoint.session.cursor.state_revision).toBe(provenance.observations.later_checkpoint.state_revision);
  expect(memory.result.snapshot).toEqual(checkpoint.result.snapshot.snapshot.anchor);
  expect(memory.result.snapshot.cursor).not.toEqual(stop.session.cursor);
  expect(provenance.observations.memory_belongs_to).toBe("later_checkpoint_only");
  expect(provenance.retained_task_receipt.sha256).toBe("4648dcb0605c20cd022769df096b0dfc7221f07b5ba260d74633c302b7157476");
  expect(provenance.retained_task_receipt.bytes).toBe(72237);
  // The private full receipt is not shipped here or authenticated by these tests.
  expect(guide).toContain("not a value observed at the uncaptured");
  expect(guide).toContain("not authentication");
});

