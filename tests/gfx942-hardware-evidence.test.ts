import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import manifestDocument from "../config/tutorial-kernel-manifest-v1.json";
import { tutorialCorpusContractSha256 } from "../scripts/tutorial-corpus-contract.mjs";

const validator = resolve("scripts/validate-tutorial-gfx942-hardware-evidence.mjs");
const manifestPath = resolve("config/tutorial-kernel-manifest-v1.json");

function sha256(bytes: Buffer | string) {
  return createHash("sha256").update(bytes).digest("hex");
}

function write(root: string, path: string, bytes: Buffer | string) {
  const absolute = resolve(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, bytes);
  return absolute;
}

function fileRecord(root: string, path: string) {
  const bytes = readFileSync(resolve(root, path));
  return { path, sha256: sha256(bytes), bytes: bytes.length };
}

function gfx942Cases() {
  return manifestDocument.compilerFixtures
    .filter((fixture) => fixture.target === "gfx942" && fixture.matrix !== null)
    .map((fixture) => ({
      fixtureId: fixture.fixtureId,
      testId: fixture.testId,
      ...fixture.matrix!,
    }));
}

function resourceFields() {
  return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, "na", 1, 0, 1];
}

function resource() {
  return {
    allocatedSgprDwordsPerWave: 0,
    allocatedVgprDwordsPerLane: 0,
    estimatedWavesPerEu: 1,
    ldsLimitedWavesPerEu: null,
    livenessValues: 0,
    livenessWork: 0,
    occupancyComplete: false,
    peakSgprDwordsPerWave: 0,
    peakSgprFunction: 0,
    peakVgprDwordsPerLane: 0,
    peakVgprFunction: 0,
    requiredSgprSpillDwordsPerWave: 0,
    requiredVgprSpillDwordsPerLane: 0,
    sgprLimitedWavesPerEu: 1,
    spillAdmissible: true,
    vgprLimitedWavesPerEu: 1,
  };
}

type Synthetic = {
  directory: string;
  evidence: SyntheticEvidence;
  evidencePath: string;
};

type FileRecord = { path: string; sha256: string; bytes: number };

type SyntheticEvidence = {
  target: { profile: string; [key: string]: unknown };
  manifest: { corpusContractSha256: string; [key: string]: unknown };
  cases: Array<{
    fixtureId: string;
    artifacts: { hsaco: FileRecord; [key: string]: unknown };
    [key: string]: unknown;
  }>;
  records: { commands: FileRecord; [key: string]: unknown };
  [key: string]: unknown;
};

function syntheticEvidence(): Synthetic {
  const directory = mkdtempSync(resolve(tmpdir(), "fe2o3-gfx942-evidence-"));
  const cases = gfx942Cases();
  const compilerCommit = "a".repeat(40);
  const compilerTree = "b".repeat(40);
  write(directory, "logs/build-extractor.log", "extractor build PASS\n");
  write(directory, "logs/build-inspector.log", "inspector build PASS\n");
  const rocminfo = "  Name: gfx942\n";
  write(directory, "rocminfo.txt", rocminfo);

  const evidenceCases = cases.map((item, ordinal) => {
    const prefix = `artifacts/${item.caseId}`;
    const llvmPath = `${prefix}/${item.caseId}.ll`;
    const hsacoPath = `${prefix}/${item.artifactName}`;
    const inspectionPath = `${llvmPath}.fe2o3-compiler-inspection-v2`;
    write(directory, llvmPath, `; synthetic LLVM IR for ${item.caseId}\n`);
    write(directory, hsacoPath, `synthetic HSACO for ${item.caseId}\n`);
    write(directory, inspectionPath, Buffer.from(`F2KIRP02synthetic-${item.caseId}`, "ascii"));
    const inspection = fileRecord(directory, inspectionPath);
    const targetKir = sha256(`target-kir-${item.caseId}`);
    const summary = [
      4, 2, 2, 12, 1, 1, 1, inspection.bytes, 9, 7, 0, 0, 0, 0,
      inspection.sha256, targetKir, targetKir, 3, 8, 16,
      ...resourceFields(), ...resourceFields(),
    ].join("\t") + "\n";
    write(directory, `${prefix}/inspection-summary.tsv`, summary);
    write(directory, `${prefix}/resource-summary.tsv`, "0\t0\t0\t0\t0\t0\t0\t64\t64\tna\tna\n");
    write(directory, `logs/${item.caseId}.log`, `PASS hardware execution ${item.caseId}\n`);
    return {
      artifacts: {
        compilerInspection: inspection,
        hsaco: fileRecord(directory, hsacoPath),
        llvmIr: fileRecord(directory, llvmPath),
      },
      caseId: item.caseId,
      fixtureId: item.fixtureId,
      observations: {
        compilerModel: {
          amdCostModelRevision: 2,
          amdPolicyVersion: 2,
          canonicalKirVersion: 12,
          hardwareObserved: false,
          inputResources: resource(),
          inspectionRecordSha256: inspection.sha256,
          kind: "compiler-resource-model",
          neutralPolicyVersion: 4,
          outputResources: resource(),
          record: fileRecord(directory, `${prefix}/inspection-summary.tsv`),
          resourceModelRevision: 3,
          sgprAllocationGranuleDwordsPerWave: 16,
          summaryFieldCount: 52,
          targetKirSha256: targetKir,
          verifiedTargetKirSha256: targetKir,
          vgprAllocationGranuleDwordsPerLane: 8,
        },
        hardwareExecution: {
          compileOnly: false,
          hardwareObserved: true,
          hostLog: fileRecord(directory, `logs/${item.caseId}.log`),
          kind: "hardware-execution",
          status: "PASS",
        },
        hsacoMetadata: {
          agprCount: 0,
          groupSegmentFixedBytes: 0,
          hardwareObserved: false,
          kind: "hsaco-metadata",
          maxFlatWorkgroupSize: 64,
          maximumWavesPerEu: null,
          minimumWavesPerEu: null,
          privateSegmentFixedBytes: 0,
          record: fileRecord(directory, `${prefix}/resource-summary.tsv`),
          sgprCount: 0,
          sgprSpillCount: 0,
          vgprCount: 0,
          vgprSpillCount: 0,
          wavefrontSize: 64,
        },
      },
      ordinal,
      status: "PASS",
      testId: item.testId,
    };
  });

  const build = (packageName: string, binary: string) =>
    `env CARGO_TARGET_DIR=/compiler/cargo-target rustup run nightly-2026-04-03 cargo build --locked --manifest-path /compiler/Cargo.toml -p ${packageName} --bin ${binary}`;
  const commandLines = [
    build("rustc-codegen-fe2o3", "fe2o3-rustc-extract"),
    build("cargo-fe2o3", "cargo-fe2o3"),
    ...cases.map((item) => {
      const assignments = [
        "CARGO_TARGET_DIR=/compiler/cargo-target",
        "FE2O3_EXAMPLE_COMPILE_ONLY=0",
        "FE2O3_EXAMPLE_RETAIN_COMPILER_OUTPUT=1",
        "FE2O3_ROOT_TARGET_DIR=/compiler/cargo-target",
        "FE2O3_RUSTC_EXTRACTOR=/compiler/cargo-target/debug/fe2o3-rustc-extract",
        `FE2O3_OUTPUT_DIR=/compiler/cases/${item.caseId}/output`,
        `TMPDIR=/compiler/cases/${item.caseId}/tmp`,
        ...item.environment,
      ];
      return `env ${assignments.join(" ")} bash /compiler/${item.runnerPath}${item.runnerArguments.length ? ` ${item.runnerArguments.join(" ")}` : ""}`;
    }),
  ];
  write(directory, "commands.txt", `${commandLines.join("\n")}\n`);
  write(directory, "results.tsv", `${evidenceCases.map((item) => [
    item.fixtureId, item.testId, item.caseId, "PASS", item.artifacts.hsaco.sha256,
    item.artifacts.llvmIr.sha256, item.artifacts.compilerInspection.sha256,
  ].join("\t")).join("\n")}\n`);
  const identity = [
    ["schema", "fe2o3-tutorial-gfx942-hardware-evidence-v1"],
    ["compiler_commit", compilerCommit], ["compiler_tree", compilerTree], ["target", "gfx942:xnack-"],
    ["hardware_observed", "true"], ["toolchain", "nightly-2026-04-03"], ["rustc", "synthetic-rustc"],
    ["cargo", "synthetic-cargo"], ["rocminfo_sha256", sha256(rocminfo)], ["kernel_count", String(cases.length)],
  ].map(([key, value]) => `${key}=${value}`).join("\n") + "\n";
  write(directory, "identity.txt", identity);
  const manifestBytes = readFileSync(manifestPath);
  const evidence: SyntheticEvidence = {
    authority: { compilerAuthority: false, launchAuthority: false, loadAuthority: false, publicationAuthority: false },
    cases: evidenceCases,
    compiler: { commit: compilerCommit, tree: compilerTree },
    manifest: {
      bytes: manifestBytes.length,
      caseCount: cases.length,
      corpusContractSha256: tutorialCorpusContractSha256(manifestDocument),
      schema: manifestDocument.schema,
      sha256: sha256(manifestBytes),
    },
    productionContract: manifestDocument.productionContract,
    records: {
      buildLogs: [fileRecord(directory, "logs/build-extractor.log"), fileRecord(directory, "logs/build-inspector.log")],
      commands: fileRecord(directory, "commands.txt"),
      identity: fileRecord(directory, "identity.txt"),
      results: fileRecord(directory, "results.tsv"),
      rocminfo: fileRecord(directory, "rocminfo.txt"),
    },
    roadmapIssue: manifestDocument.roadmapIssue,
    schema: "fe2o3-tutorial-gfx942-hardware-evidence-v1",
    target: { hardwareObserved: true, processor: "gfx942", profile: "gfx942:xnack-", xnack: "disabled" },
  };
  const evidencePath = resolve(directory, "evidence.json");
  return { directory, evidence, evidencePath };
}

function runSynthetic(mutate?: (value: Synthetic) => void) {
  const value = syntheticEvidence();
  try {
    mutate?.(value);
    writeFileSync(value.evidencePath, `${JSON.stringify(value.evidence, null, 2)}\n`);
    return spawnSync(process.execPath, [validator, "--manifest", manifestPath, "--evidence", value.evidencePath, "--artifact-root", value.directory], { encoding: "utf8" });
  } finally {
    rmSync(value.directory, { force: true, recursive: true });
  }
}

describe("gfx942 hardware evidence trust boundary", () => {
  it("accepts a complete internally bound synthetic fixture", () => {
    const result = runSynthetic();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("9 cases");
  });

  it.each([
    ["target", (value: Synthetic) => { value.evidence.target.profile = "gfx950:xnack-"; }, "required constant"],
    ["corpus", (value: Synthetic) => { value.evidence.manifest.corpusContractSha256 = "0".repeat(64); }, "stable corpus contract"],
    ["fixture", (value: Synthetic) => { value.evidence.cases[0].fixtureId = "hostile-fixture"; }, "manifest matrix"],
  ])("rejects a %s mismatch", (_label, mutate, message) => {
    const result = runSynthetic(mutate);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(message);
  });

  it("rejects a semantically changed command even when its file record is resealed", () => {
    const result = runSynthetic((value) => {
      const commandPath = resolve(value.directory, "commands.txt");
      const changed = readFileSync(commandPath, "utf8").replace("/examples/fill/run-gfx942.sh", "/examples/fill/other.sh");
      writeFileSync(commandPath, changed);
      value.evidence.records.commands = fileRecord(value.directory, "commands.txt");
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("runner or arguments differ");
  });

  it("rejects retained artifact-byte drift", () => {
    const result = runSynthetic((value) => {
      writeFileSync(resolve(value.directory, value.evidence.cases[0].artifacts.hsaco.path), "substituted HSACO\n");
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("bytes do not match");
  });
});
