// Synthetic presentation/import controls only. No source execution or real provenance.
import type { ImportedResourceCheckpoint } from "../../src/content/recorded-resource-import";
import { resourceSnapshotAnchorKey } from "../../src/content/resource-memory-view";
import { syntheticSourceValueGroup } from "./resource-source-values";
import type { MutableResourceControl } from "./recorded-resource-import";
import type { SyntheticSourceImportPair } from "./recorded-source-values-integration";

export function syntheticHelperSourceValueGroup(event = 2, revision = 2, extraHelperSsa = true) {
  const group = syntheticSourceValueGroup(event, revision);
  const checkpoint = structuredClone(group.checkpoint) as unknown as MutableResourceControl;
  checkpoint.anchor.site.kir.function_ordinal = 7;
  checkpoint.anchorKey = resourceSnapshotAnchorKey(checkpoint.anchor);
  checkpoint.control.response.result.snapshot.snapshot.anchor = structuredClone(checkpoint.anchor);
  const scalar = (bits: string) => ({ status: "captured", value_type: { kind: "float", bits: 32 },
    value: { encoding: "bits", bits }, provenance: "simulated_observation" });
  checkpoint.control.response.result.snapshot.snapshot.values.push(
    ...Array.from({ length: extraHelperSsa ? 2 : 1 }, (_, value_ordinal) => ({
      path: { root: { kind: "ssa", function_ordinal: 7, frame: 2, value_ordinal }, components: [] },
      availability: scalar("0x3f800000"),
    })),
  );
  checkpoint.control.responseUtf8 = JSON.stringify(checkpoint.control.response) + "\n";
  group.stack.response.result.snapshot = structuredClone(checkpoint.anchor);
  group.stack.response.result.frames[0].block_ordinal = 1;
  delete group.stack.response.result.frames[0].next_operation;
  group.stack.response.result.frames.push({ frame: 2, function_ordinal: 7, block_ordinal: 0,
    next_operation: extraHelperSsa ? 1 : 0, values: { status: "captured", value_count: extraHelperSsa ? 2 : 1 } });
  for (const [index, pair] of group.sourcePages.entries()) {
    pair.request.frame = 2; pair.request.page.limit = 1;
    if (index === 1) pair.request.page.cursor.position = 1;
    pair.response.snapshot = { ...structuredClone(checkpoint.anchor), frame: 2, occurrence: 1 };
    if (index === 0) pair.response.next_cursor.position = 1;
    pair.response.values = [{
      variable_identity: (index === 0 ? "4" : "5").repeat(64), name: index === 0 ? "value" : "adjusted",
      function_ordinal: 7, scope_identity: "8".repeat(64), scope_depth: index, generation: index === 0 ? 1 : 0,
      availability: { status: "value", value: index === 0 ? scalar("0x3f800000") : { status: "unavailable", reason: "not_represented" } },
    }];
  }
  return { checkpoint: checkpoint as unknown as ImportedResourceCheckpoint, stack: group.stack, sourcePages: group.sourcePages };
}

export function syntheticHelperSourceImportPairs(): SyntheticSourceImportPair[] {
  return [2, 1, 2].flatMap((event, index) => {
    const revision = index + 2, group = syntheticHelperSourceValueGroup(event, revision, index !== 1);
    const control = structuredClone({ request: group.checkpoint.control.request,
      response: group.checkpoint.control.response }) as SyntheticSourceImportPair;
    control.request.direction = index === 1 ? "reverse" : "forward";
    const memory: SyntheticSourceImportPair = {
      request: { schema: "fe2o3-debug-request-v1", request_id: 8, expected_revision: revision,
        operation: "read_memory", allocation: { ordinal: 1, generation: 0 }, byte_offset: 0, byte_len: 4 },
      response: { status: "ok", schema: "fe2o3-debug-response-v1", request_id: 8, operation: "read_memory",
        session: structuredClone(control.response.session), result: { result: "memory", snapshot: structuredClone(group.checkpoint.anchor),
          memory: { allocation: { ordinal: 1, generation: 0 }, byte_offset: 0, requested_bytes: 4, returned_bytes: 4,
            availability: { status: "captured", address_space: "global", bytes: "0xa5a5a5a5", initialized: "0x0f", truncated: false } } } },
    };
    return [control, group.stack, ...group.sourcePages, memory].map(pair => {
      const value: SyntheticSourceImportPair = structuredClone({ request: pair.request, response: pair.response });
      value.request.request_id += index * 10; value.response.request_id += index * 10; return value;
    });
  });
}
