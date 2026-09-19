import type { NavigationInput } from './authoring-navigation.mjs';
import captureUtf8 from '../../examples/ordinary_authoring_navigation_v1.json?raw';

// Actual same-run ordinary-source/census capture, compiler 70b3fe0057e18e16eaa568301d2743b1ca6c252a.
// Display bytes are not a source-edit owner or compiler-execution attestation.
export const AUTHORING_NAVIGATION_RETAINED_INPUT: NavigationInput = Object.freeze({
  captureUtf8,
  expectedCaptureSha256: '957b7a0ece3aaea5e474c3124bced44e28a73b616e8cddd0e663a8fa7380d6c1',
});
