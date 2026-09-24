/** Checks recorded memory/value relations; not an ISA evaluator or an admission path. */
import { parseProgramJson } from "./ordered-program-observation.mjs";
import { freeze, need, same, stable, type Row } from "./physical-entry-debug-v20-shapes";
import { type LdsContext, type LdsInput, ldsContext } from "./physical-lds-debug-v22-input";
import { type LdsObservation } from "./physical-lds-debug-v22-views";
import { ldsProtocol } from "./physical-lds-debug-v22-protocol";
import { aborted } from "./physical-lds-debug-v22-framing";
export interface LdsTransition { readonly local: number; readonly kind: string; readonly value: number; readonly pending: number; readonly before: number; readonly ready: number }
export interface LdsRecording {
  readonly context: LdsContext; readonly observations: readonly LdsObservation[];
  readonly inputAllocation: number; readonly outputAllocation: number;
  readonly transitions: readonly LdsTransition[]; readonly finalMemoryEvent: number;
}
function valueAt(record: LdsObservation, id: number): Row | undefined {
  return record.rawValues?.find(r => ((r.path as Row).root as Row).value_ordinal === id);
}
function availability(record: LdsObservation, id: number): Row | undefined { return valueAt(record, id)?.availability as Row | undefined; }
function word(bytes: readonly string[], offset: number): string { return "0x" + bytes.slice(offset, offset + 4).reverse().join(""); }
export async function projectLdsRecording(input: LdsInput, signal?: AbortSignal): Promise<LdsRecording> {
  const context = await ldsContext(input, signal), observations = await ldsProtocol(context, signal), index = context.index;
  const first = index.records.find(r => r.payload.kind === "checkpoint")!;
  const roots = observations.find(r => r.event === first.sequence && valueAt(r, 0) && valueAt(r, 1));
  need(roots, "Missing recorded root pointers.");
  const roles = [0, 1].map(id => {
    const a = availability(roots, id)!; same(a.status, "captured"); same(a.value_type, { kind: "pointer", address_space: "global" });
    const p = a.value as Row; same(p.encoding, "allocation_relative_pointer"); same(p.byte_offset, 8);
    const allocation = p.allocation as Row; same(allocation.generation, 0);
    const catalog = index.allocations.find(v => v.ordinal === allocation.ordinal); need(catalog?.space === "global", "Root pointer not joined to global allocation.");
    same(catalog.bytes, id === 0 ? 528 : 532); same(catalog.first, first.sequence); return catalog.ordinal;
  });
  need(roles[0] !== roles[1], "Input/output allocation identity aliases.");
  for (const [ordinal, access, count] of [[roles[0], "read", 128], [roles[1], "write_committed", Math.min(128, context.output.elements)]] as const) {
    const records = index.records.filter(r => r.payload.kind === "memory" && r.payload.space === "global" && r.payload.allocation === ordinal);
    same(records.length, count);
    same(records.map(r => r.local).sort((a, b) => a - b), Array.from({ length: count }, (_, i) => i));
    for (const row of records) {
      need(row.payload.kind === "memory", "Missing global observation."); same(row.payload.access, access); same(row.payload.offset, 8 + row.local * 4);
      need(access === "read" ? row.sequence < index.arrivals[row.local] : row.sequence > index.release, "Global access/barrier order mismatch.");
    }
  }
  const global = index.records.filter(r => r.payload.kind === "memory" && r.payload.space === "global");
  same(global.length, 128 + Math.min(128, context.output.elements));
  const birth = observations.find(r => r.event === index.lds.first && r.memory?.allocation === index.lds.ordinal && r.memory.offset === 0 && r.memory.cells.length === 16);
  need(birth?.memory, "Missing initial LDS bytes."); same(birth.memory.cells, Array.from({ length: 16 }, () => ({ byte: "00", initialized: false })));
  need(observations.some(r => r.event === first.sequence && r.operation === "read_memory" && r.status === "unavailable" &&
    (parseProgramJson(r.requestUtf8, 8192) as { allocation?: { ordinal?: unknown } }).allocation?.ordinal === index.lds.ordinal), "Missing pre-frame refusal.");
  const lastWrite = Math.max(...index.records.filter(r => r.payload.kind === "memory" && r.payload.access === "write_committed").map(r => r.sequence));
  const memoryEvents = [...new Set(observations.filter(r => r.memory && r.event > lastWrite).map(r => r.event))];
  let finalMemoryEvent = 0;
  for (const event of memoryEvents) {
    const pages = observations.filter(r => r.event === event && r.memory).map(r => r.memory!);
    const full = [roles[0], roles[1], index.lds.ordinal].map(id => {
      const length = index.allocations.find(a => a.ordinal === id)!.bytes;
      const cells: ({ byte: string; initialized: boolean } | undefined)[] = Array(length);
      for (const p of pages.filter(p => p.allocation === id)) p.cells.forEach((c, j) => { cells[p.offset + j] = c; });
      return cells;
    });
    if (!full.every(cells => Array.from(cells).every(Boolean))) continue;
    const expectedInput = context.input.bytes.map((byte, i) => ({ byte, initialized: context.input.initialized[i] }));
    const expectedOutput = context.output.bytes.map((byte, i) => ({ byte, initialized: context.output.initialized[i] }));
    for (let local = 0; local < Math.min(128, context.output.elements); local++)
      for (let byte = 0; byte < 4; byte++) expectedOutput[8 + local * 4 + byte] = { byte: context.input.bytes[8 + (local ^ 64) * 4 + byte], initialized: true };
    same(full[0], expectedInput); same(full[1], expectedOutput);
    same(full[2], context.input.bytes.slice(8, 520).map(byte => ({ byte, initialized: true }))); finalMemoryEvent = event; break;
  }
  need(finalMemoryEvent > 0, "Missing complete recorded final memory/canary pages.");
  const transitions: LdsTransition[] = [];
  for (const local of [0, 64]) for (const kind of ["pending_global_read", "pending_lds_read"] as const) {
    const pending = index.records.find(r => r.local === local && r.payload.kind === "checkpoint" && r.payload.pending.some(p => p.kind === kind));
    need(pending?.payload.kind === "checkpoint", "Missing indexed pending value.");
    const id = pending.payload.pending.find(p => p.kind === kind)!.value;
    const before = index.records.find(r => r.sequence > pending.sequence && r.local === local && r.payload.kind === "checkpoint" &&
      r.payload.phase === "before_operation" && r.payload.pending.some(p => p.value === id && p.kind === kind));
    need(before, "Missing pending wait-before checkpoint.");
    const ready = index.records.find(r => r.sequence > before.sequence && r.local === local && stable(r.site) === stable(before.site) &&
      r.payload.kind === "checkpoint" && r.payload.phase === "after_operation");
    need(ready?.payload.kind === "checkpoint" && !ready.payload.pending.some(p => p.value === id), "Missing exact same-site wait completion.");
    const states = observations.filter(r => r.rawValues && r.anchor?.local === local);
    const pendingRead = states.find(r => r.event === pending.sequence && availability(r, id)?.status === "unavailable");
    const readyRead = states.find(r => r.event === ready.sequence && availability(r, id)?.status === "captured");
    need(pendingRead && readyRead && pendingRead.id < readyRead.id, "Missing observed pending-to-ready SSA relation.");
    same(availability(pendingRead, id), { status: "unavailable", reason: "not_represented" });
    const a = availability(readyRead, id)!; same(a.value_type, { kind: "integer", signed: false, bits: 32 });
    same(a.value, { encoding: "bits", bits: word(context.input.bytes, 8 + (kind === "pending_global_read" ? local : local ^ 64) * 4) });
    need(states.some(r => r.id > readyRead.id && r.event === pending.sequence && stable(availability(r, id)) === stable(availability(pendingRead, id))),
      "Missing recorded reverse restoration of pending SSA.");
    transitions.push({ local, kind, value: id, pending: pending.sequence, before: before.sequence, ready: ready.sequence });
  }
  aborted(signal); return freeze({ context, observations, inputAllocation: roles[0], outputAllocation: roles[1], transitions, finalMemoryEvent });
}
