import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { expect, it } from "vitest";
import { lessons } from "../src/content/curriculum";
import { associateDebuggerRecords, readMixedTileCpuSummary } from "../src/content/mixed-tile-cpu-evidence";
import {
  narrativeRegistrySnapshot,
  resolveNarrativeEntry,
  validateNarrativeRegistry,
} from "../src/content/narrative-registry";

import {
  mixedTileCpuV18,
  mixedTileCpuV18Claim,
  mixedTileCpuV18Evidence as evidence,
  mixedTileCpuV18Tabs,
} from "../src/content/mixed-tile-cpu-v18";

const historicalDirectory = "../examples/mixed-tile-cpu-v18/";
const historicalHead = "ae162efd2bc8df7a061108a126333c378ac980d9";
const directory = historicalDirectory + evidence.captureDirectory + "/";
const read = (path: string) => readFileSync(new URL(directory + path, import.meta.url));
const readHistorical = (path: string) => readFileSync(new URL(historicalDirectory + path, import.meta.url));
const sha = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
const document = (path: string) => JSON.parse(read(path).toString("utf8"));
const orders = ["blocked", "striped"] as const;
const bytes = (hex: string) => Buffer.from(hex.slice(2), "hex");
const capture = document("index.json");
const mapped = (order: string, role: string) => capture.debuggerEvidence
  .find((item: { order: string }) => item.order === order).files[role].path as string;
const stageLog = (entry: { path: string; encoding: string; rawBytes: number; rawSha256: string }) => {
  expect(entry.encoding).toBe("gzip");
  expect(entry.rawBytes).toBeLessThanOrEqual(1024 * 1024);
  const raw = gunzipSync(read(entry.path), { maxOutputLength: 1024 * 1024 });
  expect(raw.length).toBe(entry.rawBytes);
  expect(sha(raw)).toBe(entry.rawSha256);
  return raw.toString("utf8");
};

it("registers the real attributed kernel without replacing existing source tabs or historical pins", () => {
  const narrativeId = "cpu-semantic-simulation/mixed-tile-v18";
  expect(resolveNarrativeEntry(narrativeId)).toEqual(mixedTileCpuV18);
  const changed = narrativeRegistrySnapshot();
  changed[narrativeId].title += " (unreviewed)";
  expect(validateNarrativeRegistry(changed)).toEqual([
    narrativeId + ": canonical narrative text drift",
  ]);
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
  expect(sha(read("index.json"))).toBe(evidence.captureIndexSha256);
  expect(sha(read("summary.json"))).toBe(evidence.summarySha256);
  const summary = document("summary.json");
  const measured = readMixedTileCpuSummary(read("summary.json").toString("utf8"));
  expect(measured.inventories).toBe(evidence.inventories);
  expect(measured.simulations).toBe(evidence.simulations);
  expect(measured.debuggerSessions).toBe(evidence.debuggerSessions);
  expect(measured.negativeControls).toBe(evidence.negativeControls);
  expect(summary.schema).toBe("fe2o3-scoped-tile-cli-test-v1");
  expect(capture.schema).toBe("fe2o3-mixed-tile-cpu-capture-index-v1");
  expect(capture.authority).toBe("none");
  expect(capture.source.commit).toBe("fed6998b1a5eaf2530e94664a1ede650382a8990");
  expect(capture.source.commit).toBe(evidence.compilerRef);
  expect(capture.source.tree).toBe(evidence.compilerTree);
  expect(capture.source.kernel.sha256).toBe(evidence.sourceSha256);
  expect(capture.source.oracle.sha256).toBe(evidence.oracleSha256);
  expect(summary.source_manifest).toBe(capture.source.manifest.path);
  expect(summary.source_feature).toBe("mixed-tile-u32-kernel");
  expect(summary.fixture_source_injection).toBe(false);
  expect(summary.simulations).toBe(52);
  expect(summary.debugger_sessions).toHaveLength(2);
  expect(summary.negative_controls).toBe(10);
  expect(summary.host_oracle_unit_tests).toBe("separate CI gate");
  for (const flag of ["hardware_observed", "performance_prediction", "full_simt_tile_pair_qualified"]) {
    expect(summary[flag]).toBe(false);
  }
  expect(summary.orders[0].source).toBe(summary.orders[1].source);
  expect(summary.orders[0].pending).toBe(summary.orders[1].pending);
  expect(summary.orders[0].canonical).not.toBe(summary.orders[1].canonical);
  expect(summary.orders[0].schedule).not.toBe(summary.orders[1].schedule);
  for (const artifact of capture.artifacts) {
    expect(read(artifact.path).length).toBe(artifact.bytes);
    expect(sha(read(artifact.path))).toBe(artifact.sha256);
  }
  const collector = document(capture.collector.path);
  expect(sha(read(capture.collector.path))).toBe("b441a066cf23b5232d2e8111e36f3f68c700338619894bdce62c3d07703e54fb");
  expect(collector.authority).toBe("none");
  expect(collector.summary).toEqual(summary);
  expect(collector.debuggerEvidence).toEqual(capture.debuggerEvidence);
  const originalCliLog = collector.terminalEvidence.find((item: { path: string }) =>
    item.path.endsWith("/01-public-mixed-cpu-cli.log"));
  expect(capture.cliStage.log.rawBytes).toBe(originalCliLog.bytes);
  expect(capture.cliStage.log.rawSha256).toBe(originalCliLog.sha256);
  expect(capture.hostOracle.log.rawSha256)
    .toBe("39f39711ba28559eba467d3baab118af559217619c17481429682a06ebb1207f");
  for (const key of ["sourceMeasurementBeforeCollection", "sourceMeasurementAfterCollection"]) {
    expect(collector[key].head).toBe(capture.source.commit);
    expect(collector[key].tree).toBe(capture.source.tree);
    expect(collector[key].sourceFingerprintSha256).toBe(capture.source.fingerprintSha256);
  }
  for (const stage of [capture.cliStage, capture.hostOracle]) {
    const log = stageLog(stage.log);
    expect(read(stage.exit.path).toString("utf8")).toBe("0\n");
    expect(log).toContain("Command exit: 0");
    expect(log.split("\n").filter((line) => line === "HEAD: " + capture.source.commit)).toHaveLength(2);
    expect(log.split("\n").filter((line) => line === "Source: " + capture.source.fingerprintSha256)).toHaveLength(2);
  }
  expect(stageLog(capture.cliStage.log)).toContain(
    "SCOPED_TILE_PUBLIC_CPU_CLI_PASS inventories=2 simulations=52 debugger_sessions=2 negative_controls=10 hardware_observed=false");
  expect(capture.hostOracle.tests).toBe(evidence.hostOracleTests);
  expect(capture.hostOracle.compilerCommit).toBe(capture.source.commit);
  expect(stageLog(capture.hostOracle.log)).toContain("test result: ok. 6 passed; 0 failed; 0 ignored;");
  expect(capture.toolProvenanceLimitation).toContain("not retroactive proof of bytes executed");
});

it.each(orders)("binds the %s inventory, request, simulator bytes and recorded debugger memory", (order) => {
  const inventory = document(mapped(order, "inventory"));
  const request = document(mapped(order, "request"));
  const result = document(mapped(order, "result"));
  expect(inventory.kir.raw_sha256).toBe(sha(read(mapped(order, "kir"))));
  expect(inventory.kir.canonical_bytes).toBe(read(mapped(order, "kir")).length);
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

  const raw = read(mapped(order, "debuggerRepliesRaw")).toString("utf8");
  expect(sha(raw)).toBe(order === "blocked" ? evidence.blockedResponsesSha256 : evidence.stripedResponsesSha256);
  // Inspect safe-size fields without reserializing the raw u64 active masks.
  expect(raw).toContain('"active_mask":18446744073709551615');
  const responses = raw.trimEnd().split("\n").map((line) => JSON.parse(line));
  const requestsRaw = read(mapped(order, "debuggerRequestsRaw")).toString("utf8");
  const requests = requestsRaw.trimEnd()
    .split("\n").map((line) => JSON.parse(line));
  const pairs = associateDebuggerRecords(requestsRaw, raw);
  const session = readMixedTileCpuSummary(read("summary.json").toString("utf8")).sessions
    .find((item) => item.order === order)!;
  expect(pairs).toHaveLength(session.commands);
  expect(responses.every((item) => item.session.configuration_identity === session.configurationIdentity)).toBe(true);
  const records = pairs.map((pair) => ({
    request: requests[pair.requestIndex], response: responses[pair.responseIndex],
  }));
  expect(responses.filter((item) => item.status === "error")).toHaveLength(0);
  expect(responses.filter((item) => item.status === "unavailable")).toHaveLength(2);
  const completed = records.filter(({ request }) => request.operation === "continue");
  expect(completed).toHaveLength(1);
  expect(completed[0].response.result.stop).toEqual({ reason: "completed", outcome: "completed", exact: true });
  const reversed = records.filter(({ request }) => request.operation === "step" && request.direction === "reverse");
  expect(reversed).toHaveLength(1);
  expect(records.indexOf(reversed[0])).toBeGreaterThan(records.indexOf(completed[0]));
  expect(reversed[0].response.result.snapshot.status).toBe("captured");
  const memory = records.filter(({ request }) => request.operation === "read_memory");
  const initial = memory.filter(({ response }) =>
    response.result.memory.availability.bytes === request.shared_buffers[1].bytes
    && response.result.memory.availability.initialized === request.shared_buffers[1].initialized);
  expect(initial).toHaveLength(1);
  const allocation = initial[0].response.result.memory.allocation;
  expect(allocation).toEqual(session.allocation);
  const pointers = records.filter(({ request }) => request.operation === "inspect_values"
    && request.selector.selector === "all").flatMap(({ response }) => response.result.values)
    .filter((entry) => entry.availability.status === "captured"
      && entry.availability.value_type.kind === "pointer"
      && entry.availability.value.encoding === "allocation_relative_pointer")
    .map((entry) => entry.availability.value.allocation);
  expect(pointers).toContainEqual(allocation);
  const final = memory.filter((entry) => records.indexOf(entry) > records.indexOf(reversed[0]));
  expect(final).toHaveLength(1);
  expect(final[0].request.allocation).toEqual(allocation);
  expect(final[0].response.result.memory.allocation).toEqual(allocation);
  expect(final[0].response.result.memory.availability.bytes).toBe(result.shared_buffers[1].buffer.bytes);
  expect(final[0].response.result.memory.availability.initialized).toBe(result.shared_buffers[1].buffer.initialized);
  expect(final[0].response.result.memory.availability.truncated).toBe(false);
  const terminated = records.filter(({ request }) => request.operation === "terminate");
  expect(terminated).toHaveLength(1);
  expect(records.at(-1)).toBe(terminated[0]);
  expect(terminated[0].response.session.state).toBe("terminated");
});

it("keeps the runnable recipe on the ordinary V18 route with inventory-derived IDs", () => {
  const workflow = mixedTileCpuV18Tabs[2].code;
  expect(workflow).toContain("--crate fe2o3_workgroup_sync_v1");
  expect(workflow).toContain("--no-default-features --features mixed-tile-u32-kernel");
  expect(workflow).toContain('request["kernel"] = kernel["id"]');
  expect(workflow).toContain("--diagnostic-kir-v18");
  expect(workflow).toContain('python3 "$helpers/verify-result.py"');
  expect(workflow).toContain('python3 "$helpers/capture-files.py"');
  expect(workflow).toContain('"${request_template[$order]}" "${result_template[$order]}"');
  expect(workflow.indexOf('python3 "$helpers/capture-files.py"')).toBeLessThan(workflow.indexOf("cargo build"));
  expect(workflow.indexOf('result_template[$order]="${captured[1]}"')).toBeLessThan(workflow.indexOf("cargo build"));
  expect(workflow.indexOf("git diff --quiet HEAD --")).toBeLessThan(workflow.indexOf("cargo build"));
  expect(workflow).toContain('target_root="$(realpath -m "${CARGO_TARGET_DIR:-target}")"');
  expect(workflow).toContain('export_target="$target_root/mixed-tile-cpu-export"');
  expect(workflow).not.toContain('$repo/target/');
  expect(workflow).not.toContain("FE2O3_CONTEXT_PROTOCOL_SOURCE");
  expect(workflow).not.toContain("--bundle-v5");
  const narrative = JSON.stringify(mixedTileCpuV18);
  for (const text of ["mir-opt-level=0", "mutable execution-borrow copy refusal",
    "requires Wave64", "persisted schedule record/replay",
    "pending curriculum binding", "native SIMT/tile obligations"]) {
    expect(narrative).toContain(text);
  }
});

it("validates the production summary shape without treating migration fixtures as fresh evidence", () => {
  const historical = JSON.parse(readHistorical("summary.json").toString("utf8"));
  // Re-shaped historical records exercise the parser, not a new execution claim.
  const fixture = {
    schema: "fe2o3-scoped-tile-cli-test-v1", authority: "observation_only",
    hardware_observed: false, performance_prediction: false, fixture_source_injection: false,
    source_manifest: "examples/workgroup_sync_v1/Cargo.toml", source_feature: "mixed-tile-u32-kernel",
    inventories: historical.inventories, simulations: historical.simulations, negative_controls: 10,
    full_simt_tile_pair_qualified: false, host_oracle_unit_tests: "separate CI gate",
    orders: historical.observations.map((item: Record<string, unknown>) => ({
      source: item.source_semantic, pending: item.pending_identity,
      canonical: item.canonical_identity, schedule: item.schedule_identity, bytes: item.canonical_bytes,
    })),
    debugger_sessions: orders.map((order) => {
      const responses = readHistorical(order + "-debug.responses.jsonl").toString("utf8").trimEnd()
        .split("\n").map((line) => JSON.parse(line));
      const finalMemory = responses.filter((item) => item.operation === "read_memory").at(-1);
      return {
        order, commands: responses.length, complete: true,
        configuration_identity: responses[0].session.configuration_identity,
        measured_output_allocation: finalMemory.result.memory.allocation,
      };
    }),
  };
  const measured = readMixedTileCpuSummary(JSON.stringify(fixture));
  expect(measured.debuggerSessions).toBe(fixture.debugger_sessions.length);
  expect(measured.sessions.map((item) => item.commands))
    .toEqual(fixture.debugger_sessions.map((item) => item.commands));
  expect(measured.sessions.map((item) => item.allocation))
    .toEqual(fixture.debugger_sessions.map((item) => item.measured_output_allocation));
  for (const malformed of [
    { ...fixture, schema: "unknown" },
    { ...fixture, hardware_observed: true },
    { ...fixture, authority: "authenticated" },
    { ...fixture, full_simt_tile_pair_qualified: true },
    { ...fixture, host_oracle_unit_tests: 6 },
    { ...fixture, source_manifest: "" },
    { ...fixture, simulations: 1.5 },
    { ...fixture, negative_controls: undefined },
    { ...fixture, orders: [] },
    { ...fixture, debugger_sessions: 2 },
    { ...fixture, debugger_sessions: [fixture.debugger_sessions[0], fixture.debugger_sessions[0]] },
    { ...fixture, debugger_sessions: [
      { ...fixture.debugger_sessions[0], commands: undefined }, fixture.debugger_sessions[1],
    ] },
    { ...fixture, debugger_sessions: [
      { ...fixture.debugger_sessions[0], complete: false }, fixture.debugger_sessions[1],
    ] },
    { ...fixture, debugger_sessions: [
      { ...fixture.debugger_sessions[0], measured_output_allocation: { ordinal: -1, generation: 0 } },
      fixture.debugger_sessions[1],
    ] },
  ]) expect(() => readMixedTileCpuSummary(JSON.stringify(malformed))).toThrow();
});

it("associates debugger records by exact IDs and operations and rejects ambiguous transcripts", () => {
  const requests = [
    { schema: "fe2o3-debug-request-v1", request_id: 7, operation: "step" },
    { schema: "fe2o3-debug-request-v1", request_id: "7", operation: "inspect_values" },
  ];
  const responses = [...requests].reverse().map((item) => ({ ...item, schema: "fe2o3-debug-response-v1" }));
  const jsonl = (items: unknown[]) => items.map((item) => JSON.stringify(item)).join("\n") + "\n";
  expect(associateDebuggerRecords(jsonl(requests), jsonl(responses))).toEqual([
    { requestId: 7, operation: "step", requestIndex: 0, responseIndex: 1 },
    { requestId: "7", operation: "inspect_values", requestIndex: 1, responseIndex: 0 },
  ]);
  for (const [invalidRequests, invalidResponses] of [
    [[], responses], [requests, responses.slice(1)],
    [[requests[0], requests[0]], responses],
    [requests, [responses[0], responses[0]]],
    [requests, [responses[0], { ...responses[1], request_id: 9 }]],
    [requests, [responses[0], { ...responses[1], request_id: undefined }]],
    [requests, [responses[0], { ...responses[1], request_id: 0.5 }]],
    [requests, [responses[0], { ...responses[1], operation: "continue" }]],
    [requests, [responses[0], { ...responses[1], schema: "unknown" }]],
  ]) expect(() => associateDebuggerRecords(jsonl(invalidRequests), jsonl(invalidResponses))).toThrow();
});

it("selects captured workflow inputs through hashed logical roles without assuming a case filename", () => {
  const helper = fileURLToPath(new URL(historicalDirectory + "capture-files.py", import.meta.url));
  const historical = fileURLToPath(new URL(historicalDirectory, import.meta.url));
  const fresh = fileURLToPath(new URL(directory, import.meta.url));
  const temporary = mkdtempSync(join(tmpdir(), "mixed-tile-capture-"));
  const receiptPath = join(temporary, "receipt.json");
  const select = (root: string, receipt: boolean | string = false, head: string = evidence.compilerRef) => spawnSync("python3", [
    "-I", "-B", helper, root, "blocked", head,
    ...(receipt ? ["--receipt", typeof receipt === "string" ? receipt : receiptPath] : []),
  ], { encoding: "utf8", timeout: 10_000 });
  try {
    const old = select(historical, false, historicalHead);
    expect(old.status).toBe(0);
    expect(old.stdout.trimEnd().split("\n")).toEqual([
      join(historical, "blocked-case-debug.request.json"), join(historical, "blocked-case-debug.result.json"),
    ]);
    const actual = select(fresh, join(fresh, capture.collector.path));
    expect(actual.status).toBe(0);
    expect(actual.stdout.trimEnd().split("\n")).toEqual([
      join(fresh, mapped("blocked", "request")), join(fresh, mapped("blocked", "result")),
    ]);
    const gitFixture = (head: string, dirty: boolean) =>
      "#!/bin/sh\ncase \"$1\" in\nrev-parse) printf '%s\\n' '" + head
      + "' ;;\ndiff) exit " + (dirty ? "1" : "0") + " ;;\n*) exit 2 ;;\nesac\n";
    writeFileSync(join(temporary, "git"), gitFixture("1".repeat(40), false), { mode: 0o755 });
    writeFileSync(join(temporary, "cargo"), "#!/bin/sh\necho 'unexpected cargo invocation' >&2\nexit 99\n", { mode: 0o755 });
    const target = join(temporary, "must-not-build");
    const preflight = spawnSync("bash", [join(historical, "workflow.sh")], {
      cwd: temporary, encoding: "utf8", timeout: 10_000,
      env: { ...process.env, PATH: temporary + ":" + process.env.PATH,
        TUTORIALS: process.cwd(), CARGO_TARGET_DIR: target,
        MIXED_TILE_CAPTURE_DIR: fresh, MIXED_TILE_CAPTURE_RECEIPT: join(fresh, capture.collector.path) },
    });
    expect(preflight.status).not.toBe(0);
    expect(preflight.stderr).toContain("collector compiler revision differs");
    expect(preflight.stderr).not.toContain("unexpected cargo invocation");
    expect(existsSync(target)).toBe(false);
    writeFileSync(join(temporary, "git"), gitFixture(evidence.compilerRef, true), { mode: 0o755 });
    const dirty = spawnSync("bash", [join(historical, "workflow.sh")], {
      cwd: temporary, encoding: "utf8", timeout: 10_000,
      env: { ...process.env, PATH: temporary + ":" + process.env.PATH,
        TUTORIALS: process.cwd(), CARGO_TARGET_DIR: target,
        MIXED_TILE_CAPTURE_DIR: fresh, MIXED_TILE_CAPTURE_RECEIPT: join(fresh, capture.collector.path) },
    });
    expect(dirty.status).not.toBe(0);
    expect(dirty.stderr).toContain("tracked compiler sources differ from HEAD");
    expect(dirty.stderr).not.toContain("unexpected cargo invocation");
    expect(existsSync(target)).toBe(false);
    // Synthetic format fixture only; these bytes retain their historical origin.
    const summary = {
      schema: "fe2o3-scoped-tile-cli-test-v1", authority: "observation_only",
      hardware_observed: false, performance_prediction: false, fixture_source_injection: false,
      full_simt_tile_pair_qualified: false, debugger_sessions: orders.map((order) => ({
        order, complete: true, commands: readHistorical(order + "-debug.requests.jsonl").toString("utf8").trimEnd().split("\n").length,
      })),
    };
    writeFileSync(join(temporary, "summary.json"), JSON.stringify(summary));
    const files = Object.fromEntries(["request", "result"].map((role) => {
      const data = readHistorical("blocked-case-debug." + role + ".json");
      const path = role === "request" ? "chosen-input.json" : "oracle-output.json";
      writeFileSync(join(temporary, path), data);
      return [role, { path, bytes: data.length, sha256: sha(data) }];
    }));
    const receipt = {
      schema: "fe2o3-task-ordinary-cpu-cli-archive-v1", authority: "none",
      sourceMeasurementBeforeCollection: { head: evidence.compilerRef },
      sourceMeasurementAfterCollection: { head: evidence.compilerRef },
      actualStage: { exit: 0 }, summary, archiveRoster: Object.values(files),
      debuggerEvidence: orders.map((order) => ({
        order, selection: { sourceHead: evidence.compilerRef, kind: "frozen-production-test-case-ordinal" }, files,
      })),
    };
    writeFileSync(receiptPath, JSON.stringify(receipt));
    expect(select(temporary).status).not.toBe(0);
    const selected = select(temporary, true);
    expect(selected.status).toBe(0);
    expect(selected.stdout.trimEnd().split("\n")).toEqual([
      join(temporary, "chosen-input.json"), join(temporary, "oracle-output.json"),
    ]);
    expect(select(temporary, true, "1".repeat(40)).status).not.toBe(0);
    for (const malformed of [
      { ...receipt, actualStage: { exit: 1 } },
      { ...receipt, authority: "authenticated" },
      { ...receipt, archiveRoster: [] },
      { ...receipt, debuggerEvidence: [receipt.debuggerEvidence[0], receipt.debuggerEvidence[0]] },
      { ...receipt, summary: { ...summary, hardware_observed: true } },
    ]) {
      writeFileSync(receiptPath, JSON.stringify(malformed));
      expect(select(temporary, true).status).not.toBe(0);
    }
    for (const path of ["../escape.json", files.result.path]) {
      const changed = { ...files, request: { ...files.request, path } };
      writeFileSync(receiptPath, JSON.stringify({
        ...receipt, archiveRoster: Object.values(changed),
        debuggerEvidence: receipt.debuggerEvidence.map((item) => ({ ...item, files: changed })),
      }));
      expect(select(temporary, true).status).not.toBe(0);
    }
    writeFileSync(receiptPath, JSON.stringify(receipt));
    writeFileSync(join(temporary, "chosen-input.json"), "{}");
    expect(select(temporary, true).stderr).toContain("mapped capture hash differs");
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

it("runs the fixed-input result checker and refuses changed output or false authority", () => {
  const path = (name: string) => fileURLToPath(new URL(directory + name, import.meta.url));
  const temporary = mkdtempSync(join(tmpdir(), "mixed-tile-result-"));
  const check = (result: string) => spawnSync("python3", [
    fileURLToPath(new URL(historicalDirectory + "verify-result.py", import.meta.url)),
    path(mapped("blocked", "inventory")), path(mapped("blocked", "request")), result,
    path(mapped("blocked", "request")), path(mapped("blocked", "result")),
  ], { encoding: "utf8", timeout: 10_000 });
  try {
    expect(check(path(mapped("blocked", "result"))).status).toBe(0);
    const changed = document(mapped("blocked", "result"));
    changed.shared_buffers[1].buffer.bytes = "0x00";
    const changedPath = join(temporary, "changed.json");
    writeFileSync(changedPath, JSON.stringify(changed));
    const rejected = check(changedPath);
    expect(rejected.status).not.toBe(0);
    expect(rejected.stderr).toContain("exact input/output bytes and initialization");
    const falseAuthority = document(mapped("blocked", "result"));
    falseAuthority.hardware_observed = true;
    writeFileSync(changedPath, JSON.stringify(falseAuthority));
    expect(check(changedPath).stderr).toContain("hardware_observed");
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

it("preserves historical captures under their original compiler identity", () => {
  const raw = readHistorical("summary.json").toString("utf8");
  expect(sha(raw)).toBe("a24a67fa0fbfda70909a0747c086668bee131885f34e3026830f45d06c4bc738");
  const old = JSON.parse(raw);
  expect(old.source_head).toBe(historicalHead);
  expect(old.source_head).not.toBe(evidence.compilerRef);
  expect(readMixedTileCpuSummary(raw).schema).toBe("fe2o3-v18-public-example-cli-smoke-v1");
  expect(sha(readHistorical("blocked-debug.responses.jsonl")))
    .toBe("624936067e9cab1d522542b3c636bb73e6070c243299eaaaec45e611832b9b24");
  expect(sha(readHistorical("striped-debug.responses.jsonl")))
    .toBe("50d54fda2a67962cb76e2b632b8895e5e95005cd227741045b983da76e367a7f");
  for (const observation of old.observations) {
    expect(sha(readHistorical(observation.order + ".kir"))).toBe(observation.raw_sha256);
    expect(sha(readHistorical(observation.order + ".inventory.json"))).toBe(observation.inventory_sha256);
  }
});
