import { ReadableStream as NodeReadableStream, TransformStream as NodeTransformStream, DecompressionStream as NodeDecompressionStream } from "node:stream/web";
import { gzipSync } from "node:zlib";
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { collectBounded, readIndexStream, LDS_LIMITS } from "../src/content/physical-lds-debug-v22-framing";
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); vi.stubGlobal("ReadableStream", NodeReadableStream);
  vi.stubGlobal("TransformStream", NodeTransformStream); vi.stubGlobal("DecompressionStream", NodeDecompressionStream); });
afterEach(() => vi.unstubAllGlobals());
function stream(bytes: Uint8Array) { return new ReadableStream<Uint8Array>({ start(c) { c.enqueue(bytes); c.close(); } }); }
it("accepts exact bounded stream bytes", async () => { expect(await collectBounded(stream(new Uint8Array(17)), 17)).toHaveLength(17); });
it("accepts genuine cross-realm decompressor output", async () => {
  expect(await readIndexStream(stream(gzipSync("bounded gzip output")), true)).toBe("bounded gzip output");
});
it("accepts exactly the expanded gzip limit", async () => {
  const compressed = gzipSync(new Uint8Array(LDS_LIMITS.indexBytes).fill(65));
  const expanded = await readIndexStream(stream(compressed), true);
  expect(expanded.length).toBe(LDS_LIMITS.indexBytes); expect(expanded[0]).toBe("A"); expect(expanded.at(-1)).toBe("A");
});
it("rejects non-byte typed arrays and plain array chunks", async () => {
  for (const value of [new Int8Array(1), new Uint16Array(1), new DataView(new ArrayBuffer(1)), [1]])
    await expect(collectBounded(stream(value as unknown as Uint8Array), 8)).rejects.toThrow(/Uint8Array/);
});
it("cancels on one-over chunk before concatenation", async () => {
  let cancelled = false; const source = new ReadableStream<Uint8Array>({ pull(c) { c.enqueue(new Uint8Array(18)); }, cancel() { cancelled = true; } });
  await expect(collectBounded(source, 17)).rejects.toThrow(/limit/); expect(cancelled).toBe(true);
});
it("refuses decompressed one-over even when gzip is tiny", async () => {
  const raw = new Uint8Array(LDS_LIMITS.indexBytes + 1).fill(65), compressed = gzipSync(raw);
  expect(compressed.length).toBeLessThan(LDS_LIMITS.compressedBytes);
  await expect(readIndexStream(stream(compressed), true)).rejects.toThrow(/limit/);
});
it("refuses compressed one-over independently of decoded size", async () => {
  await expect(readIndexStream(stream(new Uint8Array(LDS_LIMITS.compressedBytes + 1)), true)).rejects.toThrow();
});
it("requires valid gzip EOF", async () => {
  const compressed = gzipSync("bounded"); await expect(readIndexStream(stream(compressed.subarray(0, compressed.length - 4)), true)).rejects.toThrow();
});
it("rejects invalid UTF8 after bounded collection", async () => { await expect(readIndexStream(stream(new Uint8Array([255])), false)).rejects.toThrow(); });
it("does not silently fall back without streaming gzip", async () => {
  vi.stubGlobal("DecompressionStream", undefined); await expect(readIndexStream(stream(new Uint8Array([1])), true)).rejects.toThrow(/unavailable/);
});
it("aborts a pending reader and rejects rather than returning partial bytes", async () => {
  const control = new AbortController(); let cancelled = false;
  const source = new ReadableStream<Uint8Array>({ cancel() { cancelled = true; } });
  const pending = collectBounded(source, 128, control.signal); control.abort();
  await expect(pending).rejects.toMatchObject({ name: "AbortError" }); expect(cancelled).toBe(true);
});
it("bounds empty-chunk streams as well as byte count", async () => {
  const source = new ReadableStream<Uint8Array>({ pull(c) { c.enqueue(new Uint8Array()); } });
  await expect(collectBounded(source, 16)).rejects.toThrow(/chunk/);
});
