import tutorialBindingData from "../../config/getting-started-tutorial.json";
import tutorialFixtureData from "../../examples/getting_started_v1/expected-projection.json";
import { deepFreeze } from "./registry";

export const gettingStartedBinding = deepFreeze(tutorialBindingData);
export const gettingStartedFixture = deepFreeze(tutorialFixtureData);

export const gettingStartedCommands = deepFreeze({
  clone: [
    "git clone https://github.com/harsh-nod/fe2o3.git",
    "cd fe2o3",
  ],
  ...tutorialBindingData.commands,
});

export const gettingStartedResult = deepFreeze({
  schema: tutorialFixtureData.expected_result.schema,
  status: tutorialFixtureData.expected_result.status,
  authority: tutorialFixtureData.expected_result.authority,
  simulated: tutorialFixtureData.expected_result.simulated,
  hardware_observed: tutorialFixtureData.expected_result.hardware_observed,
  hardware_validation: tutorialFixtureData.expected_result.hardware_validation,
  performance_prediction: tutorialFixtureData.expected_result.performance_prediction,
  value: tutorialFixtureData.expected_result.output.value,
  littleEndianBytes:
    tutorialFixtureData.expected_result.output.element_little_endian_bytes,
  elements: tutorialFixtureData.expected_result.output.elements,
  liveInvocations:
    tutorialFixtureData.expected_result.counts.invocations_executed,
  workgroups: tutorialFixtureData.expected_result.counts.workgroups_visited,
  scheduledSlots:
    tutorialFixtureData.expected_result.counts.scheduled_slots_visited,
});

export const gettingStartedHierarchy = deepFreeze([
  {
    level: "Dispatch",
    identity: tutorialFixtureData.debugger_projection.dispatch,
    detail: `grid [${tutorialFixtureData.request.grid.join(", ")}]`,
    state: "simulated",
  },
  {
    level: "Workgroup",
    identity: `group [${tutorialFixtureData.debugger_projection.workgroup.join(", ")}]`,
    detail: `${tutorialFixtureData.expected_result.counts.scheduled_slots_visited} scheduled slots, ${tutorialFixtureData.expected_result.counts.invocations_executed} live invocations`,
    state: "complete",
  },
  {
    level: "Logical wave",
    identity: `wave ${tutorialFixtureData.debugger_projection.logical_wave.ordinal}`,
    detail: `semantic Wave${tutorialFixtureData.debugger_projection.logical_wave.width} partition`,
    state: "logical only",
  },
]);

export const gettingStartedTimeline = deepFreeze([
  {
    operation: "thread::index_1d()",
    source: tutorialFixtureData.source.path,
    state: "SSA index",
  },
  {
    operation: "out.get_mut(idx)",
    source: "bounds admission",
    state: `active items 0..${tutorialFixtureData.expected_result.counts.invocations_executed - 1} in bounds`,
  },
  {
    operation: "*value = 42.5",
    source: "allocation-relative store",
    state: `${tutorialFixtureData.expected_result.counts.invocations_executed} writes expected`,
  },
]);

export const gettingStartedBoundaries = deepFreeze(tutorialFixtureData.non_claims);

export const gettingStartedDifferentiators = deepFreeze([
  {
    surface: "Hierarchy",
    fe2o3: "Dispatch, workgroup, logical wave, and work-item identities remain linked.",
    platform: "Machine debuggers expose hardware stops and registers when a GPU is available.",
  },
  {
    surface: "Program meaning",
    fe2o3: "Source, KIR operation, SSA value, and allocation-relative memory share one semantic record.",
    platform: "Profilers specialize in timing, counters, samples, and thread trace.",
  },
  {
    surface: "Replay",
    fe2o3: "A canonical schedule can be retained, replayed, and stepped backward on the CPU.",
    platform: "Live tools observe a machine execution and remain the authority for physical GPU state.",
  },
  {
    surface: "Automation",
    fe2o3: "Versioned JSONL queries return typed availability and immutable session revisions.",
    platform: "CLI and MI automation are useful, but do not carry fe2o3 compiler semantics by themselves.",
  },
]);

function hasExactKeys(
  value: object,
  expected: readonly string[],
): boolean {
  const observed = Object.keys(value).sort();
  return observed.length === expected.length &&
    observed.every((key, index) => key === expected[index]);
}

export function validateGettingStartedTutorial(): string[] {
  const issues: string[] = [];
  if (
    !hasExactKeys(gettingStartedBinding, [
      "cargoChildEnvironment",
      "commands",
      "compilerCommitAuthority",
      "compilerSourceBindings",
      "fixture",
      "reviewedOn",
      "schema",
    ]) ||
    gettingStartedBinding.schema !==
      "fe2o3-getting-started-tutorial-binding-v1" ||
    gettingStartedBinding.reviewedOn !== "2026-09-01" ||
    gettingStartedBinding.compilerCommitAuthority !==
      "config/publication-gate.json#requiredCommit"
  ) {
    issues.push("the tutorial evidence binding is malformed");
  }
  if (
    !hasExactKeys(gettingStartedBinding.cargoChildEnvironment, [
      "FE2O3_HIP_SYS_DISABLE",
      "FE2O3_HSA_RUNTIME_DISABLE",
    ]) ||
    gettingStartedBinding.cargoChildEnvironment.FE2O3_HIP_SYS_DISABLE !== "1" ||
    gettingStartedBinding.cargoChildEnvironment.FE2O3_HSA_RUNTIME_DISABLE !== "1"
  ) {
    issues.push("the KFD-first Cargo child environment changed");
  }
  if (
    !hasExactKeys(gettingStartedBinding.fixture, ["path", "sha256"]) ||
    gettingStartedBinding.fixture.path !==
      "examples/getting_started_v1/expected-projection.json" ||
    !/^[0-9a-f]{64}$/u.test(gettingStartedBinding.fixture.sha256) ||
    gettingStartedFixture.schema !==
      "fe2o3-getting-started-validation-projection-v1" ||
    gettingStartedFixture.fixture_kind !==
      "expected_projection_not_execution_capture"
  ) {
    issues.push("the tutorial validation projection is malformed");
  }
  const requiredCompilerSources = new Set([
    "scripts/quickstart.sh",
    "scripts/tests/quickstart.sh",
    "scripts/quickstart/fill-request.json",
    "examples/fill/src/lib.rs",
    "crates/cargo-fe2o3/src/doctor.rs",
    "crates/fe2o3-debug-cli/README.md",
  ]);
  if (
    gettingStartedBinding.compilerSourceBindings.length !==
      requiredCompilerSources.size ||
    gettingStartedBinding.compilerSourceBindings.some(
      (binding) =>
        !hasExactKeys(binding, ["path", "sha256"]) ||
        !requiredCompilerSources.delete(binding.path) ||
        !/^[0-9a-f]{64}$/u.test(binding.sha256) ||
        binding.path.startsWith("/") ||
        binding.path.includes("\\") ||
        binding.path !== binding.path.trim() ||
        binding.path.split("/").includes(".."),
    ) ||
    requiredCompilerSources.size !== 0
  ) {
    issues.push("the compiler launch source bindings are incomplete");
  }
  if (gettingStartedCommands.noGpu !== "bash scripts/quickstart.sh no-gpu") {
    issues.push("the primary no-GPU command changed");
  }
  if (
    gettingStartedResult.authority !== "observation_only" ||
    gettingStartedResult.simulated !== true ||
    gettingStartedResult.hardware_observed !== false ||
    gettingStartedResult.hardware_validation !== false ||
    gettingStartedResult.performance_prediction !== false
  ) {
    issues.push("the simulation authority boundary changed");
  }
  if (
    gettingStartedResult.value !== "42.5f32" ||
    gettingStartedResult.littleEndianBytes !== "00002a42" ||
    gettingStartedResult.elements !== 4 ||
    gettingStartedResult.liveInvocations !== 4 ||
    gettingStartedResult.scheduledSlots !== 64
  ) {
    issues.push("the fill result contract changed");
  }
  if (
    gettingStartedFixture.debugger_projection.provenance !==
      "compiler_bundle_bound" ||
    gettingStartedFixture.debugger_projection.logical_wave.active_mask !==
      "0x000000000000000f" ||
    gettingStartedFixture.debugger_projection.selected_memory.offset !== 8 ||
    gettingStartedFixture.debugger_projection.selected_memory.bytes !==
      "0x00002a42"
  ) {
    issues.push("the debugger validation projection changed");
  }
  if (
    !hasExactKeys(gettingStartedBinding.commands, [
      "doctor",
      "gfx942Preflight",
      "noGpu",
    ]) ||
    gettingStartedCommands.doctor !== "bash scripts/quickstart.sh doctor" ||
    gettingStartedCommands.gfx942Preflight !==
      "bash scripts/quickstart.sh gfx942-preflight"
  ) {
    issues.push("the KFD diagnostic command surface changed");
  }
  if (
    gettingStartedBoundaries.length !== 4 ||
    !gettingStartedBoundaries.some((boundary) =>
      boundary.includes("performance prediction"),
    )
  ) {
    issues.push("the non-claims are incomplete");
  }
  return issues;
}
