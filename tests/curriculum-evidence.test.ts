import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { lessons } from "../src/content/curriculum";
import type { Lesson } from "../src/content/model";
import { projectCurriculumTab, validateCurriculumEvidence, validateCurriculumSourcePin } from "../scripts/curriculum-evidence";

function fixture(current: readonly Lesson[] = lessons) {
  return {
    schema: "fe2o3-tutorial-kernel-source-contract-v1",
    entries: current.map((lesson) => ({
      lessonId: lesson.id,
      sourcePaths: lesson.tabs.flatMap((tab) => tab.kind === "kernel" && tab.language === "rust" && tab.sourcePath ? [tab.sourcePath] : []),
      compilerFixtureIds: [] as string[],
    })),
    compilerFixtures: [] as { fixtureId: string; compilerInput: { sourcePaths: string[] } }[],
    curriculum: {
      schema: "fe2o3-tutorial-curriculum-obligations-v1",
      site: { repository: "harsh-nod/fe2o3-kernels", commit: "a".repeat(40), tree: "b".repeat(40) },
      status: "pending",
      lessons: current.map((lesson, index) => ({
        lessonId: lesson.id,
        role: "executable",
        roleReason: "Fixture source obligation",
        sourceEntryIds: [lesson.id],
        sourceBindingGap: null as string | null,
        variants: (index === 0 ? ["simt", "tile", "mixed"] : ["simt", "tile"]).map((kind) => ({
          kind, status: "pending", sourceItems: [] as string[], reason: "Source implementation pending",
        })),
        codeTabs: lesson.tabs.map((tab, ordinal) => ({
          ...projectCurriculumTab(tab, ordinal),
          sourceItem: null as string | null,
          sourceItemStatus: tab.kind === "kernel" && tab.language === "rust" ? "pending" : "not-applicable",
        })),
      })),
    },
  };
}

function encoded(value: unknown) {
  const bytes = Buffer.from(JSON.stringify(value));
  return { bytes, sha256: createHash("sha256").update(bytes).digest("hex") };
}

function validate(value: unknown, current: readonly Lesson[] = lessons) {
  const { bytes, sha256 } = encoded(value);
  return validateCurriculumEvidence(bytes, sha256, current);
}

describe("compiler-owned curriculum evidence", () => {
  it("binds every runtime lesson and ordered code tab without qualification", () => {
    expect(validate(fixture())).toEqual({ lessons: 56, codeTabs: 306, status: "pending" });
  });

  it("accepts a historical site snapshot without requiring current-site HEAD equality", () => {
    const manifest = fixture();
    manifest.curriculum.site.commit = "c".repeat(40);
    manifest.curriculum.site.tree = "d".repeat(40);
    expect(() => validate(manifest)).not.toThrow();
  });

  it("requires the exact pinned blob", () => {
    const { bytes, sha256 } = encoded(fixture());
    expect(() => validateCurriculumEvidence(bytes, "0".repeat(64), lessons)).toThrow("blob SHA256");
    expect(() => validateCurriculumEvidence(Buffer.concat([bytes, Buffer.from(" ")]), sha256, lessons)).toThrow("blob SHA256");
    expect(() => validateCurriculumEvidence(Buffer.alloc(4 * 1024 * 1024 + 1), sha256, lessons)).toThrow("byte bound");
  });

  it("rejects malformed UTF-8 even when its bytes match the pinned digest", () => {
    const bytes = Buffer.concat([Buffer.from('{"text":"'), Buffer.from([0xff]), Buffer.from('"}')]);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    expect(() => validateCurriculumEvidence(bytes, sha256, lessons)).toThrow(/encoded data|encoding|UTF-8/u);
  });

  it.each([undefined, null, [], {}, { schema: "other" }].map((value) => ({ value })))("rejects absent or malformed curriculum: $value", ({ value }) => {
    expect(() => validate({ ...fixture(), curriculum: value })).toThrow();
  });

  it("rejects missing, new, duplicated and reordered runtime lessons", () => {
    const manifest = fixture();
    for (const current of [
      lessons.slice(1),
      [...lessons, { ...lessons[0], id: "new-lesson" }],
      [lessons[0], ...lessons],
      [...lessons].reverse(),
    ]) expect(() => validate(manifest, current)).toThrow("ordered lesson coverage");
  });

  it("rejects missing, added and reordered code tabs", () => {
    const manifest = fixture();
    const lesson = lessons.find((candidate) => candidate.tabs.length > 1)!;
    for (const tabs of [lesson.tabs.slice(1), [...lesson.tabs, lesson.tabs[0]], [...lesson.tabs].reverse()]) {
      const current = lessons.map((candidate) => candidate.id === lesson.id ? { ...candidate, tabs } : candidate);
      expect(() => validate(manifest, current)).toThrow(/code-tab coverage|source\/display binding/u);
    }
  });

  it.each([
    "ordinal", "kind", "label", "language", "displayedUtf8Bytes", "displayedSha256",
    "sourcePath", "sourceCommit", "sourceSha256", "sourceDigestScope", "sourceFragmentsSha256",
    "explanatory", "evidenceId", "sourceItem", "sourceItemStatus",
  ])("rejects a missing explicit tab field: %s", (field) => {
    const manifest = fixture();
    Reflect.deleteProperty(manifest.curriculum.lessons[0].codeTabs[0], field);
    expect(() => validate(manifest)).toThrow("source/display binding");
  });

  it("rejects stale source metadata and display bytes", () => {
    const manifest = fixture();
    for (const changed of [
      { sourcePath: "changed.rs" }, { sourceCommit: "c".repeat(40) },
      { sourceSha256: "d".repeat(64) }, { sourceFragments: ["changed fragment"] },
      { explanatory: !lessons[0].tabs[0].explanatory },
      { code: `${lessons[0].tabs[0].code}\n// changed\n` },
    ]) {
      const current = structuredClone(lessons);
      Object.assign(current[0].tabs[0], changed);
      expect(() => validate(manifest, current)).toThrow(/source\/display binding|source-binding gap/u);
    }
  });

  it("uses exact author-facing UTF-8 rather than the unprojected source", () => {
    const current = structuredClone(lessons);
    current[0].tabs[0] = {
      kind: "kernel", language: "rust", label: "projection",
      code: `#[kernel(\n    typed,\n    namespace = "${"a".repeat(64)}",\n)]\npub fn fill() { /* \u03bb */ }`,
    };
    const manifest = fixture(current);
    const tab = manifest.curriculum.lessons[0].codeTabs[0];
    expect(tab.displayedUtf8Bytes).toBeLessThan(Buffer.byteLength(current[0].tabs[0].code));
    current[0].tabs[0].code = current[0].tabs[0].code.replace("a".repeat(64), "b".repeat(64));
    expect(() => validate(manifest, current)).not.toThrow();
    current[0].tabs[0].code += "\n";
    expect(() => validate(manifest, current)).toThrow("source/display binding");
  });

  it("cannot promote pending variants or source items to qualification", () => {
    for (const mutation of [
      (manifest: ReturnType<typeof fixture>) => { manifest.curriculum.status = "qualified"; },
      (manifest: ReturnType<typeof fixture>) => { manifest.curriculum.lessons[0].variants[0].status = "passed"; },
      (manifest: ReturnType<typeof fixture>) => { manifest.curriculum.lessons[0].variants[0].sourceItems = ["unproven"]; },
      (manifest: ReturnType<typeof fixture>) => { manifest.curriculum.lessons[0].codeTabs[0].sourceItem = "unproven"; },
    ]) {
      const manifest = fixture();
      mutation(manifest);
      expect(() => validate(manifest)).toThrow();
    }
  });

  it.each([null, [], {}, 1, true].map((value) => ({ value })))("rejects malformed enums through controlled diagnostics: $value", ({ value }) => {
    for (const field of ["role", "variant", "tab"]) {
      const manifest = fixture();
      const binding = manifest.curriculum.lessons[0];
      if (field === "role") Reflect.set(binding, "role", value);
      if (field === "variant") Reflect.set(binding.variants[0], "kind", value);
      if (field === "tab") Reflect.set(binding.codeTabs[0], "kind", value);
      expect(() => validate(manifest)).toThrow(/^curriculum evidence:/u);
    }
  });

  it("retains SIMT/tile, mixed and existing source-entry obligations", () => {
    for (const mutation of [
      (manifest: ReturnType<typeof fixture>) => { manifest.curriculum.lessons[0].variants.pop(); },
      (manifest: ReturnType<typeof fixture>) => { manifest.curriculum.lessons[1].variants.reverse(); },
      (manifest: ReturnType<typeof fixture>) => { manifest.curriculum.lessons[0].sourceEntryIds = []; },
      (manifest: ReturnType<typeof fixture>) => { manifest.curriculum.lessons[0].role = "conceptual"; },
    ]) {
      const manifest = fixture();
      mutation(manifest);
      expect(() => validate(manifest)).toThrow();
    }
  });

  it("retains conceptual lessons and explicit executable source-binding gaps", () => {
    const manifest = fixture();
    const conceptual = manifest.curriculum.lessons[1];
    conceptual.role = "conceptual";
    conceptual.sourceEntryIds = [];
    conceptual.variants = [];
    conceptual.codeTabs.forEach((tab) => { tab.sourceItemStatus = "not-applicable"; });
    const unbound = manifest.curriculum.lessons[2];
    unbound.sourceEntryIds = [];
    unbound.sourceBindingGap = "Source entry implementation remains pending";
    manifest.entries = manifest.entries.filter((entry) => ![conceptual.lessonId, unbound.lessonId].includes(entry.lessonId));
    expect(() => validate(manifest)).not.toThrow();
    unbound.sourceBindingGap = null;
    expect(() => validate(manifest)).toThrow("source-binding gap");
  });

  it("rejects unrelated aliases and admits paths from the selected fixture closure", () => {
    const current = structuredClone(lessons.slice(0, 2));
    current.forEach((lesson, index) => {
      lesson.id = index === 0 ? "source-owner" : "source-alias";
      lesson.tabs = [{ kind: "kernel", language: "rust", label: "kernel", code: "pub fn kernel() {}", sourcePath: `src/${lesson.id}.rs` }];
    });
    const manifest = fixture(current);
    manifest.entries.pop();
    manifest.curriculum.lessons[1].sourceEntryIds = ["source-owner"];
    expect(() => validate(manifest, current)).toThrow("unrelated to its displayed kernel paths");
    manifest.entries[0].compilerFixtureIds = ["alias-fixture"];
    manifest.compilerFixtures.push({ fixtureId: "alias-fixture", compilerInput: { sourcePaths: ["src/source-alias.rs"] } });
    expect(() => validate(manifest, current)).not.toThrow();
    manifest.compilerFixtures[0].compilerInput.sourcePaths = ["src/unrelated.rs"];
    expect(() => validate(manifest, current)).toThrow("unrelated to its displayed kernel paths");
  });

  it("requires a gap for uncovered historical same-ID kernel paths", () => {
    const current = structuredClone(lessons);
    current[0].tabs = [{ kind: "kernel", language: "rust", label: "historical", code: "pub fn kernel() {}", sourcePath: "historical/kernel.rs" }];
    const manifest = fixture(current);
    manifest.entries[0].sourcePaths = ["current/kernel.rs"];
    expect(() => validate(manifest, current)).toThrow("historical/kernel.rs");
    manifest.curriculum.lessons[0].sourceBindingGap = "historical/kernel.rs is not in the current compiler source closure";
    expect(() => validate(manifest, current)).not.toThrow();
    manifest.entries[0].sourcePaths = ["historical/kernel.rs"];
    expect(() => validate(manifest, current)).toThrow("source-binding gap");
  });
});

describe("curriculum source pin", () => {
  const pin = { commit: "a".repeat(40), tree: "b".repeat(40), path: "config/tutorial-kernel-manifest-v1.json", sha256: "c".repeat(64) };
  it("requires exact compiler-owned provenance", () => {
    expect(validateCurriculumSourcePin(pin)).toEqual(pin);
    for (const changed of [
      { commit: null }, { tree: null }, { sha256: null }, { commit: "main" },
      { path: "../other.json" }, { extraInventory: [] },
    ]) expect(() => validateCurriculumSourcePin({ ...pin, ...changed })).toThrow();
  });
});
