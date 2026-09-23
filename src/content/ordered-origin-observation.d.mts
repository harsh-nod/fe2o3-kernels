export const ORDERED_ORIGIN_MAX_BYTES: 16384;
export interface OrderedOriginSourceIds {
  readonly frontend_unit: string; readonly function: string; readonly contract: string; readonly statement: string;
}
export interface OrderedOriginSpan {
  readonly file_identity: string; readonly byte_start: number; readonly byte_end: number;
  readonly line_start: number; readonly column_start: number; readonly line_end: number; readonly column_end: number;
}
export interface OrderedOriginBinding {
  readonly canonicalBytes: number; readonly target: "gfx942:xnack-"; readonly waveWidth: 64;
  readonly declaredSourceIds: OrderedOriginSourceIds; readonly coordinate: readonly number[];
  readonly rawBlock: number; readonly declaredDescriptors: readonly number[];
  readonly registerRoles: Readonly<{ scratch: number; output: number; inputs: readonly number[] }>;
}
export interface OrderedOriginSubject {
  readonly canonicalKirSha256: string; readonly semanticSha256: string;
  readonly sourceInventorySha256: string; readonly sourcePreflightSha256: string;
  readonly originBinding: OrderedOriginBinding;
}
export interface OrderedOriginView extends OrderedOriginBinding {
  readonly canonicalSha256: string; readonly semanticSha256: string;
  readonly sourceInventorySha256: string; readonly sourcePreflightSha256: string;
  readonly rootFunctionSha256: string; readonly rootMonomorphizationSha256: string;
  readonly rustcMirBodySha256: string; readonly rustcMirBlock: number;
  readonly semanticFunction: number; readonly semanticBlock: number; readonly semanticBlockIdentity: string;
  readonly expansion: OrderedOriginSpan; readonly callSite: OrderedOriginSpan;
  readonly expansionChainSha256: string; readonly expansionDepth: number; readonly workUsed: number;
}
export function parseOrderedOriginJson(raw: string): OrderedOriginView;
export function compareOrderedOrigin(origin: OrderedOriginView, selected: OrderedOriginSubject): Readonly<{
  status: "mismatch" | "matching_reported_identities"; mismatches: readonly string[];
}>;
