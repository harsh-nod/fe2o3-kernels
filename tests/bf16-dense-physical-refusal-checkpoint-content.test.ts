import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/bf16-helper-source-cpu-observation-v1.md", "utf8");
const physical = readFileSync("docs/physical-debugger-v2-source-checkpoint.md", "utf8");
function appendix(text: string, marker: string, digest: string) {
  const at = text.indexOf(marker);
  expect(at).toBeGreaterThan(0);
  expect(text.indexOf(marker, at + 1)).toBe(-1);
  expect(createHash("sha256").update(text.slice(0, at)).digest("hex")).toBe(digest);
  return text.slice(at).replace(/\s+/g, " ");
}
describe("genuine helper and refused physical-attempt checkpoint", () => {
  it("preserves both earlier lessons and their historical qualifications", () => {
    appendix(source, "\n## Later genuine dense propagation and ranked candidate (2026-09-26)\n",
      "4194f3ea8369f9b42aec196683a020c8c53d5d22b16654b102db0885cf68e5eb");
    appendix(physical, "\n## Later private attempt: startup refusal, not capture (2026-09-26)\n",
      "861e9590c26c4363cdd010565d329420ea727b604173616eb09c51d3ea57a4ac");
  });
  it("binds the genuine source gate to its actual implementation and report", () => {
    const text = source.slice(source.indexOf("## Later genuine dense")).replace(/\s+/g, " ");
    for (const value of [
      "97edb07a644dc0af11b9fd0824761bc603dbc9d6",
      "90afe14b280f2e3cfb20ae28124e9c58e14b3df6c0a2523b5196f682a6c239a2",
      "1a947a2c01aa5ac4d51eefface719f2b7b62354679401de07da95b222bd17c76",
      "18 numerical positives and 16 request refusals", "404 CLI binary tests",
      "2,424 backend tests", "8,768", "1,632,943,151-byte logical peak",
    ]) expect(text).toContain(value);
  });
  it("keeps candidate construction distinct from complete checked compilation", () => {
    const text = source.slice(source.indexOf("## Later genuine dense")).replace(/\s+/g, " ");
    for (const value of [
      "Source Move operands", "ordinary [f32; 4]", "no accumulator",
      "During the actual Final callback", "postflight-ready output",
      "one tensor row is not a complete kernel", "Option-guarded output store",
      "CFG expansion", "formal/target/LLVM continuation remain open",
      "Normal helper compilation still deliberately refuses", "Broad accepted exits remain **6/18**",
    ]) expect(text).toContain(value);
  });
  it("records the actual failed setup without inventing its precise cause", () => {
    const text = physical.slice(physical.indexOf("## Later private attempt")).replace(/\s+/g, " ");
    for (const value of [
      "failed during debugger setup", "had not sent any MI command",
      "does not identify which check failed", "framing error is secondary",
      "43199b35fdddcdb93b439ef1396999a502eca6c2d1b9a84d1be1c99ae5fce447",
      "9d840563a780e7a17620a3f0e28e37d6dd2d1701013e0dd270f5b6ddd5df555f",
    ]) expect(text).toContain(value);
  });
  it("does not turn outer cleanup or unknown native fields into captured bytes", () => {
    const text = physical.slice(physical.indexOf("## Later private attempt")).replace(/\s+/g, " ");
    for (const value of [
      "incomplete stream cleanup", "before reader startup", "owned family was reaped",
      "exact scope disappeared", "not physical capture success",
      "unknown native-attempt/GPU-dispatch fields stay unknown",
      "missing record cannot be rendered as zero register values",
      "13803ed2bc6e89b6d43ac28304bf1743e1aa628a4df9cb6778842a1781499306",
    ]) expect(text).toContain(value);
  });
  it("keeps public runtime activation and global compiler pins unchanged", () => {
    expect(physical).toContain("The public package remains disabled");
    expect(source).toContain("No global compiler");
    expect(source + physical).not.toContain("/home/harmenon");
  });
});
