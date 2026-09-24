import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import provenance from "../examples/complete-body-debug-v19/provenance.json";

it("keeps every retained public stream byte-exact and scopes it to entry/event/restore", () => {
  expect(provenance.kind).toBe("retained_public_diagnostic");
  expect(provenance.source_authenticated).toBe(false);
  expect(provenance.hardware_observed).toBe(false);
  expect(provenance.full_program_stepping_qualified).toBe(false);
  expect(provenance.scope).toBe("entry / first logical event / reverse-restored entry only");
  expect(provenance.pins).toHaveLength(9);
  for (const pin of provenance.pins) {
    const bytes = readFileSync(resolve("examples/complete-body-debug-v19", pin.file));
    expect(bytes.length).toBe(pin.bytes);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(pin.sha256);
  }
});
it("documents explicit selection, optional untrusted metadata and the unchanged legacy boundary", () => {
  const doc = readFileSync(resolve("docs/complete-body-cpu-viewer-v19.md"), "utf8");
  for (const phrase of ["--diagnostic-kir-v19", "exact five-operation pattern", "No second interpreter",
    "requires_authenticated_map", "not a full CFG", "is optional", "caller-supplied / unverified",
    "No raw KIR file", "V3/V5 completion", "entry/one-event/restore", "Physical registers"]) {
    expect(doc).toContain(phrase);
  }
  const page = readFileSync(resolve("src/components/SourceIsaAgentPage.tsx"), "utf8");
  expect(page.match(/const RecordedCompleteBodyV19 = lazy/gu)).toHaveLength(1);
  expect(page.match(/<RecordedCompleteBodyV19 \/>/gu)).toHaveLength(1);
});
