import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import index from "../docs/evidence/physical-entry-cpu-debug-actual-v20-20260924/index.json";
import report from "../docs/evidence/physical-entry-cpu-debug-actual-v20-20260924/report.json";

const dir = "docs/evidence/physical-entry-cpu-debug-actual-v20-20260924/";
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const sourceBytes = readFileSync("docs/evidence/physical-entry-checked-v20-20260924/checked-source-ladder.json");
const source = JSON.parse(sourceBytes.toString()) as {
  observations: { feature: string; mode: string; observation: {
    canonical_bytes_sha256: string; canonical_identity: string; entry_symbol: string;
  } }[];
};

describe("actual Rust-produced V20 artifacts through the CPU debugger CLI", () => {
  it("pins the separate actual-input report and dirty-source gate without source authority", () => {
    expect(index.compiler_publication).toBe("dbfb61e7186e5fa37dd9d544d85de29c7a1080eb");
    expect(index.compiler_functional_tree).toBe("f49a2fc98386e443440c5b11cd9f0345f47db063");
    expect(index.inert_documentation_only).toBe(true);
    expect(index.source_custody_exported).toBe(false);
    expect(index.grants_artifact_or_launch_authority).toBe(false);
    expect(index.records).toHaveLength(1);
    const pin = index.records[0];
    const retained = readFileSync(dir + pin.name);
    expect(retained.length).toBe(pin.retained_bytes);
    expect(hash(retained)).toBe(pin.retained_sha256);
    expect(["none", "append-one-final-newline"]).toContain(pin.normalization);
    const original = pin.normalization === "none" ? retained : retained.subarray(0, -1);
    expect(original.length).toBe(33470);
    expect(hash(original)).toBe("74f10e8bf82fd91219da6f2453976e9823bce8afdaf44130d3d272d2fe44ed11");
    expect(pin.source_bytes).toBe(original.length);
    expect(pin.source_sha256).toBe(hash(original));
    expect(index.gate).toMatchObject({
      source_bytes: 35611,
      source_sha256: "cafaaeb2169910469f5d0d2ceb316e297b3003cba19aa206e2f5ee33a9c04cc9",
      status: "command-passed", exit_code: 0, signal: null, errors: [],
      monitored_repository: "compiler", source_tree_clean: false,
      receipt_retained: false, summary_is_selected_fields_not_full_receipt: true,
      hardware_observed: false, production_qualified: false,
    });
    expect(index.gate.source_before).toEqual(index.gate.source_after);
    expect(index.gate.source_before).toEqual({
      files: 7477, bytes: 110417496,
      sha256: "b2cee0e6e821ea4945e4da382bfafb41f84c9e5e0084e1129bb167cc8e1807ab",
    });
    const requestBytes = readFileSync(index.request_example.path);
    expect(requestBytes.length).toBe(index.request_example.source_bytes);
    expect(hash(requestBytes)).toBe(index.request_example.source_sha256);
    expect(hash(requestBytes)).toBe(report.cases[0].request.sha256);
    expect(index.request_example.not_an_output_or_authority).toBe(true);
    const request = JSON.parse(requestBytes.toString());
    expect(request).toMatchObject({
      schema: "fe2o3-simulation-request-v1", kernel: "physical_one",
      grid: [64, 1, 1], workgroup: [64, 1, 1],
    });
    expect(request.arguments).toHaveLength(5);
    expect(request.arguments[0]).toMatchObject({
      kind: "buffer", element: "u32", access: "read_write", alignment: 4,
      bytes: "0x" + "a5".repeat(528), initialized: "0x" + "00".repeat(66),
    });
    expect(request.arguments.slice(1).map((arg: { bits: string }) => arg.bits))
      .toEqual(["0x00000013", "0x00000017", "0x0000002a", "0x00000000"]);
    expect(index.qualification).toEqual({
      ignored_loader_sessions: 4, public_jsonl_sessions: 4,
      transactional_refusals: 40, bootstrap_refusals: 5,
      pure_qualifier_tests: 6, ordinary_cli_tests: 11,
      same_actual_source_artifacts: true, source_custody_recovered_from_bytes: false,
      hardware_execution: false, resumable_execution: false,
    });
    expect(report).toMatchObject({
      schema: "fe2o3-physical-entry-actual-artifact-cpu-debug-qualification-v20",
      status: "pass", source_custody: false, runtime_authority: false,
      native_execution: false, hardware_observed: false,
      protected_authority: false, resumable_execution: false,
      ignored_loader_sessions: 4, public_jsonl_sessions: 4,
      transactional_refusals: 40, bootstrap_refusals: 5,
    });
    const originalSource = sourceBytes.at(-1) === 10
      && sourceBytes.length === report.source_observation.bytes + 1
      ? sourceBytes.subarray(0, -1) : sourceBytes;
    expect(originalSource.length).toBe(report.source_observation.bytes);
    expect(hash(originalSource)).toBe(report.source_observation.sha256);
  });

  it("joins all actual source artifacts and retains observed checkpoints rather than guessed scheduling", () => {
    expect(report.cases.map(row => row.label)).toEqual([
      "one-selector0", "diamond-selector0", "diamond-selector1", "registers-selector1",
    ]);
    for (const row of report.cases) {
      const previous = source.observations.find(
        item => item.feature === row.feature && item.mode === "observe",
      )!.observation;
      expect(row.entry_symbol).toBe(previous.entry_symbol);
      expect(row.canonical.sha256).toBe(previous.canonical_bytes_sha256);
      expect(row.canonical_identity).toBe(previous.canonical_identity);
      expect(row.canonical.sha256).not.toBe(row.canonical_identity);
      expect(row.loader.canonical_sha256).toBe("0x" + row.canonical_identity);
      expect(row.loader.request_sha256).toBe("0x" + row.request.sha256);
      expect(row.configuration_identity).toMatch(/^[a-f0-9]{64}$/u);
      expect(row).toMatchObject({
        symbolic_unavailable_bindings: 11, transactional_refusals: 10,
        final_written_words: 64, unchanged_tail_bytes: 272,
        source_custody: false, hardware_observed: false,
      });
      expect(row.loader).toMatchObject({
        schema: "fe2o3-physical-entry-cpu-debug-cli-observation-v20",
        source_custody: false, hardware_observed: false,
        protected_authority: false, resumable_execution: false,
      });
      const path = row.label.startsWith("one") ? [0]
        : row.selector === 0 ? [0, 2, 3] : [0, 1, 3];
      expect(row.observed_blocks).toEqual(path);
      expect(row.loader.lane_zero_checkpoints.length).toBeLessThanOrEqual(128);
      const before = row.loader.lane_zero_checkpoints.find(
        point => point.index + 1 === row.first_store_before,
      )!;
      const after = row.loader.lane_zero_checkpoints.find(
        point => point.index + 1 === row.first_store_after,
      )!;
      expect(before.phase).toBe("before_operation");
      expect(after.phase).toBe("after_operation");
      expect([before.block, before.operation]).toEqual([after.block, after.operation]);
      expect(row.first_store_before).toBeGreaterThan(96);
      expect(row.first_store_after).toBeGreaterThan(row.first_store_before);
      expect(row.loader.final_checkpoint_index).toBe(row.loader.records - 1);
      expect(row.loader.records).toBeLessThanOrEqual(8192);
    }
  });

  it("preserves exact V21 and authority-option refusals and the lesson's limits", () => {
    expect(report.refusals.map(row => [row.label, row.code, row.status])).toEqual([
      ["refuse-v21", "kir_v20_debug_wrong_version", 1],
      ["refuse-source-map", "kir_v20_debug_option_unavailable", 1],
      ["refuse-register-map", "kir_v20_debug_option_unavailable", 1],
      ["refuse-wave32", "kir_v20_debug_option_unavailable", 1],
      ["refuse-request-authority", "kir_v20_debug_request_refused", 1],
    ]);
    const lesson = readFileSync("docs/physical-entry-cpu-debug-v20.md", "utf8");
    for (const phrase of [
      "four typed-loader sessions and four public JSONL sessions",
      "528-byte output", "remaining 272 bytes", "11 symbolic bindings",
      "Forty", "five startup refusals", "no source custody",
      "not a promise that future captures reuse the same record indexes",
      "six pure qualifier controls", "11 ordinary CLI tests",
      "No GPU execution", "resumable replay",
    ]) expect(lesson).toContain(phrase);
  });
});
