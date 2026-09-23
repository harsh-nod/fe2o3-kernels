import type { DeclaredRegisterUseGrid } from "./final-native-register-roles.mjs";
export const FINAL_NATIVE_LIMITS: Readonly<{ artifactBytes: number; sourceBytes: number; reportBytes: number;
  payloadBytes: number; totalBytes: number; payloads: 4; artifacts: 14 }>;
export interface FinalNativeInstruction {
  readonly declaredInstruction: string; readonly opcode: string; readonly bytesHex: string;
  readonly registers: readonly string[]; readonly fileOffset: number;
}
export interface FinalNativeCase {
  readonly id: string; readonly profile: "default" | "edited"; readonly optimization: "O0" | "O3";
  readonly source: string; readonly sourceSha256: string; readonly semanticSha256: string;
  readonly canonicalKirSha256: string; readonly llvm: string; readonly llvmSha256: string;
  readonly hsacoSha256: string; readonly hsacoBytes: number; readonly program: readonly FinalNativeInstruction[];
  readonly registerGrid: DeclaredRegisterUseGrid;
  readonly staticInstructions: number; readonly declaredVgprHighWater: 6; readonly encodedVgprCapacity: number;
  readonly architectedVgprBoundary: number; readonly descriptorOffset: number; readonly descriptorSha256: string;
  readonly resource1: number; readonly resource3: number; readonly llvmBuildClaim: string; readonly workerBuildClaim: string;
}
export type FinalNativeProjection = {
  readonly status: "ready"; readonly kind: "retained_source_native_observation" | "synthetic_test_only";
  readonly captureName: string; readonly joinSha256: string; readonly sourceReceiptSha256: string;
  readonly retainedBytes: number; readonly checkedArtifacts: 14; readonly cases: readonly FinalNativeCase[];
  readonly sourceExportsReported: 3; readonly cpuSimulationsReported: 90; readonly interpretation: string;
  readonly unavailable: readonly string[];
} | { readonly status: "invalid" | "unavailable"; readonly detail: string };
export function copyFinalNativeEvidence(value: unknown): unknown;
export function projectFinalNativeComparison(input: unknown, expectedJoinSha256: string): Promise<FinalNativeProjection>;
