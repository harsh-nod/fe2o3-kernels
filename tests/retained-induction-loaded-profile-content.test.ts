import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const hash = (value: Buffer) => createHash("sha256").update(value).digest("hex");
const notes = [
  {
    "path": "docs/source-bound-assertion-analysis-v1.md",
    "marker": "\n### Retain early induction state without granting a loop proof\n",
    "bytes": 93259,
    "sha": "355c4eac33c72eeb920b5d61137b921114b35f1867484428747cab9b5d314e80"
  },
  {
    "path": "docs/gfx950-one-stop-cpu-v1.md",
    "marker": "\n## 7. Review loaded-file records without replaying startup\n",
    "bytes": 9547,
    "sha": "7be1b9b8f941e4adb0b3fdbfb1aef2c918d0de2672df615d7e8201c98208c255"
  }
];
const appendices = notes.map((note) => {
  const source = readFileSync(note.path, "utf8");
  return source.slice(source.indexOf(note.marker)).replace(/\s+/g, " ").toLowerCase();
});

describe("retained induction and inert loaded-file review tutorial boundaries", () => {
  for (const note of notes) {
    it("preserves the complete prior prefix of " + note.path, () => {
      const source = readFileSync(note.path, "utf8"), at = source.indexOf(note.marker);
      expect(at).toBeGreaterThan(0);
      expect(source.indexOf(note.marker, at + 1)).toBe(-1);
      const prefix = Buffer.from(source.slice(0, at), "utf8");
      expect(prefix.length).toBe(note.bytes);
      expect(hash(prefix)).toBe(note.sha);
    });
  }
  it("teaches one-shot retained induction without inventing genuine loop authority", () => {
    for (const text of [
      "41fc1167f1a94810482fcf51024215d6361ca4cf",
      "original complete-cfg v1", "original six analysis bodies",
      "an empty certificate set is not a proof", "resource refusal",
      "retainedsemanticu32inductionv1::new()", "completed_for(source, function)",
      "report.grants_authority()", "report.authorizes_compiler_transform()",
      "non-copy owning error", "owner is one-shot", "canonical physical budget",
      "checked postflight", "before destruction and credit release",
      "12 component controls", "368 model tests", "3,349 backend tests",
      "does not establish a genuine rust loop certificate",
      "v2 ssa/reachable-scope mode", "ordinary production admission",
      "4441b7c5a871058c85b6c3706375e19aed04834813fccefab8db86a725608092",
    ]) expect(appendices[0]).toContain(text);
  });
  it("keeps published portable review controls historically scoped", () => {
    for (const text of [
      "173 cpu controls",
      "ce1ec08a9420c2e923fac7ed42960a4cd8586192",
      "32 fixture-free api/admission controls",
      "173 profile and 77 planner historical controls",
      "node --test tools/debugger/loaded-profile/portable-api.test.mjs",
      "fe2o3_loaded_review_fixtures=/absolute/path/fixtures.json",
      "historical-profile-controls.mjs", "historical-selection-controls.mjs",
      "explicit manifest", "all 76 complete source-pinned fixture files",
      "missing fixtures fail", "no silent skip", "no raw host archive",
      "both commands are cpu-only controls",
      "earlier stage limits and the expired native coordination remain unchanged",
      "72 complete", "1,024 before/after selected identities", "879 historical duties",
      "reviewloadedstartup(retainedinputbuffers)", "no operational file is opened",
      "193 named file roles", "170 present", "23 absent", "398,626,885",
      "104 initial python", "50 mapped elf", "123 newly observed", "37 static",
      "not a zero-byte readable file", "does not prove that its bytecode executed",
      "sitecustomize alias", "failed first startup remains failed",
      "not exhaustive branch coverage",
      "7269304a46332efe72bdc176aad4feccceb8c1035dd5bd19fc7c2720beb8ea22",
    ]) expect(appendices[1]).toContain(text);
  });
  it("keeps capture, live activation and broad public exits separate", () => {
    for (const appendix of appendices) expect(appendix).toContain("m1/v1/v2/u1/u2/u3 (6/18)");
    expect(appendices[0]).toContain("no gpu execution or debugger capture");
    for (const text of [
      "not a live debugger adapter", "physical_files_reread === false",
      "runtime_acceptance === false", "physical_capture === false",
      "no input limit", "no native replay command", "v4 remains open",
      "no physical register heatmap", "complete import history, cache-execution provenance",
    ]) expect(appendices[1]).toContain(text);
    expect(appendices[1]).not.toContain("--acknowledge-reviewed-static-startup-candidates-and-external-supervision");
  });
});
