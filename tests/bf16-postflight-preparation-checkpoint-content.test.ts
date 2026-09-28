import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/bf16-helper-source-cpu-observation-v1.md", "utf8");
const marker = "\n## Later postflight candidate and retained source preparation (2026-09-26)\n";
const split = source.indexOf(marker);
const rootMarker = "\n## Later joined root-source and induction checkpoint (2026-09-26)\n";
const rootSplit = source.indexOf(rootMarker);
const checkpoint = source.slice(split, rootSplit).replace(/\s+/g, " ");
const rootCheckpoint = source.slice(rootSplit).replace(/\s+/g, " ");

describe("postflight helper candidate and retained source checkpoint", () => {
  it("preserves the complete earlier lesson including the R8 boundary", () => {
    expect(split).toBeGreaterThan(0);
    expect(source.indexOf(marker, split + 1)).toBe(-1);
    expect(createHash("sha256").update(source.slice(0, split)).digest("hex"))
      .toBe("314354141d6948dbb44a570abe3844f48796cab2c9a1a2b620c0a9eff2c88fa7");
  });

  it("binds the new checkpoint to its exact published compiler and receipts", () => {
    for (const value of [
      "84e5026188e8a41ba5118334dc75bb2e8618613d/docs/bf16-helper-postflight-preparation-qualification-20260926.md",
      "e3bdd2053ffa0edcadd4cbca9ed230451393e5a7d2887393c89cb06a3da9eca1",
      "45d7b9a1545a133196d9052eef819ec8e1e3eb4f6b34b75025a944b123525189",
      "e6a0a0813150c834b67c0553b77b5c0baeca7a4bda5503acbe559858d5b3102d",
      "5156aae6d0dd5430844af997dc510eb25eb464c09b073bee6269f88280d5c5a5",
      "281,064 bytes", "9,913 bytes",
    ]) expect(checkpoint).toContain(value);
  });

  it("distinguishes paid original entry and completed postflight from provisional values", () => {
    for (const value of [
      "true incoming storage before reserving", "generic callback/result frames",
      "large callback cannot hide a one-byte incoming deficit",
      "canonical-facts and all three dense-pass postflights succeed",
      "actual Final payload remains private and inert",
      "same immutable owner, inventory, source Call, canonical rows",
      "function-qualified Return mappings", "fresh checked source query",
      "earlier pass result or a detached tensor description",
      "scalar-definition tables", "argument/allocation provenance",
      "old four-input preparation API preserves its algorithm charge sequence and original drop boundary",
      "Copy + 'static", "sticky denials", "owned-only refunds",
      "not native allocator or RSS enforcement",
    ]) expect(checkpoint).toContain(value);
  });

  it("keeps source-session evidence and lossless comparison limits precise", () => {
    for (const value of [
      "1,861 lowerer library tests", "2,446 backend tests",
      "189 ignored tests unrun", "five fresh Rust source sessions",
      "Identity, Swap01, wrong source launch, observer error and observer panic",
      "36 positive numerical runs and 32 request refusals",
      "two unchanged normal-route refusals", "Synthetic fixtures do not substitute",
      "JSON key/type distinctions and number tokens",
      "Numerics, masks, refusals, storage and peak storage are unchanged",
      "1,632,943,151-byte logical peak", "unchanged 2 GiB limit",
      "50,688,702 for Identity/error/panic", "50,688,837 for Swap01",
      "explicitly prepaid negative-control ledgers",
      "not a kernel runtime performance measurement",
      "459 files", "352,670,356 bytes", "182 bytes larger than R8",
    ]) expect(checkpoint).toContain(value);
  });

  it("retains the failed attempt and explains exact nested refund ownership", () => {
    for (const value of [
      "R9 attempt passed its backend tests but failed",
      "damaged inner candidate reservation must remain charged",
      "intact outer entry scope may refund only its own reservation",
      "paired direct/wrapped source refusals with the same callback type",
      "rather than guessing ABI bytes", "unchanged ledger/work/peak/denials",
      "Two additional bounded probes are prepaid",
      "no phase or per-probe limit was raised",
      "failed R9 attempt remains retained, not relabeled as a success",
    ]) expect(checkpoint).toContain(value);
  });

  it("does not admit pending root, Option, LLVM or GPU work", () => {
    for (const value of [
      "model/proxy qualification, not a complete-root recipe or an admission token",
      "At this R10 checkpoint, separately metered Option and induction preparation are not qualified",
      "assertion/CFG facts", "without an unmetered legacy rerun",
      "generated ranked coordinate", "Option-guarded output store",
      "source-to-ranked correspondence/attachment and formal/target/LLVM continuation remain open",
      "Normal helper compilation still deliberately refuses",
      "nominal-pending, RawEmpty and attachment guards are unchanged",
      "no ordinary admission, native helper execution, GPU launch, physical register capture or public activation",
      "no new live route or global compiler pin",
      "M1/V1/V2/U1/U2/U3 (6/18)", "closes no milestone",
    ]) expect(checkpoint).toContain(value);
    expect(checkpoint).not.toContain("~~~bash");
    expect(source).not.toContain("/home/harmenon");
  });
});

describe("joined root-source and original-meter induction checkpoint", () => {
  it("preserves the entire pre-R12 lesson byte-for-byte", () => {
    expect(rootSplit).toBeGreaterThan(split);
    expect(source.indexOf(rootMarker, rootSplit + 1)).toBe(-1);
    expect(createHash("sha256").update(source.slice(0, rootSplit)).digest("hex"))
      .toBe("cac6aa6b593ac2ef70db34f4cb92b9a7a9ac77ec58e22ee740bb6b95486ec768");
  });

  it("binds the joined-root checkpoint to the published source and actual evidence", () => {
    for (const value of [
      "d97670e94215a6fb5eaed48f8602473e7e517b6b/docs/bf16-helper-root-source-qualification-20260926.md",
      "d97670e94215a6fb5eaed48f8602473e7e517b6b/docs/bf16-helper-option-preparation-qualification-20260926.md",
      "acff9197e06ddef98e7a0fcf58aae2a3e6239b3964e9c301b80f855136184426",
      "7504f1313ec0b64eb1c89209892d5817b80d49d023cbf14b9b9768c0cf62f05c",
      "0d96a225c9166d8ec397c2a90e22c3c1917c5e9fbe8646ce4704c8e079a51b1d",
      "38ea309f2c12dc0a399ff19cd7190b8a29a5a4c0be4907c010a7cd2e5bb5830f",
      "281,064", "155,825", "42,378", "38,269",
      "two earlier failed attempts remain failures",
      "exact Unit-layout fixture corrections did not relax admission",
    ]) expect(rootCheckpoint).toContain(value);
  });

  it("retains the actual caller, complete-CFG report and original-meter custody", () => {
    for (const value of [
      "actual source `get_mut` producers and Some-availability facts",
      "actual admitted caller", "complete-CFG induction report",
      "original meter", "exact source pointer, semantic hash, function and identity",
      "no missing-report or empty-proof fallback",
      "Source Option availability alone does not prove the output store",
      "Generic closure/result frames are paid before nested preparation",
      "true incoming storage floor", "large callback cannot conceal an incoming deficit",
      "Borrowed views cannot escape", "panic payloads drop before their owning scope refunds",
      "Callback-owned surplus, sticky denials", "monotone work/peak",
      "not native allocator or RSS enforcement",
    ]) expect(rootCheckpoint).toContain(value);
  });

  it("keeps genuine-session results exact and logical work separate from runtime performance", () => {
    for (const value of [
      "331 model tests", "2,460 backend tests (189 ignored)",
      "five genuine Rust sessions: Identity, Swap01, wrong launch, callback error and callback panic",
      "all 12 checker controls passed", "numeric lexemes, types and key order",
      "rejects duplicate keys", "459 dependencies", "352,670,356 bytes",
      "Numerical results, masks, refusals, admission decisions, storage and peak are unchanged",
      "no peak override", "132 changed fields", "96 cumulative-work fields",
      "8,506,632 for Identity/error/panic", "8,506,812 for Swap01",
      "other 36 are generation paths and dependency/artifact digests",
      "8,454,656 units of prepaid diagnostic work",
      "inferred from five preparations, not independently instrumented measurements",
      "negative probe's internal work must not be counted twice",
      "No cap was enlarged", "not a kernel runtime performance measurement",
    ]) expect(rootCheckpoint).toContain(value);
  });

  it("keeps CFG, assertions, complete-root correspondence and ordinary continuation pending", () => {
    for (const value of [
      "strict source CFG retention still needs integration and genuine qualification",
      "actual assertion/range evaluator", "original budget", "no assumed-proof fallback",
      "input reads", "Option-guarded output store and final effects",
      "coordinates actually generated by ranked CFG expansion",
      "Source block indices cannot replace that mapping",
      "Full source-to-ranked attachment, formal/target/LLVM continuation and edited-source promotion remain open",
      "Normal helper compilation still refuses",
      "nominal-pending, RawEmpty and attachment guards are unchanged",
      "no ordinary admission, native helper execution, GPU launch, physical capture or public debugger activation",
      "No global compiler pin or route maturity changes",
      "M1/V1/V2/U1/U2/U3 (6/18)", "no milestone exit",
    ]) expect(rootCheckpoint).toContain(value);
    expect(rootCheckpoint).not.toContain("~~~");
    expect(source).not.toContain("/home/harmenon");
  });
});
