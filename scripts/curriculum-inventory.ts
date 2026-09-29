import { Buffer } from "node:buffer";
import { isDeepStrictEqual } from "node:util";
import type { Lesson } from "../src/content/model";
import { authorFacingCode } from "../src/lib/kernel-authoring";
import { projectCurriculumTab, validateCurriculumEvidence, validateCurriculumSourcePin } from "./curriculum-evidence";

export interface CurriculumSiteIdentity {
  repository: string;
  commit: string;
  tree: string;
}

function requireCondition(condition: unknown, detail: string): asserts condition {
  if (!condition) throw new Error(`curriculum inventory: ${detail}`);
}

export function validateCurriculumSiteIdentity(value: unknown): CurriculumSiteIdentity {
  requireCondition(value !== null && typeof value === "object" && !Array.isArray(value), "site must be an object");
  const site = value as Record<string, unknown>;
  requireCondition(isDeepStrictEqual(Object.keys(site).sort(), ["commit", "repository", "tree"]), "site fields differ");
  requireCondition(site.repository === "harsh-nod/fe2o3-kernels", "site repository differs");
  requireCondition(typeof site.commit === "string" && /^[0-9a-f]{40}$/u.test(site.commit), "site commit differs");
  requireCondition(typeof site.tree === "string" && /^[0-9a-f]{40}$/u.test(site.tree), "site tree differs");
  return { repository: site.repository, commit: site.commit, tree: site.tree };
}

export function requireUnchangedCurriculumSite(before: unknown, after: unknown) {
  requireCondition(isDeepStrictEqual(validateCurriculumSiteIdentity(before), validateCurriculumSiteIdentity(after)), "site changed during export");
}

function boundedUtf8(text: string, label: string) {
  const bytes = Buffer.from(text, "utf8");
  requireCondition(bytes.length <= 4 * 1024 * 1024 && bytes.toString("utf8") === text, `${label} is not bounded exact UTF-8`);
  return text;
}

export function exportCurriculumInventory(
  lessons: readonly Lesson[],
  compilerManifest: Uint8Array,
  sourcePin: unknown,
  siteIdentity: unknown,
) {
  const site = validateCurriculumSiteIdentity(siteIdentity);
  const pin = validateCurriculumSourcePin(sourcePin);
  // Reuse the same complete source/display contract as site evidence validation.
  // This historical source pin is not a claim that the current compiler is qualified.
  validateCurriculumEvidence(compilerManifest, pin.sha256, lessons);
  const inventory = {
    schema: "fe2o3-tutorial-runtime-projection-v1",
    site,
    lessons: lessons.map((lesson) => ({
      id: lesson.id,
      codeTabs: lesson.tabs.map((tab, ordinal) => {
        requireCondition(tab.sourceFragments === undefined || tab.sourceFragments.length <= 64, "source fragment count exceeds compiler bound");
        return {
          ...projectCurriculumTab(tab, ordinal),
          displayedCode: boundedUtf8(authorFacingCode(tab).code, "displayed code"),
          sourceFragments: tab.sourceFragments?.map((fragment) => boundedUtf8(fragment, "source fragment")) ?? null,
        };
      }),
    })),
  };
  requireCondition(Buffer.byteLength(JSON.stringify(inventory)) + 1 <= 16 * 1024 * 1024, "serialized inventory exceeds compiler bound");
  return inventory;
}
