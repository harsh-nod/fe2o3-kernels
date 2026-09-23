import { HARDWARE_RESOURCE_LIMITS } from "./hardware-resource-capture";
import { readRepeatNativeFile } from "./repeat-native-file";

/** Smaller profile cap before reusing exact UTF-8 and abortable FileReader transport. */
export function readHardwareResourceFile(file: File, signal: AbortSignal): Promise<string> {
  if (!Number.isSafeInteger(file.size) || file.size < 1 || file.size > HARDWARE_RESOURCE_LIMITS.fileBytes) {
    return Promise.reject(new Error("Select one nonempty historical capture of at most 2 MiB."));
  }
  return readRepeatNativeFile(file, signal);
}
