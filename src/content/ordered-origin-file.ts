import { ORDERED_ORIGIN_MAX_BYTES } from "./ordered-origin-observation.mjs";
import { readRepeatNativeFile } from "./repeat-native-file";

/** Reuse exact UTF-8/cancellation transport after applying this smaller independent cap. */
export function readOrderedOriginFile(file: File, signal: AbortSignal): Promise<string> {
  if (!Number.isSafeInteger(file.size) || file.size < 1 || file.size > ORDERED_ORIGIN_MAX_BYTES) {
    return Promise.reject(new Error("Select one nonempty ordered-origin report of at most 16 KiB."));
  }
  return readRepeatNativeFile(file, signal);
}
