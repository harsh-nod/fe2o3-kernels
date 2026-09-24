import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { COMPLETE_BODY_DEBUG_RETAINED_V19 } from "../src/content/complete-body-debug-v19-retained";
import { projectCompleteBodyDebugV19, COMPLETE_BODY_DEBUG_SELECTOR_V19, type CompleteBodyDebugInputV19 } from "../src/content/complete-body-debug-v19";
import { parseProgramJson } from "../src/content/ordered-program-observation.mjs";
import { projectResourceCheckpointValues } from "../src/content/resource-checkpoint-values";
import type { ResourceCheckpointObservation } from "../src/content/resource-checkpoint-observation";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());
type Row = Record<string, unknown>;
function row(value: unknown): Row { return value as Row; }
function wire(value: unknown): string {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return "[" + value.map(wire).join(",") + "]";
  if (value !== null && typeof value === "object") return "{" + Object.entries(value).map(([key, value]) => JSON.stringify(key) + ":" + wire(value)).join(",") + "}";
  const encoded = JSON.stringify(value);
  if (encoded === undefined) throw new Error("Non-JSON fixture value.");
  return encoded;
}
function local(): CompleteBodyDebugInputV19 {
  const input = COMPLETE_BODY_DEBUG_RETAINED_V19[1].input;
  return { selector: input.selector, requestsUtf8: input.requestsUtf8, responsesUtf8: input.responsesUtf8 };
}
function edit(input: CompleteBodyDebugInputV19, which: "requestsUtf8" | "responsesUtf8", at: number, change: (value: Row) => void) {
  const lines = input[which].trimEnd().split("\n"), value = row(parseProgramJson(lines[at]));
  change(value); lines[at] = wire(value); return { ...input, [which]: lines.join("\n") + "\n" };
}
function snapshot(value: Row): Row { return row(row(row(value.result).snapshot).snapshot); }
function anchor(value: Row): Row { return row(snapshot(value).anchor); }
function values(value: Row): Row[] { return snapshot(value).values as Row[]; }
it.each(COMPLETE_BODY_DEBUG_RETAINED_V19)("projects actual retained $label entry/event/restore without executing or reconstructing a CFG", async ({ input, label }) => {
  const result = await projectCompleteBodyDebugV19(input);
  expect(result.status).toBe("ready");
  if (result.status !== "ready") throw new Error("Retained input failed.");
  expect(result.checkpoints.map(item => [item.event, item.revision])).toEqual([[0, 0], [1, 1], [0, 2], [0, 2]]);
  expect(result.checkpoints.filter(item => item.observed)).toHaveLength(1);
  const observed = result.checkpoints[1].observed!;
  expect(observed.activeMask).toBe(18446744073709551615n);
  expect(observed.rows).toHaveLength(5);
  expect(observed.rows.map(item => item.interpretation).slice(1, 4)).toEqual(["19", "23", "42"]);
  expect(observed.rows[4].interpretation).toBe(label.split("selector ")[1]);
  expect(result.checkpoints[1].responseUtf8).toBe(input.responsesUtf8.split("\n")[2] + "\n");
  expect(Object.isFrozen(result)).toBe(true); expect(Object.isFrozen(observed.rows)).toBe(true);
  expect(result).not.toHaveProperty("cfg"); expect(result).not.toHaveProperty("source_authenticated");
});
it("accepts protocol-only local display without source metadata or byte pins", async () => {
  const result = await projectCompleteBodyDebugV19(local());
  expect(result).toMatchObject({ status: "ready", metadata: null, metadataSha256: null });
});
it("treats optional canonical/source identities as declarations, not a session or custody join", async () => {
  const input = local(), raw = row(parseProgramJson(COMPLETE_BODY_DEBUG_RETAINED_V19[1].input.metadataUtf8!));
  raw.canonical_identity = "a".repeat(64); raw.semantic_mir_v36 = "b".repeat(64); raw.kernel = "independent declaration";
  const result = await projectCompleteBodyDebugV19({ ...input, metadataUtf8: wire(raw) });
  expect(result).toMatchObject({ status: "ready", metadata: { kernel: "independent declaration", canonicalIdentity: "a".repeat(64) } });
});
const controls: readonly [string, (input: CompleteBodyDebugInputV19) => CompleteBodyDebugInputV19][] = [
  ["legacy selector", input => ({ ...input, selector: "--bundle" })],
  ["implicit selector", input => ({ ...input, selector: "" })],
  ["foreign request ID", input => edit(input, "responsesUtf8", 2, value => { value.request_id = 99; })],
  ["different operation", input => edit(input, "responsesUtf8", 2, value => { value.operation = "continue"; })],
  ["stale request revision", input => edit(input, "requestsUtf8", 2, value => { value.expected_revision = 1; })],
  ["cross configuration", input => edit(input, "responsesUtf8", 2, value => { row(value.session).configuration_identity = "a".repeat(64); })],
  ["stale snapshot revision", input => edit(input, "responsesUtf8", 2, value => { row(anchor(value).cursor).state_revision = 2; })],
  ["hardware session", input => edit(input, "responsesUtf8", 2, value => { row(value.session).hardware_observed = true; })],
  ["lane substitution", input => edit(input, "responsesUtf8", 2, value => { row(anchor(value).scope).lane = 1; })],
  ["narrowed mask", input => edit(input, "responsesUtf8", 2, value => { row(anchor(value).scope).active_mask = 1; })],
  ["rounded Wave64 mask", input => ({ ...input, responsesUtf8: input.responsesUtf8.replace("18446744073709551615", "18446744073709552000") })],
  ["source map claim", input => edit(input, "responsesUtf8", 2, value => { row(anchor(value).site).source = { status: "resolved" }; })],
  ["foreign CFG site", input => edit(input, "responsesUtf8", 2, value => { row(row(anchor(value).site).kir).block_ordinal = 1; })],
  ["hardware value", input => edit(input, "responsesUtf8", 2, value => { row(values(value)[1].availability).provenance = "hardware_observation"; })],
  ["register value", input => edit(input, "responsesUtf8", 2, value => { row(values(value)[1].path).root = { kind: "register", name: "v32" }; })],
  ["foreign frame", input => edit(input, "responsesUtf8", 2, value => { row(row(values(value)[1].path).root).frame = 2; })],
  ["duplicate value", input => edit(input, "responsesUtf8", 2, value => { values(value).push(values(value)[0]); })],
  ["65 values", input => edit(input, "responsesUtf8", 2, value => { snapshot(value).values = Array.from({ length: 65 }, () => values(value)[0]); })],
  ["unknown snapshot field", input => edit(input, "responsesUtf8", 2, value => { snapshot(value).registers = []; })],
  ["available registers", input => edit(input, "responsesUtf8", 0, value => {
    const capabilities = row(value.result).capabilities as Row[]; const registers = capabilities.find(item => item.name === "register_values")!;
    registers.availability = "available"; delete registers.reason;
  })],
  ["duplicate capability", input => edit(input, "responsesUtf8", 0, value => {
    const capabilities = row(value.result).capabilities as Row[]; capabilities[1] = capabilities[0];
  })],
  ["operation step relabel", input => edit(input, "requestsUtf8", 2, value => { value.granularity = "operation"; })],
  ["reverse direction substitution", input => edit(input, "requestsUtf8", 3, value => { value.direction = "forward"; })],
  ["error response", input => edit(input, "responsesUtf8", 4, value => { value.status = "error"; })],
  ["stale restored values", input => edit(input, "responsesUtf8", 4, value => { row(value.result).snapshot = { status: "captured", snapshot: {} }; })],
  ["sixth pair", input => ({ ...input, requestsUtf8: input.requestsUtf8 + input.requestsUtf8.split("\n")[0] + "\n" })],
  ["truncated stream", input => ({ ...input, responsesUtf8: input.responsesUtf8.split("\n").slice(0, 4).join("\n") + "\n" })],
  ["duplicate JSON key", input => ({ ...input, responsesUtf8: input.responsesUtf8.replace('{"status":"ok"', '{"status":"ok","status":"ok"') })],
  ["missing final LF", input => ({ ...input, responsesUtf8: input.responsesUtf8.trimEnd() })],
  ["file limit", input => ({ ...input, responsesUtf8: " ".repeat(256 * 1024 + 1) })],
];
it.each(controls)("refuses %s with no partial or prior checkpoint", async (_name, mutate) => {
  const result = await projectCompleteBodyDebugV19(mutate(local()));
  expect(result.status).toBe("invalid"); expect(result).not.toHaveProperty("checkpoints");
});
it("preserves captured zero and unavailable values as different observations", async () => {
  const input = edit(local(), "responsesUtf8", 2, value => {
    values(value)[1].availability = { status: "unavailable", reason: "not_in_scope" };
    row(row(values(value)[4].availability).value).bits = "0x00000000";
  });
  const result = await projectCompleteBodyDebugV19(input);
  if (result.status !== "ready") throw new Error("Availability control failed.");
  expect(result.checkpoints[1].observed!.rows[1]).toMatchObject({ status: "unavailable", representation: "not_in_scope" });
  expect(result.checkpoints[1].observed!.rows[4]).toMatchObject({ status: "captured", interpretation: "0" });
});
it("refuses modified retained-byte pins and metadata that claims source or launch authority", async () => {
  const retained = COMPLETE_BODY_DEBUG_RETAINED_V19[0].input;
  expect((await projectCompleteBodyDebugV19({ ...retained, expected: { ...retained.expected!, responses: "a".repeat(64) } })).status).toBe("invalid");
  for (const key of ["hardware_observed", "artifact_or_launch_authority", "exported_source_authentication", "exported_compiler_authentication"]) {
    const data = row(parseProgramJson(retained.metadataUtf8!)); data[key] = true;
    expect((await projectCompleteBodyDebugV19({ ...local(), metadataUtf8: wire(data) })).status).toBe("invalid");
  }
});
it("leaves the legacy operation-only/safe-anchor projection closed to the V19 event", () => {
  const input = local(), request = row(parseProgramJson(input.requestsUtf8.split("\n")[2])),
    response = row(parseProgramJson(input.responsesUtf8.split("\n")[2]));
  const checkpoint = { anchor: anchor(response), anchorKey: "not-a-legacy-anchor", control: {
    kind: "checkpoint", requestId: 3, request, response } } as unknown as ResourceCheckpointObservation;
  expect(projectResourceCheckpointValues(checkpoint).status).not.toBe("ready");
});
it("keeps null input unavailable and requires the exact named V19 selector", async () => {
  expect(await projectCompleteBodyDebugV19(null)).toMatchObject({ status: "unavailable" });
  expect(COMPLETE_BODY_DEBUG_SELECTOR_V19).toBe("--diagnostic-kir-v19");
});
