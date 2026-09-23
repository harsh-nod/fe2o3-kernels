export interface MutableRepeatArtifact {
  role: string; path: string; sha256: string; bytes: number; encoding: string; chunks: string[];
}
export interface MutableRepeatCapsule {
  schema: string; provenance: { capture_name: string; kind: string; producer_authenticated: boolean; qualified_release_pin: null };
  artifacts: MutableRepeatArtifact[];
}
export function repeatFixture(edits?: readonly { role: string; path: readonly (string | number)[]; value: unknown }[]):
  { capsule: MutableRepeatCapsule; joinSha256: string };
