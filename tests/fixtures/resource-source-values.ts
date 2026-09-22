// Synthetic presentation controls only; these are NOT a retained producer capture.
import type { ImportedResourceCheckpoint } from "../../src/content/recorded-resource-import";
import { resourceSnapshotAnchorKey } from "../../src/content/resource-memory-view";
import type { MutableResourceControl } from "./recorded-resource-import";

export interface SyntheticSourcePair {
  requestId: number;
  request: MutableResourceControl;
  response: MutableResourceControl;
}
export function syntheticSourceValueGroup(event = 2, revision = 2) {
  const cursor = { configuration_identity: "1".repeat(64), event_sequence: event, state_revision: revision };
  const session = { backend: "cpu_kir_simulator", execution_kind: "cpu_kir_simulation", state: "stopped",
    revision, configuration_identity: cursor.configuration_identity, cursor,
    simulated: true, hardware_observed: false, performance_prediction: false };
  const anchor = {
    cursor, scope: { level: "lane", workgroup: [0, 0, 0], wave: 0, lane: 0, logical_workitem: [0, 0, 0],
      active_mask: 15, wave_width: 32, interpretation: "logical_visualization" },
    site: { kir: { function_ordinal: 0, block_ordinal: 0, point: { kind: "operation", operation_ordinal: 0 } },
      source: { status: "resolved", location: { map_identity: "2".repeat(64), file_identity: "3".repeat(64),
        provenance: "compiler_bundle_bound", byte_start: 377, byte_end: 402 } } },
  };
  const scalar = (bits: string) => ({ status: "captured", value_type: { kind: "integer", signed: false, bits: 32 },
    value: { encoding: "bits", bits }, provenance: "simulated_observation" });
  const values = ["0xfffffff0", "0x00000025"].map((bits, value_ordinal) => ({
    path: { root: { kind: "ssa", function_ordinal: 0, frame: 1, value_ordinal }, components: [] }, availability: scalar(bits),
  }));
  const stop = { reason: "step", outcome: "active", exact: true };
  const request = { schema: "fe2o3-debug-request-v1", request_id: 4, expected_revision: revision - 1,
    operation: "step", direction: "forward", granularity: "operation", count: 1 };
  const response = { status: "ok", schema: "fe2o3-debug-response-v1", request_id: 4, operation: "step", session,
    result: { result: "control", stop, snapshot: { status: "captured", snapshot: { anchor, stop, values } }, events_advanced: 1 } };
  const checkpoint = structuredClone({ anchor, anchorKey: resourceSnapshotAnchorKey(anchor),
    control: { kind: "checkpoint", requestId: 4, line: 1, request, response,
      requestUtf8: JSON.stringify(request) + "\n", responseUtf8: JSON.stringify(response) + "\n" },
    pages: [], memories: [],
  }) as ImportedResourceCheckpoint;
  const stack: SyntheticSourcePair = structuredClone({ requestId: 5,
    request: { schema: "fe2o3-debug-request-v1", request_id: 5, expected_revision: revision, operation: "inspect_stack",
      scope: { level: "dispatch" }, page: { limit: 16 } },
    response: { status: "ok", schema: "fe2o3-debug-response-v1", request_id: 5, operation: "inspect_stack", session,
      result: { result: "stack", snapshot: anchor, frames: [{ frame: 1, function_ordinal: 0, block_ordinal: 0,
        next_operation: 1, values: { status: "captured", value_count: 2 } }] } },
  });
  const sourceValues = [
    { name: "a", identity: "4", value: scalar("0xfffffff0"), generation: 1 },
    { name: "b", identity: "5", value: scalar("0x00000025"), generation: 1 },
    { name: "out", identity: "6", value: { status: "unavailable", reason: "not_represented" }, generation: 0 },
    { name: "result", identity: "7", value: { status: "unavailable", reason: "not_represented" }, generation: 0 },
  ].map(value => ({ variable_identity: value.identity.repeat(64), name: value.name, function_ordinal: 0,
    scope_identity: "8".repeat(64), scope_depth: 0, generation: value.generation, availability: { status: "value", value: value.value } }));
  const next = { query_identity: "9".repeat(64), position: 2 };
  const sourcePages: SyntheticSourcePair[] = [0, 1].map(index => structuredClone({ requestId: 6 + index,
    request: { schema: "fe2o3-debug-source-variable-request-v2", request_id: 6 + index, expected_revision: revision,
      operation: "inspect_source_variables", scope: { level: "dispatch" }, frame: 1, selector: { selector: "all" },
      page: { limit: 2, ...(index ? { cursor: next } : {}) } },
    response: { status: "ok", schema: "fe2o3-debug-source-variable-response-v2", request_id: 6 + index,
      operation: "inspect_source_variables", session, snapshot: { ...anchor, frame: 1, occurrence: 1 },
      values: sourceValues.slice(index * 2, index * 2 + 2), ...(index ? {} : { next_cursor: next }) },
  }));
  return { checkpoint, stack, sourcePages };
}
