import { createHash, webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";
import { projectRepeatNativeComparison } from "../src/content/repeat-native-comparison.mjs";
import { compareOrderedOrigin, parseOrderedOriginJson } from "../src/content/ordered-origin-observation.mjs";
afterEach(() => vi.unstubAllGlobals());

it("projects exact historical inspector bindings and refuses all eight fresh-origin/native joins", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const capsule = readFileSync("examples/source_repeat_native_comparison_v1.json", "utf8");
  expect(createHash("sha256").update(capsule).digest("hex")).toBe("366fec40482151396b5328818b30a1c00258872323ff6c9bd99ba4d1670e2578");
  const envelope = JSON.parse(capsule) as { artifacts: Array<{ role: string; chunks: string[] }> };
  const source = JSON.parse(envelope.artifacts.find(item => item.role === "sourceReceipt")!.chunks.join(""));
  const projection = await projectRepeatNativeComparison(capsule, "7b13ad313fc51715c45f387ea1258e85365a2a526b66ba88002350fea04c4661");
  if (projection.status !== "ready") throw new Error(projection.detail);
  expect(projection.kind).toBe("retained_source_native_observation"); expect(projection.cases).toHaveLength(8);
  const origin = parseOrderedOriginJson(readFileSync("examples/ordered_program_origin_v1.json", "utf8"));
  for (const [index, selected] of projection.cases.entries()) {
    const inspection = source.variants[Math.floor(index / 2)].inspection;
    expect(selected.originBinding).toEqual({
      canonicalBytes: inspection.canonical.bytes, target: inspection.declared_target, waveWidth: inspection.declared_wave_width,
      declaredSourceIds: inspection.declared_source_ids,
      coordinate: [inspection.coordinate.function_ordinal, inspection.coordinate.block_ordinal, inspection.coordinate.operation_ordinal],
      rawBlock: inspection.raw_block_id,
      declaredDescriptors: inspection.declared_program.descriptors.slice(0, inspection.declared_program.count),
      registerRoles: { scratch: inspection.register_plan.scratch, output: inspection.register_plan.output, inputs: inspection.register_plan.inputs },
    });
    expect(Object.isFrozen(selected.originBinding.declaredSourceIds)).toBe(true);
    const match = compareOrderedOrigin(origin, selected);
    expect(match.status).toBe("mismatch");
    expect(match.mismatches).toEqual(expect.arrayContaining(["Canonical KIR identity", "Semantic MIR identity",
      "Source inventory identity", "Source preflight identity", "Declared source IDs"]));
  }
});
