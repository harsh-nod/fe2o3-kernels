import { describe, expect, it } from "vitest";
import { lessons } from "../src/content/curriculum";
import {
  sourceMilestoneRecord,
  sourceMilestoneReference,
} from "../src/content/source-milestones";

describe("historical MoE expert proof source", () => {
  it("pins the original checked kernel without transferring proof authority", () => {
    const record = sourceMilestoneRecord("moe-expert-verus-v1");
    expect(record.commit).toBe("e3c7018f428192c350c9c425df8e4c031c788272");
    expect(record.tree).toBe("f717440c4fbc034672ca5ea9e97406e78eb38be0");
    expect(record.claim).toBe("source-model-verified");
    expect(record.authority).toBe("source-model-only");
    expect(record.primarySourceSha256).toBe(
      "617e6741c5f1415a8e792e5e36e3526c04ba18903438e3af178bb107766383d1",
    );
    expect(record.detail).toContain("15 fixed T8/E4/K2/C4");
    expect(record.detail).toContain("Six named mutations fail");
    expect(record.detail).toContain("It proves no numerical correctness");
    expect(sourceMilestoneReference(record.id).note).toContain("no executable GPU authority");
    expect(sourceMilestoneRecord("moe-expert-source-v1").commit).toBe(
      "af0fd523e3b774377a9c5192cf0511e34fa19735",
    );
  });

  it("binds the historical Verus counts to their retained source revision", () => {
    const lesson = lessons.find((entry) => entry.id === "verus-contracts")!;
    const claim = lesson.claims[0];
    expect(claim.kind).toBe("source-model-verified");
    expect(claim.reference?.commit).toBe("acb3d2752e4e50e4f4a99ebfc4b180eb79160930");
    expect(claim.reference?.tree).toBe("f53fdf76950e392d74c17c20e0999a7727305d49");
    expect(claim.detail).toContain("five positive harnesses");
    expect(claim.detail).toContain("24 expected proof rejections");
    expect(claim.detail).toContain("do not qualify a later source revision or executable GPU artifact");
    const result = lesson.tabs.find((tab) => tab.kind === "result")!;
    expect(result.code).toContain("Expected results at acb3d275: 5 verified harnesses and 24 intended proof rejections");
    expect(result.code).toContain("Verus fixture run passed: 5 proof harnesses, 24 expected rejections");
    for (const text of [claim.detail, result.code]) {
      expect(text).not.toMatch(/seven positive|7 verified|28 expected|28 intended|6 proof harnesses|26 expected|stale summary/u);
    }
  });
});
