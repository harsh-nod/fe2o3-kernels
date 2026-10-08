import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const prior = readFileSync("docs/saved-local-order-recipes-v1.md", "utf8");
const lesson = readFileSync("docs/source-local-order-report-outcomes-v1.md", "utf8");
const flat = lesson.replace(/\s+/g, " ");
const marker = "\n## Follow-on: JSON reports and changed-source outcomes\n";

describe("ordinary recipe reports and changed-source outcome tutorial", () => {
  it("preserves the complete historical lab and its dated measurements", () => {
    const at = prior.indexOf(marker);
    expect(at).toBeGreaterThan(0);
    expect(prior.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(prior.slice(0, at));
    expect(prefix.length).toBe(13960);
    expect(createHash("sha256").update(prefix).digest("hex")).toBe("8bb974c42916f8c888ef75d9f8683da8323f07d6372a7924f30dfc414ea23b8b");
    expect(prior.slice(at)).toContain("(source-local-order-report-outcomes-v1.md)");
  });

  it("teaches exact additive command grammar and whole result custody", () => {
    for (const text of [
      "create-json", "replay-json", "no general `--json` flag",
      "FE2O3_SOURCE_LOCAL_ORDER_REPORT_V1", "fe2o3-source-local-order-report-v1",
      "raw streams", "strict UTF-8", "result.status = \"accepted\"",
      "publication.status = \"completed\"", "all five instance axes",
      "digest-and-length", "Reread and hash", "recipe_returned", "llvm_returned",
      "evidence.source_sha256", "request.expected_current_source_sha256",
      "separate copy", "Do not modify the retained accepted output",
    ]) expect(flat).toContain(text);
    expect(lesson).toContain('-- "${rustc_argv[@]}"');
    expect(lesson).toContain("/ABSOLUTE_NEW_OUTPUT/");
  });

  it("keeps the two actual CLI refusal contracts distinct from arbitrary failures", () => {
    for (const text of [
      "nine ordinary example processes, seven accepted results and two",
      "designated refusals", "rebind-current", "exact-revision", "Refused, exit 1",
      "recipe_binding", "local-order recipe source revision changed",
      "compiler_fatal = false", "not_attempted", "not_honored",
      "local-order recipe exact canonical constraint not honored",
      "can preserve semantic graph hashes", "Never retry by silently switching",
    ]) expect(flat).toContain(text);
    expect(flat).toContain("28 driver attempts and 450");
    expect(flat).toContain("Keep those two evidence classes separate");
  });

  it("joins genuine Create bytes to ordinary and repeated changed-source outcomes", () => {
    for (const text of [
      "checked_rebind", "exact_revision_refusal", "FE2O3_RECIPE_NORMAL_V1",
      "FE2O3_RECIPE_OUTCOME_V1", "plus LF", "exact returned recipe byte array",
      "nested invocation stays", "RecipeBinding",
      "source_local_order_recipe_driver_v1::warm_series::outcome_series::actual_source_local_order_recipe_outcome_series_v1",
      "Discover it in the actual qualified backend test ELF",
      "test child exits zero", "35 ordered calls", "5 calibration", "30 measured",
      "ranks 15, 29 and 30", "fresh transactions within one active frontend",
      "remove sample 6", "splice an ordinary oracle from the other workload",
    ]) expect(flat).toContain(text);
    expect(lesson).toContain("node scripts/recipe-outcome-series-v1.mjs");
    expect(flat).toContain("not files to synthesize");
  });

  it("never promotes historical metrics, null memory or a process timeout into acceptance", () => {
    for (const text of [
      "only for that older candidate", "the older positive-Replay timing",

      "non-transactional", "do not assume rollback",
      "execution_authenticated_by_report", "output_file_currentness_authenticated",
      "execution_authenticated = false", "budget_accepted = false",
      "retained_logical_bytes = null", "remain null, not zero",
      "not in-flight compiler cancellation", "does not complete U4",
      "performance SLO", "not execution authenticity",
    ]) expect(flat).toContain(text);
    expect(flat).toContain("not current-main requalification");
    expect(flat).toContain("not a speedup for successful rebind");
    expect(lesson).not.toMatch(/FE2O3_PIN\s*=/);
  });

  it("pins the dated candidate observation without changing the curriculum baseline", () => {
    expect(lesson).toContain("d6653c608210d84f8bde4d7c781492d01357d818");
    expect(lesson).toContain("2fc6f59808a2de903a9272aa58090e8050d22dc0eaeca2f3431d77837efd1653");
    expect(lesson).toContain("112036274cac35af53fcadfb9919918057c21a97215851074b272accefda830e");
    expect(flat).toContain("neither checkpoint silently updates the site's global compiler pin");
    expect(flat).toContain("not a GPU benchmark");
  });

  it("scopes the completed seventy-call checkpoint to its original candidate and raw samples", () => {
    for (const text of [
      "2026-10-08 UTC", "six child processes: two Create, two ordinary outcomes and two series",
      "70 original consuming API calls in total", "5 calibration and 30 measured calls per workload",
      "All 35 outcomes in each series exactly matched its own ordinary oracle",
      "238-input byte identities", "ranks 15, 29 and 30",
      "ef4471d8a0f43b01ece6904acad4b063f04c430ae3f77d9b7038f95cf454d075",
      "743506c50331616c2448f9e7c7ec5371c695476f6c40a4ef3bd61e517dbda0ec",
      "f4acf224389c1843ab1a3504510c69fd256911fc859c55d4ce7ffeecc7c01429",
      "616c7e8e06f21cd604418e28357356dabca073ff9d3a6eb8296a3ee3147670e2",
      "The newer-main checkpoint below has separate build",
      "Do not relabel this checkpoint", "do not measure the tutorial's browser or content tests",
    ]) expect(flat).toContain(text);
    expect(lesson).toContain("| `checked_rebind` | 166372867 | 166581289 | 167012793 |");
    expect(lesson).toContain("| `exact_revision_refusal` | 15397677 | 15504636 | 15516243 |");
    expect(flat).toContain("Neither row measures cold load");
    expect(flat).toContain("an admitted compiler owner is not reused");
  });
  it("teaches the current commands without preserving publication scaffolding", () => {
    expect(lesson.startsWith("# Read recipe reports and debug changed source outcomes\n")).toBe(true);
    expect(flat).toContain("Use `create-json` and `replay-json`");
    expect(flat).toContain("record its revision with your own source and output evidence");
    expect(flat).not.toContain("root must bind");
    expect(flat).not.toContain("root's actual site validation");
  });

  it("keeps the newer-main actual checkpoint independent of historical samples", () => {
    for (const text of [
      "73dacccba6eebdd74e6b9b0ed92e76e338c58d51",
      "0e94deab4c89f7ae3b8296f0c7da5e6e1bc5f6b617fabf1cfa5e823746a3e843",
      "84eccde2ee6dceea35bbc977e54e6ed5e4595da46f8943f93bdc2cb351ff75d6",
      "b98d8167712940e6b6d3682d1f0cb58d7f7a71e6d5a5b962c1886b43702aa6f5",
      "9a63d4e394db83ad84a357dadb282fd6a29b0df0e9e74990a94caf233663d1cc",
      "0bd18808137c32c0446ee1b8a2c195804ff168f789a467ff95924ddb29965391",
      "5c84115acd592f677d79933e885e618dc0d44ac411a6781a259abd485ac0448e",
      "a395004a4f23f119dd89f0e838907ddcc4a9d8656079681f8a4188c9025b30f8",
      "Each table was recomputed from its own thirty retained samples",
      "not an arbitrary later checkout", "complete-owner memory and cancellation remain unmeasured",
      "Keep all failed attempts",
    ]) expect(flat).toContain(text);
    expect(lesson).toContain("| `checked_rebind` | 168237386 | 168552778 | 168646367 |");
    expect(lesson).toContain("| `exact_revision_refusal` | 15954744 | 16136026 | 16151498 |");
    expect(flat).toContain("nor the faster refusal is an optimization result");
  });

});
