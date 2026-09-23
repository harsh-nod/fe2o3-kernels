export const ORDERED_ROLE_LIVENESS_LIMITS: Readonly<{ steps: 16; values: 19; boundaries: 17; operandSlots: 32 }>;
export type LogicalProgramRole = "input0" | "input1" | "input2" | "scratch" | "output";
export interface OrderedLogicalValue {
  readonly key: string; readonly role: LogicalProgramRole; readonly definitionStep: number | null;
  readonly canonicalInputSsa: number | null; readonly canonicalResultSsa: number | null;
  readonly bornBoundary: number; readonly readOperands: readonly { readonly step: number; readonly operand: number }[];
  readonly overwrittenAtStep: number | null; readonly returned: boolean; readonly lastReadStep: number | null;
  readonly endBoundaryExclusive: number; readonly unused: boolean;
}
export interface OrderedRoleLiveness {
  readonly interpretation: "static_finite_region_logical_def_use_v1";
  readonly coordinate: readonly number[]; readonly rawBlockId: number;
  readonly inputValueIds: readonly number[]; readonly resultValueId: number;
  readonly values: readonly OrderedLogicalValue[];
  readonly steps: readonly {
    readonly step: number; readonly opcode: string; readonly descriptor: number;
    readonly reads: readonly string[]; readonly writes: string; readonly destination: LogicalProgramRole;
    readonly operandWrite: readonly string[]; readonly operandWriteCount: number;
    readonly transient: readonly string[]; readonly transientCount: number;
  }[];
  readonly boundaries: readonly { readonly boundary: number; readonly live: readonly string[]; readonly count: number }[];
  readonly liveIn: readonly string[]; readonly liveOut: readonly string[];
  readonly peakBoundaryLive: number; readonly peakTransient: number; readonly unavailable: readonly string[];
}
/** Derived presentation only. Owning caller must first check the exact source/native profile. */
export function buildOrderedRoleLiveness(input: {
  readonly descriptors: readonly number[]; readonly inputValueIds: readonly number[]; readonly resultValueId: number;
  readonly coordinate: readonly number[]; readonly rawBlockId: number;
}): OrderedRoleLiveness;
