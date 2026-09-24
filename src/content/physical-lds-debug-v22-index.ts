/** Closed V22 recording index. Consistency checking, not a source/ISA interpreter. */
import { aborted, frameIndex } from "./physical-lds-debug-v22-framing";
import { digest, freeze, kirSite, need, object, same, uint, vector, type Row } from "./physical-entry-debug-v20-shapes";
export interface LdsAllocation { readonly ordinal: number; readonly space: "global" | "workgroup"; readonly bytes: number; readonly first: number }
export interface LdsPending { readonly value: number; readonly kind: "pending_global_read" | "pending_lds_read" }
export interface LdsIndexRow {
  readonly sequence: number; readonly ordinal: number; readonly local: number; readonly wave: number; readonly lane: number;
  readonly site: Row;
  readonly payload:
    { readonly kind: "checkpoint"; readonly phase: "before_operation" | "after_operation"; readonly pending: readonly LdsPending[] } |
    { readonly kind: "memory"; readonly access: "read" | "write_committed"; readonly allocation: number; readonly offset: number; readonly bytes: number; readonly space: "global" | "workgroup" } |
    { readonly kind: "barrier"; readonly action: "arrive" | "release"; readonly phase: number; readonly participants: number };
}
export interface LdsIndex {
  readonly configuration: string; readonly canonicalIdentity: string; readonly canonicalBytes: number;
  readonly requestDigest: string; readonly requestBytes: number; readonly rawDigest: string; readonly payloadDigest: string;
  readonly allocations: readonly LdsAllocation[]; readonly records: readonly LdsIndexRow[];
  readonly arrivals: readonly number[]; readonly release: number; readonly lds: LdsAllocation;
}
export async function parseLdsIndex(raw: string, signal?: AbortSignal): Promise<LdsIndex> {
  const parsed = await frameIndex(raw, signal), h = parsed.header;
  const canonical = object(h.canonical, ["sha256", "byte_length"]), request = object(h.request, ["sha256", "byte_length"]);
  const configuration = digest(h.configuration_identity), canonicalIdentity = digest(canonical.sha256);
  const canonicalBytes = uint(canonical.byte_length, 131072), requestBytes = uint(request.byte_length, 16384);
  need(canonicalBytes > 0 && requestBytes > 0, "Missing canonical/request byte extent.");
  same(h.outcome, "completed"); same(h.capture_stop, null);
  same(h.simulated, true); same(h.hardware_observed, false); same(h.performance_prediction, false);
  same(h.provenance, "simulated_observation"); same(h.wave_interpretation, "logical_visualization");
  same(h.unavailable, ["source_variables", "physical_registers", "physical_exec", "pending_store_queue", "publication_bitmap", "hardware_observation"]);
  need(Array.isArray(h.allocations) && h.allocations.length === 3, "This lesson requires three recorded allocations.");
  const seen = new Set<number>(), allocations: LdsAllocation[] = h.allocations.map(value => {
    const a = object(value, ["ordinal", "generation", "address_space", "byte_length", "first_checkpoint_sequence"]);
    const ordinal = uint(a.ordinal), bytes = uint(a.byte_length, 4096), first = uint(a.first_checkpoint_sequence, parsed.records.length);
    need(ordinal > 0 && bytes > 0 && first > 0 && !seen.has(ordinal), "Invalid allocation identity."); seen.add(ordinal);
    same(a.generation, 0); need(a.address_space === "global" || a.address_space === "workgroup", "Unsupported memory space.");
    return { ordinal, space: a.address_space, bytes, first };
  });
  const workgroup = allocations.filter(a => a.space === "workgroup");
  need(workgroup.length === 1 && workgroup[0].bytes === 512 && allocations.filter(a => a.space === "global").length === 2, "Missing exact512-byte LDS frame.");
  const lds = workgroup[0]; let previous = -1;
  const arrivals = Array<number>(128).fill(0); let release = 0;
  const records: LdsIndexRow[] = parsed.records.map((raw, i) => {
    aborted(signal); same(raw.sequence, i + 1); const ordinal = uint(raw.producer_ordinal);
    need(ordinal > previous, "Nonmonotone producer ordinal."); previous = ordinal;
    const scope = object(raw.scope, ["global", "local", "workgroup", "logical_wave", "logical_lane", "wave_width", "interpretation"]);
    const local = vector(scope.local); need(local[0] < 128, "Out-of-scope workitem."); same(local.slice(1), [0, 0]);
    same(scope.global, local); same(scope.workgroup, [0, 0, 0]); same(scope.logical_wave, Math.floor(local[0] / 64));
    same(scope.logical_lane, local[0] % 64); same(scope.wave_width, 64); same(scope.interpretation, "logical_visualization");
    const site = kirSite(raw.site); uint((site.point as Row).operation_ordinal, 127);
    const common = { sequence: i + 1, ordinal, local: local[0], wave: Math.floor(local[0] / 64), lane: local[0] % 64, site };
    const value = object(raw.payload, ["kind"], ["phase", "pending", "access", "allocation", "generation", "byte_offset", "byte_length", "address_space", "action", "participants"]);
    if (value.kind === "checkpoint") {
      object(value, ["kind", "phase", "pending"]);
      need(value.phase === "before_operation" || value.phase === "after_operation", "Unknown checkpoint phase.");
      need(Array.isArray(value.pending) && value.pending.length <= 8, "Pending-value bound exceeded.");
      const ids = new Set<number>();
      const pending: LdsPending[] = value.pending.map(raw => {
        const p = object(raw, ["function_ordinal", "frame", "value_ordinal", "kind", "numeric_availability"]);
        same(p.function_ordinal, 0); same(p.frame, 1); same(p.numeric_availability, "not_represented");
        const value = uint(p.value_ordinal, 767); need(!ids.has(value), "Duplicate pending SSA."); ids.add(value);
        need(p.kind === "pending_global_read" || p.kind === "pending_lds_read", "Unknown pending profile.");
        return { value, kind: p.kind };
      });
      return { ...common, payload: { kind: "checkpoint", phase: value.phase, pending } };
    }
    if (value.kind === "memory") {
      object(value, ["kind", "access", "allocation", "generation", "byte_offset", "byte_length", "address_space"]);
      same(value.generation, 0); need(value.access === "read" || value.access === "write_committed", "Unknown memory observation.");
      const allocation = uint(value.allocation), a = allocations.find(a => a.ordinal === allocation);
      need(a, "Memory observation names unknown allocation."); same(value.address_space, a.space);
      const offset = uint(value.byte_offset, a.bytes), bytes = uint(value.byte_length, a.bytes);
      need(bytes === 4 && offset + bytes <= a.bytes, "Memory record outside allocation.");
      return { ...common, payload: { kind: "memory", access: value.access, allocation, offset, bytes, space: a.space } };
    }
    object(value, ["kind", "action", "phase", "participants"]); same(value.kind, "barrier");
    need(value.action === "arrive" || value.action === "release", "Unknown barrier action.");
    same(value.phase, 0); same(value.participants, value.action === "arrive" ? 1 : 128);
    if (value.action === "arrive") { need(arrivals[local[0]] === 0 && release === 0, "Repeated or post-release arrival."); arrivals[local[0]] = i + 1; }
    else { need(release === 0 && arrivals.every(n => n > 0), "Release without128 unique arrivals."); release = i + 1; }
    return { ...common, payload: { kind: "barrier", action: value.action, phase: 0, participants: value.action === "arrive" ? 1 : 128 } };
  });
  need(release > 0 && arrivals.every(n => n > 0), "Incomplete barrier observations.");
  for (const a of allocations) need(records[a.first - 1]?.payload.kind === "checkpoint", "Catalog birth is not a checkpoint.");
  const first = records.find(r => r.payload.kind === "checkpoint"), birth = records[lds.first - 1];
  need(first && first.payload.kind === "checkpoint" && first.payload.phase === "before_operation" &&
    birth.payload.kind === "checkpoint" && birth.payload.phase === "after_operation", "Missing before/after frame lifetime.");
  same(birth.site, first.site); same(birth.local, first.local); need(birth.sequence > first.sequence, "LDS exists before declaration.");
  const firstAfter = records.find(r => r.sequence > first.sequence && r.local === first.local &&
    r.payload.kind === "checkpoint" && r.payload.phase === "after_operation" &&
    r.site.function_ordinal === first.site.function_ordinal && r.site.block_ordinal === first.site.block_ordinal &&
    (r.site.point as Row).operation_ordinal === (first.site.point as Row).operation_ordinal);
  same(firstAfter?.sequence, birth.sequence);
  const writes = records.filter(r => r.payload.kind === "memory" && r.payload.space === "workgroup" && r.payload.access === "write_committed");
  const reads = records.filter(r => r.payload.kind === "memory" && r.payload.space === "workgroup" && r.payload.access === "read");
  need(writes.length === 128 && reads.length === 128, "Incomplete LDS access recording.");
  for (const [rows, read] of [[writes, false], [reads, true]] as const) {
    same([...new Set(rows.map(r => r.local))].sort((a, b) => a - b), Array.from({ length: 128 }, (_, i) => i));
    for (const r of rows) {
      need(r.payload.kind === "memory", "Missing access.");
      same(r.payload.allocation, lds.ordinal); same(r.payload.offset, (read ? r.local ^ 64 : r.local) * 4);
      need(read ? r.sequence > release : r.sequence > birth.sequence && r.sequence < release, "LDS completion/publication order mismatch.");
    }
  }
  return freeze({ configuration, canonicalIdentity, canonicalBytes, requestDigest: digest(request.sha256), requestBytes,
    rawDigest: parsed.rawDigest, payloadDigest: parsed.payloadDigest, allocations, records, arrivals, release, lds });
}
