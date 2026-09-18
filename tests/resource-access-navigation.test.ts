import { describe, expect, it } from "vitest";
import retained from "../examples/source_lds_multi_workgroup_v1.json";
import { projectResourceAccessResponse } from "../src/content/resource-access-view";
import { resourceAccessNavigation, resourceAccessPageKey, type ReadyResourceAccessPage } from "../src/content/resource-access-navigation";

function actual(checkpoint = 4, page = 0): ReadyResourceAccessPage {
  const stop = retained.checkpoints[checkpoint], pair = stop.accessPages[page];
  const projection = projectResourceAccessResponse({ response: pair.response, expectedRequest: pair.request,
    expectedSnapshot: stop.expectedSnapshot, context: retained.context, responseContext: retained.context });
  if (projection.status !== "ready" || projection.kind !== "memory_accesses") throw new Error("Expected actual retained access page");
  return projection;
}

describe("bounded retained-access navigation", () => {
  it("derives only observed lanes and events from a real retained page", () => {
    const projection = actual(), view = resourceAccessNavigation(projection, null);
    expect(view.rows).toHaveLength(16);
    expect(view.scopeOptions).toHaveLength(16);
    expect(view.waveOptions.map((option) => option.label)).toEqual(["Workgroup [0, 0, 0], logical wave 0 (width 32)"]);
    expect(view.selected?.occurrence.event_sequence).toBe(12);
    const selected = resourceAccessNavigation(projection, { ...view.selection, scopeKey: view.scopeOptions[1].key, eventSequence: null });
    expect(selected.rows).toHaveLength(1);
    expect(selected.selected?.occurrence.event_sequence).toBe(28);
    expect(projection.anchor.cursor).toEqual(retained.checkpoints[4].expectedSnapshot.cursor);
    expect(selected.selected).toBe(projection.rows[1]);
    expect(Object.isFrozen(selected.selected)).toBe(true);
  });

  it("never fills an empty continuation page or invents requested lanes/events", () => {
    const empty = actual(4, 1), view = resourceAccessNavigation(empty, null);
    expect(empty.hasMorePages).toBe(true);
    expect(view.rows).toEqual([]); expect(view.waveOptions).toEqual([]); expect(view.scopeOptions).toEqual([]);
    expect(view.selected).toBeNull(); expect(view.selectedIndex).toBe(-1);
    const populated = actual(), initial = resourceAccessNavigation(populated, null);
    expect(resourceAccessNavigation(populated, { ...initial.selection, eventSequence: 13 }).selected).toBeNull();
    expect(resourceAccessNavigation(populated, { ...initial.selection, scopeKey: "missing-lane" }).rows).toEqual([]);
    expect(resourceAccessNavigation(populated, { ...initial.selection, waveKey: "missing-wave" }).rows).toEqual([]);
  });

  it("does not carry selection across request, full-anchor or caller-context identities", () => {
    const page = actual(), first = resourceAccessNavigation(page, null);
    const selected = { ...first.selection, scopeKey: first.scopeOptions[1].key, eventSequence: 28 };
    for (const changed of [
      { ...page, requestId: page.requestId + 1 },
      { ...page, anchorKey: `${page.anchorKey}:changed-revision-source-scope-frame` },
      { ...page, contextKey: `${page.contextKey}:changed-capture-target-variant-connection` },
    ]) {
      const result = resourceAccessNavigation(changed, selected);
      expect(result.rows).toHaveLength(16);
      expect(result.selection.scopeKey).toBeNull();
      expect(result.selected?.occurrence.event_sequence).toBe(12);
      expect(resourceAccessPageKey(changed)).not.toBe(first.pageKey);
    }
    const next = resourceAccessNavigation(actual(5), selected);
    expect(next.selected?.occurrence.event_sequence).toBe(16090);
    expect(next.selection.scopeKey).toBeNull();
    const replaced = resourceAccessNavigation({ ...page, rows: page.rows.slice(2) }, selected);
    expect(replaced.selection.scopeKey).toBeNull();
    expect(replaced.selected?.occurrence.event_sequence).toBe(44);
  });

  it("keeps identical lane/wave numbers in different workgroups or widths distinct", () => {
    // Explicit synthetic headless selection test, not additional capture evidence.
    const page = actual(), row = page.rows[0];
    if (row.occurrence.scope.level !== "lane") throw new Error("Expected actual lane profile");
    const scope = row.occurrence.scope;
    const rows = [row, ...[
      { ...scope, workgroup: [1, 0, 0] as [number, number, number], logical_workitem: [64, 0, 0] as [number, number, number] },
      { ...scope, wave: 1, logical_workitem: [32, 0, 0] as [number, number, number] },
      { ...scope, wave_width: 64 as const },
    ].map((changed, index) => ({ ...row, occurrence: { ...row.occurrence, event_sequence: 28 + index, scope: changed } }))];
    const synthetic = { ...page, rows }, initial = resourceAccessNavigation(synthetic, null);
    expect(new Set(initial.waveOptions.map((item) => item.key)).size).toBe(4);
    expect(new Set(initial.scopeOptions.map((item) => item.key)).size).toBe(4);
    for (const option of initial.waveOptions) {
      expect(resourceAccessNavigation(synthetic, { ...initial.selection, waveKey: option.key, eventSequence: null }).rows).toHaveLength(1);
    }
  });
});
