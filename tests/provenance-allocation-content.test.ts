import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const marker = "\n### Following real provenance into allocation contracts\n";
const at = source.indexOf(marker);
const appendix = source.slice(at).replace(/\s+/g, " ").toLowerCase();
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("genuine provenance and allocation qualification notes", () => {
  it("preserves the complete previously qualified tutorial", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(86123);
    expect(hash(prefix)).toBe("244b1d7a61be9d83f15b1ca70f7264a610fd3b9e3327158ad90f29a7090a6bd7");
  });
  it("distinguishes genuine intermediate data from production or hardware admission", () => {
    for (const text of ["BeforeCapabilitiesV1", "not a new public kernel-authoring API", "allocation_origins", "independent oracle", "does not use candidate origins", "ABI pointer provenance", "first resource denial", "dropped before refund", "14 component and 17 checkpoint controls", "3,315 backend tests", "36 numerical helper runs", "four contracts, two writable contracts and zero singleton", "nonempty singleton coverage is synthetic", "not validation of arbitrary edited assembly", "admission remain open", "M1/V1/V2/U1/U2/U3 (6/18)"])
      expect(appendix).toContain(text.toLowerCase());
  });
  it("pins both implementations and actual receipts without changing the public gate", () => {
    for (const sha of ["7f383faf446c46dddd5910fe5a7274e1f095b70e", "c5751cb7129c14245016388140e2c6b25638bab7", "67f9192344e45c93a48e7cb2fcf9b25baf6f6007940f5598ce79b9185bc85b05", "9ddee3f3b47ad8da7dd87872629683c4d6b21c71087518d32c54eaa648108e36"])
      expect(appendix).toContain(sha);
    expect(hash(readFileSync("config/publication-gate.json"))).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
