import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lesson = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const physical = readFileSync("docs/physical-debugger-v2-source-checkpoint.md", "utf8");
const graphMarker = "\n### Complete graph for the supported source profile\n";
const debugMarker = "\n## Private maintenance rebuild and static measurement (2026-09-26)\n";
const normalize = (text: string) => text.replace(/\s+/g, " ");
const graph = normalize(lesson.slice(lesson.indexOf(graphMarker)));
const debug = normalize(physical.slice(physical.indexOf(debugMarker)));

describe("supported-profile graph and private rebuild checkpoints", () => {
  it("preserves the complete published tutorial prefixes", () => {
    for (const [text, marker, bytes, sha] of [
      [lesson, graphMarker, 18704, "7d90f71888325b4f35e1f677c40b1b22de0b97bc5acb041df4fa06e1b8ba8aaa"],
      [physical, debugMarker, 17187, "5743a74c8dd0e8e7d98c0c64dcab450159e608f0ff9b2ec0c32d5328ec64d43f"],
    ] as const) {
      const at = text.indexOf(marker);
      expect(at).toBeGreaterThan(0);
      expect(text.indexOf(marker, at + 1)).toBe(-1);
      const prefix = Buffer.from(text.slice(0, at));
      expect(prefix.length).toBe(bytes);
      expect(createHash("sha256").update(prefix).digest("hex")).toBe(sha);
    }
  });

  it("keeps completion source-bound and distinct from root admission", () => {
    for (const text of [
      "private immutable completion loan", "unchanged closed profile",
      "general GridLeader recovery is still refused", "64-unit rejoin charge",
      "2,605 backend tests", "all enclosing postflights", "both 459-file dependency closures",
      "38 observation bodies and 52 artifacts", "132 report fields", "33,912",
      "59,912,529", "59,912,900", "not GPU timings", "Normal helper admission remains refused",
      "complete unverified root recipe before mandatory verification",
      "zero enum edges", "no positive assertion examples",
      "652a436c781ffe80b408a3c8a514c3a1734ff0dffbd7da9c6cc1c2245ac3097d",
    ]) expect(graph).toContain(text);
  });

  it("does not promote rebuilt static artifacts into native capture", () => {
    for (const text of [
      "199,543,392 bytes", "87 controls", "8,728-byte adapter", "14,488-byte logical reservation",
      "256-byte maintenance scratch", "65,536-byte cap", "24 new controls",
      "31 inherited derivation controls", "Six source-only startup-routing controls",
      "290 keys", "790,136,768 bytes", "1 GiB cumulative cap", "80 static candidates",
      "Static candidates are not a loaded closure", "gates remain disabled",
      "PROFILE=None", "not a successful native capture", "unavailable data unavailable",
      "91a2d05acfe3eb5aba5e5d4b43fb13c0ee8f5a1bf0ec6cbe9a66b83653f8af0c",
    ]) expect(debug).toContain(text);
  });

  it("links the exact later commit without changing broad exits or the global pin", () => {
    for (const text of [graph, debug]) {
      expect(text).toContain("cc69a2e09c867a30990e48f8d7005db67bec0f80");
      expect(text).toContain("M1/V1/V2/U1/U2/U3 (6/18)");
      expect(text).toContain("global compiler pin");
      expect(text).not.toContain("/home/harmenon");
    }
  });
});
