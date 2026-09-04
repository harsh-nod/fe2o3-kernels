import advancedAttentionSource from "../../examples/gfx950_advanced_attention/gfx950_advanced_attention.hip?raw";
import advancedAttentionAblation from "../../examples/gfx950_advanced_attention/src/ablation.rs?raw";
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
import gptOssRustKernel from "../../examples/gfx950_gpt_oss_decode/src/kernel.rs?raw";
import gptOssComponents from "../../examples/gfx950_gpt_oss_decode/src/kernel_components.rs?raw";
import gptOssHeldFragments from "../../examples/gfx950_gpt_oss_decode/src/kernel_held_fragments.rs?raw";
import gptOssInterleavedStores from "../../examples/gfx950_gpt_oss_decode/src/kernel_interleaved_stores.rs?raw";
import gptOssPipelinedAttention from "../../examples/gfx950_gpt_oss_decode/src/kernel_pipelined_attention.rs?raw";
import gptOssRouterSerial from "../../examples/gfx950_gpt_oss_decode/src/kernel_router_serial.rs?raw";
import gptOssScalarAttention from "../../examples/gfx950_gpt_oss_decode/src/kernel_scalar_attention.rs?raw";
import gptOssRustReference from "../../examples/gfx950_gpt_oss_decode/src/reference.rs?raw";
import gptOssUnfusedHip from "../../examples/gfx950_gpt_oss_decode/gpt_oss_unfused.hip?raw";
import gptOssRunFused from "../../examples/gfx950_gpt_oss_decode/run-gfx950.sh?raw";
import gptOssRunUnfused from "../../examples/gfx950_gpt_oss_decode/run-unfused-gfx950.sh?raw";
import gptOssPerformanceRunner from "../../perf-evidence/run-gpt-oss-performance.sh?raw";
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

export const advancedCoreSourceCommit =
  "9006001157e2c3062e44088634e467b0f8963ee0";
export const advancedCoreSourceTree: string | null =
  "874a9a250f904e3229410e0d620cfcecaab3f49d";

const attentionBundle: SourceBundle = {
  rustKernel: advancedAttentionRustKernel,
  rustReference: advancedAttentionRustReference,
  rustContract: advancedAttentionRustContract,
  rustKernelPath: "examples/gfx950_advanced_attention/src/kernel.rs",
  rustReferencePath: "examples/gfx950_advanced_attention/src/reference.rs",
  rustContractPath: "examples/gfx950_advanced_attention/src/lib.rs",
  rustReadmePath: "examples/gfx950_advanced_attention/README.md",
  rustLockPath: "examples/gfx950_advanced_attention/Cargo.lock",
  rustKernelFileSha256:
    "225b14907ae4ed9542f4abd9b532dd501fbc99048f5ea15c94b5456066c56aec",
  rustReferenceFileSha256:
    "557ca02fbea9d06865dc4d0d468e142e26175bb67291cd6dac7b91ad964eec53",
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
  hipSourcePath:
    "examples/gfx950_advanced_attention/gfx950_advanced_attention.hip",
  build: advancedAttentionBuild,
  isa: advancedAttentionIsa,
  hipSourceSha256:
    "c44b4227c0ec525a367359bdc16aff69c3086676aa61def1b653266604d1ed1d",
  hipHsacoSha256:
    "dcfb1e00354ac14dffae5e069138c5e212b0906133838195dd717686af26ce84",
  compiler: "ROCm 7.2.1, HIP 7.2.53211, AMD Clang 22.0.0git",
  runtime:
    "AMD Instinct MI350X physical GPU 6 through ssh host mi350 on 2026-09-04",
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
  rustKernelFileSha256:
    "b8f01f1a6bba7e0171405ee4e6ab515fc5bef528a8e73ce912b00817b895b4b0",
  rustReferenceFileSha256:
    "e7638564d1d5cff646ff8978c7771eddddb6d6e1422a2dcc3fc02c57a2761a05",
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
  hipSourceSha256:
    "c29a6bc2de55563abddfb50f43aaccf6077ef0b4706fbfb314266ecaa48054c5",
  hipHsacoSha256:
    "5ccc37902f9b549ac405f1096ad6df8ea58eba5dd6a08c765f5ea3148eb47d16",
  compiler: "ROCm 7.2.1, HIP 7.2.53211, AMD Clang 22",
  runtime:
    "AMD Instinct MI350X physical GPU 6 through ssh host mi350 on 2026-09-04",
  inputPolicy:
    "16 nonuniform batch-local inputs for wave-oriented kernels and four for combine; floating-point comparisons reject non-finite values and compact outputs are checked in batch-major order",
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
  hipSymbols?: string[];
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
  variantSources?: VariantSourceSpec[];
}

interface VariantSourceSpec {
  label: string;
  status: "compatibility-validated" | "compiler-rejected";
  code: string;
  sourcePath: string;
  sourceSha256: string;
  detail: string;
}

function sourceBundle(bundle: BundleId): SourceBundle {
  return bundle === "attention" ? attentionBundle : systemsBundle;
}

function exactHipKernelExcerpts(
  source: string,
  sourcePath: string,
  symbols: string[],
): string {
  return symbols
    .map((symbol) => {
      const symbolPosition = source.indexOf(`void ${symbol}(`);
      const start = source.lastIndexOf('extern "C" __global__', symbolPosition);
      const nextKernel = source.indexOf(
        'extern "C" __global__',
        symbolPosition + 1,
      );
      const main = source.indexOf("int main()", symbolPosition + 1);
      const end = nextKernel >= 0 ? nextKernel : main;
      if (symbolPosition < 0 || start < 0 || end < 0) {
        throw new Error(`Missing ${symbol} in ${sourcePath}`);
      }
      return source.slice(start, end).trimEnd();
    })
    .join("\n\n");
}

function rustFunctionExcerpt(
  source: string,
  symbol: string,
  attributed: boolean,
): string {
  const position = source.indexOf(`pub fn ${symbol}(`);
  const start = attributed
    ? Math.max(
        source.lastIndexOf("///", position),
        source.lastIndexOf("#[kernel(", position),
      )
    : Math.max(0, source.lastIndexOf("///", position));
  const open = source.indexOf("{", position);
  if (position < 0 || start < 0 || open < 0)
    throw new Error(`Missing Rust function ${symbol}`);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Unclosed Rust function ${symbol}`);
}

function rustPrivateFunctionExcerpt(source: string, symbol: string): string {
  const position = source.indexOf(`fn ${symbol}(`);
  const start = source.lastIndexOf("\n", position) + 1;
  const open = source.indexOf("{", position);
  if (position < 0 || open < 0)
    throw new Error(`Missing Rust function ${symbol}`);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Unclosed Rust function ${symbol}`);
}

function rustMacroExcerpt(source: string, symbol: string): string {
  const position = source.indexOf(`macro_rules! ${symbol}`);
  const start = Math.max(0, source.lastIndexOf("#[cfg(", position));
  const open = source.indexOf("{", position);
  if (position < 0 || open < 0) throw new Error(`Missing Rust macro ${symbol}`);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Unclosed Rust macro ${symbol}`);
}

function variantSourceTab(source: VariantSourceSpec): CodeTab {
  const status =
    source.status === "compatibility-validated"
      ? "FINAL-COMPATIBILITY"
      : "COMPILER-REJECTED";
  return {
    kind: "kernel",
    label: `${source.label} [${status}]`,
    language: "rust",
    code: source.code,
    sourcePath: source.sourcePath,
    sourceCommit: advancedCoreSourceCommit,
    sourceSha256: source.sourceSha256,
    sourceDigestScope: "file",
    explanatory: false,
    notice: `Exact ${status.toLowerCase()} Rust ablation source, pinned to the promoted core commit and full-file SHA-256. Historical timing is attributed separately and is not presented as byte-identical unless its archived digest matches. ${source.detail}`,
  };
}

function loweringSupported(bundle: SourceBundle): boolean {
  return bundle.rustContract.includes(
    `${bundle.loweringConstant}: bool = true`,
  );
}

function productionRunCommand(evidence: AdvancedRustEvidence): string {
  return [
    `# ${evidence.label}: ordinary Rust -> LLVM -> COV6 HSACO -> HSA numerical check`,
    `# Required symbol ISA: ${evidence.requiredIsa.join("; ")}`,
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
      "Compiler-derived binding: pending",
      "Rust-produced LLVM SHA-256: pending",
      "Rust-produced HSACO SHA-256: pending",
      "Rust numerical result: pending",
      "Acceptance tolerance: pending",
    ];
  }
  return [
    ...common,
    "Evidence status: observed",
    `Artifact source commit: ${evidence.sourceCommit}`,
    `Artifact source tree: ${evidence.sourceTree}`,
    `Compiler-derived binding: ${evidence.namespace}`,
    `Rust-produced LLVM SHA-256: ${evidence.llvmSha256}`,
    `Rust-produced HSACO SHA-256: ${evidence.hsacoSha256}`,
    `Symbol-scoped ISA SHA-256: ${evidence.isaSha256}`,
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
    const campaign = observed[0];
    if (
      campaign === undefined ||
      !observed.every(
        (entry) =>
          entry.sourceCommit === campaign.sourceCommit &&
          entry.sourceTree === campaign.sourceTree,
      )
    ) {
      throw new Error(`Mixed advanced evidence campaigns for ${spec.id}`);
    }
    return {
      kind: "gpu-observed",
      label: `Production Rust ${spec.sourceRole} observed on MI350X`,
      detail: `At retained campaign commit ${campaign.sourceCommit}, every ordinary attributed Rust kernel in this lesson passed production extraction, ${advancedProductionTarget} LLVM and COV6 finalization, symbol-scoped ISA inspection, and its digest-pinned HSA numerical comparison on mi350. The code tab separately pins the current promoted source at ${advancedCoreSourceCommit}. ${observed.map((entry) => `${entry.label}: ${entry.numericalResult}`).join("; ")}. This bounded observation is not a formal source-to-machine proof, protected publication, or full-model result.`,
      reference: historicalReference(
        campaign.sourceCommit,
        campaign.sourceTree,
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
          note: `Historical bounded raw-HSA MI350X observations at ${campaign.sourceCommit}. The displayed promoted source is pinned independently. Formal refinement, protected publication authority, and protected Worker V3 native-build evidence remain separate.`,
        },
      ),
    };
  }
  return {
    kind: "source-example",
    label: "Production Rust pipeline integrated; mi350 record pending",
    detail: `The lesson displays the ordinary attributed Rust kernels and independent safe CPU references. Each kernel has a dedicated production ${advancedProductionTarget} runner and digest-pinned HSA harness entry. Measured compiler-derived bindings, LLVM/HSACO digests, numerical results, and GPU-observed authority remain fail-closed until the mi350 campaign is recorded.`,
  };
}

function advancedTabs(spec: AdvancedLessonSpec): CodeTab[] {
  const bundle = sourceBundle(spec.bundle);
  const hipSymbols = spec.hipSymbols ?? [];
  const productionEvidence = advancedEvidenceFor(spec.rustSymbols);
  const allObserved =
    loweringSupported(bundle) &&
    productionEvidence.every(isObservedAdvancedEvidence);
  const rustFragments = spec.rustSymbols.map((symbol) =>
    rustFunctionExcerpt(bundle.rustKernel, symbol, true),
  );
  if (spec.id === "gfx950-kda-gdn-linear-attention") {
    rustFragments.unshift(
      rustMacroExcerpt(bundle.rustKernel, "kda_chunk_wy_v1"),
    );
  }
  const referenceFragments = spec.referenceSymbols.map((symbol) =>
    rustFunctionExcerpt(bundle.rustReference, symbol, false),
  );
  if (spec.id === "gfx950-kda-gdn-linear-attention") {
    referenceFragments.unshift(
      rustPrivateFunctionExcerpt(
        bundle.rustReference,
        "kda_matrix_step_f64_v2",
      ),
    );
  }
  const variantTabs = (spec.variantSources ?? []).map(variantSourceTab);
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
    ...variantTabs,
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
    ...(hipSymbols.length > 0
      ? [
          {
            kind: "comparison" as const,
            label: "Equivalent HIP",
            language: "cpp" as const,
            code: exactHipKernelExcerpts(
              bundle.hipSource,
              bundle.hipSourcePath,
              hipSymbols,
            ),
            sourcePath: bundle.hipSourcePath,
            sourceSha256: bundle.hipSourceSha256,
            explanatory: true,
            notice: `Comparison-only HIP fixture. Its ${spec.isaRequirements.join("; ")} and historical runtime are independent of the Rust-produced LLVM, HSACO, and HSA run records.`,
          },
        ]
      : []),
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
      notice:
        "Obligation ledger only; no proof transcript or correctness certificate is claimed.",
    },
    {
      kind: "host",
      label: "Run and inspect",
      language: "bash",
      code: `# In the pinned fe2o3 core checkout at ${advancedCoreSourceCommit}.\n# Each command extracts one ordinary Rust kernel, checks its compiler binding,\n# emits ${advancedProductionTarget} LLVM, finalizes COV6 HSACO, inspects symbol-scoped\n# ISA, and launches the digest-pinned CPU-oracle comparison on a gfx950 GPU.\n${productionEvidence.map(productionRunCommand).join("\n\n")}\n\n# Package-wide host source and CPU-reference tests.\ncargo test --offline --manifest-path ${bundle.manifestPath}${hipSymbols.length > 0 ? `\n\n# Comparison only: the separate HIP suite is not used by any Rust runner.\nbash ${bundle.manifestPath.replace("/Cargo.toml", "/build_and_test.sh")}\n\n# Exact mirrored comparison-only HIP build script:\n${bundle.build}\n\n# Exact comparison-only HIP ISA checker:\n${bundle.isa}` : "\n\n# No equivalent HIP fixture is published for this Rust kernel."}`,
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
          ...(hipSymbols.length > 0
            ? [
                "SEPARATE COMPARISON-ONLY HIP LANE",
                `HIP source: ${bundle.hipSourcePath}`,
                `HIP symbols: ${hipSymbols.join(", ")}`,
                `HIP source SHA-256: ${bundle.hipSourceSha256}`,
                `HIP code-object SHA-256: ${bundle.hipHsacoSha256}`,
                `HIP compiler observation: ${bundle.compiler}; ./build_and_test.sh.`,
                `HIP runtime observation: ${bundle.runtime}.`,
                `HIP ISA observation: ${spec.isaRequirements.join("; ")}.`,
                `HIP CPU-oracle observation: ${spec.observedResults.join("; ")}.`,
                `Input/error policy: ${bundle.inputPolicy}.`,
                "The HIP artifact is an independent comparison. It does not produce, bind, or authorize any Rust artifact.",
              ]
            : [
                "NO COMPARISON-ONLY HIP LANE",
                "No equivalent HIP fixture is published for this Rust kernel; the displayed Rust source, produced artifacts, and independent CPU oracle are the only implementation evidence.",
              ]),
        ].join("\n"),
      ),
      explanatory: true,
      notice: allObserved
        ? hipSymbols.length > 0
          ? "The pinned production Rust artifacts and MI350X runs support only these bounded GPU-observed claims. HIP remains a separate comparison; proof, performance, protected publication, and full-model claims are not promoted."
          : "The pinned production Rust artifacts and MI350X run support only this bounded GPU-observed claim. No equivalent HIP fixture is published; proof, performance, protected publication, and full-model claims are not promoted."
        : hipSymbols.length > 0
          ? "Production evidence is intentionally pending until every displayed kernel has an exact mi350 compiler-derived binding, LLVM/HSACO digest, ISA record, and numerical result. HIP remains a separate comparison lane."
          : "Production evidence is intentionally pending until the displayed kernel has an exact mi350 compiler-derived binding, LLVM/HSACO digest, ISA record, and numerical result. No equivalent HIP fixture is published.",
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

const gptOssKernelSymbol = "gfx950_gpt_oss_120b_decode_megakernel_v1";
const gptOssKernelExcerpt = rustFunctionExcerpt(
  gptOssRustKernel,
  gptOssKernelSymbol,
  true,
);
const gptOssReferenceExcerpt = rustFunctionExcerpt(
  gptOssRustReference,
  "reference",
  false,
);
const gptOssSourceCommit = advancedCoreSourceCommit;
const gptOssSourceTree = advancedCoreSourceTree;
const gptOssCompatibilityCandidate = advancedEvidenceFor([
  gptOssKernelSymbol,
])[0];
if (
  gptOssSourceTree === null ||
  gptOssCompatibilityCandidate === undefined ||
  !isObservedAdvancedEvidence(gptOssCompatibilityCandidate)
) {
  throw new Error("Missing final GPT-OSS compatibility evidence");
}
const gptOssCompatibility = gptOssCompatibilityCandidate;
const gptOssHistoricalCampaignCommit =
  "c1383e97db732f9f1ff8105f10d5c2b5971143e1";
const gptOssHistoricalCampaignTree = "42385e6464ca40318fc70ae104845d3997844140";
const gptOssVariantSources: VariantSourceSpec[] = [
  {
    label: "Serial router ablation",
    status: "compatibility-validated",
    code: gptOssRouterSerial,
    sourcePath: "examples/gfx950_gpt_oss_decode/src/kernel_router_serial.rs",
    sourceSha256:
      "fdee28b13856ecc5464839273f58966e6663d27975ede2d6b78c9a8b888808f5",
    detail:
      "This WG256/grid4 serial-router source passed the current 16-item compatibility campaign; the da6 timing record retains its own historical single-wave source digest (3f9fe7...).",
  },
  {
    label: "Held-fragment ablation",
    status: "compatibility-validated",
    code: gptOssHeldFragments,
    sourcePath: "examples/gfx950_gpt_oss_decode/src/kernel_held_fragments.rs",
    sourceSha256:
      "2309c35e55b4980c54acb607499767251d73d7ad7e56e802e5cf5ae43af1a021",
    detail:
      "This WG256/grid4 held-fragment source passed the current 16-item compatibility campaign; the da6 timing record retains its own historical single-wave source digest (081ee7...).",
  },
  {
    label: "Interleaved-store ablation",
    status: "compatibility-validated",
    code: gptOssInterleavedStores,
    sourcePath:
      "examples/gfx950_gpt_oss_decode/src/kernel_interleaved_stores.rs",
    sourceSha256:
      "3a34845ea4c82d1de356a3f64f8f3ee15467a8cb01ebc773623814f8af0e7a19",
    detail:
      "This WG256/grid4 interleaved-store source passed the current 16-item compatibility campaign; the da6 timing record retains its own historical single-wave source digest (41e8ce...).",
  },
  {
    label: "Materialized components",
    status: "compatibility-validated",
    code: gptOssComponents,
    sourcePath: "examples/gfx950_gpt_oss_decode/src/kernel_components.rs",
    sourceSha256:
      "d83b12f14f5c5ce58834a48665f7e955210cab30dabf8476c16274d8748e5c64",
    detail:
      "This current file contains the router, attention, and expert exports validated at WG256/grid4 over 16 items; the da6 timing record retains its own historical single-wave source digest (fd2b80...).",
  },
  {
    label: "BF16 LDS pipeline",
    status: "compiler-rejected",
    code: gptOssPipelinedAttention,
    sourcePath:
      "examples/gfx950_gpt_oss_decode/src/kernel_pipelined_attention.rs",
    sourceSha256:
      "faf9bc589658b1381e1042c71b952881488261cc85ff86c21dbb7f1f1a83a460",
    detail:
      "The WG256/grid4 two-stage implementation was compiler-rejected because its retained pipeline scalar temporary has multiple definitions; it has no HSACO, numerical result, or latency result.",
  },
  {
    label: "Scalar attention",
    status: "compiler-rejected",
    code: gptOssScalarAttention,
    sourcePath: "examples/gfx950_gpt_oss_decode/src/kernel_scalar_attention.rs",
    sourceSha256:
      "e2e326a500c92bf1cbd33acb364f707bf339a54ee3259b79875c079a9f967c96",
    detail:
      "The WG256/grid4 scalar-attention candidate was compiler-rejected because a call terminator is reached before exact callable memory-effect summaries are available; it has no HSACO, numerical result, or latency result.",
  },
];
const gptOssPerformance = advancedPerformanceTabFor(
  "gfx950-gpt-oss-120b-megakernel",
);
if (!gptOssPerformance) throw new Error("Missing GPT-OSS performance evidence");

const gptOssMegakernelLesson: Lesson = {
  id: "gfx950-gpt-oss-120b-megakernel",
  module: 10,
  order: 9,
  title: "gpt-oss-120b 16-item layer-tile megakernel",
  summary:
    "Inspect a real safe-Rust gfx950 launch whose four WG256 workgroups run 16 independent Wave64 layer tiles, each fusing 128-way routing, one sink-softmax GQA tile, and one dynamically selected MXFP4 expert projection; historical single-wave timing is kept separate.",
  duration: "60 min",
  prerequisites: [
    "gfx950 advanced MoE pipeline",
    "gfx950 flash attention",
    "BF16 and MXFP4 MFMA fragments",
    "Paired latency experiments",
  ],
  objectives: [
    "Trace stable top-4 routing, sink-softmax attention, and selected-expert MXFP4 work through four waves per workgroup and four workgroups.",
    "Verify global-wave item ownership gives all 16 items disjoint inputs, blocked output tiles, and packed-route slots.",
    "Relate sequential MXFP4 fragment consumption to the historical single-wave VGPR and latency reduction without treating it as a current-grid measurement.",
  ],
  claims: [
    {
      kind: "gpu-observed",
      label:
        "MI350X WG256/grid4 compatibility for the current kernel and oracle",
      detail: `The current ordinary Rust source produced gfx950 LLVM and COV6 HSACO, then passed the bounded HSA oracle on physical GPU 6 at workgroup 256, grid 4, and 16 useful Wave64 items. It checked 4,096 attention outputs with maximum absolute error 1.192092896e-7, 4,096 exact expert outputs, and 1,024 exact packed-route words. The separate c138 single-wave performance archive measured fused 1.064644 ms versus its HIP three-dispatch comparator at 0.780362 ms, so that historical fused artifact was 1.3643x slower. Neither record is a fastest or state-of-the-art claim.`,
      reference: historicalReference(
        gptOssSourceCommit,
        gptOssSourceTree,
        [
          "bash examples/gfx950_gpt_oss_decode/run-gfx950.sh",
          "bash examples/gfx950_gpt_oss_decode/run-unfused-gfx950.sh",
          "bash perf-evidence/run-gpt-oss-performance.sh",
        ],
        [
          "examples/gfx950_gpt_oss_decode/src/kernel.rs",
          "examples/gfx950_gpt_oss_decode/src/reference.rs",
          "examples/gfx950_gpt_oss_decode/src/lib.rs",
          "examples/gfx950_gpt_oss_decode/README.md",
          "examples/gfx950_gpt_oss_decode/run-gfx950.sh",
          "examples/gfx950_gpt_oss_decode/run-unfused-gfx950.sh",
          "examples/gfx950_gpt_oss_decode/gpt_oss_unfused.hip",
          "perf-evidence/run-gpt-oss-performance.sh",
          "perf-evidence/gpt-oss-layer-tile-evidence-v1.json",
          advancedHarnessPath,
        ],
        {
          target: advancedProductionTarget,
          note: "Evidence boundary: current compatibility covers 16 independent Wave64 layer tiles at WG256/grid4, while performance remains the separately archived c138 single-wave campaign. Neither record covers a complete layer, whole model, fastest result, or state of the art.",
        },
      ),
    },
  ],
  sections: [
    narrativeSection("gfx950-gpt-oss-120b-megakernel/layer-tile-contract"),
    narrativeSection("gfx950-gpt-oss-120b-megakernel/performance-boundary"),
  ],
  tabs: [
    {
      kind: "kernel",
      label: "Rust kernel",
      language: "rust",
      code: gptOssKernelExcerpt,
      sourcePath: "examples/gfx950_gpt_oss_decode/src/kernel.rs",
      sourceCommit: gptOssSourceCommit,
      sourceSha256:
        "fdc428f33edbcebe6ca7764c537db58e68009115d740fc21a8252253db8d4081",
      sourceDigestScope: "displayed",
      sourceFragments: [gptOssKernelExcerpt],
      explanatory: false,
      notice:
        "Exact ordinary attributed WG256/grid4 Rust from the current mirrored core source. Its file SHA-256 is e731c38f983434aace7b4a89c17e176a058dab8eea9f05e7223e4cb097997423.",
    },
    ...gptOssVariantSources.map(variantSourceTab),
    {
      kind: "reference",
      label: "Safe CPU reference",
      language: "rust",
      code: gptOssReferenceExcerpt,
      sourcePath: "examples/gfx950_gpt_oss_decode/src/reference.rs",
      sourceCommit: gptOssSourceCommit,
      sourceSha256:
        "f4f361e44d8cf56348d1189aa012ebeb2a83efc1833eaa110ea4f095ce22bd84",
      sourceDigestScope: "displayed",
      sourceFragments: [gptOssReferenceExcerpt],
      explanatory: false,
      notice:
        "Exact independent 16-item CPU oracle from the current mirrored core source. Its file SHA-256 is 5ac168adad32e821164947d3baa57d78cf813332b8a265e992263964e556628d.",
    },
    {
      kind: "comparison",
      label: "Archived c138 unfused HIP",
      language: "cpp",
      code: gptOssUnfusedHip,
      sourcePath: "examples/gfx950_gpt_oss_decode/gpt_oss_unfused.hip",
      sourceCommit: gptOssSourceCommit,
      sourceSha256:
        "902d38e7a6b974f95c6d3420a069ee6400b52b9eb7f24f4cfb9f5eeae147a09b",
      explanatory: true,
      notice:
        "Archived c138 HIP three-dispatch router, attention, and expert comparator with the same fixed inputs and output oracle. It is distinct from the da6 exact Rust component-materialization ablation and is not a framework or whole-model baseline.",
    },
    {
      kind: "verus",
      label: "Proof obligations",
      language: "text",
      code: [
        "NO VERUS RESULT IS CLAIMED FOR THIS RUST SOURCE.",
        "",
        "- prove the stable lower-expert-ID top-4 tie rule over all 128 router logits",
        "- prove sink-softmax bounds and canonical padding-row semantics",
        "- prove the selected expert offset and all four MXFP4 block offsets stay in range",
        "- prove global Wave64 identity maps 16 items to disjoint input slices",
        "- prove disjoint ownership of 4,096 attention, 4,096 expert, and 1,024 packed-ID outputs",
        "- bind source, Kernel IR, LLVM, ISA, artifact, ABI, and launch identity",
        "- keep whole-layer and whole-model equivalence outside this fixed tile",
      ].join("\n"),
      explanatory: true,
      notice: "Obligation ledger only; no source-to-machine proof is claimed.",
    },
    {
      kind: "host",
      label: "Build, compare, and measure",
      language: "bash",
      code: [
        "# Production Rust extraction, gfx950 COV6 finalization, ISA checks, and HSA oracle",
        "bash examples/gfx950_gpt_oss_decode/run-gfx950.sh",
        "",
        "# Archived c138 HIP three-dispatch comparator",
        "bash examples/gfx950_gpt_oss_decode/run-unfused-gfx950.sh",
        "",
        "# Five-process alternating AB/BA performance campaign",
        "bash perf-evidence/run-gpt-oss-performance.sh",
        "",
        "# Exact mirrored production runner",
        gptOssRunFused,
        "",
        "# Exact mirrored comparator runner",
        gptOssRunUnfused,
        "",
        "# Exact mirrored performance orchestrator",
        gptOssPerformanceRunner,
      ].join("\n"),
      explanatory: true,
      notice:
        "Run on ssh mi350 with the documented ROCR_VISIBLE_DEVICES setting. Current WG256/grid4 compilation, ISA, and numerical evidence was observed on physical GPU 6. Retained timing numbers come only from the historical single-wave c1383e97 campaign and do not measure the current launch geometry.",
    },
    {
      kind: "result",
      label: "Evidence record",
      language: "text",
      code: resultText(
        "gpu-observed",
        [
          "GPT-OSS-120B BATCH-1 LAYER-TILE MEGAKERNEL",
          "Scope: WG256/grid4, four Wave64 items per workgroup and 16 independent batch-1 layer tiles; not a complete layer or whole-model kernel",
          "Kernel symbol: " + gptOssKernelSymbol,
          "Displayed source commit: " + gptOssSourceCommit,
          "Displayed source tree: " + gptOssSourceTree,
          "Kernel file SHA-256: e731c38f983434aace7b4a89c17e176a058dab8eea9f05e7223e4cb097997423",
          "Reference file SHA-256: 5ac168adad32e821164947d3baa57d78cf813332b8a265e992263964e556628d",
          "Historical campaign commit: " + gptOssHistoricalCampaignCommit,
          "Historical campaign tree: " + gptOssHistoricalCampaignTree,
          "Current WG256/grid4 compiler binding: " +
            gptOssCompatibility.namespace,
          "Current WG256/grid4 LLVM SHA-256: " + gptOssCompatibility.llvmSha256,
          "Current WG256/grid4 HSACO SHA-256: " +
            gptOssCompatibility.hsacoSha256,
          "Current WG256/grid4 ISA SHA-256: " + gptOssCompatibility.isaSha256,
          "Current serial-router binding/HSACO: 0d3dd5be58c3fc42b575a9028359d3be63f5f86dffd8261a24564c09ec8c77f7 / 26515f0bd0539030f076efaf88bf52c11c13fcb6acd13997bf822a207d559722",
          "Current held-fragment binding/HSACO: 94f0b2a229e36aa690afd63d7523b549390d6b62a7829a41940ee410da3f30db / 258f002896efe9315a84db491a273f651d1cb6320b0e705e3b5a14e50859b215",
          "Current interleaved-store binding/HSACO: cbd2a9d218b865e59afdd868c38db0aa034933cf224bb1928b6b7873a10261e0 / b0447014a5e5c46d2c4efc862349be399100c7357a958c5b72d1a26c77c57ac6",
          "Current router-component binding/HSACO: eab1554fa8b5ca3dd61c081c2a94fe5b3a8dacbe6e263ce5ebecbc68138f980e / 9ca3a3db0dd64f0de7a1a56b560fe097e826c6448817f749a7117c1016b10bc6",
          "Current attention-component binding/HSACO: 7e4af27e8a08344360c28b8c9b735ef8c5aa55a0807601bac5042f6f59b951b1 / fe61d17d8679f3dde03e9ef19cacb7e0e9a2475d69eebf4a6f2803cbc194e336",
          "Current expert-component binding/HSACO: a5299095f8322658479d027ef414fc05add7e9079610ae41797eb31507097ed7 / 3265642593dc75200cb4e078f9d8c456705b71857c8607e7eb3f491658519cb5",
          "ABI: kernarg=208 bytes; workgroup=256x1x1; grid=4x1x1; static LDS=0 bytes",
          "ISA: exactly four v_mfma_f32_16x16x16_bf16 and four FP4 v_mfma_f32_16x16x128_f8f6f4; no transpose instructions",
          "Current numerical result: attention outputs=4096 max_absolute_error=1.192092896e-7; expert outputs=4096 exact; packed top-4 exact_u32_outputs=1024",
          "Current WG256/grid4 wrapper: passed 2026-09-04 on MI350X gfx950 physical GPU 6",
          "Historical single-wave performance wrapper: passed at c1383e97 on MI350X gfx950",
          "Historical single-wave fused median: 1.064644 ms [1.064483, 1.064844] ms",
          "Historical single-wave fused p5/p95: 1.059803 / 1.069283 ms",
          "Archived c138 HIP three-dispatch median: 0.780362 ms [0.780243, 0.780482] ms",
          "Archived c138 HIP three-dispatch p5/p95: 0.778162 / 0.783123 ms",
          "Archived c138 HIP three-dispatch/fused ratio: 0.732979",
          "Outcome: fused is 1.3643x slower",
          "Fastest claim: not claimed",
          "State-of-the-art claim: not claimed",
          "Formal source-to-machine proof: not claimed",
          "Whole-model equivalence: not claimed",
        ].join("\n"),
      ),
      explanatory: true,
      notice:
        "The current MI350X compatibility result applies to WG256/grid4 and 16 independent items. Every latency number remains pinned to the separate historical c138 single-wave archive and does not measure this launch geometry. Neither establishes whole-model performance, fastest status, or state of the art.",
    },
    gptOssPerformance,
  ],
  diagram: "moe",
  exercises: [
    {
      prompt:
        "Explain why the fused batch-1 tile loses to the archived c138 HIP three-dispatch comparator despite removing two dispatches.",
      hint: "Use the historical 352-to-308 VGPR ablation, the 1.5 MB per-item router stream, the former one-workgroup occupancy, and the serial dependency chain.",
      acceptance:
        "The answer cites the measured 1.3643x slowdown, separates the 14.1268% within-fused gain from the fused/unfused comparison, and makes no fastest or state-of-the-art claim.",
    },
  ],
  glossary: [
    "gfx950",
    "GPT-OSS-120B",
    "megakernel",
    "mixture of experts",
    "resource floor",
  ],
};
const advancedLessons = [
  lesson({
    id: "gfx950-advanced-moe",
    order: 0,
    title: "gfx950 advanced MoE pipeline",
    summary:
      "Trace batch-local token-to-expert dispatch, local expert compute, and weighted combine across WG256/grid4 without implying a production serving path.",
    duration: "48 min",
    bundle: "systems",
    sourceRole:
      "stable top-2 metadata, all-expert MFMA, host-staged rank partial, and combine teaching kernels",
    rustSymbols: [
      "gfx950_moe_route_fp4_t16_e4_k2_v1",
      "gfx950_moe_expert_rank_fp4_fp8_v1",
      "gfx950_combine_expert_ranks_v1",
    ],
    rustExcerptSha256:
      "602cd981600e8cad37cc9e73f1dca9ecf83b250679113ef02da0a24306e136ff",
    referenceSymbols: [
      "moe_routing_reference",
      "batched_moe_routing_reference",
      "moe_rank_reference",
      "batched_moe_rank_reference",
    ],
    referenceExcerptSha256:
      "49826130508e509b46cb0d56dd746e49ddf60b470c19243dd9adc9b7d51c041f",
    hipSymbols: [
      "gfx950_fused_fp4_fp8_moe",
      "gfx950_expert_parallel_rank",
      "gfx950_combine_expert_ranks",
    ],
    fixedShape:
      "WG256/grid4; route and expert run 16 independent Wave64 batches of 16 tokens, while combine runs four independent 256-element workgroup batches",
    isaRequirements: [
      "all three lesson symbols are present",
      "gfx950_fused_fp4_fp8_moe contains exactly one v_mfma_f32_16x16x128_f8f6f4 with cbsz:4",
      "gfx942 compilation is rejected",
    ],
    observedResults: [
      "MI350 WG256/grid4 route: 512 expert IDs exact, 512 weights max_error=2.980232239e-8, 64 expert counts exact, 2048 dispatch entries exact",
      "MI350 WG256/grid4 expert: four rank/shared plans x 4096 outputs; max_error=9.536743164e-7,4.768371582e-7,0,0",
      "MI350 WG256/grid4 combine: 1024 outputs, max_error=0",
    ],
    prerequisites: [
      "gfx950 FP8 GEMM",
      "MoE routing",
      "Grouped GEMM",
      "Stable route ownership",
    ],
    objectives: [
      "Separate stable top-2 routing, dispatch metadata, all-expert tile computation, and weighted combine contracts.",
      "Audit fixed token, expert, top-k, and hidden extents before inspecting generated ISA.",
      "Derive batch bases from global Wave64 or workgroup identity so every batch owns disjoint output slices without a grid barrier.",
      "Distinguish the bounded two-rank peer-copy fixture from production expert parallelism.",
    ],
    narratives: [
      "gfx950-advanced-moe/fixed-pipeline",
      "gfx950-advanced-moe/scope-evidence",
    ],
    obligations: [
      "all 32 top-2 routes have one in-range expert and one deterministic compact slot",
      "equal router logits choose the lower expert ID as in the CPU oracle",
      "expert output returns to exactly its originating token-route pair",
      "the weighted combine reads every accepted route once and writes every output once",
      "all 16 wave batches and four combine batches use batch-local inputs and disjoint output ownership",
    ],
    diagram: "moe",
    exercise: {
      prompt: "Add an exact router-logit tie oracle case.",
      hint: "Pin the lower-expert-ID tie rule for first and second selection, then inspect dispatch order.",
      acceptance:
        "The expected top-2 expert IDs, weights, per-expert counts, and compact route order are explicit for all 16 tokens.",
    },
    glossary: [
      "gfx950",
      "mixture of experts",
      "top-k",
      "capacity",
      "expert-major layout",
    ],
  }),
  lesson({
    id: "gfx950-kda-gdn-linear-attention",
    order: 1,
    title: "gfx950 Kimi Delta Attention decode and chunkwise prefill",
    summary:
      "Implement exact matrix-state KDA decode and a two-chunk WY/UT prefill, then validate both against an independent sequential f64 recurrence on MI350X.",
    duration: "58 min",
    bundle: "attention",
    sourceRole:
      "exact matrix-state KDA decode and WY/UT chunkwise-prefill teaching kernels",
    rustSymbols: ["gfx950_kda_decode", "gfx950_kda_chunkwise_prefill"],
    rustExcerptSha256:
      "2f6be28d762205ac3dc82434e9151748da69b4587d3fb13feecf1b0b99f468c0",
    referenceSymbols: ["kda_decode_reference_v2", "kda_prefill_reference_v2"],
    referenceExcerptSha256:
      "9b693e07fa53fc0fdff9b235bffdb012987e336d63ca7cbeac8cac01cb5ac76d",
    fixedShape:
      "four independent heads; K=16; V=16; FP32 16x16 matrix state; decode T=1; prefill T=8 as two ordered C=4 WY/UT chunks; one full problem per WG256 at grid4",
    isaRequirements: [
      "gfx950_kda_decode contains ds_bpermute_b32 Wave16 reductions and no MFMA or transpose instructions",
      "gfx950_kda_chunkwise_prefill contains ds_bpermute_b32 Wave16 reductions and no MFMA or transpose instructions",
    ],
    observedResults: [
      "decode final_state max_absolute_error=2.980232239e-8",
      "decode replicated output max_absolute_error=7.450580597e-9",
      "prefill final_state max_absolute_error=1.490116119e-8",
      "prefill chunk outputs max_absolute_error=7.450580597e-9",
    ],
    prerequisites: [
      "Linear attention",
      "Delta-rule updates",
      "Lower-triangular solves",
      "Wave16 reductions",
    ],
    objectives: [
      "Derive the exact decayed matrix, prediction error, rank-one update, and scaled query projection for decode.",
      "Expand the four-token WY/UT lower-triangular solve and carry its resulting matrix state into a second chunk.",
      "Reconcile logical S[K,V], physical H[V,K], and the replicated output layout required by checked Index1D ownership.",
      "Use the sequential f64 matrix recurrence as an oracle independent of the GPU chunk transform.",
    ],
    narratives: [
      "gfx950-kda-gdn-linear-attention/recurrence",
      "gfx950-kda-gdn-linear-attention/scope-evidence",
    ],
    obligations: [
      "q and k are L2-normalized, alpha and beta are already activated, and q is scaled by 1/sqrt(16) inside the kernel",
      "the logical S[K,V] recurrence and physical H[V,K] state layout are related by an explicit transpose",
      "the prefill source implements the C=4 WY/UT equations rather than merely grouping a sequential token loop",
      "the f64 CPU oracle executes eight independent scalar recurrence steps and records the state after token three",
      "every replicated logical output, state element, immutable input, poison value, and guard canary is checked",
      "input/output/state aliases are excluded unless the source explicitly supports them",
    ],
    diagram: "attention",
    exercise: {
      prompt:
        "Trace a two-token KDA update for one value column, then identify the C=4 WY terms that generalize it.",
      hint: "Start from D_t=diag(alpha_t)S_{t-1}, e_t=v_t-k_t^T D_t, and S_t=D_t+beta_t k_t e_t^T.",
      acceptance:
        "The trace preserves matrix orientation, applies q/sqrt(16) after the update, and distinguishes the sequential oracle from the chunk transform.",
    },
    glossary: [
      "gfx950",
      "Kimi Delta Attention",
      "matrix state",
      "WY representation",
      "UT transform",
      "Wave16",
    ],
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
    rustExcerptSha256:
      "8af6b4374d55d1cda9a8c5b8488df3b29dd280690fcf5f643d0d3a7776fd21bd",
    referenceSymbols: ["content_sparse_attention_reference_v1"],
    referenceExcerptSha256:
      "813fce6fee60239b9c2ee8aa0c66958680595bfa66162d27b95f7cde7ca2dad9",
    hipSymbols: ["gfx950_content_sparse_attention"],
    fixedShape:
      "16 independent Wave64 heads at WG256/grid4; each has 16 tokens, head dimension 128, 16 value channels, top two four-token blocks, top three tokens, and one private 2 KiB LDS tile",
    isaRequirements: [
      "gfx950_content_sparse_attention contains exactly four ds_read_b64_tr_b8 before one v_mfma_f32_16x16x128_f8f6f4",
    ],
    observedResults: [
      "48 selected IDs exact across 16 non-identical heads",
      "256 outputs max_absolute_error=5.820766091e-11",
    ],
    prerequisites: [
      "gfx950 flash attention",
      "Gather bounds",
      "Masking",
      "Online softmax",
    ],
    objectives: [
      "Trace deterministic top-two block and top-three token selection into the active score mask.",
      "Keep content-score selection, selected token IDs, packed fragment layout, and logical attention order distinct.",
      "Confirm that unselected tokens contribute neither to the maximum, denominator, nor value numerator.",
    ],
    narratives: [
      "gfx950-indexed-sparse-attention/index-contract",
      "gfx950-indexed-sparse-attention/scope-evidence",
    ],
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
      acceptance:
        "The expected three unique token IDs and active softmax domain are explicit for each tie case.",
    },
    glossary: [
      "gfx950",
      "indexed sparse attention",
      "gather contract",
      "duplicate semantics",
      "masking",
    ],
  }),
  lesson({
    id: "gfx950-deepseek-sparse-attention",
    order: 3,
    title: "gfx950 DeepSeek sparse attention",
    summary:
      "Consume Lightning Indexer top-k token IDs, evaluate only the selected KV rows, and expose stable softmax state through a production Rust-to-gfx950 path.",
    duration: "50 min",
    bundle: "attention",
    sourceRole:
      "DeepSeek sparse selected-QK, stable softmax, and selected-PV teaching kernel",
    rustSymbols: ["gfx950_deepseek_sparse_attention"],
    rustExcerptSha256:
      "124bb602771c522b38bba672e1f6fd4bc572e3ac2a943f7178443d31713bdc61",
    referenceSymbols: ["deepseek_sparse_attention_reference_v1"],
    referenceExcerptSha256:
      "6b2c81b68e6cdbf1f328ba6a061407113882457624067f2a0be679f26eb57a5f",
    fixedShape:
      "64 independent Wave16 heads at WG256/grid4; each has one FP32 query with head dimension 128, 16 FP32 KV rows, 16 FP32 value channels, and four scalar top-k index slots",
    isaRequirements: [
      "gfx950_deepseek_sparse_attention contains no MFMA or transpose instructions because it evaluates only the admitted sparse rows",
    ],
    observedResults: [
      "1,024 outputs max_absolute_error=5.215406418e-8",
      "64 maxima max_absolute_error=1.490116119e-7; 64 normalizers max_absolute_error=4.768371582e-7",
    ],
    prerequisites: [
      "gfx950 flash attention",
      "DeepSeek Lightning Indexer",
      "Caller-provided sparse indices",
      "Stable softmax",
      "Wave16 reductions",
    ],
    objectives: [
      "Separate learned Lightning Indexer selection from the sparse-attention kernel that consumes its top-k token IDs.",
      "Trace invalid sentinels, duplicate rejection, selected-only QK scores, stable softmax, and selected-only PV accumulation.",
      "Explain the lane mapping, explicit depth unroll, structured views, subgroup reductions, and single-subgroup output ownership used by the gfx950 lowering.",
      "Reconstruct log-sum-exp from the emitted softmax maximum and normalizer without widening the fixed teaching profile.",
    ],
    narratives: [
      "gfx950-deepseek-sparse-attention/selected-domain",
      "gfx950-deepseek-sparse-attention/scope-evidence",
    ],
    obligations: [
      "at least one of the four scalar index slots names a token in 0..16",
      "valid token IDs are unique; out-of-range values are invalid sentinels and never address K or V",
      "only selected rows contribute to the score maximum, softmax normalizer, and value numerator",
      "the FP32 output, softmax maximum, and softmax normalizer each have one final in-range owner",
      "the independent CPU oracle applies the same stable selected-domain softmax and finite-value policy",
    ],
    diagram: "attention",
    exercise: {
      prompt:
        "Extend the oracle matrix with every invalid-slot position and a permuted valid top-k order.",
      hint: "The output is invariant to valid-index order, but duplicate valid IDs and an all-invalid list must still be rejected.",
      acceptance:
        "Each case pins output, maximum, and normalizer behavior and distinguishes invalid sentinels from forbidden duplicate valid tokens.",
    },
    glossary: [
      "gfx950",
      "DeepSeek Sparse Attention",
      "Lightning Indexer",
      "top-k gather",
      "selected softmax",
      "log-sum-exp state",
    ],
  }),
  lesson({
    id: "gfx950-compressed-hybrid-attention",
    order: 4,
    title: "gfx950 compressed hybrid attention",
    summary:
      "Combine one bounded compressed-state branch with one bounded direct-attention branch under an explicit fusion rule.",
    duration: "48 min",
    bundle: "attention",
    sourceRole:
      "compressed-state, direct-attention, and hybrid fusion teaching kernels",
    rustSymbols: ["gfx950_compressed_hybrid_attention"],
    rustExcerptSha256:
      "f1d09336b950f0a71e8fc81beeff438ce19ba045c46d6865db833175fba0b1e1",
    referenceSymbols: ["compressed_hybrid_attention_reference_v1"],
    referenceExcerptSha256:
      "afe790e4c83988aae90763d6dccd394b265017ba72d6e4024b6f7b794e8d08db",
    hipSymbols: ["gfx950_compressed_hybrid_attention"],
    fixedShape:
      "16 independent Wave64 heads at WG256/grid4; each has 16 tokens, head dimension 128, 16 value channels, three compressed four-token blocks, a four-token local window, and one private 2 KiB LDS tile",
    isaRequirements: [
      "gfx950_compressed_hybrid_attention contains exactly four ds_read_b64_tr_b8 before one v_mfma_f32_16x16x128_f8f6f4",
    ],
    observedResults: ["256 outputs max_absolute_error=5.960464478e-8"],
    prerequisites: [
      "Linear attention",
      "Sparse attention",
      "State compression",
      "Numerical oracles",
    ],
    objectives: [
      "Describe the compressed and direct branches as separate fixed-shape contracts.",
      "Record the exact branch fusion order, weights, and accumulator precision.",
      "Separate local kernel behavior from end-to-end hybrid-model equivalence.",
    ],
    narratives: [
      "gfx950-compressed-hybrid-attention/fusion-contract",
      "gfx950-compressed-hybrid-attention/scope-evidence",
    ],
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
      acceptance:
        "Both isolated branches and the combined fixed case have independent expected outputs and tolerances.",
    },
    glossary: [
      "gfx950",
      "compressed attention",
      "hybrid attention",
      "fusion contract",
      "model equivalence",
    ],
  }),
  lesson({
    id: "gfx950-attnres-gr-mhc",
    order: 5,
    title: "gfx950 AttnRes, GR, and mHC mixing",
    summary:
      "Express bounded residual-stream selection, gating, and mixing as explicit tensor transforms with alias-safe stores.",
    duration: "40 min",
    bundle: "attention",
    sourceRole:
      "AttnRes, gated-residual, and mHC residual-mixing teaching kernels",
    rustSymbols: [
      "gfx950_attnres_aggregate",
      "gfx950_four_branch_residual",
      "gfx950_mhc_sinkhorn_mix",
    ],
    rustExcerptSha256:
      "d22caea2ef1cfdde6dfb6a13839886e4d74e43d90ebfef7334b5aadc696b84c7",
    referenceSymbols: [
      "attnres_aggregate_reference_v1",
      "four_branch_residual_reference_v1",
      "mhc_sinkhorn_mix_reference_v1",
    ],
    referenceExcerptSha256:
      "d3fa6ba2d5fb187aeb5bf304ba3b29327636f8ce6afbf9455adbcf2273a3382f",
    hipSymbols: [
      "gfx950_attnres_aggregate",
      "gfx950_four_branch_residual",
      "gfx950_mhc_sinkhorn_mix",
    ],
    fixedShape:
      "WG256/grid4: 64 Wave16 AttnRes and four-branch items, plus 16 Wave64 mHC items; each item has 16 channels and mHC uses three Sinkhorn iterations",
    isaRequirements: [
      "gfx950_attnres_aggregate contains v_exp_f32",
      "gfx950_four_branch_residual contains v_exp_f32",
      "gfx950_mhc_sinkhorn_mix contains v_exp_f32",
    ],
    observedResults: [
      "AttnRes 1,024 outputs max_absolute_error=4.470348358e-8",
      "four-branch 1,024 outputs max_absolute_error=1.490116119e-8",
      "mHC/Sinkhorn 1,024 outputs max_absolute_error=6.705522537e-8",
    ],
    prerequisites: [
      "Residual connections",
      "Tensor layouts",
      "Gating",
      "Aliasing contracts",
    ],
    objectives: [
      "Name the input streams, coefficient domain, mixing order, and output layout for each variant.",
      "Distinguish elementwise gates from stream-mixing matrices and normalization steps.",
      "Audit whether an in-place transform preserves unread residual inputs.",
    ],
    narratives: [
      "gfx950-attnres-gr-mhc/mixing-contract",
      "gfx950-attnres-gr-mhc/scope-evidence",
    ],
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
      acceptance:
        "The host rejects the alias or the kernel stages all required inputs before the first clobbering store.",
    },
    glossary: ["gfx950", "AttnRes", "GR", "mHC", "residual mixing"],
    variantSources: [
      {
        label: "Mixing ablations",
        status: "compatibility-validated",
        code: advancedAttentionAblation,
        sourcePath: "examples/gfx950_advanced_attention/src/ablation.rs",
        sourceSha256:
          "e5bd1cabc0d0e54610fb9b0e9ba3ac68843b6e442518a63776f1526023e19730",
        detail:
          "The current WG256/grid4 file is batch-wide compatibility validated. Every live alternate passed on 2026-09-03; the da6 timing record used archived single-workgroup bytes, so its timing is historical and is not attributed to this file.",
      },
    ],
  }),
  lesson({
    id: "gfx950-speculative-mtp-verification",
    order: 6,
    title: "gfx950 speculative and MTP verification",
    summary:
      "Verify 16 independent fixed-width candidate blocks across WG256/grid4 and compute deterministic accepted prefixes without claiming a serving scheduler or sampler.",
    duration: "44 min",
    bundle: "systems",
    sourceRole:
      "speculative-decoding and multi-token-prediction verification teaching kernels",
    rustSymbols: ["gfx950_speculative_transaction_v1"],
    rustExcerptSha256:
      "2730064fc70eca25fc1f18933ac2d71899f48a4467338a49cd9800e9fa2a5fcd",
    referenceSymbols: [
      "speculative_reference",
      "batched_speculative_reference",
    ],
    referenceExcerptSha256:
      "0e0f28117f664d0e54e85b853d442d68d36c280d442b6a428ed47d6510ae72b7",
    hipSymbols: ["gfx950_speculative_transaction"],
    fixedShape:
      "WG256/grid4 with 16 independent Wave64 batches; each batch has eight candidates, four draft steps, and eight state elements",
    isaRequirements: [
      "gfx950_speculative_transaction symbol is present",
      "gfx942 compilation is rejected for the complete suite",
    ],
    observedResults: [
      "MI350 WG256/grid4 accepted lengths: 128 values exact",
      "MI350 WG256/grid4 commit flags: 128 values exact",
      "MI350 WG256/grid4 transaction state: 1024 values, max_error=1.192092896e-7",
    ],
    prerequisites: [
      "Prefix scans",
      "Token logits",
      "Deterministic acceptance policy",
      "Gather bounds",
    ],
    objectives: [
      "Separate candidate gathering, target evaluation, acceptance predicates, and prefix length.",
      "Define the first-rejection rule and output ownership for a fixed candidate width.",
      "Use global Wave64 identity as the batch index and keep all candidate/state accesses batch local.",
      "Keep verification-kernel evidence separate from decoder and serving-system claims.",
    ],
    narratives: [
      "gfx950-speculative-mtp-verification/prefix-contract",
      "gfx950-speculative-mtp-verification/scope-evidence",
    ],
    obligations: [
      "each candidate position reads the declared token and target value in range",
      "the acceptance predicate and first-rejection rule are deterministic for the teaching inputs",
      "no position after the first rejection is reported as accepted",
      "accepted length, commit flag, and fixed output state have one final owner per candidate",
      "all 16 wave batches write disjoint accepted, commit, and state slices without grid synchronization",
    ],
    diagram: "reduction",
    exercise: {
      prompt:
        "Add all-accepted, first-rejected, and last-rejected prefix cases.",
      hint: "Compute the per-position predicate first, then the accepted prefix length.",
      acceptance:
        "The oracle covers all three boundaries and never treats independent accepted positions as a valid prefix.",
    },
    glossary: [
      "gfx950",
      "speculative decoding",
      "MTP",
      "accepted prefix",
      "verification kernel",
    ],
  }),
  lesson({
    id: "gfx950-ngram-embedding-gather",
    order: 7,
    title: "gfx950 N-gram hash-table gather",
    summary:
      "Resolve 16 independent N-gram query batches through batch-local priority tables across WG256/grid4.",
    duration: "36 min",
    bundle: "systems",
    sourceRole:
      "N-gram hash-table lookup and integer-value gather teaching kernel",
    rustSymbols: ["gfx950_qwen_ngram_gather_v1"],
    rustExcerptSha256:
      "ec93dc1a8b806b1c777a846517b42319b5dcfb5cc86d1fff4dda1b87d7d91b9c",
    referenceSymbols: ["ngram_reference", "batched_ngram_reference"],
    referenceExcerptSha256:
      "a15572e565a090dba9169056ede64caf7186815a48c618985f1f95bb129f51de",
    hipSymbols: ["gfx950_qwen_ngram_gather"],
    fixedShape:
      "WG256/grid4 with 16 independent Wave64 batches; each batch has eight queries, three-token N-grams, and 16 table slots",
    isaRequirements: [
      "gfx950_qwen_ngram_gather symbol is present",
      "gfx942 compilation is rejected for the complete suite",
    ],
    observedResults: [
      "MI350 WG256/grid4 gather: 128 integer outputs exact",
      "nonuniform batch-local tables cover hits, misses, collisions, duplicate priority, and lower-slot ties",
    ],
    prerequisites: [
      "Hash tables",
      "Indexed gathers",
      "Integer overflow checks",
      "Deterministic tie-breaking",
    ],
    objectives: [
      "Bound N-gram construction and table addressing without unchecked integer overflow.",
      "Define lookup miss, hash collision, exact key comparison, and priority tie behavior.",
      "Index queries and all table arrays from the global Wave64 batch while preserving one-writer output ownership.",
      "Keep the current integer table-value output distinct from a future embedding-vector gather.",
    ],
    narratives: [
      "gfx950-ngram-embedding-gather/gather-contract",
      "gfx950-ngram-embedding-gather/scope-evidence",
    ],
    obligations: [
      "token-window and N-gram identifier arithmetic cannot overflow its admitted integer type",
      "every resolved table row is in range or follows an explicit miss policy",
      "collisions and repeated identifiers have deterministic semantics",
      "the best matching slot returns exactly one integer table value, with -1 for a miss",
      "all 16 wave batches read batch-local tables and write disjoint eight-value result slices",
    ],
    diagram: "indexing",
    exercise: {
      prompt:
        "Add hash-collision, repeated-key, priority-tie, and lookup-miss oracle cases.",
      hint: "Make exact-key matching, priority ties, and the -1 miss value explicit before returning a table value.",
      acceptance:
        "Every query has one declared integer result and every table read is in range.",
    },
    glossary: [
      "gfx950",
      "N-gram",
      "hash-table gather",
      "lookup miss",
      "gather contract",
    ],
  }),
  lesson({
    id: "gfx950-muon-optimizer",
    order: 8,
    title: "gfx950 Muon polar update",
    summary:
      "Run 16 independent batch-local 4 x 4 Muon updates and shard copies across WG256/grid4.",
    duration: "50 min",
    bundle: "systems",
    sourceRole:
      "Muon gradient staging, shard reduction, polar iteration, and update teaching kernels",
    rustSymbols: [
      "gfx950_stage_gradient_shard_v1",
      "gfx950_muon_update_4x4_v1",
    ],
    rustExcerptSha256:
      "df2ded4e4f5fa4fe6e170f2701097d9087ef0929c318768b8c5ac83fa63896f5",
    referenceSymbols: ["muon_reference", "batched_muon_reference"],
    referenceExcerptSha256:
      "d43c796135a06d777cd4189267ff0a9fc6fa37ff94c4c04273820a5bfcdfc24f",
    hipSymbols: ["gfx950_stage_gradient_shard", "gfx950_muon_update"],
    fixedShape:
      "WG256/grid4 with 16 independent Wave64 matrices; two gradient shards per batch, five polar iterations, and learning-rate scale 0.05",
    isaRequirements: [
      "gfx950_stage_gradient_shard and gfx950_muon_update symbols are present",
      "gfx942 compilation is rejected for the complete suite",
    ],
    observedResults: [
      "MI350 WG256/grid4 staged shard: two plans x 256 outputs, max_error=0 for both",
      "MI350 WG256/grid4 polar update: 256 outputs, max_error=7.450580597e-9",
      "MI350 WG256/grid4 reduced norms: 16 outputs, max_error=5.960464478e-8",
    ],
    prerequisites: [
      "Matrix norms",
      "Shard reduction",
      "Iterative matrix transforms",
      "FP32 accumulation",
    ],
    objectives: [
      "State the exact fixed matrix shape, shard order, iteration count, and update order.",
      "Track working precision and normalization through the bounded orthogonalization loop.",
      "Derive one matrix batch from global Wave64 identity so shuffle collectives stay wave local and writes remain disjoint.",
      "Separate a single optimizer-step oracle from convergence or training-quality claims.",
    ],
    narratives: [
      "gfx950-muon-optimizer/update-contract",
      "gfx950-muon-optimizer/scope-evidence",
    ],
    obligations: [
      "the two shards are reduced in fixed rank order before normalization",
      "normalization handles the source-declared zero and non-finite policies",
      "the orthogonalization loop executes the exact fixed iteration count in source order",
      "all 16 update elements and the reduced norm receive one final in-range store",
      "all 16 wave batches consume distinct shard pairs and write disjoint update/norm slices",
    ],
    diagram: "gemm",
    exercise: {
      prompt: "Add zero-gradient and one bounded nonzero-matrix oracle cases.",
      hint: "Record the normalization policy before applying the fixed orthogonalization iterations.",
      acceptance:
        "The cases pin the reduced norm and 16 update outputs without making convergence, throughput, or model-quality claims.",
    },
    glossary: [
      "gfx950",
      "Muon",
      "polar iteration",
      "gradient shard",
      "optimizer update",
    ],
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
