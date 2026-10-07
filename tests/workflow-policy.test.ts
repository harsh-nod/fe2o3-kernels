import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import publicationGate from "../config/publication-gate.json";
import packageMetadata from "../package.json";

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
  it("includes script and authoring tests in the production validation chain", () => {
    expect(packageMetadata.scripts["test:scripts"]).toBe(
      "node --test scripts/*.test.mjs scripts/tests/*.test.mjs",
    );
    expect(packageMetadata.scripts.validate.split(" && ")).toEqual([
      "npm run lint",
      "npm run typecheck",
      "npm run test",
      "npm run test:scripts",
      "npm run test:authoring-lab",
      "npm run build",
    ]);
    expect(pagesWorkflow).toMatch(/^\s*run: npm run validate\s*$/mu);
    expect(ciWorkflow).toMatch(/^\s*run: npm run validate\s*$/mu);
  });

  it("pins one exact compiler object contained by both public refs", () => {
    expect(publicationGate).toEqual({
      requiredCommit: "308d8fa00fa41e098b2a1a47bbfea1bc29735464",
      requiredTree: "aee01674fefa733731db35eae1a1705b3286179e",
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
    expect(output).toContain("curriculum publication pin self-test: passed");
    const gateSource = readFileSync(
      "scripts/enforce-publication-gate.mjs",
      "utf8",
    );
    expect(gateSource).toContain('"tree mismatch"');
    expect(gateSource).toContain('"malformed Git tree"');
    expect(gateSource).toContain("../config/curriculum-source-contract.json");
    expect(gateSource).toContain("for (const pin of pins)");
    expect(gateSource).toContain("const pins = requiredPublicationPins(policy,");
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

describe("Built-panel publication validation", () => {
  const command = "npm run test:e2e -- e2e/authored-register-demand.spec.ts e2e/linked-region-lines.spec.ts --project=desktop --project=mobile --workers=1 --retries=0";
  const step = `      - name: Run built panel browser tests
        env:
          FE2O3_E2E_PREVIEW: "1"
        run: ${command}

`;
  const cases = [
    { name: "CI", workflow: ciWorkflow, build: "Validate content and production build", boundary: "Upload Playwright report on failure" },
    { name: "Pages", workflow: pagesWorkflow, build: "Validate and build", boundary: "Configure Pages" },
  ];

  function requireBuiltPanelGate(workflow: string, build: string, boundary: string) {
    const steps = workflow.split(/^ {6}- name: /mu).slice(1);
    const named = (name: string) => steps.filter(value => value.startsWith(name + "\n"));
    const selected = named("Run built panel browser tests");
    if (selected.length !== 1 || selected[0].trimEnd() !== step.replace("      - name: ", "").trimEnd())
      throw new Error("built-panel gate: exact required preview step differs");
    const original = named("Run browser tests");
    if (original.length !== 1 || original[0].trimEnd() !== "Run browser tests\n        run: npm run test:e2e")
      throw new Error("built-panel gate: original full development suite differs");
    const built = named(build);
    if (built.length !== 1 || built[0].trimEnd() !== build + "\n        run: npm run validate")
      throw new Error("built-panel gate: successful production build must remain required");
    const position = (name: string) => workflow.indexOf("      - name: " + name + "\n");
    if (!(position(build) >= 0 && position(build) < position("Run browser tests")
      && position("Run browser tests") < position("Run built panel browser tests")
      && position("Run built panel browser tests") < position(boundary)))
      throw new Error("built-panel gate: build/test/publication order differs");
  }

  it.each(cases)("$name requires the focused built route after the unchanged full suite", ({ workflow, build, boundary }) => {
    expect(() => requireBuiltPanelGate(workflow, build, boundary)).not.toThrow();
    expect(workflow.match(/FE2O3_E2E_PREVIEW:/gu)).toHaveLength(1);
  });

  it.each(cases)("$name rejects omission, weakened preview and failure suppression", ({ workflow, build, boundary }) => {
    for (const changed of [
      workflow.replace(step, ""),
      workflow.replace('          FE2O3_E2E_PREVIEW: "1"\n', ""),
      workflow.replace('FE2O3_E2E_PREVIEW: "1"', 'FE2O3_E2E_PREVIEW: "0"'),
      workflow.replace("      - name: Run built panel browser tests\n", "      - name: Run built panel browser tests\n        continue-on-error: true\n"),
      workflow.replace("      - name: Run built panel browser tests\n", "      - name: Run built panel browser tests\n        if: false\n"),
      workflow.replace(command, command.replace("--retries=0", "--retries=1")),
      workflow.replace(step, step + step),
    ]) {
      expect(changed).not.toBe(workflow);
      expect(() => requireBuiltPanelGate(changed, build, boundary)).toThrow(/^built-panel gate:/u);
    }
  });

  it.each(cases)("$name rejects testing before build or after the publication boundary", ({ workflow, build, boundary }) => {
    const without = workflow.replace(step, "");
    for (const changed of [
      without.replace("      - name: " + build + "\n", step + "      - name: " + build + "\n"),
      without + "\n" + step,
      workflow.replace("        run: npm run validate\n", "        run: echo build omitted\n"),
      workflow.replace("        run: npm run test:e2e\n", "        run: echo full suite omitted\n"),
    ]) {
      expect(changed).not.toBe(workflow);
      expect(() => requireBuiltPanelGate(changed, build, boundary)).toThrow(/^built-panel gate:/u);
    }
  });
});
