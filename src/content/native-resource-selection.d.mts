import type { FinalNativeProjection, FinalNativeCase } from "./final-native-comparison.mjs";
import type { DeclaredRegisterUseGrid } from "./final-native-register-roles.mjs";
import type { AuthoredDemandProjection, AuthoredDemandCase } from "./authored-register-demand.mjs";
export interface NativeInstructionSelection {
  readonly caseId: string; readonly ordinal: number; readonly fileOffset: number;
  readonly joinSha256: string; readonly sourceReceiptSha256: string;
  readonly sourceSha256: string; readonly semanticSha256: string; readonly canonicalSha256: string;
  readonly llvmSha256: string; readonly hsacoSha256: string; readonly descriptorSha256: string;
}
export interface SelectedDemandBoundaries {
  readonly read: number; readonly write: number; readonly capsuleSha256: string; readonly reportSha256: string;
  readonly readValueIds: readonly number[]; readonly writeValueIds: readonly number[];
}
/** Only original returned tokens link immutable already-validated projections. */
export function selectNativeInstruction(projection: FinalNativeProjection, caseId: string, ordinal: number,
  fileOffset: number): NativeInstructionSelection | null;
export function matchesNativeInstruction(selection: NativeInstructionSelection | null,
  projection: Extract<FinalNativeProjection, { status: "ready" }>, row: FinalNativeCase): boolean;
export function selectedRegisterInstruction(selection: NativeInstructionSelection | null,
  grid: DeclaredRegisterUseGrid): number | null;
export function selectedDemandBoundaries(selection: NativeInstructionSelection | null,
  projection: AuthoredDemandProjection, model: AuthoredDemandCase): SelectedDemandBoundaries | null;
