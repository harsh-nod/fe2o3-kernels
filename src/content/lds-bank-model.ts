/** Bounded arithmetic scenarios, not native transactions or performance facts.
 * Geometry comes from the named AMD profiles; interleaving/base are model inputs.
 * There is no capture decoder, allocation placement, instruction or wave model. */
export const LDS_BANK_RANGE_MAX_BYTES = 256n;
export const LDS_BANK_U64_MAX = 18_446_744_073_709_551_615n;
export const LDS_BANK_MODEL_REVISION = "lds-dword-interleave-1";

export interface LdsBankProfile {
  readonly target: string;
  readonly architecture: "CDNA3" | "CDNA4";
  readonly bankCount: 32 | 64;
  readonly wordBytes: 4;
  readonly periodBytes: 128 | 256;
}

export function ldsBankProfile(target: unknown): LdsBankProfile | null {
  if (target === "gfx942" || target === "gfx942:xnack-") {
    return Object.freeze({ target, architecture: "CDNA3", bankCount: 32, wordBytes: 4, periodBytes: 128 });
  }
  if (target === "gfx950" || target === "gfx950:xnack-") {
    return Object.freeze({ target, architecture: "CDNA4", bankCount: 64, wordBytes: 4, periodBytes: 256 });
  }
  return null; // No prefix/family inference or silently discarded target features.
}

export function ldsBankDecimal(value: unknown): bigint | null {
  if (typeof value !== "string" || !/^(0|[1-9][0-9]{0,19})$/u.test(value)) return null;
  const number = BigInt(value);
  return number <= LDS_BANK_U64_MAX ? number : null;
}

export interface ModeledLdsWord {
  readonly address: string;
  readonly bank: number;
  readonly firstByte: number;
  readonly byteCount: number;
}
export interface ModeledLdsBank {
  readonly bank: number;
  readonly distinctWords: number;
  readonly byteCount: number;
}
export type LdsBankRangeModel = {
  readonly status: "modeled";
  readonly modelRevision: typeof LDS_BANK_MODEL_REVISION;
  readonly profile: LdsBankProfile;
  /** Residue only, not a physical base, alignment observation or native address. */
  readonly assumedBaseResidue: string;
  readonly byteOffset: string;
  readonly byteLength: string;
  readonly normalizedStart: string;
  readonly normalizedEnd: string;
  readonly words: readonly ModeledLdsWord[];
  readonly banks: readonly ModeledLdsBank[];
} | { readonly status: "unavailable"; readonly reason: "target" | "range" | "range_limit" | "base" | "overflow"; readonly detail: string };

export function modelLdsByteRange(target: unknown, byteOffset: unknown, byteLength: unknown, baseResidue: unknown): LdsBankRangeModel {
  const unavailable = (reason: Extract<LdsBankRangeModel, { status: "unavailable" }>["reason"], detail: string): LdsBankRangeModel =>
    ({ status: "unavailable", reason, detail });
  const profile = ldsBankProfile(target);
  if (!profile) return unavailable("target", "The caller-owned target has no supported LDS geometry profile.");
  const offset = ldsBankDecimal(byteOffset), length = ldsBankDecimal(byteLength), base = ldsBankDecimal(baseResidue);
  if (offset === null || length === null || length === 0n) return unavailable("range", "A nonempty canonical unsigned byte range is required.");
  if (offset + length > LDS_BANK_U64_MAX) return unavailable("overflow", "The allocation-relative range exceeds the conservative u64 end bound.");
  if (length > LDS_BANK_RANGE_MAX_BYTES) return unavailable("range_limit", "Only one selected access of at most 256 bytes is modeled; no prefix is substituted.");
  if (base === null || base >= BigInt(profile.periodBytes)) return unavailable("base", "Choose a canonical assumed base residue within this profile's interleave period.");
  const start = base + offset, end = start + length;
  if (end > LDS_BANK_U64_MAX) return unavailable("overflow", "The assumed-base addition exceeds the conservative u64 end bound.");
  const words: ModeledLdsWord[] = [];
  const banks: ModeledLdsBank[] = Array.from({ length: profile.bankCount }, (_, bank) => ({ bank, distinctWords: 0, byteCount: 0 }));
  // At most 65 words for an unaligned 256-byte range. Never iterate byteOffset.
  for (let address = start - start % 4n; address < end; address += 4n) {
    const first = address < start ? start : address;
    const last = address + 4n > end ? end : address + 4n;
    const bank = Number((address / 4n) % BigInt(profile.bankCount));
    const byteCount = Number(last - first);
    words.push(Object.freeze({ address: address.toString(), bank, firstByte: Number(first - address), byteCount }));
    banks[bank] = { bank, distinctWords: banks[bank].distinctWords + 1, byteCount: banks[bank].byteCount + byteCount };
  }
  return Object.freeze({
    status: "modeled", modelRevision: LDS_BANK_MODEL_REVISION, profile,
    assumedBaseResidue: base.toString(), byteOffset: offset.toString(), byteLength: length.toString(),
    normalizedStart: start.toString(), normalizedEnd: end.toString(),
    words: Object.freeze(words), banks: Object.freeze(banks.map((bank) => Object.freeze(bank))),
  });
}

/** Pure aligned-address comparison, not a capture join or multicast detector.
 * Equal words must not be counted as different-word contention; instruction,
 * participants and native scheduling remain unknown in all three outcomes. */
export function compareModeledLdsWords(target: unknown, firstAddress: unknown, secondAddress: unknown):
  "same_word" | "distinct_words_same_bank" | "different_banks" | "unavailable" {
  const profile = ldsBankProfile(target), first = ldsBankDecimal(firstAddress), second = ldsBankDecimal(secondAddress);
  if (!profile || first === null || second === null || first % 4n !== 0n || second % 4n !== 0n ||
      first + 4n > LDS_BANK_U64_MAX || second + 4n > LDS_BANK_U64_MAX) return "unavailable";
  if (first === second) return "same_word";
  return (first / 4n) % BigInt(profile.bankCount) === (second / 4n) % BigInt(profile.bankCount)
    ? "distinct_words_same_bank" : "different_banks";
}
