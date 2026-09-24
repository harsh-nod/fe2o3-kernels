import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lesson = readFileSync("docs/ordered-composition-promotion-v1.md", "utf8");
const publish = readFileSync("examples/ordered-composition/publish.rs");
const composition = readFileSync("examples/ordered-composition/composition.rs");
const hash = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");

describe("bounded composition source-promotion lesson", () => {
  it("retains exact full source fixtures, including negative cases, without claiming receipts", () => {
    expect(publish.length).toBe(2050);
    expect(hash(publish)).toBe("c32ebad7546176aa8e1317d473eff387f94eaa5f87b4074d60a3f7832d058fcb");
    expect(composition.length).toBe(5334);
    expect(hash(composition)).toBe("03f54f05cd0f0666a1740dbd2fbaae1e705ede2511fd7349e22be0122d238915");
    for (const name of ["direct", "collision", "const", "local", "wrapper"]) {
      expect(publish.toString()).toContain("ordered-composition-publish-" + name);
    }
    expect(lesson).toContain("does not embed");
    expect(lesson).toContain("raw root receipts");
    expect(lesson).toContain(hash(publish));
    expect(lesson).toContain(hash(composition));
  });

  it("copies every displayed source fragment verbatim from its actual retained file", () => {
    for (const [name, source] of [
      ["helper", composition.toString()], ["calls", composition.toString()],
      ["region", publish.toString()], ["tail", publish.toString()],
    ]) {
      const marker = "<!-- exact-" + name + " -->\n```rust\n";
      const start = lesson.indexOf(marker);
      expect(start).toBeGreaterThanOrEqual(0);
      expect(lesson.indexOf(marker, start + 1)).toBe(-1);
      const text = lesson.slice(start + marker.length);
      const finish = text.indexOf("\n```");
      expect(finish).toBeGreaterThan(0);
      expect(source).toContain(text.slice(0, finish));
    }
  });

  it("distinguishes definitions, occurrences, composition and narrower publisher eligibility", () => {
    for (const phrase of [
      "definitions, call sites and execution occurrences",
      "at most two helpers, eight direct root",
      "eight region definitions, eight expanded occurrences and 128 expanded",
      "Each ordered program still has its existing 1–16",
      "MIR32/KIR17 are reused",
      "This first publisher is narrower than composition admission",
      "Wrapper macros, local/constant operand",
      "captures, generic/const captures",
      "physical machine-call ABIs",
    ]) expect(lesson).toContain(phrase);
    expect(lesson).toContain("no finite maximum grid");
    expect(lesson).toContain("ordered-composition-finite-grid");
    expect(lesson).toContain("max_grid = [2,1,1]");
  });

  it("documents exact public request and independent binary-selector admission", () => {
    for (const phrase of [
      "fe2o3-ordered-composition-source-promotion-request-v1",
      "at most 8192 bytes", "regular non-symlink file",
      "sixteen lowercase hexadecimal", "__fe2o3_region_0123456789abcdef",
      "actual HIR namespace collision check",
      "only together with", "Library-driver and actual",
      "extractor-binary qualifications are separate",
      "FE2O3_EXTRACT_ORDERED_COMPOSITION_PROMOTION_REQUEST_V1",
      "FE2O3_EXTRACT_DIAGNOSTIC_ORDERED_COMPOSITION_DIRECTORY_V1",
    ]) expect(lesson).toContain(phrase);
    expect(lesson).toContain('"registers": [10, 11, 12, 8, 9]');
    expect(lesson).toContain('"destination":"output","source":"input2"');
    expect(lesson).toContain("inputs are read-only");
    expect(lesson).toContain("There is no arbitrary Rust or assembly-string escape");
  });

  it("requires fresh source owners and truthful side effects, not an equivalence or launch claim", () => {
    for (const phrase of [
      "fresh_compilation_required: true", "fresh_compilation_observed: false",
      "fresh frontend", "(a ^ b) & c", "oracle is `c`",
      "not an equivalence", "NotAttempted", "MayHaveCreatedCandidate",
      "No automatic overwrite, rollback, retry, recompile or launch occurs",
      "CPU observations are", "not GPU execution",
      "ordinary native pipeline still uses LLVM IR",
      "constrained inline", "not source custody, compiler",
    ]) expect(lesson).toContain(phrase);
  });

  it("pins separate historical results without closing milestone exits", () => {
    const pin = "a9b636ec4475a15e13187d78d53692d7e6b834e4";
    expect(lesson).toContain("Compiler implementation commit: `" + pin + "`.");
    expect(lesson).toContain("/blob/" + pin + "/docs/ordered-composition-qualification-20260924.md");
    expect(lesson).not.toContain("pending immutable");
    expect(lesson).toContain("static native matrix was incomplete");
    expect(lesson).toContain("no GPU execution is claimed");
    for (const sha of ["2108c7a836295fc3d554b08b360eec8fa091983d016d897751f106f1d56122bf", "993251eaa4307c1ebe842c79727f09eec59721917eb557d79c7a7602ec44b700", "7f4852d86291905c11c4fc93805bfdb94301e199970a0c5e2b6fe144db706579", "b1d52c1ca5cc7a2a5a9b8784f70624768b8c76b3ecc51db9a4967ba468b23805"]) expect(lesson).toContain(sha);
    for (const sha of ["5cbd40515467b3648420bc30fa1b52ab36508678fdc0bf7a39bd002e5f276daa", "7b0c6f2fd5f9039adb8d417ae656e245ee2dd6a214bb42e90b9bf6f12400f329", "19d99e0aa43d76e07946c46c947eeb08c01bc200c6e1c3058e07763262e848a8", "bf029c7ba32601ffd461895bf5fa479dc8863003029242da97289c11ec088434"]) expect(lesson).toContain(sha);
    expect(lesson).toContain("Historical ordinary normal path R6");
    expect(lesson).toContain("Fresh ordinary normal path R7");
    expect(lesson).toContain("36 real rustc sessions on the merged source");
    expect(lesson).toContain("Static native R7 / outer actual-R4");
    expect(lesson).toContain("No browser source write, new UI route");
    expect(lesson).toContain("M2/M3/M6/U4");
    expect(lesson).toContain("6/18");
    expect(lesson).toContain("no `FE2O3_PIN` or maturity level is changed");
  });

  it("keeps the fresh static pass distinct from the failed history and promoted-source authority", () => {
    for (const phrase of [
      "historical R6 static native matrix was incomplete", "13 of 14 cases",
      "exit-2 failure remains evidence", "fresh R7 matrix passed **14/14**",
      "two actual decoded direct-call sites", "one unique helper graph edge",
      "252 metadata / 154 decoded",
      "do not prove physical helper argument/result ABI transport",
      "whole-kernel functional equivalence", "runtime host-buffer",
      "seven original finite source profiles, not freshly",
      "not qualify\nan arbitrary new request or user run",
      "Freshly promoted source has not yet passed its own normal/native",
    ]) expect(lesson).toContain(phrase);
    expect(lesson).not.toContain("neither is asserted passed here");
  });

  it("adds only sibling links while preserving each previous lesson byte for byte", () => {
    const rows = [
      ["docs/ordered-program-authoring-v1.md", "6b80cfa81afc5a87554ac643a46cb6d21de53e2d2cbebf7de778bf4ef3fdbd20"],
      ["docs/source-promotion-lab-v1.md", "50ff0883d0e52f1329387f8c3cef902676a67347667d22534d0ab1faed54a5af"],
    ];
    for (const [path, previousSha] of rows) {
      const text = readFileSync(path, "utf8");
      const marker = "\n## Separate composition-to-helper lab\n";
      const offset = text.indexOf(marker);
      expect(offset).toBeGreaterThan(0);
      expect(text.indexOf(marker, offset + 1)).toBe(-1);
      expect(hash(text.slice(0, offset))).toBe(previousSha);
      expect(text.slice(offset)).toContain("ordered-composition-promotion-v1.md");
      expect(text.slice(offset)).toContain("historical observations");
    }
  });
});
