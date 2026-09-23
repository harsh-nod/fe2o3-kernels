import { REPEAT_NATIVE_LIMITS } from "./repeat-native-comparison.mjs";

/** Bounded transport read only; the separate projector validates the closed profile. */
export function readRepeatNativeFile(file: File, signal: AbortSignal): Promise<string> {
  if (signal.aborted) return Promise.reject(new DOMException("Import cancelled.", "AbortError"));
  if (!Number.isSafeInteger(file.size) || file.size < 1 || file.size > REPEAT_NATIVE_LIMITS.outerBytes) {
    return Promise.reject(new Error("Select one nonempty capsule of at most 4 MiB."));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    let finished = false;
    const cleanup = () => {
      signal.removeEventListener("abort", cancel);
      reader.onload = reader.onerror = reader.onabort = null;
    };
    const fail = (error: unknown) => {
      if (!finished) { finished = true; cleanup(); reject(error); }
    };
    const cancel = () => {
      fail(new DOMException("Import cancelled.", "AbortError"));
      if (reader.readyState === FileReader.LOADING) reader.abort();
    };
    reader.onerror = () => fail(new Error("The selected capsule could not be read."));
    reader.onabort = () => fail(new DOMException("Import cancelled.", "AbortError"));
    reader.onload = () => {
      try {
        if (signal.aborted) { cancel(); return; }
        if (!(reader.result instanceof ArrayBuffer) || reader.result.byteLength !== file.size) {
          throw new Error("The capsule length changed or its read was incomplete.");
        }
        const bytes = new Uint8Array(reader.result);
        if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
          throw new Error("UTF-8 BOM is not supported.");
        }
        const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        if (new TextEncoder().encode(text).byteLength !== file.size) {
          throw new Error("The capsule is not exact UTF-8.");
        }
        finished = true; cleanup(); resolve(text);
      } catch (error) { fail(error); }
    };
    signal.addEventListener("abort", cancel, { once: true });
    if (signal.aborted) { cancel(); return; }
    try { reader.readAsArrayBuffer(file); } catch (error) { fail(error); }
  });
}
