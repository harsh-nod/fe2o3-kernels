import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readRepeatNativeFile } from "../src/content/repeat-native-file";

class Reader {
  static LOADING = 1;
  static instances: Reader[] = [];
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  readyState = 0;
  result: ArrayBuffer | null = null;
  readAsArrayBuffer = vi.fn(() => { this.readyState = Reader.LOADING; });
  abort = vi.fn(() => { this.readyState = 2; this.onabort?.(); });
  constructor() { Reader.instances.push(this); }
  complete(bytes: number[]) {
    this.result = new Uint8Array(bytes).buffer; this.readyState = 2; this.onload?.();
  }
}
beforeEach(() => { Reader.instances = []; vi.stubGlobal("FileReader", Reader); });
afterEach(() => vi.unstubAllGlobals());
const controller = () => new AbortController();
const selected = (size: number) => ({ size } as File);

describe("bounded repeat-native file transport", () => {
  it.each([0, 4194305, Number.NaN, -1, 1.5])("rejects size %s before creating a reader", async size => {
    await expect(readRepeatNativeFile(selected(size), controller().signal)).rejects.toThrow(/at most 4 MiB/u);
    expect(Reader.instances).toHaveLength(0);
  });
  it("rejects an already aborted read before creating a reader", async () => {
    const pending = controller(); pending.abort();
    await expect(readRepeatNativeFile(selected(2), pending.signal)).rejects.toMatchObject({ name: "AbortError" });
    expect(Reader.instances).toHaveLength(0);
  });
  it("returns exact UTF-8 text without parsing, following paths, or changing whitespace", async () => {
    const pending = readRepeatNativeFile(selected(3), controller().signal);
    const observed = Reader.instances[0]; observed.complete([123, 125, 10]);
    await expect(pending).resolves.toBe("{}\n");
    expect(observed.readAsArrayBuffer).toHaveBeenCalledTimes(1);
    expect(observed.onload).toBeNull();
  });
  it.each([{ label: "BOM", bytes: [239, 187, 191, 123, 125] }, { label: "invalid UTF-8", bytes: [195, 40] }])("rejects $label bytes", async ({ bytes }) => {
    const pending = readRepeatNativeFile(selected(bytes.length), controller().signal);
    Reader.instances[0].complete(bytes);
    await expect(pending).rejects.toThrow();
  });
  it("rejects a changed byte length", async () => {
    const pending = readRepeatNativeFile(selected(2), controller().signal);
    Reader.instances[0].complete([123]);
    await expect(pending).rejects.toThrow(/length changed/u);
  });
  it("aborts the real pending reader and removes callbacks", async () => {
    const signal = controller(), pending = readRepeatNativeFile(selected(2), signal.signal);
    const observed = Reader.instances[0]; signal.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(observed.abort).toHaveBeenCalledTimes(1);
    expect(observed.onload).toBeNull(); expect(observed.onerror).toBeNull();
  });
  it("handles an actual read error without retaining an arbitrary error payload", async () => {
    const pending = readRepeatNativeFile(selected(2), controller().signal);
    Reader.instances[0].onerror?.();
    await expect(pending).rejects.toThrow("The selected capsule could not be read.");
  });
});
