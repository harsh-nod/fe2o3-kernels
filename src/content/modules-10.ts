import advancedAttentionSource from "../../examples/gfx950_advanced_attention/gfx950_advanced_attention.hip?raw";
import advancedAttentionRustKernel from "../../examples/gfx950_advanced_attention/src/kernel.rs?raw";
import advancedAttentionRustReference from "../../examples/gfx950_advanced_attention/src/reference.rs?raw";
import advancedAttentionRustContract from "../../examples/gfx950_advanced_attention/src/lib.rs?raw";
import advancedAttentionBuild from "../../examples/gfx950_advanced_attention/build_and_test.sh?raw";
import advancedAttentionIsa from "../../examples/gfx950_advanced_attention/check_isa.sh?raw";
import advancedSystemsSource from "../../examples/gfx950_advanced_systems/gfx950_advanced_systems.hip?raw";
import advancedSystemsRustKernel from "../../examples/gfx950_advanced_systems/src/kernel.rs?raw";
import advancedSystemsRustReference from "../../examples/gfx950_advanced_systems/src/reference.rs?raw";
import advancedSystemsRustContract from "../../examples/gfx950_advanced_systems/src/lib.rs?raw";
import advancedSystemsBuild from "../../examples/gfx950_advanced_systems/build_and_test.sh?raw";
import advancedSystemsIsa from "../../examples/gfx950_advanced_systems/check_isa.sh?raw";
import {
  advancedEvidenceFor,
  advancedHarnessPath,
  advancedProductionTarget,
  isObservedAdvancedEvidence,
  type AdvancedRustEvidence,
  type ObservedAdvancedRustEvidence,
} from "./gfx950-advanced-evidence";
import { advancedPerformanceTabFor } from "./gfx950-advanced-performance";
import { narrativeSection } from "./narrative-registry";
import { resultText } from "./shared";
import {
  historicalReference,
  type Claim,
  type CodeTab,
  type CurriculumModule,
  type DiagramKind,
  type Lesson,
} from "./model";
import type { NarrativeId } from "./narrative-policy";

type BundleId = "attention" | "systems";

interface SourceBundle {
  rustKernel: string;
  rustReference: string;
  rustContract: string;
  rustKernelPath: string;
  rustReferencePath: string;
  rustContractPath: string;
  rustReadmePath: string;
  rustLockPath: string;
  rustKernelFileSha256: string;
  rustReferenceFileSha256: string;
  loweringConstant: string;
  manifestPath: string;
  productionSupportPaths: string[];
  hipSource: string;
  hipSourcePath: string;
  build: string;
  isa: string;
  hipSourceSha256: string;
  hipHsacoSha256: string;
  compiler: string;
  runtime: string;
  inputPolicy: string;
}

export const advancedCoreSourceCommit = "63c5a5988b00b02bef07bdddcfa79039b1b0554e";
export const advancedCoreSourceTree: string | null =
  "771c00636db1437809fd7e6dec0de2d88bf6e0ff";

const attentionBundle: SourceBundle = {
  rustKernel: advancedAttentionRustKernel,
  rustReference: advancedAttentionRustReference,
  rustContract: advancedAttentionRustContract,
  rustKernelPath: "examples/gfx950_advanced_attention/src/kernel.rs",
  rustReferencePath: "examples/gfx950_advanced_attention/src/reference.rs",
  rustContractPath: "examples/gfx950_advanced_attention/src/lib.rs",
  rustReadmePath: "examples/gfx950_advanced_attention/README.md",
  rustLockPath: "examples/gfx950_advanced_attention/Cargo.lock",
  rustKernelFileSha256: "3b0f6962ce41da008542fa7685633ab7f4bcabf5540af35b3c327c7802a77faa",
  rustReferenceFileSha256: "36b12a88115884fb52c175da0372e2a1197d05ad8b790992c05cf7a671246af9",
  loweringConstant: "GFX950_ADVANCED_ATTENTION_SOURCE_LOWERING_SUPPORTED_V1",
  manifestPath: "examples/gfx950_advanced_attention/Cargo.toml",
  productionSupportPaths: [
    "examples/gfx950_advanced_attention/run-gfx950.sh",
    "examples/gfx950_advanced_attention/gfx950-extractor-runtime.sh",
    "examples/gfx950_advanced_attention/test-extractor-runtime.sh",
    "examples/gfx950_advanced_attention/tests/kernel_source.rs",
    "examples/gfx950_advanced_attention/tests/reference.rs",
    "examples/gfx950_low_precision/gfx950-ocml-closure.sh",
    "examples/gfx950_low_precision/gfx950-ocml-rocm-7.2.1.manifest",
  ],
  hipSource: advancedAttentionSource,
  hipSourcePath: "examples/gfx950_advanced_attention/gfx950_advanced_attention.hip",
  build: advancedAttentionBuild,
  isa: advancedAttentionIsa,
  hipSourceSha256: "c44b4227c0ec525a367359bdc16aff69c3086676aa61def1b653266604d1ed1d",
  hipHsacoSha256: "dcfb1e00354ac14dffae5e069138c5e212b0906133838195dd717686af26ce84",
  compiler: "ROCm 7.2.1, HIP 7.2.53211, AMD Clang 22.0.0git",
  runtime: "visible gfx950 device through ssh alias mi350 on 2026-08-26",
  inputPolicy:
    "deterministic inputs; attention Q/K/V use non-uniform exactly representable E4M3 values and CPU comparisons reject non-finite values",
};

const systemsBundle: SourceBundle = {
  rustKernel: advancedSystemsRustKernel,
  rustReference: advancedSystemsRustReference,
  rustContract: advancedSystemsRustContract,
  rustKernelPath: "examples/gfx950_advanced_systems/src/kernel.rs",
  rustReferencePath: "examples/gfx950_advanced_systems/src/reference.rs",
  rustContractPath: "examples/gfx950_advanced_systems/src/lib.rs",
  rustReadmePath: "examples/gfx950_advanced_systems/README.md",
  rustLockPath: "examples/gfx950_advanced_systems/Cargo.lock",
  rustKernelFileSha256: "06423d7bfd24be5a80da70e2835b40bd066aeb404f9bad887d9e7707d52c076b",
  rustReferenceFileSha256: "7817c51c5274671197460f11ceed5fdd2b8415ba934119013adad68c7d7c8dbd",
  loweringConstant: "GFX950_ADVANCED_SYSTEMS_SOURCE_LOWERING_SUPPORTED",
  manifestPath: "examples/gfx950_advanced_systems/Cargo.toml",
  productionSupportPaths: [
    "examples/gfx950_advanced_systems/run-gfx950.sh",
    "examples/gfx950_advanced_attention/run-gfx950.sh",
    "examples/gfx950_advanced_attention/gfx950-extractor-runtime.sh",
    "examples/gfx950_advanced_attention/test-extractor-runtime.sh",
    "examples/gfx950_advanced_systems/tests/source.rs",
    "examples/gfx950_advanced_systems/tests/references.rs",
    "examples/gfx950_low_precision/gfx950-ocml-closure.sh",
    "examples/gfx950_low_precision/gfx950-ocml-rocm-7.2.1.manifest",
  ],
  hipSource: advancedSystemsSource,
  hipSourcePath: "examples/gfx950_advanced_systems/gfx950_advanced_systems.hip",
  build: advancedSystemsBuild,
  isa: advancedSystemsIsa,
  hipSourceSha256: "c29a6bc2de55563abddfb50f43aaccf6077ef0b4706fbfb314266ecaa48054c5",
  hipHsacoSha256: "5ccc37902f9b549ac405f1096ad6df8ea58eba5dd6a08c765f5ea3148eb47d16",
  compiler: "ROCm 7.2.1, HIP 7.2.53211, AMD Clang 22",
  runtime: "eight visible AMD Instinct MI350X devices through ssh host mi350 on 2026-08-26",
  inputPolicy:
    "deterministic inputs; floating-point comparisons reject non-finite values and speculative rollback is checked bitwise",
};

interface AdvancedLessonSpec {
  id: string;
  order: number;
  title: string;
  summary: string;
  duration: string;
  bundle: BundleId;
  sourceRole: string;
  rustSymbols: string[];
  rustExcerptSha256: string;
  referenceSymbols: string[];
  referenceExcerptSha256: string;
  hipSymbols: string[];
  fixedShape: string;
  isaRequirements: string[];
  observedResults: string[];
  prerequisites: string[];
  objectives: string[];
  narratives: [NarrativeId, NarrativeId];
  obligations: string[];
  diagram: DiagramKind;
  exercise: {
    prompt: string;
    hint: string;
    acceptance: string;
  };
  glossary: string[];
}

function sourceBundle(bundle: BundleId): SourceBundle {
  return bundle === "attention" ? attentionBundle : systemsBundle;
}

function exactHipKernelExcerpts(
  source: string,
  sourcePath: string,
  symbols: string[],
): string {
  return symbols.map((symbol) => {
    const symbolPosition = source.indexOf(`void ${symbol}(`);
    const start = source.lastIndexOf('extern "C" __global__', symbolPosition);
    const nextKernel = source.indexOf('extern "C" __global__', symbolPosition + 1);
    const main = source.indexOf("int main()", symbolPosition + 1);
    const end = nextKernel >= 0 ? nextKernel : main;
    if (symbolPosition < 0 || start < 0 || end < 0) {
      throw new Error(`Missing ${symbol} in ${sourcePath}`);
    }
    return source.slice(start, end).trimEnd();
  }).join("\n\n");
}

function rustFunctionExcerpt(source: string, symbol: string, attributed: boolean): string {
  const position = source.indexOf(`pub fn ${symbol}(`);
  const start = attributed
    ? source.lastIndexOf("#[kernel(", position)
    : Math.max(0, source.lastIndexOf("///", position));
  const open = source.indexOf("{", position);
  if (position < 0 || start < 0 || open < 0) throw new Error(`Missing Rust function ${symbol}`);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Unclosed Rust function ${symbol}`);
}

function loweringSupported(bundle: SourceBundle): boolean {
  return bundle.rustContract.includes(`${bundle.loweringConstant}: bool = true`);
}

function productionRunCommand(evidence: AdvancedRustEvidence): string {
  return [
    `# ${evidence.label}: ordinary Rust -> LLVM -> COV6 HSACO -> HSA numerical check`,
    `bash ${evidence.runnerPath}`,
  ].join("\n");
}

function evidenceLines(evidence: AdvancedRustEvidence): string[] {
  const common = [
    `KERNEL: ${evidence.label}`,
    `Symbol: ${evidence.symbol}`,
    `Production runner: bash ${evidence.runnerPath}`,
    `Hardware harness: ${advancedHarnessPath}::${evidence.hardwareTest}`,
    `Expected ABI: kernarg=${evidence.kernargBytes} bytes; required workgroup=${evidence.workgroupSize}x1x1; static LDS=${evidence.ldsBytes} bytes`,
    `Required Rust ISA: ${evidence.requiredIsa.join("; ")}`,
    `Target: ${advancedProductionTarget}, Wave64, code object V6`,
  ];
  if (!isObservedAdvancedEvidence(evidence)) {
    return [
      ...common,
      "Evidence status: pending mi350 end-to-end execution",
      "Portable namespace: pending",
      "Rust-produced LLVM SHA-256: pending",
      "Rust-produced HSACO SHA-256: pending",
      "Rust numerical result: pending",
      "Acceptance tolerance: pending",
    ];
  }
  return [
    ...common,
    "Evidence status: observed",
    `Portable namespace: ${evidence.namespace}`,
    `Rust-produced LLVM SHA-256: ${evidence.llvmSha256}`,
    `Rust-produced HSACO SHA-256: ${evidence.hsacoSha256}`,
    `Rust runtime observation: ${evidence.runtimeObservation}`,
    `Rust numerical result: ${evidence.numericalResult}`,
    `Acceptance tolerance: ${evidence.tolerance}`,
  ];
}

function advancedClaim(spec: AdvancedLessonSpec): Claim {
  const evidence = advancedEvidenceFor(spec.rustSymbols);
  if (
    advancedCoreSourceTree !== null &&
    loweringSupported(sourceBundle(spec.bundle)) &&
    evidence.every(isObservedAdvancedEvidence)
  ) {
    const observed = evidence as ObservedAdvancedRustEvidence[];
    return {
      kind: "gpu-observed",
      label: `Production Rust ${spec.sourceRole} observed on MI350X`,
      detail:
        `At the exact pinned core commit, every ordinary attributed Rust kernel in this lesson passed production extraction, ${advancedProductionTarget} LLVM and COV6 finalization, symbol-scoped ISA inspection, and its digest-pinned HSA numerical comparison on mi350. ${observed.map((entry) => `${entry.label}: ${entry.numericalResult}`).join("; ")}. This bounded observation is not a formal source-to-machine proof, performance result, protected publication, or full-model result.`,
      reference: historicalReference(
        advancedCoreSourceCommit,
        advancedCoreSourceTree,
        observed.map((entry) => `bash ${entry.runnerPath}`),
        [
          sourceBundle(spec.bundle).rustKernelPath,
          sourceBundle(spec.bundle).rustReferencePath,
          sourceBundle(spec.bundle).rustContractPath,
          sourceBundle(spec.bundle).rustReadmePath,
          sourceBundle(spec.bundle).rustLockPath,
          sourceBundle(spec.bundle).manifestPath,
          advancedHarnessPath,
          ...sourceBundle(spec.bundle).productionSupportPaths,
          ...observed.map((entry) => entry.runnerPath),
        ],
        {
          target: advancedProductionTarget,
          note: "Historical bounded raw-HSA MI350X observations only. Formal refinement, performance, protected publication authority, and protected Worker V3 native-build evidence remain separate.",
        },
      ),
    };
  }
  return {
    kind: "source-example",
    label: "Production Rust pipeline integrated; mi350 record pending",
    detail:
      `The lesson displays the ordinary attributed Rust kernels and independent safe CPU references. Each kernel has a dedicated production ${advancedProductionTarget} runner and digest-pinned HSA harness entry. Measured namespaces, LLVM/HSACO digests, numerical results, and GPU-observed authority remain fail-closed until the mi350 campaign is recorded.`,
  };
}

function advancedTabs(spec: AdvancedLessonSpec): CodeTab[] {
  const bundle = sourceBundle(spec.bundle);
  const productionEvidence = advancedEvidenceFor(spec.rustSymbols);
  const allObserved =
    loweringSupported(bundle) &&
    productionEvidence.every(isObservedAdvancedEvidence);
  const rustFragments = spec.rustSymbols.map((symbol) =>
    rustFunctionExcerpt(bundle.rustKernel, symbol, true),
  );
  const referenceFragments = spec.referenceSymbols.map((symbol) =>
    rustFunctionExcerpt(bundle.rustReference, symbol, false),
  );
  const tabs: CodeTab[] = [
    {
      kind: "kernel",
      label: "Rust kernel",
      language: "rust",
      code: rustFragments.join("\n\n"),
      sourcePath: bundle.rustKernelPath,
      sourceCommit: advancedCoreSourceCommit,
      sourceSha256: spec.rustExcerptSha256,
      sourceDigestScope: "displayed",
      sourceFragments: rustFragments,
      explanatory: false,
      notice: `Exact published ordinary attributed Rust for ${spec.rustSymbols.join(", ")}, pinned to the core commit and displayed-byte SHA-256. The production evidence area lists one Rust-to-HSACO runner and one HSA harness test per kernel.`,
    },
    {
      kind: "reference",
      label: "Safe CPU reference",
      language: "rust",
      code: referenceFragments.join("\n\n"),
      sourcePath: bundle.rustReferencePath,
      sourceCommit: advancedCoreSourceCommit,
      sourceSha256: spec.referenceExcerptSha256,
      sourceDigestScope: "displayed",
      sourceFragments: referenceFragments,
      explanatory: false,
      notice: `Exact published independent safe CPU reference functions, pinned to the core commit and displayed-byte SHA-256: ${spec.referenceSymbols.join(", ")}.`,
    },
    {
      kind: "comparison",
      label: "Equivalent HIP",
      language: "cpp",
      code: exactHipKernelExcerpts(bundle.hipSource, bundle.hipSourcePath, spec.hipSymbols),
      sourcePath: bundle.hipSourcePath,
      sourceSha256: bundle.hipSourceSha256,
      explanatory: true,
      notice: `Comparison-only HIP fixture. Its ${spec.isaRequirements.join("; ")} and historical runtime are independent of the Rust-produced LLVM, HSACO, and HSA run records.`,
    },
    {
      kind: "verus",
      label: "Proof obligations",
      language: "text",
      code: [
        "NO VERUS RESULT IS CLAIMED FOR THIS RUST SOURCE.",
        "",
        ...spec.obligations.map((obligation) => `- ${obligation}`),
        "- Rust source -> Kernel IR -> gfx950 ISA refinement remains unproved",
      ].join("\n"),
      explanatory: true,
      notice: "Obligation ledger only; no proof transcript or correctness certificate is claimed.",
    },
    {
      kind: "host",
      label: "Run and inspect",
      language: "bash",
      code: `# In the pinned fe2o3 core checkout at ${advancedCoreSourceCommit}.\n# Each command extracts one ordinary Rust kernel, checks its compiler binding,\n# emits ${advancedProductionTarget} LLVM, finalizes COV6 HSACO, inspects symbol-scoped\n# ISA, and launches the digest-pinned CPU-oracle comparison on a gfx950 GPU.\n${productionEvidence.map(productionRunCommand).join("\n\n")}\n\n# Package-wide host source and CPU-reference tests.\ncargo test --offline --manifest-path ${bundle.manifestPath}\n\n# Comparison only: the separate HIP suite is not used by any Rust runner.\nbash ${bundle.manifestPath.replace("/Cargo.toml", "/build_and_test.sh")}\n\n# Exact mirrored comparison-only HIP build script:\n${bundle.build}\n\n# Exact comparison-only HIP ISA checker:\n${bundle.isa}`,
      explanatory: true,
      notice:
        "Run the production commands in the exact pinned fe2o3 checkout. Each Rust runner owns its LLVM, HSACO, ISA, and numerical evidence. The separate site-local HIP command remains comparison-only.",
    },
    {
      kind: "result",
      label: "Evidence record",
      language: "text",
      code: resultText(
        allObserved ? "gpu-observed" : "source-example",
        [
          "FE2O3 PRODUCTION RUST -> GFX950 EVIDENCE",
          `Kernel source: ${bundle.rustKernelPath}`,
          `Kernel symbols: ${spec.rustSymbols.join(", ")}`,
          `Core source commit: ${advancedCoreSourceCommit}`,
          `Core source tree: ${advancedCoreSourceTree ?? "pending final core commit"}`,
          `Kernel file SHA-256: ${bundle.rustKernelFileSha256}`,
          `CPU references: ${spec.referenceSymbols.join(", ")}`,
          `Reference source: ${bundle.rustReferencePath}`,
          `Reference file SHA-256: ${bundle.rustReferenceFileSha256}`,
          `Production contract: ${bundle.rustContractPath}`,
          `Locked dependency graph: ${bundle.rustLockPath}`,
          `Production support: ${bundle.productionSupportPaths.join(", ")}`,
          `Fixed shape: ${spec.fixedShape}`,
          `Production flow: ordinary attributed Rust -> production extractor -> authenticated Kernel IR -> AMDGPU LLVM -> pinned gfx950 COV6 finalization -> symbol-scoped ISA -> digest-pinned HSA launch -> independent safe CPU reference`,
          `Rust gfx950 lowering supported: ${loweringSupported(bundle) ? "true" : "pending final source mirror"}`,
          "",
          ...productionEvidence.flatMap((evidence) => [
            ...evidenceLines(evidence),
            "",
          ]),
          "Observation coverage: exact target metadata, kernel symbol and ABI, output poison/canaries, immutable inputs, finite outputs, and the kernel-specific numerical oracle.",
          "Performance result: not claimed",
          "Formal source-to-machine proof: not claimed",
          "Protected publication authority: not claimed",
          "Protected Worker V3 native-build evidence: not claimed",
          "Full-model equivalence: not claimed",
          "",
          "SEPARATE COMPARISON-ONLY HIP LANE",
          `HIP source: ${bundle.hipSourcePath}`,
          `HIP symbols: ${spec.hipSymbols.join(", ")}`,
          `HIP source SHA-256: ${bundle.hipSourceSha256}`,
          `HIP code-object SHA-256: ${bundle.hipHsacoSha256}`,
          `HIP compiler observation: ${bundle.compiler}; ./build_and_test.sh.`,
          `HIP runtime observation: ${bundle.runtime}.`,
          `HIP ISA observation: ${spec.isaRequirements.join("; ")}.`,
          `HIP CPU-oracle observation: ${spec.observedResults.join("; ")}.`,
          `Input/error policy: ${bundle.inputPolicy}.`,
          "The HIP artifact is an independent comparison. It does not produce, bind, or authorize any Rust artifact.",
        ].join("\n"),
      ),
      explanatory: true,
      notice:
        allObserved
          ? "The pinned production Rust artifacts and MI350X runs support only these bounded GPU-observed claims. HIP remains a separate comparison; proof, performance, protected publication, and full-model claims are not promoted."
          : "Production evidence is intentionally pending until every displayed kernel has an exact mi350 namespace, LLVM/HSACO digest, ISA record, and numerical result. HIP remains a separate comparison lane.",
    },
  ];
  const performance = advancedPerformanceTabFor(spec.id);
  if (performance) tabs.push(performance);
  return tabs;
}

function lesson(spec: AdvancedLessonSpec): Lesson {
  return {
    id: spec.id,
    module: 10,
    order: spec.order,
    title: spec.title,
    summary: spec.summary,
    duration: spec.duration,
    prerequisites: spec.prerequisites,
    objectives: spec.objectives,
    claims: [advancedClaim(spec)],
    sections: [
      narrativeSection(spec.narratives[0]),
      narrativeSection(spec.narratives[1]),
    ],
    tabs: advancedTabs(spec),
    diagram: spec.diagram,
    exercises: [spec.exercise],
    glossary: spec.glossary,
  };
}

const gptOssPerformance = advancedPerformanceTabFor(
  "gfx950-gpt-oss-120b-megakernel",
);
if (!gptOssPerformance) {
  throw new Error("Missing GPT-OSS-120B performance shell");
}

const gptOssMegakernelLesson: Lesson = {
  id: "gfx950-gpt-oss-120b-megakernel",
  module: 10,
  order: 8,
  title: "GPT-OSS-120B batch-1 layer-tile megakernel",
  summary:
    "Prepare one evidence-bounded lesson for a fused router, attention, and expert layer tile without presenting it as a whole-model kernel or an unmeasured performance winner.",
  duration: "55 min",
  prerequisites: [
    "gfx950 advanced MoE pipeline",
    "gfx950 flash attention",
    "Exact artifact provenance",
    "Paired latency experiments",
  ],
  objectives: [
    "Define the exact batch-1 layer-tile boundary and the intermediate values retained by fusion.",
    "Require the fused and unfused Rust artifacts to share inputs, semantics, oracle coverage, and timing protocol.",
    "Keep fastest and state-of-the-art labels disabled until a final admitted comparison supports them.",
  ],
  claims: [
    {
      kind: "design-only",
      label: "Lesson shell awaiting final Rust artifact and comparison",
      detail:
        "The tutorial structure and evidence requirements are present. No final Rust source mirror, namespace, LLVM or HSACO digest, MI350X result, performance comparison, theoretical bound, whole-model result, or state-of-the-art claim is admitted by this shell.",
    },
  ],
  sections: [
    narrativeSection("gfx950-gpt-oss-120b-megakernel/layer-tile-contract"),
    narrativeSection("gfx950-gpt-oss-120b-megakernel/performance-boundary"),
  ],
  tabs: [
    {
      kind: "kernel",
      label: "Rust kernel status",
      language: "rust",
      code: [
        "// LESSON SHELL ONLY: no executable Rust source is published here yet.",
        "// Expected final scope: one GPT-OSS-120B batch-1 layer tile.",
        "// Expected fused stages: router, attention, and expert compute.",
        "// Replace this status with the exact attributed Rust excerpt only after",
        "// its source commit, displayed-byte digest, namespace, and artifacts are final.",
      ].join("\n"),
      explanatory: true,
      notice:
        "Status text, not a kernel implementation. The final ordinary attributed Rust source must be mirrored and pinned before this tab becomes execution evidence.",
    },
    {
      kind: "reference",
      label: "CPU reference status",
      language: "rust",
      code: [
        "// PENDING FINAL INDEPENDENT CPU REFERENCE.",
        "// It must check router choices, attention output, expert output,",
        "// final packed output, exceptional values, immutable inputs, and canaries.",
      ].join("\n"),
      explanatory: true,
      notice:
        "Reference requirements only. No oracle result is claimed until the exact independent implementation and fixture are published.",
    },
    {
      kind: "verus",
      label: "Proof obligations",
      language: "text",
      code: [
        "NO VERUS RESULT IS CLAIMED FOR THIS LESSON SHELL.",
        "",
        "- prove all fused intermediate views remain in bounds",
        "- prove one final owner for every output and route-metadata slot",
        "- prove fusion preserves the exact unfused stage composition",
        "- bind Rust source, Kernel IR, LLVM, ISA, artifact, and launch identity",
        "- keep full-model equivalence outside the fixed layer-tile claim",
      ].join("\n"),
      explanatory: true,
      notice: "Obligation ledger only; no proof execution or compiler-refinement receipt is claimed.",
    },
    {
      kind: "host",
      label: "Run protocol",
      language: "bash",
      code: [
        "# PENDING: run only after these paths exist in the final pinned core commit.",
        "# bash examples/gfx950_gpt_oss_decode/run-gfx950.sh",
        "# bash examples/gfx950_gpt_oss_decode/run-exact-unfused-gfx950.sh",
        "# bash examples/gfx950_gpt_oss_decode/run-performance-gfx950.sh",
        "",
        "# Required timing design: five fresh processes per variant, alternating",
        "# AB/BA order, fixed warmups, exact digests, CPU oracle, and canaries.",
      ].join("\n"),
      explanatory: true,
      notice:
        "Protocol shell only. Commented commands grant no evidence until the final paths, artifacts, and retained logs are published.",
    },
    {
      kind: "result",
      label: "Evidence status",
      language: "text",
      code: resultText(
        "design-only",
        [
          "GPT-OSS-120B BATCH-1 LAYER-TILE MEGAKERNEL",
          "Scope: one fixed layer tile; not a whole-model kernel",
          "Final Rust source: pending",
          "Independent CPU reference: pending",
          "Production namespace: pending",
          "LLVM SHA-256: pending",
          "HSACO SHA-256: pending",
          "Symbol-scoped gfx950 ISA: pending",
          "MI350X numerical result: pending",
          "Exact unfused comparator: pending",
          "Optimization ablations: pending",
          "Theoretical bound and derivation: pending",
          "Fastest claim: not claimed",
          "State-of-the-art claim: not claimed",
        ].join("\n"),
      ),
      explanatory: true,
      notice:
        "Fail-closed status record. Pending fields must be replaced by exact retained evidence, not projections.",
    },
    gptOssPerformance,
  ],
  diagram: "moe",
  exercises: [
    {
      prompt: "Design the exact fused-versus-unfused admission table.",
      hint: "Start with shared inputs and per-stage CPU-oracle outputs, then bind each artifact and timing process independently.",
      acceptance:
        "The table names every source, artifact, correctness, ISA, timing, and theoretical-bound field required before any fastest label can appear.",
    },
  ],
  glossary: ["gfx950", "mixture of experts", "model equivalence", "acceptance contract"],
};

const advancedLessons = [
  lesson({
    id: "gfx950-advanced-moe",
    order: 0,
    title: "gfx950 advanced MoE pipeline",
    summary:
      "Trace one compile-time-bounded token-to-expert dispatch, local expert compute, and weighted combine without implying a production serving path.",
    duration: "48 min",
    bundle: "systems",
    sourceRole: "stable top-2 metadata, all-expert MFMA, host-staged rank partial, and combine teaching kernels",
    rustSymbols: [
      "gfx950_moe_route_fp4_t16_e4_k2_v1",
      "gfx950_moe_expert_rank_fp4_fp8_v1",
      "gfx950_combine_expert_ranks_v1",
    ],
    rustExcerptSha256: "3d9561b2c86f94b0029a13cc8e0de78c1179dbd01ea0f860627bdccc2ae1095d",
    referenceSymbols: ["moe_routing_reference", "moe_rank_reference"],
    referenceExcerptSha256: "13ab007af1facc9263b07b4be60479ff377eb6821629af5a009c4445c2d4690e",
    hipSymbols: ["gfx950_fused_fp4_fp8_moe", "gfx950_expert_parallel_rank", "gfx950_combine_expert_ranks"],
    fixedShape:
      "16 tokens, hidden 128, output 16, four routed experts plus one shared expert, top-2 routing",
    isaRequirements: [
      "all three lesson symbols are present",
      "gfx950_fused_fp4_fp8_moe contains exactly one v_mfma_f32_16x16x128_f8f6f4 with cbsz:4",
      "gfx942 compilation is rejected",
    ],
    observedResults: [
      "router top weights max_error=0",
      "fused MoE max_error=0",
      "expert counts=9,7,6,10",
      "logical rank 0 max_error=3.25963e-09",
      "logical rank 1 max_error=4.76837e-07",
      "GPU0 rank combine max_error=4.76837e-07",
      "transport mode=two-device-peer",
    ],
    prerequisites: ["gfx950 FP8 GEMM", "MoE routing", "Grouped GEMM", "Stable route ownership"],
    objectives: [
      "Separate stable top-2 routing, dispatch metadata, all-expert tile computation, and weighted combine contracts.",
      "Audit fixed token, expert, top-k, and hidden extents before inspecting generated ISA.",
      "Distinguish the bounded two-rank peer-copy fixture from production expert parallelism.",
    ],
    narratives: ["gfx950-advanced-moe/fixed-pipeline", "gfx950-advanced-moe/scope-evidence"],
    obligations: [
      "all 32 top-2 routes have one in-range expert and one deterministic compact slot",
      "equal router logits choose the lower expert ID as in the CPU oracle",
      "expert output returns to exactly its originating token-route pair",
      "the weighted combine reads every accepted route once and writes every output once",
    ],
    diagram: "moe",
    exercise: {
      prompt: "Add an exact router-logit tie oracle case.",
      hint: "Pin the lower-expert-ID tie rule for first and second selection, then inspect dispatch order.",
      acceptance: "The expected top-2 expert IDs, weights, per-expert counts, and compact route order are explicit for all 16 tokens.",
    },
    glossary: ["gfx950", "mixture of experts", "top-k", "capacity", "expert-major layout"],
  }),
  lesson({
    id: "gfx950-kda-gdn-linear-attention",
    order: 1,
    title: "gfx950 KDA/GDN linear attention",
    summary:
      "Study a fixed head and sequence recurrence for gated linear attention while keeping state-update order and numeric policy explicit.",
    duration: "46 min",
    bundle: "attention",
    sourceRole: "KDA/GDN recurrent state-update and output teaching kernels",
    rustSymbols: ["gfx950_kda_gdn_decode", "gfx950_kda_gdn_prefill"],
    rustExcerptSha256: "e77e20f00c6fc8d3fb28c445f64a54df979732fc9545d4d88f8342d719dc5b90",
    referenceSymbols: ["kda_gdn_decode_reference_v1", "kda_gdn_prefill_reference_v1"],
    referenceExcerptSha256: "7912b95e74b9f9f210bff098b356150ac9dda21aad9b132765b93b3eaaee7b7d",
    hipSymbols: ["gfx950_kda_gdn_decode", "gfx950_kda_gdn_prefill"],
    fixedShape:
      "16 channels; three-tap decode; eight-token prefill in two ordered four-token chunks",
    isaRequirements: [
      "gfx950_kda_gdn_decode contains v_rsq_f32",
      "gfx950_kda_gdn_prefill contains v_rsq_f32",
    ],
    observedResults: [
      "decode state max_error=2.98023e-08",
      "decode normalization max_error=4.76837e-07",
      "prefill state max_error=1.49012e-08",
      "prefill normalization max_error=3.57628e-07",
    ],
    prerequisites: ["Online recurrences", "Gated linear attention", "FP32 accumulator state", "Wave64 reductions"],
    objectives: [
      "Write the exact three-tap convolution, proposal, gate, state, and RMS-normalization transition.",
      "Track history, gate, state, normalized output, and carried prefill state layouts independently.",
      "Identify which recurrence dependencies prevent unconstrained parallel reordering.",
    ],
    narratives: ["gfx950-kda-gdn-linear-attention/recurrence", "gfx950-kda-gdn-linear-attention/scope-evidence"],
    obligations: [
      "the initial state, token order, three-tap causal history, gate transform, and normalized output are fully specified",
      "each state element has one owner or a stated synchronization/reduction policy",
      "the numeric oracle uses the same recurrence order, 1e-5 RMS epsilon, and declared tolerance",
      "input/output/state aliases are excluded unless the source explicitly supports them",
    ],
    diagram: "attention",
    exercise: {
      prompt: "Write a two-step recurrence trace for one state element.",
      hint: "Keep the three-tap convolution, proposal, gate, state update, and RMS normalization in source order.",
      acceptance: "The trace names the initial state and both ordered updates without claiming equivalence to a full model layer.",
    },
    glossary: ["gfx950", "KDA", "GDN", "linear attention", "recurrent state"],
  }),
  lesson({
    id: "gfx950-indexed-sparse-attention",
    order: 2,
    title: "gfx950 indexed sparse attention",
    summary:
      "Select a compile-time-bounded key/value subset from content scores and make the selected-ID, mask, and output semantics explicit.",
    duration: "42 min",
    bundle: "attention",
    sourceRole: "content-indexed sparse QK, softmax, and PV teaching kernel",
    rustSymbols: ["gfx950_content_sparse_attention"],
    rustExcerptSha256: "ec8250abcb0b9efa2cbd28f62764c45840f901db3824d3669a9e61209c13dba8",
    referenceSymbols: ["content_sparse_attention_reference_v1"],
    referenceExcerptSha256: "813fce6fee60239b9c2ee8aa0c66958680595bfa66162d27b95f7cde7ca2dad9",
    hipSymbols: ["gfx950_content_sparse_attention"],
    fixedShape:
      "16 tokens, head dimension 128, 16 value channels; top two four-token blocks then top three tokens",
    isaRequirements: [
      "gfx950_content_sparse_attention contains exactly four ds_read_b64_tr_b8 before one v_mfma_f32_16x16x128_f8f6f4",
    ],
    observedResults: [
      "selected IDs=[7,1,4]",
      "sparse attention max_error=2.98023e-08",
    ],
    prerequisites: ["gfx950 flash attention", "Gather bounds", "Masking", "Online softmax"],
    objectives: [
      "Trace deterministic top-two block and top-three token selection into the active score mask.",
      "Keep content-score selection, selected token IDs, packed fragment layout, and logical attention order distinct.",
      "Confirm that unselected tokens contribute neither to the maximum, denominator, nor value numerator.",
    ],
    narratives: ["gfx950-indexed-sparse-attention/index-contract", "gfx950-indexed-sparse-attention/scope-evidence"],
    obligations: [
      "top-two block selection uses the source-declared stable tie behavior",
      "top-three token selection is unique and drawn only from the eight selected-block candidates",
      "masked slots contribute neither to the maximum, denominator, nor value numerator",
      "the output covers exactly the 16 fixed value channels with one final store each",
    ],
    diagram: "attention",
    exercise: {
      prompt: "Add tied block-score and tied token-score oracle cases.",
      hint: "Follow the source's stable lower-position tie order through both selection stages.",
      acceptance: "The expected three unique token IDs and active softmax domain are explicit for each tie case.",
    },
    glossary: ["gfx950", "indexed sparse attention", "gather contract", "duplicate semantics", "masking"],
  }),
  lesson({
    id: "gfx950-compressed-hybrid-attention",
    order: 3,
    title: "gfx950 compressed hybrid attention",
    summary:
      "Combine one bounded compressed-state branch with one bounded direct-attention branch under an explicit fusion rule.",
    duration: "48 min",
    bundle: "attention",
    sourceRole: "compressed-state, direct-attention, and hybrid fusion teaching kernels",
    rustSymbols: ["gfx950_compressed_hybrid_attention"],
    rustExcerptSha256: "4de136e59115bb9ffdad9c836fd3be5a482002d1f5367fa65c0312ebc6a3bf38",
    referenceSymbols: ["compressed_hybrid_attention_reference_v1"],
    referenceExcerptSha256: "afe790e4c83988aae90763d6dccd394b265017ba72d6e4024b6f7b794e8d08db",
    hipSymbols: ["gfx950_compressed_hybrid_attention"],
    fixedShape:
      "16 tokens, head dimension 128, 16 value channels; three compressed four-token blocks plus tokens 12-15 as the local window",
    isaRequirements: [
      "gfx950_compressed_hybrid_attention contains exactly four ds_read_b64_tr_b8 before one v_mfma_f32_16x16x128_f8f6f4",
    ],
    observedResults: [
      "compressed hybrid attention max_error=1.67638e-07",
    ],
    prerequisites: ["Linear attention", "Sparse attention", "State compression", "Numerical oracles"],
    objectives: [
      "Describe the compressed and direct branches as separate fixed-shape contracts.",
      "Record the exact branch fusion order, weights, and accumulator precision.",
      "Separate local kernel behavior from end-to-end hybrid-model equivalence.",
    ],
    narratives: ["gfx950-compressed-hybrid-attention/fusion-contract", "gfx950-compressed-hybrid-attention/scope-evidence"],
    obligations: [
      "compression reads the declared source domain and initializes every compressed-state element",
      "the direct branch uses the declared key domain and mask",
      "branch outputs have compatible logical coordinates before fusion",
      "fusion order, coefficients, accumulator type, and final store ownership match the oracle",
    ],
    diagram: "attention",
    exercise: {
      prompt: "Isolate each hybrid branch in the CPU oracle.",
      hint: "Choose fusion coefficients that select one branch at a time, then test their declared combination.",
      acceptance: "Both isolated branches and the combined fixed case have independent expected outputs and tolerances.",
    },
    glossary: ["gfx950", "compressed attention", "hybrid attention", "fusion contract", "model equivalence"],
  }),
  lesson({
    id: "gfx950-attnres-gr-mhc",
    order: 4,
    title: "gfx950 AttnRes, GR, and mHC mixing",
    summary:
      "Express bounded residual-stream selection, gating, and mixing as explicit tensor transforms with alias-safe stores.",
    duration: "40 min",
    bundle: "attention",
    sourceRole: "AttnRes, gated-residual, and mHC residual-mixing teaching kernels",
    rustSymbols: [
      "gfx950_attnres_aggregate",
      "gfx950_four_branch_residual",
      "gfx950_mhc_sinkhorn_mix",
    ],
    rustExcerptSha256: "e5795670dff8822a51c0e5afbaea3054635d067e4dd51d6d8d9d8293cf2e4ea1",
    referenceSymbols: ["attnres_aggregate_reference_v1", "four_branch_residual_reference_v1", "mhc_sinkhorn_mix_reference_v1"],
    referenceExcerptSha256: "d3fa6ba2d5fb187aeb5bf304ba3b29327636f8ce6afbf9455adbcf2273a3382f",
    hipSymbols: ["gfx950_attnres_aggregate", "gfx950_four_branch_residual", "gfx950_mhc_sinkhorn_mix"],
    fixedShape:
      "16 channels; four AttnRes depths, four gated residual branches, and four mHC streams with three Sinkhorn iterations",
    isaRequirements: [
      "gfx950_attnres_aggregate contains v_exp_f32",
      "gfx950_four_branch_residual contains v_exp_f32",
      "gfx950_mhc_sinkhorn_mix contains v_exp_f32",
    ],
    observedResults: [
      "AttnRes max_error=0",
      "four-branch residual max_error=0",
      "mHC/Sinkhorn max_error=2.98023e-08",
    ],
    prerequisites: ["Residual connections", "Tensor layouts", "Gating", "Aliasing contracts"],
    objectives: [
      "Name the input streams, coefficient domain, mixing order, and output layout for each variant.",
      "Distinguish elementwise gates from stream-mixing matrices and normalization steps.",
      "Audit whether an in-place transform preserves unread residual inputs.",
    ],
    narratives: ["gfx950-attnres-gr-mhc/mixing-contract", "gfx950-attnres-gr-mhc/scope-evidence"],
    obligations: [
      "every output component names the exact source streams and coefficients it consumes",
      "gate and mixing transforms use the source-declared order and numeric type",
      "in-place stores cannot overwrite a residual value before its final read",
      "the CPU oracle treats AttnRes, GR, and mHC as distinct contracts",
    ],
    diagram: "memory",
    exercise: {
      prompt: "Construct an aliasing-negative case for one mixing variant.",
      hint: "Find an output store that would precede a later read if input and output shared storage.",
      acceptance: "The host rejects the alias or the kernel stages all required inputs before the first clobbering store.",
    },
    glossary: ["gfx950", "AttnRes", "GR", "mHC", "residual mixing"],
  }),
  lesson({
    id: "gfx950-speculative-mtp-verification",
    order: 5,
    title: "gfx950 speculative and MTP verification",
    summary:
      "Verify one fixed-width candidate block and compute a deterministic accepted prefix without claiming a serving scheduler or sampler.",
    duration: "44 min",
    bundle: "systems",
    sourceRole: "speculative-decoding and multi-token-prediction verification teaching kernels",
    rustSymbols: ["gfx950_speculative_transaction_v1"],
    rustExcerptSha256: "829d1dd1b863202342a822ec48a61610f275eec943cbafab897c814300203df0",
    referenceSymbols: ["speculative_reference"],
    referenceExcerptSha256: "36ca2f84521a24cf65177a8e030dbf935f3b1b03e30ef5fb7e8a8a1e2241d6bc",
    hipSymbols: ["gfx950_speculative_transaction"],
    fixedShape:
      "eight candidates, four draft steps, eight state elements; commit state deltas only when all four steps pass",
    isaRequirements: [
      "gfx950_speculative_transaction symbol is present",
      "gfx942 compilation is rejected for the complete suite",
    ],
    observedResults: [
      "transaction state max_error=0",
      "committed candidates=2",
      "rolled-back candidates=6 with bitwise base-state equality",
    ],
    prerequisites: ["Prefix scans", "Token logits", "Deterministic acceptance policy", "Gather bounds"],
    objectives: [
      "Separate candidate gathering, target evaluation, acceptance predicates, and prefix length.",
      "Define the first-rejection rule and output ownership for a fixed candidate width.",
      "Keep verification-kernel evidence separate from decoder and serving-system claims.",
    ],
    narratives: ["gfx950-speculative-mtp-verification/prefix-contract", "gfx950-speculative-mtp-verification/scope-evidence"],
    obligations: [
      "each candidate position reads the declared token and target value in range",
      "the acceptance predicate and first-rejection rule are deterministic for the teaching inputs",
      "no position after the first rejection is reported as accepted",
      "accepted length, commit flag, and fixed output state have one final owner per candidate",
    ],
    diagram: "reduction",
    exercise: {
      prompt: "Add all-accepted, first-rejected, and last-rejected prefix cases.",
      hint: "Compute the per-position predicate first, then the accepted prefix length.",
      acceptance: "The oracle covers all three boundaries and never treats independent accepted positions as a valid prefix.",
    },
    glossary: ["gfx950", "speculative decoding", "MTP", "accepted prefix", "verification kernel"],
  }),
  lesson({
    id: "gfx950-ngram-embedding-gather",
    order: 6,
    title: "gfx950 N-gram hash-table gather",
    summary:
      "Resolve fixed-order N-gram identifiers through a bounded priority table and return one integer table value per query.",
    duration: "36 min",
    bundle: "systems",
    sourceRole: "N-gram hash-table lookup and integer-value gather teaching kernel",
    rustSymbols: ["gfx950_qwen_ngram_gather_v1"],
    rustExcerptSha256: "bc99f70c6776d5b882e9f02dfea8de1a371ac4bb55145e54df800d72f1819bd2",
    referenceSymbols: ["ngram_reference"],
    referenceExcerptSha256: "9ce2cdd494c09f727ba87834de2874a80400cddde22691e50dcacb532dc505b1",
    hipSymbols: ["gfx950_qwen_ngram_gather"],
    fixedShape:
      "eight queries, three tokens per N-gram, 16 table slots, integer table-value output",
    isaRequirements: [
      "gfx950_qwen_ngram_gather symbol is present",
      "gfx942 compilation is rejected for the complete suite",
    ],
    observedResults: [
      "hits=4",
      "misses=4",
      "deterministic duplicate-key tie value=4242",
    ],
    prerequisites: ["Hash tables", "Indexed gathers", "Integer overflow checks", "Deterministic tie-breaking"],
    objectives: [
      "Bound N-gram construction and table addressing without unchecked integer overflow.",
      "Define lookup miss, hash collision, exact key comparison, and priority tie behavior.",
      "Keep the current integer table-value output distinct from a future embedding-vector gather.",
    ],
    narratives: ["gfx950-ngram-embedding-gather/gather-contract", "gfx950-ngram-embedding-gather/scope-evidence"],
    obligations: [
      "token-window and N-gram identifier arithmetic cannot overflow its admitted integer type",
      "every resolved table row is in range or follows an explicit miss policy",
      "collisions and repeated identifiers have deterministic semantics",
      "the best matching slot returns exactly one integer table value, with -1 for a miss",
    ],
    diagram: "indexing",
    exercise: {
      prompt: "Add hash-collision, repeated-key, priority-tie, and lookup-miss oracle cases.",
      hint: "Make exact-key matching, priority ties, and the -1 miss value explicit before returning a table value.",
      acceptance: "Every query has one declared integer result and every table read is in range.",
    },
    glossary: ["gfx950", "N-gram", "hash-table gather", "lookup miss", "gather contract"],
  }),
  lesson({
    id: "gfx950-muon-optimizer",
    order: 7,
    title: "gfx950 Muon polar update",
    summary:
      "Reduce two fixed gradient shards, normalize one 4 x 4 matrix, run five polar iterations, and emit a scaled update.",
    duration: "50 min",
    bundle: "systems",
    sourceRole: "Muon gradient staging, shard reduction, polar iteration, and update teaching kernels",
    rustSymbols: ["gfx950_stage_gradient_shard_v1", "gfx950_muon_update_4x4_v1"],
    rustExcerptSha256: "d63a9d04e2ce3efb41837357fd50d7321fcea6c6d42eb017359723d6b2073e8b",
    referenceSymbols: ["muon_reference"],
    referenceExcerptSha256: "20613ed1fad5dbdfd09f2bad3421e0927157a77e3085e0303092567d633403af",
    hipSymbols: ["gfx950_stage_gradient_shard", "gfx950_muon_update"],
    fixedShape:
      "two gradient shards reduced in rank order into one 4 x 4 FP32 matrix; five polar iterations; learning-rate scale 0.05",
    isaRequirements: [
      "gfx950_stage_gradient_shard and gfx950_muon_update symbols are present",
      "gfx942 compilation is rejected for the complete suite",
    ],
    observedResults: [
      "staged shard max_error=0",
      "polar update max_error=4.65661e-09",
      "reduced norm max_error=0 with norm=0.614919",
      "mode=two-device-host-staged",
    ],
    prerequisites: ["Matrix norms", "Shard reduction", "Iterative matrix transforms", "FP32 accumulation"],
    objectives: [
      "State the exact fixed matrix shape, shard order, iteration count, and update order.",
      "Track working precision and normalization through the bounded orthogonalization loop.",
      "Separate a single optimizer-step oracle from convergence or training-quality claims.",
    ],
    narratives: ["gfx950-muon-optimizer/update-contract", "gfx950-muon-optimizer/scope-evidence"],
    obligations: [
      "the two shards are reduced in fixed rank order before normalization",
      "normalization handles the source-declared zero and non-finite policies",
      "the orthogonalization loop executes the exact fixed iteration count in source order",
      "all 16 update elements and the reduced norm receive one final in-range store",
    ],
    diagram: "gemm",
    exercise: {
      prompt: "Add zero-gradient and one bounded nonzero-matrix oracle cases.",
      hint: "Record the normalization policy before applying the fixed orthogonalization iterations.",
      acceptance: "The cases pin the reduced norm and 16 update outputs without making convergence, throughput, or model-quality claims.",
    },
    glossary: ["gfx950", "Muon", "polar iteration", "gradient shard", "optimizer update"],
  }),
  gptOssMegakernelLesson,
];

export const modules10: CurriculumModule[] = [
  {
    number: 10,
    title: "gfx950 advanced operator kernels",
    summary:
      "Fixed-shape teaching contracts for advanced attention, routing, residual, decoding, N-gram lookup, optimizer, and GPT-OSS layer-tile operators, with source and evidence integration kept fail-closed.",
    lessons: advancedLessons,
  },
];
