import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const marker = "\n### Operand preparation: preserve changes made before refusal\n";
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ").toLowerCase();
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("uniform operand qualification checkpoint", () => {
  it("preserves the previous tutorial byte-for-byte", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(57222);
    expect(sha256(prefix)).toBe("a4389512720bc6b87fc0d31feada38d7c2567692a36d0c88385d2c61c0137895");
  });

  it("distinguishes qualified components from complete source admission", () => {
    for (const text of ["does not add a new public authoring API","does not undo that earlier change","caller's actual slots","prepaid together","Thirteen new controls passed","2,878 backend tests","38 observation bodies","52 artifacts","33 Rust and 299 Node","not a native build","M1/V1/V2/U1/U2/U3 (6/18)"]) expect(appendix).toContain(text.toLowerCase());
  });

  it("pins compiler evidence without changing capture authority", () => {
    for (const hash of ["541c1c4d7d52e8711b5aee28943fe6bb4072a6e0", "69fb48571ca1641f97f323df12a1eb7ca5958cc6a106255b64fe8d2eb4563441", "b7df8a534a4702f22898ed39ebd19054955674d733de2db727ff292378e1769d"]) expect(appendix).toContain(hash);
    const gate = readFileSync("config/publication-gate.json");
    expect(gate.length).toBe(376);
    expect(sha256(gate)).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
