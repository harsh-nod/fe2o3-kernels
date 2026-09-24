import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import gate from "../docs/evidence/complete-body-source-v19-20260924/public-command-receipt.json";
import one from "../docs/evidence/complete-body-source-v19-20260924/public-source-one.json";
import diamond from "../docs/evidence/complete-body-source-v19-20260924/public-source-diamond.json";
import wrongLaunch from "../docs/evidence/complete-body-source-v19-20260924/public-source-wrong-launch.json";
import reserved from "../docs/evidence/complete-body-source-v19-20260924/public-source-reserved-register.json";
import foreign from "../docs/evidence/complete-body-source-v19-20260924/public-source-foreign-input.json";
import undefinedMerge from "../docs/evidence/complete-body-source-v19-20260924/public-source-undefined-merge.json";
import dynamic from "../docs/evidence/complete-body-source-v19-20260924/public-source-dynamic-grid.json";
import debugOne from "../docs/evidence/complete-body-source-v19-20260924/public-debug-one.json";
import debugDiamond from "../docs/evidence/complete-body-source-v19-20260924/public-debug-diamond.json";

const evidenceRoot = "docs/evidence/complete-body-source-v19-20260924/";

describe("retained complete-body V19 public-command qualification", () => {
  it("pins the exact public supervisor and all nine script receipts", () => {
    for (const [name, size, sha256] of [
  [
    "public-command-receipt.json",
    28269,
    "7f371f02546baf4bceabd5a6e967f226cc06c9f098a861e482b23c7e715a49fc"
  ],
  [
    "public-source-one.json",
    4386,
    "f2c95657e5fe236b8a6f6d707601903c1e42cb34865c5d59b86b34aec53fdcdc"
  ],
  [
    "public-source-diamond.json",
    4414,
    "83918bdf55d7011574d1f212406c7a165342881ab8b9f1f7a8a01c605a3ca890"
  ],
  [
    "public-source-wrong-launch.json",
    4031,
    "040c7d889f222cd29293152dd5db67814c18e8ba49b299b94a0f3093da631971"
  ],
  [
    "public-source-reserved-register.json",
    4100,
    "40f441b36edfa853fd5441ae92c4566b9331d5a32688db239593630f303c1897"
  ],
  [
    "public-source-foreign-input.json",
    4070,
    "eb257309b97eec4adbd482d742f04e58eae2a856184a96306c865037514420f0"
  ],
  [
    "public-source-undefined-merge.json",
    4058,
    "a192fbb111ed5830b1ff9fbf7691e75db64753dd1ee255444daf0e37108514d9"
  ],
  [
    "public-source-dynamic-grid.json",
    4045,
    "22ecef16ef747409884d37acd152cf13ba01aecb26b5702cd1689621d5e3fef0"
  ],
  [
    "public-debug-one.json",
    13010,
    "68e5d4048077b0a54dda498a0c767cb28682a307dfc25658c30caf37a2043ae3"
  ],
  [
    "public-debug-diamond.json",
    13114,
    "34b90de169998146cd2ddba3d25de8a29752118f4f4456958d99f3276db76064"
  ]
] as const) {
      const bytes = readFileSync(resolve(evidenceRoot, name));
      expect(bytes.length).toBe(size);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(sha256);
    }
    expect(gate.status).toBe("command-passed");
    expect(gate.command.code).toBe(0);
    expect(gate.command.signal).toBeNull();
    expect(gate.errors).toEqual([]);
    expect(gate.source_before).toEqual(gate.source_after);
    expect(gate.source_before.sha256).toBe("217a30aed5f579381a9461007bf1f6cf729ab146cab7918f27538e01d245fee2");
  });

  it("retains two positive normal LLVM/handoff relations without claiming native completion", () => {
    for (const [report, canonicalSha] of [
      [one, "3e4583f53812fb02b101151d37d2155771173423ac3a684bbd9720a70f6ec11b"],
      [diamond, "4630b87ddbf23c44a7fb07b7f9cd554f7bf7703c8f1332abf467244386fc6c3e"],
    ] as const) {
      expect(report.observations.map(row => row.stage)).toEqual(["llvm", "handoff"]);
      expect(report.observations.map(row => row.status)).toEqual([0, 0]);
      expect(report.observations[0].output.sha256).toBe(canonicalSha);
      expect(report.observations[1].same_executable_llvm_text).toBe(true);
      expect(report.exact_canonical_handoff_decode).toBe("covered separately by Rust qualification ladder");
      expect(report.cpu_simulation_run).toBe(false);
      expect(report.actual_cargo_rustc_wrapper).toBe(true);
    }
  });

  it("requires ten exact public-source refusals, not generic nonzero exits", () => {
    for (const [report, text] of [
      [wrongLaunch, "complete body requires required and maximum 64x1x1"],
      [reserved, "complete body roles require distinct v8..v63 outside the reserved prefix"],
      [foreign, "complete body marker operands differ from exact root argument order"],
      [undefinedMerge, "OutputNotDefined { label: Gfx942CompleteBodyLabelV1(4) }"],
      [dynamic, "complete-body source requires an explicit finite max_grid"],
    ] as const) {
      expect(report.observations.map(row => row.stage)).toEqual(["llvm", "handoff"]);
      for (const row of report.observations) {
        expect(row.status).toBe(101);
        expect(row.signal).toBeNull();
        expect(row.exact_source_refusal).toBe(text);
        expect(row).not.toHaveProperty("output");
      }
    }
  });

  it("records all six actual CPU and logical forward/reverse debugger cases", () => {
    for (const [report, values, length, sha, identity] of [
      [debugOne, [19, 19, 19], 1019, "1bf48d77302689bf514f4236ede0a408cc1bfbd5be9cc2ab7fc1c8458af02965", "a48249183fbf8640c9620f585d2a06fbbb32def237d17daf356266182e969f4a"],
      [debugDiamond, [19, 23, 23], 1185, "b1104bbb9496044a10776fed27c00d34354a7ff41291ed7a2c5d1bdcfcdc160a", "5dab25afa17fac130c865f6d9a9cac292c37c0168fd8e498c41c8be1cb33d36d"],
    ] as const) {
      expect(report.requests.map(row => row.selector)).toEqual([0, 1, 4294967295]);
      expect(report.requests.map(row => row.expectedValue)).toEqual(values);
      expect(report.kir.bytes).toBe(length);
      expect(report.kir.sha256).toBe(sha);
      expect(report.metadata.canonical_identity).toBe(identity);
      expect(report.kir.sha256).not.toBe(report.metadata.canonical_identity);
      for (const row of report.requests) {
        expect(row.initialized_output_and_canaries_match).toBe(true);
        expect(row.logical_forward_reverse_observed).toBe(true);
      }
      for (const row of report.observations) {
        expect(row.status).toBe(0);
        expect(row.signal).toBeNull();
      }
      expect(report.cpu_simulation_run).toBe(true);
      expect(report.logical_debugger_forward_reverse).toBe(true);
      expect(report.raw_canonical_bytes_preserved).toBe(true);
      for (const value of [
        report.physical_register_values, report.source_variable_map,
        report.persisted_schedule, report.runtime_observations, report.diagnosis_v2,
      ]) expect(value).toBe("unavailable");
      expect(report.exported_source_authentication).toBe(false);
      expect(report.exported_compiler_authentication).toBe(false);
    }
  });

  it("preserves source pins while withholding compiler, GPU, viewer and launch authority", () => {
    for (const report of [one, diamond, wrongLaunch, reserved, foreign, undefinedMerge, dynamic, debugOne, debugDiamond]) {
      expect(report.source_unchanged).toBe(true);
      expect(report.compiler_closure_attestation).toBe("unavailable");
      expect(report.sourcePins.find(pin => pin.path.endsWith("/src/complete_body_v19.rs"))?.sha256)
        .toBe("3fb330e7193918e3e587445fdc82fd5d5dd3ca664063fbc9781664a67f2bb26c");
      for (const value of [
        report.hardware_observed, report.native_llvm_executed,
        report.protected_finalizer_admitted, report.grants_artifact_or_launch_authority,
      ]) expect(value).toBe(false);
    }
    expect(gate.production_qualified).toBe(false);
    expect(gate.source_authenticated).toBe(false);
    const note = readFileSync(resolve("docs/complete-body-source-qualification-20260924.md"), "utf8");
    for (const phrase of [
      "seven public source commands", "two public source-debug commands", "six CPU requests",
      "separate invocation", "not interchangeable", "Native functional execution remains unqualified",
      "not a V19 website adapter",
    ]) expect(note).toContain(phrase);
  });
});
