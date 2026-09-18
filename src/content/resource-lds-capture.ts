/** Bounded display integrity for one retained CPU example. Not a capture
 * decoder, producer authenticator, executable format, or debugger transport. */
import { projectResourceAccessResponse } from "./resource-access-view";
import { projectResourceMemoryResponse, resourceSnapshotAnchorKey, type ResourceSnapshotAnchor } from "./resource-memory-view";
import type { ResourceMemoryContext } from "../lib/resource-memory-controller";

export const RESOURCE_LDS_MAX_BYTES = 512 * 1024;
export const RESOURCE_LDS_CHECKPOINT_IDS = ["pre_write", "first_write", "reduction", "final"] as const;
type CheckpointId = typeof RESOURCE_LDS_CHECKPOINT_IDS[number];
type Space = "global" | "workgroup";
type RecordValue = Record<string, unknown>;
export interface RetainedResourcePair { readonly request: RecordValue; readonly response: RecordValue }
export interface RetainedResourceWindow extends RetainedResourcePair { readonly addressSpace: Space }
export interface RetainedLdsCheckpoint {
  readonly id: CheckpointId;
  readonly label: string;
  readonly expectedSnapshot: ResourceSnapshotAnchor;
  readonly anchorKey: string;
  readonly inventory: RetainedResourcePair;
  readonly memories: readonly RetainedResourceWindow[];
  readonly accessPages: readonly RetainedResourceWindow[];
}
export type ResourceLdsCaptureProjection = {
  readonly status: "ready";
  readonly sha256: string;
  readonly receiptSha256: string;
  readonly sourceSha256: string;
  readonly bundleFileSha256: string;
  readonly context: ResourceMemoryContext;
  readonly checkpoints: readonly RetainedLdsCheckpoint[];
} | { readonly status: "invalid" | "unavailable" | "cancelled"; readonly detail: string };

const labels: Record<CheckpointId, string> = {
  pre_write: "Before the first LDS write",
  first_write: "After the first LDS write",
  reduction: "Reduction / first global write",
  final: "Last captured operation",
};
function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function object(value: unknown): RecordValue {
  check(typeof value === "object" && value !== null && !Array.isArray(value), "Expected a retained object.");
  return value as RecordValue;
}
function keys(value: unknown, names: string[]): RecordValue {
  const row = object(value);
  check(Object.keys(row).length === names.length && names.every((name) => Object.hasOwn(row, name)), "Unexpected retained fields.");
  return row;
}
function integer(value: unknown, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum && value <= maximum;
}
function digest(value: unknown): string {
  check(typeof value === "string" && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value), "An exact nonzero SHA-256 is required.");
  return value;
}
function array(value: unknown, maximum: number): unknown[] {
  check(Array.isArray(value) && value.length <= maximum &&
    Array.from({ length: value.length }, (_, index) => Object.hasOwn(value, index)).every(Boolean), "Retained collection exceeds its bound.");
  return value;
}
function textBytes(value: unknown, maximum: number): Uint8Array<ArrayBuffer> {
  check(typeof value === "string" && value.length > 0 && value.length <= maximum, "Retained UTF-8 exceeds its byte bound.");
  for (const point of value) {
    const code = point.codePointAt(0)!;
    check(code < 0xd800 || code > 0xdfff, "Invalid retained Unicode.");
  }
  const bytes = new TextEncoder().encode(value);
  check(bytes.byteLength <= maximum, "Retained UTF-8 exceeds its byte bound.");
  return bytes;
}
async function hash(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  return Array.from(new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes)), (value) => value.toString(16).padStart(2, "0")).join("");
}
function parsed(text: string): RecordValue {
  const value: unknown = JSON.parse(text);
  const pending = [{ value, depth: 0 }];
  let nodes = 0;
  while (pending.length) {
    const item = pending.pop()!;
    check(++nodes <= 65_536 && item.depth <= 32, "Retained JSON structure exceeds its bound.");
    if (item.value !== null && typeof item.value === "object") {
      const children = Array.isArray(item.value) ? array(item.value, 256) : Object.values(item.value);
      check(children.length <= 256, "Retained object exceeds its field bound.");
      for (const child of children) pending.push({ value: child, depth: item.depth + 1 });
    }
  }
  return object(value);
}
function same(left: unknown, right: unknown, message: string): void {
  check(JSON.stringify(left) === JSON.stringify(right), message);
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function session(response: RecordValue, anchor: ResourceSnapshotAnchor): void {
  const row = keys(response.session, ["backend", "execution_kind", "state", "revision", "configuration_identity", "cursor", "simulated", "hardware_observed", "performance_prediction"]);
  check(row.backend === "cpu_kir_simulator" && row.execution_kind === "cpu_kir_simulation" &&
    row.state === "stopped" && row.simulated === true && row.hardware_observed === false &&
    row.performance_prediction === false && row.revision === anchor.cursor.state_revision &&
    row.configuration_identity === anchor.cursor.configuration_identity, "Response is not the selected stopped CPU session.");
  same(row.cursor, anchor.cursor, "Response cursor or revision differs.");
}
function pair(value: unknown, seen: Set<number>): RetainedResourcePair {
  const row = keys(value, ["request", "response"]), request = object(row.request), response = object(row.response);
  check(integer(request.request_id, 1) && !seen.has(request.request_id) &&
    response.request_id === request.request_id && response.operation === request.operation, "Duplicate or mismatched retained request/response.");
  seen.add(request.request_id);
  return { request, response };
}
function receipt(value: unknown): RecordValue {
  const row = keys(value, ["schema", "source_path", "source_sha256", "bundle_sha256", "export_observation_sha256",
    "simulation_request_sha256", "simulation_stdout_sha256", "debug_requests_sha256", "debug_responses_sha256",
    "commands", "response_bytes", "expected_u32", "workgroup", "logical_wave_width", "workgroup_allocation",
    "global_allocation", "workgroup_accesses_at_reduction", "evidence_kind", "metadata_authority",
    "compiler_closure_attestation", "source_edited", "hardware_observed", "performance_prediction",
    "grants_production_resume", "grants_load_authority", "grants_launch_authority", "allocation_generation",
    "owning_scope", "lifetime", "physical_base", "physical_registers", "access_source_association", "checks"]);
  check(row.schema === "fe2o3-lds-resource-query-source-smoke-v1" &&
    row.source_path === "crates/rustc-codegen-fe2o3/tests/fixtures/production-ranked-bounds-device/src/lib.rs" &&
    row.evidence_kind === "actual_v5_admission_and_cpu_simulation_observation" &&
    row.metadata_authority === "inert_cross_file_consistency_not_compiler_authentication" &&
    row.compiler_closure_attestation === "unavailable" &&
    row.allocation_generation === "producer_profile_zero_not_lifetime_evidence", "Unsupported source observation receipt.");
  for (const field of ["source_edited", "hardware_observed", "performance_prediction", "grants_production_resume", "grants_load_authority", "grants_launch_authority"]) check(row[field] === false, "Receipt makes an unsupported authority claim.");
  for (const field of ["owning_scope", "lifetime", "physical_base", "physical_registers", "access_source_association"]) check(row[field] === "not_represented", "Receipt elevates an unavailable fact.");
  for (const field of ["source_sha256", "bundle_sha256", "export_observation_sha256", "simulation_request_sha256", "simulation_stdout_sha256", "debug_requests_sha256", "debug_responses_sha256"]) digest(row[field]);
  same(row.workgroup, [64, 1, 1], "Unexpected workgroup geometry.");
  check(row.logical_wave_width === 32 && row.expected_u32 === 128 && integer(row.commands, 1, 1024) &&
    integer(row.response_bytes, 1, 4 * 1024 * 1024) && integer(row.workgroup_accesses_at_reduction, 1, 8192), "Unsupported retained case bounds.");
  for (const field of ["workgroup_allocation", "global_allocation"]) {
    const allocation = keys(row[field], ["ordinal", "generation"]);
    check(integer(allocation.ordinal, 1) && allocation.generation === 0, "Unsupported allocation generation.");
  }
  check(object(row.workgroup_allocation).ordinal !== object(row.global_allocation).ordinal, "Address spaces reuse an allocation identity.");
  const checks = array(row.checks, 32);
  check(checks.length > 0 && checks.every((item) => typeof item === "string" && /^[a-z0-9_]{1,128}$/u.test(item)), "Invalid receipt check labels.");
  return row;
}

export async function projectResourceLdsCapture(
  retainedUtf8: string, expectedSha256: string, signal?: AbortSignal,
): Promise<ResourceLdsCaptureProjection> {
  try {
    const bytes = textBytes(retainedUtf8, RESOURCE_LDS_MAX_BYTES), expected = digest(expectedSha256);
    if (signal?.aborted) return { status: "cancelled", detail: "Capture selection was cancelled." };
    if (!globalThis.crypto?.subtle) return { status: "unavailable", detail: "WebCrypto is required; no retained resources are shown." };
    check(await hash(bytes) === expected, "Retained capture bytes differ from the independent SHA-256 pin.");
    if (signal?.aborted) return { status: "cancelled", detail: "Capture selection was cancelled." };
    const envelope = keys(parsed(retainedUtf8), ["schema", "receipt", "context", "checkpoints"]);
    check(envelope.schema === "fe2o3-retained-lds-resource-view-v1", "Unsupported retained display schema.");
    const artifact = keys(envelope.receipt, ["sha256", "utf8"]);
    const receiptBytes = textBytes(artifact.utf8, 16_384), receiptSha256 = digest(artifact.sha256);
    check(await hash(receiptBytes) === receiptSha256, "Retained receipt bytes differ from their SHA-256.");
    if (signal?.aborted) return { status: "cancelled", detail: "Capture selection was cancelled." };
    const facts = receipt(parsed(artifact.utf8 as string));
    const contextRow = keys(envelope.context, ["connectionId", "captureIdentity", "target", "variantIdentity"]);
    check(contextRow.connectionId === "retained-lds-v5-r3" && contextRow.captureIdentity === facts.debug_responses_sha256 &&
      contextRow.target === "gfx942:xnack-" && contextRow.variantIdentity === facts.bundle_sha256, "Caller-owned capture context differs from the selected receipt.");
    const context = contextRow as unknown as ResourceMemoryContext;
    const seenIds = new Set<number>(), seenCheckpoints = new Set<string>();
    const checkpoints = array(envelope.checkpoints, 4).map((value): RetainedLdsCheckpoint => {
      const row = keys(value, ["id", "expectedSnapshot", "control", "inventory", "memories", "accessPages"]);
      check(typeof row.id === "string" && RESOURCE_LDS_CHECKPOINT_IDS.includes(row.id as CheckpointId) && !seenCheckpoints.has(row.id), "Unknown or duplicate retained checkpoint.");
      seenCheckpoints.add(row.id);
      const id = row.id as CheckpointId, anchorKey = resourceSnapshotAnchorKey(row.expectedSnapshot);
      check(anchorKey !== null, "Invalid or inexact full checkpoint anchor.");
      const anchor = row.expectedSnapshot as ResourceSnapshotAnchor;
      check(anchor.scope.level === "lane" && anchor.scope.wave_width === 32 && anchor.scope.active_mask === 0xffff_ffff &&
        anchor.scope.wave <= 1, "Unsupported logical wave profile.");
      same(anchor.scope.workgroup, [0, 0, 0], "Unexpected selected workgroup.");
      const control = pair(row.control, seenIds);
      keys(control.request, ["schema", "request_id", "expected_revision", "operation", "direction", "granularity", "count"]);
      check(control.request.schema === "fe2o3-debug-request-v1" && control.request.operation === "step" &&
        (control.request.direction === "forward" || control.request.direction === "reverse") &&
        control.request.granularity === "operation" && control.request.count === 1 &&
        integer(control.request.expected_revision) && control.request.expected_revision + 1 === anchor.cursor.state_revision &&
        control.response.schema === "fe2o3-debug-response-v1" && control.response.status === "ok", "Invalid independent control pair.");
      session(control.response, anchor);
      const controlResult = object(control.response.result), captured = object(controlResult.snapshot);
      check(controlResult.result === "control" && captured.status === "captured", "Independent control checkpoint is unavailable.");
      const stop = keys(controlResult.stop, ["reason", "outcome", "exact"]);
      check(stop.reason === "step" && stop.outcome === "active" && stop.exact === true &&
        controlResult.events_advanced === 1, "Independent control checkpoint is not an exact single-operation stop.");
      same(object(captured.snapshot).stop, stop, "Independent snapshot and control stop differ.");
      same(object(captured.snapshot).anchor, anchor, "Independent control and selected full anchor differ.");
      const inventory = pair(row.inventory, seenIds);
      const inventoryProjection = projectResourceAccessResponse({ ...inventory, expectedRequest: inventory.request,
        expectedSnapshot: anchor, context, responseContext: context });
      check(inventoryProjection.status === "ready" && inventoryProjection.kind === "allocations", "Allocation inventory is not an exact supported captured page.");
      const windows = (input: unknown, memory: boolean): RetainedResourceWindow[] => {
        const spaces = new Set<Space>();
        return array(input, 2).map((item) => {
          const window = keys(item, ["addressSpace", "request", "response"]);
          check((window.addressSpace === "global" || window.addressSpace === "workgroup") && !spaces.has(window.addressSpace), "Duplicate or unsupported window address space.");
          const addressSpace = window.addressSpace;
          spaces.add(addressSpace);
          const query = pair({ request: window.request, response: window.response }, seenIds);
          const allocation = object(facts[addressSpace === "global" ? "global_allocation" : "workgroup_allocation"]);
          if (memory) {
            keys(query.request, ["schema", "request_id", "expected_revision", "operation", "allocation", "byte_offset", "byte_len"]);
            check(query.request.schema === "fe2o3-debug-request-v1" && query.request.operation === "read_memory" &&
              query.request.expected_revision === anchor.cursor.state_revision, "Memory request belongs to another operation or revision.");
            same(query.request.allocation, allocation, "Memory request names another allocation generation.");
            const projection = projectResourceMemoryResponse(query.response, anchor);
            check(projection.status === "ready", "Memory response is stale, malformed, or unsupported.");
            const read = projection.memory;
            check(projection.requestId === query.request.request_id && read.byte_offset === query.request.byte_offset &&
              read.requested_bytes === query.request.byte_len, "Memory response differs from the exact requested window.");
            same(read.allocation, allocation, "Memory response names another allocation generation.");
            check(read.availability.status !== "captured" || read.availability.address_space === addressSpace, "Memory address-space label differs from captured facts.");
            const inventoryRow = inventoryProjection.rows.find((candidate) => candidate.allocation.ordinal === allocation.ordinal);
            check(inventoryRow?.address_space === addressSpace &&
              BigInt(read.byte_offset) + BigInt(read.requested_bytes) <= BigInt(inventoryRow.capacity_bytes), "Memory window exceeds the captured allocation.");
          } else {
            const projection = projectResourceAccessResponse({ ...query, expectedRequest: query.request,
              expectedSnapshot: anchor, context, responseContext: context });
            check(projection.status === "ready" && projection.kind === "memory_accesses", "Access page is stale, malformed, or unsupported.");
            const filter = object(query.request.filter);
            check(filter.address_space === addressSpace, "Access page address-space label differs.");
            same(filter.allocation, allocation, "Access page names another allocation generation.");
            same(filter.scope, { level: "workgroup", workgroup: [0, 0, 0] }, "Access page scope differs from the retained workgroup.");
          }
          return { addressSpace, ...query };
        });
      };
      const memories = windows(row.memories, true);
      check(memories.length > 0, "A retained checkpoint needs an actual memory window.");
      return { id, label: labels[id], expectedSnapshot: anchor, anchorKey, inventory, memories, accessPages: windows(row.accessPages, false) };
    });
    check(checkpoints.length > 0, "No retained checkpoints were supplied.");
    return freeze({ status: "ready", sha256: expected, receiptSha256, sourceSha256: digest(facts.source_sha256),
      bundleFileSha256: digest(facts.bundle_sha256), context, checkpoints });
  } catch (error) {
    return { status: "invalid", detail: error instanceof Error ? error.message.slice(0, 240) : "Invalid retained resource example." };
  }
}
