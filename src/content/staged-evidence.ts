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

const TILED_GEMM_V1_HARDWARE_COMMAND =
  "env FE2O3_RUN_GFX942_TILED_GEMM_V1_HARDWARE=1 FE2O3_GFX942_TILED_GEMM_V1_HSACO=/home/harsh/fe2o3-tiled-gemm-f494.hsaco FE2O3_GFX942_TILED_GEMM_V1_SHA256=681077be1108c57d9d887f94afdd0ec3700ed2c86d73e66d2b229d6b418d0c66 FE2O3_GFX942_TILED_GEMM_V1_KERNEL_SYMBOL=tiled_gemm_v1 FE2O3_LLVM_OBJDUMP=/opt/rocm-7.2.4/lib/llvm/bin/llvm-objdump FE2O3_LLVM_OBJDUMP_SHA256=e5bf27bb6ba178b4de94ac0d5da760b628672cd00d2ffeb40a4372fa6ad25140 cargo test --locked -p fe2o3-hsa-runtime --features hardware-test-hooks --test tiled_gemm_v1_hardware gfx942_tiled_gemm_v1_one_tile_raw_hardware_evidence -- --ignored --exact --nocapture";

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
    stageLabel: "83fd4e41 MI300X tile observation",
    claimLabel: "Observed direct-global tiled GEMM tile",
    claim: "gpu-observed",
    authority: "harness-only",
    commit: "83fd4e4114a31da16ea3208c7b910269cd943bc8",
    tree: "4d5c2b4fd645b7183e6f85d0768687bc3b621d31",
    commands: [TILED_GEMM_V1_HARDWARE_COMMAND],
    sourcePaths: [
      "crates/fe2o3-hsa-runtime/tests/tiled_gemm_v1_hardware.rs",
      "docs/tiled-gemm-v1-mi300x-observation.md",
    ],
    target: "gfx942:xnack-",
    assertions: [
      {
        id: "harness-inputs",
        text: "The ignored, opt-in one-tile gfx942:xnack- harness consumes externally supplied digest-pinned bytes and a digest-pinned observed LLVM 22 objdump.",
      },
      {
        id: "harness-static-gates",
        text: "Before dispatch it enforces COV6/WG64/320-byte metadata, one bound entry, exact disassembly coverage, one retained v_mfma_f32_16x16x16_bf16, a global store, and rejection of forbidden control and memory forms.",
      },
      {
        id: "observed-run",
        text: "At repository commit 9a5d65d5929b9cabcf73d423957b06f5070f5137 on 2026-08-14, MI300X executed the externally supplied 6,672-byte HSACO with SHA-256 681077be1108c57d9d887f94afdd0ec3700ed2c86d73e66d2b229d6b418d0c66; the exact test passed 1/1 in 40.69 seconds.",
      },
      {
        id: "harness-runtime-checks",
        text: "The run passed a bitwise dyadic 16x16 oracle, confirmed that A/B/C inputs remained bitwise unchanged, preserved adjacent canaries, completed synchronously, retained exact executable identity, and performed terminal unload.",
      },
      {
        id: "harness-authority-boundary",
        text: "Commit 83fd4e4114a31da16ea3208c7b910269cd943bc8 records this non-authoritative observation. The supplied artifact has zero LDS and is not source-derived by the recorded run; the harness bypasses production prerequisite authentication, does not authenticate the artifact producer or full objdump runtime, and grants no compiler, publication, protected loading, protected launch, verification, or parity authority.",
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
  | {
      environment: Readonly<Record<string, string>>;
      locked: boolean;
      packageName: string;
      mode: "lib";
    }
  | {
      environment: Readonly<Record<string, string>>;
      locked: boolean;
      packageName: string;
      mode: "test";
      targetName: string;
      testName?: string;
      features?: string;
    };

export function parseExactCargoTestCommand(
  command: string,
): ParsedCargoTestCommand | undefined {
  const tokens = command.trim().split(/\s+/u);
  const environment: Record<string, string> = {};
  let cursor = 0;
  if (tokens[cursor] === "env") {
    cursor += 1;
    while (/^[A-Z][A-Z0-9_]*=\S+$/u.test(tokens[cursor] ?? "")) {
      const assignment = tokens[cursor];
      const separator = assignment.indexOf("=");
      const name = assignment.slice(0, separator);
      if (hasOwn(environment, name)) return undefined;
      environment[name] = assignment.slice(separator + 1);
      cursor += 1;
    }
    if (Object.keys(environment).length === 0) return undefined;
  }
  if (
    tokens[cursor] !== "cargo" ||
    tokens[cursor + 1] !== "test"
  ) {
    return undefined;
  }
  cursor += 2;
  const locked = tokens[cursor] === "--locked";
  if (locked) cursor += 1;
  if (
    tokens[cursor] !== "-p" ||
    !/^[a-z0-9][a-z0-9-]*$/u.test(tokens[cursor + 1] ?? "")
  ) {
    return undefined;
  }
  const packageName = tokens[cursor + 1];
  const argumentsAfterPackage = tokens.slice(cursor + 2);
  if (
    argumentsAfterPackage.length === 1 &&
    argumentsAfterPackage[0] === "--lib"
  ) {
    return {
      environment,
      locked,
      packageName,
      mode: "lib",
    };
  }
  if (
    argumentsAfterPackage.length === 2 &&
    argumentsAfterPackage[0] === "--test" &&
    /^[A-Za-z0-9_]+$/u.test(argumentsAfterPackage[1] ?? "")
  ) {
    return {
      environment,
      locked,
      packageName,
      mode: "test",
      targetName: argumentsAfterPackage[1],
    };
  }
  if (
    argumentsAfterPackage.length === 9 &&
    argumentsAfterPackage[0] === "--features" &&
    /^[a-z0-9][a-z0-9-]*$/u.test(argumentsAfterPackage[1] ?? "") &&
    argumentsAfterPackage[2] === "--test" &&
    /^[A-Za-z0-9_]+$/u.test(argumentsAfterPackage[3] ?? "") &&
    /^[A-Za-z0-9_]+$/u.test(argumentsAfterPackage[4] ?? "") &&
    argumentsAfterPackage[5] === "--" &&
    argumentsAfterPackage[6] === "--ignored" &&
    argumentsAfterPackage[7] === "--exact" &&
    argumentsAfterPackage[8] === "--nocapture"
  ) {
    return {
      environment,
      locked,
      packageName,
      mode: "test",
      targetName: argumentsAfterPackage[3],
      testName: argumentsAfterPackage[4],
      features: argumentsAfterPackage[1],
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
    if (
      id === "tiled-hardware-harness-v1" &&
      (record.commands.length !== 1 ||
        record.commands[0] !== TILED_GEMM_V1_HARDWARE_COMMAND)
    ) {
      issues.push(`${id}: hardware replay command differs from the observed command`);
    }
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
