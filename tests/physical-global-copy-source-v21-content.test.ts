import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import index from "../docs/evidence/physical-global-copy-source-v21-20260924/index.json";

const evidence = "docs/evidence/physical-global-copy-source-v21-20260924";
const read = (name: string) => readFileSync(resolve(evidence, name));
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const positives = ["one", "registers"];
const refusals = {
  "wrong-launch": "physical-global-copy requires exact authored launch64 and max_grid2",
  "missing-lgkm": "global copy requires exact initial kernarg loads/wait",
  "missing-vm": "global copy read requires immediate VM wait",
  "wrong-carry": "global copy pointer high provenance",
  "wrong-store": "global copy store must consume actual loaded U32",
  "wrong-offset": "global copy repeated kernarg component",
  "reserved-register": "physical-global-copy instruction descriptor is outside the closed profile",
};
interface Observation {
  stage: string;
  canonical_identity?: string;
  canonical_bytes_sha256?: string;
  llvm_sha256?: string;
  native_observation_sha256?: string;
  diagnostic?: string;
}
interface SourceRow { feature: string; mode: string; observation: Observation }
interface Ladder { observations: SourceRow[] }
interface PublicRow {
  stage: string;
  status: number;
  signal: string | null;
  exact_source_refusal?: string;
  outputs?: { path: string; bytes: number; sha256: string }[];
}
interface PublicReport {
  observations: PublicRow[];
  sourcePins: { path: string; bytes: number; sha256: string }[];
  binaryPins: { bytes: number; sha256: string }[];
}
const ladder = JSON.parse(read("source-ladder.json").toString()) as Ladder;
const sourceRow = (name: string, mode: string) => ladder.observations.find(
  row => row.feature === "physical-global-copy-" + name + "-v21" && row.mode === mode,
)!;
const publicReport = (name: string) => JSON.parse(read("public-" + name + ".json").toString()) as PublicReport;

describe("physical global copy source V21 documentation", () => {
  it("retains ten original inert records and a distinct tested-source census", () => {
    expect(index.compiler_publication).toBe("dbfb61e7186e5fa37dd9d544d85de29c7a1080eb");
    expect(index.compiler_functional_tree).toBe("f49a2fc98386e443440c5b11cd9f0345f47db063");
    expect(index.compiler_publication_status).toBe("published on both compiler main branches; historical gate snapshots retained");
    expect(index).toMatchObject({
      inert_documentation_only: true, source_custody_exported: false,
      grants_artifact_or_launch_authority: false,
    });
    expect(index.records).toHaveLength(10);
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
      source_bytes: 28928,
      source_sha256: "54683ef6298972003abbca2c970e41f9d4ab3a90202f896d45d79a1d04a9d9ac",
      receipt_retained: false, summary_is_selected_fields_not_full_receipt: true,
      status: "command-passed", exit_code: 0, signal: null, errors: [],
      source_base_commit: "a2d4fea57411a981b172d904ddfce2356a0ed19e", source_tree_clean: false,
      hardware_observed: false, production_qualified: false,
    });
    expect(index.gate.source_before).toEqual(index.gate.source_after);
    expect(index.gate.source_before).toEqual({
      files: 7454, bytes: 110211318,
      sha256: "fb2e8d2d36633c78b7953ff62d05515ab99a0ce4588e5775c2df67b800a3b7fc",
    });
  });

  it("keeps observed 18/128/6/14 source and CPU counts separate from later continuations", () => {
    expect(ladder).toMatchObject({
      schema: "fe2o3-test-source-physical-global-copy-ladder-v21",
      cpu_positive_cases: 128, cpu_exact_negative_cases: 6, exact_negative_runs: 14,
      public_driver_output_relation: "exact_bytes_same_current_source",
      ranked_formal_descriptor_continuation: "unavailable; pre-ranked diagnostics only",
      native_llvm_executed: false, protected_finalizer_admitted: false,
      hardware_observed: false, grants_artifact_or_launch_authority: false,
    });
    expect(ladder.observations).toHaveLength(18);
    expect(new Set(ladder.observations.map(row => row.feature + "/" + row.mode)).size).toBe(18);
    for (const row of ladder.observations) expect(row).toMatchObject({
      actual_rustc_callback: true, source_unchanged: true,
      native_llvm_executed: false, protected_finalizer_admitted: false,
      hardware_observed: false, grants_artifact_or_launch_authority: false,
    });
    for (const [name, refusal] of Object.entries(refusals)) {
      for (const mode of ["observe", "diagnostic"]) {
        const observed = sourceRow(name, mode).observation;
        expect(observed.stage).toBe("exact_source_profile_refused");
        expect(observed.diagnostic).toContain(refusal);
        expect(observed.llvm_sha256).toBeUndefined();
      }
    }
  });

  for (const name of positives) {
    it("joins " + name + " actual source to CPU and exact diagnostic outputs", () => {
      const observed = sourceRow(name, "observe").observation;
      expect(observed).toMatchObject({
        stage: "actual_source_mir38_pre_ranked_kir21_cpu_emitter_diagnostics",
        entry_symbol: "physical_global_copy_" + name,
        authored_blocks: 1, native_instruction_count: 24, source_occurrences: 26,
        output_register: name === "one" ? 8 : 22,
        cpu_cases: 64, cpu_exact_negative_cases: 3, canaries_unchanged: true,
        cpu_grids: [64, 128], cpu_input_seeds: [0, 4294967295, 2863289685, 19],
        cpu_tail_lengths: [0, 1, 63, 64, 65, 127, 128, 129],
        full_exec_input_bounds_and_initialization_checked: true,
        same_backing_even_nonoverlap_refused: true, same_compiler_ledger_for_cpu_view: true,
        source_correspondence_exact: true, normal_checked_continuation: false,
        normal_worker_preparation: false, ranked_formal_descriptor_continuation: "unavailable",
        native_llvm_executed: false, hardware_observed: false,
        grants_artifact_or_launch_authority: false,
      });
      expect(observed.canonical_identity).toMatch(/^[0-9a-f]{64}$/u);
      expect(sourceRow(name, "diagnostic").observation).toEqual({
        stage: "public_pre_ranked_diagnostic_driver",
        canonical_sha256: observed.canonical_bytes_sha256,
        llvm_sha256: observed.llvm_sha256,
        native_observation_sha256: observed.native_observation_sha256,
      });
    });
  }

  for (const name of [...positives, ...Object.keys(refusals)]) {
    it("retains public " + name + " without claiming that command ran CPU/native", () => {
      const report = publicReport(name), positive = positives.includes(name);
      expect(report).toMatchObject({
        schema: "fe2o3-physical-global-copy-source-command-v21",
        feature: "physical-global-copy-" + name + "-v21",
        source_unchanged: true, actual_cargo_rustc_wrapper: true,
        compiler_closure_attestation: "unavailable", normal_worker_handoff: false,
        ranked_formal_descriptor_continuation: "unavailable; pre-ranked diagnostic route",
        cpu_simulation_run: false, source_custody_exported: false,
        protected_finalizer_admitted: false, native_llvm_executed: false,
        hardware_observed: false, grants_artifact_or_launch_authority: false,
      });
      expect(report.sourcePins).toEqual(publicReport("one").sourcePins);
      expect(report.binaryPins).toEqual(publicReport("one").binaryPins);
      expect(report.observations).toHaveLength(1);
      const row = report.observations[0];
      expect(row.stage).toBe("diagnostic");
      expect(row.status).toBe(positive ? 0 : 101);
      expect(row.signal).toBeNull();
      if (positive) {
        expect(row.outputs).toHaveLength(3);
        expect(row.outputs!.map(x => x.path.split("/").at(-1))).toEqual([
          "canonical-v21.bin", "canonical.ll", "native-observation-input-v21.txt",
        ]);
        for (const output of row.outputs!) {
          expect(output.bytes).toBeGreaterThan(0);
          expect(output.sha256).toMatch(/^[0-9a-f]{64}$/u);
        }
        const owner = sourceRow(name, "observe").observation;
        expect(row.outputs![1].sha256).toBe(owner.llvm_sha256);
        // Separate extractions do not inherit the isolated ladder's canonical/source identity.
        expect(row.outputs![0].sha256).not.toBe(owner.canonical_bytes_sha256);
        expect(row.outputs![2].sha256).not.toBe(owner.native_observation_sha256);
        expect(row.exact_source_refusal).toBeUndefined();
      } else {
        expect(row.exact_source_refusal).toBe(refusals[name as keyof typeof refusals]);
        expect(row.outputs).toBeUndefined();
      }
    });
  }

  it("keeps the actual source example and the full-EXEC/runtime limits visible", () => {
    const source = readFileSync("examples/physical-global-copy-v21.rs", "utf8");
    expect(hash(Buffer.from(source))).toBe("e14aee4c4a47526f70a9be6b8d6cfa61c353aa49301b28055b875d53b0dfb989");
    expect(source).toContain("pub fn physical_global_copy_one(input: &[u32], output: DisjointSlice<u32>)");
    expect(source).toContain("global_load_dword(v(8), v_pair(6));\n        s_waitcnt_vmcnt0();");
    expect(source.indexOf("global_load_dword")).toBeLessThan(source.indexOf("s_and_saveexec_b64"));
    expect(source).toContain("global_store_dword(v_pair(10), v(8));");
    expect(source).toContain("s_endpgm0();");
    const lesson = readFileSync("docs/physical-global-copy-source-v21.md", "utf8");
    for (const text of [
      "MIR38", "KIR21", "scripts/physical-global-copy-source-v21.mjs",
      "128 CPU cases", "14 source-negative", "18 source sessions", "512 bytes",
      "every resident lane", "unreadable pending value", "actual loaded SSA",
      "unresolved runtime conditions", "not a general alias theorem",
      "pre-ranked diagnostic", "does not recover the source", "M2/M3/M6/U4",
    ]) expect(lesson).toContain(text);
  });
});
