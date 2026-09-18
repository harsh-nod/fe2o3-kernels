import { createHash, webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import retainedUtf8 from "../examples/source_lds_resource_v1.json?raw";
import { projectResourceLdsCapture, RESOURCE_LDS_MAX_BYTES } from "../src/content/resource-lds-capture";

const pin = "1d1ab41c25693745d233af08f856834d123f8abbb8888f418b1cf5db4a63b494";
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());

describe("actual retained LDS display envelope", () => {
  it("admits the unchanged independently pinned four-checkpoint CPU capture", async () => {
    const result = await projectResourceLdsCapture(retainedUtf8, pin);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error(result.detail);
    expect(result.checkpoints.map((item) => item.id)).toEqual(["pre_write", "first_write", "reduction", "final"]);
    expect(result.checkpoints.map((item) => item.expectedSnapshot.cursor.event_sequence)).toEqual([2, 13, 15133, 16078]);
    expect(result.checkpoints.map((item) => item.expectedSnapshot.cursor.state_revision)).toEqual([2, 5, 11, 14]);
    expect(result.context.variantIdentity).toBe(result.bundleFileSha256);
    expect(Object.isFrozen(result.checkpoints[2].memories[0].response)).toBe(true);
    expect(result.checkpoints[2].accessPages.map((page) => page.request.request_id)).toEqual([31, 150]);
    expect(result.checkpoints[3].memories.map((window) => window.addressSpace)).toEqual(["global"]);
  });

  it("rejects a changed independent pin before showing any projection", async () => {
    expect((await projectResourceLdsCapture(retainedUtf8, "1".repeat(64))).status).toBe("invalid");
    expect((await projectResourceLdsCapture(retainedUtf8 + "\n", pin)).status).toBe("invalid");
  });

  it("fails closed for unavailable hashing and cancelled selection", async () => {
    const abort = new AbortController(); abort.abort();
    expect((await projectResourceLdsCapture(retainedUtf8, pin, abort.signal)).status).toBe("cancelled");
    vi.stubGlobal("crypto", {});
    expect((await projectResourceLdsCapture(retainedUtf8, pin)).status).toBe("unavailable");
  });

  it("rejects oversized bytes, lone surrogates, malformed JSON and excessive nesting", async () => {
    for (const text of [" ".repeat(RESOURCE_LDS_MAX_BYTES + 1), "\ud800", "{", "[".repeat(34) + "0" + "]".repeat(34)]) {
      expect((await projectResourceLdsCapture(text, sha(text))).status).toBe("invalid");
    }
  });

  it("rejects tampered anchors, sessions, generations, ranges, request IDs and page pairing", async () => {
    // Deliberately tampered copies are negative presentation tests, not captures.
    const mutations = [
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.checkpoints[2].expectedSnapshot.cursor.state_revision++; },
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.checkpoints[2].expectedSnapshot.scope.lane = 1; },
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.checkpoints[2].control.response.session.configuration_identity = "2".repeat(64); },
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.checkpoints[2].memories[0].request.allocation.generation = 1; },
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.checkpoints[2].memories[0].request.byte_offset = 4; },
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.checkpoints[2].memories[0].request.byte_len = 128; },
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.checkpoints[2].memories[0].response.request_id++; },
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.checkpoints[2].memories[0].response = fixture.checkpoints[2].memories[1].response; },
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.checkpoints[2].inventory.request = fixture.checkpoints[2].accessPages[0].request; },
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.checkpoints[2].accessPages[0].response = fixture.checkpoints[2].accessPages[1].response; },
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.checkpoints[2].memories[0].addressSpace = "global"; },
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.context.captureIdentity = "2".repeat(64); },
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.context.variantIdentity = "2".repeat(64); },
    ];
    for (const mutate of mutations) {
      const fixture = JSON.parse(retainedUtf8); mutate(fixture);
      const text = JSON.stringify(fixture);
      expect((await projectResourceLdsCapture(text, sha(text))).status).toBe("invalid");
    }
  });

  it("rejects unrepresented-fact elevation even when receipt hashes are recomputed", async () => {
    for (const [key, value] of [
      ["schema", "other"], ["logical_wave_width", 64], ["compiler_closure_attestation", "authenticated"],
      ["hardware_observed", true], ["grants_launch_authority", true], ["lifetime", "known"],
      ["owning_scope", "workgroup"], ["physical_registers", "captured"], ["access_source_association", "resolved"],
    ] as const) {
      const fixture = JSON.parse(retainedUtf8), receipt = JSON.parse(fixture.receipt.utf8);
      receipt[key] = value; fixture.receipt.utf8 = JSON.stringify(receipt); fixture.receipt.sha256 = sha(fixture.receipt.utf8);
      const text = JSON.stringify(fixture);
      expect((await projectResourceLdsCapture(text, sha(text))).status).toBe("invalid");
    }
  });

  it("rejects malformed collections, wide-number loss and claimed physical resources", async () => {
    const mutations = [
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.checkpoints.push(fixture.checkpoints[0]); },
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.checkpoints[1].id = fixture.checkpoints[0].id; },
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.checkpoints[0].memories.push(fixture.checkpoints[0].memories[0]); },
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.checkpoints[2].accessPages.push(fixture.checkpoints[2].accessPages[0]); },
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.checkpoints[0].expectedSnapshot.scope.active_mask = Number(18_446_744_073_709_551_615n); },
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.checkpoints[0].inventory.response.result.allocations[0].capacity_bytes = "0264"; },
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.checkpoints[0].inventory.response.physical_registers = "captured"; },
      (fixture: ReturnType<typeof JSON.parse>) => { fixture.checkpoints[0].extra = true; },
    ];
    for (const mutate of mutations) {
      const fixture = JSON.parse(retainedUtf8); mutate(fixture); const text = JSON.stringify(fixture);
      expect((await projectResourceLdsCapture(text, sha(text))).status).toBe("invalid");
    }
  });
});
