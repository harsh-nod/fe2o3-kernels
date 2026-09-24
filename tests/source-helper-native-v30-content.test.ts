import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import index from "../docs/evidence/source-helper-native-v30-20260924/index.json";

const root = "docs/evidence/source-helper-native-v30-20260924";
const read = (name: string) => readFileSync(resolve(root, name));
interface NativeObservation {
  label: string;
  optimization: string;
  output_bytes: number;
  output_sha256: string;
  ordinary_worker_llvm_object_lld_completed: boolean;
  actual_llvm_bytes_unchanged: boolean;
  llvm_symbol_storage_verified_after_worker: boolean;
  retained_input_hashes_rechecked: boolean;
  native_semantics_qualified: boolean;
  physical_helper_abi_qualified: boolean;
  hardware_observed: boolean;
  protected_finalizer_admitted: boolean;
  grants_artifact_or_launch_authority: boolean;
  milestone_completion: boolean;
  llvm: { declared_intrinsics: string[]; helpers: { symbol: string; llvm_noinline: boolean }[] };
  native: { functions: { symbol: string }[]; direct_calls: number; instructions: unknown[] };
}
const native = (label: string, optimization: string) =>
  JSON.parse(read(`${label}-${optimization.toLowerCase()}.json`).toString()) as NativeObservation;

describe("source helper normal/native continuation evidence", () => {
  it("pins every retained byte and discloses whitespace-only normalization", () => {
    expect(index.compiler_publication).toBe("ed69ea8c845a5d13adbaceedf1b6b3321217d6ed");
    expect(index.records).toHaveLength(10);
    for (const pin of index.records) {
      const bytes = read(pin.name);
      expect(bytes.length).toBe(pin.retained_bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(pin.retained_sha256);
      const original = pin.normalization === "append-one-final-newline" ? bytes.subarray(0, -1) : bytes;
      expect(original.length).toBe(pin.source_bytes);
      expect(createHash("sha256").update(original).digest("hex")).toBe(pin.source_sha256);
      expect(["none", "append-one-final-newline"]).toContain(pin.normalization);
    }
  });

  it("keeps five source exports and eight driver runs separate from native qualification", () => {
    expect(JSON.parse(read("public-source.json").toString())).toMatchObject({
      status: "passed", actual_exports: 5, whole_kernel_simulations: 150,
      exact_cli_refusals: 3, native_qualified: false, hardware_observed: false,
      protected_proof: false, milestone_completion: false,
    });
    expect(JSON.parse(read("normal-driver.json").toString())).toMatchObject({
      normal_driver_runs: 8, exact_source_unchanged: true,
      normal_llvm_handoff_descriptor_extension_join: true,
      native_llvm_executed: false, hardware_observed: false,
      protected_finalizer_admitted: false, milestone_completion: false,
    });
  });

  for (const label of ["default256", "edited512", "repeat", "two"]) {
    for (const optimization of ["O0", "O3"]) {
      it(`retains ${label} ${optimization} without upgrading native observation to proof`, () => {
        const report = native(label, optimization);
        const helpers = label === "two" ? 2 : 1;
        expect(report).toMatchObject({
          label, optimization, ordinary_worker_llvm_object_lld_completed: true,
          actual_llvm_bytes_unchanged: true, llvm_symbol_storage_verified_after_worker: true,
          retained_input_hashes_rechecked: true, native_semantics_qualified: false,
          physical_helper_abi_qualified: false, hardware_observed: false,
          protected_finalizer_admitted: false, grants_artifact_or_launch_authority: false,
          milestone_completion: false,
        });
        expect(report.llvm.helpers).toHaveLength(helpers);
        for (const helper of report.llvm.helpers) {
          expect(helper.symbol).toMatch(/^__fe2o3_internal_helper_v1_f[01]_[0-9a-f]{64}$/);
          expect(helper.llvm_noinline).toBe(false);
        }
        expect(report.llvm.declared_intrinsics).toEqual([
          "llvm.amdgcn.workgroup.id.x", "llvm.amdgcn.workitem.id.x",
        ]);
        expect(report.native.direct_calls).toBe(optimization === "O0" ? helpers : 0);
        expect(report.native.functions).toHaveLength(optimization === "O0" ? helpers + 1 : 1);
        expect(report.output_bytes).toBe(optimization === "O3" ? 5408 : label === "two" ? 6992 : 6616);
        expect(report.native.instructions).toHaveLength(optimization === "O3" ? label === "two" ? 23 : 20 : label === "two" ? 160 : 122);
      });
    }
  }

  it("records repeat identity without confusing the changed specialization", () => {
    for (const optimization of ["O0", "O3"]) {
      expect(native("repeat", optimization).output_sha256).toBe(native("edited512", optimization).output_sha256);
      expect(native("default256", optimization).output_sha256).not.toBe(native("edited512", optimization).output_sha256);
    }
  });

  it("links the lesson and preserves LLVM, helper ABI and hardware limitations", () => {
    const lesson = readFileSync("docs/source-helper-native-v30.md", "utf8");
    expect(lesson).toContain("existing LLVM pipeline");
    expect(lesson).toContain("Native opcode presence and call counts do not prove");
    expect(lesson).toContain("M2/M6/U4 are not closed");
    expect(lesson).toContain("not currently\npropagated as LLVM noinline");
    for (const file of ["README.md", "docs/const-u32-helper-promotion-v1.md"]) {
      expect(readFileSync(file, "utf8")).toContain("source-helper-native-v30.md");
    }
  });
});
