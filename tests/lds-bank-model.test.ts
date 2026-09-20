import { describe, expect, it } from "vitest";
import { compareModeledLdsWords, ldsBankDecimal, ldsBankProfile, modelLdsByteRange } from "../src/content/lds-bank-model";

function result(target: string, offset: string, length: string, base = "0") {
  const value = modelLdsByteRange(target, offset, length, base);
  if (value.status !== "modeled") throw new Error(value.detail);
  return value;
}
function touched(target: string, offset: string, length: string, base = "0") {
  return result(target, offset, length, base).banks.filter((bank) => bank.byteCount).map((bank) => [bank.bank, bank.byteCount]);
}

describe("bounded hypothetical LDS geometry", () => {
  it("selects explicit target profiles without prefix or feature guessing", () => {
    expect(ldsBankProfile("gfx942:xnack-")).toMatchObject({ architecture: "CDNA3", bankCount: 32, wordBytes: 4, periodBytes: 128 });
    expect(ldsBankProfile("gfx950:xnack-")).toMatchObject({ architecture: "CDNA4", bankCount: 64, wordBytes: 4, periodBytes: 256 });
    expect(ldsBankProfile("gfx942")?.bankCount).toBe(32);
    expect(ldsBankProfile("gfx950")?.bankCount).toBe(64);
    for (const target of [null, undefined, "gfx1100", "gfx94", "gfx942:xnack+", "gfx950:sramecc+:xnack-", "GFX942", "gfx942 "]) {
      expect(ldsBankProfile(target)).toBeNull();
      expect(modelLdsByteRange(target, "0", "4", "0")).toMatchObject({ status: "unavailable", reason: "target" });
    }
  });

  it.each([
    { target: "gfx942", offset: "3", length: "2", base: "0", bins: [[0, 1], [1, 1]] },
    { target: "gfx950", offset: "3", length: "2", base: "0", bins: [[0, 1], [1, 1]] },
    { target: "gfx942", offset: "124", length: "8", base: "0", bins: [[0, 4], [31, 4]] },
    { target: "gfx950", offset: "124", length: "8", base: "0", bins: [[31, 4], [32, 4]] },
    { target: "gfx942", offset: "252", length: "8", base: "0", bins: [[0, 4], [31, 4]] },
    { target: "gfx950", offset: "252", length: "8", base: "0", bins: [[0, 4], [63, 4]] },
    { target: "gfx942", offset: "3", length: "4", base: "0", bins: [[0, 1], [1, 3]] },
    { target: "gfx942", offset: "3", length: "4", base: "1", bins: [[1, 4]] },
    { target: "gfx950", offset: "9007199254740993", length: "4", base: "0", bins: [[0, 3], [1, 1]] },
    { target: "gfx942", offset: "18446744073709551611", length: "4", base: "0", bins: [[30, 1], [31, 3]] },
    { target: "gfx950", offset: "18446744073709551611", length: "4", base: "0", bins: [[62, 1], [63, 3]] },
  ])("matches independent address-table oracle $target/$offset/$length/$base", ({ target, offset, length, base, bins }) => {
    expect(touched(target, offset, length, base)).toEqual(bins);
  });

  it("matches a separate per-byte bit-mask oracle across boundary and residue cases", () => {
    // Arithmetic controls only: never source/GPU observations or native legality.
    for (const target of ["gfx942", "gfx950"]) {
      const bankCount = target === "gfx942" ? 32 : 64;
      for (const base of [0, 1, 3, 127]) for (const offset of [0, 3, 124, 252, 511]) for (const length of [1, 4, 16, 255, 256]) {
        const bytes = Array.from({ length: bankCount }, () => 0);
        const words = Array.from({ length: bankCount }, () => new Set<string>());
        for (let index = 0; index < length; index++) {
          const address = BigInt(base + offset + index);
          const bank = Number((address >> 2n) & BigInt(bankCount - 1));
          bytes[bank]++;
          words[bank].add((address & ~3n).toString());
        }
        const value = result(target, String(offset), String(length), String(base));
        expect(value.banks.map((bank) => bank.byteCount)).toEqual(bytes);
        expect(value.banks.map((bank) => bank.distinctWords)).toEqual(words.map((set) => set.size));
        expect(value.words.length).toBeLessThanOrEqual(65);
      }
    }
  });

  it("keeps one-range bounds explicit and never substitutes a prefix", () => {
    const value = result("gfx950", "1", "256", "0");
    expect(value.words).toHaveLength(65);
    expect(value.banks).toHaveLength(64);
    expect(value.banks.reduce((sum, bank) => sum + bank.byteCount, 0)).toBe(256);
    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.words[0])).toBe(true);
    expect(modelLdsByteRange("gfx950", "1", "257", "0")).toMatchObject({ status: "unavailable", reason: "range_limit" });
    expect(modelLdsByteRange("gfx942", "0", "0", "0")).toMatchObject({ status: "unavailable", reason: "range" });
  });

  it("refuses noncanonical or inexact integers and checked exclusive-end overflow", () => {
    for (const input of [0, 1n, null, undefined, "", "00", "01", "+1", "-1", "1e2", " 1", "1.0", "18446744073709551616"]) {
      expect(ldsBankDecimal(input)).toBeNull();
      expect(modelLdsByteRange("gfx942", input, "4", "0").status).toBe("unavailable");
    }
    expect(modelLdsByteRange("gfx942", "18446744073709551615", "1", "0")).toMatchObject({ reason: "overflow" });
    expect(modelLdsByteRange("gfx950", "18446744073709551611", "1", "4")).toMatchObject({ reason: "overflow" });
    expect(modelLdsByteRange("gfx942", "0", "4", "128")).toMatchObject({ reason: "base" });
    expect(modelLdsByteRange("gfx950", "0", "4", "256")).toMatchObject({ reason: "base" });
    expect(modelLdsByteRange("gfx950", "0", "4", "025")).toMatchObject({ reason: "base" });
  });

  it("distinguishes same-word arithmetic from different-word bank collisions without multicast claims", () => {
    expect(compareModeledLdsWords("gfx942", "0", "0")).toBe("same_word");
    expect(compareModeledLdsWords("gfx942", "0", "128")).toBe("distinct_words_same_bank");
    expect(compareModeledLdsWords("gfx950", "0", "128")).toBe("different_banks");
    expect(compareModeledLdsWords("gfx950", "0", "256")).toBe("distinct_words_same_bank");
    for (const pair of [["1", "4"], ["0", "18446744073709551612"], ["0", "4.0"]]) {
      expect(compareModeledLdsWords("gfx942", pair[0], pair[1])).toBe("unavailable");
    }
    expect(compareModeledLdsWords("gfx1100", "0", "0")).toBe("unavailable");
  });
});
