import { createHash, webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import retainedUtf8 from "../examples/source_lds_multi_workgroup_v1.json?raw";
import { projectResourceLdsMultiCapture, RESOURCE_LDS_MULTI_MAX_BYTES } from "../src/content/resource-lds-multi-capture";

const pin = "13165393fd04bb857f80886984b0e7a31262209cc2546d117d650cc2179fe441";
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
type Fixture = ReturnType<typeof JSON.parse>;
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());
async function rejected(mutate: (fixture: Fixture) => void) {
  // Rehashed mutations are deliberately negative presentation controls, not evidence.
  const fixture = JSON.parse(retainedUtf8); mutate(fixture); const text = JSON.stringify(fixture);
  expect((await projectResourceLdsMultiCapture(text, sha(text))).status).toBe("invalid");
}

describe("actual two-workgroup retained display envelope", () => {
  it("accepts the exact compact pin and frozen seven-stop source CPU observation", async () => {
    expect(new TextEncoder().encode(retainedUtf8)).toHaveLength(222854);
    const value = await projectResourceLdsMultiCapture(retainedUtf8, pin);
    expect(value.status).toBe("ready"); if (value.status !== "ready") throw new Error(value.detail);
    expect(value.checkpoints.map((item) => item.expectedSnapshot.cursor.event_sequence)).toEqual([16078, 16079, 16080, 16078, 16080, 31211, 32156]);
    expect(value.checkpoints.map((item) => item.expectedSnapshot.cursor.state_revision)).toEqual([9, 10, 11, 13, 15, 19, 22]);
    expect(value.checkpoints[1].memories).toHaveLength(0);
    expect(value.checkpoints[1].unavailableWindows[0].allocationLabel).toBe("alloc#2:g0");
    expect(value.checkpoints[4].accessPages[0]).toMatchObject({ filterWorkgroup: 0, allocationLabel: "alloc#2:g0", allocationPresent: false, rows: 16, hasMorePages: true });
    expect(value.checkpoints[4].accessPages[1]).toMatchObject({ filterWorkgroup: 1, allocationPresent: true, rows: 0, hasMorePages: true });
    expect(Object.isFrozen(value.checkpoints[0].memories[0].response)).toBe(true);
    expect(value.context.variantIdentity).toBe(value.bundleFileSha256);
  });

  it("rejects wrong pins, byte changes, Unicode/size/JSON bounds and malformed SHA", async () => {
    for (const [raw, expected] of [[retainedUtf8, "1".repeat(64)], [retainedUtf8 + "\n", pin], [retainedUtf8, "0".repeat(64)],
      [" ".repeat(RESOURCE_LDS_MULTI_MAX_BYTES + 1), pin], ["\ud800", sha("\ud800")], ["{", sha("{")],
      ["[".repeat(34) + "0" + "]".repeat(34), sha("[".repeat(34) + "0" + "]".repeat(34))]]) {
      expect((await projectResourceLdsMultiCapture(raw, expected)).status).toBe("invalid");
    }
  });

  it("does not show bytes without WebCrypto or after cancellation", async () => {
    const abort = new AbortController(); abort.abort();
    expect((await projectResourceLdsMultiCapture(retainedUtf8, pin, abort.signal)).status).toBe("cancelled");
    vi.stubGlobal("crypto", {});
    expect((await projectResourceLdsMultiCapture(retainedUtf8, pin)).status).toBe("unavailable");
  });

  it("rejects cross-paired requests, full-anchor drift and duplicate IDs", async () => {
    for (const change of [
      (f: Fixture) => { f.checkpoints[0].expectedSnapshot.scope.lane++; },
      (f: Fixture) => { f.checkpoints[0].expectedSnapshot.site.kir.function_ordinal++; },
      (f: Fixture) => { f.checkpoints[0].control.response.session.configuration_identity = "2".repeat(64); },
      (f: Fixture) => { f.checkpoints[3].control.request.direction = "forward"; },
      (f: Fixture) => { f.checkpoints[4].inventory.response = f.checkpoints[2].inventory.response; },
      (f: Fixture) => { f.checkpoints[0].memories[0].request.request_id = f.checkpoints[0].inventory.request.request_id; },
      (f: Fixture) => { f.checkpoints[5].accessPages[0].response = f.checkpoints[5].accessPages[1].response; },
      (f: Fixture) => { f.context.captureIdentity = "3".repeat(64); },
      (f: Fixture) => { f.context.variantIdentity = "3".repeat(64); },
      (f: Fixture) => { f.checkpoints[3].id = "wg0_last_write"; },
      (f: Fixture) => { f.checkpoints[0].unexpected = true; },
      (f: Fixture) => { f.checkpoints[0].control.response.authority = "authenticated"; },
    ]) await rejected(change);
  });

  it("refuses current/absent window substitution, generations, ranges and initialization drift", async () => {
    for (const change of [
      (f: Fixture) => { f.checkpoints[1].memories = [f.checkpoints[0].memories[0]]; },
      (f: Fixture) => { f.checkpoints[1].inventory.request.address_space = "global"; },
      (f: Fixture) => { f.checkpoints[1].inventory.request.page.token = "resource.1.1"; },
      (f: Fixture) => { f.checkpoints[1].inventory.response.page.source_count = 2; },
      (f: Fixture) => { f.checkpoints[1].unavailableWindows[0].response.result.memory.returned_bytes = 256; },
      (f: Fixture) => { f.checkpoints[1].unavailableWindows[0].response.result.memory.availability = { status: "captured", address_space: "workgroup", bytes: `0x${"00".repeat(256)}`, initialized: `0x${"00".repeat(32)}`, truncated: false }; },
      (f: Fixture) => { f.checkpoints[2].memories[0].request.allocation.generation = 1; },
      (f: Fixture) => { f.checkpoints[2].memories[0].request.byte_len = 252; },
      (f: Fixture) => { f.checkpoints[2].memories[0].response.result.memory.availability.initialized = `0x${"ff".repeat(32)}`; },
      (f: Fixture) => { f.checkpoints[0].inventory.response.result.allocations[0].capacity_bytes = "0520"; },
      (f: Fixture) => { f.checkpoints[0].inventory.response.result.allocations[1].owning_scope = "workgroup"; },
      (f: Fixture) => { f.checkpoints[2].memories[0].response.result.memory.availability.address_space = "global"; },
    ]) await rejected(change);
  });

  it("refuses wrong scope, future rows, lossy offsets, unsupported physical facts and oversized pages", async () => {
    for (const change of [
      (f: Fixture) => { f.checkpoints[4].accessPages[0].request.filter.scope.workgroup[0] = 1; },
      (f: Fixture) => { f.checkpoints[4].accessPages[0].response.result.accesses[0].allocation.ordinal = 3; },
      (f: Fixture) => { f.checkpoints[4].accessPages[0].response.result.accesses[0].occurrence.event_sequence = 99999; },
      (f: Fixture) => { f.checkpoints[4].accessPages[0].response.result.accesses[0].range.byte_offset = "18446744073709551616"; },
      (f: Fixture) => { f.checkpoints[4].accessPages[0].response.result.accesses[0].range.byte_offset = "00"; },
      (f: Fixture) => { f.checkpoints[4].accessPages[0].request.page.max_scanned = 257; },
      (f: Fixture) => { f.checkpoints[4].accessPages[0].response.physical_registers = "captured"; },
      (f: Fixture) => { f.checkpoints[4].accessPages.push(f.checkpoints[4].accessPages[0]); },
      (f: Fixture) => { f.checkpoints[0].expectedSnapshot.scope.active_mask = Number.MAX_SAFE_INTEGER + 1; },
    ]) await rejected(change);
  });

  it("rejects malformed receipt digests and authority/lifecycle/helper claims even after rehashing", async () => {
    const fields = ["source_sha256", "bundle_sha256", "export_observation_sha256", "simulation_request_sha256", "simulation_stdout_sha256",
      "debug_requests_sha256", "debug_responses_sha256", "results_sha256", "script_sha256", "helper_sha256"];
    for (const field of fields) await rejected((f) => {
      const receipt = JSON.parse(f.receipt.utf8); receipt[field] = "not-a-sha";
      f.receipt.utf8 = JSON.stringify(receipt); f.receipt.sha256 = sha(f.receipt.utf8);
    });
    for (const [field, value] of [["schema", "other"], ["owning_scope", "wg0"], ["lifetime", "known"], ["physical_reuse_observed", true],
      ["allocation_release_event_captured", true], ["source_helper_or_loop_qualification", true], ["hardware_observed", true],
      ["compiler_closure_attestation", "authenticated"], ["logical_wave_width", 64], ["disk_reserve_bytes", "1"]] as const) {
      await rejected((f) => { const receipt = JSON.parse(f.receipt.utf8); receipt[field] = value; f.receipt.utf8 = JSON.stringify(receipt); f.receipt.sha256 = sha(f.receipt.utf8); });
    }
    for (const field of ["simulator", "debugger"]) await rejected((f) => {
      const receipt = JSON.parse(f.receipt.utf8); receipt.executable_sha256[field] = "0".repeat(64);
      f.receipt.utf8 = JSON.stringify(receipt); f.receipt.sha256 = sha(f.receipt.utf8);
    });
  });
});
