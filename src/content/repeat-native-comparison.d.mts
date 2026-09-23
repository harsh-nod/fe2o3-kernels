import type { DeclaredRegisterUseGrid } from "./final-native-register-roles.mjs";
import type { FinalNativeInstruction } from "./final-native-comparison.mjs";
export const REPEAT_NATIVE_LIMITS: Readonly<{ chunkBytes: 65536; receiptBytes: 524288; artifactBytes: 65536;
  totalBytes: 2097152; outerBytes: 4194304; artifacts: 23; payloads: 8 }>;
export interface RepeatNativeArtifactV1 {
  readonly role: string; readonly path: string; readonly sha256: string; readonly bytes: number;
  readonly encoding: "utf8" | "hex"; readonly chunks: readonly string[];
}
export interface RepeatNativeCase {
  readonly id: string; readonly label: "one" | "two" | "fifteen" | "repeat";
  readonly repetitions: 1 | 2 | 15; readonly optimization: "O0" | "O3";
  readonly source: string; readonly sourceSha256: string; readonly semanticSha256: string;
  readonly canonicalKirSha256: string; readonly kirFileSha256: string;
  readonly sourceInventorySha256: string; readonly sourcePreflightSha256: string;
  readonly llvm: string; readonly llvmSha256: string; readonly reportSha256: string;
  readonly payloadPath: string; readonly hsacoSha256: string; readonly hsacoBytes: number;
  readonly program: readonly FinalNativeInstruction[]; readonly registerGrid: DeclaredRegisterUseGrid;
  readonly staticInstructions: number; readonly declaredVgprHighWater: 37;
  readonly encodedVgprCapacity: number; readonly architectedVgprBoundary: number;
  readonly descriptorOffset: number; readonly descriptorSha256: string;
  readonly resource1: number; readonly resource3: number;
  readonly llvmBuildClaim: string; readonly workerBuildClaim: string;
}
export type RepeatNativeProjection = {
  readonly status: "ready"; readonly kind: "retained_source_native_observation" | "synthetic_test_only";
  readonly captureName: string; readonly joinSha256: string; readonly sourceReceiptSha256: string;
  readonly llvmReceiptSha256: string; readonly retainedBytes: number; readonly checkedArtifacts: 23;
  readonly sourceExportsReported: 4; readonly cpuSimulationsReported: 120;
  readonly cases: readonly RepeatNativeCase[]; readonly interpretation: string; readonly unavailable: readonly string[];
} | { readonly status: "invalid" | "unavailable"; readonly detail: string };
export function copyRepeatNativeEvidence(input: unknown): Readonly<{
  schema: "fe2o3-repeat-native-comparison-example-v1";
  provenance: Readonly<{ capture_name: string; kind: "retained_source_native_observation" | "synthetic_test_only";
    producer_authenticated: false; qualified_release_pin: null }>;
  artifacts: readonly RepeatNativeArtifactV1[]; retainedBytes: number;
}>;
export function projectRepeatNativeComparison(input: unknown, expectedJoinSha256: string): Promise<RepeatNativeProjection>;
