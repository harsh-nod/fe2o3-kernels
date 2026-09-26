import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const marker = "\n### Source-use and borrowed-local components: what is still pending\n";
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ");
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("source-use and borrowed-local component checkpoint", () => {
  it("preserves the full published source-origin tutorial", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(46848);
    expect(sha256(prefix)).toBe("eff13727b63b69fe583e5de8f03b8e3559a24e83c139999ae11026e75ae38266");
  });

  it("keeps component tests distinct from actual-factory qualification", () => {
    for (const text of [
      "not a new authoring API", "not an emitted operation index",
      "must not be called sequentially on the same started owner",
      "missing origin is data, not proof of a checked access",
      "Guard semantic sites remain unassigned",
      "new actual-source factories still require separate real-source qualification",
      "not inferred from the component or ordinary-path tests",
      "331 model tests", "2,723 backend tests", "189 ignored",
      "38 ordinary observation bodies", "52 artifacts",
    ]) expect(appendix).toContain(text);
  });

  it("pins completed evidence and keeps the global publication gate unchanged", () => {
    for (const hash of [
      "5425d43b6fc3cfca6e625e9bd04b83102d7a9baf53d55b816a7f2eb11593796f",
      "841e2202810a80be75fb38cd4c9bea44996e6860a24f8e26293b81c80560f941",
      "016005cc76a6aee210dcbb2f998bcc0fd057b03908f95fc0164d45e35611a403",
    ]) expect(appendix).toContain(hash);
    expect(appendix).toContain("8b20da0620702352275371526d80e588f2ba8aa2");
    expect(appendix).toContain("M1/V1/V2/U1/U2/U3 (6/18)");
    expect(appendix).toContain("No debugger startup, target execution or new physical capture is claimed");
    const gate = readFileSync("config/publication-gate.json");
    expect(gate.length).toBe(376);
    expect(sha256(gate)).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
