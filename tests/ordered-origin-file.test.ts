import { afterEach, describe, expect, it, vi } from "vitest";
import { readOrderedOriginFile } from "../src/content/ordered-origin-file";
import * as transport from "../src/content/repeat-native-file";
afterEach(() => vi.restoreAllMocks());

describe("independently bounded origin file transport", () => {
  it.each([0, -1, 1.5, Number.NaN, 16385, 4194304])("refuses size %s before the shared reader", async size => {
    const read = vi.spyOn(transport, "readRepeatNativeFile");
    await expect(readOrderedOriginFile({ size } as File, new AbortController().signal)).rejects.toThrow(/16 KiB/u);
    expect(read).not.toHaveBeenCalled();
  });
  it("preserves the existing exact UTF-8/BOM/abort transport at the smaller cap", async () => {
    const file = { size: 16384 } as File, signal = new AbortController().signal;
    const read = vi.spyOn(transport, "readRepeatNativeFile").mockResolvedValue("exact original bytes");
    await expect(readOrderedOriginFile(file, signal)).resolves.toBe("exact original bytes");
    expect(read).toHaveBeenCalledTimes(1); expect(read).toHaveBeenCalledWith(file, signal);
  });
});
