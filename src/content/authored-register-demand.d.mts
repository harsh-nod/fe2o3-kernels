export const AUTHORED_DEMAND_LIMITS: Readonly<{ capsuleBytes: 24576; reportBytes: 8192;
  reports: 2; instructions: 16; values: 19; uses: 33; boundaries: 34; asciiBytes: 8192 }>;
export interface DemandValue {
  readonly id: number; readonly role: string; readonly binding: number; readonly def: number;
  readonly last_use: number | null; readonly overwritten: number | null;
}
export interface DemandPlan {
  readonly steps: number; readonly result_boundary: number; readonly values: readonly DemandValue[];
  readonly uses: readonly { readonly at: number; readonly value: number; readonly kind: string }[];
}
export interface AuthoredDemandCase {
  readonly profile: "default" | "edited"; readonly reportSha256: string; readonly canonicalSha256: string;
  readonly sourceIds: Readonly<Record<string, string>>; readonly plan: DemandPlan;
  readonly boundaries: readonly number[]; readonly values: readonly (DemandValue & { readonly cells: readonly string[] })[];
  readonly ascii: string;
}
export type AuthoredDemandProjection = { readonly status: "ready"; readonly capsuleSha256: string;
  readonly nativeJoinSha256: string; readonly sourceReceiptSha256: string; readonly cases: readonly AuthoredDemandCase[];
  readonly interpretation: string; readonly physicalAllocation: false; readonly hardwareExecution: false;
} | { readonly status: "invalid" | "unavailable"; readonly detail: string };
export function deriveAuthoredDemand(registers: unknown, instructions: unknown): DemandPlan;
export function projectAuthoredDemand(nativeInput: unknown, expectedNativeJoin: string, input: unknown,
  expectedCapsuleSha256: string): Promise<AuthoredDemandProjection>;
