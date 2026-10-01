import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/gfx950-one-stop-cpu-v1.md", "utf8");
const marker = "\n## 9. Exercise the bounded adapter without activating host reads\n";
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ").toLowerCase();
const exampleStart = "<!-- loaded-adapter-memory-example:start -->\n~~~javascript\n";
const exampleEnd = "~~~\n<!-- loaded-adapter-memory-example:end -->";
const exampleAt = source.indexOf(exampleStart);
const example = source.slice(exampleAt + exampleStart.length, source.indexOf(exampleEnd, exampleAt));

describe("portable loaded-input adapter tutorial boundaries", () => {
  it("preserves the entire previous graph lesson as an exact prefix", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at));
    expect(prefix.length).toBe(18419);
    expect(createHash("sha256").update(prefix).digest("hex")).toBe("db3bc2678aa4108ad86dfa271108c21b2ea4c03ef3b1400b1385b99ea9bd19da");
  });
  it("distinguishes qualified fixture-free coverage from external historical controls", () => {
    for (const text of [
      "node --test tools/debugger/loaded-cpu-adapter/adapter-controls.test.mjs",
      "passed 76 fixture-free adapter controls", "10 separate external historical controls",
      "suite passed 202 controls", "the 10 historical controls passed separately",
      "not the complete operational workflow",
      "does not run the 10 historical controls", "must fail, not skip", "not bundled",
      "link pins the published compiler component",
      "1789ce1fd0cb0e0eea3787799e023a1a0e5110753b965250d4e241f61f068a41",
    ]) expect(appendix).toContain(text);
    expect(appendix).not.toContain("root_bound_adapter_compiler_commit");
    expect(appendix).not.toContain("placeholder");
    expect(appendix).toMatch(/github\.com\/harsh-nod\/fe2o3\/tree\/1a5999f6e1c5f2363bc2d525af65e84c46502ce6\/tools\/debugger\/loaded-cpu-adapter/);
  });
  it("retains all three phases and first-error versus cleanup semantics", () => {
    for (const text of [
      "executeadapterplan(planbuffer, { provider, guard, now })",
      "| precheck | one complete selected-graph pass | failed |",
      "| historical | two immediate complete historical passes | not-started |",
      "| postcheck | one complete selected-graph pass | not-started |",
      "phases that never start", "attempted reservations remain charged",
      "do not refresh the historical pin", "not an empty readable file",
      "first reader, provider, phase-clock or guard failure remains primary",
      "possibly live descriptors", "no fresh read or write is authorized",
    ]) expect(appendix).toContain(text);
  });
  it("keeps the in-memory API example exact and does not execute it in content tests", () => {
    expect(exampleAt).toBeGreaterThan(at);
    expect(source.indexOf(exampleStart, exampleAt + 1)).toBe(-1);
    expect(Buffer.byteLength(example)).toBe(600);
    expect(createHash("sha256").update(example).digest("hex")).toBe("db7b8995cd27b55ed8da247f2dc60e90f194ee066ced9120cdfb3d94f8d9a822");
    expect(example).toContain('import { encodeBoundedEvidence } from "./tools/debugger/loaded-cpu-adapter/adapter-writer.mjs";');
    expect(example).toContain("encodeBoundedEvidence(synthetic, 1024)");
    expect(example).toContain("encodeBoundedEvidence(synthetic, 8)");
    expect(example).not.toMatch(/node:fs|runFilesystemAdapter|filesystemProvider|publishExclusiveEvidence|child_process|process\.env/);
    for (const text of ["serialization only", "every failure string is synthetic", "not a reader or publication acceptance test", "no host input read"]) expect(appendix).toContain(text);
  });
  it("keeps bounded no-replace evidence publication and currentness explicit", () => {
    for (const text of [
      "publishexclusiveevidence", "serialization is bounded before writer io",
      "without replacing an existing target", "no overwrite-capable rename or automatic unlink",
      "success retains the temporary link", "partial or displaced custody",
      "64 mib", "128 mib", "private output directory", "not atomic ancestor-path exclusion",
      "currentness after descriptor cleanup", "post-publication guard state",
      "publication intent", "read the real output completely",
      "expiry forbids new evidence writes", "prevent cleanup or any durable report",
      "unwritten evidence is not available evidence",
    ]) expect(appendix).toContain(text);
  });
  it("does not activate a filesystem entry or raise native or milestone claims", () => {
    for (const text of [
      "runfilesystemadapter", "remains unactivated in this lesson",
      "request buffers", "current cpu-only policy", "exact cap/resource/output bindings",
      "external timeout and readback", "node's own module-loader io",
      "not a live visualization", "no vgpr heatmap", "expired native coordination",
      "v4 remains open", "m1/v1/v2/u1/u2/u3 (6/18)", "no public support gate",
    ]) expect(appendix).toContain(text);
  });
});
