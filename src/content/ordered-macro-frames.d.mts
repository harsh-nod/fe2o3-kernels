export const MACRO_CAPTURE_LIMIT: number;
export const MACRO_REPORT_LIMIT: number;
export const MACRO_SOURCE_LIMIT: number;
export interface MacroFramesSelection {
  readonly reportSha256: string;
  readonly canonicalSha256: string;
  readonly sourceSha256: string;
  readonly expansionChainSha256: string;
}
export interface MacroFramesInput {
  readonly captureUtf8: string;
  readonly expectedCaptureSha256: string;
  readonly selection: MacroFramesSelection;
}
export interface MacroLocation {
  readonly fileIdentity: string;
  readonly start: number;
  readonly end: number;
  readonly lineStart: number;
  readonly columnStart: number;
  readonly lineEnd: number;
  readonly columnEnd: number;
  readonly path: string | null;
  readonly excerpt: string | null;
  readonly availability: 'selected_source_bytes' | 'source_bytes_unavailable';
}
export interface MacroFrame {
  readonly ordinal: number;
  readonly name: string;
  readonly expansionIdentity: string;
  readonly callSite: MacroLocation;
  readonly expansion: MacroLocation;
  readonly definitionSite: MacroLocation;
}
export type MacroFramesProjection = {
  readonly status: 'ready';
  readonly captureKey: string;
  readonly reportSha256: string;
  readonly baselineSha256: string;
  readonly canonicalSha256: string;
  readonly canonicalBytesSha256: string;
  readonly canonicalBytes: number;
  readonly sourceSha256: string;
  readonly expansionChainSha256: string;
  readonly sourceIds: Readonly<Record<string, string>>;
  readonly target: 'gfx942:xnack-';
  readonly waveWidth: 64;
  readonly coordinate: readonly number[];
  readonly frames: readonly MacroFrame[];
  readonly authority: 'display_only';
  readonly finalArtifact: 'unavailable';
  readonly physicalLifetimes: 'unavailable';
  readonly instructionOrigins: 'whole_region_only';
  readonly llvmInlineStack: false;
} | { readonly status: 'invalid' | 'unavailable'; readonly detail: string };
export function projectOrderedMacroFrames(input: MacroFramesInput | null): Promise<MacroFramesProjection>;
