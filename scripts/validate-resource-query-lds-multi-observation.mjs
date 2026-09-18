// Independent exact raw/display joins. This does not authenticate a producer,
// execute a compiler/simulator, manufacture records, or grant runtime authority.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { closeSync, constants, fstatSync, openSync, readSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const MAX_LDS_MULTI_FIXTURE_BYTES = 512 * 1024;
export const MAX_LDS_MULTI_TRANSCRIPT_BYTES = 8 * 1024 * 1024;
const sha = (value) => createHash("sha256").update(value).digest("hex");
const decode = (value) => new TextDecoder("utf-8", { fatal: true }).decode(value);
const safe = (value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(value) && value >= minimum && value <= maximum;
const ids = ["wg0_last_write", "wg1_global_only", "wg1_before_write", "reverse_wg0", "forward_wg1", "wg1_reduction", "final"];
function keys(value, expected) {
  assert(value !== null && typeof value === "object" && !Array.isArray(value), "object required");
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), "unexpected retained fields"); return value;
}
function digest(value) { assert(typeof value === "string" && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value), "exact nonzero lowercase SHA-256 required"); return value; }
function parsed(text) {
  for (const point of text) { const code = point.codePointAt(0); assert(code < 0xd800 || code > 0xdfff, "invalid Unicode"); }
  const value = JSON.parse(text), pending = [{ value, depth: 0 }]; let nodes = 0;
  while (pending.length) {
    const item = pending.pop(); assert(++nodes <= 65536 && item.depth <= 32, "JSON structure bound exceeded");
    if (item.value !== null && typeof item.value === "object") {
      const children = Object.values(item.value); assert(children.length <= 256, "JSON collection bound exceeded");
      for (const child of children) pending.push({ value: child, depth: item.depth + 1 });
    }
  }
  return value;
}
function array(value, maximum) { assert(Array.isArray(value) && value.length <= maximum); return value; }
export function readBoundedLdsMultiFile(path, maximum) {
  assert([MAX_LDS_MULTI_FIXTURE_BYTES, MAX_LDS_MULTI_TRANSCRIPT_BYTES].includes(maximum));
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const stat = fstatSync(fd); assert(stat.isFile() && stat.size > 0 && stat.size <= maximum, "regular bounded evidence file required");
    const bytes = Buffer.alloc(stat.size + 1); let used = 0;
    while (used < bytes.length) { const count = readSync(fd, bytes, used, bytes.length - used, null); if (!count) break; used += count; }
    assert.equal(used, stat.size, "evidence size changed during read"); return bytes.subarray(0, used);
  } finally { closeSync(fd); }
}
function transcript(bytes) {
  assert(bytes.length > 0 && bytes.length <= MAX_LDS_MULTI_TRANSCRIPT_BYTES, "transcript byte cap exceeded");
  const text = decode(bytes); assert(text.endsWith("\n"), "transcript final newline missing");
  const lines = text.slice(0, -1).split("\n"); assert(lines.length > 0 && lines.length <= 4096, "transcript command bound exceeded");
  const result = new Map(); let prior = 0;
  for (const line of lines) {
    assert(Buffer.byteLength(line) <= 2 * 1024 * 1024, "transcript line bound exceeded");
    const row = parsed(line); assert(safe(row.request_id, prior + 1), "duplicate/out-of-order transcript ID");
    prior = row.request_id; result.set(row.request_id, row);
  }
  return result;
}
function allocation(value) { keys(value, ["ordinal", "generation"]); assert(safe(value.ordinal, 1)); assert.equal(value.generation, 0); return value; }
function scope(value, group) {
  keys(value, ["level", "workgroup", "wave", "lane", "logical_workitem", "active_mask", "wave_width", "interpretation"]);
  assert.equal(value.level, "lane"); assert.equal(value.interpretation, "logical_visualization");
  assert.equal(value.wave_width, 32); assert.equal(value.active_mask, 0xffffffff);
  assert(safe(value.wave, 0, 1) && safe(value.lane, 0, 31));
  assert.deepEqual(value.workgroup, [group, 0, 0]);
  assert.deepEqual(value.logical_workitem, [group * 64 + value.wave * 32 + value.lane, 0, 0]);
}
function anchor(value, group) {
  keys(value, ["cursor", "scope", "site"]); keys(value.cursor, ["configuration_identity", "event_sequence", "state_revision"]);
  digest(value.cursor.configuration_identity); assert(safe(value.cursor.event_sequence, 1, 65536) && safe(value.cursor.state_revision, 1)); scope(value.scope, group);
  keys(value.site, ["kir", "source"]); const kir = keys(value.site.kir, ["function_ordinal", "block_ordinal", "point"]);
  assert(safe(kir.function_ordinal) && safe(kir.block_ordinal)); keys(kir.point, ["kind", "operation_ordinal"]);
  assert.equal(kir.point.kind, "operation"); assert(safe(kir.point.operation_ordinal));
  const source = keys(value.site.source, ["status", "location"]); assert.equal(source.status, "resolved");
  const location = keys(source.location, ["map_identity", "provenance", "file_identity", "byte_start", "byte_end"]);
  digest(location.map_identity); digest(location.file_identity); assert.equal(location.provenance, "compiler_bundle_bound");
  assert(safe(location.byte_start) && safe(location.byte_end, location.byte_start));
}
function session(response, selected) {
  assert.equal(response.status, "ok"); const value = keys(response.session, ["backend", "execution_kind", "state", "revision", "configuration_identity", "cursor", "simulated", "hardware_observed", "performance_prediction"]);
  assert.equal(value.backend, "cpu_kir_simulator"); assert.equal(value.execution_kind, "cpu_kir_simulation"); assert.equal(value.state, "stopped");
  assert.equal(value.simulated, true); assert.equal(value.hardware_observed, false); assert.equal(value.performance_prediction, false);
  assert.equal(value.revision, selected.cursor.state_revision); assert.equal(value.configuration_identity, selected.cursor.configuration_identity);
  assert.deepEqual(value.cursor, selected.cursor);
}
function validateReceipt(value) {
  keys(value, ["schema", "source_path", "source_sha256", "bundle_sha256", "export_observation_sha256", "simulation_request_sha256", "simulation_stdout_sha256",
    "debug_requests_sha256", "debug_responses_sha256", "results_sha256", "script_sha256", "helper_sha256", "executable_sha256", "commands", "response_bytes", "grid",
    "workgroup", "logical_wave_width", "expected_u32", "observed_workgroup_allocations", "global_allocation", "transition_steps", "evidence_kind", "source_edited",
    "metadata_authority", "compiler_closure_attestation", "allocation_generation", "owning_scope", "lifetime", "physical_base", "physical_registers", "source_helper_or_loop_qualification",
    "allocation_release_event_captured", "physical_reuse_observed", "hardware_observed", "performance_prediction", "grants_production_resume", "grants_load_authority",
    "grants_launch_authority", "script_limits", "disk_reserve_bytes", "cli_capture_limits", "checks"]);
  assert.equal(value.schema, "fe2o3-lds-two-workgroups-source-smoke-v1");
  assert.equal(value.source_path, "crates/rustc-codegen-fe2o3/tests/fixtures/production-ranked-bounds-device/src/lib.rs");
  assert.equal(value.evidence_kind, "actual_v5_admission_and_cpu_simulation_observation");
  assert.equal(value.metadata_authority, "inert_cross_file_consistency_not_compiler_authentication");
  assert.equal(value.compiler_closure_attestation, "unavailable"); assert.equal(value.allocation_generation, "producer_profile_zero_not_lifetime_evidence");
  for (const field of ["source_sha256", "bundle_sha256", "export_observation_sha256", "simulation_request_sha256", "simulation_stdout_sha256", "debug_requests_sha256",
    "debug_responses_sha256", "results_sha256", "script_sha256", "helper_sha256"]) digest(value[field]);
  keys(value.executable_sha256, ["simulator", "debugger"]); digest(value.executable_sha256.simulator); digest(value.executable_sha256.debugger);
  for (const field of ["source_edited", "source_helper_or_loop_qualification", "allocation_release_event_captured", "physical_reuse_observed", "hardware_observed",
    "performance_prediction", "grants_production_resume", "grants_load_authority", "grants_launch_authority"]) assert.equal(value[field], false);
  for (const field of ["owning_scope", "lifetime", "physical_base", "physical_registers"]) assert.equal(value[field], "not_represented");
  assert.deepEqual(value.grid, [128, 1, 1]); assert.deepEqual(value.workgroup, [64, 1, 1]); assert.equal(value.logical_wave_width, 32); assert.equal(value.expected_u32, 128);
  assert(safe(value.commands, 1, 4096) && safe(value.response_bytes, 1, MAX_LDS_MULTI_TRANSCRIPT_BYTES) && safe(value.transition_steps, 1, 256));
  assert.deepEqual(value.script_limits, { records: 65536, pages: 256, page_items: 256, page_scanned: 256, commands: 4096, discovery_steps: 256,
    request_bytes: 65536, response_bytes: 2097152, transcript_bytes: 67108864, result_bytes: 16777216, stderr_bytes: 65536,
    reply_timeout_ms: 30000, process_timeout_ms: 120000 });
  assert.equal(value.disk_reserve_bytes, "42949672960");
  assert.deepEqual(value.cli_capture_limits, { records: 1000000, retained_memory_bytes: 268435456,
    interpretation: "existing CLI hard limits; script selection bounds do not configure runtime capture" });
  assert(array(value.checks, 32).length > 0); assert(value.checks.every((item) => typeof item === "string" && /^[a-z0-9_]{1,128}$/u.test(item)));
  assert.equal(array(value.observed_workgroup_allocations, 2).length, 2);
  const allocations = [allocation(value.global_allocation), ...value.observed_workgroup_allocations.map(allocation)];
  assert.equal(new Set(allocations.map((item) => item.ordinal)).size, 3); return allocations;
}
function decimal(value) { assert(typeof value === "string" && /^(0|[1-9][0-9]{0,19})$/u.test(value)); const number = BigInt(value); assert(number <= 18446744073709551615n); return number; }
function token(value) { assert(typeof value === "string" && value.length > 0 && value.length <= 256 && /^[\x21-\x7e]+$/u.test(value)); }

export function validateResourceLdsMultiObservation(fixtureBytes, requestBytes, responseBytes, expectedSha256) {
  assert(fixtureBytes.length > 0 && fixtureBytes.length <= MAX_LDS_MULTI_FIXTURE_BYTES, "fixture byte cap exceeded");
  digest(expectedSha256); assert.equal(sha(fixtureBytes), expectedSha256, "fixture independent display pin changed");
  const fixture = keys(parsed(decode(fixtureBytes)), ["schema", "receipt", "context", "checkpoints"]);
  assert.equal(fixture.schema, "fe2o3-retained-lds-multi-workgroup-view-v1");
  keys(fixture.receipt, ["sha256", "utf8"]); digest(fixture.receipt.sha256);
  assert(typeof fixture.receipt.utf8 === "string" && Buffer.byteLength(fixture.receipt.utf8) <= 16384);
  assert.equal(sha(fixture.receipt.utf8), fixture.receipt.sha256, "receipt bytes changed");
  const receipt = parsed(fixture.receipt.utf8), allocations = validateReceipt(receipt);
  const requests = transcript(requestBytes), responses = transcript(responseBytes);
  assert.equal(sha(requestBytes), receipt.debug_requests_sha256, "full request transcript changed");
  assert.equal(sha(responseBytes), receipt.debug_responses_sha256, "full response transcript changed");
  assert.equal(responseBytes.length, receipt.response_bytes); assert.equal(requests.size, receipt.commands);
  assert.deepEqual([...requests.keys()], [...responses.keys()], "incomplete raw transcript pairing");
  for (const [id, request] of requests) {
    const response = responses.get(id); assert.equal(response.operation, request.operation);
    assert(["fe2o3-debug-request-v1", "fe2o3-debug-resource-request-v1"].includes(request.schema));
    assert.equal(response.schema, request.schema === "fe2o3-debug-request-v1" ? "fe2o3-debug-response-v1" : "fe2o3-debug-resource-response-v1");
  }
  assert.deepEqual(fixture.context, { connectionId: "retained-lds-multi-workgroup-v5-r1", captureIdentity: receipt.debug_responses_sha256,
    target: "gfx942:xnack-", variantIdentity: receipt.bundle_sha256 });
  assert.equal(array(fixture.checkpoints, 7).length, 7); assert.deepEqual(fixture.checkpoints.map((row) => row.id), ids);
  const selected = new Set();
  function pair(value, operation, selectedAnchor, resource = false) {
    keys(value, ["request", "response"]); const { request, response } = value;
    assert(!selected.has(request.request_id), "duplicate selected request"); selected.add(request.request_id);
    assert.deepEqual(requests.get(request.request_id), request, "selected request differs from original whole record");
    assert.deepEqual(responses.get(response.request_id), response, "selected response differs from original whole record");
    assert.equal(request.request_id, response.request_id, "cross-paired response"); assert.equal(request.operation, operation); assert.equal(response.operation, operation);
    assert.equal(request.schema, resource ? "fe2o3-debug-resource-request-v1" : "fe2o3-debug-request-v1");
    assert.equal(response.schema, resource ? "fe2o3-debug-resource-response-v1" : "fe2o3-debug-response-v1"); session(response, selectedAnchor);
    if (operation === "step") {
      keys(response, ["schema", "status", "request_id", "operation", "session", "result"]);
      keys(response.result, ["result", "stop", "snapshot", "events_advanced"]);
      keys(response.result.snapshot, ["status", "snapshot"]); keys(response.result.snapshot.snapshot, ["anchor", "stop", "values"]);
      keys(request, ["schema", "request_id", "expected_revision", "operation", "direction", "granularity", "count"]);
      assert.equal(request.expected_revision + 1, selectedAnchor.cursor.state_revision); assert.equal(request.granularity, "operation"); assert.equal(request.count, 1);
      assert.equal(response.result.result, "control"); assert.equal(response.result.snapshot.status, "captured"); assert.equal(response.result.events_advanced, 1);
      assert.deepEqual(response.result.stop, { reason: "step", outcome: "active", exact: true });
      assert.deepEqual(response.result.snapshot.snapshot.stop, response.result.stop); assert.deepEqual(response.result.snapshot.snapshot.anchor, selectedAnchor);
    } else {
      assert.equal(request.expected_revision, selectedAnchor.cursor.state_revision);
      if (resource) {
        keys(request, ["schema", "request_id", "expected_revision", "operation", "expected_snapshot", "page", ...(operation === "query_memory_accesses" ? ["filter"] : [])]);
        keys(response, ["schema", "status", "request_id", "operation", "session", "snapshot", "page", "result", "physical_registers"]);
        assert.deepEqual(request.expected_snapshot, selectedAnchor); assert.deepEqual(response.snapshot, selectedAnchor);
        assert.equal(response.physical_registers, "not_represented");
        keys(request.page, ["max_items", "max_scanned", ...(Object.hasOwn(request.page, "token") ? ["token"] : [])]);
        assert(safe(request.page.max_items, 1, 256) && safe(request.page.max_scanned, 1, 256));
        keys(response.page, ["source_count", "scanned", "completeness", ...(Object.hasOwn(response.page, "next_token") ? ["next_token"] : [])]);
        assert(safe(response.page.source_count, 0, 65536) && safe(response.page.scanned, 0, Math.min(request.page.max_scanned, response.page.source_count)));
        assert.deepEqual(response.page.completeness, { status: "complete" });
        if (request.page.token !== undefined) token(request.page.token);
        if (response.page.next_token !== undefined) { token(response.page.next_token); assert(response.page.scanned > 0 && response.page.source_count > response.page.scanned); assert.notEqual(response.page.next_token, request.page.token); }
      } else {
        keys(request, ["schema", "request_id", "expected_revision", "operation", "allocation", "byte_offset", "byte_len"]);
        keys(response, ["schema", "status", "request_id", "operation", "session", "result"]);
        assert.deepEqual(response.result.snapshot, selectedAnchor);
      }
    }
  }
  // Allocation roles are observation identities, not inferred owners.
  const profiles = [
    { group: 0, present: 1, memories: [1, 0], unavailable: [], pages: [], direction: "forward" },
    { group: 1, present: null, memories: [], unavailable: [1], pages: [], direction: "forward" },
    { group: 1, present: 2, memories: [2, 0], unavailable: [1], pages: [], direction: "forward" },
    { group: 0, present: 1, memories: [1], unavailable: [2], pages: [[1, 2]], direction: "reverse" },
    { group: 1, present: 2, memories: [2], unavailable: [], pages: [[0, 1], [1, 2]], direction: "forward" },
    { group: 1, present: 2, memories: [2, 0], unavailable: [], pages: [[1, 2], [1, 0]], direction: "forward" },
    { group: 1, present: 2, memories: [0], unavailable: [], pages: [[0, 0], [1, 0]], direction: "reverse" },
  ];
  const tree = [128, 64, 32, 32, ...Array(4).fill(16), ...Array(8).fill(8), ...Array(16).fill(4), ...Array(32).fill(2)];
  const treeBytes = Buffer.alloc(256); tree.forEach((value, index) => treeBytes.writeUInt32LE(value, index * 4));
  fixture.checkpoints.forEach((checkpoint, index) => {
    keys(checkpoint, ["id", "expectedSnapshot", "control", "inventory", "memories", "unavailableWindows", "accessPages"]);
    const profile = profiles[index], current = checkpoint.expectedSnapshot; anchor(current, profile.group);
    pair(checkpoint.control, "step", current); assert.equal(checkpoint.control.request.direction, profile.direction);
    pair(checkpoint.inventory, "query_allocations", current, true);
    const result = keys(checkpoint.inventory.response.result, ["result", "allocations"]); assert.equal(result.result, "allocations");
    assert.equal(checkpoint.inventory.response.page.next_token, undefined);
    const inventory = array(result.allocations, 2), expected = [allocations[0], ...(profile.present === null ? [] : [allocations[profile.present]])];
    keys(checkpoint.inventory.request.page, ["max_items", "max_scanned"]);
    assert.equal(checkpoint.inventory.response.page.source_count, inventory.length);
    assert.equal(checkpoint.inventory.response.page.scanned, inventory.length);
    assert.deepEqual(inventory.map((row) => row.allocation), expected);
    for (const row of inventory) {
      keys(row, ["allocation", "address_space", "capacity_bytes", "alignment", "access", "snapshot_bytes_available", "initialization_available", "owning_scope", "lifetime", "physical_base"]);
      const global = row.allocation.ordinal === allocations[0].ordinal;
      assert.equal(row.address_space, global ? "global" : "workgroup"); assert.equal(row.capacity_bytes, global ? "520" : "256");
      assert.equal(row.alignment, 4); assert.equal(row.access, "read_write"); assert.equal(row.snapshot_bytes_available, true); assert.equal(row.initialization_available, true);
      for (const field of ["owning_scope", "lifetime", "physical_base"]) assert.equal(row[field], "not_represented");
    }
    for (const [kind, roles] of [["memories", profile.memories], ["unavailableWindows", profile.unavailable]]) {
      assert.equal(array(checkpoint[kind], kind === "memories" ? 2 : 1).length, roles.length);
      checkpoint[kind].forEach((window, position) => {
        pair(window, "read_memory", current); const role = roles[position], identity = allocations[role], length = role === 0 ? 520 : 256;
        assert.deepEqual(window.request.allocation, identity); assert.equal(window.request.byte_offset, 0); assert.equal(window.request.byte_len, length);
        keys(window.response.result, ["result", "snapshot", "memory"]); assert.equal(window.response.result.result, "memory");
        const read = keys(window.response.result.memory, ["allocation", "byte_offset", "requested_bytes", "returned_bytes", "availability"]);
        assert.deepEqual(read.allocation, identity); assert.equal(read.byte_offset, 0); assert.equal(read.requested_bytes, length);
        const present = inventory.some((row) => row.allocation.ordinal === identity.ordinal);
        if (kind === "unavailableWindows") {
          assert.equal(present, false); assert.equal(read.returned_bytes, 0); assert.deepEqual(read.availability, { status: "unavailable", reason: "not_represented" });
        } else {
          assert.equal(present, true); assert.equal(read.returned_bytes, length);
          const available = keys(read.availability, ["status", "address_space", "bytes", "initialized", "truncated"]);
          assert.equal(available.status, "captured"); assert.equal(available.address_space, role === 0 ? "global" : "workgroup"); assert.equal(available.truncated, false);
          assert.match(available.bytes, new RegExp(`^0x[0-9a-f]{${length * 2}}$`, "u"));
          if (role === 0) {
            const words = index === 5 ? 65 : index === 6 ? 128 : 64;
            assert.equal(available.bytes, "0x" + "80000000".repeat(words) + "a5".repeat((128 - words) * 4) + "deadbeefcafebabe");
            assert.equal(available.initialized, "0x" + "ff".repeat(65));
          } else {
            const uninitialized = index === 2 || index === 4;
            assert.equal(available.initialized, "0x" + (uninitialized ? "00" : "ff").repeat(32));
            if (!uninitialized) assert.equal(available.bytes, "0x" + treeBytes.toString("hex"));
          }
        }
      });
    }
    assert.equal(array(checkpoint.accessPages, 2).length, profile.pages.length);
    checkpoint.accessPages.forEach((page, position) => {
      pair(page, "query_memory_accesses", current, true); const [group, role] = profile.pages[position], identity = allocations[role];
      assert.deepEqual(page.request.filter, { scope: { level: "workgroup", workgroup: [group, 0, 0] }, address_space: role === 0 ? "global" : "workgroup", allocation: identity });
      keys(page.response.result, ["result", "accesses"]); assert.equal(page.response.result.result, "memory_accesses");
      const rows = array(page.response.result.accesses, page.request.page.max_items); assert(rows.length <= page.response.page.scanned);
      assert(page.response.page.source_count <= current.cursor.event_sequence); let previous = 0;
      for (const row of rows) {
        keys(row, ["occurrence", "allocation", "range", "address_space", "access", "call_frame", "operation_occurrence", "source_association"]);
        assert.deepEqual(row.allocation, identity); assert.equal(row.address_space, role === 0 ? "global" : "workgroup");
        const occurrence = keys(row.occurrence, ["record_ordinal", "event_sequence", "scope", "site", "schedule"]);
        assert(safe(occurrence.event_sequence, previous + 1, page.response.page.source_count)); assert.equal(occurrence.event_sequence, occurrence.record_ordinal + 1); previous = occurrence.event_sequence;
        scope(occurrence.scope, group); assert.equal(occurrence.schedule.identity, "workgroup_major_local_zyx_cooperative_v1"); assert(safe(occurrence.schedule.decision_ordinal));
        keys(row.range, ["byte_offset", "byte_len"]); const start = decimal(row.range.byte_offset), length = decimal(row.range.byte_len);
        assert.equal(length, 4n); assert.equal(start % 4n, 0n); assert(start + length <= BigInt(role === 0 ? 520 : 256));
        if (role === 0) assert(start >= BigInt(group * 256) && start < BigInt((group + 1) * 256));
        assert(["read", "write_committed"].includes(row.access));
        for (const field of ["call_frame", "operation_occurrence", "source_association"]) assert.equal(row[field], "not_represented");
      }
    });
  });
  const anchors = fixture.checkpoints.map((checkpoint) => checkpoint.expectedSnapshot);
  assert(anchors.every((value) => value.cursor.configuration_identity === anchors[0].cursor.configuration_identity));
  for (const [current, previous] of [[3, 0], [4, 2]]) {
    assert(anchors[current].cursor.state_revision > anchors[previous].cursor.state_revision);
    assert.deepEqual(anchors[current], { ...anchors[previous], cursor: { ...anchors[previous].cursor, state_revision: anchors[current].cursor.state_revision } });
  }
  assert(anchors[0].cursor.event_sequence < anchors[1].cursor.event_sequence && anchors[1].cursor.event_sequence < anchors[2].cursor.event_sequence &&
    anchors[4].cursor.event_sequence < anchors[5].cursor.event_sequence && anchors[5].cursor.event_sequence < anchors[6].cursor.event_sequence);
  assert.equal(selected.size, 33);
  return Object.freeze({ requests: requests.size, responses: responses.size, selected_pairs: selected.size, checkpoints: 7,
    fixture_bytes: fixtureBytes.length, request_bytes: requestBytes.length, response_bytes: responseBytes.length,
    compiler_execution_authenticated: false, hardware_observed: false, lifecycle_authority: false });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length, 6, "usage: node validate-resource-query-lds-multi-observation.mjs FIXTURE REQUESTS RESPONSES EXPECTED_SHA256");
  console.log("Validated retained two-workgroup LDS observation:", validateResourceLdsMultiObservation(
    readBoundedLdsMultiFile(resolve(process.argv[2]), MAX_LDS_MULTI_FIXTURE_BYTES),
    readBoundedLdsMultiFile(resolve(process.argv[3]), MAX_LDS_MULTI_TRANSCRIPT_BYTES),
    readBoundedLdsMultiFile(resolve(process.argv[4]), MAX_LDS_MULTI_TRANSCRIPT_BYTES), process.argv[5]));
}
