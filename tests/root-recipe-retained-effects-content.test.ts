import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lesson = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const physical = readFileSync("docs/physical-debugger-v2-source-checkpoint.md", "utf8");
const lessonMarker = "\n## Later development seam: complete root preparation and retained effects (2026-09-26)\n";
const physicalMarker = "\n## Later qualified diagnostic: preserve publication failures (2026-09-26)\n";
const lessonNew = lesson.slice(lesson.indexOf(lessonMarker)).replace(/\s+/g, " ");
const physicalNew = physical.slice(physical.indexOf(physicalMarker)).replace(/\s+/g, " ");

describe("qualified root preparation, retained effects and bounded failure evidence", () => {
  it("preserves the complete previously published lesson prefixes", () => {
    for (const [text, marker, bytes, digest] of [
      [lesson, lessonMarker, 5363, "26c776bc8d267b672d3f3cc5acc1a95e91050934f6240a121d5617bc966d4ad0"],
      [physical, physicalMarker, 10555, "662e3cfb5dc55bdc35146d5e9ba5cb63a3bf7b03977fd64332b3a984cadca44e"],
    ] as const) {
      const at = text.indexOf(marker);
      expect(at).toBeGreaterThan(0);
      expect(text.indexOf(marker, at + 1)).toBe(-1);
      const prefix = Buffer.from(text.slice(0, at), "utf8");
      expect(prefix.length).toBe(bytes);
      expect(createHash("sha256").update(prefix).digest("hex")).toBe(digest);
    }
  });

  it("retains all four source-indexed fields and the complete custody boundary", () => {
    for (const value of [
      "`layout`", "`global_read`", "`transpose_workgroup`", "`read_view`",
      "tensor-only candidate", "every source-indexed row", "default/unreached rows",
      "postflights", "exact candidate must be rejoined", "borrowed view",
      "Source block indices are not ranked coordinates", "actual generated positions",
      "original work/storage ledger", "before allocation or reconstruction",
      "callback-owned surplus must survive", "not guarantees about allocator overhead",
      "entry postflight still follows the external callback",
    ]) expect(lessonNew).toContain(value);
  });

  it("distinguishes genuine read presence from synthetic payload equality", () => {
    for (const value of [
      "presence/absence at those exact source rows",
      "does not independently compare the allocation-contract payload",
      "Synthetic controls compare equality of all four copied payload fields",
      "not positive genuine read-view or transpose coverage",
      "printed observer line cannot replace a completed fresh qualification gate",
      "zero layout, transpose and read-view entries",
    ]) expect(lessonNew).toContain(value);
  });

  it("keeps ordinary preparation separate from verification and nominal admission", () => {
    for (const value of [
      "**unverified prepared recipe**", "continues through its existing verifier",
      "does not skip verification", "actual function/type association",
      "immutable base mask", "separately paid overlay storage",
      "not an original-meter nominal recipe driver",
      "retained Final table is not already connected",
      "rich Option dominance", "complete conditional writes",
      "fabricate memory/access certificates", "Normal helper compilation remains refused",
      "do not establish nominal normal admission", "LLVM continuation",
      "actual-facts reservation-context hook remains unqualified",
      "R15 does not qualify that new seam",
    ]) expect(lessonNew).toContain(value);
  });

  it("binds completed ordinary and R15 qualifications instead of provisional claims", () => {
    for (const value of [
      "ebc14db4b3c0227dbc2be8d0b82052abc84e2e84",
      "1d8ef2462d141ad257e59807ab8727fc297ed1c5",
      "bf16-shared-root-recipe-qualification-20260926.md",
      "bf16-helper-retained-effects-qualification-20260926.md",
      "331 model and 2,544 backend tests", "36-session normal-composition ladder",
      "two-session direct-BF16 ladder", "These 36+2 sessions qualify ordinary behavior",
      "6c434dfccb9c18e4b31db6415262f94694b10527c604b4d9c15d2a74053e90a1",
      "331 model and 2,557 backend tests", "189 ignored",
      "54181d44d9ebff7a89f61a3e4daa82dc41ad9d62315037d0c5449259b1a9f508",
      "five fresh actual Rust sessions", "36 positive CPU numerical cases",
      "32 request refusals and two unchanged normal refusals", "two callback controls",
      "b7d6f6e11b995dd3ac55d1d078048b281f40c0aefba0b8785884a9fb96e96298",
      "82c289410d064875b6a00a17aa308422144cceee74a32ad2701b9255a194e25f",
      "28 controls and exactly 132 allowlisted changes",
      "c1f5b7d8af43aad8c224b1a805a2a9769d47cba3f0c24cd4f41b8cbe4aafec75",
      "not a whole-backend strict-Clippy claim",
    ]) expect(lessonNew).toContain(value);
    expect(lessonNew).not.toContain("NOT_RUN");
    expect(lessonNew).not.toContain("Private draft qualification status");
  });

  it("keeps lossless comparison and repeated diagnostics bounded to actual evidence", () => {
    for (const value of [
      "96 cumulative-work fields, 25 generation paths, six dependency digests and five artifact digests",
      "all 918 files rehashed", "Numeric lexemes", "storage and peak fields remain unchanged",
      "1,632,943,151", "no storage/peak override or resource-cap increase",
      "four assertion rows at lines 17/41/43/45",
      "five retained-effect rows at 16/40/42/44/46",
      "exactly one retained-only row", "wrong launch has neither",
      "one-short-storage probe", "exact later failing allocation was not instrumented",
      "Duplicate rows are preserved", "not positive actual assertion coverage",
      "25,727,151", "25,727,219", "not instrumented measurements",
    ]) expect(lessonNew).toContain(value);
  });

  it("preserves historical failure-diagnostic CPU evidence and implementation limits", () => {
    for (const value of [
      "e934c1437457efc01c0c311e73026e862943041a",
      "141 Rust tests", "58 library and 83 controller", "35 Node controls",
      "strict package Clippy and build", "historical CPU package qualification",
      "100,865 bytes", "9d48d01aa078c9dd555163ac5ca14e66bc72b4f254d57f7672aba59b39ccd3e6",
      "4,096-byte stack buffer", "at most 4,097 bytes", "at most 256 retained bytes",
      "no new child reads", "original deadlines", "fixed fallback",
      "not a global stderr write-latency guarantee",
    ]) expect(physicalNew).toContain(value);
  });

  it("retains the fresh native failure without inventing a diagnosis or capture", () => {
    for (const value of [
      "gfx950-publication-diagnostic-native-observation-20260926.md",
      "separately coordinated single attempt", "`Deadline`",
      "zero capture-report bytes", "`original_protocol_result=refused(Incomplete)`",
      "`fixed owned one-stop native relation refused (15)`",
      "additional failure evidence, not a diagnosis", "retained suffix is truncated",
      "consumed command is not proof of command completion",
      "all five retained process IDs and the exact scope were absent",
      "family owner reaped the adopted inferior", "controller-side reaping was not claimed",
      "81e881850e7843dc83ef04b530317c8fd4369a609a991343f06c0bc62d35ba1c",
      "2f21c44121a459e8e54ab54f1ec1c8f9a90ae0b6635393c83075024384317a99",
      "fa609a6bdb32972f5ba695b8b364edff570b063c32cc81f91d5c055522476fea",
      "dd607bf9ca059ea92e633d563c6c48b5ab197a5bddf91737b05eb068ff00b121",
    ]) expect(physicalNew).toContain(value);
  });

  it("preserves unavailable physical state and unchanged broad exits", () => {
    for (const value of [
      "not a successful physical capture", "producer capture and GPU dispatch remain unknown",
      "cleanup is still not capture success", "unavailable state",
      "no automatic retry or public capture activation",
      "expected-value oracle never fills missing actual sample bytes",
    ]) expect(physicalNew).toContain(value);
    for (const text of [lessonNew, physicalNew]) {
      expect(text).toContain("M1/V1/V2/U1/U2/U3 (6/18)");
      expect(text).toContain("global compiler pin");
      expect(text).not.toContain("/home/harmenon");
    }
  });

  it("links the separately qualified R16 context without relabeling R15", () => {
    for (const value of [
      "27ba44e2616945481557f4555f67327aabbab043",
      "bf16-recipe-resource-context-qualification-20260926.md",
      "fresh R16 evidence, not by reusing R15",
      "2,572 backend tests", "40 lossless-comparison controls",
      "All 38 normal observation bodies and 52 output artifacts",
      "No checked-origin graph or complete nominal kernel recipe",
      "Callback surplus survives", "remaining formal/target/LLVM connections stay open",
    ]) expect(lessonNew).toContain(value);
  });
});
