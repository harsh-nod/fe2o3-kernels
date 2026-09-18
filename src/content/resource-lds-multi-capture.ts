/** Retained-display integrity only. No capture admission, executable decoder,
 * transport, inferred allocation owner, or lifecycle authority is introduced. */
import { projectResourceAccessResponse } from "./resource-access-view";
import { projectResourceMemoryResponse, resourceSnapshotAnchorKey, type ResourceSnapshotAnchor } from "./resource-memory-view";
import type { ResourceMemoryContext } from "../lib/resource-memory-controller";

export const RESOURCE_LDS_MULTI_MAX_BYTES = 512 * 1024;
export const RESOURCE_LDS_MULTI_CHECKPOINT_IDS = ["wg0_last_write", "wg1_global_only", "wg1_before_write",
  "reverse_wg0", "forward_wg1", "wg1_reduction", "final"] as const;
type CheckpointId = typeof RESOURCE_LDS_MULTI_CHECKPOINT_IDS[number];
type Row = Record<string, unknown>;
type Allocation = { ordinal: number; generation: 0 };
type Role = "global" | "first" | "second";
export interface RetainedLdsMultiPair { readonly request: Row; readonly response: Row }
export interface RetainedLdsMultiWindow extends RetainedLdsMultiPair {
  readonly allocationLabel: string;
  readonly addressSpace: "global" | "workgroup";
}
export interface RetainedLdsMultiAccessPage extends RetainedLdsMultiPair {
  readonly allocationLabel: string;
  readonly filterWorkgroup: 0 | 1;
  readonly allocationPresent: boolean;
  readonly rows: number;
  readonly hasMorePages: boolean;
}
export interface RetainedLdsMultiCheckpoint {
  readonly id: CheckpointId;
  readonly label: string;
  readonly expectedSnapshot: ResourceSnapshotAnchor;
  readonly anchorKey: string;
  readonly inventory: RetainedLdsMultiPair;
  readonly memories: readonly RetainedLdsMultiWindow[];
  readonly unavailableWindows: readonly RetainedLdsMultiWindow[];
  readonly accessPages: readonly RetainedLdsMultiAccessPage[];
}
export type ResourceLdsMultiCaptureProjection = {
  readonly status: "ready";
  readonly sha256: string;
  readonly receiptSha256: string;
  readonly sourceSha256: string;
  readonly bundleFileSha256: string;
  readonly context: ResourceMemoryContext;
  readonly checkpoints: readonly RetainedLdsMultiCheckpoint[];
} | { readonly status: "invalid" | "unavailable" | "cancelled"; readonly detail: string };

const profiles: ReadonlyArray<{
  label: string; workgroup: 0 | 1; present: Role | null; memories: Role[]; unavailable: Role[];
  accesses: Array<{ workgroup: 0 | 1; allocation: Role }>; direction: "forward" | "reverse";
}> = [
  { label: "WG0 — last output write", workgroup: 0, present: "first", memories: ["first", "global"], unavailable: [], accesses: [], direction: "forward" },
  { label: "WG1 — global-only checkpoint", workgroup: 1, present: null, memories: [], unavailable: ["first"], accesses: [], direction: "forward" },
  { label: "WG1 — first captured LDS window", workgroup: 1, present: "second", memories: ["second", "global"], unavailable: ["first"], accesses: [], direction: "forward" },
  { label: "Reverse-restored WG0", workgroup: 0, present: "first", memories: ["first"], unavailable: ["second"], accesses: [{ workgroup: 1, allocation: "second" }], direction: "reverse" },
  { label: "Forward-restored WG1", workgroup: 1, present: "second", memories: ["second"], unavailable: [], accesses: [{ workgroup: 0, allocation: "first" }, { workgroup: 1, allocation: "second" }], direction: "forward" },
  { label: "WG1 — reduction / first output write", workgroup: 1, present: "second", memories: ["second", "global"], unavailable: [], accesses: [{ workgroup: 1, allocation: "second" }, { workgroup: 1, allocation: "global" }], direction: "forward" },
  { label: "WG1 — last captured operation", workgroup: 1, present: "second", memories: ["global"], unavailable: [], accesses: [{ workgroup: 0, allocation: "global" }, { workgroup: 1, allocation: "global" }], direction: "reverse" },
];
function check(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function object(value: unknown): Row {
  check(value !== null && typeof value === "object" && !Array.isArray(value), "Expected a retained object."); return value as Row;
}
function keys(value: unknown, expected: string[]): Row {
  const row = object(value);
  check(Object.keys(row).length === expected.length && expected.every((key) => Object.hasOwn(row, key)), "Unexpected retained fields."); return row;
}
function integer(value: unknown, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum && value <= maximum;
}
function array(value: unknown, maximum: number): unknown[] {
  check(Array.isArray(value) && value.length <= maximum && Array.from({ length: value.length }, (_, index) => Object.hasOwn(value, index)).every(Boolean), "Retained collection exceeds its bound."); return value;
}
function digest(value: unknown): string {
  check(typeof value === "string" && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value), "An exact nonzero SHA-256 is required."); return value;
}
function bytes(value: unknown, maximum: number): Uint8Array<ArrayBuffer> {
  check(typeof value === "string" && value.length > 0 && value.length <= maximum, "Retained UTF-8 exceeds its byte bound.");
  for (const point of value) { const code = point.codePointAt(0)!; check(code < 0xd800 || code > 0xdfff, "Invalid retained Unicode."); }
  const result = new TextEncoder().encode(value); check(result.byteLength <= maximum, "Retained UTF-8 exceeds its byte bound."); return result;
}
async function hash(value: Uint8Array<ArrayBuffer>): Promise<string> {
  return Array.from(new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", value)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function parsed(text: string): Row {
  const value: unknown = JSON.parse(text), pending = [{ value, depth: 0 }]; let nodes = 0;
  while (pending.length) {
    const item = pending.pop()!; check(++nodes <= 65_536 && item.depth <= 32, "Retained JSON structure exceeds its bound.");
    if (item.value !== null && typeof item.value === "object") {
      const children = Array.isArray(item.value) ? array(item.value, 256) : Object.values(item.value);
      check(children.length <= 256, "Retained object exceeds its field bound.");
      for (const child of children) pending.push({ value: child, depth: item.depth + 1 });
    }
  }
  return object(value);
}
function same(left: unknown, right: unknown, detail: string): void { check(JSON.stringify(left) === JSON.stringify(right), detail); }
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value;
}
function allocation(value: unknown): Allocation {
  const row = keys(value, ["ordinal", "generation"]); check(integer(row.ordinal, 1) && row.generation === 0, "Unsupported allocation identity or generation.");
  return { ordinal: row.ordinal, generation: 0 };
}
function receipt(value: unknown): Row {
  const row = keys(value, ["schema", "source_path", "source_sha256", "bundle_sha256", "export_observation_sha256", "simulation_request_sha256",
    "simulation_stdout_sha256", "debug_requests_sha256", "debug_responses_sha256", "results_sha256", "script_sha256", "helper_sha256", "executable_sha256",
    "commands", "response_bytes", "grid", "workgroup", "logical_wave_width", "expected_u32", "observed_workgroup_allocations", "global_allocation", "transition_steps",
    "evidence_kind", "source_edited", "metadata_authority", "compiler_closure_attestation", "allocation_generation", "owning_scope", "lifetime", "physical_base",
    "physical_registers", "source_helper_or_loop_qualification", "allocation_release_event_captured", "physical_reuse_observed", "hardware_observed", "performance_prediction",
    "grants_production_resume", "grants_load_authority", "grants_launch_authority", "script_limits", "disk_reserve_bytes", "cli_capture_limits", "checks"]);
  check(row.schema === "fe2o3-lds-two-workgroups-source-smoke-v1" && row.source_path === "crates/rustc-codegen-fe2o3/tests/fixtures/production-ranked-bounds-device/src/lib.rs" &&
    row.evidence_kind === "actual_v5_admission_and_cpu_simulation_observation" && row.metadata_authority === "inert_cross_file_consistency_not_compiler_authentication" &&
    row.compiler_closure_attestation === "unavailable" && row.allocation_generation === "producer_profile_zero_not_lifetime_evidence", "Unsupported source observation receipt.");
  for (const field of ["source_edited", "source_helper_or_loop_qualification", "allocation_release_event_captured", "physical_reuse_observed", "hardware_observed", "performance_prediction",
    "grants_production_resume", "grants_load_authority", "grants_launch_authority"]) check(row[field] === false, "Receipt makes an unsupported authority claim.");
  for (const field of ["owning_scope", "lifetime", "physical_base", "physical_registers"]) check(row[field] === "not_represented", "Receipt elevates an unavailable fact.");
  for (const field of ["source_sha256", "bundle_sha256", "export_observation_sha256", "simulation_request_sha256", "simulation_stdout_sha256", "debug_requests_sha256",
    "debug_responses_sha256", "results_sha256", "script_sha256", "helper_sha256"]) digest(row[field]);
  const executables = keys(row.executable_sha256, ["simulator", "debugger"]); digest(executables.simulator); digest(executables.debugger);
  same(row.grid, [128, 1, 1], "Unexpected dispatch geometry."); same(row.workgroup, [64, 1, 1], "Unexpected workgroup geometry.");
  check(row.logical_wave_width === 32 && row.expected_u32 === 128 && integer(row.commands, 1, 4096) && integer(row.response_bytes, 1, 8 * 1024 * 1024) &&
    integer(row.transition_steps, 1, 256), "Unsupported retained case bounds.");
  same(row.script_limits, { records: 65536, pages: 256, page_items: 256, page_scanned: 256, commands: 4096, discovery_steps: 256,
    request_bytes: 65536, response_bytes: 2097152, transcript_bytes: 67108864, result_bytes: 16777216, stderr_bytes: 65536,
    reply_timeout_ms: 30000, process_timeout_ms: 120000 }, "Unsupported script limit observation.");
  check(row.disk_reserve_bytes === "42949672960", "Unsupported disk reserve observation.");
  same(row.cli_capture_limits, { records: 1000000, retained_memory_bytes: 268435456,
    interpretation: "existing CLI hard limits; script selection bounds do not configure runtime capture" }, "Unsupported CLI limit observation.");
  const checks = array(row.checks, 32); check(checks.length > 0 && checks.every((item) => typeof item === "string" && /^[a-z0-9_]{1,128}$/u.test(item)), "Invalid receipt check labels.");
  return row;
}
function pair(value: unknown, seen: Set<number>): RetainedLdsMultiPair {
  const row = keys(value, ["request", "response"]), request = object(row.request), response = object(row.response);
  check(integer(request.request_id, 1) && !seen.has(request.request_id) && request.request_id === response.request_id && request.operation === response.operation, "Duplicate or cross-paired retained request/response.");
  seen.add(request.request_id); return { request, response };
}
function session(response: Row, anchor: ResourceSnapshotAnchor): void {
  const row = keys(response.session, ["backend", "execution_kind", "state", "revision", "configuration_identity", "cursor", "simulated", "hardware_observed", "performance_prediction"]);
  check(row.backend === "cpu_kir_simulator" && row.execution_kind === "cpu_kir_simulation" && row.state === "stopped" && row.simulated === true && row.hardware_observed === false &&
    row.performance_prediction === false && row.revision === anchor.cursor.state_revision && row.configuration_identity === anchor.cursor.configuration_identity, "Response is not the selected stopped CPU session.");
  same(row.cursor, anchor.cursor, "Response cursor or revision differs.");
}
function restored(current: ResourceSnapshotAnchor, previous: ResourceSnapshotAnchor): void {
  check(current.cursor.state_revision > previous.cursor.state_revision, "Restored cursor needs its actual newer revision.");
  same(current, { ...previous, cursor: { ...previous.cursor, state_revision: current.cursor.state_revision } }, "Restored checkpoint changes more than revision.");
}

export async function projectResourceLdsMultiCapture(retainedUtf8: string, expectedSha256: string, signal?: AbortSignal): Promise<ResourceLdsMultiCaptureProjection> {
  try {
    const raw = bytes(retainedUtf8, RESOURCE_LDS_MULTI_MAX_BYTES), expected = digest(expectedSha256);
    if (signal?.aborted) return { status: "cancelled", detail: "Capture selection was cancelled." };
    if (!globalThis.crypto?.subtle) return { status: "unavailable", detail: "WebCrypto is required; no retained resources are shown." };
    check(await hash(raw) === expected, "Retained capture bytes differ from the independent SHA-256 pin.");
    if (signal?.aborted) return { status: "cancelled", detail: "Capture selection was cancelled." };
    const envelope = keys(parsed(retainedUtf8), ["schema", "receipt", "context", "checkpoints"]);
    check(envelope.schema === "fe2o3-retained-lds-multi-workgroup-view-v1", "Unsupported retained display schema.");
    const artifact = keys(envelope.receipt, ["sha256", "utf8"]), receiptBytes = bytes(artifact.utf8, 16384), receiptSha256 = digest(artifact.sha256);
    check(await hash(receiptBytes) === receiptSha256, "Retained receipt bytes differ from their SHA-256.");
    if (signal?.aborted) return { status: "cancelled", detail: "Capture selection was cancelled." };
    const facts = receipt(parsed(artifact.utf8 as string)), observed = array(facts.observed_workgroup_allocations, 2);
    check(observed.length === 2, "Two observed allocation identities are required.");
    const allocations = { global: allocation(facts.global_allocation), first: allocation(observed[0]), second: allocation(observed[1]) };
    check(new Set(Object.values(allocations).map((item) => item.ordinal)).size === 3, "Observed allocations must have distinct identities.");
    const contextRow = keys(envelope.context, ["connectionId", "captureIdentity", "target", "variantIdentity"]);
    check(contextRow.connectionId === "retained-lds-multi-workgroup-v5-r1" && contextRow.captureIdentity === facts.debug_responses_sha256 &&
      contextRow.target === "gfx942:xnack-" && contextRow.variantIdentity === facts.bundle_sha256, "Caller-owned capture context differs from the receipt.");
    const context = contextRow as unknown as ResourceMemoryContext, seen = new Set<number>(), input = array(envelope.checkpoints, 7);
    check(input.length === 7, "Exactly seven retained checkpoints are required.");
    const checkpoints = input.map((value, index): RetainedLdsMultiCheckpoint => {
      const row = keys(value, ["id", "expectedSnapshot", "control", "inventory", "memories", "unavailableWindows", "accessPages"]), profile = profiles[index];
      check(row.id === RESOURCE_LDS_MULTI_CHECKPOINT_IDS[index], "Unexpected retained checkpoint order or ID.");
      const id = RESOURCE_LDS_MULTI_CHECKPOINT_IDS[index], anchorKey = resourceSnapshotAnchorKey(row.expectedSnapshot);
      check(anchorKey !== null, "Invalid or inexact full checkpoint anchor."); const anchor = row.expectedSnapshot as ResourceSnapshotAnchor;
      check(anchor.cursor.event_sequence > 0 && anchor.cursor.event_sequence <= 65536 && anchor.scope.level === "lane" && anchor.scope.wave_width === 32 &&
        anchor.scope.active_mask === 0xffff_ffff && anchor.scope.wave <= 1, "Unsupported logical checkpoint profile.");
      same(anchor.scope.workgroup, [profile.workgroup, 0, 0], "Selected checkpoint workgroup differs.");
      check(integer(anchor.scope.lane, 0, 31), "Invalid logical lane.");
      same(anchor.scope.logical_workitem, [profile.workgroup * 64 + anchor.scope.wave * 32 + anchor.scope.lane, 0, 0], "Logical workitem differs from this profile.");
      const control = pair(row.control, seen);
      keys(control.response, ["schema", "status", "request_id", "operation", "session", "result"]);
      keys(control.request, ["schema", "request_id", "expected_revision", "operation", "direction", "granularity", "count"]);
      check(control.request.schema === "fe2o3-debug-request-v1" && control.request.operation === "step" && control.request.direction === profile.direction &&
        control.request.granularity === "operation" && control.request.count === 1 && integer(control.request.expected_revision) &&
        control.request.expected_revision + 1 === anchor.cursor.state_revision && control.response.schema === "fe2o3-debug-response-v1" && control.response.status === "ok", "Invalid independent control pair.");
      session(control.response, anchor);
      const result = keys(control.response.result, ["result", "stop", "snapshot", "events_advanced"]),
        captured = keys(result.snapshot, ["status", "snapshot"]), stop = { reason: "step", outcome: "active", exact: true };
      keys(captured.snapshot, ["anchor", "stop", "values"]);
      check(result.result === "control" && captured.status === "captured" && result.events_advanced === 1, "Independent control is not an exact captured step.");
      same(result.stop, stop, "Independent stop differs."); same(object(captured.snapshot).stop, stop, "Independent snapshot stop differs.");
      same(object(captured.snapshot).anchor, anchor, "Independent control and selected full anchor differ.");
      const inventory = pair(row.inventory, seen), inventoryProjection = projectResourceAccessResponse({ ...inventory, expectedRequest: inventory.request, expectedSnapshot: anchor, context, responseContext: context });
      // Absence needs the complete unfiltered inventory, not a final filtered or
      // continuation page. Capture completeness alone would not establish that.
      keys(inventory.request, ["schema", "request_id", "expected_revision", "operation", "expected_snapshot", "page"]);
      keys(inventory.request.page, ["max_items", "max_scanned"]);
      check(inventoryProjection.status === "ready" && inventoryProjection.kind === "allocations" && !inventoryProjection.hasMorePages &&
        inventoryProjection.completeness.status === "complete", "Inventory is not one complete captured allocation page.");
      check(inventoryProjection.sourceCount === inventoryProjection.rows.length && inventoryProjection.scanned === inventoryProjection.rows.length,
        "Current allocation inventory is not the complete unfiltered collection.");
      const expectedInventory = [allocations.global, ...(profile.present ? [allocations[profile.present]] : [])];
      same(inventoryProjection.rows.map((item) => item.allocation), expectedInventory, "Current allocation inventory differs from this stop.");
      for (const item of inventoryProjection.rows) {
        const global = item.allocation.ordinal === allocations.global.ordinal;
        check(item.address_space === (global ? "global" : "workgroup") && item.capacity_bytes === (global ? "520" : "256") && item.access === "read_write" && item.alignment === 4 &&
          item.snapshot_bytes_available && item.initialization_available, "Unsupported current allocation facts.");
      }
      const windows = (value: unknown, roles: Role[], unavailable: boolean): RetainedLdsMultiWindow[] => {
        const values = array(value, unavailable ? 1 : 2); check(values.length === roles.length, "Missing or additional retained memory window.");
        return values.map((item, position) => {
          const query = pair(item, seen), identity = allocations[roles[position]], addressSpace = roles[position] === "global" ? "global" : "workgroup";
          keys(query.request, ["schema", "request_id", "expected_revision", "operation", "allocation", "byte_offset", "byte_len"]);
          check(query.request.schema === "fe2o3-debug-request-v1" && query.request.operation === "read_memory" && query.request.expected_revision === anchor.cursor.state_revision &&
            query.request.byte_offset === 0 && query.request.byte_len === (addressSpace === "global" ? 520 : 256), "Memory request range or revision differs.");
          same(query.request.allocation, identity, "Memory request names another allocation.");
          const projection = projectResourceMemoryResponse(query.response, anchor);
          check(projection.status === "ready", "Memory response is stale, malformed, or unsupported.");
          const read = projection.memory;
          check(projection.requestId === query.request.request_id && read.byte_offset === query.request.byte_offset && read.requested_bytes === query.request.byte_len, "Memory response differs from requested window.");
          same(read.allocation, identity, "Memory response names another allocation.");
          const present = inventoryProjection.rows.some((candidate) => candidate.allocation.ordinal === identity.ordinal);
          if (unavailable) {
            check(!present && read.returned_bytes === 0 && read.availability.status === "unavailable" && read.availability.reason === "not_represented", "Unavailable window was replaced by current or fabricated bytes.");
          } else {
            check(present && read.returned_bytes === read.requested_bytes && read.availability.status === "captured" && read.availability.address_space === addressSpace && !read.availability.truncated, "Current window is absent, partial, or relabelled.");
            const expectedInitialized = addressSpace === "global" ? `0x${"ff".repeat(65)}` : ["wg1_before_write", "forward_wg1"].includes(id) ? `0x${"00".repeat(32)}` : `0x${"ff".repeat(32)}`;
            check(read.availability.initialized === expectedInitialized, "Window initialization differs from this retained stop.");
          }
          return { ...query, allocationLabel: `alloc#${identity.ordinal}:g0`, addressSpace };
        });
      };
      const memories = windows(row.memories, profile.memories, false), unavailableWindows = windows(row.unavailableWindows, profile.unavailable, true);
      const pageInputs = array(row.accessPages, 2); check(pageInputs.length === profile.accesses.length, "Missing or additional retained access page.");
      const accessPages = pageInputs.map((item, position): RetainedLdsMultiAccessPage => {
        const query = pair(item, seen), selection = profile.accesses[position], identity = allocations[selection.allocation];
        const projection = projectResourceAccessResponse({ ...query, expectedRequest: query.request, expectedSnapshot: anchor, context, responseContext: context });
        check(projection.status === "ready" && projection.kind === "memory_accesses" && projection.completeness.status === "complete", "Access page is stale, malformed, or unsupported.");
        const filter = keys(query.request.filter, ["scope", "address_space", "allocation"]);
        same(filter.scope, { level: "workgroup", workgroup: [selection.workgroup, 0, 0] }, "Access page filter names another workgroup.");
        same(filter.allocation, identity, "Access page filter names another allocation.");
        check(filter.address_space === (selection.allocation === "global" ? "global" : "workgroup"), "Access page address space differs.");
        return { ...query, allocationLabel: `alloc#${identity.ordinal}:g0`, filterWorkgroup: selection.workgroup,
          allocationPresent: inventoryProjection.rows.some((candidate) => candidate.allocation.ordinal === identity.ordinal), rows: projection.rows.length, hasMorePages: projection.hasMorePages };
      });
      return { id, label: profile.label, expectedSnapshot: anchor, anchorKey, inventory, memories, unavailableWindows, accessPages };
    });
    check(seen.size === 33, "Unexpected selected pair count.");
    const anchors = checkpoints.map((checkpoint) => checkpoint.expectedSnapshot);
    check(anchors.every((anchor) => anchor.cursor.configuration_identity === anchors[0].cursor.configuration_identity), "Checkpoints cross configurations.");
    check(anchors[0].cursor.event_sequence < anchors[1].cursor.event_sequence && anchors[1].cursor.event_sequence < anchors[2].cursor.event_sequence &&
      anchors[4].cursor.event_sequence < anchors[5].cursor.event_sequence && anchors[5].cursor.event_sequence < anchors[6].cursor.event_sequence, "Unexpected checkpoint sequence.");
    restored(anchors[3], anchors[0]); restored(anchors[4], anchors[2]);
    return freeze({ status: "ready", sha256: expected, receiptSha256, sourceSha256: digest(facts.source_sha256), bundleFileSha256: digest(facts.bundle_sha256), context, checkpoints });
  } catch (error) {
    return { status: "invalid", detail: error instanceof Error ? error.message.slice(0, 240) : "Invalid retained resource example." };
  }
}
