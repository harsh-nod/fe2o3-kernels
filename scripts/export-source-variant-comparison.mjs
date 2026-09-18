#!/usr/bin/env node
// Retain existing source-smoke bytes for an observation-only browser example.
// Reads fixed capture filenames; stdout only. Never compiles or edits source.
import { createHash } from "node:crypto";
import { closeSync, fstatSync, openSync, readSync } from "node:fs";
import { basename, join, resolve } from "node:path";

if (process.argv.length !== 4 || !/^[0-9a-f]{64}$/u.test(process.argv[3])) {
  throw new Error("usage: node scripts/export-source-variant-comparison.mjs CAPTURE_DIRECTORY EXPECTED_RECEIPT_SHA256");
}
const directory = resolve(process.argv[2]);
let total = 0;
function artifact(relative) {
  const fd = openSync(join(directory, relative), "r");
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.size > 65536) throw new Error(`unbounded capture: ${relative}`);
    const storage = Buffer.alloc(65537);
    let length = 0;
    while (length < storage.length) {
      const next = readSync(fd, storage, length, storage.length - length, null);
      if (next === 0) break;
      length += next;
    }
    const bytes = storage.subarray(0, length);
    total += bytes.length;
    if (bytes.length !== stat.size || total > 524288) throw new Error("capture bounds changed");
    const utf8 = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { sha256: createHash("sha256").update(bytes).digest("hex"), utf8 };
  } finally { closeSync(fd); }
}
const receipt = artifact("receipt.json");
if (receipt.sha256 !== process.argv[3]) throw new Error("receipt identity mismatch");
const observed = JSON.parse(receipt.utf8);
if (observed.schema !== "fe2o3-ordinary-bitwise-promotion-smoke-v1" ||
    observed.hardware_observed !== false || observed.production_qualification !== false ||
    observed.final_machine_inspection !== "not_exercised") throw new Error("unsupported capture boundary");
const evidence = {
  schema: "fe2o3-source-variant-comparison-example-v1",
  provenance: {
    capture_name: basename(directory),
    capture_kind: "retained_actual_source_export_and_cpu_case",
    compiler_build: "work_in_progress",
    compiler_commit: null,
    qualified_release_pin: null,
    producer_authenticated: false,
    script: "scripts/ordinary-bitwise-promotion-smoke.mjs",
  },
  receipt,
  materialization: artifact("generated-helper.json"),
  variants: ["ordinary", "no-edit", "edited-instruction"].map((id) => ({
    id,
    source: artifact(id === "ordinary" ? "original-source.rs" : `${id}-source/src/lib.rs`),
    snapshot: artifact(`${id}-inspect.stdout`),
    operations: artifact(`${id}-operations-0.stdout`),
    simulation: artifact(`${id}-simulation.stdout`),
    change: id === "ordinary" ? null : artifact(`${id}-source-change.json`),
  })),
};
process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
