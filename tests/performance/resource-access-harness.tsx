// Test-only Vite harness. It is not imported by the application or curriculum.
import nativeText from "../../examples/source_instruction_native_comparison_v1.json?raw";
import demandText from "../../examples/authored_register_demand_v1.json?raw";
import linkedText from "../../examples/linked_region_lines_v1.json?raw";
import { AuthoredRegisterDemand } from "../../src/components/AuthoredRegisterDemand";
import { LinkedRegionLines } from "../../src/components/LinkedRegionLines";
import { projectAuthoredDemand } from "../../src/content/authored-register-demand.mjs";
import { projectLinkedRegionLines } from "../../src/content/linked-region-lines.mjs";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import fixtureText from "../../examples/resource_query_v6.json?raw";
import { ResourceAccessView } from "../../src/components/ResourceAccessView";
import { projectResourceAccessResponse, RESOURCE_ACCESS_VISIBLE_ROWS, type ResourceAccessProjectionInput } from "../../src/content/resource-access-view";

const fixture = JSON.parse(fixtureText) as typeof import("../../examples/resource_query_v6.json");
const container = document.getElementById("measurement")!;
const root = createRoot(container);

function actualInput(allocations: boolean): ResourceAccessProjectionInput {
  return { response: allocations ? fixture.allocationResponse : fixture.accessResponse,
    expectedRequest: allocations ? fixture.allocationRequest : fixture.accessRequest,
    expectedSnapshot: fixture.expectedSnapshot, context: fixture.context, responseContext: fixture.context };
}

function syntheticLayoutInput(): ResourceAccessProjectionInput {
  // Deliberately invented layout-only values. Never retain this as a capture,
  // claim ordinary-source execution, or merge its timings with actual inputs.
  const context = { connectionId: "synthetic-presentation-only", captureIdentity: null, variantIdentity: null, target: null };
  const anchor = { ...fixture.expectedSnapshot,
    cursor: { configuration_identity: "11".repeat(32), event_sequence: 256, state_revision: 1 },
    site: { ...fixture.expectedSnapshot.site, source: { status: "unavailable", reason: "not_represented" } },
  };
  const row = fixture.accessResponse.result.accesses[0];
  const response = { ...fixture.accessResponse, request_id: 1, snapshot: anchor,
    session: { ...fixture.accessResponse.session, revision: 1, configuration_identity: anchor.cursor.configuration_identity, cursor: anchor.cursor },
    page: { source_count: 256, scanned: 256, completeness: { status: "complete" } },
    result: { result: "memory_accesses", accesses: Array.from({ length: 256 }, (_, index) => ({
      ...row, occurrence: { ...row.occurrence, record_ordinal: index, event_sequence: index + 1,
        scope: { ...row.occurrence.scope, lane: index % 4, logical_workitem: [index % 4, 0, 0] } },
      range: { byte_offset: String(index * 4), byte_len: "4" },
    })) },
  };
  return { response, expectedSnapshot: anchor, expectedRequest: { ...fixture.accessRequest, request_id: 1, expected_revision: 1, expected_snapshot: anchor, page: { max_items: 256, max_scanned: 256 } }, context, responseContext: context };
}

interface Sample { decode_ms: number; projection_ms: number; render_commit_layout_ms: number; rendered_rows: number; dom_elements: number }
interface CaseResult { name: string; evidence_kind: string; input_bytes: number; input_rows: number; samples: Sample[] }
interface PanelSample { decode_ms: number; projection_ms: number; mount_ready_layout_ms: number; selection_roundtrip_ms: number; rendered_rows: number; dom_elements: number }
interface PanelResult { name: string; evidence_kind: string; input_bytes: number; input_rows: number; samples: PanelSample[] }
const NATIVE_JOIN = "5230415719fa0c7c81473d5fea338d5f3a85c7a3a9a91fd55c3900e20165d162";
const DEMAND_PIN = "39ab4d99bef9a04ac6f2f55b727b63148173ce27d7471066dde819fe264bd30e";
const LINKED_PIN = "7f8d78c87c7e191d2185fc5b8bc36d7d000e067800c9bb1392b4e31f323c4db5";
const byteLength = (text: string) => new TextEncoder().encode(text).length;
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
async function ready(predicate: () => boolean) {
  const deadline = performance.now() + 10000;
  for (let count = 0; count < 600 && performance.now() < deadline; count++) {
    if (container.querySelector('[data-state="invalid"], [data-state="unavailable"]')) throw new Error("panel refused retained input");
    if (predicate()) { void container.getBoundingClientRect(); return; }
    await frame();
  }
  throw new Error("panel ready budget exceeded");
}
function button(label: string): HTMLButtonElement {
  const value = container.querySelector<HTMLButtonElement>('button[aria-label="' + label + '"]');
  if (!value) throw new Error("expected real panel control missing");
  return value;
}
async function measurePanels(samples: number, warmup: number): Promise<PanelResult[]> {
  const results: PanelResult[] = [];
  for (const profile of ["default", "edited"] as const) for (const optimization of ["O0", "O3"] as const) {
    const measured: PanelSample[] = [], bytes = byteLength(nativeText) + byteLength(demandText);
    if (bytes > 512 * 1024) throw new Error("panel input byte budget exceeded");
    let rows = 0;
    for (let index = 0; index < warmup + samples; index++) {
      flushSync(() => root.render(<p>Empty baseline</p>));
      const start = performance.now(), native: unknown = JSON.parse(nativeText), evidence: unknown = JSON.parse(demandText), decoded = performance.now();
      const projection = await projectAuthoredDemand(native, NATIVE_JOIN, evidence, DEMAND_PIN), projected = performance.now();
      if (projection.status !== "ready") throw new Error("authored projection refused");
      const model = projection.cases.find(value => value.profile === profile);
      if (!model || model.values.length < 1 || model.values.length > 19) throw new Error("authored profile rows differ");
      rows = model.values.length;
      const mounted = performance.now();
      flushSync(() => root.render(<AuthoredRegisterDemand nativeEvidence={native} expectedNativeJoin={NATIVE_JOIN}
        demand={{ evidence, expectedSha256: DEMAND_PIN }} profile={profile} optimization={optimization} />));
      await ready(() => container.querySelectorAll('table[aria-label="Authored value demand by logical boundary"] tbody tr').length === rows);
      const rendered = performance.now();
      if (container.querySelector('pre[aria-label="Authored-demand ASCII"]')?.textContent !== model.ascii ||
          !container.textContent?.includes(model.canonicalSha256) || !container.textContent.includes(model.reportSha256) ||
          !container.textContent.includes(profile + " / " + optimization)) throw new Error("authored identity/content differs");
      const value = model.values[0], label = "Inspect authored value " + value.id + " " + value.role, interacted = performance.now();
      button(label).click();
      await ready(() => button(label).getAttribute("aria-pressed") === "true" &&
        container.querySelector(".authored-demand-selection")?.textContent?.startsWith("Authored value #" + value.id + ":") === true);
      button(label).click();
      await ready(() => button(label).getAttribute("aria-pressed") === "false" &&
        container.querySelector(".authored-demand-selection")?.textContent === "Select an authored value for its declared interval.");
      const finished = performance.now(), renderedRows = container.querySelectorAll("tbody tr").length;
      if (renderedRows !== rows) throw new Error("authored rendered row mismatch");
      if (index >= warmup) measured.push({ decode_ms: decoded - start, projection_ms: projected - decoded,
        mount_ready_layout_ms: rendered - mounted, selection_roundtrip_ms: finished - interacted,
        rendered_rows: renderedRows, dom_elements: container.querySelectorAll("*").length });
      await frame();
    }
    results.push({ name: "authored_" + profile + "_" + optimization, evidence_kind: "actual_retained_source_authored_demand_not_physical_allocation",
      input_bytes: bytes, input_rows: rows, samples: measured });
  }
  const measured: PanelSample[] = [], bytes = byteLength(linkedText);
  if (bytes > 512 * 1024) throw new Error("panel input byte budget exceeded");
  let rows = 0;
  for (let index = 0; index < warmup + samples; index++) {
    flushSync(() => root.render(<p>Empty baseline</p>));
    const start = performance.now(), evidence: unknown = JSON.parse(linkedText), decoded = performance.now();
    const projection = await projectLinkedRegionLines(evidence, LINKED_PIN), projected = performance.now();
    if (projection.status !== "ready" || projection.checkedArtifacts !== 16 ||
        projection.cases.map(value => value.optimization).join(",") !== "O0,O3") throw new Error("linked projection identity differs");
    rows = 2 + Math.max(...projection.cases.map(value => value.coverage.length));
    if (rows > 64) throw new Error("linked row budget exceeded");
    const mounted = performance.now();
    flushSync(() => root.render(<LinkedRegionLines evidence={evidence} expectedCapsuleSha256={LINKED_PIN} />));
    const selected = (optimization: "O0" | "O3") => {
      const model = projection.cases.find(value => value.optimization === optimization)!;
      const section = container.querySelector('section[aria-label="Selected whole-region linked lines"]');
      return section?.querySelector("h4")?.textContent?.startsWith(optimization + ":") === true &&
        section.textContent?.includes(model.payload.sha256) === true &&
        container.querySelectorAll('table[aria-label="Whole-region line coverage"] tbody tr').length === model.coverage.length;
    };
    await ready(() => selected("O0"));
    const rendered = performance.now();
    if (container.querySelector('pre[aria-label="Retained linked-line source"]')?.textContent !== projection.source ||
        !container.textContent?.includes(LINKED_PIN)) throw new Error("linked source/capsule differs");
    const interacted = performance.now();
    button("Inspect linked lines O3").click(); await ready(() => selected("O3"));
    const o3Rows = container.querySelectorAll("tbody tr").length;
    button("Inspect linked lines O0").click(); await ready(() => selected("O0"));
    const finished = performance.now(), renderedRows = Math.max(o3Rows, container.querySelectorAll("tbody tr").length);
    if (renderedRows !== rows) throw new Error("linked rendered row mismatch");
    if (index >= warmup) measured.push({ decode_ms: decoded - start, projection_ms: projected - decoded,
      mount_ready_layout_ms: rendered - mounted, selection_roundtrip_ms: finished - interacted,
      rendered_rows: renderedRows, dom_elements: container.querySelectorAll("*").length });
    await frame();
  }
  results.push({ name: "linked_lines_O0_O3", evidence_kind: "actual_retained_cpu_linked_line_observation_not_runtime_addresses",
    input_bytes: bytes, input_rows: rows, samples: measured });
  return results;
}
declare global {
  interface Window {
    runResourcePerformance(options: { samples: number; warmup: number }): Promise<{ fixture_bytes: number; visible_row_bound: number; cases: CaseResult[]; panel_cases: PanelResult[]; user_agent: string; hardware_concurrency: number; heap_if_exposed_bytes: number | null }>;
  }
}

window.runResourcePerformance = async ({ samples, warmup }) => {
  if (!Number.isInteger(samples) || samples < 1 || samples > 100 || !Number.isInteger(warmup) || warmup < 0 || warmup > 10) throw new Error("measurement iteration budget exceeded");
  const cases: CaseResult[] = [];
  for (const [name, evidenceKind, input] of [
    ["actual_allocation_page", "actual_retained_source_produced_cpu_response", actualInput(true)],
    ["actual_access_page", "actual_retained_source_produced_cpu_response", actualInput(false)],
    ["synthetic_256_row_layout_only", "synthetic_presentation_only_not_execution_evidence", syntheticLayoutInput()],
  ] as const) {
    const text = JSON.stringify(input);
    const bytes = new TextEncoder().encode(text).length;
    if (bytes > 512 * 1024) throw new Error("measurement input byte budget exceeded");
    const measured: Sample[] = [];
    let inputRows = 0;
    for (let iteration = 0; iteration < warmup + samples; iteration++) {
      flushSync(() => root.render(<p>Empty baseline</p>));
      const startDecode = performance.now();
      const decoded = JSON.parse(text) as ResourceAccessProjectionInput;
      const endDecode = performance.now();
      const projected = projectResourceAccessResponse(decoded);
      const endProjection = performance.now();
      if (projected.status !== "ready") throw new Error(`${name}: expected validated measurement input`);
      inputRows = projected.rows.length;
      const startRender = performance.now();
      flushSync(() => root.render(<ResourceAccessView {...decoded} title={name} />));
      void container.getBoundingClientRect();
      const endRender = performance.now();
      const renderedRows = container.querySelectorAll("tbody tr").length;
      if (renderedRows !== Math.min(inputRows, RESOURCE_ACCESS_VISIBLE_ROWS)) throw new Error("rendered row bound mismatch");
      if (iteration >= warmup) measured.push({ decode_ms: endDecode - startDecode, projection_ms: endProjection - endDecode,
        render_commit_layout_ms: endRender - startRender, rendered_rows: renderedRows, dom_elements: container.querySelectorAll("*").length });
      await new Promise<void>((resolveFrame) => requestAnimationFrame(() => resolveFrame()));
    }
    cases.push({ name, evidence_kind: evidenceKind, input_bytes: bytes, input_rows: inputRows, samples: measured });
  }
  const panelCases = await measurePanels(samples, warmup);
  flushSync(() => root.unmount());
  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  return { fixture_bytes: new TextEncoder().encode(fixtureText).length, visible_row_bound: RESOURCE_ACCESS_VISIBLE_ROWS, cases, panel_cases: panelCases,
    user_agent: navigator.userAgent, hardware_concurrency: navigator.hardwareConcurrency, heap_if_exposed_bytes: memory?.usedJSHeapSize ?? null };
};
