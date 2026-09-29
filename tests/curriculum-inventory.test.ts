import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { lessons } from "../src/content/curriculum";
import { authorFacingCode } from "../src/lib/kernel-authoring";
import { projectCurriculumTab } from "../scripts/curriculum-evidence";
import { exportCurriculumInventory, requireUnchangedCurriculumSite, validateCurriculumSiteIdentity } from "../scripts/curriculum-inventory";

const site = { repository: "harsh-nod/fe2o3-kernels", commit: "c".repeat(40), tree: "d".repeat(40) };

function fixture(current = lessons) {
  const manifest = {
    schema: "fe2o3-tutorial-kernel-source-contract-v1",
    entries: current.map((lesson) => ({
      lessonId: lesson.id,
      sourcePaths: lesson.tabs.flatMap((tab) => tab.kind === "kernel" && tab.language === "rust" && tab.sourcePath ? [tab.sourcePath] : []),
      compilerFixtureIds: [] as string[],
    })),
    compilerFixtures: [],
    curriculum: {
      schema: "fe2o3-tutorial-curriculum-obligations-v1",
      site: { ...site, commit: "a".repeat(40), tree: "b".repeat(40) },
      status: "pending",
      lessons: current.map((lesson, index) => ({
        lessonId: lesson.id, role: "executable", roleReason: "Fixture source obligation",
        sourceEntryIds: [lesson.id], sourceBindingGap: null,
        variants: (index === 0 ? ["simt", "tile", "mixed"] : ["simt", "tile"]).map((kind) => ({
          kind, status: "pending", sourceItems: [], reason: "Source implementation pending",
        })),
        codeTabs: lesson.tabs.map((tab, ordinal) => ({
          ...projectCurriculumTab(tab, ordinal), sourceItem: null,
          sourceItemStatus: tab.kind === "kernel" && tab.language === "rust" ? "pending" : "not-applicable",
        })),
      })),
    },
  };
  const bytes = Buffer.from(JSON.stringify(manifest));
  const pin = { commit: "a".repeat(40), tree: "b".repeat(40), path: "config/tutorial-kernel-manifest-v1.json", sha256: createHash("sha256").update(bytes).digest("hex") };
  return { bytes, pin, manifest };
}

describe("runtime curriculum inventory", () => {
  it("exports every actual ordered author-facing tab without granting qualification", () => {
    const { bytes, pin } = fixture();
    const inventory = exportCurriculumInventory(lessons, bytes, pin, site);
    expect(inventory.schema).toBe("fe2o3-tutorial-runtime-projection-v1");
    expect(inventory.site).toEqual(site);
    expect(inventory.lessons.map((lesson) => lesson.id)).toEqual(lessons.map((lesson) => lesson.id));
    expect(inventory.lessons).toHaveLength(56);
    expect(inventory.lessons.flatMap((lesson) => lesson.codeTabs)).toHaveLength(307);
    for (const [index, lesson] of lessons.entries()) {
      for (const [ordinal, tab] of lesson.tabs.entries()) {
        expect(inventory.lessons[index].codeTabs[ordinal]).toEqual({
          ...projectCurriculumTab(tab, ordinal), displayedCode: authorFacingCode(tab).code,
          sourceFragments: tab.sourceFragments ?? null,
        });
      }
    }
    expect(Object.keys(inventory).sort()).toEqual(["lessons", "schema", "site"]);
  });

  it("rejects missing, extra and reordered lessons or tabs against the pinned contract", () => {
    const { bytes, pin } = fixture();
    const variants = [lessons.slice(1), [...lessons, lessons[0]], [lessons[1], lessons[0], ...lessons.slice(2)]];
    for (const current of variants) expect(() => exportCurriculumInventory(current, bytes, pin, site)).toThrow();
    for (const change of [0, 1, 2]) {
      const current = structuredClone(lessons);
      if (change === 0) current[0].tabs.pop();
      if (change === 1) current[0].tabs.push(current[0].tabs[0]);
      if (change === 2) [current[0].tabs[0], current[0].tabs[1]] = [current[0].tabs[1], current[0].tabs[0]];
      expect(() => exportCurriculumInventory(current, bytes, pin, site)).toThrow();
    }
  });

  it("rejects changed display bytes, source metadata and fragment order", () => {
    const { bytes, pin } = fixture();
    for (const change of [0, 1, 2]) {
      const current = structuredClone(lessons);
      if (change === 0) current[0].tabs[0].code += "\nchanged display";
      if (change === 1) current[0].tabs[0].sourceCommit = "e".repeat(40);
      if (change === 2) {
        const tab = current.flatMap((lesson) => lesson.tabs).find((tab) => tab.sourceFragments && tab.sourceFragments.length > 1);
        expect(tab).toBeDefined();
        tab!.sourceFragments = [...tab!.sourceFragments!].reverse();
      }
      expect(() => exportCurriculumInventory(current, bytes, pin, site)).toThrow();
    }
  });

  it("rejects stale pins and Boolean/integer substitutions even with a recomputed blob digest", () => {
    const { bytes, pin, manifest } = fixture();
    expect(() => exportCurriculumInventory(lessons, bytes, { ...pin, sha256: "0".repeat(64) }, site)).toThrow();
    Object.assign(manifest.curriculum.lessons[0].codeTabs[0], { ordinal: false });
    const changed = Buffer.from(JSON.stringify(manifest));
    const changedPin = { ...pin, sha256: createHash("sha256").update(changed).digest("hex") };
    expect(() => exportCurriculumInventory(lessons, changed, changedPin, site)).toThrow();
  });

  it("refuses malformed, foreign or changing site identities", () => {
    for (const value of [null, { ...site, commit: true }, { ...site, tree: "short" }, { ...site, repository: "different/site" }, { ...site, extra: 1 }]) {
      expect(() => validateCurriculumSiteIdentity(value)).toThrow();
    }
    expect(() => requireUnchangedCurriculumSite(site, { ...site })).not.toThrow();
    expect(() => requireUnchangedCurriculumSite(site, { ...site, commit: "e".repeat(40) })).toThrow();
    expect(() => requireUnchangedCurriculumSite(site, { ...site, tree: "e".repeat(40) })).toThrow();
  });

  it("refuses lossy UTF-8 even when replacement bytes were used to form a matching manifest", () => {
    const current = structuredClone(lessons);
    current[0].tabs[0].code = "invalid lone surrogate: \ud800";
    const { bytes, pin } = fixture(current);
    expect(() => exportCurriculumInventory(current, bytes, pin, site)).toThrow("exact UTF-8");
  });
});
