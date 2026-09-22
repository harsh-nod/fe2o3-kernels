import assert from "node:assert/strict";
import { createHash, webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import retained from "../examples/source_instruction_native_comparison_v1.json";
import { projectFinalNativeComparison } from "../src/content/final-native-comparison.mjs";
import { parseProgramJson } from "../src/content/ordered-program-observation.mjs";

const JOIN = "5230415719fa0c7c81473d5fea338d5f3a85c7a3a9a91fd55c3900e20165d162";
const CAPSULE = "0b4a9689524965929d1e9b102d7802e737e068293f74fa28d0148ab49238cc04";
const SOURCE_RECEIPT = "cee8b86f0d4c7f22cb0e868ebd0ca7dadf6f1f2740ad4a1ba7befc2239b8f6e9";
const PAYLOADS = [
  ["default", "O0", 6152, "0786de8ada4300d144018ac871fe384065b0f225b8e25dc423bc6c8a3454ba41"],
  ["default", "O3", 5384, "9484ee4d7f5f75730367a49ed960e4608ce07fb76c3415bb91e302f1ddea49c7"],
  ["edited", "O0", 6152, "f39f619d9db7dc56f72b31dae527b926f9cf65004c2dd8e92092e77331f11a04"],
  ["edited", "O3", 5384, "e37254dc428d1bdb680fccd3c3f52769caa6b85d24e070aba0d4935c780709cd"],
] as const;
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("actual retained source/final-native comparison", () => {
  it("pins the exact exported capsule and all fourteen original artifacts", () => {
    const capsule = readFileSync("examples/source_instruction_native_comparison_v1.json");
    expect(capsule.length).toBe(503416); expect(hash(capsule)).toBe(CAPSULE);
    expect(retained.schema).toBe("fe2o3-final-native-comparison-example-v1");
    expect(retained.provenance).toEqual({ capture_name: "phase19b-instruction-native-join-r1",
      kind: "retained_source_native_observation", producer_authenticated: false, qualified_release_pin: null });
    const texts = [retained.join, retained.sourceReceipt, ...retained.sources.map(item => item.artifact),
      ...retained.llvm.map(item => item.artifact), ...retained.reports.map(item => item.artifact)];
    expect(texts).toHaveLength(10);
    for (const artifact of texts) {
      expect(Buffer.byteLength(artifact.utf8)).toBe(artifact.bytes);
      expect(hash(artifact.utf8)).toBe(artifact.sha256);
    }
    expect(retained.join.sha256).toBe(JOIN); expect(retained.sourceReceipt.sha256).toBe(SOURCE_RECEIPT);
    expect(retained.payloads.map(item => [item.profile, item.optimization, item.bytes, item.sha256])).toEqual(PAYLOADS);
    for (const payload of retained.payloads) {
      expect(payload.hex.length).toBe(2 * payload.bytes);
      expect(hash(Buffer.from(payload.hex, "hex"))).toBe(payload.sha256);
    }
    expect(texts.reduce((sum, item) => sum + item.bytes, 0) +
      retained.payloads.reduce((sum, item) => sum + item.bytes, 0)).toBe(440737);
  });

  it("projects actual four-case source, LLVM, offset and resource observations without fetching paths", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const result = await projectFinalNativeComparison(retained, JOIN);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error(result.detail);
    expect(result.kind).toBe("retained_source_native_observation");
    expect(result.checkedArtifacts).toBe(14); expect(result.retainedBytes).toBe(440737);
    expect(result.sourceExportsReported).toBe(3); expect(result.cpuSimulationsReported).toBe(90);
    expect(result.cases.map(item => [item.id, item.declaredVgprHighWater,
      item.encodedVgprCapacity, item.architectedVgprBoundary, item.hsacoBytes])).toEqual([
      ["default-O0", 6, 24, 8, 6152], ["default-O3", 6, 8, 8, 5384],
      ["edited-O0", 6, 24, 8, 6152], ["edited-O3", 6, 8, 8, 5384],
    ]);
    for (const [index, observed] of result.cases.entries()) {
      const sourceIndex = index < 2 ? 1 : 2, llvmIndex = index < 2 ? 0 : 1;
      expect(observed.source).toBe(retained.sources[sourceIndex].artifact.utf8);
      expect(observed.llvm).toBe(retained.llvm[llvmIndex].artifact.utf8);
      expect(observed.hsacoSha256).toBe(PAYLOADS[index][3]);
      expect(observed.program.map(step => step.fileOffset)).toEqual(index % 2 === 0 ? [2692, 2696, 2700] : [2340, 2344, 2348]);
      expect(observed.descriptorOffset).toBe(index % 2 === 0 ? 2368 : 2048);
      expect(observed.program.map(step => step.bytesHex)).toEqual(["0003082a", "04050826", index < 2 ? "01090a2a" : "01090a28"]);
      expect(observed.program.map(step => step.registers)).toEqual([
        ["VGPR4", "VGPR0", "VGPR1"], ["VGPR4", "VGPR4", "VGPR2"], ["VGPR5", "VGPR1", "VGPR4"],
      ]);
      expect(Object.isFrozen(observed.program)).toBe(true);
    }
    expect(result.interpretation).toMatch(/not trusted compiler provenance/u);
    expect(result.unavailable).toContain("native whole-kernel correctness");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("independently checks raw descriptor words and full-file instruction slices", () => {
    for (const [index, payload] of retained.payloads.entries()) {
      const bytes = Buffer.from(payload.hex, "hex"), optimized = index % 2 === 1;
      const descriptor = bytes.subarray(optimized ? 2048 : 2368, (optimized ? 2048 : 2368) + 64);
      expect(hash(descriptor)).toBe(optimized
        ? "bfa9cf8710b52ecadef754b0793267707be2a27430f97c294c1b841f3d42604d"
        : "5e139ffe6e70a3b53f5553f80e13cc2a6f41aea3f6bbeb4ea106e8929403e38a");
      expect(descriptor.readUInt32LE(48)).toBe(optimized ? 11468928 : 11468930);
      expect(descriptor.readUInt32LE(44)).toBe(1);
      expect(((descriptor.readUInt32LE(48) & 63) + 1) * 8).toBe(optimized ? 8 : 24);
      const at = optimized ? 2340 : 2692;
      expect(bytes.subarray(at, at + 12).toString("hex")).toBe("0003082a04050826" + (index < 2 ? "01090a2a" : "01090a28"));
    }
  });

  it("preserves source/edit/repeat subjects and all original no-authority flags", () => {
    expect(retained.llvm[1].artifact).toEqual(retained.llvm[2].artifact);
    expect(retained.sources[2].artifact.utf8).toBe(retained.sources[1].artifact.utf8.replace(
      "    xor(out, input1, scratch);\n", "    or(out, input1, scratch);\n"));
    const join = JSON.parse(retained.join.utf8);
    expect(join.native_repeat_execution).toBe(false);
    expect(join.source_variants[0].retained_source_inventory).toBe("610ced53986d1cef3ff7a309719e17a4983c59730019ffa58781273e9f37f852");
    expect(join.source_variants.map((item: { retained_source_inventory: string }) => item.retained_source_inventory))
      .toEqual(Array(3).fill(join.source_variants[0].retained_source_inventory));
    for (const field of ["source_authentication", "compiler_closure_attestation", "protected_admission",
      "ranked_checks", "proof_authority", "artifact_authority", "production_resume", "hardware_execution",
      "native_whole_kernel_correctness", "physical_register_allocation_or_lifetime_proof", "whole_kernel_order_or_byte_stability_claim"])
      expect(join[field], field).toBe(false);
  });

  it("compares strict-parser pins without dropping any field while removing only a null prototype", async () => {
    // Same precondition as exporter: the complete closed profile has already passed.
    expect((await projectFinalNativeComparison(retained, JOIN)).status).toBe("ready");
    const join = parseProgramJson(retained.join.utf8) as {
      retained_input_pins: Array<Record<string, string | number>>;
    };
    const expected = join.retained_input_pins[0];
    expect(Object.getPrototypeOf(expected)).toBeNull();
    const observed = JSON.parse(JSON.stringify(expected)) as Record<string, string | number>;
    expect(Object.getPrototypeOf(observed)).toBe(Object.prototype);
    expect(() => assert.deepEqual(observed, expected)).toThrow(); // The original concrete failure.
    expect(() => assert.deepEqual(observed, { ...expected })).not.toThrow();
    expect(Object.keys(observed).sort()).toEqual(["bytes", "ctime_ns", "device", "inode", "mode",
      "mtime_ns", "nlink", "path", "sha256"].sort());
    for (const field of Object.keys(observed)) {
      const changed = { ...expected, [field]: typeof expected[field] === "number"
        ? Number(expected[field]) + 1 : String(expected[field]) + "1" };
      expect(() => assert.deepEqual(observed, changed), field).toThrow();
    }
  });

  it("rejects stale, altered, substituted and authority-elevating actual capsules", async () => {
    expect((await projectFinalNativeComparison(retained, "1".repeat(64))).status).toBe("invalid");
    for (const mutate of [
      (input: typeof retained) => { input.payloads[0].hex = "00" + input.payloads[0].hex.slice(2); },
      (input: typeof retained) => { input.payloads[0] = { ...input.payloads[0],
        hex: input.payloads[2].hex, sha256: input.payloads[2].sha256 }; },
      (input: typeof retained) => { input.sources[2].artifact.utf8 = input.sources[1].artifact.utf8; },
      (input: typeof retained) => { input.provenance.producer_authenticated = true; },
    ]) {
      const changed = structuredClone(retained); mutate(changed);
      expect((await projectFinalNativeComparison(changed, JOIN)).status).toBe("invalid");
    }
  });

  it("snapshots actual primitives before asynchronous hashing and reports missing crypto honestly", async () => {
    const input = structuredClone(retained), pending = projectFinalNativeComparison(input, JOIN);
    input.payloads.length = 0; input.join.utf8 = "{}"; input.sources[1].artifact.utf8 = "replaced";
    expect((await pending).status).toBe("ready");
    vi.stubGlobal("crypto", undefined);
    expect((await projectFinalNativeComparison(retained, JOIN)).status).toBe("unavailable");
  });
});
