import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const marker = "\n### Lazy first-use proofs and read-only debugger replay\n";
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ").toLowerCase();
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("lazy proof and read-only replay qualification checkpoint", () => {
  it("preserves the previous tutorial byte-for-byte", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(62986);
    expect(sha256(prefix)).toBe("cc85cfd5a3a9796f0778b9666398ef439ecb95a4a7730fc1c8144dfb5523c138");
  });
  it("keeps component and native acceptance distinct", () => {
    for (const text of ["original preparation loan is consumed once","reservation before moving","cannot restart","DATA, not a complete bounds operation","Twenty-six new controls passed","2,942 backend tests","38 lossless observation bodies and 52 artifacts","93 benign records and 310 startup records","not a combined 512 MiB claim","No scope owner, controller, debugger, target or GPU was invoked","drop before refund","M1/V1/V2/U1/U2/U3 (6/18)"]) expect(appendix).toContain(text.toLowerCase());
  });
  it("pins actual evidence without changing capture authority", () => {
    for (const hash of ["03ad28883fa8bd615baf71c54fe88508a5752ce3", "b6e603ed3582f5a4f0780839843f60c3a44dfb863ee237323351c7535f8277e3", "6dcd44c2f2fcc07c8f6faeee3fd3efe5e59962f8a2793f58cb700690cac31e45", "83a84030a13676d2c36793c980325b25f4201d078aba492bf649c34ef0b7b70f"]) expect(appendix).toContain(hash);
    const gate = readFileSync("config/publication-gate.json");
    expect(gate.length).toBe(376);
    expect(sha256(gate)).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
