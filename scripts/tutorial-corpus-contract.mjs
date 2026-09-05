import { createHash } from "node:crypto";

export const TUTORIAL_CORPUS_CONTRACT_DOMAIN = Buffer.from(
  "fe2o3-tutorial-kernel-corpus-contract-v1\0",
  "ascii",
);

function asciiString(value) {
  return JSON.stringify(value).replace(/[\u0080-\u{10ffff}]/gu, (character) => {
    const point = character.codePointAt(0);
    if (point <= 0xffff) return `\\u${point.toString(16).padStart(4, "0")}`;
    const adjusted = point - 0x10000;
    const high = 0xd800 + (adjusted >> 10);
    const low = 0xdc00 + (adjusted & 0x3ff);
    return `\\u${high.toString(16).padStart(4, "0")}\\u${low.toString(16).padStart(4, "0")}`;
  });
}

function canonicalJson(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return asciiString(value);
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      throw new TypeError("tutorial corpus contract numbers must be safe integers");
    }
    return String(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${asciiString(key)}:${canonicalJson(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  throw new TypeError(`tutorial corpus contract contains unsupported ${typeof value}`);
}

export function tutorialCorpusContractSha256(document) {
  if (document === null || typeof document !== "object" || Array.isArray(document)) {
    throw new TypeError("tutorial corpus manifest must be an object");
  }
  if (!Object.hasOwn(document, "baseline")) {
    throw new TypeError("tutorial corpus manifest lacks baseline publication metadata");
  }
  const contract = Object.fromEntries(
    Object.entries(document).filter(([key]) => key !== "baseline"),
  );
  return createHash("sha256")
    .update(TUTORIAL_CORPUS_CONTRACT_DOMAIN)
    .update(canonicalJson(contract), "ascii")
    .digest("hex");
}
