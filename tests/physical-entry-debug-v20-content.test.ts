import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import provenance from "../examples/physical-entry-debug-v20/provenance.json";
const read = (path: string) => readFileSync(new URL("../" + path, import.meta.url));
it("retains unchanged actual request/response pins and narrow report provenance", () => {
  expect(provenance.recordings).toHaveLength(4);
  expect(provenance.compilerPublication.commit).toBe("dbfb61e7186e5fa37dd9d544d85de29c7a1080eb");
  expect(provenance.compilerPublication.repositories).toEqual(["harsh-nod/fe2o3", "powderluv/fe2o3"]);
  expect(provenance.report.sha256).toBe("74f10e8bf82fd91219da6f2453976e9823bce8afdaf44130d3d272d2fe44ed11");
  expect(provenance.sourceAuthentication).toBe(false); expect(provenance.hardwareObserved).toBe(false);
  expect(provenance.replayAuthority).toBe(false);
  for (const row of provenance.recordings) for (const role of ["requests", "responses"] as const) {
    const bytes = read("examples/physical-entry-debug-v20/" + row.name + "." + role + ".jsonl");
    expect(bytes.length).toBe(row[role].bytes);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(row[role].sha256);
    expect(bytes.toString("utf8").trimEnd().split("\n")).toHaveLength(row.name === "one-selector0" ? 103 : 107);
  }
});
it("keeps a distinct lazy route, V19 and live workbench rather than reclassifying them", () => {
  const page = read("src/components/SourceIsaAgentPage.tsx").toString("utf8");
  for (const name of ["./PhysicalEntryDebugV20", "./CompleteBodyDebugV19", "./LiveCpuDebuggerWorkbench"]) expect(page).toContain(name);
  expect(page).toContain("Open V20 recorded CPU viewer");
  const lesson = read("docs/physical-entry-cpu-viewer-v20.md").toString("utf8");
  for (const boundary of ["one output allocation", "not physical EXEC", "not_represented", "uninitialized",
    "caller-supplied and unverified", "no previous recording", "source custody", "256 pairs", "V21 are refused"]) expect(lesson).toContain(boundary);
});
