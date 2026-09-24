import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import pending from "../docs/complete-body-v19-qualification-pending.json";
import ladder from "../docs/evidence/complete-body-source-v19-20260924/source-ladder-observation.json";
import native from "../docs/evidence/complete-body-source-v19-20260924/native-summary.json";
import sourceReceipt from "../docs/evidence/complete-body-source-v19-20260924/source-ladder-receipt.json";

const pages = [
  "docs/complete-body-source-v19.md",
  "docs/complete-body-debug-v19.md",
];
const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("complete-body V19 scoped command tutorials", () => {
  it("scopes qualified source and public commands without native or curriculum promotion", () => {
    for (const path of pages) {
      const text = read(path);
      expect(text).toContain("qualification retained.");
      expect(text).toContain("Native functional execution remains unqualified.");
      expect(text).toContain("complete-body-source-qualification-20260924.md");
      expect(text).toContain("non-evidence template");
      expect(text).toContain("complete-body-v19-qualification-pending.json");
      expect(text).not.toContain("frontend annotation");
      expect(text).toContain("FE2O3_PIN");
      expect(text).toContain("hardware");
    }
    const debug = read(pages[1]);
    expect(debug).toContain("not a new website viewer");
    expect(debug).toContain("existing JSONL protocol");
    expect(debug).toContain("V19 website adapter");
  });

  it("documents exact source profile and independent negative acceptance conditions", () => {
    const source = read(pages[0]);
    for (const text of [
      "gfx942:xnack-", "Wave64", "max_grid = [2, 1, 1]",
      "complete-body-source-v19.mjs one", "complete-body-source-v19.mjs diamond",
      "wrong-launch", "reserved-register", "foreign-input", "undefined-merge", "dynamic-grid",
      "384 CPU cases", "21 isolated", "Fifteen negative sessions",
      "Required and maximum both 128",
      "Generic failures, timeouts, crashes",
    ]) expect(source).toContain(text);
    expect(source).toContain("actual_complete_body_source_ladder");
    expect(source).toContain("compiler descriptor");
  });

  it("documents the real public debug command, typed selector and authority limits", () => {
    const debug = read(pages[1]);
    for (const text of [
      "complete-body-debug-source-v19.mjs one",
      "complete-body-debug-source-v19.mjs diamond",
      "FE2O3_EXTRACT_DIAGNOSTIC_KIR_PATH_V19",
      "--diagnostic-kir-v19", "--protocol jsonl --wave-width 64",
      "520 bytes", "512-byte LaunchEnvelope", "Diagnosis V2",
      "Physical VGPR/EXEC", "Source-variable", "persisted",
      "300-second", "16-MiB", "1-GiB/100,000-entry",
    ]) expect(debug).toContain(text);
    expect(debug).toContain("not compiler-closure");
    expect(debug).toContain("does not serialize the checked compiler owner");
  });

  it("resolves local documentation links without inventing a V19 display input", () => {
    for (const path of pages) {
      const links = [...read(path).matchAll(/\]\(([^)\s]+)\)/gu)].map(match => match[1]);
      expect(links.length).toBeGreaterThan(3);
      for (const target of links) {
        if (target.startsWith("https://") || target.startsWith("#")) continue;
        expect(existsSync(resolve(dirname(path), target.split("#")[0]))).toBe(true);
        expect(target).not.toContain("examples/ordered_program_observation_v1.json");
      }
    }
  });

  it("keeps every observed result unset in the explicitly non-evidence checklist", () => {
    expect(pending.kind).toBe("pending_non_evidence_template");
    expect(pending.status).toBe("pending");
    expect(pending.compiler_commit).toBeNull();
    expect(pending.compiler_tree).toBeNull();
    expect(pending.rustc_version_output_sha256).toBeNull();
    expect(pending.source_file_pins).toEqual([]);
    expect(pending.binary_pins).toEqual([]);
    expect(pending.source_ladder.status).toBe("pending");
    for (const [key, value] of Object.entries(pending.source_ladder)) {
      if (key !== "status") expect(value).toBeNull();
    }
    expect(Object.values(pending.public_source_commands)).toEqual([null, null]);
    expect(Object.values(pending.public_debug_commands)).toEqual([null, null]);
    for (const [key, value] of Object.entries(pending.boundaries)) {
      expect(value).toBe(key === "compiler_closure_attestation" ? "unavailable" : false);
    }
    expect(pending.intended_assertions.debug_output_bytes).toBe(520);
    expect(pending.intended_assertions.source_ladder_sessions).toBe(21);
    expect(pending.publication_instructions).toContain("separate dated qualification");
    expect(pending.publication_instructions).toContain("never use placeholder hashes");
  });

  it("preserves the separate metadata and native-fixture evidence boundaries", () => {
    const packing = read("docs/complete-body-const-builder-v1.md");
    const native = read("docs/complete-body-native-abi-v1.md");
    expect(packing).toContain("not itself an admitted complete-body source kernel");
    expect(packing).toContain("complete-body-source-v19.md");
    expect(native).toContain("complete-body-debug-v19.md");
    expect(native).toContain("352 negative checks without GPU execution");
    expect(native).toContain("not the authenticated whole-body source route");
  });
  it("pins the original ladder bytes and explicitly documented final-LF copy", () => {
    const bytes = readFileSync(resolve("docs/evidence/complete-body-source-v19-20260924/source-ladder-observation.json"));
    expect(bytes.length).toBe(77984);
    expect(bytes.at(-1)).toBe(10);
    expect(createHash("sha256").update(bytes.subarray(0, -1)).digest("hex")).toBe(
      "33eaf977a1b04ef2864a0d0d7fb11f96ad009f6982c54a1d4548111923daa17b",
    );
    const receipt = readFileSync(resolve("docs/evidence/complete-body-source-v19-20260924/source-ladder-receipt.json"));
    expect(receipt.length).toBe(21623);
    expect(createHash("sha256").update(receipt).digest("hex")).toBe(
      "209cfe79d19ef1ddffefe5147119687d3cf198f19c23b61c7c5948ac3de8cbe9",
    );
  });

  it("checks all actual source sessions and same-source public-driver byte relations", () => {
    expect(ladder.schema).toBe("fe2o3-test-source-complete-body-ladder-v19");
    expect(ladder.observations).toHaveLength(21);
    expect(ladder.cpu_positive_cases).toBe(384);
    expect(ladder.exact_negative_runs).toBe(15);
    expect(ladder.public_driver_output_relation).toBe("exact_bytes_same_current_source");
    for (const feature of ["complete-body-one-v19", "complete-body-diamond-v19"]) {
      const rows = ladder.observations.filter(row => row.feature === feature);
      expect(rows.map(row => row.mode)).toEqual(["observe", "llvm", "handoff"]);
      const observed = rows[0].observation;
      expect(observed.cpu_cases).toBe(192);
      expect(observed.canaries_unchanged).toBe(true);
      expect(observed.normal_checked_continuation).toBe(true);
      expect(observed.normal_worker_preparation).toBe(true);
      expect(observed.same_owner_source_canonical_descriptor_entry).toBe(true);
      expect(observed.cpu_grid_sizes).toEqual([64, 128]);
      expect(observed.cpu_selectors).toEqual([0, 1, 4294967295]);
      expect(observed.cpu_tail_lengths).toEqual([0, 1, 63, 64, 65, 127, 128, 129]);
      expect(rows[1].observation.sha256).toBe(observed.canonical_llvm_sha256);
      expect(rows[2].observation.sha256).toBe(observed.handoff_sha256);
      expect(observed.canonical_bytes_sha256).not.toBe(observed.canonical_v19_identity);
    }
    for (const row of ladder.observations) {
      expect(row.actual_rustc_callback).toBe(true);
      expect(row.source_unchanged).toBe(true);
      expect(row.invocation.source_sha256).toBe("3fb330e7193918e3e587445fdc82fd5d5dd3ca664063fbc9781664a67f2bb26c");
      expect(row.invocation.args).toContain("-Copt-level=3");
      expect(row.invocation.args).toContain("-Coverflow-checks=on");
      for (const value of [
        row.hardware_observed, row.native_llvm_executed,
        row.protected_finalizer_admitted, row.grants_artifact_or_launch_authority,
      ]) expect(value).toBe(false);
    }
  });

  it("keeps all five exact refusals distinct from generic compiler failures", () => {
    for (const [feature, diagnostic] of [
      ["wrong-launch", "complete body requires required and maximum 64x1x1"],
      ["reserved-register", "complete body roles require distinct v8..v63 outside the reserved prefix"],
      ["foreign-input", "complete body marker operands differ from exact root argument order"],
      ["undefined-merge", "OutputNotDefined { label: Gfx942CompleteBodyLabelV1(4) }"],
      ["dynamic-grid", "complete-body source requires an explicit finite max_grid"],
    ]) {
      const rows = ladder.observations.filter(row => row.feature === `complete-body-${feature}-v19`);
      expect(rows.map(row => row.mode)).toEqual(["observe", "llvm", "handoff"]);
      for (const row of rows) {
        expect(row.observation.stage).toBe("exact_source_profile_refused");
        expect(row.observation.diagnostic).toContain(diagnostic);
      }
    }
  });

  it("keeps command observation separate from portable authority and later qualification", () => {
    expect(sourceReceipt.status).toBe("command-passed");
    expect(sourceReceipt.command.code).toBe(0);
    expect(sourceReceipt.command.signal).toBeNull();
    expect(sourceReceipt.errors).toEqual([]);
    expect(sourceReceipt.source_before).toEqual(sourceReceipt.source_after);
    expect(sourceReceipt.source_before).toEqual({
      files: 7208, bytes: 107560580,
      sha256: "217a30aed5f579381a9461007bf1f6cf729ab146cab7918f27538e01d245fee2",
    });
    expect(sourceReceipt.source_authenticated).toBe(false);
    expect(sourceReceipt.production_qualified).toBe(false);
    expect(sourceReceipt.observation_limits.descendant_quiescence_proved).toBe(false);
    expect(sourceReceipt.observation_limits.transitive_build_attestation).toBe(false);
    const note = read("docs/complete-body-source-qualification-20260924.md");
    expect(note).toContain("76fe660d9ef27961ec764c5cec1b7b79e6321a33");
    for (const text of [
      "21 isolated compiler sessions", "384 CPU cases", "15 exact negative sessions",
      "one final LF", "HEAD alone is not asserted", "published implementation commit",
      "required and maximum are both 128", "512", "r1–r6",
      "no functional execution", "not compiler", "not serialize compiler authority",
      "non-evidence template", "Site content/type/lint/test/build gates",
    ]) expect(note).toContain(text);
  });

  it("joins four actual-source canonical-prefix native cases without native execution authority", () => {
    const bytes = readFileSync(resolve("docs/evidence/complete-body-source-v19-20260924/native-summary.json"));
    expect(bytes.length).toBe(5155);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      "f7a23e988f29451f9e173ec87c9e8cde018a7a4d6ab6c0c3ddc990d77eb51a0e",
    );
    expect(native.status).toBe("passed");
    expect(native.native_calls).toBe(4);
    expect(native.rows.map(row => [row.entry, row.level])).toEqual([
      ["assembly_one", "O0"], ["assembly_one", "O3"],
      ["assembly_diamond", "O0"], ["assembly_diamond", "O3"],
    ]);
    expect([native.negative_checks, native.entry_syntax_cases, native.entry_relation_cases]).toEqual([138, 64, 12]);
    expect(native.rows.reduce((total, row) => total + Object.values(row.counts).reduce((n, count) => n + count, 0), 0)).toBe(138);
    expect(native.native_compilation).toBe(true);
    for (const row of native.rows) {
      const source = ladder.observations.find(item => item.feature === row.feature && item.mode === "observe");
      expect(source).toBeDefined();
      expect(row.llvm_sha256).toBe(source?.observation.canonical_llvm_sha256);
      expect(row.retained_source_entry_join).toBe(true);
      expect(row.entry_join_basis).toContain("not portable source authority");
      expect([row.selector.kernarg_byte_offset, row.selector.destination_sgpr, row.selector.load_ready]).toEqual([28, 22, true]);
    }
    for (const value of [
      native.native_functional_execution, native.hardware_execution,
      native.source_authentication_granted_by_harness, native.protected_finalizer_admission,
    ]) expect(value).toBe(false);
    expect(native.compiled_scope).toContain("unchanged canonical executable LLVM prefix");
    const note = read("docs/complete-body-source-qualification-20260924.md");
    expect(note).toContain("descriptor-bearing worker LLVM was not the input");
    expect(note).toContain("45fa03e647fe675917756601e04673dd66e34cc390379a17cd8134412949bc13");
  });

});
