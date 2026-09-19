export const PROGRAM_CAPTURE_LIMIT: number;
export const PROGRAM_PAIR_ROLES: readonly string[];
export const PROGRAM_VARIANTS: readonly { name: string; profile: string; resultMode: string }[];
export interface OrderedProgramObservationInput { readonly captureUtf8: string; readonly expectedCaptureSha256: string }
export interface ProgramAnchor {
  cursor: { configuration_identity: string; event_sequence: number; state_revision: number };
  scope: { level: 'lane'; workgroup: number[]; wave: 0; lane: 0; logical_workitem: number[]; active_mask: bigint; wave_width: 64; interpretation: 'logical_visualization' };
  site: { kir: { function_ordinal: number; block_ordinal: number; point: { kind: 'operation'; operation_ordinal: number } }; source: { status: 'unavailable'; reason: 'requires_authenticated_map' } };
}
export interface ProgramValue { id: number; status: 'captured' | 'unavailable'; bits?: string; reason?: string }
export interface ProgramCase {
  index: number; configurationIdentity: string; simulationRequestSha256: string;
  checkpoints: readonly { label: string; anchor: ProgramAnchor; values: readonly ProgramValue[] }[];
}
export interface ProgramVariant {
  name: string; profile: string; resultMode: string;
  canonical: { wire_version: 17; sha256: string; bytes: number };
  coordinate: { function_ordinal: number; block_ordinal: number; operation_ordinal: number };
  rawBlockId: number; inputIds: readonly number[]; resultId: number;
  roles: { scratch: number; output: number; inputs: readonly number[]; vgpr_high_water: number };
  steps: readonly { instruction: string; output: number; inputs: readonly number[] }[];
  sourceIds: { frontend_unit: string; function: string; contract: string; statement: string };
  cases: readonly ProgramCase[];
}
export type ProgramProjection = { status: 'ready'; captureKey: string; kind: 'retained_public_diagnostic' | 'synthetic_test_only'; variants: readonly ProgramVariant[] }
  | { status: 'invalid' | 'unavailable'; detail: string };
export function parseProgramJson(raw: string, maximum?: number): unknown;
export function programSha256(raw: string): Promise<string>;
export function projectOrderedProgramObservation(input: OrderedProgramObservationInput | null): Promise<ProgramProjection>;
