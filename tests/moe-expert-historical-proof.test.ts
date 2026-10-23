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

  it("distinguishes complete Verus results from the historical wrapper summary", () => {
    const lesson = lessons.find((entry) => entry.id === "verus-contracts")!;
    expect(lesson.claims[0].detail).toContain("seven positive harnesses");
    expect(lesson.claims[0].detail).toContain("28 expected proof rejections");
    expect(lesson.claims[0].detail).toContain("historical wrapper");
    expect(lesson.tabs.some((tab) => tab.code.includes(
      "Verus fixture run passed: 6 proof harnesses, 26 expected rejections",
    ))).toBe(true);
  });
});
