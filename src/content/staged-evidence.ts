import {
  stagedReference,
  type Claim,
  type EvidenceKind,
  type StagedEvidenceAuthority,
  type StagedEvidenceId,
  type StagedEvidenceReference,
} from "./model";
import { deepFreeze, hasOwn, type DeepReadonly } from "./registry";

export interface StagedEvidenceAssertion {
  id: string;
  text: string;
}

export interface StagedEvidenceRecord {
  id: StagedEvidenceId;
  stageLabel: string;
  claimLabel: string;
  claim: EvidenceKind;
  authority: StagedEvidenceAuthority;
  commit: string;
  tree: string;
  commands: readonly string[];
  sourcePaths: readonly string[];
  target: string;
  assertions: readonly StagedEvidenceAssertion[];
}

export const stagedEvidenceOrder = deepFreeze([
  "tiled-source-bridge-v1",
  "tiled-cargo-metadata-v1",
  "tiled-cargo-root-v1",
  "tiled-hardware-harness-v1",
  "tiled-structural-admission-v1",
] satisfies StagedEvidenceId[]);

const stagedEvidenceRecords = deepFreeze({
  "tiled-source-bridge-v1": {
    id: "tiled-source-bridge-v1",
    stageLabel: "fb75e19a source bridge",
    claimLabel: "Staged tiled source bridge",
    claim: "compiler-hsaco-observed",
    authority: "source-admission-only",
    commit: "fb75e19a73ec0a9acebb203bd9821190b0592c82",
    tree: "0a57b2b6d14121da92dbbb2d7c4f9d8b4df4ce63",
    commands: ["cargo test -p rustc-codegen-fe2o3 --lib"],
    sourcePaths: [
      "crates/rustc-codegen-fe2o3/src/collected_tiled_gemm_v1.rs",
      "crates/rustc-codegen-fe2o3/src/kernel_ir_lowering.rs",
      "crates/rustc-codegen-fe2o3/tests/fixtures/collected-tiled-gemm-v1/src/lib.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "collected-root",
        text: "Commit fb75e19a73ec0a9acebb203bd9821190b0592c82 admits one exact collected Rust root with signature A:&[u16], B:&[u16], C:&[f32], D:DisjointSlice<f32>.",
      },
      {
        id: "source-profile",
        text: "It binds exact layouts, rustc FnAbi, portable-MIR identity, compiler profile, gfx942:xnack-, COV6, WG64, zero LDS, and the 64-byte explicit plus 256-byte implicit four-slice ABI.",
      },
      {
        id: "canonical-module",
        text: "A private single-use receipt selects the canonical direct-global Kernel IR module with eight BF16 loads, four f32 loads, one BF16 MFMA, and four f32 stores; AMDGCN lowering represents the BF16 carriers with i16 loads.",
      },
      {
        id: "fragment-separation",
        text: "The older WG64 32-byte explicit and 288-byte total fragment probe remains separate.",
      },
      {
        id: "source-authority-boundary",
        text: "This source-to-canonical lowering is reviewed correspondence, not a compiler refinement proof. The Worker V2 handoff remains inert and grants no final-HSACO, publication, loading, or launch authority.",
      },
    ],
  },
  "tiled-cargo-metadata-v1": {
    id: "tiled-cargo-metadata-v1",
    stageLabel: "b904f5b6 Cargo metadata normalization",
    claimLabel: "Staged Cargo metadata normalization",
    claim: "compiler-hsaco-observed",
    authority: "source-admission-only",
    commit: "b904f5b648c7eb249d32d73db427abe72970315a",
    tree: "a5b07af23c9fcf5f04ddcad1c18a6318469e6e06",
    commands: ["cargo test -p rustc-codegen-fe2o3 --lib"],
    sourcePaths: [
      "crates/rustc-codegen-fe2o3/src/collected_tiled_gemm_v1.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "metadata-normalization",
        text: "Commit b904f5b648c7eb249d32d73db427abe72970315a normalizes Cargo-generated metadata only inside the compiler-semantic commitment.",
      },
      {
        id: "wrapper-exact-observation",
        text: "The private receipt carries that normalized compiler-semantic commitment; it does not carry normalized metadata as a separate receipt field. The managed cargo-fe2o3 wrapper separately binds the full ordered rustc argv and exact metadata observations.",
      },
    ],
  },
  "tiled-cargo-root-v1": {
    id: "tiled-cargo-root-v1",
    stageLabel: "51bd129c Cargo root normalization",
    claimLabel: "Staged Cargo root normalization",
    claim: "compiler-hsaco-observed",
    authority: "source-admission-only",
    commit: "51bd129c31b08b636545f12229f34aaa431321f2",
    tree: "8be992dee9f145c73f61bb05f0066656298a7c75",
    commands: ["cargo test -p rustc-codegen-fe2o3 --lib"],
    sourcePaths: [
      "crates/rustc-codegen-fe2o3/src/collected_tiled_gemm_v1.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "root-normalization",
        text: "Commit 51bd129c31b08b636545f12229f34aaa431321f2 normalizes only the Cargo-generated root shape in the compiler semantic commitment.",
      },
      {
        id: "root-authority-binding",
        text: "The full observed root is stored in the private receipt and length-framed into its authority commitment.",
      },
    ],
  },
  "tiled-hardware-harness-v1": {
    id: "tiled-hardware-harness-v1",
    stageLabel: "b825661a gfx942 hardware harness",
    claimLabel: "Staged tiled hardware harness",
    claim: "compiler-hsaco-observed",
    authority: "harness-only",
    commit: "b825661ac3f7e332d2cc9723ed1efbb54869fa33",
    tree: "ea96ff13212e02390c881b74e2ea47aaf3018f1b",
    commands: [
      "cargo test -p fe2o3-hsa-runtime --test tiled_gemm_v1_hardware",
    ],
    sourcePaths: [
      "crates/fe2o3-hsa-runtime/tests/tiled_gemm_v1_hardware.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "harness-inputs",
        text: "Commit b825661ac3f7e332d2cc9723ed1efbb54869fa33 adds an ignored, opt-in one-tile gfx942:xnack- harness for externally supplied digest-pinned bytes and a digest-pinned observed LLVM 22 objdump.",
      },
      {
        id: "harness-static-gates",
        text: "Before dispatch it enforces COV6/WG64/320-byte metadata, one bound entry, exact disassembly coverage, one retained v_mfma_f32_16x16x16_bf16, a global store, and rejection of forbidden control and memory forms.",
      },
      {
        id: "harness-runtime-checks",
        text: "If explicitly run, it checks a bitwise dyadic 16x16 oracle, that A/B/C inputs remained bitwise unchanged, adjacent canaries, synchronous completion, exact executable identity, and terminal unload.",
      },
      {
        id: "harness-authority-boundary",
        text: "The commit contains no hardware run receipt, so exact hardware execution remains uncommitted and non-authoritative; the harness bypasses production prerequisite authentication, does not authenticate the artifact producer or full objdump runtime, and grants no compiler, publication, loading, launch, verification, or GPU-observation authority.",
      },
    ],
  },
  "tiled-structural-admission-v1": {
    id: "tiled-structural-admission-v1",
    stageLabel: "d43f11c8 structural admission",
    claimLabel: "Staged tiled structural admission",
    claim: "compiler-hsaco-observed",
    authority: "structural-admission-only",
    commit: "d43f11c86196e4f01c9ee305ea8d19f6d8c17672",
    tree: "1396be8ff4947a16ddc6aabae7390cc376992c61",
    commands: [
      "cargo test -p fe2o3-kernel-descriptor --test tiled_gemm_v1",
      "cargo test -p fe2o3-hsaco-finalize --test worker_v2_hsaco_admission",
      "cargo test -p fe2o3-hsaco-finalize --test worker_v2_hsaco_finalization",
    ],
    sourcePaths: [
      "crates/fe2o3-kernel-descriptor/tests/tiled_gemm_v1.rs",
      "crates/fe2o3-hsaco-finalize/tests/worker_v2_hsaco_admission.rs",
      "crates/fe2o3-hsaco-finalize/tests/worker_v2_hsaco_finalization.rs",
      "crates/fe2o3-kernel-descriptor/src/tiled_gemm_v1.rs",
      "crates/fe2o3-hsaco-finalize/src/tiled_gemm_v1_artifact.rs",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "structural-profile",
        text: "Commit d43f11c86196e4f01c9ee305ea8d19f6d8c17672 adds sealed Worker V2 structural inspection and canonical finalization for exactly one gfx942:xnack- COV6 tiled_gemm_v1 descriptor with four slices in 64 explicit bytes, a 256-byte implicit suffix, WG64, wave64, and zero LDS.",
      },
      {
        id: "structural-rejections",
        text: "It separately rejects the WG64/288-byte fragment probe, independent WG256 and 384-byte structural mutations, and descriptor, target, capability, and finalization drift.",
      },
      {
        id: "structural-body-boundary",
        text: "Adversarial tests deliberately admit arbitrary .text, so this gate does not inspect machine-body semantics, authenticate compiler origin, prove BF16 or MFMA semantics, or prove Verus results.",
      },
      {
        id: "structural-authority-boundary",
        text: "It grants no publication, loading, or launch authority; the capability schema remains V1, unknown tag 12 is rejected, and no COMGR path is added.",
      },
    ],
  },
} satisfies Record<StagedEvidenceId, StagedEvidenceRecord>);

export function isStagedEvidenceId(value: unknown): value is StagedEvidenceId {
  return (
    typeof value === "string" &&
    hasOwn(stagedEvidenceRecords, value)
  );
}

export function resolveStagedEvidenceRecord(
  value: unknown,
): DeepReadonly<StagedEvidenceRecord> | undefined {
  return isStagedEvidenceId(value) ? stagedEvidenceRecords[value] : undefined;
}

export function stagedEvidenceRecord(
  id: StagedEvidenceId,
): DeepReadonly<StagedEvidenceRecord> {
  const record = resolveStagedEvidenceRecord(id);
  if (!record) throw new Error("Canonical staged evidence registry failure");
  return record;
}

export function stagedEvidenceDetail(
  ids: readonly StagedEvidenceId[],
): string {
  return ids
    .flatMap((id) => stagedEvidenceRecord(id).assertions)
    .map((assertion) => assertion.text)
    .join(" ");
}

export function stagedEvidenceRows(
  ids: readonly StagedEvidenceId[],
): string[][] {
  return ids.map((id) => {
    const record = stagedEvidenceRecord(id);
    return [record.stageLabel, stagedEvidenceDetail([id]), record.authority];
  });
}

export function stagedEvidenceReference(
  id: StagedEvidenceId,
): StagedEvidenceReference {
  const record = stagedEvidenceRecord(id);
  return stagedReference({
    evidenceId: id,
    claim: record.claim,
    authority: record.authority,
    commit: record.commit,
    tree: record.tree,
    commands: [...record.commands],
    sourcePaths: [...record.sourcePaths],
    target: record.target,
  });
}

export function stagedEvidenceClaim(id: StagedEvidenceId): Claim {
  const record = stagedEvidenceRecord(id);
  return {
    kind: record.claim,
    label: record.claimLabel,
    detail: stagedEvidenceDetail([id]),
    reference: stagedEvidenceReference(id),
  };
}

export type ParsedCargoTestCommand =
  | { packageName: string; mode: "lib" }
  | { packageName: string; mode: "test"; targetName: string };

export function parseExactCargoTestCommand(
  command: string,
): ParsedCargoTestCommand | undefined {
  const tokens = command.trim().split(/\s+/u);
  if (
    tokens[0] !== "cargo" ||
    tokens[1] !== "test" ||
    tokens[2] !== "-p" ||
    !/^[a-z0-9][a-z0-9-]*$/u.test(tokens[3] ?? "")
  ) {
    return undefined;
  }
  if (tokens.length === 5 && tokens[4] === "--lib") {
    return { packageName: tokens[3], mode: "lib" };
  }
  if (
    tokens.length === 6 &&
    tokens[4] === "--test" &&
    /^[A-Za-z0-9_]+$/u.test(tokens[5] ?? "")
  ) {
    return {
      packageName: tokens[3],
      mode: "test",
      targetName: tokens[5],
    };
  }
  return undefined;
}

export function expectedCargoTestSourcePath(
  parsed: ParsedCargoTestCommand,
): string | undefined {
  if (parsed.mode === "lib") return undefined;
  return `crates/${parsed.packageName}/tests/${parsed.targetName}.rs`;
}

export function validateStagedEvidenceCatalog(): string[] {
  const issues: string[] = [];
  const assertionIds = new Set<string>();
  for (const id of stagedEvidenceOrder) {
    const record = stagedEvidenceRecord(id);
    if (record.id !== id) issues.push(`${id}: record id mismatch`);
    for (const command of record.commands) {
      const parsed = parseExactCargoTestCommand(command);
      if (!parsed) {
        issues.push(`${id}: command is not an exact Cargo test target: ${command}`);
        continue;
      }
      const expectedPath = expectedCargoTestSourcePath(parsed);
      if (expectedPath && !record.sourcePaths.includes(expectedPath)) {
        issues.push(`${id}: test target source is not referenced: ${expectedPath}`);
      }
    }
    for (const assertion of record.assertions) {
      const qualifiedId = `${id}/${assertion.id}`;
      if (assertionIds.has(qualifiedId)) {
        issues.push(`${id}: duplicate assertion id ${assertion.id}`);
      }
      assertionIds.add(qualifiedId);
      if (assertion.text.trim().length === 0) {
        issues.push(`${id}: empty assertion ${assertion.id}`);
      }
    }
  }
  return issues;
}
