import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import provenance from "../examples/physical-global-copy-debug-v21/provenance.json";
import { PHYSICAL_COPY_RETAINED_V21 } from "../src/content/physical-global-copy-debug-v21-retained";
import { parseProgramJson } from "../src/content/ordered-program-observation.mjs";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const read = (p: string) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
it("pins all six real inner streams without reserializing u64 values", () => {
  expect(provenance.recordings).toHaveLength(6);
  provenance.recordings.forEach((pin, i) => {
    const raw = read(pin.path);
    expect(Buffer.byteLength(raw)).toBe(pin.container.bytes); expect(sha(raw)).toBe(pin.container.sha256);
    expect(PHYSICAL_COPY_RETAINED_V21[i].input.containerUtf8).toBe(raw);
    const e = parseProgramJson(raw, 262144) as Record<string, string>;
    for (const [key, field] of [["requestsUtf8", "requests"], ["responsesUtf8", "responses"], ["simulationRequestUtf8", "simulationRequest"]] as const) {
      expect(Buffer.byteLength(e[key])).toBe(pin[field].bytes); expect(sha(e[key])).toBe(pin[field].sha256);
    }
    expect(e.responsesUtf8).toContain('"active_mask":18446744073709551615');
    expect(e.requestsUtf8.trimEnd().split("\n")).toHaveLength(48);
    const responses = e.responsesUtf8.trimEnd().split("\n").map(s => parseProgramJson(s, 65536) as Record<string, unknown>);
    expect(responses.filter(r => r.status === "error")).toHaveLength(4);
    expect(responses.filter(r => r.status === "unavailable")).toHaveLength(10);
  });
  expect(provenance.source_custody).toBe(false); expect(provenance.hardware_observed).toBe(false);
  expect(provenance.runtime_authority).toBe(false); expect(provenance.protected_authority).toBe(false);
  expect(provenance.resumable_execution).toBe(false);
});
it("keeps the tutorial's measured limits and source/hardware boundaries explicit", () => {
  const doc = read("docs/physical-global-copy-recorded-viewer-v21.md");
  for (const phrase of ["full-EXEC input read", "not a resumable checkpoint", "claimed",
    "not native addresses", "256 KiB", "119,035", "1,072", "48 recorded pairs",
    "Compiler pin and milestone maturity defaults are unchanged", "not a source-authority verifier",
    "live V21 control", "profile premise, not an all-lane", "Every observation containing either parameter root",
    provenance.report.sha256, provenance.gate.sha256]) expect(doc).toContain(phrase);
  expect(Math.max(...provenance.recordings.map(r => r.container.bytes))).toBe(119035);
  expect(read("src/components/SourceIsaAgentPage.tsx")).toContain("Open V21 recorded CPU viewer");
});
