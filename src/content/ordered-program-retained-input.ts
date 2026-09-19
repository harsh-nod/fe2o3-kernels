import type { OrderedProgramObservationInput } from './ordered-program-observation.mjs';
import captureUtf8 from '../../examples/ordered_program_observation_v1.json?raw';

// Exact selected JSONL pairs from the passing 36-session public V17 batch.
// This pin checks retained-byte consistency, not producer or source authority.
// Synthetic controls stay in tests; missing/invalid data has no fallback capture.
export const ORDERED_PROGRAM_RETAINED_INPUT: OrderedProgramObservationInput = Object.freeze({
  captureUtf8,
  expectedCaptureSha256: '6ae5be6ed1843aff7c84ab9d57cb5bee740d44c5f2ec254baa5270eb46fce468',
});
