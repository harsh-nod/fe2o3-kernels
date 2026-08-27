import lowPrecisionRustKernel from "../../examples/gfx950_low_precision/src/kernel.rs?raw";
import lowPrecisionRustReference from "../../examples/gfx950_low_precision/src/reference.rs?raw";
import lowPrecisionRustContract from "../../examples/gfx950_low_precision/src/lib.rs?raw";
import lowPrecisionHipSource from "../../examples/gfx950_low_precision/gfx950_low_precision.hip?raw";
import buildAndTest from "../../examples/gfx950_low_precision/build_and_test.sh?raw";
import inspectIsa from "../../examples/gfx950_low_precision/check_isa.sh?raw";
import { narrativeSection } from "./narrative-registry";
import { resultText } from "./shared";
import type { CodeTab, CurriculumModule, Lesson } from "./model";

const rustKernelPath = "examples/gfx950_low_precision/src/kernel.rs";
const rustReferencePath = "examples/gfx950_low_precision/src/reference.rs";
const coreSourceCommit = "91e3cf2b4d8145d8c269ea3f783da53f90c568f4";
const rustKernelFileSha256 = "1db40f7590af32b8b6781294ba184101a4e5cb7055a26e60bdf0aabec7145099";
const rustReferenceFileSha256 = "388ec3bf3fff9a5290456afc92b9bd24be8813d9ae914865f780affb7fb6e3e7";
const hipSourcePath = "examples/gfx950_low_precision/gfx950_low_precision.hip";
const hipSourceSha256 = "5ecfad224a691b61a07ef4aa16e144853bd3e8f53295a0e9c60404877356609a";
const hipHsacoSha256 = "ab39293c0f251678496cb5da026b8fb6ebbb4f6c96989ad5a2962d3ad6018379";
const loweringBlocker = "the rustc semantic importer, Kernel IR schema, production target profile, and AMDGPU module lowering do not yet consume the gfx950 scaled-MFMA, LDS-transpose, subgroup, or DeviceMath exp_f32 terminals";

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

function tutorialTabs(
  rustSymbol: string,
  rustExcerptSha256: string,
  referenceSymbol: string,
  referenceExcerptSha256: string,
  hipSymbol: string,
  nextHipSymbol: string,
  requiredIsa: string[],
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
      notice: `Exact published ordinary #[kernel(typed)] Rust excerpt for ${rustSymbol}, pinned to the core commit and displayed-byte SHA-256. GFX950_RUST_TO_HSACO_LOWERING_SUPPORTED_V1 remains false.`,
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
      notice: `Comparison-only HIP fixture for ${hipSymbol}. Its required ${requiredIsa.join(" and ")} and MI350X results do not establish Rust lowering or execution.`,
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
        "- Rust source -> Kernel IR -> gfx950 ISA refinement",
      ].join("\n"),
      explanatory: true,
      notice: "Obligation ledger only; no proof execution or compiler receipt is claimed.",
    },
    {
      kind: "host",
      label: "Run and inspect",
      language: "bash",
      code: `# In the pinned fe2o3 core checkout: Rust source and CPU-reference checks only.\ncargo test --offline --manifest-path examples/gfx950_low_precision/Cargo.toml\n\n# In the fe2o3-kernels site checkout: separate HIP compiler/ISA/hardware validation.\nbash examples/gfx950_low_precision/build_and_test.sh\n\n# Exact mirrored HIP build script:\n${buildAndTest}\n\n# Exact symbol-scoped HIP ISA checker invoked by the script:\n${inspectIsa}`,
      explanatory: true,
      notice: "Run Cargo in the pinned fe2o3 core checkout, where the manifest's core-relative dependencies exist. It does not emit gfx950 HSACO. The site-local HIP script and checker validate only the companion HIP artifact.",
    },
    {
      kind: "result",
      label: "Evidence record",
      language: "text",
      code: resultText(
        "source-example",
        [
          "FE2O3 RUST SOURCE LANE",
          `Kernel symbol: ${rustSymbol}`,
          `Kernel source: ${rustKernelPath}`,
          `Core source commit: ${coreSourceCommit}`,
          `Kernel file SHA-256: ${rustKernelFileSha256}`,
          `CPU reference: ${referenceSymbol} in ${rustReferencePath}`,
          `Reference file SHA-256: ${rustReferenceFileSha256}`,
          "Rust gfx950 lowering supported: false",
          `Exact blocker: ${loweringBlocker}`,
          "Rust-produced HSACO: none",
          "Rust gfx950 runtime observation: none",
          "",
          "SEPARATE HIP COMPARISON LANE",
          `HIP symbol: ${hipSymbol}`,
          `HIP source SHA-256: ${hipSourceSha256}`,
          `HIP HSACO SHA-256: ${hipHsacoSha256}`,
          `HIP required ISA: ${requiredIsa.join(", ")}`,
          "HIP observation: ROCm 7.2.1 on MI350X gfx950, ssh host mi350, 2026-08-26.",
          "HIP oracle: FP4 GEMM max_error=0; FP8 GEMM max_error=0; FP4 attention max_error=2.38419e-07; FP8 attention max_error=2.38419e-07.",
          "The HIP artifact and run do not bind to, lower, or execute the Rust source.",
          "Performance result: not claimed.",
          "",
          `Contract mirror contains false boundary: ${lowPrecisionRustContract.includes("GFX950_RUST_TO_HSACO_LOWERING_SUPPORTED_V1: bool = false")}.`,
        ].join("\n"),
      ),
      explanatory: true,
      notice: "Rust source/CPU-reference evidence and HIP ISA/runtime evidence remain separate authority lanes.",
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
  claims: [
    {
      kind: "source-example",
      label: "Rust kernel and CPU reference published",
      detail:
        "The tutorial defaults to exact ordinary attributed Rust and an independent safe CPU reference. Rust-to-gfx950 lowering is explicitly unsupported; the HIP fixture and MI350X run remain comparison-only evidence.",
    },
  ],
  sections: [
    narrativeSection("gfx950-fp4-gemm/prerequisites"),
    narrativeSection("gfx950-fp4-gemm/tile-accumulator"),
  ],
  tabs: tutorialTabs("gfx950_fp4_gemm_rust", "c8df66efc69ffcc731462d7600d7c307954fcd5bb5e311490fee1b253dafcab7", "gemm_reference", "cfcd4e567eb84127d93e77e9b568facb61674816026cd584f36d262a91b9541c", "gfx950_fp4_gemm", "extern \"C\" __global__ __launch_bounds__(64) void gfx950_fp8_gemm", [
    "v_mfma_f32_16x16x128_f8f6f4",
    "cbsz:4 blgp:4",
  ]),
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
  claims: [
    {
      kind: "source-example",
      label: "Rust kernel and CPU reference published",
      detail:
        "The exact Rust source and independent E4M3 CPU reference are published with a false lowering flag. The non-gfx950 guard and MI350X observation belong only to the equivalent HIP fixture.",
    },
  ],
  sections: [
    narrativeSection("gfx950-fp8-gemm/format-layout"),
    narrativeSection("gfx950-fp8-gemm/tile-accumulator"),
  ],
  tabs: tutorialTabs("gfx950_fp8_gemm_rust", "07b51618ef69bda35e91e422ca948934a450e376dce68bb9ab62e0e8af1eedce", "gemm_reference", "cfcd4e567eb84127d93e77e9b568facb61674816026cd584f36d262a91b9541c", "gfx950_fp8_gemm", "extern \"C\" __global__ __launch_bounds__(64) void gfx950_fp4_flash_attention", [
    "v_mfma_f32_16x16x128_f8f6f4",
    "E4M3 selectors (not cbsz:4 blgp:4)",
  ]),
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
  claims: [
    {
      kind: "source-example",
      label: "Rust attention source and CPU reference published",
      detail:
        "The Rust source expresses the typed gfx950 transpose/MFMA pipeline and scalar FP32 PV loop, with an independent CPU reference. Those device terminals are not yet lowered; B4 ISA and runtime results belong to HIP only.",
    },
  ],
  sections: [
    narrativeSection("gfx950-fp4-attention/transpose-pipeline"),
    narrativeSection("gfx950-fp4-attention/online-softmax"),
  ],
  tabs: tutorialTabs("gfx950_fp4_attention_rust", "de73f75ba38cab5d88dd4889d0fe4cbc41295f49afec803774a6c9ace78f0062", "attention_reference", "cad34588d47fcd31930fec04bccfc83f3c2d4b56fb413c2a5fc1fba1dd3b35c0", "gfx950_fp4_flash_attention", "extern \"C\" __global__ __launch_bounds__(64) void gfx950_fp8_flash_attention", [
    "ds_read_b64_tr_b4",
    "v_mfma_f32_16x16x128_f8f6f4",
  ]),
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
  claims: [
    {
      kind: "source-example",
      label: "Rust attention source and CPU reference published",
      detail:
        "The exact attributed Rust and independent CPU reference are present with lowering explicitly unsupported. The B8/MFMA disassembly, device guard, and MI350X result describe only the equivalent HIP fixture.",
    },
  ],
  sections: [
    narrativeSection("gfx950-fp8-attention/transpose-pipeline"),
    narrativeSection("gfx950-fp8-attention/evidence-boundary"),
  ],
  tabs: tutorialTabs("gfx950_fp8_attention_rust", "1bba502d11b4806e9bb14141049655e6f05ae7a2d2bfdad8fe3b22625feb6149", "attention_reference", "cad34588d47fcd31930fec04bccfc83f3c2d4b56fb413c2a5fc1fba1dd3b35c0", "gfx950_fp8_flash_attention", "int main()", [
    "ds_read_b64_tr_b8",
    "v_mfma_f32_16x16x128_f8f6f4",
  ]),
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
