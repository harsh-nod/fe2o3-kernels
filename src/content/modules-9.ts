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
const rustLockPath = "examples/gfx950_low_precision/Cargo.lock";
const coreSourceCommit = "9006001157e2c3062e44088634e467b0f8963ee0";
const coreSourceTree = "874a9a250f904e3229410e0d620cfcecaab3f49d";
const rustKernelFileSha256 =
  "feebb7e80801c6b5323d19bcdb7908b93a5159c26fe2aa8181fb2de623bf6a5d";
const rustReferenceFileSha256 =
  "c6b2d78ece4c1fb994922e3d99435e48a2ecd5a846b61725a75c494e6b862600";
const hipSourcePath = "examples/gfx950_low_precision/gfx950_low_precision.hip";
const hipSourceSha256 =
  "5ecfad224a691b61a07ef4aa16e144853bd3e8f53295a0e9c60404877356609a";
const hipHsacoSha256 =
  "ab39293c0f251678496cb5da026b8fb6ebbb4f6c96989ad5a2962d3ad6018379";
const productionTarget = "gfx950:xnack-";
const attentionRunnerPath =
  "examples/gfx950_low_precision/run-attention-gfx950.sh";
const ocmlClosurePath = "examples/gfx950_low_precision/gfx950-ocml-closure.sh";
const ocmlManifestPath =
  "examples/gfx950_low_precision/gfx950-ocml-rocm-7.2.1.manifest";

interface ProductionRustEvidence {
  label: string;
  runnerPath: string;
  namespace: string;
  llvmSha256: string;
  hsacoSha256: string;
  isaSha256: string;
  requiredIsa: string[];
  numericalResult: string;
  tolerance: string;
  launch: string;
  hardwareTestPath: string;
  additionalSourcePaths?: string[];
}

const fp4GemmEvidence: ProductionRustEvidence = {
  label: "FP4 GEMM",
  runnerPath: "examples/gfx950_low_precision/run-fp4-gemm-gfx950.sh",
  namespace: "894d3b3350eb1f58293d096d32ef2572e657bdc013f3d27ba4ac55cff4523f04",
  llvmSha256:
    "22d69934e8ad701c965af6e59b8d78778298f1c28569ea57729e2871987166b1",
  hsacoSha256:
    "436964a09c11a1a3f7ae24642972ddeb632cfcd62c52e6db33ddea0ff13d9900",
  isaSha256: "7bb5bdc620523bfbcf888f067e1b556515aee4f201b20a328d89e23d30c16d1d",
  requiredIsa: ["v_mfma_f32_16x16x128_f8f6f4", "cbsz:4 blgp:4"],
  numericalResult: "max_absolute_error=0",
  tolerance: "absolute tolerance 1e-5",
  launch:
    "WG256/grid4; four Wave64 tiles per workgroup and 16 independent tiles per launch; static LDS=0 bytes",
  hardwareTestPath:
    "crates/fe2o3-hsa-runtime/tests/gfx950_fp4_gemm_hardware.rs",
};

const fp8GemmEvidence: ProductionRustEvidence = {
  label: "FP8 GEMM",
  runnerPath: "examples/gfx950_low_precision/run-fp8-gemm-gfx950.sh",
  namespace: "9e98141edaae16343d036d08caa473a6535f143b8bfcd752106e818f94585040",
  llvmSha256:
    "b3bc8f318151c70976be29ad6a0a1584195eeed09f502ec5534ad6dff8964e33",
  hsacoSha256:
    "16a6725e375a0e8a71defb8740a2f2080f67bd035c749c29df3a895fcbcb08e0",
  isaSha256: "37792b0f182b572364cbb3a3a82ee7ba3cb98332a4cd5674acb23d1fc4968b2b",
  requiredIsa: [
    "v_mfma_f32_16x16x128_f8f6f4",
    "E4M3 selectors (not cbsz:4 blgp:4)",
  ],
  numericalResult: "max_absolute_error=0",
  tolerance: "absolute tolerance 1e-5",
  launch:
    "WG256/grid4; four Wave64 tiles per workgroup and 16 independent tiles per launch; static LDS=0 bytes",
  hardwareTestPath:
    "crates/fe2o3-hsa-runtime/tests/gfx950_fp8_gemm_hardware.rs",
};

const fp4AttentionEvidence: ProductionRustEvidence = {
  label: "FP4 attention",
  runnerPath: "examples/gfx950_low_precision/run-fp4-attention-gfx950.sh",
  namespace: "84784601f60af13beafd467edd5bb86f872e3aa9d48e1ad5e8c84e1452dd13a1",
  llvmSha256:
    "bacedec0a61f3d4f8e76cb11ef7c43de11d9adfce18124ce4cde3f5b88772b5c",
  hsacoSha256:
    "cc25e739a12b1a889e42f522708d59b4e626908a2b351dc051f4d3df59a92e38",
  isaSha256: "3206cd6ce8df7005fa424cae0fc3d39fecc817f7c1ef84089ad2dc685d8c79c2",
  requiredIsa: [
    "v_mfma_f32_16x16x128_f8f6f4",
    "cbsz:4 blgp:4",
    "two ds_read_b64_tr_b4",
  ],
  numericalResult: "4,096 outputs; max_absolute_error=1.192092896e-7",
  tolerance: "absolute tolerance 2e-3 plus relative tolerance 2e-3",
  launch:
    "WG256/grid4; four Wave64 heads per workgroup and 16 independent heads per launch; four private 1 KiB transpose tiles and 4 KiB static LDS per workgroup",
  hardwareTestPath:
    "crates/fe2o3-hsa-runtime/tests/gfx950_attention_hardware.rs",
  additionalSourcePaths: [
    attentionRunnerPath,
    ocmlClosurePath,
    ocmlManifestPath,
  ],
};

const fp8AttentionEvidence: ProductionRustEvidence = {
  label: "FP8 attention",
  runnerPath: "examples/gfx950_low_precision/run-fp8-attention-gfx950.sh",
  namespace: "1cf2661cadefed5b0f3dee8b6430acd144d47f9a4d5ba8182748fac23a2aa315",
  llvmSha256:
    "c52a1ebd0ad73ee77dcb52477f21c9b239fda49fdaceb2c82c001da530027835",
  hsacoSha256:
    "aa479249efa9d45e7eb0fd44f000feb77005b289556ba2030afd2545b4fda1e1",
  isaSha256: "88dcc7383d5d77f552bba5a4c84aef3de44c1e1f13281135f326a761e4337797",
  requiredIsa: [
    "v_mfma_f32_16x16x128_f8f6f4",
    "E4M3 selectors (not cbsz:4 blgp:4)",
    "four ds_read_b64_tr_b8",
  ],
  numericalResult: "max_absolute_error=5.960464478e-8",
  tolerance: "absolute tolerance 2e-3 plus relative tolerance 2e-3",
  launch:
    "WG256/grid4; four Wave64 heads per workgroup and 16 independent heads per launch; four private 2 KiB transpose tiles and 8 KiB static LDS per workgroup",
  hardwareTestPath:
    "crates/fe2o3-hsa-runtime/tests/gfx950_attention_hardware.rs",
  additionalSourcePaths: [
    attentionRunnerPath,
    ocmlClosurePath,
    ocmlManifestPath,
  ],
};

function hipKernelExcerpt(symbol: string, nextSymbol: string): string {
  const helperStart = lowPrecisionHipSource.indexOf("using i32x2");
  const helperEnd = lowPrecisionHipSource.indexOf("template <typename Encode>");
  const kernelStart = lowPrecisionHipSource.indexOf(
    `extern "C" __global__ __launch_bounds__(64) void ${symbol}`,
  );
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

function rustFunctionExcerpt(
  source: string,
  symbol: string,
  attributed: boolean,
): string {
  const position = source.indexOf(`pub fn ${symbol}(`);
  const start = attributed
    ? source.lastIndexOf("#[kernel(", position)
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

function productionRustClaim(evidence: ProductionRustEvidence): Claim {
  return {
    kind: "gpu-observed",
    label: `Production Rust ${evidence.label} observed on MI350X`,
    detail: `At the exact pinned core commit, the ordinary #[kernel(typed)] Rust ${evidence.label} source passed its production extractor, ${productionTarget} LLVM and COV6 finalization checks, symbol-scoped ISA inspection, and digest-pinned HSA numerical test on the mi350 MI350X. ${evidence.launch}. The measured ${evidence.numericalResult} was within ${evidence.tolerance}. This bounded observation is not a formal source-to-machine proof, performance result, protected publication, or measured protected Worker V3 native build.`,
    reference: historicalReference(
      coreSourceCommit,
      coreSourceTree,
      [`bash ${evidence.runnerPath}`],
      [
        rustKernelPath,
        rustReferencePath,
        rustContractPath,
        rustManifestPath,
        rustLockPath,
        rustReadmePath,
        evidence.runnerPath,
        evidence.hardwareTestPath,
        ...(evidence.additionalSourcePaths ?? []),
      ],
      {
        target: productionTarget,
        note: "Archived as the exact 2026-09-04 WG256/grid4 production Rust correctness campaign at the final core integration commit. The raw digest-pinned hardware harness grants no protected publication authority.",
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
      notice: `Exact ordinary #[kernel(typed)] Rust excerpt for ${rustSymbol}, pinned to the production core commit and displayed-byte SHA-256. Its measured compiler-derived binding is ${evidence.namespace}; the evidence record binds the corresponding Rust-produced LLVM, HSACO, ISA, and MI350X run. Historical source bytes can retain the former explicit syntax and are not current author templates.`,
    },
    {
      kind: "reference",
      label: "Safe CPU reference",
      language: "rust",
      code: rustFunctionExcerpt(
        lowPrecisionRustReference,
        referenceSymbol,
        false,
      ),
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
      notice:
        "Obligation ledger only; no proof execution or compiler receipt is claimed.",
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
          `Compiler-derived binding: ${evidence.namespace}`,
          `Rust-produced LLVM SHA-256: ${evidence.llvmSha256}`,
          `Rust-produced HSACO SHA-256: ${evidence.hsacoSha256}`,
          `Symbol-scoped ISA SHA-256: ${evidence.isaSha256}`,
          `Launch: ${evidence.launch}`,
          "Rust gfx950 lowering supported: true",
          `Target: ${productionTarget}, Wave64, code object V6`,
          `Required Rust ISA: ${evidence.requiredIsa.join(", ")}`,
          "Rust observation: ROCm 7.2.1 on MI350X gfx950 physical GPU 6, ssh host mi350, 2026-09-04.",
          `Rust numerical result: ${evidence.numericalResult}`,
          `Acceptance tolerance: ${evidence.tolerance}`,
          "The digest-pinned test checked all 4,096 outputs from 16 non-identical items, immutable inputs, output canaries, exact target metadata, and symbol-scoped ISA.",
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
      notice:
        "The pinned production Rust artifact and MI350X run are authoritative for this bounded GPU-observed claim. HIP remains a separate comparison; proof, performance, and protected publication are not promoted.",
    },
  ];
}

const fp4Gemm: Lesson = {
  id: "gfx950-fp4-gemm",
  module: 9,
  order: 0,
  title: "gfx950 FP4 GEMM",
  summary:
    "Build 16 independent packed E2M1 16 x 16 x 128 Wave64 GEMMs across four WG256 workgroups around the gfx950 low-precision MFMA and an FP32 accumulator.",
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
    "3877bfb0afdcdd30b3ef8a11eaafb4a7d40c6fefab348a8bac3ad76e23a61ef1",
    "gemm_reference",
    "cfcd4e567eb84127d93e77e9b568facb61674816026cd584f36d262a91b9541c",
    "gfx950_fp4_gemm",
    'extern "C" __global__ __launch_bounds__(64) void gfx950_fp8_gemm',
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
    "b40f7cf4fa7560536a91914adda47107f4b2710bdbf5e176b7c1c71b690abf97",
    "gemm_reference",
    "cfcd4e567eb84127d93e77e9b568facb61674816026cd584f36d262a91b9541c",
    "gfx950_fp8_gemm",
    'extern "C" __global__ __launch_bounds__(64) void gfx950_fp4_flash_attention',
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
    "f342cc1c42eef9058ceb1b5615cee104e6552a32a7190550c4e3f4f6234e3ed2",
    "attention_reference",
    "cad34588d47fcd31930fec04bccfc83f3c2d4b56fb413c2a5fc1fba1dd3b35c0",
    "gfx950_fp4_flash_attention",
    'extern "C" __global__ __launch_bounds__(64) void gfx950_fp8_flash_attention',
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
  glossary: [
    "gfx950",
    "FP4",
    "transpose load",
    "flash attention",
    "online softmax",
  ],
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
    "69650ea2502ee149949d6cbec3e909032ede026be47ca52568bda455b9d9ef2c",
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
  glossary: [
    "gfx950",
    "FP8",
    "transpose load",
    "artifact binding",
    "online softmax",
  ],
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
