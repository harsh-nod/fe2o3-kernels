type RecordValue = Record<string, unknown>;
type RequestId = string | number;

function record(value: unknown, label: string): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid " + label);
  }
  return value as RecordValue;
}
function requireValue(condition: boolean, label: string): asserts condition {
  if (!condition) throw new Error("Invalid " + label);
}
function count(value: unknown, label: string): number {
  requireValue(typeof value === "number" && Number.isSafeInteger(value) && value >= 0, label);
  return value;
}
function identity(value: unknown): string {
  requireValue(typeof value === "string" && /^[0-9a-f]{64}$/.test(value) && !/^0+$/.test(value),
    "capture identity");
  return value;
}

export function readMixedTileCpuSummary(raw: string) {
  const summary = record(JSON.parse(raw), "CPU summary");
  requireValue(summary.authority === "observation_only", "CPU summary authority");
  for (const flag of ["hardware_observed", "performance_prediction", "fixture_source_injection"]) {
    requireValue(summary[flag] === false, "CPU summary " + flag);
  }
  const inventories = count(summary.inventories, "inventory count");
  const simulations = count(summary.simulations, "simulation count");
  requireValue(inventories > 0 && simulations > 0, "completed CPU observations");
  if (summary.schema === "fe2o3-v18-public-example-cli-smoke-v1") {
    requireValue(summary.source_authentication_exported === false
      && summary.cross_order_whole_kernel_equivalence === false, "historical authority limits");
    requireValue(typeof summary.source_head === "string" && /^[0-9a-f]{40}$/.test(summary.source_head),
      "historical compiler revision");
    identity(summary.source_sha256);
    requireValue(Array.isArray(summary.observations) && summary.observations.length === inventories,
      "historical observations");
    for (const item of summary.observations) {
      const observation = record(item, "historical observation");
      for (const key of ["source_semantic", "pending_identity", "canonical_identity", "schedule_identity"]) {
        identity(observation[key]);
      }
    }
    const debuggerSessions = count(summary.debugger_sessions, "historical debugger count");
    requireValue(debuggerSessions > 0, "completed historical debugger sessions");
    return {
      schema: summary.schema, inventories, simulations,
      debuggerSessions,
      negativeControls: count(summary.simulator_refusals, "simulator refusal count")
        + count(summary.debugger_cli_refusals, "debugger refusal count")
        + count(summary.debugger_protocol_unavailable_controls, "unavailable control count"),
      sessions: [],
    };
  }
  requireValue(summary.schema === "fe2o3-scoped-tile-cli-test-v1", "CPU summary schema");
  requireValue(summary.full_simt_tile_pair_qualified === false, "native pair qualification");
  requireValue(summary.host_oracle_unit_tests === "separate CI gate", "separate host-oracle gate");
  requireValue(typeof summary.source_manifest === "string" && summary.source_manifest.length > 0
    && typeof summary.source_feature === "string" && summary.source_feature.length > 0,
  "ordinary source selection");
  requireValue(Array.isArray(summary.orders) && summary.orders.length === inventories, "export orders");
  for (const item of summary.orders) {
    const order = record(item, "export identity");
    for (const key of ["source", "pending", "canonical", "schedule"]) identity(order[key]);
    requireValue(count(order.bytes, "canonical byte count") > 0, "nonempty canonical export");
  }
  requireValue(Array.isArray(summary.debugger_sessions)
    && summary.debugger_sessions.length === inventories, "debugger sessions");
  const seen = new Set<string>();
  const sessions = summary.debugger_sessions.map((item) => {
    const session = record(item, "debugger session");
    requireValue((session.order === "blocked" || session.order === "striped")
      && !seen.has(session.order), "unique debugger order");
    seen.add(session.order);
    requireValue(session.complete === true, "completed debugger session");
    const commands = count(session.commands, "debugger command count");
    requireValue(commands > 0, "nonempty debugger session");
    const allocation = record(session.measured_output_allocation, "measured output allocation");
    return {
      order: session.order, commands, configurationIdentity: identity(session.configuration_identity),
      allocation: {
        ordinal: count(allocation.ordinal, "allocation ordinal"),
        generation: count(allocation.generation, "allocation generation"),
      },
    };
  });
  requireValue(seen.has("blocked") && seen.has("striped"), "both debugger orders");
  return {
    schema: summary.schema, inventories, simulations, debuggerSessions: sessions.length,
    negativeControls: count(summary.negative_controls, "negative control count"), sessions,
  };
}

function protocolRecords(raw: string, schema: string) {
  const lines = raw.trimEnd().split("\n");
  requireValue(lines.length > 0 && lines.every((line) => line.length > 0), "nonempty JSONL records");
  const seen = new Set<RequestId>();
  return lines.map((line, index) => {
    // Only IDs and operations are decoded here; preserve raw u64 payload bytes.
    const item = record(JSON.parse(line), "debugger record");
    requireValue(item.schema === schema, "debugger schema");
    const id = item.request_id;
    requireValue((typeof id === "string" && id.length > 0)
      || (typeof id === "number" && Number.isSafeInteger(id) && id >= 0), "debugger request ID");
    requireValue(!seen.has(id), "duplicate debugger request ID");
    seen.add(id);
    requireValue(typeof item.operation === "string" && item.operation.length > 0, "debugger operation");
    return { id, operation: item.operation, index };
  });
}

export function associateDebuggerRecords(requestsRaw: string, responsesRaw: string) {
  const requests = protocolRecords(requestsRaw, "fe2o3-debug-request-v1");
  const responses = protocolRecords(responsesRaw, "fe2o3-debug-response-v1");
  requireValue(requests.length === responses.length, "debugger request/response count");
  const byId = new Map(responses.map((item) => [item.id, item]));
  return requests.map((request) => {
    const response = byId.get(request.id);
    requireValue(response !== undefined, "missing debugger response");
    requireValue(response.operation === request.operation, "debugger operation mismatch");
    return {
      requestId: request.id, operation: request.operation,
      requestIndex: request.index, responseIndex: response.index,
    };
  });
}
