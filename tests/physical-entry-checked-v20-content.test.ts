import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import index from "../docs/evidence/physical-entry-checked-v20-20260924/index.json";

const evidence = "docs/evidence/physical-entry-checked-v20-20260924";
const read = (name: string) => readFileSync(resolve(evidence, name));
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const positives = ["one", "diamond", "registers"];
const refusals = {
  "wrong-launch": "physical-entry requires exact authored launch64 and max_grid2",
  "foreign-input": "physical-entry marker operands differ from exact root argument order",
  "undefined-merge": "physical-entry reads an undefined physical register",
  "missing-wait": "physical load used before lgkm wait",
  "wrong-carry": "physical pointer high origin",
};
interface KernargRead {
  offset: number;
  width: number;
  block: number;
  operation: number;
  source_occurrence: number;
  ready_block: number;
  ready_operation: number;
  ready_source_occurrence: number;
}
interface Observation {
  stage: string;
  canonical_identity?: string;
  canonical_bytes_sha256?: string;
  llvm_sha256?: string;
  handoff_sha256?: string;
  descriptor_sha256?: string;
  middle_end_evidence_sha256?: string;
  kernarg_reads?: KernargRead[];
  diagnostic?: string;
}
interface SourceRow {
  feature: string;
  mode: string;
  observation: Observation;
}
interface Ladder {
  observations: SourceRow[];
}
interface PublicRow {
  stage: string;
  status: number;
  signal: string | null;
  exact_source_refusal?: string;
  output?: { bytes: number; sha256: string };
}
interface PublicReport {
  observations: PublicRow[];
  sourcePins: { sha256: string }[];
  binaryPins: { sha256: string }[];
}
const ladder = JSON.parse(read("checked-source-ladder.json").toString()) as Ladder;
const sourceRow = (name: string, mode: string) => ladder.observations.find(
  row => row.feature === "physical-entry-" + name + "-v20" && row.mode === mode,
)!;
const publicReport = (name: string) =>
  JSON.parse(read("public-" + name + ".json").toString()) as PublicReport;

describe("physical-entry checked continuation documentation", () => {
  it("pins nine inert original records and distinguishes tested source from publication", () => {
    expect(index.compiler_publication).toBe("a2d4fea57411a981b172d904ddfce2356a0ed19e");
    expect(index.compiler_publication_status).toBe("functional commit identified; observed gate predates commit");
    expect(index).toMatchObject({
      inert_documentation_only: true, source_custody_exported: false,
      grants_artifact_or_launch_authority: false,
    });
    expect(index.records).toHaveLength(9);
    for (const pin of index.records) {
      const bytes = read(pin.name);
      expect(bytes.length).toBe(pin.retained_bytes);
      expect(hash(bytes)).toBe(pin.retained_sha256);
      expect(["none", "append-one-final-newline"]).toContain(pin.normalization);
      if (pin.normalization === "append-one-final-newline") expect(bytes.at(-1)).toBe(10);
      const original = pin.normalization === "append-one-final-newline" ? bytes.subarray(0, -1) : bytes;
      expect(original.length).toBe(pin.source_bytes);
      expect(hash(original)).toBe(pin.source_sha256);
    }
    expect(index.gate).toMatchObject({
      source_bytes: 30449,
      source_sha256: "8531f3d27144a3472ea2c44fafaca0f05c5ac7564ea4de76dbf1e9bf226883f1",
      receipt_retained: false, summary_is_selected_fields_not_full_receipt: true,
      status: "command-passed", exit_code: 0, signal: null, errors: [],
      source_base_commit: "34a2db6c8d44d4e2f00978be64e2b997c19a59c5", source_tree_clean: false,
      hardware_observed: false, production_qualified: false,
    });
    expect(index.gate.source_before).toEqual(index.gate.source_after);
    expect(index.gate.source_before).toEqual({
      files: 7376, bytes: 109435341,
      sha256: "be176b02b7c4d92e221e3665d466a7dbba99cb1bbcd811cf02ceff6adab99b65",
    });
  });

  it("keeps the observed 24/576/15/54/12 counts distinct from GPU or runtime proof", () => {
    expect(ladder).toMatchObject({
      schema: "fe2o3-test-source-physical-production-ladder-v20",
      cpu_positive_cases: 576, exact_negative_runs: 15,
      actual_owner_abi_negative_controls: 54, abi_resource_denial_controls: 12,
      public_driver_output_relation: "exact_bytes_same_current_source",
      ranked_formal_descriptor_continuation: "normal checked source to inert LLVM/handoff",
      runtime_abi_conditions_discharged: false, native_llvm_executed: false,
      protected_finalizer_admitted: false, hardware_observed: false,
      grants_artifact_or_launch_authority: false,
    });
    expect(ladder.observations).toHaveLength(24);
    expect(new Set(ladder.observations.map(row => row.feature + "/" + row.mode)).size).toBe(24);
    for (const row of ladder.observations) {
      expect(row).toMatchObject({
        actual_rustc_callback: true, source_unchanged: true, native_llvm_executed: false,
        protected_finalizer_admitted: false, hardware_observed: false,
        grants_artifact_or_launch_authority: false,
      });
    }
    for (const [name, refusal] of Object.entries(refusals)) {
      for (const mode of ["observe", "llvm", "handoff"]) {
        const observed = sourceRow(name, mode).observation;
        expect(observed.stage).toBe("exact_source_profile_refused");
        expect(observed.diagnostic).toContain(refusal);
        expect(observed.llvm_sha256).toBeUndefined();
        expect(observed.handoff_sha256).toBeUndefined();
      }
    }
  });

  for (const name of positives) {
    it("joins " + name + " checked owner to both ordinary outputs without changing authored CFG", () => {
      const observed = sourceRow(name, "observe").observation;
      expect(observed).toMatchObject({
        stage: "actual_source_mir37_checked_kir20_cpu_normal_inert_handoff",
        entry_symbol: "physical_" + name,
        authored_blocks: name === "one" ? 1 : 4,
        native_instruction_count: name === "one" ? 21 : 25,
        cpu_cases: 192, canaries_unchanged: true,
        actual_owner_abi_negative_controls: 18, abi_resource_denial_controls: 4,
        cpu_grids: [64, 128], cpu_selectors: [0, 1, 4294967295],
        cpu_tail_lengths: [0, 1, 63, 64, 65, 127, 128, 129],
        normal_worker_preparation: true, same_owner_source_canonical_descriptor_entry: true,
        kernarg_alignment: 8, kernarg_minimum_bytes: 32, output_launch_minimum_bytes: 512,
        runtime_abi_conditions_discharged: false, protected_finalizer_admitted: false,
        native_llvm_executed: false, hardware_observed: false, grants_artifact_or_launch_authority: false,
        runtime_abi_conditions: "kernarg immutability and output/kernarg disjointness remain runtime obligations; output launch envelope requires 512 bytes",
      });
      for (const digest of [observed.canonical_identity, observed.canonical_bytes_sha256,
        observed.descriptor_sha256, observed.middle_end_evidence_sha256]) {
        expect(digest).toMatch(/^[0-9a-f]{64}$/u);
      }
      expect(sourceRow(name, "llvm").observation).toEqual({
        stage: "public_normal_checked_llvm_driver", llvm_sha256: observed.llvm_sha256,
      });
      expect(sourceRow(name, "handoff").observation).toEqual({
        stage: "public_normal_inert_handoff_driver", handoff_sha256: observed.handoff_sha256,
      });
      expect(observed.kernarg_reads).toEqual(
        [[0, 8], [8, 8], [16, 4], [20, 4], [24, 4], [28, 4]].map(([offset, width], i) => ({
          offset, width, block: 0, operation: i + 1, source_occurrence: i + 2,
          ready_block: 0, ready_operation: 7, ready_source_occurrence: 8,
        })),
      );
    });
  }

  for (const name of [...positives, ...Object.keys(refusals)]) {
    it("retains the two public " + name + " routes without attributing CPU/native execution to them", () => {
      const report = publicReport(name), positive = positives.includes(name);
      expect(report).toMatchObject({
        schema: "fe2o3-physical-entry-checked-source-command-v20",
        feature: "physical-entry-" + name + "-v20",
        source_unchanged: true, actual_cargo_rustc_wrapper: true,
        compiler_closure_attestation: "unavailable", normal_worker_handoff: positive,
        ranked_formal_descriptor_continuation: positive
          ? "observed normal checked source to inert LLVM/handoff" : "exact source refusal",
        runtime_abi_conditions_discharged: false,
        runtime_abi_conditions: "kernarg immutable throughout execution and output disjoint from kernarg; output minimum 512 bytes",
        cpu_simulation_run: false, source_custody_exported: false,
        protected_finalizer_admitted: false, native_llvm_executed: false,
        hardware_observed: false, grants_artifact_or_launch_authority: false,
      });
      expect(report.observations.map(row => row.stage)).toEqual(["llvm", "handoff"]);
      expect(report.sourcePins).toEqual(publicReport("one").sourcePins);
      expect(report.binaryPins).toEqual(publicReport("one").binaryPins);
      for (const observed of report.observations) {
        expect(observed.status).toBe(positive ? 0 : 101);
        expect(observed.signal).toBeNull();
        if (positive) {
          expect(observed.output!.bytes).toBeGreaterThan(0);
          expect(observed.output!.sha256).toMatch(/^[0-9a-f]{64}$/u);
          const owner = sourceRow(name, "observe").observation;
          if (observed.stage === "llvm") expect(observed.output!.sha256).toBe(owner.llvm_sha256);
          else expect(observed.output!.sha256).not.toBe(owner.handoff_sha256);
          expect(observed.exact_source_refusal).toBeUndefined();
        } else {
          expect(observed.exact_source_refusal).toBe(refusals[name as keyof typeof refusals]);
          expect(observed.output).toBeUndefined();
        }
      }
    });
  }

  it("documents safety projection, conditional ABI and inert demotion without changing earlier evidence", () => {
    const lesson = readFileSync("docs/physical-entry-source-v20.md", "utf8");
    for (const text of [
      "90de8eaf2ef445e0d470793fb2a74169eec9175b", index.compiler_publication,
      "scripts/physical-entry-checked-v20.mjs", "FE2O3_TEST_PHYSICAL_PRODUCTION_OUTPUT_V20",
      "safety-analysis projection", "original canonical SSA and CFG remain the executable",
      "not serialize the full combined proof", "512 bytes", "unresolved runtime obligations",
      "576 CPU cases", "54 actual-owner ABI mutation refusals", "12 budget-denial controls",
      "At that earlier snapshot", "physical-entry-cpu-debug-v20.md", "M2/M3/M6/U4 are not",
    ]) expect(lesson).toContain(text);
    expect(lesson).not.toContain("This snapshot still lacks normal production ranked/formal descriptor");
    const earlier = JSON.parse(readFileSync("docs/evidence/physical-entry-source-v20-20260924/source-ladder.json", "utf8"));
    expect(earlier.observations).toHaveLength(16);
    expect(earlier.ranked_formal_descriptor_continuation).toBe("unavailable; pre-ranked diagnostics only");
  });
});
