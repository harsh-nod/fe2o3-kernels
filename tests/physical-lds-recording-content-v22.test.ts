import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { expect, it } from "vitest";
import { LDS_COMPILER_COMMIT, LDS_RECORDINGS, LDS_RECORDING_EVIDENCE } from "../src/content/physical-lds-debug-v22-recordings";
const text = (path: string) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
it.each(LDS_RECORDINGS)("pins unchanged retained R3 assets: $id", pin => {
  for (const asset of [pin.index, pin.document, pin.requests, pin.responses]) {
    const raw = readFileSync(new URL("../public" + asset.path, import.meta.url));
    expect(raw.length).toBe(asset.bytes); expect(createHash("sha256").update(raw).digest("hex")).toBe(asset.sha256);
  }
  const expanded = gunzipSync(readFileSync(new URL("../public" + pin.index.path, import.meta.url)), { maxOutputLength: 8388608 });
  expect(expanded.length).toBe(pin.index.raw.bytes); expect(createHash("sha256").update(expanded).digest("hex")).toBe(pin.index.raw.sha256);
  expect(pin.canonicalFile.sha256).not.toBe(pin.canonicalIdentity);
});
it("keeps additive route and explicit evidence limits", () => {
  const app = text("src/App.tsx"), page = text("src/components/SourceIsaAgentPage.tsx"), doc = text("docs/physical-lds-recorded-debug-v22.md");
  expect(app).toContain('path="/debugger/lds-cpu-recording-v22"');
  expect(page).toContain('#/debugger/lds-cpu-recording-v22');
  for (const phrase of ["phase0", "epoch1", "sourceR7-derived", "NotRepresented", "source custody", "1MiB compressed", "8MiB expanded", "whole-family cleanup", "no live V22 bridge"]) {
    expect(doc.toLowerCase()).toContain(phrase.toLowerCase());
  }
  expect(doc).toContain("fe2o3-debug sim --diagnostic-kir-v22");
  expect(LDS_RECORDING_EVIDENCE.hardwareObserved).toBe(false); expect(LDS_RECORDING_EVIDENCE.sourceCustody).toBe(false);
  if (LDS_COMPILER_COMMIT !== null) expect(LDS_COMPILER_COMMIT).toMatch(/^[0-9a-f]{40}$/);
});
