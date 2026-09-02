import { deepFreeze, hasOwn, type DeepReadonly } from "./registry";

export type FunctionalGateMode =
  | "proof-time-source-model"
  | "runtime-cpu-oracle"
  | "compile-time-refinement";

export interface FunctionalReferenceGate {
  mode: FunctionalGateMode;
  label: string;
  command: string;
  mismatchBehavior: string;
  supportedSubset: string;
  compileTimePromotion: string;
}

export const functionalGateModeLabels = deepFreeze({
  "proof-time-source-model": "Proof-time source model",
  "runtime-cpu-oracle": "Runtime CPU oracle",
  "compile-time-refinement": "Compile-time refinement",
} satisfies Record<FunctionalGateMode, string>);

const compileTimePromotion =
  "Promote this kernel by admitting the exact safe CPU reference MIR at the compiler-owned SafeReferenceMirToLivePliron join, replaying the derived domain, precondition, coordinate, and value formulas, and requiring unsupported reference features to fail closed before KIR lowering.";

export function proofTimeSourceModelGate({
  command,
  mismatchBehavior,
  supportedSubset,
}: {
  command: string;
  mismatchBehavior: string;
  supportedSubset: string;
}): FunctionalReferenceGate {
  return {
    mode: "proof-time-source-model",
    label:
      "The checked artifact is a source-level model/refinement proof with negative fixtures.",
    command,
    mismatchBehavior,
    supportedSubset,
    compileTimePromotion,
  };
}

export function runtimeCpuOracleGate({
  command,
  mismatchBehavior,
  supportedSubset,
}: {
  command: string;
  mismatchBehavior: string;
  supportedSubset: string;
}): FunctionalReferenceGate {
  return {
    mode: "runtime-cpu-oracle",
    label:
      "The runnable kernel compares the bounded GPU result with an independent safe CPU reference or oracle.",
    command,
    mismatchBehavior,
    supportedSubset,
    compileTimePromotion,
  };
}

export function compileTimeRefinementGate({
  command,
  mismatchBehavior,
  supportedSubset,
}: {
  command: string;
  mismatchBehavior: string;
  supportedSubset: string;
}): FunctionalReferenceGate {
  return {
    mode: "compile-time-refinement",
    label:
      "The compiler-owned reference/effect join is the authority boundary for this admitted subset.",
    command,
    mismatchBehavior,
    supportedSubset,
    compileTimePromotion:
      "Keep the safe CPU reference in the admitted MIR subset and require the per-compilation Verus replay plus PLIRON structural reconciliation to pass for every promoted build.",
  };
}

export function isFunctionalGateMode(
  value: string,
): value is FunctionalGateMode {
  return hasOwn(functionalGateModeLabels, value);
}

export function validateFunctionalReferenceGate(
  gate: FunctionalReferenceGate,
): string[] {
  const issues: string[] = [];
  if (!isFunctionalGateMode(gate.mode)) {
    issues.push("unknown gate mode");
  }
  for (const [field, value] of Object.entries(gate)) {
    if (typeof value !== "string" || value.trim().length === 0) {
      issues.push(`empty ${field}`);
    }
  }
  if (!/mismatch|fail/i.test(gate.mismatchBehavior)) {
    issues.push("mismatch behavior must say how mismatches are caught");
  }
  if (!/safe CPU reference|oracle|MIR|Verus/i.test(gate.supportedSubset)) {
    issues.push("supported subset must name the reference authority");
  }
  if (!/fail closed|before KIR|SafeReferenceMirToLivePliron/i.test(gate.compileTimePromotion)) {
    issues.push("promotion path must describe the compile-time gate");
  }
  return issues;
}

export type ReadonlyFunctionalReferenceGate =
  DeepReadonly<FunctionalReferenceGate>;
