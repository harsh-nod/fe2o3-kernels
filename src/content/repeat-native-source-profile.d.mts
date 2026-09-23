export interface RepeatSourceProfileInput {
  stages: { label: string; args: string[] }[];
  variants: { label: string; source_path: string }[];
  refusals: { label: string; source_path: string }[];
}
export interface RepeatSourceProfilePin { path: string; bytes: number; sha256: string }
export function validateRepeatSourceProfile(
  source: RepeatSourceProfileInput,
  root: string,
  pins: ReadonlyMap<string, RepeatSourceProfilePin>,
): 'legacy' | 'origin-v1';
