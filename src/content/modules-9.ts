import lowPrecisionRustKernel from "../../examples/gfx950_low_precision/src/kernel.rs?raw";
import lowPrecisionRustReference from "../../examples/gfx950_low_precision/src/reference.rs?raw";
import lowPrecisionHipSource from "../../examples/gfx950_low_precision/gfx950_low_precision.hip?raw";
import buildAndTest from "../../examples/gfx950_low_precision/build_and_test.sh?raw";
import inspectIsa from "../../examples/gfx950_low_precision/check_isa.sh?raw";
import { narrativeSection } from "./narrative-registry";
import { resultText } from "./shared";
import {
  historicalReference,
  type Claim,
  type CodeTab,
  type CurriculumModule,
  type Lesson,
} from "./model";

const rustKernelPath = "examples/gfx950_low_precision/src/kernel.rs";
const rustReferencePath = "examples/gfx950_low_precision/src/reference.rs";
const rustContractPath = "examples/gfx950_low_precision/src/lib.rs";
const rustReadmePath = "examples/gfx950_low_precision/README.md";
const rustManifestPath = "examples/gfx950_low_precision/Cargo.toml";
const coreSourceCommit = "a710b6c67a908caa23d2409a5d3c4a275103cd60";
const coreSourceTree = "dfd5ec9a357d4cbd7879078c23f7b3114cdea641";
const rustKernelFileSha256 = "cbfeef4eb919076dfdbf858d57bb89effa16e5c0754efba95778b410f067850a";
const rustReferenceFileSha256 = "388ec3bf3fff9a5290456afc92b9bd24be8813d9ae914865f780affb7fb6e3e7";
const hipSourcePath = "examples/gfx950_low_precision/gfx950_low_precision.hip";
const hipSourceSha256 = "5ecfad224a691b61a07ef4aa16e144853bd3e8f53295a0e9c60404877356609a";
const hipHsacoSha256 = "ab39293c0f251678496cb5da026b8fb6ebbb4f6c96989ad5a2962d3ad6018379";
const productionTarget = "gfx950:xnack-";
const attentionRunnerPath = "examples/gfx950_low_precision/run-attention-gfx950.sh";
const ocmlClosurePath = "examples/gfx950_low_precision/gfx950-ocml-closure.sh";
const ocmlManifestPath = "examples/gfx950_low_precision/gfx950-ocml-rocm-7.2.1.manifest";

interface ProductionRustEvidence {
  label: string;
  runnerPath: string;
  namespace: string;
  llvmSha256: string;
  hsacoSha256: string;
  requiredIsa: string[];
  numericalResult: string;
  tolerance: string;
  hardwareTestPath: string;
  additionalSourcePaths?: string[];
}

const fp4GemmEvidence: ProductionRustEvidence = {
  label: "FP4 GEMM",
  runnerPath: "examples/gfx950_low_precision/run-fp4-gemm-gfx950.sh",
  namespace: "ff22ff3610dda0a94803a8011ced229b78c77400ca63c9b929d6ecba78ed6f01",
  llvmSha256: "b92ceef45655bb2ae131c2b09645ff8fb588299a994e9cbf84b07b7868fca115",
  hsacoSha256: "f170671b0b778cda3876faee253e4ac3a092efdd9c1ebbfcfe901590ea3e4e4d",
  requiredIsa: [
    "v_mfma_f32_16x16x128_f8f6f4",
    "cbsz:4 blgp:4",
  ],
  numericalResult: "max_absolute_error=0",
  tolerance: "absolute tolerance 1e-5",
  hardwareTestPath: "crates/fe2o3-hsa-runtime/tests/gfx950_fp4_gemm_hardware.rs",
};

const fp8GemmEvidence: ProductionRustEvidence = {
  label: "FP8 GEMM",
  runnerPath: "examples/gfx950_low_precision/run-fp8-gemm-gfx950.sh",
  namespace: "d67f1755b38fbdac67cec83da3ebc359f874e3fbf90fcc036471455ec117dfea",
  llvmSha256: "351dbfeecec00e673e3e15557b97dc1c53006839dfb9d1a0a7b03ac6c23ae6e3",
  hsacoSha256: "4c19d4a90ec71afa7621cc7f9f8d4d5af8e9dd87486536c702b8eb6dcc4c3d8f",
  requiredIsa: [
    "v_mfma_f32_16x16x128_f8f6f4",
    "E4M3 selectors (not cbsz:4 blgp:4)",
  ],
  numericalResult: "max_absolute_error=0",
  tolerance: "absolute tolerance 1e-5",
  hardwareTestPath: "crates/fe2o3-hsa-runtime/tests/gfx950_fp8_gemm_hardware.rs",
};

const fp4AttentionEvidence: ProductionRustEvidence = {
  label: "FP4 attention",
  runnerPath: "examples/gfx950_low_precision/run-fp4-attention-gfx950.sh",
  namespace: "a9a878f0e2fc3a42ad17edf0a326a89695398bb6d7460eaf278ea3e8c53f4cf5",
  llvmSha256: "ea183b9dedc375a1e98278d1053b7a500e0e8f4efe618230479e19bc1b81ecaa",
  hsacoSha256: "390b8cd9d8493ddbfb953e53c4a17cfb0cdab5074365b77b7c14bf64b6f64008",
  requiredIsa: [
    "v_mfma_f32_16x16x128_f8f6f4",
    "cbsz:4 blgp:4",
    "two ds_read_b64_tr_b4",
  ],
  numericalResult: "max_absolute_error=2.235174179e-8",
  tolerance: "absolute tolerance 2e-3 plus relative tolerance 2e-3",
  hardwareTestPath: "crates/fe2o3-hsa-runtime/tests/gfx950_attention_hardware.rs",
  additionalSourcePaths: [attentionRunnerPath, ocmlClosurePath, ocmlManifestPath],
};

const fp8AttentionEvidence: ProductionRustEvidence = {
  label: "FP8 attention",
  runnerPath: "examples/gfx950_low_precision/run-fp8-attention-gfx950.sh",
  namespace: "0c9610e86137831ce25b08b9ad87073ec16f459aa11aeea6806733f788bbeec1",
  llvmSha256: "2e6a2c79a57e0a8796fe95c806fbbf3a8406bae6c55646802beb235b01d88c2b",
  hsacoSha256: "5511819cf16a7119f846c6fe01de703257fd9c217b8fa7f32438bf47635c9221",
  requiredIsa: [
    "v_mfma_f32_16x16x128_f8f6f4",
    "E4M3 selectors (not cbsz:4 blgp:4)",
    "four ds_read_b64_tr_b8",
  ],
  numericalResult: "max_absolute_error=5.960464478e-8",
  tolerance: "absolute tolerance 2e-3 plus relative tolerance 2e-3",
  hardwareTestPath: "crates/fe2o3-hsa-runtime/tests/gfx950_attention_hardware.rs",
  additionalSourcePaths: [attentionRunnerPath, ocmlClosurePath, ocmlManifestPath],
};

function hipKernelExcerpt(symbol: string, nextSymbol: string): string {
  const helperStart = lowPrecisionHipSource.indexOf("using i32x2");
  const helperEnd = lowPrecisionHipSource.indexOf("template <typename Encode>");
  const kernelStart = lowPrecisionHipSource.indexOf(`extern "C" __global__ __launch_bounds__(64) void ${symbol}`);
  const kernelEnd = lowPrecisionHipSource.indexOf(nextSymbol, kernelStart);
  if (helperStart < 0 || helperEnd < 0 || kernelStart < 0 || kernelEnd < 0) {
    throw new Error(`Missing ${symbol} in ${hipSourcePath}`);
  }
  return [
    "// Exact comparison excerpt from the companion HIP fixture.",
    lowPrecisionHipSource.slice(helperStart, helperEnd).trimEnd(),
    "} // namespace",
    "",
    lowPrecisionHipSource.slice(kernelStart, kernelEnd).trimEnd(),
  ].join("\n");
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

function productionRustClaim(evidence: ProductionRustEvidence): Claim {
  return {
    kind: "gpu-observed",
    label: `Production Rust ${evidence.label} observed on MI350X`,
    detail:
      `At the exact pinned core commit, the ordinary #[kernel(typed)] Rust ${evidence.label} source passed its production extractor, ${productionTarget} LLVM and COV6 finalization checks, symbol-scoped ISA inspection, and digest-pinned HSA numerical test on the mi350 MI350X. The measured ${evidence.numericalResult} was within ${evidence.tolerance}. This bounded observation is not a formal source-to-machine proof, performance result, protected publication, or measured protected Worker V3 native build.`,
    reference: historicalReference(
      coreSourceCommit,
      coreSourceTree,
      [`bash ${evidence.runnerPath}`],
      [
        rustKernelPath,
        rustReferencePath,
        rustContractPath,
        rustManifestPath,
        rustReadmePath,
        evidence.runnerPath,
        evidence.hardwareTestPath,
        ...(evidence.additionalSourcePaths ?? []),
      ],
      {
        target: productionTarget,
        note: "Historical exact production Rust GPU observation retained at its immutable core commit. The raw digest-pinned hardware harness grants no protected publication authority, and the reviewed protected Worker V3 provider still lacks a measured native build with matching LLVM/LLD development packages.",
      },
    ),
  };
}

function tutorialTabs(
  rustSymbol: string,
  rustExcerptSha256: string,
  referenceSymbol: string,
  referenceExcerptSha256: string,
  hipSymbol: string,
  nextHipSymbol: string,
  evidence: ProductionRustEvidence,
): CodeTab[] {
  return [
    {
      kind: "kernel",
      label: "Rust kernel",
      language: "rust",
      code: rustFunctionExcerpt(lowPrecisionRustKernel, rustSymbol, true),
      sourcePath: rustKernelPath,
      sourceCommit: coreSourceCommit,
      sourceSha256: rustExcerptSha256,
      sourceDigestScope: "displayed",
      explanatory: false,
      notice: `Exact ordinary #[kernel(typed)] Rust excerpt for ${rustSymbol}, pinned to the production core commit and displayed-byte SHA-256. Its portable namespace is ${evidence.namespace}; the evidence record binds the corresponding Rust-produced LLVM, HSACO, ISA, and MI350X run.`,
    },
    {
      kind: "reference",
      label: "Safe CPU reference",
      language: "rust",
      code: rustFunctionExcerpt(lowPrecisionRustReference, referenceSymbol, false),
      sourcePath: rustReferencePath,
      sourceCommit: coreSourceCommit,
      sourceSha256: referenceExcerptSha256,
      sourceDigestScope: "displayed",
      explanatory: false,
      notice: `Exact published independent safe Rust ${referenceSymbol}, pinned to the core commit and displayed-byte SHA-256; it shares no device operation with the kernel.`,
    },
    {
      kind: "comparison",
      label: "Equivalent HIP",
      language: "cpp",
      code: hipKernelExcerpt(hipSymbol, nextHipSymbol),
      sourcePath: hipSourcePath,
      sourceSha256: hipSourceSha256,
      explanatory: true,
      notice: `Comparison-only HIP fixture for ${hipSymbol}. It is not the source of the Rust-produced LLVM or HSACO and grants no authority to the production Rust evidence.`,
    },
    {
      kind: "verus",
      label: "Proof obligations",
      language: "text",
      code: [
        "NO VERUS RESULT IS CLAIMED FOR THIS RUST SOURCE.",
        "",
        "Required before semantic-correctness promotion:",
        "- safe Rust source and CPU-reference relation",
        "- packed FP4/FP8 decode and identity-scale correspondence",
        "- wave64 lane/component bijection and disjoint final stores",
        "- K-phase accumulator or attention recurrence invariant",
        "- formal Rust source -> Kernel IR -> gfx950 ISA refinement",
      ].join("\n"),
      explanatory: true,
      notice: "Obligation ledger only; no proof execution or compiler receipt is claimed.",
    },
    {
      kind: "host",
      label: "Run and inspect",
      language: "bash",
      code: `# In the fe2o3 core checkout at ${coreSourceCommit}.\n# This production runner extracts the ordinary Rust kernel, validates LLVM,\n# finalizes exact ${productionTarget} COV6 HSACO, inspects symbol-scoped ISA,\n# and executes the digest-pinned HSA numerical test on a visible gfx950 GPU.\nbash ${evidence.runnerPath}\n\n# Comparison only: this separate HIP fixture is not used by the Rust runner.\nbash examples/gfx950_low_precision/build_and_test.sh\n\n# Exact mirrored comparison-only HIP build script:\n${buildAndTest}\n\n# Exact comparison-only HIP ISA checker invoked by that script:\n${inspectIsa}`,
      explanatory: true,
      notice: `Run the Rust command in the exact pinned fe2o3 checkout. It is the authoritative path for this lesson's production Rust GPU observation. The separate HIP command remains comparison-only.`,
    },
    {
      kind: "result",
      label: "Evidence record",
      language: "text",
      code: resultText(
        "gpu-observed",
        [
          "FE2O3 PRODUCTION RUST -> GFX950 EVIDENCE",
          `Kernel symbol: ${rustSymbol}`,
          `Kernel source: ${rustKernelPath}`,
          `Core source commit: ${coreSourceCommit}`,
          `Core source tree: ${coreSourceTree}`,
          `Kernel file SHA-256: ${rustKernelFileSha256}`,
          `CPU reference: ${referenceSymbol} in ${rustReferencePath}`,
          `Reference file SHA-256: ${rustReferenceFileSha256}`,
          `Production runner: bash ${evidence.runnerPath}`,
          `Portable namespace: ${evidence.namespace}`,
          `Rust-produced LLVM SHA-256: ${evidence.llvmSha256}`,
          `Rust-produced HSACO SHA-256: ${evidence.hsacoSha256}`,
          "Rust gfx950 lowering supported: true",
          `Target: ${productionTarget}, Wave64, code object V6`,
          `Required Rust ISA: ${evidence.requiredIsa.join(", ")}`,
          "Rust observation: ROCm 7.2.1 on MI350X gfx950, ssh host mi350, 2026-08-26.",
          `Rust numerical result: ${evidence.numericalResult}`,
          `Acceptance tolerance: ${evidence.tolerance}`,
          "The digest-pinned test checked all 256 outputs, immutable inputs, output canaries, exact target metadata, and symbol-scoped ISA.",
          "Formal source-to-machine proof: not claimed.",
          "Performance result: not claimed.",
          "Protected publication authority: not claimed.",
          "Protected Worker V3 boundary: the provider and admission policy are reviewed, but a measured native build still requires matching LLVM/LLD development packages.",
          "",
          "SEPARATE COMPARISON-ONLY HIP LANE",
          `HIP symbol: ${hipSymbol}`,
          `HIP source SHA-256: ${hipSourceSha256}`,
          `HIP HSACO SHA-256: ${hipHsacoSha256}`,
          `HIP required ISA: ${evidence.requiredIsa.join(", ")}`,
          "HIP observation: ROCm 7.2.1 on MI350X gfx950, ssh host mi350, 2026-08-26.",
          "HIP oracle: FP4 GEMM max_error=0; FP8 GEMM max_error=0; FP4 attention max_error=2.38419e-07; FP8 attention max_error=2.38419e-07.",
          "The HIP artifact is an independent comparison and does not produce, bind, or authorize the Rust artifact.",
        ].join("\n"),
      ),
      explanatory: true,
      notice: "The pinned production Rust artifact and MI350X run are authoritative for this bounded GPU-observed claim. HIP remains a separate comparison; proof, performance, and protected publication are not promoted.",
    },
  ];
}

const fp4Gemm: Lesson = {
  id: "gfx950-fp4-gemm",
  module: 9,
  order: 0,
  title: "gfx950 FP4 GEMM",
  summary:
    "Build a packed E2M1 16 x 16 x 128 wave64 GEMM around the gfx950 low-precision MFMA and an FP32 accumulator.",
  duration: "32 min",
  prerequisites: [
    "MI350 or MI355X for execution",
    "ROCm LLVM with gfx950 code generation",
    "Packed E2M1 FP4 and identity-scale semantics",
    "Wave64 tiled GEMM",
  ],
  objectives: [
    "Map eight packed E2M1 values per dword into a 128-element K phase.",
    "Assign four FP32 accumulator components to every wave64 lane.",
    "Inspect the exact gfx950 MFMA mnemonic while keeping source, ISA, and runtime evidence distinct.",
  ],
  claims: [productionRustClaim(fp4GemmEvidence)],
  sections: [
    narrativeSection("gfx950-fp4-gemm/prerequisites"),
    narrativeSection("gfx950-fp4-gemm/tile-accumulator"),
  ],
  tabs: tutorialTabs(
    "gfx950_fp4_gemm_rust",
    "478da27352b8d9acae02dbc10b28b353fcd985440f51af73145c3217505012c8",
    "gemm_reference",
    "cfcd4e567eb84127d93e77e9b568facb61674816026cd584f36d262a91b9541c",
    "gfx950_fp4_gemm",
    "extern \"C\" __global__ __launch_bounds__(64) void gfx950_fp8_gemm",
    fp4GemmEvidence,
  ),
  diagram: "gemm",
  exercises: [
    {
      prompt: "Add a second 128-element K phase.",
      hint: "Carry the returned f32x4 fragment as SrcC instead of passing a zero fragment again.",
      acceptance:
        "The source has one accumulator initialization, two ordered MFMA updates, and the CPU oracle covers K=256.",
    },
  ],
  glossary: ["gfx950", "FP4", "E8M0", "MFMA", "accumulator invariant"],
};

const fp8Gemm: Lesson = {
  id: "gfx950-fp8-gemm",
  module: 9,
  order: 1,
  title: "gfx950 FP8 GEMM",
  summary:
    "Use E4M3 operands, explicit format selectors, and FP32 accumulation in the unified gfx950 f8f6f4 matrix path.",
  duration: "28 min",
  prerequisites: [
    "gfx950 FP4 GEMM",
    "Packed E4M3 FP8 and identity-scale semantics",
    "Wave64 accumulator ownership",
  ],
  objectives: [
    "Distinguish the printed unified opcode from its E4M3 format selectors.",
    "Relate four packed FP8 values per dword to the 16 x 16 x 128 tile.",
    "State a K-phase invariant for the lane-local FP32 fragment.",
  ],
  claims: [productionRustClaim(fp8GemmEvidence)],
  sections: [
    narrativeSection("gfx950-fp8-gemm/format-layout"),
    narrativeSection("gfx950-fp8-gemm/tile-accumulator"),
  ],
  tabs: tutorialTabs(
    "gfx950_fp8_gemm_rust",
    "d54dd98522394418dfa1835858b01be523de1ef6b9f493b866eb802d8c8b55bd",
    "gemm_reference",
    "cfcd4e567eb84127d93e77e9b568facb61674816026cd584f36d262a91b9541c",
    "gfx950_fp8_gemm",
    "extern \"C\" __global__ __launch_bounds__(64) void gfx950_fp4_flash_attention",
    fp8GemmEvidence,
  ),
  diagram: "gemm",
  exercises: [
    {
      prompt: "Mutate one operand selector from E4M3 to E2M1.",
      hint: "The printed opcode stays in the f8f6f4 family, so inspect operand modifiers as well as the mnemonic.",
      acceptance:
        "The ISA check rejects the mutation and the CPU oracle reports a numerical mismatch.",
    },
  ],
  glossary: ["gfx950", "FP8", "E8M0", "MFMA", "accumulator invariant"],
};

const fp4Attention: Lesson = {
  id: "gfx950-fp4-attention",
  module: 9,
  order: 2,
  title: "gfx950 FP4 flash attention",
  summary:
    "Feed packed E2M1 K fragments through the gfx950 B4 transpose load, compute QK with MFMA, and retain FP32 softmax state.",
  duration: "46 min",
  prerequisites: [
    "gfx950 FP4 GEMM",
    "LDS publication and waits",
    "Online softmax recurrence",
    "Causal and padding masks",
  ],
  objectives: [
    "Explain why ds_read_b64_tr_b4 is part of the FP4 matrix-B layout contract.",
    "Keep the one-tile QK accumulator, maximum, denominator, and scalar PV numerator in FP32.",
    "Inspect transpose-load and MFMA mnemonics within the attention symbol.",
  ],
  claims: [productionRustClaim(fp4AttentionEvidence)],
  sections: [
    narrativeSection("gfx950-fp4-attention/transpose-pipeline"),
    narrativeSection("gfx950-fp4-attention/online-softmax"),
  ],
  tabs: tutorialTabs(
    "gfx950_fp4_attention_rust",
    "3d4ec672e3f10b86fe60df65adfb7a1116f53ea1b458ded39e72d177f034437b",
    "attention_reference",
    "cad34588d47fcd31930fec04bccfc83f3c2d4b56fb413c2a5fc1fba1dd3b35c0",
    "gfx950_fp4_flash_attention",
    "extern \"C\" __global__ __launch_bounds__(64) void gfx950_fp8_flash_attention",
    fp4AttentionEvidence,
  ),
  diagram: "attention",
  exercises: [
    {
      prompt: "Add a causal mask to the 16-key score tile.",
      hint: "Apply negative infinity before the row maximum, using the logical query and key coordinates.",
      acceptance:
        "Future keys contribute neither to the maximum, denominator, nor V numerator, and the CPU reference covers every query row.",
    },
  ],
  glossary: ["gfx950", "FP4", "transpose load", "flash attention", "online softmax"],
};

const fp8Attention: Lesson = {
  id: "gfx950-fp8-attention",
  module: 9,
  order: 3,
  title: "gfx950 FP8 flash attention",
  summary:
    "Use the B8 LDS transpose load and unified low-precision MFMA while keeping masking, softmax, and output evidence explicit.",
  duration: "44 min",
  prerequisites: [
    "gfx950 FP8 GEMM",
    "FP4 flash-attention recurrence",
    "gfx950 LDS transpose reads",
  ],
  objectives: [
    "Distinguish ds_read_b64_tr_b8 from the FP4 transpose-read form.",
    "Trace E4M3 Q/K fragments into one FP32 score tile and scalar decoded-FP32 PV loop.",
    "Record source, code object, ISA, and hardware fields without evidence promotion.",
  ],
  claims: [productionRustClaim(fp8AttentionEvidence)],
  sections: [
    narrativeSection("gfx950-fp8-attention/transpose-pipeline"),
    narrativeSection("gfx950-fp8-attention/evidence-boundary"),
  ],
  tabs: tutorialTabs(
    "gfx950_fp8_attention_rust",
    "98c3eb5b1040116c6eff349dfacfaf141855ad9145993d345e296cca573095c3",
    "attention_reference",
    "cad34588d47fcd31930fec04bccfc83f3c2d4b56fb413c2a5fc1fba1dd3b35c0",
    "gfx950_fp8_flash_attention",
    "int main()",
    fp8AttentionEvidence,
  ),
  diagram: "attention",
  exercises: [
    {
      prompt: "Produce a reviewable hardware evidence bundle.",
      hint: "Retain source and HSACO digests, compiler versions, the full command, symbol-scoped disassembly, runtime identity, and oracle output separately.",
      acceptance:
        "The bundle binds the inspected object to the gfx950 runtime and oracle output while leaving performance pending.",
    },
  ],
  glossary: ["gfx950", "FP8", "transpose load", "artifact binding", "online softmax"],
};

export const modules9: CurriculumModule[] = [
  {
    number: 9,
    title: "gfx950 low-precision kernels",
    summary:
      "Packed FP4/FP8 GEMM and flash-attention source, layout contracts, ISA inspection, and bounded evidence recording for AMD CDNA 4.",
    lessons: [fp4Gemm, fp8Gemm, fp4Attention, fp8Attention],
  },
];
