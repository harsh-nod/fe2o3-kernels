/** Explicit owner-bound content declaration, never hardware detection or a user target override. */
import type { CpuBridgeReply, CpuSessionView } from "./cpu-debug-session";
import type { CpuObservedCollection } from "./cpu-observed-collection";
import type { CpuObservedContext } from "./cpu-observed-protocol";
import { binding, decimal, enumValue, error, need, object, same, uint, type ObservedRow } from "./cpu-observed-validation";
export const CPU_DECLARED_TARGET_BYTES = 4096;
function identity(value: unknown): void {
  need(typeof value === "string" && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value));
}
export function declaredTarget(value: unknown): ObservedRow {
  const row = object(value, ["availability"], ["reason", "target", "provenance", "envelope_version",
    "envelope_identity", "subject_identity", "admitted_module"]);
  if (row.availability === "unavailable") {
    object(row, ["availability", "reason"]); need(row.reason === "raw_input_has_no_declared_gpu_target"); return row;
  }
  object(row, ["availability", "target", "provenance", "envelope_version", "envelope_identity", "subject_identity", "admitted_module"]);
  need(row.availability === "declared" && row.provenance === "verified_simulation_bundle");
  enumValue(row.target, ["gfx942:xnack-", "gfx950:xnack-"]);
  const version = uint(row.envelope_version, 6n); need(version >= 1n);
  identity(row.envelope_identity); identity(row.subject_identity);
  const module = object(row.admitted_module, ["wire_version", "sha256", "canonical_bytes"]);
  need(uint(module.wire_version, 11n) === (version <= 4n ? 7n : version === 5n ? 10n : 11n));
  identity(module.sha256); decimal(module.canonical_bytes, 1n); return row;
}
export function validateCpuDeclaredTargetReply(reply: CpuBridgeReply, previous: CpuSessionView, context: CpuObservedContext): void {
  need(reply.responseJson.length < CPU_DECLARED_TARGET_BYTES &&
    new TextEncoder().encode(reply.responseJson).byteLength + 1 <= CPU_DECLARED_TARGET_BYTES &&
    reply.responseBytes <= CPU_DECLARED_TARGET_BYTES);
  same(reply.session, previous);
  const row = object(reply.response, ["schema", "status", "operation", "request_id", "session"],
    ["error", "binding", "logical_wave_width", "target"]);
  same(row.session, { ...previous, revision: BigInt(previous.revision),
    cursor: { configuration_identity: previous.cursor.configuration_identity,
      event_sequence: BigInt(previous.cursor.event_sequence), state_revision: BigInt(previous.cursor.state_revision) } });
  need(row.schema === "fe2o3-debug-target-response-v1" && row.operation === "inspect_declared_target" &&
    uint(row.request_id) === BigInt(reply.sequence) + 1n);
  if (row.status === "error") {
    object(row, ["schema", "status", "operation", "request_id", "session", "error"]); error(row.error); return;
  }
  object(row, ["schema", "status", "operation", "request_id", "session", "binding", "logical_wave_width", "target"]);
  need(row.status === "ok" && context.owner && context.runtime?.response.status === "ok");
  const bound = binding(row.binding);
  same(bound.owner, context.owner); same(bound, binding(context.runtime.response.binding));
  same(bound.cursor, { configuration_identity: previous.cursor.configuration_identity,
    event_sequence: BigInt(previous.cursor.event_sequence), state_revision: BigInt(previous.cursor.state_revision) });
  need(uint(row.logical_wave_width, 64n) === 32n || uint(row.logical_wave_width, 64n) === 64n);
  declaredTarget(row.target);
}
export function joinDeclaredTarget(collection: CpuObservedCollection, reply: CpuBridgeReply): ObservedRow {
  const runtime = collection.runtime;
  need(runtime.response.status === "ok" && reply.response.status === "ok" &&
    reply.connectionId === runtime.connectionId && reply.bridgeSession === runtime.bridgeSession);
  same(reply.session, runtime.session);
  const bound = binding(runtime.response.binding);
  validateCpuDeclaredTargetReply(reply, runtime.session, { owner: object(bound.owner, ["backend_session", "capture_instance"]),
    runtime, inventory: collection.inventory });
  return declaredTarget(reply.response.target);
}
