import { defineConfig, devices } from "@playwright/test";

const previewMode = process.env.FE2O3_E2E_PREVIEW;
if (previewMode !== undefined && previewMode !== "1") throw new Error("FE2O3_E2E_PREVIEW accepts only the explicit value 1");
const productionPreview = previewMode === "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: 4,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://127.0.0.1:4173/fe2o3-kernels/",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: productionPreview
      ? `"${process.execPath}" node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort`
      : "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173/fe2o3-kernels/",
    reuseExistingServer: !productionPreview && !process.env.CI,
  },
});
