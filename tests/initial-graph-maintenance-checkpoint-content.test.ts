import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lesson = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const physical = readFileSync("docs/physical-debugger-v2-source-checkpoint.md", "utf8");
const lessonMarker = "\n### Later initial-graph and reference-origin checkpoint\n";
const physicalMarker = "\n## Disabled host-entry maintenance checkpoint (2026-09-26)\n";
const normalized = (text: string) => text.replace(/\s+/g, " ");
const graph = normalized(lesson.slice(lesson.indexOf(lessonMarker)));
const debug = normalized(physical.slice(physical.indexOf(physicalMarker)));

describe("qualified source graph and disabled maintenance checkpoints", () => {
  it("preserves both entire previously published tutorial prefixes", () => {
    for (const [text, marker, bytes, sha] of [
      [lesson, lessonMarker, 15832, "12a4d2e8d171e37ae39ddab39e04c69e9cb99457e92e9ff638d05875f7cef00c"],
      [physical, physicalMarker, 14611, "c47350c8eba8d89e2b150bf5dd9f3700d5cd3a5307b6917e79c0e918fd014a4c"],
    ] as const) {
      const at = text.indexOf(marker);
      expect(at).toBeGreaterThan(0);
      expect(text.indexOf(marker, at + 1)).toBe(-1);
      const prefix = Buffer.from(text.slice(0, at), "utf8");
      expect(prefix.length).toBe(bytes);
      expect(createHash("sha256").update(prefix).digest("hex")).toBe(sha);
    }
  });

  it("distinguishes original-ledger graph data from actual access authority", () => {
    for (const text of [
      "fresh R18 evidence", "outer pending owner", "UNJOINED intermediate data",
      "cannot authenticate the actual guarded-access vector", "no ready constructor",
      "shared-borrow seed order", "FIFO propagation", "2,598 backend tests",
      "55 comparison controls", "all 38 observation bodies and 52 artifacts",
      "both 459-file dependency closures", "132 report fields", "not GPU timings",
      "zero enum edges", "Normal helper admission remains refused",
      "complete unverified root recipe before verification",
      "a19c066c5c61cc3d094f8323eb47938489224b30474d3d593fb9b75e85b4a070",
    ]) expect(graph).toContain(text);
  });

  it("binds disabled package evidence without native or close-timing claims", () => {
    for (const text of [
      "physical-v2 unchanged", "PROFILE=None", "publication remain false",
      "before and after the existing commit effect", "delay target close",
      "256-byte maintenance scratch", "65,536-byte native storage cap",
      "73 Node controls", "100 maintenance CPU groups", "481 checks",
      "2,144 KiB", "2,112-KiB cap", "not a successful native capture",
      "Successful cleanup is not capture success", "unavailable data",
      "e6a56b0bda7aaa389a895c647759f2803269556b1e26fe07f83de0320c441be4",
      "67f1ec7a4d116d5e7b584cbbceb15e09d1d8dfcdd90d6ed07546e21863af2253",
    ]) expect(debug).toContain(text);
  });

  it("links the published checkpoint and retains broad exit limits", () => {
    for (const text of [graph, debug]) {
      expect(text).toContain("660c2b41aa69295e174141f0d9dc81c856bce36a");
      expect(text).toContain("M1/V1/V2/U1/U2/U3 (6/18)");
      expect(text).toContain("global compiler pin");
      expect(text).not.toContain("/home/harmenon");
    }
  });
});
