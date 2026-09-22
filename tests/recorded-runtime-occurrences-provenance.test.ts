import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import raw from "./fixtures/recorded-runtime-occurrences.json?raw";
import provenance from "./fixtures/recorded-runtime-occurrences-provenance.json";
import provenanceRaw from "./fixtures/recorded-runtime-occurrences-provenance.json?raw";
import { RUNTIME_OCCURRENCE_REFERENCE } from "../src/content/recorded-runtime-occurrence-reference";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

describe("actual loop/helper capture provenance", () => {
  it("binds the exact retained stdout and source bytes without claiming a signed producer", () => {
    expect(hash(provenanceRaw)).toBe("991af73c87a16f194277ada8bb63af8f24ea025ef708dbb02baf045ea8210abf");
    expect(provenance.schema).toBe("retained-runtime-occurrence-lab-provenance-v1");
    expect(provenance.report).toEqual({
      bytes: 39809, sha256: RUNTIME_OCCURRENCE_REFERENCE.reportSha256,
    });
    expect(new TextEncoder().encode(raw).length).toBe(provenance.report.bytes);
    expect(hash(raw)).toBe(provenance.report.sha256);
    expect(provenance.bundle).toEqual({
      bytes: 38358, sha256: RUNTIME_OCCURRENCE_REFERENCE.bundleSha256,
    });
    expect(new TextEncoder().encode(provenance.source.utf8).length).toBe(718);
    expect(hash(provenance.source.utf8)).toBe("8dde544187f900e690a74bc550bca6c00ce75f48149b867d39f27d9841875725");
    expect(provenance.source.sha256).toBe(hash(provenance.source.utf8));
    expect(provenance.source.utf8).toContain("value = mix(value, salt ^ iteration);");
    expect(provenance.capture.receipt).toEqual({
      bytes: 220199, sha256: "85c967336810e178817fb4ed80419a81b741201ba65cc8d5ea246c642747df10",
    });
    expect(provenance.authority).toEqual({
      sourceAuthenticated: false, compilerResumeAuthority: false, hardwareObserved: false,
      performancePrediction: false, freshToolBuild: false, authenticatedRuntimeClosure: false,
      portableDebuggerSession: false,
    });
  });

  it("retains the actual six cases and separates runtime coordinates from authoring positions", () => {
    const report = JSON.parse(raw);
    expect(report.cases.map((item: { observation: { rows: unknown[] } }) => item.observation.rows.length))
      .toEqual(provenance.observations.rowsPerCase);
    expect(provenance.observations.rowsPerCase.reduce((a, b) => a + b, 0)).toBe(1208);
    expect(provenance.observations.helperActivationsPerCase).toEqual([0, 0, 4, 4, 12, 12]);
    expect(provenance.observations.helperActivationsPerCase.reduce((a, b) => a + b, 0)).toBe(32);
    expect(provenance.observations.contextualRuns).toBe(6);
    expect(provenance.observations.optOutRuns).toBe(6);
    expect(provenance.observations.optOutEquality).toContain("producer_reported_only");
    expect(report.topology.call).toEqual(provenance.observations.runtimeCallCoordinate);
    expect(report.topology.call_authoring_coordinate).toEqual(provenance.observations.authoringCallCoordinate);
    expect(provenance.observations.runtimeCallCoordinate).toEqual([0, 1, 1]);
    expect(provenance.observations.authoringCallCoordinate).toEqual([0, 3, 1]);
  });

  it("records successful bounded capture stages and selected retained tools, not fresh-build closure", () => {
    expect(provenance.capture.kind).toBe("actual_ordinary_rust_cpu_run");
    expect(provenance.capture.runnerCheckoutMeaning).toContain("not a rebuild attestation");
    expect(provenance.capture.stages.map(stage => stage.name)).toEqual([
      "git-head", "git-status", "rustc-version", "cache-before-lock", "lock",
      "cache-before-export", "export", "cache-after-export", "observe",
      "inspect", "operations-0", "cache-after-observer",
    ]);
    for (const stage of provenance.capture.stages) {
      expect(stage.code).toBe(0); expect(stage.signal).toBeNull(); expect(stage.reason).toBeNull();
    }
    expect(provenance.capture.guard.samples).toBe(30);
    expect(provenance.capture.guard.firstFailure).toBeNull();
    expect(provenance.capture.guard.peakChargedBytes).toBe(49641075061);
    expect(provenance.capture.guard.peakChargedBytes).toBeLessThanOrEqual(48 * 1024 ** 3);
    expect(provenance.selectedRetainedTools.map(tool => tool.role)).toEqual([
      "fe2o3-export-sim", "fe2o3-author", "fe2o3-rustc-extract",
      "librustc_codegen_fe2o3.so", "observer", "rustc", "rustc_driver", "cargo", "node",
    ]);
    for (const tool of provenance.selectedRetainedTools) {
      expect(tool.bytes).toBeGreaterThan(0); expect(tool.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
    expect(provenance.sameRunEvidence.sourceCensus.sha256)
      .toBe("a2f9ff448f635219b219d666767ba10ad8221e067788fe4dfd071aeba267861e");
    expect(provenance.sameRunEvidence.operationPage.sha256)
      .toBe("b15dafcb794f485a77aa344a8342bedfc7210b259dc9d7450715f81aac9c544d");
    expect(provenance.limitations.join(" ")).toContain("not source-to-SSA ownership");
    expect(provenance.limitations.join(" ")).toContain("not a signature");
  });
});
