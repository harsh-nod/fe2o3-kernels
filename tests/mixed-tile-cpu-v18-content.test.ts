import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { lessons } from "../src/content/curriculum";

import {
  mixedTileCpuV18,
  mixedTileCpuV18Claim,
  mixedTileCpuV18Evidence as evidence,
  mixedTileCpuV18Tabs,
} from "../src/content/mixed-tile-cpu-v18";

const directory = "../examples/mixed-tile-cpu-v18/";
const read = (path: string) => readFileSync(new URL(directory + path, import.meta.url));
const sha = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
const document = (path: string) => JSON.parse(read(path).toString("utf8"));
const orders = ["blocked", "striped"] as const;
const bytes = (hex: string) => Buffer.from(hex.slice(2), "hex");

it("registers the real attributed kernel without replacing existing source tabs or historical pins", () => {
  const lesson = lessons.find((item) => item.id === "cpu-semantic-simulation")!;
  expect(lesson.tabs[6].label).toBe("SIMT row");
  expect(lesson.tabs[7]).toEqual(mixedTileCpuV18Tabs[0]);
  expect(lesson.tabs[7].kind).toBe("kernel");
  expect(lesson.tabs[7].explanatory).toBe(false);
  expect(lesson.tabs[7].sourceDigestScope).toBe("file");
  expect(lesson.sections).toContainEqual({
    kind: "narrative", narrativeId: "cpu-semantic-simulation/mixed-tile-v18",
  });
  expect(lesson.claims).toContainEqual(mixedTileCpuV18Claim);
  expect(mixedTileCpuV18Tabs[0].code).toContain("#[kernel(");
  expect(sha(mixedTileCpuV18Tabs[0].code)).toBe(evidence.sourceSha256);
  expect(sha(mixedTileCpuV18Tabs[1].code)).toBe(evidence.oracleSha256);
  expect(mixedTileCpuV18Claim.reference?.commit).toBe(evidence.compilerRef);
});

it("pins the ordinary manifest qualification and keeps CPU observations separate from authority", () => {
  expect(sha(read("summary.json"))).toBe(evidence.summarySha256);
  const summary = document("summary.json");
  expect(summary.source_head).toBe(evidence.compilerRef);
  expect(summary.source_sha256).toBe(evidence.sourceSha256);
  expect(summary.example_feature).toBe("mixed-tile-u32-kernel");
  expect(summary.example_crate).toBe("fe2o3_workgroup_sync_v1");
  expect(summary.fixture_source_injection).toBe(false);
  expect(summary.simulations).toBe(52);
  expect(summary.debugger_sessions).toBe(2);
  expect(summary.simulator_refusals + summary.debugger_cli_refusals
    + summary.debugger_protocol_unavailable_controls).toBe(10);
  for (const flag of ["hardware_observed", "performance_prediction",
    "source_authentication_exported", "cross_order_whole_kernel_equivalence"]) {
    expect(summary[flag]).toBe(false);
  }
  expect(summary.observations[0].source_semantic).toBe(summary.observations[1].source_semantic);
  expect(summary.observations[0].pending_identity).toBe(summary.observations[1].pending_identity);
  expect(summary.observations[0].canonical_identity).not.toBe(summary.observations[1].canonical_identity);
  expect(summary.observations[0].schedule_identity).not.toBe(summary.observations[1].schedule_identity);
});

it.each(orders)("binds the %s inventory, request, simulator bytes and recorded debugger memory", (order) => {
  const inventory = document(order + ".inventory.json");
  const request = document(order + "-case-debug.request.json");
  const result = document(order + "-case-debug.result.json");
  expect(inventory.kir.raw_sha256).toBe(sha(read(order + ".kir")));
  expect(inventory.kir.canonical_bytes).toBe(read(order + ".kir").length);
  expect(inventory.simulator_admission).toBe("not_checked");
  expect(inventory.simulated).toBe(false);
  expect(request.kernel).toBe(inventory.kernels[0].id);
  expect(result.kir.sha256).toBe(inventory.kir.identity_sha256);
  expect(request.arguments[1].type).toBe("u64");
  expect(result.authority).toBe("observation_only");
  expect(result.status).toBe("ok");
  expect(result.hardware_observed).toBe(false);

  const input = bytes(request.shared_buffers[0].bytes);
  const expected = bytes(request.shared_buffers[1].bytes);
  const view = expected.subarray(12, 44);
  for (let lane = 0; lane < 8; lane++) {
    let sum = 0n;
    for (let j = 0; j < 3; j++) {
      const index = order === "blocked" ? lane * 3 + j : 64 * j + lane;
      if (index < 65) {
        sum += BigInt(input.readUInt32LE(12 + index * 4)) * BigInt(3 + 2 * j)
          + BigInt([11, 13, 17][j]);
      }
    }
    view.writeUInt32LE(Number(sum & 0xffffffffn), lane * 4);
  }
  expect(result.shared_buffers[0].buffer.bytes).toBe(request.shared_buffers[0].bytes);
  expect(result.shared_buffers[0].buffer.initialized).toBe(request.shared_buffers[0].initialized);
  expect(result.shared_buffers[1].buffer.bytes).toBe("0x" + expected.toString("hex"));
  expect(result.shared_buffers[1].buffer.initialized).toBe("0xffffffffffff0f");

  const raw = read(order + "-debug.responses.jsonl").toString("utf8");
  expect(sha(raw)).toBe(order === "blocked" ? evidence.blockedResponsesSha256 : evidence.stripedResponsesSha256);
  // Inspect safe-size fields without reserializing the raw u64 active masks.
  expect(raw).toContain('"active_mask":18446744073709551615');
  const responses = raw.trimEnd().split("\n").map((line) => JSON.parse(line));
  const requests = read(order + "-debug.requests.jsonl").toString("utf8").trimEnd()
    .split("\n").map((line) => JSON.parse(line));
  expect(responses).toHaveLength(15);
  expect(requests.map((item) => item.request_id)).toEqual(responses.map((item) => item.request_id));
  expect(responses.filter((item) => item.status === "error")).toHaveLength(0);
  expect(responses.filter((item) => item.status === "unavailable")).toHaveLength(2);
  expect(responses[11].result.stop).toEqual({ reason: "completed", outcome: "completed", exact: true });
  expect(responses[13].result.memory.allocation).toEqual({ ordinal: 2, generation: 0 });
  expect(responses[13].result.memory.availability.bytes).toBe(result.shared_buffers[1].buffer.bytes);
  expect(responses[13].result.memory.availability.initialized).toBe("0xffffffffffff0f");
  expect(responses[14].session.state).toBe("terminated");
});

it("keeps the runnable recipe on the ordinary V18 route with inventory-derived IDs", () => {
  const workflow = mixedTileCpuV18Tabs[2].code;
  expect(workflow).toContain("--crate fe2o3_workgroup_sync_v1");
  expect(workflow).toContain("--no-default-features --features mixed-tile-u32-kernel");
  expect(workflow).toContain('request["kernel"] = kernel["id"]');
  expect(workflow).toContain("--diagnostic-kir-v18");
  expect(workflow).toContain('python3 "$recorded/verify-result.py"');
  expect(workflow).not.toContain("FE2O3_CONTEXT_PROTOCOL_SOURCE");
  expect(workflow).not.toContain("--bundle-v5");
  const narrative = JSON.stringify(mixedTileCpuV18);
  for (const text of ["mir-opt-level=0", "mutable execution-borrow copy refusal",
    "requires Wave64", "persisted schedule record/replay",
    "pending curriculum binding", "native SIMT/tile obligations"]) {
    expect(narrative).toContain(text);
  }
});

it("runs the fixed-input result checker and refuses changed output or false authority", () => {
  const path = (name: string) => fileURLToPath(new URL(directory + name, import.meta.url));
  const temporary = mkdtempSync(join(tmpdir(), "mixed-tile-result-"));
  const check = (result: string) => spawnSync("python3", [
    path("verify-result.py"), path("blocked.inventory.json"),
    path("blocked-case-debug.request.json"), result,
    path("blocked-case-debug.request.json"), path("blocked-case-debug.result.json"),
  ], { encoding: "utf8", timeout: 10_000 });
  try {
    expect(check(path("blocked-case-debug.result.json")).status).toBe(0);
    const changed = document("blocked-case-debug.result.json");
    changed.shared_buffers[1].buffer.bytes = "0x00";
    const changedPath = join(temporary, "changed.json");
    writeFileSync(changedPath, JSON.stringify(changed));
    const rejected = check(changedPath);
    expect(rejected.status).not.toBe(0);
    expect(rejected.stderr).toContain("exact input/output bytes and initialization");
    const falseAuthority = document("blocked-case-debug.result.json");
    falseAuthority.hardware_observed = true;
    writeFileSync(changedPath, JSON.stringify(falseAuthority));
    expect(check(changedPath).stderr).toContain("hardware_observed");
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
