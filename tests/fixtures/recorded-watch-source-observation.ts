// SYNTHETIC controls only. No bytes in this module establish a real producer run.
import { programSha256 } from "../../src/content/ordered-program-observation.mjs";
import { WATCH_SOURCE_FILES, type WatchSourceFiles } from "../../src/content/recorded-watch-source-observation";
import type { MutableResourceControl as Row } from "./recorded-resource-import";
const clone = structuredClone, hash = (n: number) => n.toString(16).padStart(64, "0");
const V1 = "fe2o3-debug-request-v1", V2 = "fe2o3-debug-source-variable-request-v2";
const RESOURCE = "fe2o3-debug-resource-request-v1", allocation = { ordinal: 1, generation: 0 };
const before = "0x" + "a5a5a5a5".repeat(4) + "deadbeefcafebabe";
const after = "0xd5010000" + "a5a5a5a5".repeat(3) + "deadbeefcafebabe";
interface Pair { request: Row; response: Row }
export interface SyntheticWatchSourceCapture { full: Pair[]; watchIds: number[]; sourceIds: number[]; receipt: Row }
function session(event: number, revision: number): Row {
  return { backend: "cpu_kir_simulator", execution_kind: "cpu_kir_simulation", state: "stopped",
    revision, configuration_identity: hash(1), cursor: { configuration_identity: hash(1),
      event_sequence: event, state_revision: revision }, simulated: true, hardware_observed: false, performance_prediction: false };
}
function anchor(event: number, revision: number, block: number, lane: number): Row {
  return { cursor: session(event, revision).cursor, scope: { level: "lane", workgroup: [0, 0, 0], wave: 0, lane,
    logical_workitem: [lane, 0, 0], active_mask: 15, wave_width: 32, interpretation: "logical_visualization" },
    site: { kir: { function_ordinal: 0, block_ordinal: block, point: { kind: "operation", operation_ordinal: 0 } },
      source: { status: "resolved", location: { map_identity: hash(2), file_identity: hash(3),
        provenance: "compiler_bundle_bound", byte_start: 100, byte_end: 110 } } } };
}
function scalar(bits: string): Row {
  return { status: "captured", value_type: { kind: "integer", signed: false, bits: 32 },
    value: { encoding: "bits", bits }, provenance: "simulated_observation" };
}
export function syntheticWatchSourceCapture(): SyntheticWatchSourceCapture {
  const full: Pair[] = [];
  function add(operation: string, state: Row, fields: Row, result: Row | undefined, schema = V1): Pair {
    const request_id = full.length + 1;
    const pair = { request: { schema, request_id, expected_revision: state.revision, operation, ...clone(fields) },
      response: { status: "ok", schema: schema === V2 ? "fe2o3-debug-source-variable-response-v2"
        : schema === RESOURCE ? "fe2o3-debug-resource-response-v1" : "fe2o3-debug-response-v1",
      request_id, operation, session: clone(state), ...(result === undefined ? {} : { result: clone(result) }) } };
    full.push(pair); return pair;
  }
  function control(event: number, revision: number, block: number, lane: number, count: number, direction: string, advanced: number): Pair {
    const stop = { reason: "step", outcome: "active", exact: true };
    return add("step", session(event, revision), { expected_revision: revision - 1, direction, granularity: "operation", count },
      { result: "control", stop, events_advanced: advanced, snapshot: { status: "captured", snapshot: {
        anchor: anchor(event, revision, block, lane), stop, values: ["0xfffffff0", "0x00000025", "0x000001d5"]
          .map((bits, value_ordinal) => ({ path: { root: { kind: "ssa", function_ordinal: 0, frame: 1, value_ordinal }, components: [] },
            availability: scalar(bits) })) } } });
  }
  function stack(cp: Pair, next?: number) {
    const a = cp.response.result.snapshot.snapshot.anchor;
    return add("inspect_stack", cp.response.session, { scope: { level: "dispatch" }, page: { limit: 16 } },
      { result: "stack", snapshot: a, frames: [{ frame: 1, function_ordinal: 0, block_ordinal: a.site.kir.block_ordinal,
        ...(next === undefined ? {} : { next_operation: next }), values: { status: "captured", value_count: 3 } }] });
  }
  function unavailable(state: Row) {
    const p = add("inspect_source_variables", state, { scope: { level: "dispatch" }, frame: 1, selector: { selector: "all" },
      page: { limit: 2 } }, undefined, V2);
    p.response.status = "unavailable"; p.response.reason = "checkpoint_not_captured"; return p;
  }
  function memory(cp: Pair, bytes: string) {
    return add("read_memory", cp.response.session, { allocation, byte_offset: 0, byte_len: 24 },
      { result: "memory", snapshot: cp.response.result.snapshot.snapshot.anchor,
        memory: { allocation, byte_offset: 0, requested_bytes: 24, returned_bytes: 24,
          availability: { status: "captured", address_space: "global", bytes, initialized: "0xffffff", truncated: false } } });
  }
  function failed(state: Row, code: string, fields: Row) {
    const p = add("inspect_source_variables", state, { scope: { level: "dispatch" }, frame: 1,
      selector: { selector: "all" }, page: { limit: 2 }, ...fields }, undefined, V2);
    p.response.status = "error";
    p.response.error = { stage: "session", code, message: "Synthetic refusal; not execution evidence.", state_changed: false }; return p;
  }
  const initial = control(1, 1, 0, 0, 1, "forward", 1);
  const inventory = add("query_allocations", initial.response.session,
    { expected_snapshot: initial.response.result.snapshot.snapshot.anchor, page: { max_items: 16, max_scanned: 16 } },
    { result: "allocations", allocations: [{ allocation, address_space: "global", access: "read_write", alignment: 4,
      capacity_bytes: "24", snapshot_bytes_available: true, initialization_available: true,
      owning_scope: "not_represented", lifetime: "not_represented", physical_base: "not_represented" }] }, RESOURCE);
  Object.assign(inventory.response, { snapshot: clone(initial.response.result.snapshot.snapshot.anchor),
    page: { source_count: 1, scanned: 1, completeness: { status: "complete" } }, physical_registers: "not_represented" });
  const spec = { client_label: "source-first-write", enabled: true, allocation, byte_offset: 0, byte_len: 4, access: "write", timing: "after_commit" };
  const registration = add("set_watchpoints", session(1, 2), { expected_revision: 1, watchpoints: [spec] }, { result: "acknowledged", accepted: 1 });
  const listing = add("list_watchpoints", session(1, 2), { page: { limit: 16 } },
    { result: "watchpoints", watchpoints: [{ watchpoint_id: 5, spec, hit_count: 0 }] });
  const watch = add("continue", session(10, 3), { expected_revision: 2, max_events: 65536 },
    { result: "control", stop: { reason: "watchpoint", watchpoint_id: 5, outcome: "active", exact: true },
      snapshot: { status: "unavailable", reason: "not_captured" }, events_advanced: 9 });
  const watchRefusal = unavailable(watch.response.session);
  const immediate = control(11, 4, 1, 0, 1, "forward", 1); stack(immediate);
  const immediateRefusal = unavailable(immediate.response.session), immediateMemory = memory(immediate, after);
  const sourceIds: number[] = [], summaries: Row[] = [], allRefusals: Pair[] = [watchRefusal, immediateRefusal];
  let oldCursor: Row = {};
  for (let i = 0; i < 3; i++) {
    const cp = control(i === 1 ? 9 : 12, 5 + i, i === 1 ? 1 : 0, i === 1 ? 0 : 1, i === 0 ? 1 : 2,
      i === 1 ? "reverse" : "forward", i === 0 ? 1 : 3);
    const stackPair = stack(cp, 0), a = cp.response.result.snapshot.snapshot.anchor;
    const rows = ["out", "a", "b", "result"].map((name, n) => ({
      variable_identity: hash(10 + n), name, function_ordinal: 0, scope_identity: hash(20), scope_depth: 0,
      generation: ["a", "b"].includes(name) ? 1 : 0,
      availability: { status: "value", value: name === "a" ? scalar("0xfffffff0") : name === "b" ? scalar("0x00000025")
        : { status: "unavailable", reason: "not_represented" } },
    }));
    const next = { query_identity: hash(105 + i), position: 2 }, pages: Pair[] = [];
    for (let page = 0; page < 2; page++) {
      const p = add("inspect_source_variables", cp.response.session, { scope: { level: "dispatch" }, frame: 1,
        selector: { selector: "all" }, page: { limit: 2, ...(page ? { cursor: next } : {}) } }, undefined, V2);
      Object.assign(p.response, { snapshot: { ...clone(a), frame: 1, occurrence: 1 }, values: clone(rows.slice(page * 2, page * 2 + 2)),
        ...(page ? {} : { next_cursor: clone(next) }) }); pages.push(p);
    }
    const m = memory(cp, i === 1 ? before : after);
    sourceIds.push(...[cp, stackPair, ...pages, m].map(p => p.request.request_id));
    summaries.push({ control_request_id: cp.request.request_id, checkpoint_anchor: clone(a),
      source_anchor: clone(pages[0].response.snapshot), source_request_ids: pages.map(p => p.request.request_id), ssa_count: 3, source_count: 4 });
    if (i === 0) {
      oldCursor = clone(next);
      allRefusals.push(failed(cp.response.session, "invalid_cursor", { selector: { selector: "name", name: "a" }, page: { limit: 2, cursor: oldCursor } }));
    } else if (i === 1) {
      allRefusals.push(failed(cp.response.session, "stale_revision", { expected_revision: 5 }));
      allRefusals.push(failed(cp.response.session, "invalid_cursor", { page: { limit: 2, cursor: oldCursor } }));
    }
  }
  const end = add("terminate", { ...session(12, 8), state: "terminated" }, { expected_revision: 7 }, { result: "terminated" });
  void end;
  const stubPin = (path: string) => ({ path, bytes: 1, sha256: hash(50) });
  const receipt: Row = {
    status: "passed", purpose: "existing-public-watchpoint-source-variable-resource-qualification",
    source: "crates/rustc-codegen-fe2o3/tests/fixtures/assembly-authoring-v30/src/lib.rs", source_sha256: hash(51),
    source_receipt: stubPin("/synthetic-only/not-a-real-capture/receipt.json"),
    bundle_sha256: hash(52), bundle_identity: hash(53), canonical_kir_digest: hash(54), request_sha256: hash(55),
    independent_result: { expected_u32: 469, output_words: 4, tail_canary_unchanged: true, hardware_observed: false },
    stages: ["inspection", "simulation"].map(name => ({ name, executable: "/synthetic-only/tool", args: [name],
      code: 0, signal: null, error: null, stdout: stubPin(name + ".stdout"), stderr: stubPin(name + ".stderr") })),
    selected_input_pins: [{ path: "/synthetic-only/input", bytes: 1, sha256: hash(56), identity: ["1", "1", "1", "1", "1", "1", "1"], cap: 1024 }],
    limits: { source: 256 * 1024, json: 1024 ** 2, bundle: 8 * 1024 ** 2, tool: 512 * 1024 ** 2, inputBytes: 2 * 1024 ** 3,
      line: 65536, requests: 256 * 1024, responses: 4 * 1024 ** 2, stderr: 65536, excerpt: 256 * 1024,
      retained: 8 * 1024 ** 2, failureReserve: 65536, commands: 128, pages: 32, values: 64,
      stageMs: 30000, debuggerMs: 120000, replyMs: 15000, drainMs: 10000, totalMs: 180000 },
    full_pairs: full.length, watchpoint_request_ids: [], source_request_ids: sourceIds, excerpts: [], raw_transcripts: [],
    refusals: allRefusals.map(p => ({ request_id: p.request.request_id, status: p.response.status,
      reason: p.response.reason ?? p.response.error.code })),
    watchpoint_source_query_request_id: watchRefusal.request.request_id,
    immediate_checkpoint_source_query_request_id: immediateRefusal.request.request_id,
    immediate_checkpoint_anchor: clone(immediate.response.result.snapshot.snapshot.anchor),
    observations: stubPin("observations.json"), independent_result_file: stubPin("independent-result.json"),
    debugger_stderr: stubPin("debug-stderr.txt"), checkpoints: summaries, raw_line_preservation: true,
    watchpoint_snapshot: "unavailable_not_captured", values_at_watchpoint_stop: "not_supplied",
    immediate_postwrite_source_values: "unavailable_checkpoint_not_captured",
    source_and_memory_belong_to: "distinct_cross_invocation_operation_checkpoints_only",
    source_checkpoint_lanes: [1, 0, 1], source_control_counts: [1, 2, 2],
    frame_identity: "static_stack_depth_not_dynamic_activation", source_to_ssa_mapping: "not_supplied",
    allocation_reuse: "not_represented", dynamic_helper_activation: "not_represented",
    source_authentication: false, hardware_observed: false, performance_prediction: false, elapsed_ms: 1,
  };
  const watchIds = [initial, inventory, registration, listing, watch, immediate, immediateMemory].map(p => p.request.request_id);
  receipt.watchpoint_request_ids = watchIds;
  return { full, watchIds, sourceIds, receipt };
}
/** Reserializes ONLY constructed synthetic controls. Never use on retained capture files. */
export async function syntheticWatchSourceFiles(capture = syntheticWatchSourceCapture()): Promise<WatchSourceFiles> {
  const lines = (ids: number[], field: "request" | "response") => capture.full.filter(p => ids.includes(p.request.request_id))
    .map(p => JSON.stringify(p[field]) + "\n").join("");
  const ids = capture.full.map(p => p.request.request_id);
  const files: Record<string, string> = {
    fullRequests: lines(ids, "request"), fullResponses: lines(ids, "response"),
    watchRequests: lines(capture.watchIds, "request"), watchResponses: lines(capture.watchIds, "response"),
    sourceRequests: lines(capture.sourceIds, "request"), sourceResponses: lines(capture.sourceIds, "response"),
  };
  const pins = await Promise.all(WATCH_SOURCE_FILES.filter(s => s.role !== "receipt").map(async s => ({
    path: s.leaf, bytes: new TextEncoder().encode(files[s.role]).length, sha256: await programSha256(files[s.role]),
  })));
  capture.receipt.raw_transcripts = pins.slice(0, 2); capture.receipt.excerpts = pins.slice(2);
  files.receipt = JSON.stringify(capture.receipt, null, 2) + "\n";
  return files as unknown as WatchSourceFiles;
}
/** Synthetic-only hash repinning for isolated semantic negatives. Does not grant provenance. */
export async function repinSyntheticWatchSourceFiles(files: WatchSourceFiles): Promise<WatchSourceFiles> {
  const receipt: Row = JSON.parse(files.receipt);
  const pins = await Promise.all(WATCH_SOURCE_FILES.filter(s => s.role !== "receipt").map(async s => ({
    path: s.leaf, bytes: new TextEncoder().encode(files[s.role]).length, sha256: await programSha256(files[s.role]),
  })));
  receipt.raw_transcripts = pins.slice(0, 2); receipt.excerpts = pins.slice(2);
  return { ...files, receipt: JSON.stringify(receipt, null, 2) + "\n" };
}
