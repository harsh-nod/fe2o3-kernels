import { afterEach, describe, expect, it, vi } from "vitest";
import { readHardwareResourceFile } from "../src/content/hardware-resource-file";
import * as shared from "../src/content/repeat-native-file";
afterEach(() => vi.restoreAllMocks());
describe("historical hardware file cap before shared exact UTF-8 transport", () => {
  it.each([0, -1, 1.5, Number.NaN, 2097153])("refuses size %s before starting a reader", async size => {
    const delegated = vi.spyOn(shared, "readRepeatNativeFile");
    await expect(readHardwareResourceFile({ size } as File, new AbortController().signal)).rejects.toThrow(/2 MiB/u);
    expect(delegated).not.toHaveBeenCalled();
  });
  it("delegates an exact boundary-sized file and the same abort signal", async () => {
    const delegated = vi.spyOn(shared, "readRepeatNativeFile").mockResolvedValue("retained bytes");
    const file = { size: 2097152 } as File, signal = new AbortController().signal;
    await expect(readHardwareResourceFile(file, signal)).resolves.toBe("retained bytes");
    expect(delegated).toHaveBeenCalledWith(file, signal);
  });
});
