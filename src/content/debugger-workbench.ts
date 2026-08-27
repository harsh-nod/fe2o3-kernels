import projectionJson from "../../examples/debugger_workbench_v1.json";
import requestsJsonl from "../../examples/debugger_requests_v1.jsonl?raw";

export const DEBUGGER_WORKBENCH_SCHEMA =
  "fe2o3-debug-workbench-fixture-v1" as const;
export const DEBUGGER_WORKBENCH_PROJECTION_SHA256 =
  "43b6d186f2f0e7b93241ff53c95e8e933ffd48990efa2754acd21f86efd32a52" as const;
export const DEBUGGER_RESPONSES_SHA256 =
  "7283e69ea847b73d03df389afa315f015b2044119cf1a19ba72b7a3b5fdf7c18" as const;

type Vec3 = [number, number, number];
type JsonObject = Record<string, unknown>;

interface DebugCursorWire {
  configuration_identity: string;
  event_sequence: number;
  state_revision: number;
}

interface SessionWire {
  backend: "cpu_kir_simulator";
  execution_kind: "cpu_kir_simulation";
  state: "stopped";
  revision: number;
  configuration_identity: string;
  cursor: DebugCursorWire;
  simulated: true;
  hardware_observed: false;
  performance_prediction: false;
}

interface WorkgroupScopeWire {
  level: "workgroup";
  workgroup: Vec3;
}

interface WaveScopeWire {
  level: "wave";
  workgroup: Vec3;
  wave: number;
  active_mask: number;
  wave_width: 32 | 64;
  interpretation: "logical_visualization";
}

interface LaneScopeWire extends Omit<WaveScopeWire, "level"> {
  level: "lane";
  lane: number;
  logical_workitem: Vec3;
}

type ScopeWire = WorkgroupScopeWire | WaveScopeWire | LaneScopeWire;

interface KirSiteWire {
  function_ordinal: number;
  block_ordinal: number;
  point:
    | { kind: "block_entry" }
    | { kind: "operation"; operation_ordinal: number }
    | { kind: "terminator" };
}

interface SemanticEventWire {
  sequence: number;
  scope: LaneScopeWire;
  site: KirSiteWire;
  category: "dispatch" | "invocation" | "block" | "operation" | "memory" | "barrier";
  provenance: "simulated_observation";
}

interface DebugValueWire {
  path: {
    root: JsonObject;
    components: JsonObject[];
  };
  availability: JsonObject & { status: string };
}

interface OkResponseWire<T> {
  status: "ok";
  schema: "fe2o3-debug-response-v1";
  request_id: number;
  operation: string;
  session: SessionWire;
  result: T;
}

interface UnavailableResponseWire {
  status: "unavailable";
  schema: "fe2o3-debug-response-v1";
  request_id: number;
  operation: string;
  session: SessionWire;
  unavailable: {
    capability: string;
    reason: string;
    state_changed: false;
    detail: string;
  };
}

export interface DebuggerWorkbenchProjection {
  schema: typeof DEBUGGER_WORKBENCH_SCHEMA;
  source: {
    kernel: string;
    request: string;
    protocol_requests: string;
    protocol_responses: string;
    protocol_responses_sha256: typeof DEBUGGER_RESPONSES_SHA256;
  };
  capabilities: OkResponseWire<JsonObject>;
  breakpoint_stop: OkResponseWire<JsonObject>;
  hierarchy: OkResponseWire<{
    result: "scopes";
    scopes: Array<{ scope: ScopeWire; state: string }>;
  }>;
  values: OkResponseWire<{
    result: "values";
    snapshot: JsonObject & { cursor: DebugCursorWire; scope: LaneScopeWire };
    values: DebugValueWire[];
  }>;
  watchpoint_stop: OkResponseWire<JsonObject>;
  post_write_step: OkResponseWire<JsonObject>;
  memory: OkResponseWire<{
    result: "memory";
    snapshot: JsonObject & { cursor: DebugCursorWire; scope: LaneScopeWire };
    memory: {
      allocation: { ordinal: number; generation: number };
      byte_offset: number;
      requested_bytes: number;
      returned_bytes: number;
      availability: JsonObject & {
        status: string;
        bytes?: string;
        initialized?: string;
      };
    };
  }>;
  events: OkResponseWire<{
    result: "events";
    events: SemanticEventWire[];
  }>;
  reverse_step: OkResponseWire<JsonObject>;
  limitations: UnavailableResponseWire[];
  trace: {
    session: SessionWire;
    trace_identity: string;
    canonical_bytes: number;
    completeness: JsonObject;
  };
}

export interface DebuggerValueFixture {
  name: string;
  type: string;
  availability: "captured" | "unavailable";
  value?: string;
  reason?: string;
}

export interface DebuggerEventFixture {
  cursor: number;
  id: string;
  kind: SemanticEventWire["category"];
  label: string;
  scope: { workgroup: Vec3; wave: number; lane: number };
  site: {
    kir: { function: number; block: number; operation: number; point: string };
    source: { availability: "unavailable"; reason: string };
  };
  ssa: DebuggerValueFixture[];
  memory: Array<{
    allocation: { ordinal: number; generation: number };
    byte_offset: number;
    bytes: string;
    access: "read";
    initialized: string;
  }>;
  stopped: boolean;
}

export type DebuggerAgentOperation = "hierarchy" | "values" | "memory" | "events";

export interface DebuggerAgentPair {
  request: JsonObject;
  response: JsonObject;
}

export interface DebuggerWorkbenchFixture {
  schema: typeof DEBUGGER_WORKBENCH_SCHEMA;
  source: DebuggerWorkbenchProjection["source"];
  session: {
    backend: "cpu_kir_simulator";
    execution_kind: "cpu_kir_simulation";
    hardware_observed: false;
    performance_prediction: false;
    revision: number;
    simulated: true;
    truth_label: "Simulated semantic observation";
    wave_interpretation: "logical_visualization";
  };
  launch: {
    active_lane_count: number;
    logical_wave_size: 32 | 64;
    scheduled_lane_count: number;
    workgroup: Vec3;
  };
  events: DebuggerEventFixture[];
  breakpoints: Array<{
    id: number;
    enabled: boolean;
    kind: "kir_site";
    block: number;
    operation: number;
    point: string;
  }>;
  watchpoints: Array<{
    id: number;
    enabled: boolean;
    allocation: { ordinal: number; generation: number };
    byte_offset: number;
    byte_len: number;
    access: "read" | "write" | "read_write";
  }>;
  limitations: Array<{ capability: string; reason: string; detail: string }>;
  breakpoint_stop_cursor: number;
  watchpoint_stop_cursor: number;
  agent_pairs: Record<DebuggerAgentOperation, DebuggerAgentPair>;
}

export interface DebuggerComparisonRow {
  surface: string;
  fe2o3: string;
  rocgdb: string;
  rocprof: string;
  mojo: string;
}

export const debuggerComparisonLinks = [
  {
    label: "ROCgdb AMD GPU model",
    href: "https://rocm.docs.amd.com/projects/ROCgdb/en/latest/ROCgdb/gdb/doc/gdb/AMD-GPU.html",
  },
  {
    label: "ROCgdb essential commands",
    href: "https://rocm.docs.amd.com/projects/ROCgdb/en/latest/quick-reference/essential-commands.html",
  },
  {
    label: "rocprofv3 ATT",
    href: "https://rocm.docs.amd.com/projects/rocprofiler-sdk/en/docs-7.2.3/how-to/using-thread-trace.html",
  },
  {
    label: "ROCm profiler and debugger status",
    href: "https://rocm.docs.amd.com/en/docs-10.0.0/components/profilers-and-debuggers.html",
  },
  {
    label: "Mojo debug",
    href: "https://docs.modular.com/mojo/cli/debug",
  },
] as const;

export const debuggerComparisonRows: DebuggerComparisonRow[] = [
  {
    surface: "Hierarchy and identity",
    fe2o3:
      "Typed workgroup, logical-wave, lane, KIR-site, allocation, and event identities from CPU semantic sessions; pure-KFD V2 adds redacted generation-aware hardware device and queue identities.",
    rocgdb:
      "Live AMD GPU debugging; ROCgdb documents each hardware wavefront as a debugger thread and exposes wave/lane IDs and register groups.",
    rocprof:
      "Hardware profiling and ATT thread-trace evidence, organized around captured dispatch and shader-engine activity rather than semantic simulator state.",
    mojo:
      "The documented mojo debug flow delegates to LLDB or cuda-gdb; the same page says LLDB does not support Mojo GPU debugging.",
  },
  {
    surface: "Values and time",
    fe2o3:
      "Persisted deterministic replay links semantic events to captured SSA, allocation-relative memory, and paged call stacks. Native hardware registers remain explicitly unavailable.",
    rocgdb:
      "Live wave/lane state and GPU register inspection. This complements, rather than authenticates, a CPU semantic replay.",
    rocprof:
      "ATT records hardware instruction activity for performance analysis. It supplies hardware evidence that the simulator intentionally cannot provide.",
    mojo:
      "Host debugging follows the selected underlying debugger. The documented LLDB path does not add Mojo GPU state.",
  },
  {
    surface: "Source and KIR",
    fe2o3:
      "Compiler-exported bundles bind rustc locations to exact KIR for source resolution, breakpoints, stepping, and stack sites. Raw KIR remains usable with source explicitly unavailable; bundle binding is not protected compiler authentication.",
    rocgdb:
      "Source and machine-debug information are native debugger inputs; ROCgdb is the appropriate surface for live hardware faults.",
    rocprof:
      "Thread trace and compute analysis focus on hardware execution, not KIR semantic state. ROCm 10.0 documentation labels ROCprof Compute Viewer early access.",
    mojo:
      "The documented command starts LLDB or cuda-gdb, so source support follows those backends and their current platform limits.",
  },
  {
    surface: "Live hardware control",
    fe2o3:
      "Pure-KFD V2 owns a ptrace/pidfd target and exposes bounded runtime and exception events, device/queue snapshots, suspend, resume, and terminate. Wave, lane, register, CWSR, memory, source, and KIR control remain unavailable.",
    rocgdb:
      "Live AMD GPU debugging includes wavefront and lane selection, stepping, breakpoints, and register inspection on supported targets.",
    rocprof:
      "rocprofv3 captures hardware performance data and ATT instruction activity; it is a profiler rather than an interactive queue-control debugger.",
    mojo:
      "GPU control follows the selected underlying debugger and platform support rather than a Mojo-native hardware protocol.",
  },
  {
    surface: "Agent contract",
    fe2o3:
      "Closed, bounded, versioned JSONL operations expose revisions, typed scopes, unavailable states, and redacted allocation-relative pointers without eval strings.",
    rocgdb:
      "A mature interactive debugger and command surface. Automation can wrap it, but that is distinct from fe2o3's semantic protocol.",
    rocprof:
      "rocprofv3 provides a mature capture CLI and output artifacts. Its evidence can be correlated alongside, not replaced by, fe2o3 semantic events.",
    mojo:
      "Debugger automation follows LLDB or cuda-gdb. The fe2o3 contract is narrower and designed for bounded machine consumption.",
  },
];

const projectionKeys = [
  "breakpoint_stop",
  "capabilities",
  "events",
  "hierarchy",
  "limitations",
  "memory",
  "post_write_step",
  "reverse_step",
  "schema",
  "source",
  "trace",
  "values",
  "watchpoint_stop",
];
const okResponseKeys = ["operation", "request_id", "result", "schema", "session", "status"];
const unavailableResponseKeys = [
  "operation",
  "request_id",
  "schema",
  "session",
  "status",
  "unavailable",
];
const sessionKeys = [
  "backend",
  "configuration_identity",
  "cursor",
  "execution_kind",
  "hardware_observed",
  "performance_prediction",
  "revision",
  "simulated",
  "state",
];

function record(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: unknown, expected: readonly string[]): value is JsonObject {
  return (
    record(value) &&
    Object.keys(value).sort().join("|") === [...expected].sort().join("|")
  );
}

function nonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 512;
}

function identity(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{64}$/u.test(value) &&
    !/^0{64}$/u.test(value)
  );
}

function validateSession(value: unknown): boolean {
  return (
    exactKeys(value, sessionKeys) &&
    value.backend === "cpu_kir_simulator" &&
    value.execution_kind === "cpu_kir_simulation" &&
    value.state === "stopped" &&
    value.simulated === true &&
    value.hardware_observed === false &&
    value.performance_prediction === false &&
    nonNegativeInteger(value.revision) &&
    identity(value.configuration_identity) &&
    exactKeys(value.cursor, [
      "configuration_identity",
      "event_sequence",
      "state_revision",
    ]) &&
    value.cursor.configuration_identity === value.configuration_identity &&
    value.cursor.state_revision === value.revision &&
    nonNegativeInteger(value.cursor.event_sequence)
  );
}

function validateOkResponse(value: unknown, operation: string, result: string): boolean {
  return (
    exactKeys(value, okResponseKeys) &&
    value.status === "ok" &&
    value.schema === "fe2o3-debug-response-v1" &&
    value.operation === operation &&
    nonNegativeInteger(value.request_id) &&
    value.request_id > 0 &&
    validateSession(value.session) &&
    record(value.result) &&
    value.result.result === result
  );
}

function validateEvent(value: unknown): boolean {
  if (
    !exactKeys(value, ["category", "provenance", "scope", "sequence", "site"]) ||
    !nonNegativeInteger(value.sequence) ||
    value.provenance !== "simulated_observation" ||
    !exactKeys(value.scope, [
      "active_mask",
      "interpretation",
      "lane",
      "level",
      "logical_workitem",
      "wave",
      "wave_width",
      "workgroup",
    ]) ||
    value.scope.level !== "lane" ||
    value.scope.interpretation !== "logical_visualization" ||
    !nonNegativeInteger(value.scope.lane) ||
    ![32, 64].includes(Number(value.scope.wave_width)) ||
    !Array.isArray(value.scope.workgroup) ||
    value.scope.workgroup.length !== 3 ||
    !Array.isArray(value.scope.logical_workitem) ||
    value.scope.logical_workitem.length !== 3
  ) {
    return false;
  }
  return (
    exactKeys(value.site, ["block_ordinal", "function_ordinal", "point"]) &&
    nonNegativeInteger(value.site.block_ordinal) &&
    nonNegativeInteger(value.site.function_ordinal) &&
    record(value.site.point) &&
    text(value.site.point.kind)
  );
}

export function validateDebuggerWorkbenchFixture(value: unknown): string[] {
  if (!exactKeys(value, projectionKeys)) {
    return ["fixture must contain only the exact CLI projection keys"];
  }
  const issues: string[] = [];
  if (value.schema !== DEBUGGER_WORKBENCH_SCHEMA) {
    issues.push("fixture schema is not the exact debugger workbench V1 schema");
  }
  if (
    !exactKeys(value.source, [
      "kernel",
      "protocol_requests",
      "protocol_responses",
      "protocol_responses_sha256",
      "request",
    ]) ||
    !text(value.source.kernel) ||
    !text(value.source.request) ||
    !text(value.source.protocol_requests) ||
    !text(value.source.protocol_responses) ||
    value.source.protocol_responses_sha256 !== DEBUGGER_RESPONSES_SHA256
  ) {
    issues.push("fixture source provenance is invalid");
  }
  const expectedResponses = [
    ["capabilities", "discover_capabilities", "capabilities"],
    ["breakpoint_stop", "continue", "control"],
    ["hierarchy", "inspect_scope", "scopes"],
    ["values", "inspect_values", "values"],
    ["watchpoint_stop", "continue", "control"],
    ["post_write_step", "step", "control"],
    ["memory", "read_memory", "memory"],
    ["events", "query_events", "events"],
    ["reverse_step", "step", "control"],
  ] as const;
  for (const [name, operation, result] of expectedResponses) {
    if (!validateOkResponse(value[name], operation, result)) {
      issues.push(`${name} is not the exact typed response envelope`);
    }
  }
  if (
    !record(value.events) ||
    !record(value.events.result) ||
    !Array.isArray(value.events.result.events) ||
    value.events.result.events.length === 0 ||
    value.events.result.events.length > 4096 ||
    !value.events.result.events.every(validateEvent)
  ) {
    issues.push("event response is not a bounded exact-key semantic trace");
  }
  if (
    !Array.isArray(value.limitations) ||
    value.limitations.length !== 2 ||
    !value.limitations.every(
      (limitation) =>
        exactKeys(limitation, unavailableResponseKeys) &&
        limitation.status === "unavailable" &&
        limitation.schema === "fe2o3-debug-response-v1" &&
        validateSession(limitation.session) &&
        exactKeys(limitation.unavailable, [
          "capability",
          "detail",
          "reason",
          "state_changed",
        ]) &&
        limitation.unavailable.state_changed === false &&
        text(limitation.unavailable.capability) &&
        text(limitation.unavailable.reason) &&
        text(limitation.unavailable.detail),
    )
  ) {
    issues.push("typed unavailable responses are invalid");
  }
  if (
    !exactKeys(value.trace, [
      "canonical_bytes",
      "completeness",
      "session",
      "trace_identity",
    ]) ||
    !validateSession(value.trace.session) ||
    !identity(value.trace.trace_identity) ||
    !nonNegativeInteger(value.trace.canonical_bytes) ||
    !record(value.trace.completeness)
  ) {
    issues.push("trace summary is invalid");
  }
  if (/native_(?:address|pointer)|gpu_va|host_address/iu.test(JSON.stringify(value))) {
    issues.push("fixture exposes a forbidden native address field");
  }
  return issues;
}

const requestKeysByOperation: Record<string, readonly string[]> = {
  discover_capabilities: ["expected_revision", "operation", "request_id", "schema"],
  set_breakpoints: ["breakpoints", "expected_revision", "operation", "request_id", "schema"],
  set_watchpoints: ["expected_revision", "operation", "request_id", "schema", "watchpoints"],
  list_breakpoints: ["expected_revision", "operation", "page", "request_id", "schema"],
  list_watchpoints: ["expected_revision", "operation", "page", "request_id", "schema"],
  continue: ["expected_revision", "max_events", "operation", "request_id", "schema"],
  inspect_scope: [
    "expected_revision",
    "include_children",
    "operation",
    "page",
    "request_id",
    "schema",
    "scope",
  ],
  inspect_values: [
    "expected_revision",
    "operation",
    "page",
    "request_id",
    "schema",
    "scope",
    "selector",
  ],
  remove_breakpoints: ["breakpoint_ids", "expected_revision", "operation", "request_id", "schema"],
  step: ["count", "direction", "expected_revision", "granularity", "operation", "request_id", "schema"],
  read_memory: [
    "allocation",
    "byte_len",
    "byte_offset",
    "expected_revision",
    "operation",
    "request_id",
    "schema",
  ],
  query_events: ["expected_revision", "filter", "operation", "page", "request_id", "schema"],
  remove_watchpoints: ["expected_revision", "operation", "request_id", "schema", "watchpoint_ids"],
  export_trace: ["expected_revision", "max_bytes", "operation", "request_id", "schema"],
  terminate: ["expected_revision", "operation", "request_id", "schema"],
};

export function validateDebuggerProtocolRequests(value: unknown): string[] {
  if (!Array.isArray(value) || value.length !== 19) {
    return ["debugger request fixture must contain exactly 19 JSONL objects"];
  }
  const issues: string[] = [];
  value.forEach((request, index) => {
    if (!record(request) || typeof request.operation !== "string") {
      issues.push(`request ${index + 1} is not an object with an operation`);
      return;
    }
    const keys = requestKeysByOperation[request.operation];
    if (
      !keys ||
      !exactKeys(request, keys) ||
      request.schema !== "fe2o3-debug-request-v1" ||
      request.request_id !== index + 1 ||
      !nonNegativeInteger(request.expected_revision)
    ) {
      issues.push(`request ${index + 1} violates its exact operation shape`);
    }
  });
  return issues;
}

function parseRequests(raw: string): JsonObject[] {
  return raw
    .trimEnd()
    .split("\n")
    .map((line) => JSON.parse(line) as JsonObject);
}

export const debuggerProtocolRequests = parseRequests(requestsJsonl);
const projectionIssues = validateDebuggerWorkbenchFixture(projectionJson);
const requestIssues = validateDebuggerProtocolRequests(debuggerProtocolRequests);
if (projectionIssues.length > 0 || requestIssues.length > 0) {
  throw new Error(
    `Invalid exact debugger fixtures: ${[...projectionIssues, ...requestIssues].join("; ")}`,
  );
}

export const debuggerWorkbenchProjection =
  projectionJson as unknown as DebuggerWorkbenchProjection;

function requestById(requestId: number): JsonObject {
  const request = debuggerProtocolRequests.find(
    (candidate) => candidate.request_id === requestId,
  );
  if (!request) throw new Error(`Missing exact debugger request ${requestId}`);
  return request;
}

function operationOrdinal(site: KirSiteWire): number {
  return site.point.kind === "operation" ? site.point.operation_ordinal : 0;
}

function valueName(value: DebugValueWire, index: number): string {
  const root = value.path.root;
  if (root.kind === "register" && typeof root.name === "string") return root.name;
  if (root.kind === "source_variable" && typeof root.name === "string") return root.name;
  if (root.kind === "ssa" && nonNegativeInteger(root.value_ordinal)) {
    return `%ssa${root.value_ordinal}`;
  }
  return `%value${index}`;
}

function valueType(availability: JsonObject): string {
  if (!record(availability.value_type)) return "unavailable";
  const kind = String(availability.value_type.kind ?? "value");
  if (kind === "pointer") {
    return `ptr<${String(availability.value_type.address_space ?? "unknown")}>`;
  }
  const bits = availability.value_type.bits;
  return nonNegativeInteger(bits) ? `${kind}${bits}` : kind;
}

function capturedValue(availability: JsonObject): string | undefined {
  if (availability.status !== "captured" || !record(availability.value)) return undefined;
  if (availability.value.encoding === "bits" && typeof availability.value.bits === "string") {
    return availability.value.bits;
  }
  if (
    availability.value.encoding === "allocation_relative_pointer" &&
    record(availability.value.allocation) &&
    nonNegativeInteger(availability.value.allocation.ordinal) &&
    nonNegativeInteger(availability.value.allocation.generation) &&
    nonNegativeInteger(availability.value.byte_offset)
  ) {
    return `alloc#${availability.value.allocation.ordinal}:g${availability.value.allocation.generation}+${availability.value.byte_offset}`;
  }
  return undefined;
}

function projectValue(value: DebugValueWire, index: number): DebuggerValueFixture {
  const captured = capturedValue(value.availability);
  if (captured !== undefined) {
    return {
      name: valueName(value, index),
      type: valueType(value.availability),
      availability: "captured",
      value: captured,
    };
  }
  return {
    name: valueName(value, index),
    type: valueType(value.availability),
    availability: "unavailable",
    reason: String(value.availability.reason ?? "not_represented"),
  };
}

function popcount(mask: number): number {
  let value = mask;
  let count = 0;
  while (value > 0) {
    count += value % 2;
    value = Math.floor(value / 2);
  }
  return count;
}

const projection = debuggerWorkbenchProjection;
const hierarchyScopes = projection.hierarchy.result.scopes;
const workgroupScope = hierarchyScopes.find(
  (entry) => entry.scope.level === "workgroup",
)?.scope as WorkgroupScopeWire;
const waveScope = hierarchyScopes.find(
  (entry) => entry.scope.level === "wave",
)?.scope as WaveScopeWire;
if (!workgroupScope || !waveScope) {
  throw new Error("Exact debugger hierarchy lacks workgroup or logical-wave scope");
}

const setBreakpoint = requestById(2);
const setWatchpoint = requestById(3);
const breakpointRequest = (setBreakpoint.breakpoints as JsonObject[])[0];
const breakpointKind = breakpointRequest.kind as JsonObject;
const breakpointSite = breakpointKind.site as JsonObject;
const breakpointPoint = breakpointSite.point as JsonObject;
const watchpointRequest = (setWatchpoint.watchpoints as JsonObject[])[0];
const memoryCursor = projection.memory.result.snapshot.cursor.event_sequence;
const valueCursor = projection.values.result.snapshot.cursor.event_sequence;
const stoppedCursors = new Set([
  projection.breakpoint_stop.session.cursor.event_sequence,
  projection.watchpoint_stop.session.cursor.event_sequence,
  projection.post_write_step.session.cursor.event_sequence,
  projection.reverse_step.session.cursor.event_sequence,
]);
const sourceUnavailable = projection.limitations.find(
  (entry) => entry.unavailable.capability === "source_sites",
)!.unavailable;

export const debuggerWorkbenchFixture: DebuggerWorkbenchFixture = {
  schema: projection.schema,
  source: projection.source,
  session: {
    backend: projection.events.session.backend,
    execution_kind: projection.events.session.execution_kind,
    hardware_observed: projection.events.session.hardware_observed,
    performance_prediction: projection.events.session.performance_prediction,
    revision: projection.events.session.revision,
    simulated: projection.events.session.simulated,
    truth_label: "Simulated semantic observation",
    wave_interpretation: waveScope.interpretation,
  },
  launch: {
    active_lane_count: popcount(waveScope.active_mask),
    logical_wave_size: waveScope.wave_width,
    scheduled_lane_count: waveScope.wave_width,
    workgroup: workgroupScope.workgroup,
  },
  events: projection.events.result.events.map((event) => ({
    cursor: event.sequence,
    id: `event-${event.sequence}`,
    kind: event.category,
    label: `#${event.sequence} · lane${event.scope.lane} · fn${event.site.function_ordinal} · b${event.site.block_ordinal} · op${operationOrdinal(event.site)} · ${event.category}`,
    scope: {
      workgroup: event.scope.workgroup,
      wave: event.scope.wave,
      lane: event.scope.lane,
    },
    site: {
      kir: {
        function: event.site.function_ordinal,
        block: event.site.block_ordinal,
        operation: operationOrdinal(event.site),
        point: event.site.point.kind,
      },
      source: {
        availability: "unavailable",
        reason: sourceUnavailable.reason,
      },
    },
    ssa:
      event.sequence === valueCursor
        ? projection.values.result.values.map(projectValue)
        : [],
    memory:
      event.sequence === memoryCursor &&
      projection.memory.result.memory.availability.status === "captured"
        ? [
            {
              allocation: projection.memory.result.memory.allocation,
              byte_offset: projection.memory.result.memory.byte_offset,
              bytes: projection.memory.result.memory.availability.bytes ?? "",
              access: "read",
              initialized:
                projection.memory.result.memory.availability.initialized ?? "unavailable",
            },
          ]
        : [],
    stopped: stoppedCursors.has(event.sequence),
  })),
  breakpoints: [
    {
      id: 1,
      enabled: breakpointRequest.enabled === true,
      kind: "kir_site",
      block: Number(breakpointSite.block_ordinal),
      operation: Number(breakpointPoint.operation_ordinal),
      point: String(breakpointKind.phase),
    },
  ],
  watchpoints: [
    {
      id: 1,
      enabled: watchpointRequest.enabled === true,
      allocation: watchpointRequest.allocation as {
        ordinal: number;
        generation: number;
      },
      byte_offset: Number(watchpointRequest.byte_offset),
      byte_len: Number(watchpointRequest.byte_len),
      access: watchpointRequest.access as "read" | "write" | "read_write",
    },
  ],
  limitations: projection.limitations.map((entry) => entry.unavailable),
  breakpoint_stop_cursor: projection.breakpoint_stop.session.cursor.event_sequence,
  watchpoint_stop_cursor: projection.watchpoint_stop.session.cursor.event_sequence,
  agent_pairs: {
    hierarchy: {
      request: requestById(projection.hierarchy.request_id),
      response: projection.hierarchy as unknown as JsonObject,
    },
    values: {
      request: requestById(projection.values.request_id),
      response: projection.values as unknown as JsonObject,
    },
    memory: {
      request: requestById(projection.memory.request_id),
      response: projection.memory as unknown as JsonObject,
    },
    events: {
      request: requestById(projection.events.request_id),
      response: projection.events as unknown as JsonObject,
    },
  },
};
