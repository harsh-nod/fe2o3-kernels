export type DeclaredRegisterRole = "scratch" | "output" | "input0" | "input1" | "input2";
export type StaticRegisterUse = "none" | "read" | "write" | "read-write";
export interface DeclaredRegisterUseGrid {
  readonly interpretation: "static_explicit_instruction_uses_only";
  readonly declaredHighWater: number;
  readonly instructionOffsets: readonly number[];
  readonly roles: readonly {
    readonly role: DeclaredRegisterRole;
    readonly register: number;
    readonly uses: readonly StaticRegisterUse[];
  }[];
}
/** Presentation only: call after the owning profile has checked the native/source join. */
export function buildDeclaredRegisterUseGrid(
  plan: readonly number[],
  steps: readonly { readonly output: number; readonly inputs: readonly number[]; readonly fileOffset: number }[],
): DeclaredRegisterUseGrid;
