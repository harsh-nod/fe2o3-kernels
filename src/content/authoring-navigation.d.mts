export interface NavigationInput { readonly captureUtf8: string; readonly expectedCaptureSha256: string }
export interface NavigationCoordinate { function: number; block: number; operation: number }
export interface NavigationValue { value: number; ty: string }
export interface NavigationAttribution { coordinate: NavigationCoordinate; file_identity: string; byte_start: number; byte_end: number }
export interface NavigationOperation {
  coordinate: NavigationCoordinate; function_name: string; kind: string; semantic_detail: string | null;
  inputs: NavigationValue[]; results: NavigationValue[]; local_memory_effects: string[];
  complete_local_effect_summary: boolean; convergence: string; traps: string; physical_resources: string;
  source_binding: string; source_spans: { file_identity: string; display_path: string; byte_start: string; byte_end: string; line: number; column: number }[];
}
export interface NavigationView {
  source: { utf8: string; bytes: number; sha256: string; file_identity: string };
  source_file_identity: string; source_binding: string;
  summary: { bundle_identity: string; canonical_kir_digest: string; semantic_mir_identity: string; target: string; canonical_kir_version: number; operation_count: number };
  selector: { bundle_identity: string; canonical_kir_digest: string; target: string; operations: NavigationCoordinate[] };
  region: { live_in: NavigationValue[]; live_out: NavigationValue[]; structural_boundary: string; source_insertion_boundary: string };
  operations: NavigationOperation[]; attributions: NavigationAttribution[]; selected_range_occurrences: NavigationAttribution[];
  availability: Record<string, string>;
}
export type NavigationProjection = { status: 'ready'; captureKey: string; kind: 'retained_source_navigation' | 'synthetic_test_only'; sourceCaptureSha256: string; navigation: NavigationView } | { status: 'invalid' | 'unavailable'; detail: string };
export const NAVIGATION_LIMITS: Readonly<{ captureBytes: number; sourceBytes: number; operations: number; spans: number; values: number }>;
export const NAVIGATION_AUTHORITY: Readonly<Record<string, boolean>>;
export const NAVIGATION_AVAILABILITY: Readonly<Record<string, string>>;
export const NAVIGATION_CAPABILITIES: readonly Readonly<Record<string, string>>[];
export function navigationCoordinateKey(value: NavigationCoordinate): string;
export function navigationOccurrences(view: NavigationView, start: number, end: number): NavigationOperation[];
export function projectAuthoringNavigation(input: NavigationInput | null): Promise<NavigationProjection>;
