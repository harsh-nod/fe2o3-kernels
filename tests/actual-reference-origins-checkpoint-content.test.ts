import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const compilerCommit = "e9f8ff94ca3b5664d4a9c8e4c15a8c117dfe310d";
const comparisonReceipt = "60a71385c4f75a9ce6718b7016f501694e8c8741fda2e7500a00d9ed03a92da0";
const normalReceipt = "25deb1df8462f16d5984a035bd0b9c2daaba1970cf3036aab2919d3b28d809d7";
const source = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const marker = "\n### Actual reference origins: preserve the source-call association\n";
const at = source.indexOf(marker);
const raw = source.slice(at);
const appendix = raw.replace(/\s+/g, " ");
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("actual source-call reference-origin checkpoint", () => {
  it("preserves the complete published S4 tutorial and its old tests", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(40666);
    expect(sha256(prefix)).toBe("8751511766b4a9ea33d042ab55b76c62a8fad92950f15deaa1567a6cc9e8c9c7");
    const oldTest = readFileSync("tests/actual-guarded-access-checkpoint-content.test.ts");
    expect(oldTest.length).toBe(5186);
    expect(sha256(oldTest)).toBe("da45c13110fccc3fa560712b91405b25061330620ecca1437e57f1eb8a6b5734");
  });

  it("distinguishes complete source Call ordinals from guard indices and later uses", () => {
    for (const text of [
      "not a new authoring API, executable assembly syntax or launch command",
      "non-executable sketch", "source Call ordinal + block + callee + destination + guard index",
      "source-call ordinal counts all Call terminators, not only accessors",
      "Counts, copied inputs and equal guard payloads are not source custody",
      "same pending assembly", "semantic_site remains None",
      "An accessor's source block is not the later store's semantic use site",
      "there is no operation insertion cursor here",
      "actual statement/terminator memory uses",
      "one unverified root recipe still need mandatory verification",
    ]) expect(appendix).toContain(text);
    expect(raw).not.toMatch(new RegExp("(?:" + String.fromCharCode(96).repeat(3) + "|~{3})(?:rust|asm|bash|sh)\\b", "u"));
  });

  it("keeps actual payload oracles and refusal/resource boundaries explicit", () => {
    for (const text of [
      "missing, duplicated, reordered and mismatched associations",
      "equal-count source substitutions", "unavailable Some values", "multiply defined seeds",
      "reject excluded accessor families", "foreign-ledger and occupied-owner refusals",
      "independently rescans real source calls and definitions",
      "checks every association and propagated origin", "exact FIFO order",
      "does not invoke the production association or origin helpers",
      "Shared-borrow seeds precede checked-call seeds",
      "outer-owned through postflights", "payloads are dropped before accepted credits are refunded",
      "not injected allocator/OOM failures",
      "callback error/panic controls happen after preparation, not at every allocation point",
    ]) expect(appendix).toContain(text);
  });

  it("separates independently measured observer scopes from full comparison claims", () => {
    for (const text of [
      "331 model tests", "2,683 backend tests", "189 ignored",
      "Five current actual Rust sessions", "one association, two origins and two FIFO entries from one seed",
      "Wrong launch emits no new preparation or accepted-frame rows",
      "changes no runtime layout or closure capture",
      "historical S4 probe measures its own S4 graph frames",
      "old S3 frame values cannot stand in for that different scope",
      "77 telemetry rows", "historical S4 has 56",
      "1,550,028", "1,550,208", "not GPU timings or a performance improvement",
      "181 comparison controls", "38 ordinary observation bodies", "52 artifacts",
      "byte-identical to S4", "does not admit the nominal helper",
    ]) expect(appendix).toContain(text);
    expect(appendix).toContain("The direct R22-to-R23 comparison changes 132 fields");
  });

  it("requires exact completed evidence without advancing the global route gate", () => {
    expect(compilerCommit).toMatch(/^[0-9a-f]{40}$/u);
    for (const hash of [comparisonReceipt, normalReceipt]) {
      expect(hash).toMatch(/^[0-9a-f]{64}$/u);
      expect(raw).toContain(hash);
    }
    expect(raw).toContain("https://github.com/harsh-nod/fe2o3/blob/" + compilerCommit
      + "/docs/bf16-actual-root-reference-origins-qualification-20260926.md");
    expect(raw).not.toMatch(/\{\{[^}]+\}\}/u);
    expect(raw).not.toContain("/home/harmenon");
    for (const text of [
      "global compiler pin and route maturity are unchanged",
      "complete nominal-helper route remains refused",
      "No public source-custody or ready-token authority",
      "checked memory-use sites", "complete nominal recipe", "edited-input promotion",
      "nominal LLVM continuation", "GPU launch or debugger capture",
      "M1/V1/V2/U1/U2/U3 (6/18)",
    ]) expect(appendix).toContain(text);
    const gate = readFileSync("config/publication-gate.json");
    expect(gate.length).toBe(376);
    expect(sha256(gate)).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
