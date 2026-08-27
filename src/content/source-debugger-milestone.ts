import requestsJsonl from "../../examples/source_debugger_requests_v1.jsonl?raw";
import responsesJsonl from "../../examples/source_debugger_responses_v1.jsonl?raw";

export const SOURCE_DEBUGGER_REQUESTS_SHA256 =
  "947471a919073182fd5b73fa4ea92b7b725589f41c603a243a4fc87b1141016d" as const;
export const SOURCE_DEBUGGER_RESPONSES_SHA256 =
  "c56fe33613079e6c4b88b0e28d005cf87768d7f81ac596f1aec45f54f1e86d4c" as const;

type JsonObject = Record<string, unknown>;

function record(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonl(raw: string): JsonObject[] {
  return raw
    .trimEnd()
    .split("\n")
    .map((line) => JSON.parse(line) as JsonObject);
}

function resolvedCompilerBundleLocation(value: unknown): boolean {
  return (
    record(value) &&
    value.status === "resolved" &&
    record(value.location) &&
    value.location.provenance === "compiler_bundle_bound" &&
    typeof value.location.map_identity === "string" &&
    /^[0-9a-f]{64}$/u.test(value.location.map_identity) &&
    typeof value.location.file_identity === "string" &&
    /^[0-9a-f]{64}$/u.test(value.location.file_identity) &&
    Number.isSafeInteger(value.location.byte_start) &&
    Number.isSafeInteger(value.location.byte_end) &&
    Number(value.location.byte_start) < Number(value.location.byte_end)
  );
}

export const sourceDebuggerRequests = parseJsonl(requestsJsonl);
export const sourceDebuggerResponses = parseJsonl(responsesJsonl);

export function validateSourceDebuggerMilestone(): string[] {
  const issues: string[] = [];
  const expectedOperations = [
    "resolve_source",
    "set_breakpoints",
    "continue",
    "inspect_stack",
    "step",
  ];
  if (sourceDebuggerRequests.length !== 5 || sourceDebuggerResponses.length !== 5) {
    return ["source debugger projection must contain exactly five request/response pairs"];
  }
  expectedOperations.forEach((operation, index) => {
    const request = sourceDebuggerRequests[index];
    const response = sourceDebuggerResponses[index];
    if (
      request.schema !== "fe2o3-debug-request-v1" ||
      request.request_id !== index + 1 ||
      request.operation !== operation
    ) {
      issues.push(`source debugger request ${index + 1} is not the exact ${operation} operation`);
    }
    if (
      response.status !== "ok" ||
      response.schema !== "fe2o3-debug-response-v1" ||
      response.request_id !== index + 1 ||
      response.operation !== operation ||
      !record(response.session) ||
      response.session.backend !== "cpu_kir_simulator" ||
      response.session.execution_kind !== "cpu_kir_simulation" ||
      response.session.simulated !== true ||
      response.session.hardware_observed !== false ||
      response.session.performance_prediction !== false
    ) {
      issues.push(`source debugger response ${index + 1} violates its truth-labeled envelope`);
    }
  });

  const resolved = sourceDebuggerResponses[0]?.result;
  if (
    !record(resolved) ||
    resolved.result !== "source" ||
    !record(resolved.site) ||
    !resolvedCompilerBundleLocation(resolved.site.source)
  ) {
    issues.push("resolve_source did not return one compiler-bundle-bound location");
  }
  const continued = sourceDebuggerResponses[2]?.result;
  if (
    !record(continued) ||
    continued.result !== "control" ||
    !record(continued.stop) ||
    continued.stop.reason !== "breakpoint" ||
    continued.stop.exact !== true
  ) {
    issues.push("source breakpoint did not produce one exact breakpoint stop");
  }
  const stack = sourceDebuggerResponses[3]?.result;
  if (
    !record(stack) ||
    stack.result !== "stack" ||
    !Array.isArray(stack.frames) ||
    stack.frames.length === 0 ||
    !stack.frames.every(
      (frame) =>
        record(frame) &&
        record(frame.values) &&
        frame.values.status === "captured",
    )
  ) {
    issues.push("inspect_stack did not return captured frame values");
  }
  const stepped = sourceDebuggerResponses[4]?.result;
  if (
    !record(stepped) ||
    stepped.result !== "control" ||
    !record(stepped.stop) ||
    stepped.stop.reason !== "step" ||
    stepped.stop.exact !== true
  ) {
    issues.push("source step did not produce one exact step stop");
  }
  if (/native_(?:address|pointer)|gpu_va|host_address/iu.test(responsesJsonl)) {
    issues.push("source debugger projection exposes a forbidden native address field");
  }
  return issues;
}

const sourceDebuggerIssues = validateSourceDebuggerMilestone();
if (sourceDebuggerIssues.length > 0) {
  throw new Error(`Invalid source debugger milestone: ${sourceDebuggerIssues.join("; ")}`);
}

export const sourceDebuggerRequestsJsonl = requestsJsonl;
export const sourceDebuggerResponsesJsonl = responsesJsonl;
export const sourceDebuggerTranscript = [
  "# fe2o3-debug JSONL requests",
  requestsJsonl.trimEnd(),
  "",
  "# fe2o3-debug JSONL responses",
  responsesJsonl.trimEnd(),
].join("\n");
