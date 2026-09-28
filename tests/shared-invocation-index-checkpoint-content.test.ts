import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Root binds these exact slots only after completed qualification and publication.
const compilerCommit = "6588fd2c56c9996f18d0c80ec4a61e87adeadc73";
const parityReceipt = "38e20b32ce23cba4c11d9e351569a99a98ef7cc50d5b3439a7a4c3e78df85ce3";
const normalReceipt = "d76b915291e3ee9c77892409c04757b14ca194a31cd4cd89fd222984cf34c351";
const source = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const marker = "\n### Shared invocation and index preparation: preserve the real namespace\n";
const split = source.indexOf(marker);
const raw = source.slice(split);
const appendix = raw.replace(/\s+/g, " ");
const publicationGate = readFileSync("config/publication-gate.json");
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("shared invocation/index preparation checkpoint", () => {
  it("preserves the complete earlier tutorial prefix byte-for-byte", () => {
    expect(split).toBeGreaterThan(0);
    expect(source.indexOf(marker, split + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, split), "utf8");
    expect(prefix.length).toBe(20897);
    expect(sha256(prefix))
      .toBe("90d09457789a4fb72da3b2587ebb4cfb4cd1dac7de70bc2ed6e2ff98693c001e");
  });

  it("separates the real nonzero namespace from paid UNJOINED data and authority", () => {
    for (const value of [
      "actual operation stream and actual `next_value`",
      "does not reset, copy or rebase that namespace",
      "existing %80 = IndexConstant 17; next_value = 81",
      "append InvocationIndex %81; next_value = 82",
      "reuse %81 at each destination; next_value = 82",
      "not executable Rust, assembly or a launch command",
      "Equal duplicate capabilities do not enqueue again",
      "diagnostic emission precede scalar-custody refusal",
      "before a duplicate checked-predicate refusal",
      "UNJOINED local component data",
      "beginning at value zero and launch extent zero",
      "Do not splice that local stream into the ordinary stream",
      "original ledger before bounded scans",
      "outer pending owner", "consumed FIFO entries",
      "owner alive across injected error and panic",
      "release of only its accepted credits",
      "not native allocator, RSS or machine-stack enforcement",
      "every enclosing postflight",
      "do not claim that this production connector already exists",
      "no public ready constructor, detached authority token, access certificate or root admission",
      "complete unverified root recipe before mandatory verification",
      "Normal helper admission remains refused",
    ]) expect(appendix).toContain(value);
    expect(raw).not.toMatch(/```(?:rust|asm|bash|sh)\b/u);
  });

  it("binds completed qualification rather than turning target counts into success", () => {
    expect(parityReceipt).toMatch(/^[0-9a-f]{64}$/u);
    expect(normalReceipt).toMatch(/^[0-9a-f]{64}$/u);
    expect(raw).not.toMatch(/\{\{[^}]+\}\}/u);
    for (const value of [
      "331 model tests", "2,617 backend tests", "189 ignored",
      "12 new component tests", "frozen original algorithms",
      "five actual Rust sessions", "not a new S2 genuine hook",
      "zero enum edges and zero assertion terminators",
      "passed all 67 comparison controls",
      "both 459-file dependency closures", "2,868 report leaves",
      "Exactly 36 fields changed", "25 generation paths",
      "six dependency digests and five artifact digests",
      "Work, numeric lexemes, masks, refusals, storage, peaks",
      "all 372 graph rows/positions remain unchanged",
      "All 38 normal sessions completed",
      "all 38 observation bodies and 52 artifacts match",
      "byte-for-byte",
      "a2b923ac90c5bb14761a01c4a2897243bc3b2b2a3ddf8bc011284ba9516b4a69",
      "1ba149efa0ee6a85af79591a897db79269977edca808f16929d49215ff6fb5eb",
      parityReceipt, normalReceipt,
    ]) expect(appendix).toContain(value);
  });

  it("links the exact later commit while preserving 6/18 and the global compiler pin", () => {
    expect(compilerCommit).toMatch(/^[0-9a-f]{40}$/u);
    expect(raw).toContain(
      "https://github.com/harsh-nod/fe2o3/blob/" + compilerCommit
      + "/docs/bf16-shared-invocation-index-qualification-20260926.md",
    );
    expect(appendix).toContain("M1/V1/V2/U1/U2/U3 (6/18)");
    expect(appendix).toContain("global compiler pin and route maturity are unchanged");
    expect(appendix).toContain("no nominal LLVM continuation, edited-source promotion");
    expect(appendix).toContain("GPU execution, launch authority or debugger capability");
    expect(raw).not.toContain("/home/harmenon");
    expect(publicationGate.length).toBe(376);
    expect(sha256(publicationGate)).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
