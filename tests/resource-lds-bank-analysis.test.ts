import { describe, expect, it } from "vitest";
import retained from "../examples/source_lds_multi_workgroup_v1.json";
import { projectResourceAccessResponse } from "../src/content/resource-access-view";
import { resourceAccessNavigation, type ReadyResourceAccessPage } from "../src/content/resource-access-navigation";
import { projectSelectedLdsBankAnalysis } from "../src/content/resource-lds-bank-analysis";

function actual(checkpoint = 4, page = 0): ReadyResourceAccessPage {
  const stop = retained.checkpoints[checkpoint], pair = stop.accessPages[page];
  const value = projectResourceAccessResponse({ response: pair.response, expectedRequest: pair.request,
    expectedSnapshot: stop.expectedSnapshot, context: retained.context, responseContext: retained.context });
  if (value.status !== "ready" || value.kind !== "memory_accesses") throw new Error("Expected actual retained access page");
  return value;
}

describe("exact selected LDS range projection", () => {
  it("joins only one actual retained row and preserves all unavailable facts", () => {
    const page = actual(), navigation = resourceAccessNavigation(page, null);
    const value = projectSelectedLdsBankAnalysis(page, navigation.selection, "0");
    expect(value.status).toBe("modeled");
    if (value.status !== "modeled") return;
    expect(value.selected).toBe(page.rows[0]);
    expect(value.selected.occurrence.event_sequence).toBe(12);
    expect(value.checkpointEvent).toBe(16080);
    expect(value.checkpointRevision).toBe(15);
    expect(value.model.words).toHaveLength(1);
    expect(value.model.banks[0].byteCount).toBe(4);
    expect(value).toMatchObject({ targetProvenance: "caller_owned_context", physicalBase: "not_represented",
      alignment: "not_represented", nativeInstruction: "not_represented", conflictCount: "unavailable", timing: "unavailable" });
    expect(value.morePages).toBe(true);
    expect(page.rows).toHaveLength(16); // Other retained rows were not grouped.
  });

  it("refuses stale page, request, revision, target, scope and replacement identities", () => {
    const page = actual(), selection = resourceAccessNavigation(page, null).selection;
    for (const changed of [
      { ...page, requestId: page.requestId + 1 },
      { ...page, anchorKey: page.anchorKey + ":revision-source-scope" },
      { ...page, contextKey: page.contextKey + ":capture-target-variant" },
      { ...page, rows: page.rows.slice(1) },
      actual(5),
    ]) expect(projectSelectedLdsBankAnalysis(changed, selection, "0").status).toBe("stale");
    expect(projectSelectedLdsBankAnalysis(page, { ...selection, eventSequence: 13 }, "0").status).toBe("unavailable");
    expect(projectSelectedLdsBankAnalysis(page, { ...selection, scopeKey: "other-workgroup" }, "0").status).toBe("unavailable");
  });

  it("keeps empty continuation and missing target unavailable, including unverified imports", () => {
    const page = actual(), empty = actual(4, 1);
    expect(empty.hasMorePages).toBe(true);
    expect(projectSelectedLdsBankAnalysis(empty, null, "0").status).toBe("unavailable");
    for (const target of [null, "gfx1100", "gfx950:xnack+", "gfx942:unknown"]) {
      const changed = { ...page, context: { ...page.context, target } };
      expect(projectSelectedLdsBankAnalysis(changed, null, "0").status).toBe("unavailable");
    }
    expect(projectSelectedLdsBankAnalysis({ status: "stale", detail: "Rejected page" }, null, "0").status).toBe("unavailable");
  });

  it("does not turn global, private, overlarge or overflow ranges into LDS observations", () => {
    const page = actual();
    // These are explicitly synthetic adapter controls, not new capture records.
    for (const address_space of ["global", "private"] as const) {
      expect(projectSelectedLdsBankAnalysis({ ...page, rows: [{ ...page.rows[0], address_space }] }, null, "0").status).toBe("unavailable");
    }
    for (const range of [{ byte_offset: "0", byte_len: "257" }, { byte_offset: "18446744073709551611", byte_len: "4" }]) {
      expect(projectSelectedLdsBankAnalysis({ ...page, rows: [{ ...page.rows[0], range }] }, null, "4").status).toBe("unavailable");
    }
  });

  it("models a partial selected row without completing the capture or selecting an issue group", () => {
    const page = actual();
    const changed = { ...page, completeness: { status: "truncated" as const, reason: "resident_limit" as const, emitted_events: 16080 } };
    const value = projectSelectedLdsBankAnalysis(changed, null, "1");
    expect(value).toMatchObject({ status: "modeled", partialCapture: true, morePages: true, conflictCount: "unavailable" });
    if (value.status === "modeled") {
      expect(value.selected.occurrence.scope).toEqual(page.rows[0].occurrence.scope);
      expect(value.model.byteLength).toBe("4");
      expect(value.model.assumedBaseResidue).toBe("1");
    }
  });

  it("keeps equal lane numbers in other workgroups and allocations separate", () => {
    const page = actual(), row = page.rows[0];
    const first = projectSelectedLdsBankAnalysis(page, null, "0");
    const scope = row.occurrence.scope;
    if (scope.level !== "lane") throw new Error("Expected retained lane scope");
    // Synthetic distinct scope/allocation, not an added actual observation.
    const other = { ...row, allocation: { ordinal: 999, generation: 0 as const }, occurrence: {
      ...row.occurrence, record_ordinal: 12, event_sequence: 13,
      scope: { ...scope, workgroup: [1, 0, 0] as [number, number, number], logical_workitem: [64, 0, 0] as [number, number, number] },
    } };
    const changed = { ...page, rows: [row, other] };
    const second = projectSelectedLdsBankAnalysis(changed, null, "0");
    expect(first.status).toBe("modeled"); expect(second.status).toBe("modeled");
    if (first.status === "modeled" && second.status === "modeled") {
      expect(second.model).toEqual(first.model);
      expect(second.selected.allocation.ordinal).toBe(row.allocation.ordinal);
    }
  });
});
