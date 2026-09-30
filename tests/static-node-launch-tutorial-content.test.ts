import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("docs/gfx950-one-stop-cpu-v1.md", "utf8");
const marker = "\n## 10. Bind the request, process and report separately\n";
const at = source.indexOf(marker);
const publicationCommit = "9aa6d199484529b83b9a5831b4c01e00565dd206";
const appendixSource = source.slice(at);
const appendix = appendixSource.replace(/\s+/g, " ").toLowerCase();

describe("static CPU launch tutorial stage boundaries", () => {
  it("preserves the whole published section-nine page as an exact prefix", () => {
    expect(at).toBeGreaterThan(0);
    expect(source.indexOf(marker, at + 1)).toBe(-1);
    const prefix = Buffer.from(source.slice(0, at));
    expect(prefix.length).toBe(24381);
    expect(createHash("sha256").update(prefix).digest("hex")).toBe("4291817b7716d97c89a209ad44dec1002a25acd2bdc588269b9dd1bccea6a841");
  });
  it("keeps draft-path and installed qualification separate from commit-bound publication", () => {
    for (const text of [
      "passed 61 fixture-free controls", "53 launch controls", "eight pure fresh-fixture preparation controls",
      "a128239a741b6234aa3ce5082607d07954bc5e283ac27cc19f222e23a09eceee",
      "actual draft-path request → read → adapter → report seam",
      "a later root-owned installed-path gate passed 263 combined fixture-free controls",
      "including the same 61 launcher controls",
      "one passing installed opt-in readback control",
      "d4eb928db788112ef7e24f16b92f77708f12db4fbfd8ec275bfe2cec49fce06c",
      "fd3e3e4fb9e8cef5289eb728cf7be05e806c64a457b6fc1e2d3ca3908d648fbd",
      "12 named regular files totaling 425,112 bytes",
      "identify the same compiler commit",
      "these source links do not claim a fresh actual-cli run of the linked commit",
      "e35f1367ea4fe387b3ee8bd4cef7c908cb1bc20a67c118f670068939c4c2ad9c",
      "6bad1f1af49df83d3634e7e38f12a28ed02b62f476c765e882b430b5d3cea18e",
      "one passing opt-in real-filesystem control",
      "root qualified it in the selected installed compiler checkout",
      "the immutable source links above identify that separate publication stage",
      "without refreshing those historical qualification receipts",
      "tools/debugger/loaded-static-node/launch-controls.test.mjs",
      "tools/debugger/loaded-static-node/launch-fixture-controls.test.mjs",
      "must fail, not skip",
    ]) expect(appendix).toContain(text);
    // Root binds this value only after verifying the same immutable compiler
    // commit on both public main branches. The unbound draft must fail here.
    expect(publicationCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(publicationCommit).not.toMatch(/^0{40}$/);
    const links = Array.from(
      appendixSource.matchAll(/\]\(https:\/\/github\.com\/harsh-nod\/fe2o3\/(tree|blob)\/([^/\s)]+)\/([^\s)]+)\)/g),
      ([, kind, commit, path]) => ({ kind, commit, path }),
    );
    expect(links).toEqual([
      { kind: "tree", commit: publicationCommit, path: "tools/debugger/loaded-static-node" },
      { kind: "blob", commit: publicationCommit, path: "docs/static-node-loaded-launch-qualification-20260929.md" },
    ]);
  });
  it("keeps bootstrap pin authority outside closed request data", () => {
    for (const text of [
      "admitstaticlaunchrequest(requestbuffer, bootstrapbuffer, fixedcontext)",
      "whole content pin, six identity fields and ownership",
      "cannot grant its own read scope", "choose an import", "supply a command",
      "one canonical base64 bootstrap argument", "no extra node flags",
      "independently unselected alias target", "content and kind",
      "request-name overlap", "circular request self-pin", "independently named roles",
      "rather than an empty file",
    ]) expect(appendix).toContain(text);
  });
  it("preserves final bootstrap accounting and independent reporting currentness", () => {
    for (const text of [
      "| request bootstrap |", "| fixed adapter |", "| report |",
      "last pre-dispatch check", "elapsed origin starts at its first check",
      "absolute utc scope stays unchanged", "not permission to renew",
      "failure remains primary", "attempted reservations survive denial",
      "unknown partial capture", "does not authorize another input read or output write",
    ]) expect(appendix).toContain(text);
  });
  it("describes only a fresh opt-in filesystem seam with all output roles", () => {
    for (const text of [
      "65,537-byte target", "observed empty file", "separate absent name",
      "including all six identity fields and ownership", "changed mtime/ctime refuse",
      "opens stdout before binding", "lang=c", "lc_all=c", "path=/usr/bin:/bin",
      "opt-in qualification harness has now passed", "not a production debugger launcher",
      "12 named regular files totaling 451,889 bytes", "all 28 selected runtime/source/terminal domains",
      "retained their exact before/after identities", "not missing-evidence substitutes",
      "reader-observation-temporary", "reader-observation-final", "outer-receipt",
      "outer-stdout", "outer-stderr", "root-readback",
      "not a hard per-write cap", "independent child rss", "not global writer exclusion",
      "summary is intent", "exit code alone does not replace",
    ]) expect(appendix).toContain(text);
  });
  it("does not refresh history or promote physical debugger and maturity claims", () => {
    for (const text of [
      "never refreshes stale historical pins", "all fourteen operational evidence obligations remain external",
      "no gdb, attach, inferior, gpu dispatch or physical capture",
      "does not produce a vgpr heatmap", "live visualization",
      "does not renew expired native coordination", "v4 remains open",
      "m1/v1/v2/u1/u2/u3 (6/18)", "no global compiler pin or public support gate changes",
      "does not prove that the kernel's instructions, register allocation or arithmetic are correct",
    ]) expect(appendix).toContain(text);
    expect(appendix).not.toContain("fe2o3_pin=");
  });
});
