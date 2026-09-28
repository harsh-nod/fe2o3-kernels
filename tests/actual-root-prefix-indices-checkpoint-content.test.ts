import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Root fills only these exact slots after actual qualification/publication.
const compilerCommit = "897b9915ccbc310831af08d45f56f956ed0ac78e";
const normalReceipt = "c86648d9c895d53f92861d4e239e8810a463d5328d98ba6538b957a31bfa88f9";
const comparisonReceipt = "fa0374eab14def6cdd586765ba74c37b77ad6015aaf87bc720a5a7c77cd691bd";
const source = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const marker = "\n### Actual retained-input root prefix and indices: one assembly owner\n";
const split = source.indexOf(marker);
const raw = source.slice(split);
const appendix = raw.replace(/\s+/g, " ");
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("actual retained-input root prefix/index checkpoint", () => {
  it("preserves the entire published S2 tutorial prefix exactly", () => {
    expect(split).toBeGreaterThan(0);
    expect(source.indexOf(marker, split + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, split), "utf8");
    expect(prefix.length).toBe(27769);
    expect(sha256(prefix)).toBe("0bc0ddce5ebd82ad099ef0c6acd4f8a8c175981e8c4513b8e6b02f11eb51d922");
  });

  it("distinguishes actual private custody and one namespace from detached component data", () => {
    for (const value of [
      "private connector for the prefix and invocation/index stages",
      "does not retroactively turn the earlier UNJOINED component into a root recipe",
      "not a new runnable kernel-authoring syntax, public API or assembly launch command",
      "non-cloneable borrowed view", "actual retained owner",
      "both retained canonical facts and checked emission data",
      "Equal-valued cloned inputs", "cannot construct or replace this private input view",
      "genuine test routing", "no ordinary nominal-helper admission route",
      "real operation stream and value-ID allocator", "same namespace",
      "No zero-based UNJOINED component is spliced, renumbered or promoted",
      "partial-emission/refusal ordering",
      "non-executable sketch", "source API, Rust program or launch command",
      "ExecutionLayout; next_value = 0", "InvocationIndex %0; next_value = 1",
      "2 operations, 1 assigned local, 1 FIFO entry",
      "not a claim that the complete source graph has no aliases",
    ]) expect(appendix).toContain(value);
    expect(raw).not.toMatch(new RegExp(String.fromCharCode(96).repeat(3) + "(?:rust|asm|bash|sh)\\b", "u"));
  });

  it("keeps outer lifetime, independent payload checks and resource scope explicit", () => {
    for (const value of [
      "outer pending owner", "across all nested callbacks and postflights",
      "oracle's scratch is outer-owned", "before releasing only their accepted credits",
      "occupied owners and foreign ledgers refuse",
      "Work and storage stay on the original ledger",
      "every prefix operation, value ID, index row and FIFO entry",
      "without invoking the shared emitter, seeding, propagation or assignment routines",
      "Summary counts alone do not establish those joins",
      "not native allocator, RSS or machine-stack enforcement",
      "Nonempty references are covered by inert component fixtures only",
      "refuses nonempty reference bindings before retained source preparation",
      "after complete prefix/index preparation",
      "do not cover every possible allocation point",
    ]) expect(appendix).toContain(value);
  });

  it("records only completed regression/genuine observations before binding remaining evidence", () => {
    for (const value of [
      "331 model tests", "2,631 backend tests", "189 ignored",
      "Fourteen new unit controls", "Five fresh actual Rust sessions",
      "one root, zero references and reserved reference values",
      "two operations, next value ID one, 31 locals, one assignment",
      "zero processed index edges and one FIFO entry",
      "Wrong launch refuses before this preparation",
      "admit or execute the nominal helper as a GPU kernel",
      "1,911,195", "1,911,519", "15,040", "10,832", "4,208",
      "not GPU timings or a performance improvement",
      "view frame begins after the retained owner exists",
      "boundary-probe ledgers have different peak scopes",
      "join each scope separately",
      "2f43d6fdaf60ceb36172b132d44d46d59854877c5fc182501da98d5caa5948ad",
      "550250c21fa206a282751939568af57a70bd9b43b65513d9fc2b7f634b269be8",
    ]) expect(appendix).toContain(value);
    // This candidate intentionally fails publication checks until root supplies
    // actual normal/comparison receipts and their reviewed complete paragraphs.
    expect(normalReceipt).toMatch(/^[0-9a-f]{64}$/u);
    expect(comparisonReceipt).toMatch(/^[0-9a-f]{64}$/u);
    expect(raw).toContain(normalReceipt);
    expect(raw).toContain(comparisonReceipt);
    expect(raw).not.toMatch(/\{\{[^}]+\}\}/u);
  });

  it("does not promote the checkpoint into admission or change the compiler pin", () => {
    expect(compilerCommit).toMatch(/^[0-9a-f]{40}$/u);
    expect(raw).toContain(
      "https://github.com/harsh-nod/fe2o3/blob/" + compilerCommit
      + "/docs/bf16-actual-root-prefix-indices-qualification-20260926.md",
    );
    for (const value of [
      "value-ID collisions or resets", "premature resource refunds",
      "does not independently prove the shared algorithms",
      "Actual guarded-access appends, reference origins and dereference sites",
      "one complete unverified root recipe", "Normal helper admission remains refused",
      "does not add public source-custody or ready-token authority",
      "detached/edited-input promotion, nominal LLVM continuation, GPU execution",
      "launch authority or debugger capture",
      "global compiler pin and route maturity are unchanged",
      "M1/V1/V2/U1/U2/U3 (6/18)",
    ]) expect(appendix).toContain(value);
    expect(raw).not.toContain("/home/harmenon");
    const publicationGate = readFileSync("config/publication-gate.json");
    expect(publicationGate.length).toBe(376);
    expect(sha256(publicationGate)).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
