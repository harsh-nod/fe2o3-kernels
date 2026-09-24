import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("typed V20 CPU debugger tutorial boundaries", () => {
  const lesson = readFileSync("docs/physical-entry-cpu-debug-v20.md", "utf8");

  it("uses the closed CLI and publishes requests, never invented observations", () => {
    const raw = readFileSync("examples/physical-entry-cpu-debug-v20.jsonl", "utf8");
    const requests = raw.trimEnd().split("\n").map(line => JSON.parse(line));
    expect(requests).toEqual([
      { schema: "fe2o3-debug-request-v1", request_id: 1, expected_revision: 0, operation: "discover_capabilities" },
      { schema: "fe2o3-debug-request-v1", request_id: 2, expected_revision: 0, operation: "step", direction: "forward", granularity: "event", count: 1 },
      { schema: "fe2o3-debug-request-v1", request_id: 3, expected_revision: 1, operation: "step", direction: "reverse", granularity: "event", count: 1 },
      { schema: "fe2o3-debug-request-v1", request_id: 4, expected_revision: 2, operation: "terminate" },
    ]);
    expect(raw.endsWith("\n")).toBe(true);
    for (const row of requests) {
      expect(row.status).toBeUndefined();
      expect(row.result).toBeUndefined();
    }
    for (const text of [
      "fe2o3-debug sim", "--diagnostic-kir-v20", "--request", "--protocol jsonl",
      "--wave-width 64", "client requests only", "not a captured response",
      "browses the retained sessions without re-executing them", "this loader cannot authenticate source custody",
    ]) expect(lesson.replace(/\s+/gu, " ")).toContain(text);
  });

  it("distinguishes symbolic SSA, resident waves, observational navigation and hardware", () => {
    for (const text of [
      "Unavailable { reason: NotRepresented }", "not silently removed",
      "not an absolute", "active_mask", "resident lanes, not physical EXEC",
      "separate SSA binding", "does not resume execution",
      "not a new execution", "V21 pending-load", "not supported by this adapter",
      "do not expose a cloneable raw", "same owned ledger",
      "not process RSS limits", "does not publish a partially failed execution",
      "refuse without", "before a new", "not a transactional rollback guarantee",
      "512 MiB", "2^29", "8,192", "4,096", "256 bytes",
    ]) expect(lesson.replace(/\s+/gu, " ")).toContain(text);
    expect(lesson).toContain("actual-source CLI qualification passed on the retained snapshots");
    expect(lesson).toContain("The CLI still acquires no source custody");
    expect(lesson).toContain("Forty");
    expect(lesson).not.toContain("hardware_observed: true");
  });

  it("connects the two bounded profiles without broad milestone or execution claims", () => {
    expect(lesson).toContain("physical-entry-source-v20.md");
    const global = readFileSync("docs/physical-global-copy-source-v21.md", "utf8");
    expect(global).toContain("physical-entry-cpu-debug-v20.md");
    expect(global).toContain("V21 symbolic pending-load debug sessions are not admitted");
    const inventory = readFileSync("README.md", "utf8");
    expect(inventory).toContain("docs/physical-global-copy-source-v21.md");
    expect(inventory).toContain("docs/physical-entry-cpu-debug-v20.md");
    const old = readFileSync("docs/physical-entry-source-v20.md", "utf8");
    expect(old).toContain("At that earlier snapshot");
    expect(old).toContain("physical-entry-cpu-debug-v20.md");
  });
});
