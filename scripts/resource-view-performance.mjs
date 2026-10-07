#!/usr/bin/env node
// CPU/browser diagnostic timing only. No GPU timing, build, capture fabrication,
// package installation, publication, or mutation of the application route tree.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { cpus, platform, arch, release } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { chromium } from "@playwright/test";

export function distribution(values) {
  assert.ok(values.length > 0 && values.length <= 100);
  assert.ok(Array.from(values).every((value) => Number.isFinite(value) && value >= 0));
  const sorted = [...values].sort((a, b) => a - b);
  return { samples: values.length, min: sorted[0], p50: sorted[Math.ceil(sorted.length * 0.5) - 1],
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1], max: sorted.at(-1), mean: values.reduce((sum, value) => sum + value, 0) / values.length };
}

export const PANEL_FIXTURES = Object.freeze([
  Object.freeze({ path: "examples/source_instruction_native_comparison_v1.json", bytes: 503416, sha256: "0b4a9689524965929d1e9b102d7802e737e068293f74fa28d0148ab49238cc04" }),
  Object.freeze({ path: "examples/authored_register_demand_v1.json", bytes: 7165, sha256: "8d3e66acdc04de0da8b5ee717be614bc0ea622eea482a25d415510892e5ea7c4" }),
  Object.freeze({ path: "examples/linked_region_lines_v1.json", bytes: 80466, sha256: "9723c87c2b2a5026f9c9e0e2767e31568c8b70751bb1288d961b00c51cec54b5" }),
]);
export const PANEL_CASES = Object.freeze(["authored_default_O0", "authored_default_O3",
  "authored_edited_O0", "authored_edited_O3", "linked_lines_O0_O3"]);
export function validatePanelFixture(bytes, pin) {
  assert.equal(bytes.length, pin.bytes);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), pin.sha256);
}
export function panelSummaries(cases, samples) {
  assert.ok(Number.isSafeInteger(samples) && samples > 0 && samples <= 100);
  assert.deepEqual(cases.map(item => item.name), PANEL_CASES);
  return cases.map((item, index) => {
    const authored = index < 4, rowLimit = authored ? 19 : 64;
    assert.equal(item.evidence_kind, authored ? "actual_retained_source_authored_demand_not_physical_allocation" :
      "actual_retained_cpu_linked_line_observation_not_runtime_addresses");
    assert.equal(item.input_bytes, authored ? PANEL_FIXTURES[0].bytes + PANEL_FIXTURES[1].bytes : PANEL_FIXTURES[2].bytes);
    assert.ok(item.input_bytes <= 512 * 1024);
    assert.ok(Number.isSafeInteger(item.input_rows) && item.input_rows > 0 && item.input_rows <= rowLimit);
    assert.equal(item.samples.length, samples);
    for (const sample of item.samples) {
      assert.equal(sample.rendered_rows, item.input_rows);
      assert.ok(Number.isSafeInteger(sample.dom_elements) && sample.dom_elements > sample.rendered_rows && sample.dom_elements <= 4096);
    }
    return { name: item.name, evidence_kind: item.evidence_kind, input_bytes: item.input_bytes, input_rows: item.input_rows,
      decode_ms: distribution(item.samples.map(value => value.decode_ms)),
      projection_ms: distribution(item.samples.map(value => value.projection_ms)),
      mount_ready_layout_ms: distribution(item.samples.map(value => value.mount_ready_layout_ms)),
      selection_roundtrip_ms: distribution(item.samples.map(value => value.selection_roundtrip_ms)),
      max_rendered_rows: Math.max(...item.samples.map(value => value.rendered_rows)),
      max_dom_elements: Math.max(...item.samples.map(value => value.dom_elements)) };
  });
}

async function main() {
  if (process.argv.length !== 3) throw new Error("usage: node scripts/resource-view-performance.mjs NEW_OUTPUT_DIRECTORY");
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const output = resolve(process.argv[2]);
  mkdirSync(output);
  const fixtureBytes = readFileSync(join(root, "examples/resource_query_v6.json"));
  const fixture = JSON.parse(fixtureBytes);
  assert.equal(fixture.evidence.fixture_kind, "actual_retained_source_produced_cpu_responses");
  const save = (name, value) => writeFileSync(join(output, name), `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
  for (const pin of PANEL_FIXTURES) validatePanelFixture(readFileSync(join(root, pin.path)), pin);
  const options = { samples: 30, warmup: 5 };
  let server, browser, timer;
  try {
    server = await createServer({ root, server: { host: "127.0.0.1", port: 0, strictPort: false }, logLevel: "error" });
    await server.listen();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultTimeout(30000);
    const address = server.httpServer.address();
    assert.ok(address && typeof address === "object");
    const url = `http://127.0.0.1:${address.port}${server.config.base}tests/performance/resource-access-harness.html`;
    timer = setTimeout(() => { void browser?.close(); }, 120000);
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForFunction(() => typeof window.runResourcePerformance === "function");
    const measured = await page.evaluate((options) => window.runResourcePerformance(options), options);
    assert.equal(measured.fixture_bytes, fixtureBytes.length);
    assert.equal(measured.visible_row_bound, 64);
    for (const item of measured.cases) {
      assert.equal(item.samples.length, options.samples);
      assert.ok(item.input_rows <= 256);
      assert.ok(item.samples.every((sample) => sample.rendered_rows <= 64));
    }
    const panelCases = panelSummaries(measured.panel_cases, options.samples);
    const report = { schema: "fe2o3-resource-view-diagnostic-performance-v2", classification: "CPU_browser_tooling_diagnostic_not_GPU_performance",
      measured_at: new Date().toISOString(), measurement_script_sha256: createHash("sha256").update(readFileSync(fileURLToPath(import.meta.url))).digest("hex"),
      measurement_harness_sha256: createHash("sha256").update(readFileSync(join(root, "tests/performance/resource-access-harness.tsx"))).digest("hex"),
      environment: { node: process.version, platform: platform(), arch: arch(), os_release: release(), cpu_model: cpus()[0]?.model ?? "unavailable", logical_cpus: cpus().length, browser: await browser.version(), user_agent: measured.user_agent, viewport: [1280, 800], vite_mode: "development_warmed_modules_no_React_StrictMode" },
      fixture: { path: "examples/resource_query_v6.json", sha256: createHash("sha256").update(fixtureBytes).digest("hex"), bytes: fixtureBytes.length, source_response_sha256: fixture.evidence.debug_responses_sha256 },
      panel_fixtures: PANEL_FIXTURES,
      panel_cases: panelCases,
      panel_timing_semantics: { decode: "JSON.parse of exact retained input bytes; paired native+demand for authored cases",
        projection: "await complete real async projector, including byte/hash/semantic guards",
        mount_ready_layout: "fresh component mount with its independent async projection, expected semantic DOM and synchronous layout; animation-frame polling is included, not paint",
        selection_roundtrip: "real select then reset clicks, each awaited through identity-bound semantic DOM and layout; includes animation-frame polling",
        authored_interaction: "first authored value select/deselect", linked_interaction: "O0 to O3 to O0, checking selected ELF identity and coverage rows",
        reset: "component unmounted to empty baseline before every sample; modules/browser caches remain warm" },
      panel_budget_status: "measurement_only_no_adopted_latency_SLO",
      options, limits: { max_input_bytes: 512 * 1024, max_query_rows: 256, max_rendered_rows: 64, process_timeout_ms: 120000, panel_ready_timeout_ms: 10000, panel_ready_frame_limit: 600, max_panel_dom_elements: 4096 },
      timing_semantics: { decode: "JSON.parse of exact paired page input; network/module loading excluded", projection: "closed presentation guards plus immutable copy", render: "React synchronous mount, including its projection, DOM commit and synchronous layout; excludes asynchronous paint/GPU work" },
      diagnostic_budgets_ms: { actual_page_projection_p95: 25, actual_page_render_p95: 100, synthetic_256_row_render_p95: 250 },
      cases: measured.cases.map((item) => ({ name: item.name, evidence_kind: item.evidence_kind, input_bytes: item.input_bytes, input_rows: item.input_rows,
        decode_ms: distribution(item.samples.map((sample) => sample.decode_ms)), projection_ms: distribution(item.samples.map((sample) => sample.projection_ms)),
        render_commit_layout_ms: distribution(item.samples.map((sample) => sample.render_commit_layout_ms)), max_rendered_rows: Math.max(...item.samples.map((sample) => sample.rendered_rows)), max_dom_elements: Math.max(...item.samples.map((sample) => sample.dom_elements)) })),
      heap_if_exposed_bytes: measured.heap_if_exposed_bytes, heap_interpretation: "optional browser-exposed observation; not process RSS or an allocation-cap guarantee", hardware_observed: false };
    report.diagnostic_budget_results = report.cases.map((item) => ({ name: item.name,
      projection_within_advisory_budget: item.projection_ms.p95 <= report.diagnostic_budgets_ms.actual_page_projection_p95,
      render_within_advisory_budget: item.render_commit_layout_ms.p95 <= (item.evidence_kind.startsWith("synthetic") ? report.diagnostic_budgets_ms.synthetic_256_row_render_p95 : report.diagnostic_budgets_ms.actual_page_render_p95) }));
    for (const pin of PANEL_FIXTURES) validatePanelFixture(readFileSync(join(root, pin.path)), pin);
    save("samples.json", measured);
    save("receipt.json", report);
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    save("failure.json", { status: "failed", message: String(error), hardware_observed: false });
    throw error;
  } finally {
    clearTimeout(timer);
    await browser?.close();
    await server?.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
