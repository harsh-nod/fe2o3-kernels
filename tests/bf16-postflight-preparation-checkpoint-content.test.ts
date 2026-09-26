import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/bf16-helper-source-cpu-observation-v1.md", "utf8");
const marker = "\n## Later postflight candidate and retained source preparation (2026-09-26)\n";
const split = source.indexOf(marker);
const checkpoint = source.slice(split).replace(/\s+/g, " ");

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
