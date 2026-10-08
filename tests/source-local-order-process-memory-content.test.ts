import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lesson = readFileSync("docs/source-local-order-report-outcomes-v1.md", "utf8");
const marker = "\n## Observe process memory without calling it owner memory\n";
const at = lesson.indexOf(marker);
const section = lesson.slice(at);
const flat = section.replace(/\s+/g, " ");

describe("separate recipe process-memory tutorial", () => {
  it("preserves the complete earlier report and latency lesson", () => {
    expect(at).toBeGreaterThan(0);
    expect(lesson.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(lesson.slice(0, at));
    expect(prefix.length).toBe(17674);
    expect(createHash("sha256").update(prefix).digest("hex")).toBe(
      "237c8a878e9681f1840a2200ebf169cfddd8c8e7c260582385758025f93a0a9f",
    );
  });

  it("uses a separate genuine selector without inventing CLI or config grammar", () => {
    for (const text of [
      "actual_source_local_order_recipe_outcome_process_memory_v1",
      "Discover", "Create → ordinary → series",
      "backend test adapter", "not another ordinary CLI command",
      "not invent a `--rss` flag", "independent ordinary oracles",
      "docs/recipe-outcome-series-v1.md", "rss_measured: true",
      "strict latency parser rejects", "do not remove the field",
    ]) expect(flat.toLowerCase()).toContain(text.toLowerCase());
    expect(section).not.toContain("FE2O3_PIN");
  });

  it("requires exact identity and every checkpoint instead of plausible numbers", () => {
    for (const text of [
      "FE2O3_RECIPE_PROCESS_MEMORY_V1", "fe2o3-recipe-process-memory-v1",
      "LF-terminated", "strict UTF-8", "`pid`", "`config_sha256`",
      "`current_source_sha256`", "`workload`", "`sequence`", "`call_ordinal`",
      "exactly 5 memory rows", "exactly 107", "missing terminal row",
      "not a zero-memory result", "must not be repaired or merged",
    ]) expect(flat).toContain(text);
    const stages = [
      "`before_run`", "`before_transaction`", "`after_return_result_retained`",
      "`after_result_drop`", "`terminal_before_child_return`",
    ];
    const positions = stages.map((stage) => section.indexOf(stage));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("keeps whole-process counters distinct from owner and exit measurements", () => {
    for (const text of [
      "whole compiler process", "including frontend state and the observer",
      "rss_bytes", "os_high_water_rss_bytes", "/proc/self/status",
      "1,024 bytes", "not an atomic snapshot", "not reset per call",
      "maximum sampled RSS can miss", "is not process exit",
      "retained_owner_bytes", "temporary_owner_overlap_bytes", "heap_peak_bytes",
      "remain null", "Do not subtract", "reservation-ledger peak, not measured heap",
      "not comparable", "compiler cancellation", "accepted SLO", "U4 completion",
    ]) expect(flat).toContain(text);
  });

  it("scopes the completed observation to its dated source and exact receipts", () => {
    for (const text of [
      "2026-10-08 UTC", "224 memory rows", "2 × (5 + 107)",
      "checked_rebind", "exact_revision_refusal", "All 70 series outcomes",
      "four observed children", "85 JavaScript", "26 Rust",
      "213,180,416 bytes", "231,145,472 bytes",
      "05:52:53.315", "05:53:10.846",
      "e8d079fcf43e4b23428da70f8cce17338bed3c533a989c4f46d1ef5786f8719e",
      "1f74456624717c8c2c0ab9ae26b3eae67f87b098a34b2cc088e3c435fb8d121e",
      "0fcad714e94a06e6177474c5d461d47547924ab41e0d47075e1abf8fdac329de",
      "tested source snapshot", "not every later compiler checkout",
    ]) expect(flat).toContain(text);
  });

  it("teaches mutation diagnosis without repairing evidence or claiming authenticity", () => {
    for (const text of [
      "separate copy", "Remove the terminal row", "duplicate a sequence number",
      "replace one PID", "Preserve the original evidence",
      "record consistency, not execution authenticity",
    ]) expect(flat).toContain(text);
    expect(flat).not.toContain("root must");
    expect(flat).not.toContain("publication placeholder");
  });
});
