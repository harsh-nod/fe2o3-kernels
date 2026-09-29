import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const path = "docs/gfx950-one-stop-cpu-v1.md";
const marker = "\n## 8. Plan complete input reads without authorizing them\n";
const source = readFileSync(path, "utf8");
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ").toLowerCase();

describe("portable loaded-input graph tutorial boundaries", () => {
  it("preserves the complete prior lesson", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at));
    expect(prefix.length).toBe(15320);
    expect(createHash("sha256").update(prefix).digest("hex")).toBe("6401948993840783075fdaaf7a180cbeb75869db02160ad25f1898d820b9ab1a");
  });
  it("uses an immutable published package and distinguishes test scopes", () => {
    for (const text of [
      "c7b1a12f62368c7b3b222dad5fc7cf6ce4bdf537",
      "node --test tools/debugger/loaded-operational-graph/graph-policy.test.mjs",
      "44 fixture-free controls", "13 additional historical controls",
      "does not run those 13 controls", "not bundled",
      "compileoperationalgraph(buffer)", "exactreadenvelope(entries, aliases, passes)",
      "proposeresourcepolicy(buffer, options)", "1,173-name",
    ]) expect(appendix).toContain(text);
  });
  it("keeps accounting distinct from actual IO and refreshed evidence", () => {
    for (const text of [
      "all its roles", "alias target retains its own charge",
      "not a zero-byte readable file", "100,001", "200,002",
      "not measured filesystem syscall counts", "module-loader io",
      "not a process rss bound", "explicit refusal",
      "separately reviewed successor",
    ]) expect(appendix).toContain(text);
  });
  it("does not convert a plan into execution or capture authority", () => {
    for (const text of [
      "does not open those named files", "execution_authority",
      "root_cap_change_approved", "false", "still need separate qualification",
      "not a live visualization", "does not capture vgpr values",
      "expired native coordination", "v4 remains open",
      "m1/v1/v2/u1/u2/u3 (6/18)", "no global compiler pin",
    ]) expect(appendix).toContain(text);
  });
});
