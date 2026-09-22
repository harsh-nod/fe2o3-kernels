// Synthetic importer/UI controls only. No source execution or producer provenance.
import { syntheticSourceValueGroup } from "./resource-source-values";
import type { MutableResourceControl } from "./recorded-resource-import";

export interface SyntheticSourceImportPair {
  request: MutableResourceControl;
  response: MutableResourceControl;
}
export function encodeSyntheticSourcePairs(pairs: readonly SyntheticSourceImportPair[]) {
  return {
    requests: pairs.map(pair => JSON.stringify(pair.request) + "\n").join(""),
    responses: pairs.map(pair => JSON.stringify(pair.response) + "\n").join(""),
  };
}
export function syntheticSourceImportPairs(): SyntheticSourceImportPair[] {
  return [3, 1, 3].flatMap((event, index) => {
    const revision = index + 2, group = syntheticSourceValueGroup(event, revision);
    const control = structuredClone({ request: group.checkpoint.control.request,
      response: group.checkpoint.control.response }) as SyntheticSourceImportPair;
    control.request.direction = index === 1 ? "reverse" : "forward";
    control.request.count = control.response.result.events_advanced = 2;
    const memory: SyntheticSourceImportPair = {
      request: { schema: "fe2o3-debug-request-v1", request_id: 8, expected_revision: revision,
        operation: "read_memory", allocation: { ordinal: 1, generation: 0 }, byte_offset: 0, byte_len: 4 },
      response: { status: "ok", schema: "fe2o3-debug-response-v1", request_id: 8, operation: "read_memory",
        session: control.response.session, result: { result: "memory", snapshot: group.checkpoint.anchor,
          memory: { allocation: { ordinal: 1, generation: 0 }, byte_offset: 0, requested_bytes: 4,
            returned_bytes: 4, availability: { status: "captured", address_space: "global",
              bytes: "0xa5a5a5a5", initialized: "0x0f", truncated: false } } } },
    };
    return [control, group.stack, ...group.sourcePages, memory].map(pair => {
      const copy: SyntheticSourceImportPair = structuredClone({ request: pair.request, response: pair.response });
      copy.request.request_id += index * 10;
      copy.response.request_id += index * 10;
      return copy;
    });
  });
}
