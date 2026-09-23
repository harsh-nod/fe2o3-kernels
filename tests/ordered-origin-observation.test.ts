import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { compareOrderedOrigin, parseOrderedOriginJson, type OrderedOriginSubject } from "../src/content/ordered-origin-observation.mjs";

const framed = readFileSync("examples/ordered_program_origin_v1.json", "utf8");
// Public text file adds exactly one LF; the prefix retains the producer's exact bytes.
const raw = framed.slice(0, -1);
const change = (edit: (value: ReturnType<typeof JSON.parse>) => void) => {
  const value = JSON.parse(raw); edit(value); return JSON.stringify(value);
};
// A made-up comparison subject for unit checks, not a native capture or qualification.
function syntheticSubject(): OrderedOriginSubject {
  const origin = parseOrderedOriginJson(raw);
  return { canonicalKirSha256: origin.canonicalSha256, semanticSha256: origin.semanticSha256,
    sourceInventorySha256: origin.sourceInventorySha256, sourcePreflightSha256: origin.sourcePreflightSha256,
    originBinding: origin };
}
afterEach(() => vi.unstubAllGlobals());

describe("closed whole-region ordered origin", () => {
  it("pins the actual fresh compiler report and preserves its observed spans/depth", () => {
    expect(Buffer.byteLength(framed)).toBe(3036); expect(framed.endsWith("\n")).toBe(true);
    expect(createHash("sha256").update(framed).digest("hex")).toBe("35ad08b390e5bf30c7ffc0eedbac0dfae58c996bb920b07e597dfa730a4a0f24");
    expect(Buffer.byteLength(raw)).toBe(3035);
    expect(createHash("sha256").update(raw).digest("hex")).toBe("ea02e063945404c28615f38049e7656ed5a5b0c9072ca58261742ea80359ee00");
    const origin = parseOrderedOriginJson(raw);
    expect(origin.expansionDepth).toBe(1); expect(origin.declaredDescriptors).toEqual([8, 201]);
    expect(origin.callSite).toMatchObject({ byte_start: 351, byte_end: 561, line_start: 12, column_start: 18, line_end: 17, column_end: 6 });
    expect(origin.expansion).toMatchObject({ byte_start: 9789, byte_end: 10074, line_start: 285, column_start: 9, line_end: 291, column_end: 68 });
    expect(Object.isFrozen(origin)).toBe(true); expect(Object.isFrozen(origin.callSite)).toBe(true);
  });
  it.each([
    ["unknown top-level key", (x: ReturnType<typeof JSON.parse>) => { x.extra = 1; }],
    ["missing identity", (x: ReturnType<typeof JSON.parse>) => { delete x.source_preflight_sha256; }],
    ["wrong schema", (x: ReturnType<typeof JSON.parse>) => { x.schema = "other"; }],
    ["source authority", (x: ReturnType<typeof JSON.parse>) => { x.authenticates_source = true; }],
    ["compiler authority", (x: ReturnType<typeof JSON.parse>) => { x.authenticates_compiler_execution = true; }],
    ["resume authority", (x: ReturnType<typeof JSON.parse>) => { x.grants_proof_resume_artifact_launch_authority = true; }],
    ["wave", (x: ReturnType<typeof JSON.parse>) => { x.wave_width = 32; }],
    ["target", (x: ReturnType<typeof JSON.parse>) => { x.target = "gfx950"; }],
    ["canonical version", (x: ReturnType<typeof JSON.parse>) => { x.canonical_version = 16; }],
    ["semantic version", (x: ReturnType<typeof JSON.parse>) => { x.semantic_version = 31; }],
    ["zero digest", (x: ReturnType<typeof JSON.parse>) => { x.semantic_sha256 = "0".repeat(64); }],
    ["uppercase digest", (x: ReturnType<typeof JSON.parse>) => { x.canonical_sha256 = x.canonical_sha256.toUpperCase(); }],
    ["inconsistent root", (x: ReturnType<typeof JSON.parse>) => { x.root_function_sha256 = "1".repeat(64); }],
    ["reverse bytes", (x: ReturnType<typeof JSON.parse>) => { x.call_site.byte_end = 0; }],
    ["reverse lines", (x: ReturnType<typeof JSON.parse>) => { x.expansion.line_end = 1; }],
    ["invented filename", (x: ReturnType<typeof JSON.parse>) => { x.call_site.path = "/invented.rs"; }],
    ["depth cap", (x: ReturnType<typeof JSON.parse>) => { x.expansion_depth = 257; }],
    ["fine ancestry", (x: ReturnType<typeof JSON.parse>) => { x.fine_step_origins = []; }],
    ["invented macro frames", (x: ReturnType<typeof JSON.parse>) => { x.macro_expansion_frames = []; }],
    ["physical lifetime", (x: ReturnType<typeof JSON.parse>) => { x.physical_register_lifetimes = "observed"; }],
    ["map identity", (x: ReturnType<typeof JSON.parse>) => { x.source_map_identity = "1".repeat(64); }],
    ["instruction count", (x: ReturnType<typeof JSON.parse>) => { x.declared_instructions = Array(17).fill(x.declared_instructions[0]); }],
    ["empty program", (x: ReturnType<typeof JSON.parse>) => { x.declared_instructions = []; }],
    ["ordinal", (x: ReturnType<typeof JSON.parse>) => { x.declared_instructions[1].ordinal = 0; }],
    ["per-step association", (x: ReturnType<typeof JSON.parse>) => { x.declared_instructions[0].source_association = "exact_instruction"; }],
    ["bad descriptor", (x: ReturnType<typeof JSON.parse>) => { x.declared_instructions[0].descriptor = 1024; }],
    ["undefined output read", (x: ReturnType<typeof JSON.parse>) => { x.declared_instructions[0].descriptor = 0; }],
    ["register alias", (x: ReturnType<typeof JSON.parse>) => { x.declared_register_roles.scratch = 33; }],
    ["work cap", (x: ReturnType<typeof JSON.parse>) => { x.limits.source_reobservation_work_used = 1048577; }],
    ["false RSS accounting", (x: ReturnType<typeof JSON.parse>) => { x.limits.rustc_internal_allocations_accounted = true; }],
  ] as const)("rejects %s", (_label, edit) => {
    expect(() => parseOrderedOriginJson(change(edit))).toThrow();
  });
  it.each([
    ["duplicate key", raw.replace('"diagnostic_only":true', '"diagnostic_only":true, "diagnostic_only":true')],
    ["escaped duplicate", raw.replace('"diagnostic_only":true', '"diagnostic_only":true, "diagnostic_\\u006fnly": true')],
    ["BOM", "\ufeff" + raw], ["trailing JSON", raw + "{}"],
    ["negative", raw.replace('"expansion_depth":1', '"expansion_depth":-1')],
    ["fraction", raw.replace('"expansion_depth":1', '"expansion_depth":1.0')],
    ["exponent", raw.replace('"expansion_depth":1', '"expansion_depth":1e0')],
    ["large integer", raw.replace('"expansion_depth":1', '"expansion_depth":18446744073709551615')],
    ["unpaired surrogate", raw + "\ud800"],
  ])("rejects malformed %s", (_label, text) => { expect(() => parseOrderedOriginJson(text)).toThrow(); });
  it("refuses UTF-8 byte overflow before TextEncoder or parsing allocation", () => {
    const encoder = vi.fn(() => { throw new Error("must not allocate"); }); vi.stubGlobal("TextEncoder", encoder);
    expect(() => parseOrderedOriginJson(raw.padStart(16380, "é"))).toThrow(/16 KiB/u);
    expect(() => parseOrderedOriginJson(" ".repeat(16385))).toThrow(/16 KiB/u);
    expect(encoder).not.toHaveBeenCalled();
  });
  it("accepts actual zero macro depth as data rather than inferring from instruction count", () => {
    expect(parseOrderedOriginJson(change(x => { x.expansion_depth = 0; })).expansionDepth).toBe(0);
  });
  it("accepts the exact text cap and synthetic declared count/depth/work boundaries", () => {
    expect(parseOrderedOriginJson(raw.padEnd(16384, " ")).expansionDepth).toBe(1);
    const maximum = parseOrderedOriginJson(change(x => {
      x.expansion_depth = 256; x.limits.source_reobservation_work_used = 1048576;
      x.declared_instructions = Array.from({ length: 16 }, (_, ordinal) => ({ ordinal,
        descriptor: ordinal === 0 ? 8 : 201, source_association: "whole_ordered_region_only" }));
    }));
    expect(maximum.declaredDescriptors).toHaveLength(16); expect(maximum.expansionDepth).toBe(256);
  });
  it("matches a deliberately synthetic exact comparison subject without claiming provenance", () => {
    expect(compareOrderedOrigin(parseOrderedOriginJson(raw), syntheticSubject())).toEqual({
      status: "matching_reported_identities", mismatches: [],
    });
  });
  it.each(["canonicalKirSha256", "semanticSha256", "sourceInventorySha256", "sourcePreflightSha256"] as const)(
    "refuses synthetic exact-subject substitution of %s", field => {
      const subject = { ...syntheticSubject(), [field]: "1".repeat(64) };
      expect(compareOrderedOrigin(parseOrderedOriginJson(raw), subject).status).toBe("mismatch");
    });
  it.each(["frontend_unit", "function", "contract", "statement"] as const)("checks every declared source ID: %s", field => {
    const subject = syntheticSubject();
    const changed = { ...subject, originBinding: { ...subject.originBinding,
      declaredSourceIds: { ...subject.originBinding.declaredSourceIds, [field]: "1".repeat(64) } } };
    expect(compareOrderedOrigin(parseOrderedOriginJson(raw), changed).mismatches).toContain("Declared source IDs");
  });
  it("equal source bytes and case names cannot replace canonical/source bindings", () => {
    const subject = { ...syntheticSubject(), sourceSha256: "fa7634a5a1bc841db4b2a8ed5240b0184dfce8c79259fad6e04e60c66f5d08af",
      canonicalKirSha256: "243a10974becf41a02bbc07625805eeda634190f52a63e65edf7b924488cc703" };
    expect(compareOrderedOrigin(parseOrderedOriginJson(raw), subject).mismatches).toContain("Canonical KIR identity");
  });
  it.each([
    ["canonicalBytes", 1015, "Canonical byte length"], ["target", "gfx950", "Target"], ["waveWidth", 32, "Wave width"],
    ["coordinate", [0, 0, 1], "KIR roster coordinate"], ["rawBlock", 1, "KIR raw block"],
    ["declaredDescriptors", [8, 209], "Declared descriptors"],
    ["registerRoles", { scratch: 31, output: 33, inputs: [34, 35, 36] }, "Declared register roles"],
  ] as const)("checks the structural binding %s", (field, value, expected) => {
    const subject = syntheticSubject();
    const changed = { ...subject, originBinding: { ...subject.originBinding, [field]: value } } as OrderedOriginSubject;
    expect(compareOrderedOrigin(parseOrderedOriginJson(raw), changed).mismatches).toContain(expected);
  });
});
