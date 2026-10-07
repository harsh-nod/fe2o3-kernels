import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { distribution, PANEL_FIXTURES, PANEL_CASES, panelSummaries, validatePanelFixture } from "./resource-view-performance.mjs";

test("diagnostic quantiles use nearest ranks and do not mutate inputs", () => {
  const values = [3, 0, 2, 1];
  assert.deepEqual(distribution(values), { samples: 4, min: 0, p50: 1, p95: 3, max: 3, mean: 1.5 });
  assert.deepEqual(values, [3, 0, 2, 1]);
});
test("measurement sample budgets reject invalid or oversized data", () => {
  for (const values of [[], Array(3), Array(101).fill(1), [-1], [NaN], [Infinity]]) assert.throws(() => distribution(values));
});

function panelFixture() {
  return PANEL_CASES.map((name, index) => ({ name,
    evidence_kind: index < 4 ? "actual_retained_source_authored_demand_not_physical_allocation" : "actual_retained_cpu_linked_line_observation_not_runtime_addresses",
    input_bytes: index < 4 ? PANEL_FIXTURES[0].bytes + PANEL_FIXTURES[1].bytes : PANEL_FIXTURES[2].bytes,
    input_rows: 3, samples: [{ decode_ms: 1, projection_ms: 2, mount_ready_layout_ms: 3, selection_roundtrip_ms: 4, rendered_rows: 3, dom_elements: 20 }] }));
}
test("fixed actual panel inventory and separate async metrics are complete", () => {
  const input = panelFixture(), copy = structuredClone(input), result = panelSummaries(input, 1);
  assert.deepEqual(input, copy); assert.equal(result.length, 5);
  assert.equal(result[0].mount_ready_layout_ms.p95, 3);
  assert.equal(result[4].selection_roundtrip_ms.p95, 4);
  assert.equal("render_commit_layout_ms" in result[0], false);
});
test("panel summaries reject missing, duplicate, reordered and unvalidated cases", () => {
  for (const mutate of [x => x.pop(), x => { x[1] = x[0]; }, x => x.reverse(),
    x => { x[0].evidence_kind = "synthetic"; }, x => { x[0].input_bytes++; },
    x => { x[0].input_rows = 20; }, x => { x[4].input_rows = 65; },
    x => { x[0].samples[0].rendered_rows = 0; }, x => { x[0].samples[0].dom_elements = 4097; }]) {
    const input = panelFixture(); mutate(input); assert.throws(() => panelSummaries(input, 1));
  }
});
test("every async metric and sample count is bounded and required", () => {
  for (const key of ["decode_ms", "projection_ms", "mount_ready_layout_ms", "selection_roundtrip_ms"]) {
    for (const bad of [undefined, -1, NaN, Infinity]) {
      const input = panelFixture(); input[0].samples[0][key] = bad;
      assert.throws(() => panelSummaries(input, 1));
    }
  }
  for (const count of [0, 2, 101, 1.5]) assert.throws(() => panelSummaries(panelFixture(), count));
});
test("all actual retained panel bytes are pinned; equal-size substitution refuses", () => {
  for (const pin of PANEL_FIXTURES) {
    const bytes = readFileSync(new URL("../" + pin.path, import.meta.url));
    validatePanelFixture(bytes, pin);
    const changed = Buffer.from(bytes); changed[changed.length - 1] ^= 1;
    assert.throws(() => validatePanelFixture(changed, pin));
    assert.throws(() => validatePanelFixture(bytes.subarray(1), pin));
  }
});
test("real async panels and identity-bound interaction endpoints remain in the existing harness", () => {
  const text = readFileSync(new URL("../tests/performance/resource-access-harness.tsx", import.meta.url), "utf8");
  for (const token of ["await projectAuthoredDemand", "await projectLinkedRegionLines", "<AuthoredRegisterDemand",
    "<LinkedRegionLines", 'selected("O3")', 'selected("O0")', "model.reportSha256", "model.payload.sha256",
    "panel refused retained input", "panel ready budget exceeded", 'root.render(<p>Empty baseline</p>)'])
    assert.ok(text.includes(token), token);
  assert.ok(!text.includes("setTimeout"));
});

test("published observation retains all raw samples and exactly recomputes panel summaries", () => {
  const evidence = JSON.parse(readFileSync(new URL("../docs/evidence/panel-performance-20261007.json", import.meta.url), "utf8"));
  const { report, raw_samples: raw } = evidence;
  assert.equal(evidence.schema, "fe2o3-standalone-panel-performance-evidence-v1");
  assert.equal(report.schema, "fe2o3-resource-view-diagnostic-performance-v2");
  assert.deepEqual(report.options, { samples: 30, warmup: 5 });
  assert.deepEqual(report.panel_fixtures, PANEL_FIXTURES);
  assert.deepEqual(panelSummaries(raw.panel_cases, 30), report.panel_cases);
  assert.deepEqual(raw.cases.map(value => value.name), ["actual_allocation_page", "actual_access_page", "synthetic_256_row_layout_only"]);
  assert.equal([...raw.cases, ...raw.panel_cases].reduce((n, value) => n + value.samples.length, 0), 240);
  assert.equal(report.hardware_observed, false);
  assert.equal(report.panel_budget_status, "measurement_only_no_adopted_latency_SLO");
  for (let index = 0; index < raw.cases.length; index++) {
    for (const key of ["decode_ms", "projection_ms", "render_commit_layout_ms"])
      assert.deepEqual(distribution(raw.cases[index].samples.map(value => value[key])), report.cases[index][key]);
  }
});

test("actual saved-envelope formatter emits JSON plus a real LF, not a literal escape", () => {
  const source = readFileSync(new URL("./resource-view-performance.mjs", import.meta.url), "utf8");
  const declaration = source.split("\n").find(line => line.trimStart().startsWith("const save = "));
  assert.ok(declaration);
  const writes = [];
  runInNewContext(declaration + '\nsave("fixture.json", { count: 3 });', {
    output: "fixed-output", join: (...parts) => parts.join("/"),
    writeFileSync: (path, text, options) => writes.push({ path, text, flag: options.flag }),
  }, { timeout: 1000 });
  assert.equal(writes.length, 1);
  assert.equal(writes[0].path, "fixed-output/fixture.json");
  assert.equal(writes[0].flag, "wx");
  assert.equal(writes[0].text.charCodeAt(writes[0].text.length - 1), 10);
  assert.deepEqual(JSON.parse(writes[0].text), { count: 3 });
});
