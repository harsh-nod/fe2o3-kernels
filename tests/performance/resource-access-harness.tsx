// Test-only Vite harness. It is not imported by the application or curriculum.
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
declare global {
  interface Window {
    runResourcePerformance(options: { samples: number; warmup: number }): Promise<{ fixture_bytes: number; visible_row_bound: number; cases: CaseResult[]; user_agent: string; hardware_concurrency: number; heap_if_exposed_bytes: number | null }>;
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
  flushSync(() => root.unmount());
  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  return { fixture_bytes: new TextEncoder().encode(fixtureText).length, visible_row_bound: RESOURCE_ACCESS_VISIBLE_ROWS, cases,
    user_agent: navigator.userAgent, hardware_concurrency: navigator.hardwareConcurrency, heap_if_exposed_bytes: memory?.usedJSHeapSize ?? null };
};
