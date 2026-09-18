import { createHash, webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import retained from "../examples/ordinary_bitwise_promotion_v1.json";
import { projectSourceVariantComparison, SOURCE_VARIANT_ARTIFACT_MANIFEST_SHA256 } from "../src/content/source-variant-comparison";
import { coordinate, copyRetainedComparison, SOURCE_VARIANT_MAX_ARTIFACT_BYTES, SOURCE_VARIANT_MAX_SOURCE_BYTES } from "../src/content/source-variant-comparison-shape";

const receiptSha256 = "908100a406d336cfc5bc28b6c584e5830293a951cf7b3e8f9245130520603142";
const hash = (text: string | Buffer) => createHash("sha256").update(text).digest("hex");
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());

describe("actual source-variant comparison projection", () => {
  it("retains exact actual-capture bytes and an independent operation-artifact roster", () => {
    expect(hash(readFileSync("examples/ordinary_bitwise_promotion_v1.json"))).toBe("92194476568e2f6abef0264d4ae8580515ac71189c4381a6c8cead3f19d791ed");
    expect(hash(retained.receipt.utf8)).toBe(receiptSha256);
    const artifacts = [retained.receipt, retained.materialization, ...retained.variants.flatMap((item) =>
      [item.source, item.snapshot, item.operations, item.simulation, ...(item.change ? [item.change] : [])])];
    for (const artifact of artifacts) expect(hash(artifact.utf8)).toBe(artifact.sha256);
    expect(hash(JSON.stringify(artifacts.map((item) => item.sha256)))).toBe(SOURCE_VARIANT_ARTIFACT_MANIFEST_SHA256);
    expect(retained.provenance.compiler_build).toBe("work_in_progress");
    expect(retained.provenance.compiler_commit).toBeNull();
    expect(retained.provenance.qualified_release_pin).toBeNull();
    expect(retained.provenance.producer_authenticated).toBe(false);
  });

  it("shows all three exact sources, original Binary and actual called-helper observations", async () => {
    const result = await projectSourceVariantComparison(retained, receiptSha256);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error(result.detail);
    expect(result.variants.map((item) => item.expectedWord)).toEqual([469, 469, 0]);
    expect(result.variants.map((item) => item.source)).toEqual(retained.variants.map((item) => item.source.utf8));
    expect(result.variants[0].operations.filter((item) => item.mnemonic !== null)).toHaveLength(0);
    expect(result.variants[0].operations[4]).toMatchObject({ kind: "binary", detail: "BitOr", mnemonic: null, sourceReferences: null });
    for (const [index, mnemonic] of [[1, "v_or_b32"], [2, "v_and_b32"]] as const) {
      const variant = result.variants[index];
      expect(variant.operations.some((item) => item.kind === "call")).toBe(true);
      expect(variant.operations.filter((item) => item.mnemonic !== null).map((item) => item.mnemonic)).toEqual([mnemonic]);
      expect(variant.source).toContain("fe2o3_device::amdgpu_asm!");
      expect(variant.bytes.endsWith("deadbeefcafebabe")).toBe(true);
      expect(variant.initialized).toBe("0xffffff");
    }
    expect(new Set(result.variants.map((item) => item.bundleIdentity)).size).toBe(3);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.variants[1].operations[12].sourceReferences)).toBe(true);
  });

  it("copies and freezes all input strings before asynchronous hashing", async () => {
    const input = structuredClone(retained);
    const pending = projectSourceVariantComparison(input, receiptSha256);
    input.variants[0].source.utf8 = "changed while hashing";
    input.variants.length = 0;
    input.provenance.compiler_build = "changed";
    const result = await pending;
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error(result.detail);
    expect(result.variants[0].source).toBe(retained.variants[0].source.utf8);
    const copied = copyRetainedComparison(retained);
    expect(Object.isFrozen(copied)).toBe(true);
    expect(Object.isFrozen(copied.variants[0].source)).toBe(true);
  });

  it("rejects same-size source mutation even if its self-declared digest is recomputed", async () => {
    for (const rehash of [false, true]) {
      const changed = structuredClone(retained);
      changed.variants[0].source.utf8 = changed.variants[0].source.utf8.replace("255", "254");
      if (rehash) changed.variants[0].source.sha256 = hash(changed.variants[0].source.utf8);
      expect((await projectSourceVariantComparison(changed, receiptSha256)).status).toBe("invalid");
    }
  });

  it("rejects substituted operation bytes plus matching self-declared digest", async () => {
    const changed = structuredClone(retained);
    changed.variants[1].operations.utf8 = changed.variants[1].operations.utf8.replace("v_or_b32", "v_and_b32");
    changed.variants[1].operations.sha256 = hash(changed.variants[1].operations.utf8);
    expect(await projectSourceVariantComparison(changed, receiptSha256)).toMatchObject({ status: "invalid", detail: expect.stringContaining("artifact roster") });
  });

  it("rejects variant, selector, result, identity and authority substitutions", async () => {
    const substitutions = [
      (value: typeof retained) => { value.variants[1] = value.variants[2]; },
      (value: typeof retained) => { value.variants[0].snapshot.utf8 = value.variants[1].snapshot.utf8; },
      (value: typeof retained) => { value.variants[2].simulation.utf8 = value.variants[0].simulation.utf8; },
      (value: typeof retained) => { value.materialization.utf8 = value.materialization.utf8.replace('"operation": 4', '"operation": 5'); },
      (value: typeof retained) => { value.variants[0].operations.utf8 = value.variants[0].operations.utf8.replace('"grants_proof_authority":false', '"grants_proof_authority":true'); },
    ];
    for (const substitute of substitutions) {
      const changed = structuredClone(retained); substitute(changed);
      expect((await projectSourceVariantComparison(changed, receiptSha256)).status).toBe("invalid");
    }
    expect((await projectSourceVariantComparison(retained, "1".repeat(64))).status).toBe("invalid");
  });

  it("checks structural/text limits before hashing or cloning arbitrary payloads", async () => {
    const hashing = vi.fn();
    vi.stubGlobal("crypto", { subtle: { digest: hashing } });
    const inputs: unknown[] = [null, {}, { ...retained, unexpected: true }];
    const source = structuredClone(retained); source.variants[0].source.utf8 = "x".repeat(SOURCE_VARIANT_MAX_SOURCE_BYTES + 1); inputs.push(source);
    const json = structuredClone(retained); json.receipt.utf8 = "x".repeat(SOURCE_VARIANT_MAX_ARTIFACT_BYTES + 1); inputs.push(json);
    const missing = structuredClone(retained); missing.variants.pop(); inputs.push(missing);
    const sparse = structuredClone(retained); delete (sparse.variants as unknown[])[1]; inputs.push(sparse);
    const unicode = structuredClone(retained); unicode.variants[0].source.utf8 = "\ud800"; inputs.push(unicode);
    const provenance = structuredClone(retained); provenance.provenance.producer_authenticated = true; inputs.push(provenance);
    for (const input of inputs) expect((await projectSourceVariantComparison(input, receiptSha256)).status).toBe("invalid");
    expect(hashing).not.toHaveBeenCalled();
    expect(() => coordinate({ function: Number.MAX_SAFE_INTEGER + 1, block: 0, operation: 0 })).toThrow();
  });

  it("reports unavailable instead of displaying unchecked bytes without WebCrypto", async () => {
    vi.stubGlobal("crypto", undefined);
    expect((await projectSourceVariantComparison(retained, receiptSha256)).status).toBe("unavailable");
  });
});
