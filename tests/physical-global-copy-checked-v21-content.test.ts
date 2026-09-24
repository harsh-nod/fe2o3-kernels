import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import index from "../docs/evidence/physical-global-copy-checked-v21-20260924/index.json";
const dir = "docs/evidence/physical-global-copy-checked-v21-20260924/";
const read = (name: string) => readFileSync(dir + name);
const hash = (b: Buffer) => createHash("sha256").update(b).digest("hex");
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
  stage: string; canonical_identity?: string; canonical_bytes_sha256?: string;
  llvm_sha256?: string; handoff_sha256?: string; descriptor_sha256?: string;
  diagnostic?: string; descriptor_extension_negative_controls?: number;
  kernarg_reads?: {
    block: number; offset: number; operation: number; ready_operation: number;
    ready_source_occurrence: number; source_occurrence: number; width: number;
  }[];
}
interface Row { feature: string; mode: string; observation: Observation }
interface Ladder { observations: Row[] }
interface PublicReport {
  sourcePins: { path: string; bytes: number; sha256: string }[];
  binaryPins: { bytes: number; sha256: string }[];
  observations: {
    stage: string; status: number; signal: string | null; exact_source_refusal?: string;
    output?: { bytes: number; sha256: string };
    diagnostic_relation?: {
      canonical_identity: string; canonical_llvm_sha256: string;
      descriptor_sha256: string; handoff_sha256: string;
    };
  }[];
}
const ladder = JSON.parse(read("checked-source-ladder.json").toString()) as Ladder;
const earlier = JSON.parse(readFileSync(
  "docs/evidence/physical-global-copy-source-v21-20260924/source-ladder.json", "utf8",
)) as Ladder;
const row = (name: string, mode: string, owner = ladder) =>
  owner.observations.find(x => x.feature === "physical-global-copy-" + name + "-v21" && x.mode === mode)!;
const publicReport = (name: string) => JSON.parse(read("public-" + name + ".json").toString()) as PublicReport;

describe("normal checked V21 global-copy continuation", () => {
  it("pins later evidence independently of the earlier pre-ranked packet", () => {
    expect(index.compiler_publication).toBe("dbfb61e7186e5fa37dd9d544d85de29c7a1080eb");
    expect(index.compiler_functional_tree).toBe("f49a2fc98386e443440c5b11cd9f0345f47db063");
    expect(index.records).toHaveLength(10);
    for (const p of index.records) {
      const b = read(p.name);
      expect(b.length).toBe(p.retained_bytes); expect(hash(b)).toBe(p.retained_sha256);
      expect(["none", "append-one-final-newline"]).toContain(p.normalization);
      const raw = p.normalization === "append-one-final-newline" ? b.subarray(0, -1) : b;
      expect(raw.length).toBe(p.source_bytes); expect(hash(raw)).toBe(p.source_sha256);
    }
    expect(index.gate).toMatchObject({
      source_bytes: 30431,
      source_sha256: "a6470260dfa3cfe3b47d871a48e71f74fa49a8f9c4f9a731103a5a5e74794b2f",
      status: "command-passed", exit_code: 0, signal: null, errors: [],
      receipt_retained: false, summary_is_selected_fields_not_full_receipt: true,
      source_base_commit: "a2d4fea57411a981b172d904ddfce2356a0ed19e",
      source_tree_clean: false, hardware_observed: false, production_qualified: false,
    });
    expect(index.gate.source_before).toEqual(index.gate.source_after);
    expect(index.gate.source_before).toEqual({
      files: 7477, bytes: 110416253,
      sha256: "3126661ae9fc95d60eda435744eba2d0fd83768a8f3405a91bc200101c3c3550",
    });
    expect(earlier).toMatchObject({
      ranked_formal_descriptor_continuation: "unavailable; pre-ranked diagnostics only",
    });
    expect(earlier.observations).toHaveLength(18);
  });

  it("retains actual 27/128/6/21/88/8/6 checks without runtime or protected admission", () => {
    expect(ladder).toMatchObject({
      schema: "fe2o3-test-source-physical-global-copy-production-ladder-v21",
      cpu_positive_cases: 128, cpu_negative_controls: 6, exact_negative_runs: 21,
      actual_owner_abi_negative_controls: 88, abi_resource_denial_controls: 8,
      ranked_formal_descriptor_continuation: "normal checked source to inert LLVM/handoff",
      public_driver_output_relation: "exact_bytes_same_current_source",
      runtime_abi_conditions_discharged: false, native_llvm_executed: false,
      protected_finalizer_admitted: false, hardware_observed: false,
      grants_artifact_or_launch_authority: false,
    });
    expect(ladder.observations).toHaveLength(27);
    expect(new Set(ladder.observations.map(x => x.feature + "/" + x.mode)).size).toBe(27);
    expect(positives.reduce((n, name) =>
      n + row(name, "observe").observation.descriptor_extension_negative_controls!, 0)).toBe(6);
    for (const [name, refusal] of Object.entries(refusals))
      for (const mode of ["observe", "llvm", "handoff"]) {
        const o = row(name, mode).observation;
        expect(o.stage).toBe("exact_source_profile_refused");
        expect(o.diagnostic).toContain(refusal);
        expect(o.llvm_sha256).toBeUndefined(); expect(o.handoff_sha256).toBeUndefined();
      }
  });

  for (const name of positives) it("joins " + name + " source/ABI/readiness to both normal outputs", () => {
    const o = row(name, "observe").observation;
    expect(o).toMatchObject({
      stage: "actual_source_mir38_checked_kir21_cpu_normal_inert_handoff",
      entry_symbol: "physical_global_copy_" + name, authored_blocks: 1,
      native_instruction_count: 24, logical_slice_arguments: 2, native_abi_slots: 4,
      cpu_cases: 64, cpu_negative_controls: 3, canaries_unchanged: true,
      actual_owner_abi_negative_controls: 44, abi_resource_denial_controls: 4,
      descriptor_extension_negative_controls: 3, exact_canonical_descriptor_extension: true,
      normal_worker_preparation: true, same_owner_source_canonical_descriptor_entry: true,
      kernarg_alignment: 8, kernarg_minimum_bytes: 32,
      input_launch_minimum_bytes: 512, output_launch_minimum_bytes: 512,
      host_admitted: false, runtime_abi_conditions_discharged: false,
      protected_finalizer_admitted: false, native_llvm_executed: false,
      hardware_observed: false, grants_artifact_or_launch_authority: false,
      full_exec_input_read: { allocation: 0, operation: 13, source_occurrence: 14,
        wait_operation: 14, wait_source_occurrence: 15, full_exec: true, data_remains_opaque: true },
    });
    expect(o.kernarg_reads).toEqual([0, 8, 16, 24].map((offset, i) => ({
      block: 0, offset, width: 8, operation: i + 1, source_occurrence: i + 2,
      ready_operation: 5, ready_source_occurrence: 6,
    })));
    const d2 = row(name, "observe", earlier).observation;
    expect(o.canonical_bytes_sha256).toBe(d2.canonical_bytes_sha256);
    expect(o.canonical_identity).toBe(d2.canonical_identity);
    expect(o.llvm_sha256).toBe(d2.llvm_sha256);
    expect(row(name, "llvm").observation).toEqual({
      stage: "public_normal_checked_llvm_driver", llvm_sha256: o.llvm_sha256,
    });
    expect(row(name, "handoff").observation).toEqual({
      stage: "public_normal_inert_handoff_driver", handoff_sha256: o.handoff_sha256,
    });
  });

  for (const name of [...positives, ...Object.keys(refusals)]) it("retains public " + name + " LLVM and handoff results", () => {
    const p = publicReport(name), positive = positives.includes(name);
    expect(p).toMatchObject({
      schema: "fe2o3-physical-global-copy-checked-source-command-v21",
      feature: "physical-global-copy-" + name + "-v21",
      source_unchanged: true, actual_cargo_rustc_wrapper: true,
      compiler_closure_attestation: "unavailable", normal_worker_handoff: positive,
      ranked_formal_descriptor_continuation: positive
        ? "observed normal checked source to inert LLVM/handoff" : "exact source refusal",
      runtime_abi_conditions_discharged: false,
      diagnostic_relation_authenticates_compiler_or_source: false,
      cpu_simulation_run: false, source_custody_exported: false,
      protected_finalizer_admitted: false, native_llvm_executed: false,
      hardware_observed: false, grants_artifact_or_launch_authority: false,
    });
    expect(p.sourcePins).toEqual(publicReport("one").sourcePins);
    expect(p.binaryPins).toEqual(publicReport("one").binaryPins);
    expect(p.observations.map(x => x.stage)).toEqual(["llvm", "handoff"]);
    for (const r of p.observations) {
      expect(r.status).toBe(positive ? 0 : 101); expect(r.signal).toBeNull();
      if (!positive) {
        expect(r.exact_source_refusal).toBe(refusals[name as keyof typeof refusals]);
        expect(r.output).toBeUndefined(); expect(r.diagnostic_relation).toBeUndefined();
      } else {
        expect(r.output!.bytes).toBeGreaterThan(0);
        const o = row(name, "observe").observation;
        if (r.stage === "llvm") expect(r.output!.sha256).toBe(o.llvm_sha256);
        else {
          expect(r.diagnostic_relation).toMatchObject({
            schema: "fe2o3-physical-global-copy-inert-handoff-relation-v21",
            canonical_llvm_sha256: o.llvm_sha256, handoff_sha256: r.output!.sha256,
            grants_artifact_or_launch_authority: false, hardware_observed: false,
            host_admitted: false, native_llvm_executed: false,
            protected_finalizer_admitted: false, runtime_conditions_discharged: false,
            source_custody_exported: false,
          });
          expect(r.diagnostic_relation!.canonical_identity).not.toBe(o.canonical_identity);
          expect(r.output!.sha256).not.toBe(o.handoff_sha256);
        }
      }
    }
  });

  it("documents the real normal path while retaining its conditional runtime boundary", () => {
    const lesson = readFileSync("docs/physical-global-copy-source-v21.md", "utf8");
    for (const text of [
      "scripts/physical-global-copy-checked-v21.mjs", "27 source sessions",
      "88 actual-owner ABI mutation refusals", "eight resource", "six descriptor-extension refusals",
      "safety-analysis projection", "original", "canonical SSA/instructions remain",
      "loaded data opaque", "ordinary descriptor serializer extension",
      "Host admission, runtime-condition discharge", "broad milestone exits remain open",
    ]) expect(lesson).toContain(text);
    expect(lesson).not.toContain("Normal checked handoff remains pending");
  });
});
