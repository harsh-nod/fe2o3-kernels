import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const marker = "\n### Independent original constructor retention\n";
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ").toLowerCase();
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("independent original constructor retention", () => {
  it("preserves the preceding tutorial byte-for-byte", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(73338);
    expect(sha256(prefix)).toBe("d4bec6320f43ea986d22abfc7302cda08880c8734431f7392a380ab2610187d4");
  });
  it("distinguishes original constructor tests from genuine nonempty queries", () => {
    for (const text of ["production constructor unchanged", "same-Box panic", "all ten new controls passed", "356 model and 3,020 backend tests", "empty query caches", "not original query execution", "Separate component comparison budgets", "M1/V1/V2/U1/U2/U3 (6/18)"]) expect(appendix).toContain(text.toLowerCase());
  });
  it("pins qualification and preserves the public gate", () => {
    for (const hash of ["11e43b08c68dd1efc4acb246124218669770d31c", "1532dee9a08a6a5b352723e0e95bc222f8e718f18cfe53ad65116d16d95f576c", "80a3c7bb23dd46ca66392d5ef6199952cd2e421931e45eff69cedb580017992c"]) expect(appendix).toContain(hash);
    const gate = readFileSync("config/publication-gate.json");
    expect(gate.length).toBe(376);
    expect(sha256(gate)).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
