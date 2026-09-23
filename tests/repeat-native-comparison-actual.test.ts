import { createHash, webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import retained from "../examples/source_repeat_native_comparison_v1.json";
import { projectRepeatNativeComparison } from "../src/content/repeat-native-comparison.mjs";

// Independently selected historical pins, never learned from the capsule under test.
const JOIN = "7b13ad313fc51715c45f387ea1258e85365a2a526b66ba88002350fea04c4661";
const CAPSULE = "366fec40482151396b5328818b30a1c00258872323ff6c9bd99ba4d1670e2578";
const PAYLOADS = [
  ["one", "O0", 6224, "e9c97e7715d7ae0f9bd5a795fa099025199b7ab77619267100fa640cb4eee6c9"],
  ["one", "O3", 5456, "b887cc57f057c0460f4dc62e7c4c364e3898a91909c00202e9b4650d966a634a"],
  ["two", "O0", 6224, "44593f3cdea0680607793c58cdaf5e5be93fa7bf49bfccff3666038f4c3e5d70"],
  ["two", "O3", 5456, "623d9fd9af95759ce7271202139ce715bfaa0e81e6769ced747642948de638a0"],
  ["fifteen", "O0", 6288, "9b2dcccb95cdd5bbccb46276219ab94c186a7191de4ad7a285eb5c05e0384381"],
  ["fifteen", "O3", 5520, "4ccde21d79ad6c08118219d334ed570684775012702a231d9efb62c46e959df5"],
  ["repeat", "O0", 6288, "9b2dcccb95cdd5bbccb46276219ab94c186a7191de4ad7a285eb5c05e0384381"],
  ["repeat", "O3", 5520, "4ccde21d79ad6c08118219d334ed570684775012702a231d9efb62c46e959df5"],
] as const;
const COUNTS = [1, 1, 2, 2, 15, 15, 15, 15];
const STATIC_COUNTS = [104, 19, 105, 20, 118, 33, 118, 33];
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
function artifact(role: string, capsule = retained) {
  const selected = capsule.artifacts.find(item => item.role === role);
  if (!selected) throw new Error("Missing retained artifact: " + role);
  return selected;
}
function raw(role: string) {
  const selected = artifact(role);
  return Buffer.from(selected.chunks.join(""), selected.encoding === "hex" ? "hex" : "utf8");
}
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("actual retained bounded repeat-native example", () => {
  it("pins the exact capsule and every original artifact without rewriting its provenance", () => {
    const bytes = readFileSync("examples/source_repeat_native_comparison_v1.json");
    expect(bytes.length).toBe(1122815);
    expect(hash(bytes)).toBe(CAPSULE);
    expect(retained.schema).toBe("fe2o3-repeat-native-comparison-example-v1");
    expect(retained.provenance).toEqual({
      capture_name: "Retained phase22 source/LLVM and phase24 native repeat observations",
      kind: "retained_source_native_observation", producer_authenticated: false, qualified_release_pin: null,
    });
    expect(retained.artifacts).toHaveLength(23);
    for (const selected of retained.artifacts) {
      const bytes = raw(selected.role);
      expect(bytes.length).toBe(selected.bytes);
      expect(hash(bytes)).toBe(selected.sha256);
    }
    expect(retained.artifacts.reduce((sum, item) => sum + item.bytes, 0)).toBe(984180);
    expect(artifact("join").sha256).toBe(JOIN);
    expect(artifact("sourceReceipt").sha256).toBe("9edfa2fddcbf220191d6fb18feac00d3cfc6107dd8444aa8397d0a7b92265d07");
    expect(artifact("llvmReceipt").sha256).toBe("8186ab5c539c20953e0b2b30ed32ac31fb769dec4f78d6821a454ff3fd63ccf0");
    for (const [label, opt, bytes, sha] of PAYLOADS) {
      expect(artifact("payload/" + label + "/" + opt)).toMatchObject({ bytes, sha256: sha, encoding: "hex" });
    }
  });

  it("projects exactly eight actual cases, precise native slices and static declared-role uses locally", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const result = await projectRepeatNativeComparison(retained, JOIN);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error(result.detail);
    expect(result).toMatchObject({ kind: "retained_source_native_observation", joinSha256: JOIN,
      checkedArtifacts: 23, retainedBytes: 984180, sourceExportsReported: 4, cpuSimulationsReported: 120 });
    expect(result.cases.map(item => item.id)).toEqual(PAYLOADS.map(([label, opt]) => label + "-" + opt));
    for (const [index, current] of result.cases.entries()) {
      const [label, opt, bytes, sha] = PAYLOADS[index], n = COUNTS[index], optimized = opt === "O3";
      const offsets = Array.from({ length: n + 1 }, (_, at) => (optimized ? 2348 : 2692) + 4 * at);
      expect(current).toMatchObject({ label, optimization: opt, repetitions: n, hsacoBytes: bytes, hsacoSha256: sha,
        declaredVgprHighWater: 37, encodedVgprCapacity: optimized ? 40 : 56,
        architectedVgprBoundary: 40, descriptorOffset: optimized ? 2112 : 2368,
        staticInstructions: STATIC_COUNTS[index] });
      expect(current.program).toHaveLength(n + 1);
      expect(current.staticInstructions).toBeGreaterThan(current.program.length);
      expect(current.program.map(item => item.fileOffset)).toEqual(offsets);
      expect(current.program.map(item => item.bytesHex)).toEqual(["2203427e", ...Array(n).fill("21474268")]);
      expect(current.program.map(item => item.opcode)).toEqual(["V_MOV_B32_e32_vi", ...Array(n).fill("V_ADD_U32_e32_gfx9")]);
      expect(current.program.map(item => item.registers)).toEqual([
        ["VGPR33", "VGPR34"], ...Array.from({ length: n }, () => ["VGPR33", "VGPR33", "VGPR35"]),
      ]);
      expect(current.source).toBe(raw("source/" + label).toString("utf8"));
      expect(current.llvm).toBe(raw("llvm/" + label).toString("utf8"));
      expect(current.source).toContain("repeat(" + n + ") { add(out, out, input1); }");
      expect(current.registerGrid.roles.map(role => [role.role, role.register])).toEqual([
        ["scratch", 32], ["output", 33], ["input0", 34], ["input1", 35], ["input2", 36],
      ]);
      expect(current.registerGrid.instructionOffsets).toEqual(offsets);
      expect(current.registerGrid.roles.map(role => role.uses)).toEqual([
        Array(n + 1).fill("none"), ["write", ...Array(n).fill("read-write")],
        ["read", ...Array(n).fill("none")], ["none", ...Array(n).fill("read")], Array(n + 1).fill("none"),
      ]);
      expect(current.registerGrid.interpretation).toBe("static_explicit_instruction_uses_only");
      expect(Object.isFrozen(current.program)).toBe(true);
      expect(Object.isFrozen(current.registerGrid.roles[0].uses)).toBe(true);
    }
    expect(result.unavailable).toContain("Physical values and register lifetimes");
    expect(result.unavailable).toContain("Replay of the full producer input census or CPU runs");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("independently decodes fixed descriptor offsets and complete-file instruction slices", () => {
    for (const [index, [label, opt]] of PAYLOADS.entries()) {
      const bytes = raw("payload/" + label + "/" + opt), optimized = opt === "O3";
      const descriptorAt = optimized ? 2112 : 2368, descriptor = bytes.subarray(descriptorAt, descriptorAt + 64);
      expect(hash(descriptor)).toBe(optimized
        ? "433daf570ce101ae8dcf440ce5665ebfaef6d3002d0d9e676c0edb61d0a2f767"
        : "47b932221d3ec007edd1010a7e78d24334bf289682143ae1a73ca802aaf0e75a");
      expect(descriptor.readUInt32LE(48)).toBe(optimized ? 11468932 : 11468934);
      expect(descriptor.readUInt32LE(44)).toBe(9);
      expect(((descriptor.readUInt32LE(48) & 63) + 1) * 8).toBe(optimized ? 40 : 56);
      expect(((descriptor.readUInt32LE(44) & 63) + 1) * 4).toBe(40);
      const first = optimized ? 2348 : 2692;
      expect(bytes.subarray(first, first + (COUNTS[index] + 1) * 4).toString("hex"))
        .toBe("2203427e" + "21474268".repeat(COUNTS[index]));
    }
  });

  it("keeps repeated native invocations distinct and preserves historical no-authority boundaries", async () => {
    const result = await projectRepeatNativeComparison(retained, JOIN);
    if (result.status !== "ready") throw new Error(result.detail);
    for (const opt of ["O0", "O3"]) {
      const fifteen = result.cases.find(item => item.id === "fifteen-" + opt)!;
      const repeat = result.cases.find(item => item.id === "repeat-" + opt)!;
      expect(fifteen.id).not.toBe(repeat.id);
      expect(fifteen.payloadPath).not.toBe(repeat.payloadPath);
      expect(fifteen.reportSha256).not.toBe(repeat.reportSha256);
      expect(fifteen.sourceSha256).toBe(repeat.sourceSha256);
      expect(fifteen.llvmSha256).toBe(repeat.llvmSha256);
      expect(fifteen.hsacoSha256).toBe(repeat.hsacoSha256);
      expect(raw("payload/fifteen/" + opt)).toEqual(raw("payload/repeat/" + opt));
    }
    const join = JSON.parse(raw("join").toString("utf8"));
    expect(join).toMatchObject({ authority: "observation_only", retained_source_exports: 4,
      retained_cpu_simulations_revalidated: 120, fresh_source_exports: 0, fresh_llvm_lowerings: 0,
      fresh_cpu_simulations: 0, fresh_native_invocations: 4, native_optimization_cases: 8,
      complete_hsaco_payloads: 8, runtime_closure_attestation: "unavailable" });
    for (const field of ["source_authentication", "compiler_closure_attestation", "protected_finalizer_admission",
      "proof_authority", "artifact_authority", "production_resume", "hardware_execution",
      "native_whole_kernel_correctness", "physical_register_allocation_or_lifetime_proof",
      "whole_kernel_order_or_byte_stability_claim", "native_qualified", "milestone_completion"])
      expect(join[field], field).toBe(false);
  });

  it("refuses a wrong independent join, altered source or substituted full native payload", async () => {
    expect((await projectRepeatNativeComparison(retained, "1".repeat(64))).status).toBe("invalid");
    for (const mutate of [
      (input: typeof retained) => { artifact("source/two", input).chunks[0] += "\n"; },
      (input: typeof retained) => {
        const a = artifact("payload/one/O0", input), b = artifact("payload/two/O0", input);
        a.chunks = [...b.chunks]; a.sha256 = b.sha256; a.bytes = b.bytes;
      },
      (input: typeof retained) => { input.provenance.producer_authenticated = true; },
    ]) {
      const changed = structuredClone(retained); mutate(changed);
      expect((await projectRepeatNativeComparison(changed, JOIN)).status).toBe("invalid");
    }
  });

  it("snapshots retained primitives before hashing and leaves missing crypto unavailable", async () => {
    const changed = structuredClone(retained), pending = projectRepeatNativeComparison(changed, JOIN);
    changed.artifacts.length = 0;
    expect((await pending).status).toBe("ready");
    vi.stubGlobal("crypto", undefined);
    expect((await projectRepeatNativeComparison(retained, JOIN)).status).toBe("unavailable");
  });
});
