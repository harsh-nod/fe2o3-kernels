import { describe, expect, it, vi } from "vitest";
import { assertRepeatNativeOuterText, repeatNativeEnvelopeBytes } from "../src/content/repeat-native-envelope.mjs";
import { copyRepeatNativeEvidence } from "../src/content/repeat-native-comparison.mjs";
import { repeatFixture } from "./fixtures/repeat-native-synthetic.mjs";

describe("repeat-native outer preflight before aggregate encoding or concatenation", () => {
  it("counts exact escaped UTF-8 JSON without building a whole encoded envelope", () => {
    for (const value of [
      { value: 'plain / " \\ \b\t\n\f\r \0\u001f' },
      { value: "\u00e9\u20ac\u2028\u2029\ud83d\ude00", values: [false, true, null, 0, 524288] },
      { array: ["", "\"", "\\", "\n", "\0"], inner: { punctuation: "[]{}:," } },
      repeatFixture().capsule,
    ]) {
      expect(repeatNativeEnvelopeBytes(value)).toBe(Buffer.byteLength(JSON.stringify(value)));
    }
  });
  it("rejects oversized raw strings before the shared parser's TextEncoder allocation", () => {
    const encode = vi.spyOn(TextEncoder.prototype, "encode");
    try {
      expect(() => copyRepeatNativeEvidence(" ".repeat(4194305))).toThrow(/outer JSON cap/u);
      expect(encode).not.toHaveBeenCalled();
      // Below the code-unit limit, but over the byte limit: still reject before allocation.
      expect(() => copyRepeatNativeEvidence("\u20ac".repeat(1398102))).toThrow(/outer JSON cap/u);
      expect(encode).not.toHaveBeenCalled();
      expect(() => assertRepeatNativeOuterText("\ud800")).toThrow(/Unicode/u);
      expect(() => assertRepeatNativeOuterText("\udc00")).toThrow(/Unicode/u);
      expect(encode).not.toHaveBeenCalled();
    } finally { encode.mockRestore(); }
  });
  it("enforces the exact outer byte boundary including escapes and surrogate pairs", () => {
    expect(() => assertRepeatNativeOuterText(" ".repeat(4194304))).not.toThrow();
    expect(() => assertRepeatNativeOuterText("\ud83d\ude00".repeat(1048576))).not.toThrow();
    expect(() => assertRepeatNativeOuterText("\ud83d\ude00".repeat(1048577))).toThrow(/outer JSON cap/u);
    // Quoted JSON of this bare string is exactly the full cap.
    expect(repeatNativeEnvelopeBytes("x".repeat(4194302))).toBe(4194304);
    expect(() => repeatNativeEnvelopeBytes("x".repeat(4194303))).toThrow(/outer JSON cap/u);
    expect(() => repeatNativeEnvelopeBytes("\0".repeat(699051))).toThrow(/outer JSON cap/u);
  });
  it("rejects escaped object envelopes before JSON.stringify or large TextEncoder work", () => {
    const { capsule } = repeatFixture();
    for (let at = 0; at < 3; at++) {
      capsule.artifacts[at].bytes = 524288;
      capsule.artifacts[at].chunks = Array(8).fill("\0".repeat(65536));
    }
    const stringify = vi.spyOn(JSON, "stringify"), encode = vi.spyOn(TextEncoder.prototype, "encode");
    try {
      expect(() => copyRepeatNativeEvidence(capsule)).toThrow(/outer JSON cap/u);
      expect(stringify).not.toHaveBeenCalled();
      expect(encode.mock.calls.every(([value]) => (value?.length ?? 0) <= 65536)).toBe(true);
    } finally { stringify.mockRestore(); encode.mockRestore(); }
  });
  it("retains the same valid object result without whole-envelope serialization", () => {
    const { capsule } = repeatFixture(), stringify = vi.spyOn(JSON, "stringify");
    try {
      expect(copyRepeatNativeEvidence(capsule).artifacts).toHaveLength(23);
      expect(stringify).not.toHaveBeenCalled();
    } finally { stringify.mockRestore(); }
  });
  it("bounds direct helper use and rejects malformed Unicode and sparse structures", () => {
    const nested = { a: { b: { c: { d: { e: "too deep" } } } } };
    expect(() => repeatNativeEnvelopeBytes(nested)).toThrow(/shape/u);
    expect(() => repeatNativeEnvelopeBytes(Array(24).fill(0))).toThrow(/array/u);
    expect(() => repeatNativeEnvelopeBytes(Array(2))).toThrow(/Sparse/u);
    expect(() => repeatNativeEnvelopeBytes({ text: "\ud800" })).toThrow(/Unicode/u);
    expect(() => repeatNativeEnvelopeBytes({ text: "\udc00" })).toThrow(/Unicode/u);
    expect(() => repeatNativeEnvelopeBytes(undefined)).toThrow();
  });
});
