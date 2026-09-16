import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import type { CodeTab, Lesson } from "../src/content/model";
import { authorFacingCode } from "../src/lib/kernel-authoring";

type ObjectValue = Record<string, unknown>;
export interface CurriculumSourcePin {
  commit: string;
  tree: string;
  path: string;
  sha256: string;
}

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`curriculum evidence: ${message}`);
}

function object(value: unknown, label: string): ObjectValue {
  requireCondition(value !== null && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  return value as ObjectValue;
}

function array(value: unknown, label: string, maximum: number): unknown[] {
  requireCondition(Array.isArray(value) && value.length <= maximum, `${label} must be a bounded array`);
  return value;
}

function exactKeys(value: ObjectValue, keys: string[], label: string) {
  requireCondition(isDeepStrictEqual(Object.keys(value).sort(), keys.sort()), `${label} has missing or unknown fields`);
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function strings(value: unknown, label: string): string[] {
  const values = array(value, label, 1024);
  requireCondition(values.every(nonempty), `${label} must contain nonempty strings`);
  return values;
}

function digest(value: unknown, digits: number): value is string {
  return typeof value === "string" && new RegExp(`^[0-9a-f]{${digits}}$`, "u").test(value);
}

function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

const sourceContractSchema = "fe2o3-tutorial-curriculum-obligations-v2";
const sourceContractDomain = "fe2o3-tutorial-displayed-source-contract-v1\0";
const identifier = /^[A-Za-z_][A-Za-z0-9_]*$/u;

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
      .map(([key, item]) => [key, canonical(item)]));
  }
  return value;
}

export function sourceItemContractSha256(lessonId: string, tab: CodeTab, ordinal: number, sourceItem: ObjectValue): string {
  const payload = JSON.stringify(canonical({
    curriculumSchema: sourceContractSchema, lessonId,
    tab: projectCurriculumTab(tab, ordinal),
    sourceItem: Object.fromEntries(Object.entries(sourceItem).filter(([key]) => key !== "contractSha256")),
  })).replace(/[^\x20-\x7e]/gu, (value) => {
    let escaped = "";
    for (let index = 0; index < value.length; index++) {
      escaped += `\\u${value.charCodeAt(index).toString(16).padStart(4, "0")}`;
    }
    return escaped;
  });
  return sha256(sourceContractDomain + payload);
}

function boundedInteger(value: unknown, minimum: number, maximum: number, label: string): asserts value is number {
  requireCondition(typeof value === "number" && Number.isSafeInteger(value) && value >= minimum && value <= maximum, `${label} must be a bounded integer`);
}

function validateSourceItem(lessonId: string, tab: CodeTab, ordinal: number, value: unknown): string {
  const label = `${lessonId} tab ${ordinal} source item`;
  const item = object(value, label);
  exactKeys(item, ["kind", "compilerInput", "driver", "sourceRanges", "cases", "contractSha256"], label);
  requireCondition(item.kind === "source-driver", `${label} has an unsupported kind`);
  const input = object(item.compilerInput, `${label}.compilerInput`);
  exactKeys(input, ["packageManifest", "packageManifestSha256", "cargoLockPath", "cargoLockSha256", "sourcePaths", "sourceClosureSha256", "cargoTarget", "defaultFeatures"], `${label}.compilerInput`);
  for (const key of ["packageManifestSha256", "cargoLockSha256", "sourceClosureSha256"]) {
    requireCondition(digest(input[key], 64), `${label} requires an exact ${key}`);
  }
  requireCondition(nonempty(input.packageManifest) && nonempty(input.cargoLockPath) && typeof input.defaultFeatures === "boolean", `${label} has incomplete compiler inputs`);
  requireCondition(nonempty(tab.sourcePath) && isDeepStrictEqual(input.sourcePaths, [tab.sourcePath]), `${label} must bind its exact displayed source path`);
  const target = object(input.cargoTarget, `${label}.cargoTarget`);
  exactKeys(target, ["kind", "name", "sourcePath"], `${label}.cargoTarget`);
  requireCondition(target.kind === "lib" && typeof target.name === "string" && identifier.test(target.name) && nonempty(target.sourcePath), `${label} requires an exact library target`);
  const driver = object(item.driver, `${label}.driver`);
  exactKeys(driver, ["package", "target", "path"], `${label}.driver`);
  requireCondition(typeof driver.package === "string" && /^[a-z][a-z0-9-]*$/u.test(driver.package) && typeof driver.target === "string" && identifier.test(driver.target)
    && driver.path === `crates/${driver.package}/tests/${driver.target}.rs`, `${label} requires an exact integration-test driver`);
  requireCondition(tab.sourceDigestScope === "displayed" && Array.isArray(tab.sourceFragments) && tab.sourceFragments.length > 0, `${label} requires exact displayed fragments`);
  const ranges = array(item.sourceRanges, `${label}.sourceRanges`, 64);
  requireCondition(ranges.length === tab.sourceFragments.length, `${label} fragment range coverage differs`);
  const intervals: [number, number][] = [];
  for (const [index, value] of ranges.entries()) {
    const range = object(value, `${label}.sourceRanges[${index}]`);
    exactKeys(range, ["byteOffset", "byteLength"], `${label}.sourceRanges[${index}]`);
    boundedInteger(range.byteOffset, 0, 4 * 1024 * 1024, "byteOffset");
    boundedInteger(range.byteLength, 1, 4 * 1024 * 1024 - range.byteOffset, "byteLength");
    requireCondition(Buffer.byteLength(tab.sourceFragments[index]) === range.byteLength, `${label} fragment byte length differs`);
    const offset = range.byteOffset;
    const end = offset + range.byteLength;
    requireCondition(intervals.every(([start, stop]) => end <= start || offset >= stop), `${label} source ranges overlap`);
    intervals.push([offset, end]);
  }
  const cases = array(item.cases, `${label}.cases`, 256);
  requireCondition(cases.length > 0, `${label} requires source cases`);
  const symbols = new Set<string>();
  for (const value of cases) {
    const row = object(value, `${label} case`);
    exactKeys(row, ["features", "kernelSymbol", "target", "displayedFragmentOrdinal", "testFunction", "expectation"], `${label} case`);
    const features = strings(row.features, `${label} features`);
    requireCondition(features.length <= 64 && new Set(features).size === features.length && isDeepStrictEqual(features, [...features].sort()), `${label} features must be sorted and unique`);
    requireCondition(typeof row.kernelSymbol === "string" && identifier.test(row.kernelSymbol) && !symbols.has(row.kernelSymbol), `${label} kernel symbols must be valid and unique`);
    symbols.add(row.kernelSymbol);
    requireCondition(row.target === "gfx942" || row.target === "gfx950", `${label} has an unsupported target`);
    boundedInteger(row.displayedFragmentOrdinal, 0, ranges.length - 1, "displayedFragmentOrdinal");
    requireCondition(typeof row.testFunction === "string" && identifier.test(row.testFunction), `${label} requires an exact test function`);
    const expectation = object(row.expectation, `${label} expectation`);
    requireCondition(expectation.kind === "verified-bundle-export" || expectation.kind === "rejected", `${label} has an unsupported expectation`);
    exactKeys(expectation, expectation.kind === "rejected" ? ["kind", "bundleVersion", "diagnosticContains", "outputArtifact"] : ["kind", "bundleVersion"], `${label} expectation`);
    boundedInteger(expectation.bundleVersion, 1, 6, "bundleVersion");
    if (expectation.kind === "rejected") {
      requireCondition(nonempty(expectation.diagnosticContains) && expectation.diagnosticContains.length <= 512 && expectation.outputArtifact === "absent", `${label} requires an exact refusal and absent artifact`);
    }
  }
  requireCondition(digest(item.contractSha256, 64) && item.contractSha256 === sourceItemContractSha256(lessonId, tab, ordinal, item), `${label} contract digest differs`);
  return tab.sourcePath;
}

export function validateCurriculumSourcePin(value: unknown): CurriculumSourcePin {
  const pin = object(value, "source pin");
  exactKeys(pin, ["commit", "tree", "path", "sha256"], "source pin");
  requireCondition(digest(pin.commit, 40) && digest(pin.tree, 40) && digest(pin.sha256, 64), "source pin requires exact commit, tree and blob SHA256");
  requireCondition(pin.path === "config/tutorial-kernel-manifest-v1.json", "source pin must reference the compiler-owned manifest");
  return { commit: pin.commit, tree: pin.tree, path: pin.path, sha256: pin.sha256 };
}

export function projectCurriculumTab(tab: CodeTab, ordinal: number) {
  const code = Buffer.from(authorFacingCode(tab).code, "utf8");
  return {
    ordinal,
    kind: tab.kind,
    label: tab.label,
    language: tab.language,
    displayedUtf8Bytes: code.length,
    displayedSha256: sha256(code),
    sourcePath: tab.sourcePath ?? null,
    sourceCommit: tab.sourceCommit ?? null,
    sourceSha256: tab.sourceSha256 ?? null,
    sourceDigestScope: tab.sourceDigestScope ?? null,
    sourceFragmentsSha256: tab.sourceFragments?.map((fragment) => sha256(fragment)) ?? null,
    explanatory: tab.explanatory ?? null,
    evidenceId: tab.evidenceId ?? null,
  };
}

export function validateCurriculumEvidence(bytes: Uint8Array, expectedSha256: string, lessons: readonly Lesson[]) {
  requireCondition(bytes.length <= 4 * 1024 * 1024, "manifest exceeds its byte bound");
  requireCondition(digest(expectedSha256, 64) && sha256(bytes) === expectedSha256, "manifest blob SHA256 differs from its pin");
  const manifest = object(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)), "manifest");
  requireCondition(manifest.schema === "fe2o3-tutorial-kernel-source-contract-v1", "unsupported compiler manifest schema");
  const curriculum = object(manifest.curriculum, "manifest.curriculum");
  exactKeys(curriculum, ["schema", "site", "status", "lessons"], "curriculum");
  const sourceItemsAllowed = curriculum.schema === sourceContractSchema;
  requireCondition((curriculum.schema === "fe2o3-tutorial-curriculum-obligations-v1" || sourceItemsAllowed) && curriculum.status === "pending", "curriculum must describe pending obligations, not qualification");
  const site = object(curriculum.site, "curriculum.site");
  exactKeys(site, ["repository", "commit", "tree"], "curriculum.site");
  requireCondition(site.repository === "harsh-nod/fe2o3-kernels" && digest(site.commit, 40) && digest(site.tree, 40), "curriculum requires an exact tutorial source snapshot");

  const sourceEntries = array(manifest.entries, "manifest.entries", 256).map((entry) => object(entry, "source entry"));
  const entries = sourceEntries.map((entry) => entry.lessonId);
  requireCondition(entries.every(nonempty) && new Set(entries).size === entries.length, "source entry IDs must be unique strings");
  const fixtures = array(manifest.compilerFixtures, "manifest.compilerFixtures", 256).map((fixture) => object(fixture, "compiler fixture"));
  const fixtureIds = fixtures.map((fixture) => fixture.fixtureId);
  requireCondition(fixtureIds.every(nonempty) && new Set(fixtureIds).size === fixtureIds.length, "compiler fixture IDs must be unique strings");
  const fixturePaths = new Map(fixtures.map((fixture) => [fixture.fixtureId, strings(object(fixture.compilerInput, "compiler input").sourcePaths, "compiler input paths")]));
  const entryPaths = new Map(sourceEntries.map((entry) => {
    const paths = new Set(strings(entry.sourcePaths, "entry source paths"));
    for (const id of strings(entry.compilerFixtureIds, "entry compiler fixture IDs")) {
      const sourcePaths = fixturePaths.get(id);
      requireCondition(sourcePaths, `source entry ${entry.lessonId} has an unknown compiler fixture`);
      sourcePaths.forEach((path) => paths.add(path));
    }
    return [entry.lessonId, paths];
  }));
  const retained = array(curriculum.lessons, "curriculum.lessons", 256).map((lesson) => object(lesson, "curriculum lesson"));
  const ids = lessons.map((lesson) => lesson.id);
  requireCondition(new Set(ids).size === ids.length && isDeepStrictEqual(retained.map((lesson) => lesson.lessonId), ids), "ordered lesson coverage differs from the compiler manifest");
  const associated = new Set<unknown>();
  let mixed = false;
  let codeTabs = 0;
  for (const [index, lesson] of lessons.entries()) {
    const binding = retained[index];
    const label = lesson.id;
    exactKeys(binding, ["lessonId", "role", "roleReason", "sourceEntryIds", "sourceBindingGap", "variants", "codeTabs"], label);
    requireCondition(binding.role === "executable" || binding.role === "conceptual", `${label} has an unknown lesson role`);
    requireCondition(nonempty(binding.roleReason), `${label} requires its role rationale`);
    const sourceIds = array(binding.sourceEntryIds, `${label}.sourceEntryIds`, 256);
    requireCondition(new Set(sourceIds).size === sourceIds.length && sourceIds.every((id) => typeof id === "string" && entries.includes(id)), `${label} has duplicate or unknown source entries`);
    sourceIds.forEach((id) => associated.add(id));
    requireCondition(!entries.includes(label) || (binding.role === "executable" && sourceIds.includes(label)), `${label} cannot detach its existing source entry`);
    const kernelPaths = new Set(lesson.tabs.flatMap((tab) => tab.kind === "kernel" && tab.language === "rust" && tab.sourcePath ? [tab.sourcePath] : []));
    const covered = new Set<string>();
    for (const id of sourceIds) {
      const paths = entryPaths.get(id)!;
      requireCondition(id === label || [...kernelPaths].some((path) => paths.has(path)), `${label} source entry ${id} is unrelated to its displayed kernel paths`);
      paths.forEach((path) => covered.add(path));
    }
    const tabs = array(binding.codeTabs, `${label}.codeTabs`, 64);
    requireCondition(tabs.length === lesson.tabs.length, `${label} code-tab coverage differs`);
    for (const [ordinal, tab] of lesson.tabs.entries()) {
      const retainedTab = object(tabs[ordinal], `${label} tab ${ordinal}`);
      const requiresItem = binding.role === "executable" && tab.kind === "kernel" && tab.language === "rust";
      let sourceItemStatus = requiresItem ? "pending" : "not-applicable";
      let sourceItem: unknown = null;
      if (sourceItemsAllowed && requiresItem && retainedTab.sourceItem !== null && retainedTab.sourceItem !== undefined) {
        covered.add(validateSourceItem(label, tab, ordinal, retainedTab.sourceItem));
        sourceItem = retainedTab.sourceItem;
        sourceItemStatus = "contract-bound";
      }
      const expected = { ...projectCurriculumTab(tab, ordinal), sourceItem, sourceItemStatus };
      requireCondition(isDeepStrictEqual(retainedTab, expected), `${label} tab ${ordinal} source/display binding differs`);
    }
    const missing = [...kernelPaths].filter((path) => !covered.has(path)).sort();
    const variants = array(binding.variants, `${label}.variants`, 3).map((variant) => object(variant, "variant"));
    for (const variant of variants) {
      exactKeys(variant, ["kind", "status", "sourceItems", "reason"], "variant");
      requireCondition(variant.status === "pending" && isDeepStrictEqual(variant.sourceItems, []) && nonempty(variant.reason), `${label} variants must remain pending source obligations`);
    }
    const kinds = variants.map((variant) => variant.kind);
    if (binding.role === "conceptual") {
      requireCondition(sourceIds.length === 0 && variants.length === 0 && binding.sourceBindingGap === null, `${label} conceptual content cannot claim runnable obligations`);
    } else {
      requireCondition(isDeepStrictEqual(kinds, ["simt", "tile"]) || isDeepStrictEqual(kinds, ["simt", "tile", "mixed"]), `${label} requires ordered SIMT/tile obligations`);
      const requiresGap = (sourceIds.length === 0 && covered.size === 0) || missing.length > 0;
      requireCondition(requiresGap ? nonempty(binding.sourceBindingGap) : binding.sourceBindingGap === null, `${label} must preserve its source-binding gap (unbound kernel paths: ${missing.join(", ") || "none"})`);
      mixed ||= kinds.includes("mixed");
    }
    codeTabs += tabs.length;
  }
  requireCondition(codeTabs <= 1024 && associated.size === entries.length && mixed, "curriculum must retain all source entries and a mixed showcase obligation");
  return { lessons: lessons.length, codeTabs, status: "pending" as const };
}
