import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const compilerCommit = "13a86af6283a24f9b78a844fd84fd0cac6a5a89a";
const normalReceipt = "05ea729725cd2be5277d091bcc1a007abdd8b8816015221c4a4c706992ba18a5";
const cumulativeReceipt = "dc519fc3a8ed4cb95b8ba5738ccbb8fbd50066eb8c9b546a435962ff9b35b418";
const directReceipt = "6ffc8bee869451f22124add1b172cd24133da580fa0471ebecd7f0c902b01d28";
const source = readFileSync("docs/source-bound-assertion-analysis-v1.md", "utf8");
const marker = "\n### Actual guarded-access preparation: preserve the same assembly\n";
const at = source.indexOf(marker);
const raw = source.slice(at);
const appendix = raw.replace(/\s+/g, " ");
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("actual retained-input guarded-access checkpoint", () => {
  it("preserves the entire published prefix/index tutorial", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at), "utf8");
    expect(prefix.length).toBe(35130);
    expect(sha256(prefix)).toBe("aef6642b615614afebf0c337c3a1b1ddaafa55507dc23f93440d853e6f119ec8");
  });

  it("keeps the actual owner and value namespace without presenting a runnable API", () => {
    for (const text of [
      "private actual-input connector", "not a new source API, runnable assembly syntax or launch command",
      "out.get_mut(thread::index_1d())", "conditional store through the returned reference",
      "non-executable sketch", "ExecutionLayout; InvocationIndex %0",
      "ViewInSpace %1; next_value = 2",
      "same pending assembly and original work ledger",
      "No independently prepared zero-based graph is promoted or renumbered",
      "Only the existing identity accessor", "other producer families have not been enabled",
      "Summary counts alone are not this verification",
    ]) expect(appendix).toContain(text);
    expect(raw).not.toMatch(new RegExp(String.fromCharCode(96).repeat(3) + "(?:rust|asm|bash|sh)\\b", "u"));
  });

  it("does not conflate an accessor call with a memory-use site or extent proof", () => {
    for (const text of [
      "has not yet joined the later store's semantic use site",
      "accessor call and the memory-use site are different",
      "semantic_site = None", "until the real dereference/store is projected",
      "proposed output extent is not whole-slice equivalence",
      "Counts, copied inputs and matching values cannot establish source custody or readiness",
      "Reference-origin joins, actual memory-use sites, guards/CFG/assertions",
      "complete effects, bounds/reference-write checks and launch/placement",
      "complete unverified root recipe and mandatory verification",
    ]) expect(appendix).toContain(text);
  });

  it("states logical resource scope, payload oracles, and actual test counts", () => {
    for (const text of [
      "outer pending owner through postflights",
      "drops those payloads before releasing their accepted storage credits",
      "including nonzero capacity, foreign ledgers and retries refuse",
      "allocation, diagnostic, partial-emission and late-refusal ordering",
      "do not inject allocator/OOM failures",
      "callback error/panic controls occur after completed preparation, not at every allocation point",
      "compares every access/cache/predicate field and the emitted operation/ID sequence",
      "without calling the shared normalizer or emission helpers",
      "331 model tests", "2,654 backend tests", "189 ignored",
      "Eighteen new component tests and five new genuine-observer tests",
      "five fresh actual Rust sessions", "three operations, next value ID two",
      "one view, one guarded access and one predicate",
      "Wrong launch refuses before preparation", "2,026,119", "2,026,443",
      "not GPU timings or a performance improvement",
    ]) expect(appendix).toContain(text);
  });

  it("requires completed evidence and preserves the global publication gate", () => {
    expect(compilerCommit).toMatch(/^[0-9a-f]{40}$/u);
    for (const hash of [normalReceipt, cumulativeReceipt, directReceipt]) {
      expect(hash).toMatch(/^[0-9a-f]{64}$/u);
      expect(raw).toContain(hash);
    }
    expect(raw).toContain(
      "https://github.com/harsh-nod/fe2o3/blob/" + compilerCommit
      + "/docs/bf16-actual-guarded-access-qualification-20260926.md",
    );
    expect(raw).not.toMatch(/\{\{[^}]+\}\}/u);
    expect(raw).not.toContain("/home/harmenon");
    for (const text of [
      "complete nominal-helper route remains refused",
      "global compiler pin and route maturity are unchanged",
      "no new public source-custody or ready-token authority",
      "detached-input promotion, nominal LLVM continuation, GPU launch or debugger capture",
      "M1/V1/V2/U1/U2/U3 (6/18)",
    ]) expect(appendix).toContain(text);
    const gate = readFileSync("config/publication-gate.json");
    expect(gate.length).toBe(376);
    expect(sha256(gate)).toBe("88d5d71c4ee9a3e8c651e0f4836c7501092a5bd949b2037fdb6545e50b873c17");
  });
});
