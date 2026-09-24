/** Recorded-data comparisons. Declared labels are never promoted to source ownership. */
import { need, same, type PhysicalObservationV20 } from "./physical-entry-debug-v20-shapes";
import { COPY_STAGES_V21, type CopyAllocationV21, type CopyContextV21, type CopyFactsV21, type CopyStageV21 } from "./physical-global-copy-debug-v21-input";
import type { CheckpointValueRow } from "./resource-checkpoint-values";
function binding(record: PhysicalObservationV20, id: number): CheckpointValueRow {
  need(record.values !== null, "A declared value checkpoint lacks a recorded SSA query.");
  const matches = record.values.filter(row => row.valueOrdinal === String(id));
  same(matches.length, 1); const row = matches[0];
  same(row.functionOrdinal, "0"); same(row.frame, "1"); same(row.key, "0:1:" + id);
  return row;
}
function parameterPointer(row: CheckpointValueRow, allocation: CopyAllocationV21): void {
  same(row.functionOrdinal, "0"); same(row.frame, "1"); same(row.key, "0:1:" + allocation.parameter);
  need(row.status === "captured" && row.typeLabel === "global pointer" &&
    row.pointer?.addressSpace === "global" && row.pointer.allocationOrdinal === String(allocation.allocation) &&
    row.pointer.generation === "0" && row.pointer.byteOffset === String(allocation.offset),
    "A declared input/output parameter pointer changed across captured sites.");
}
export function auditCopyRecordingV21(context: CopyContextV21, records: readonly PhysicalObservationV20[]): CopyFactsV21 {
  const stages = {} as Record<CopyStageV21, number>;
  const atStage = (record: PhysicalObservationV20, key: CopyStageV21): boolean => {
    const point = context.stages[key], anchor = record.anchor;
    return record.status === "ok" && anchor !== null && record.event === point.index + 1;
  };
  for (const key of COPY_STAGES_V21) {
    const matches = records.flatMap((record, i) => atStage(record, key) ? [i] : []);
    need(matches.length > 0, "A declared checkpoint is absent from actual captured observations.");
    for (const i of matches) {
      const anchor = records[i].anchor!, point = context.stages[key];
      same(anchor.block, point.block); same(anchor.operation, point.operation);
      same(anchor.global, [0, 0, 0]); same(anchor.lane, 0); same(anchor.workgroup, [0, 0, 0]);
    }
    stages[key] = matches[0];
  }
  const queries = (key: CopyStageV21) => records.flatMap((record, i) =>
    atStage(record, key) && record.values !== null ? [i] : []);
  const roots = queries("load_before"); need(roots.length > 0, "Input/output root pointer observation required.");
  for (const allocation of context.allocations) {
    parameterPointer(binding(records[roots[0]], allocation.parameter), allocation);
  }
  for (const record of records) {
    if (record.anchor) need(record.anchor.global[0] < context.grid, "Checkpoint is outside the declared launch extent.");
    if (record.values) for (const value of record.values) {
      // Parameters are immutable SSA roots, including across different captured sites.
      // An omitted root on a bounded page is not an observation; every present root is checked.
      const parameter = context.allocations.find(a => String(a.parameter) === value.valueOrdinal);
      if (parameter) parameterPointer(value, parameter);
      if (value.pointer) {
        const owners = context.allocations.filter(a => String(a.allocation) === value.pointer!.allocationOrdinal);
        same(owners.length, 1); same(value.pointer.addressSpace, "global"); same(value.pointer.generation, "0");
        need(Number(value.pointer.byteOffset) <= owners[0].bytes.length, "Recorded pointer exceeds declared backing extent.");
      }
    }
    if (record.memory) {
      const owners = context.allocations.filter(a => a.allocation === record.memory!.allocation);
      same(owners.length, 1);
      need(record.memory.offset + record.memory.cells.length <= owners[0].bytes.length, "Memory query exceeds declared allocation.");
    }
  }
  const pending = queries("pending"), waiting = queries("wait_before"), ready = queries("ready");
  need(pending.length >= 2 && waiting.length > 0 && ready.length > 0,
    "Require actual pending, before-wait, ready and reverse-pending observations of the same SSA.");
  for (const index of [...pending, ...waiting]) {
    const value = binding(records[index], context.loadedValue);
    same(value.status, "unavailable"); same(value.representation, "not_represented");
    same(value.pointer, undefined);
  }
  const input = context.allocations[0], output = context.allocations[1];
  const expectedWord = "0x" + input.bytes.slice(input.offset, input.offset + 4).reverse().join("");
  for (const index of ready) {
    const value = binding(records[index], context.loadedValue);
    same(value.status, "captured"); same(value.typeLabel, "u32"); same(value.representation, expectedWord);
    same(value.pointer, undefined);
  }
  const pendingQuery = pending[0], readyQuery = ready[0], reversePending = pending.filter(i => i > readyQuery);
  need(pendingQuery < readyQuery && reversePending.length > 0, "Missing recorded reverse transition to unavailable SSA.");
  const reversePendingQuery = reversePending[0];
  const prior = records[reversePendingQuery - 1];
  same(prior.operation, "step"); same(prior.label, "step reverse"); same(prior.event, context.stages.pending.index + 1);
  function storeMemory(key: "store_before" | "store_after", written: boolean) {
    const matches = records.filter(r => atStage(r, key) && r.memory?.allocation === output.allocation &&
      r.memory.offset === output.offset && r.memory.cells.length === 4);
    need(matches.length > 0, "Declared store stage lacks its four-byte output observation.");
    const bytes = written ? input.bytes.slice(input.offset, input.offset + 4) : output.bytes.slice(output.offset, output.offset + 4);
    const init = written ? [true, true, true, true] : output.initialized.slice(output.offset, output.offset + 4);
    for (const record of matches) same(record.memory!.cells, bytes.map((byte, i) => ({ byte, initialized: init[i] })));
  }
  storeMemory("store_before", false); storeMemory("store_after", output.elements > 0);
  const copiedWords = Math.min(context.grid, output.elements);
  const finalQueries: number[][] = [];
  for (const [roleIndex, allocation] of context.allocations.entries()) {
    const final = records.flatMap((record, i) => record.status === "ok" && record.event === context.finalIndex + 1 &&
      record.memory?.allocation === allocation.allocation ? [i] : []);
    need(final.length > 0, "Final input and output allocation pages are required.");
    const cells: ({ byte: string; initialized: boolean } | null)[] = Array.from({ length: allocation.bytes.length }, () => null);
    for (const index of final) {
      const record = records[index], view = record.memory!;
      same(record.anchor!.global, [context.grid - 1, 0, 0]); same(record.anchor!.lane, 63);
      for (const [i, cell] of view.cells.entries()) {
        const offset = view.offset + i;
        need(offset < cells.length, "Final memory page exceeds backing.");
        if (cells[offset] !== null) same(cells[offset], cell);
        cells[offset] = cell;
      }
    }
    need(cells.every(cell => cell !== null), "Final allocation view has missing bytes.");
    const expected = allocation.bytes.map((byte, i) => ({ byte, initialized: allocation.initialized[i] }));
    if (roleIndex === 1) {
      for (let i = 0; i < copiedWords * 4; i++) expected[output.offset + i] =
        { byte: input.bytes[input.offset + i], initialized: true };
    }
    same(cells, expected); finalQueries.push(final);
  }
  return { stages, pendingQuery, readyQuery, reversePendingQuery,
    finalInputQueries: finalQueries[0], finalOutputQueries: finalQueries[1],
    inputUnchangedBytes: input.bytes.length, copiedWords,
    outputCanaryBytes: output.bytes.length - copiedWords * 4 };
}
