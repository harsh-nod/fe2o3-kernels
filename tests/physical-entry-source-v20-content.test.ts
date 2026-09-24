import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import index from "../docs/evidence/physical-entry-source-v20-20260924/index.json";

const root = "docs/evidence/physical-entry-source-v20-20260924";
const read = (name: string) => readFileSync(resolve(root, name));
interface SourceObservation {
  feature: string;
  mode: string;
  observation: {
    canonical_identity?: string;
    canonical_bytes_sha256?: string;
    llvm_sha256?: string;
    native_observation_sha256?: string;
    cpu_cases?: number;
    canaries_unchanged?: boolean;
  };
}
interface Ladder {
  observations: SourceObservation[];
}
interface Native {
  entry: string;
  optimization: string;
  authored_instructions: number;
  entry_bytes: number;
  hsaco_bytes: number;
  hsaco_sha256: string;
  canonical_claimed_sha256: string;
  llvm_sha256: string;
  expectation_sha256: string;
  expected_vgpr_minimum: number;
  descriptor: { vgpr_capacity: number };
  native_mutation_refusals: { accepted: boolean }[];
  expectation_refusals: { accepted: boolean }[];
  input_refusals: { accepted: boolean }[];
}
const ladder = JSON.parse(read("source-ladder.json").toString()) as Ladder;
const native = (name: string, level: string) =>
  JSON.parse(read(name + "-" + level.toLowerCase() + ".json").toString()) as Native;
const source = (name: string) => ladder.observations.find(
  row => row.feature === "physical-entry-" + name + "-v20" && row.mode === "observe",
)!.observation;

describe("physical-entry source and native diagnostic lesson", () => {
  it("pins all 15 records and exact matrix framing without exporting authority", () => {
    expect(index.compiler_publication).toBe("90de8eaf2ef445e0d470793fb2a74169eec9175b");
    expect(index.records).toHaveLength(15);
    expect(index.inert_documentation_only).toBe(true);
    for (const pin of index.records) {
      const bytes = read(pin.name);
      expect(bytes.length).toBe(pin.retained_bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(pin.retained_sha256);
      expect(["none", "append-one-final-newline"]).toContain(pin.normalization);
      const original = pin.normalization === "append-one-final-newline" ? bytes.subarray(0, -1) : bytes;
      expect(original.length).toBe(pin.source_bytes);
      expect(createHash("sha256").update(original).digest("hex")).toBe(pin.source_sha256);
    }
    expect(index.native_matrix_stdout_sha256).toBe("b483bd846583d3719e309f6caa7712c9963e1b9024cb781418324ded9ba54663");
  });

  it("retains actual source sessions, CPU cases and precise refusals separately", () => {
    expect(ladder.observations).toHaveLength(16);
    expect(ladder).toMatchObject({
      cpu_positive_cases: 576, exact_negative_runs: 10,
      hardware_observed: false, native_llvm_executed: false,
      protected_finalizer_admitted: false, grants_artifact_or_launch_authority: false,
      ranked_formal_descriptor_continuation: "unavailable; pre-ranked diagnostics only",
    });
    for (const name of ["one", "diamond", "registers"]) {
      expect(source(name)).toMatchObject({ cpu_cases: 192, canaries_unchanged: true });
    }
  });

  for (const name of ["one", "diamond", "registers"]) {
    for (const level of ["O0", "O3"]) {
      it("joins " + name + " " + level + " to the same source LLVM and canonical identity", () => {
        const report = native(name, level), observed = source(name);
        expect(report).toMatchObject({
          schema: "private-canonical-physical-entry-native-observation-v20-r1",
          entry: "physical_" + name, optimization: level,
          target: "gfx942:xnack-", wave_width: 64, code_object_version: 6,
          source_authentication: false, canonical_owner_admission: false,
          owner_contract_accepted: false, protected_finalizer_admission: false,
          native_functional_execution: false, hardware_execution: false,
          milestone_completion: false, runtime_pointer_validity_proved: false,
          general_hazard_model_qualified: false, synthetic_worker_identity_fields: true,
          external_same_source_owner_join_required: true, expectations_are_inert: true,
          compiler_prologue_instructions: 0, compiler_tail_instructions: 0,
        });
        expect(report.canonical_claimed_sha256).toBe(observed.canonical_identity);
        expect(report.llvm_sha256).toBe(observed.llvm_sha256);
        expect(report.expectation_sha256).toBe(observed.native_observation_sha256);
        expect(report.authored_instructions).toBe(name === "one" ? 21 : 25);
        expect(report.entry_bytes).toBe(name === "one" ? 116 : 132);
        expect(report.hsaco_bytes).toBe(name === "one" ? 5400 : name === "diamond" ? 5504 : 5520);
        expect(report.expected_vgpr_minimum).toBe(name === "registers" ? 23 : 9);
        expect(report.descriptor.vgpr_capacity).toBe(name === "registers" ? 24 : 16);
        expect(report.native_mutation_refusals).toHaveLength(name === "one" ? 37 : 43);
        expect(report.expectation_refusals).toHaveLength(11);
        expect(report.input_refusals).toHaveLength(2);
        for (const row of [...report.native_mutation_refusals, ...report.expectation_refusals, ...report.input_refusals]) {
          expect(row.accepted).toBe(false);
        }
        expect(report.hsaco_sha256).toBe(native(name, "O0").hsaco_sha256);
      });
    }
  }

  for (const name of ["one", "diamond", "registers", "wrong-launch", "foreign-input", "undefined-merge", "missing-wait", "wrong-carry"]) {
    it("keeps public Cargo " + name + " independent of CPU/native execution", () => {
      const report = JSON.parse(read("public-" + name + ".json").toString());
      expect(report).toMatchObject({
        source_unchanged: true, actual_cargo_rustc_wrapper: true,
        normal_worker_handoff: false, cpu_simulation_run: false,
        source_custody_exported: false, protected_finalizer_admitted: false,
        native_llvm_executed: false, hardware_observed: false,
        grants_artifact_or_launch_authority: false,
      });
      expect(report.observations).toHaveLength(1);
      const observed = report.observations[0];
      const positive = ["one", "diamond", "registers"].includes(name);
      expect(observed.status).toBe(positive ? 0 : 101);
      expect(observed.signal).toBeNull();
      if (positive) {
        expect(observed.outputs).toHaveLength(3);
        expect(observed.outputs[1].sha256).toBe(source(name).llvm_sha256);
        expect(observed.outputs[0].sha256).not.toBe(source(name).canonical_bytes_sha256);
      } else {
        expect(observed.exact_source_refusal).toBeTypeOf("string");
        expect(observed.outputs).toBeUndefined();
      }
    });
  }

  it("links an actual source example and keeps pipeline and debugger limitations", () => {
    const lesson = readFileSync("docs/physical-entry-source-v20.md", "utf8");
    for (const text of ["90de8eaf2ef445e0d470793fb2a74169eec9175b", "576 CPU cases", "side-effecting inline-assembly", "not an LLVM bypass", "At that earlier snapshot", "physical-entry-cpu-debug-v20.md", "M2/M3/M6/U4 are not"]) {
      expect(lesson).toContain(text);
    }
    const example = readFileSync("examples/physical-entry-v20.rs", "utf8");
    expect(example).toContain("pub fn physical_one(");
    expect(example).toContain("global_store_dword(v_pair(6), v(8));");
    expect(example).toContain("s_mov_b64_exec(s_pair(18));");
    expect(example).toContain("s_endpgm0();");
    for (const file of ["README.md", "docs/source-helper-native-v30.md"]) {
      expect(readFileSync(file, "utf8")).toContain("physical-entry-source-v20.md");
    }
  });
});
