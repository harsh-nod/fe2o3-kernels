import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import publicationGate from "../config/publication-gate.json";

const pagesWorkflow = readFileSync(
  ".github/workflows/pages.yml",
  "utf8",
);
const ciWorkflow = readFileSync(
  ".github/workflows/ci.yml",
  "utf8",
);

describe("Pages publication policy", () => {
  it("pins the exact dual-repository gate in one checked-in config", () => {
    expect(publicationGate).toEqual({
      requiredCommit: "3874a0c76b3e90f73ea8782b54bb6a45ea94f04d",
      requiredTree: "464c1849d3c7f083598c66336e89dfe7e6f6e83b",
      requiredRefs: [
        { repository: "harsh-nod/fe2o3", ref: "refs/heads/main" },
        { repository: "powderluv/fe2o3", ref: "refs/heads/main" },
      ],
    });
  });

  it("fails closed on malformed refs, commits, and trees", () => {
    const output = execFileSync(
      process.execPath,
      ["scripts/enforce-publication-gate.mjs", "--self-test"],
      { cwd: process.cwd(), encoding: "utf8", stdio: "pipe" },
    );
    expect(output).toContain("publication gate self-test: passed");
    const gateSource = readFileSync(
      "scripts/enforce-publication-gate.mjs",
      "utf8",
    );
    expect(gateSource).toContain('"tree mismatch"');
    expect(gateSource).toContain('"malformed Git tree"');
  });

  it("runs the authenticated gate before every Pages build and deploy step", () => {
    const gate = pagesWorkflow.indexOf(
      "name: Enforce dual-repository publication gate",
    );
    const install = pagesWorkflow.indexOf("name: Install dependencies");
    const build = pagesWorkflow.indexOf("name: Validate and build");
    const configure = pagesWorkflow.indexOf("name: Configure Pages");
    const upload = pagesWorkflow.indexOf("name: Upload Pages artifact");
    const deploy = pagesWorkflow.indexOf("name: Deploy to GitHub Pages");

    expect(gate).toBeGreaterThan(0);
    expect(gate).toBeLessThan(install);
    expect(gate).toBeLessThan(build);
    expect(gate).toBeLessThan(configure);
    expect(gate).toBeLessThan(upload);
    expect(gate).toBeLessThan(deploy);
    expect(pagesWorkflow).toContain("GITHUB_TOKEN: ${{ github.token }}");
    expect(pagesWorkflow).toContain(
      "run: node scripts/enforce-publication-gate.mjs",
    );
    expect(readFileSync("scripts/enforce-publication-gate.mjs", "utf8")).toContain(
      "/git/commits/${commit}",
    );
  });

  it("uses only commit-pinned actions and keeps pull requests non-deploying", () => {
    const actionUses = [
      ...pagesWorkflow.matchAll(/^\s*uses:\s*(\S+)(?:\s+#.*)?$/gmu),
    ].map((match) => match[1]);
    expect(actionUses.length).toBeGreaterThan(0);
    expect(actionUses.every((use) => /^actions\/[\w-]+@[0-9a-f]{40}$/u.test(use))).toBe(
      true,
    );
    expect(pagesWorkflow).not.toMatch(/^\s*pull_request:/mu);
    expect(ciWorkflow).toMatch(/^\s*pull_request:/mu);
    expect(ciWorkflow).not.toContain("actions/deploy-pages");
  });
});
