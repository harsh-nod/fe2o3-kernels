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
const pagesProductionContext =
  "if: github.repository == 'harsh-nod/fe2o3-kernels' && github.ref == 'refs/heads/main'";

describe("Pages publication policy", () => {
  it("pins one exact compiler object contained by both public refs", () => {
    expect(publicationGate).toEqual({
      requiredCommit: "52f4d5a0c2f4a1587377cbd669019af5dbdb8484",
      requiredTree: "8efc566f7bf69bdea1277d18de89c413a1354e22",
      requiredRefRelationship: "contains-required-commit",
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
    expect(readFileSync("scripts/enforce-publication-gate.mjs", "utf8")).toContain(
      "/compare/${requiredCommit}...${observedHead}",
    );
  });

  it("fails closed outside the canonical repository main ref", () => {
    expect(pagesWorkflow.split(pagesProductionContext)).toHaveLength(3);

    const buildJob = pagesWorkflow.indexOf("  build:");
    const buildGuard = pagesWorkflow.indexOf(pagesProductionContext, buildJob);
    const deployJob = pagesWorkflow.indexOf("  deploy:");
    const deployGuard = pagesWorkflow.indexOf(pagesProductionContext, deployJob);

    expect(buildGuard).toBeGreaterThan(buildJob);
    expect(buildGuard).toBeLessThan(deployJob);
    expect(deployGuard).toBeGreaterThan(deployJob);
  });

  it("runs browser tests for the build checkout before publishing it", () => {
    const checkout = pagesWorkflow.indexOf("name: Check out repository");
    const build = pagesWorkflow.indexOf("name: Validate and build");
    const installBrowser = pagesWorkflow.indexOf("name: Install Chromium");
    const browserTests = pagesWorkflow.indexOf("name: Run browser tests");
    const configure = pagesWorkflow.indexOf("name: Configure Pages");
    const upload = pagesWorkflow.indexOf("name: Upload Pages artifact");

    expect(checkout).toBeGreaterThan(0);
    expect(pagesWorkflow.match(/name: Check out repository/gu)).toHaveLength(1);
    expect(installBrowser).toBeGreaterThan(build);
    expect(browserTests).toBeGreaterThan(installBrowser);
    expect(browserTests).toBeLessThan(configure);
    expect(browserTests).toBeLessThan(upload);
    expect(pagesWorkflow).toContain(
      "run: npx playwright install --with-deps chromium",
    );
    expect(pagesWorkflow).toContain("run: npm run test:e2e");
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
