export interface LinkedLinePin { readonly bytes: number; readonly sha256: string }
export interface LinkedLineSpan {
  readonly file_identity: string; readonly display_path: string; readonly file_bytes: number;
  readonly byte_start: number; readonly byte_end: number; readonly line: number; readonly column: number;
}
export interface LinkedLineCase {
  readonly optimization: 'O0' | 'O3'; readonly payload: LinkedLinePin;
  readonly region: { readonly symbol: string; readonly entry_va: number; readonly entry_bytes: number;
    readonly entry_file_offset: number; readonly begin_va: number; readonly end_va: number;
    readonly begin_file_offset: number; readonly end_file_offset: number; readonly instruction_count: number };
  readonly coverage: readonly { readonly begin_va: number; readonly end_va: number; readonly row_begin_va: number;
    readonly row_end_va: number; readonly file: string; readonly line: number; readonly column: number; readonly discriminator: number }[];
}
export interface LinkedLineReady {
  readonly status: 'ready'; readonly capsuleSha256: string; readonly checkedArtifacts: number;
  readonly source: string; readonly sourceSha256: string; readonly canonical: LinkedLinePin; readonly llvmSha256: string;
  readonly sourceIdentity: Readonly<Record<'frontend_unit' | 'function' | 'contract' | 'statement', string>>;
  readonly coordinate: Readonly<Record<'function_ordinal' | 'block_ordinal' | 'block_id' | 'operation_ordinal', number>>;
  readonly span: LinkedLineSpan; readonly cases: readonly LinkedLineCase[];
  readonly target: 'gfx942:xnack-'; readonly scenario: 'edited'; readonly wholeRegionOnly: true;
  readonly runtimeAddress: false; readonly hardwareExecution: false; readonly producerAuthenticated: false; readonly interpretation: string;
}
export type LinkedLineProjection = LinkedLineReady | { readonly status: 'invalid' | 'unavailable'; readonly detail: string };
export const LINKED_LINE_LIMITS: Readonly<Record<string, number>>;
export const LINKED_LINE_ROLES: readonly string[];
export function projectLinkedRegionLines(input: unknown, expectedCapsuleSha256: string): Promise<LinkedLineProjection>;
