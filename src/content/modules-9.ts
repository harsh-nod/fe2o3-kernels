import lowPrecisionSource from "../../examples/gfx950_low_precision/gfx950_low_precision.hip?raw";
import buildAndTest from "../../examples/gfx950_low_precision/build_and_test.sh?raw";
import inspectIsa from "../../examples/gfx950_low_precision/check_isa.sh?raw";
import { narrativeSection } from "./narrative-registry";
import { resultText } from "./shared";
import type { CodeTab, CurriculumModule, Lesson } from "./model";

const sourcePath = "examples/gfx950_low_precision/gfx950_low_precision.hip";

function kernelExcerpt(symbol: string, nextSymbol: string): string {
  const helperStart = lowPrecisionSource.indexOf("using i32x2");
  const helperEnd = lowPrecisionSource.indexOf("template <typename Encode>");
  const kernelStart = lowPrecisionSource.indexOf(`extern "C" __global__ __launch_bounds__(64) void ${symbol}`);
  const kernelEnd = lowPrecisionSource.indexOf(nextSymbol, kernelStart);
  if (helperStart < 0 || helperEnd < 0 || kernelStart < 0 || kernelEnd < 0) {
    throw new Error(`Missing ${symbol} in ${sourcePath}`);
  }
  return [
    "// Exact excerpt from the combined runnable HIP example.",
    lowPrecisionSource.slice(helperStart, helperEnd).trimEnd(),
    "} // namespace",
    "",
    lowPrecisionSource.slice(kernelStart, kernelEnd).trimEnd(),
  ].join("\n");
}

function tutorialTabs(
  symbol: string,
  nextSymbol: string,
  requiredIsa: string[],
): CodeTab[] {
  return [
    {
      kind: "kernel",
      label: "HIP kernel",
      language: "cpp",
      code: kernelExcerpt(symbol, nextSymbol),
      explanatory: true,
      notice: `Exact excerpt from ${sourcePath}. The combined source contains the independent CPU oracle and all four launch paths; gfx950 hardware execution is pending.`,
    },
    {
      kind: "verus",
      label: "Proof obligations",
      language: "text",
      code: [
        "NO VERUS RESULT IS CLAIMED FOR THIS HIP EXAMPLE.",
        "",
        "Required before semantic-correctness promotion:",
        "- packed FP4/FP8 decode and current identity-scale correspondence",
        "- wave64 lane/component bijection for the 16 x 16 FP32 accumulator",
        "- total, disjoint final output stores",
        "- K-phase accumulator invariant and tail policy",
        "- for attention: transpose-load layout and online-softmax recurrence",
        "- source -> LLVM -> gfx950 ISA refinement",
      ].join("\n"),
      explanatory: true,
      notice: "Obligation ledger only. It is not a proof execution or imported compiler receipt.",
    },
    {
      kind: "comparison",
      label: "ISA checks",
      language: "bash",
      code: inspectIsa,
      explanatory: true,
      notice: `Run this against the exact gfx950 HSACO. This lesson requires ${requiredIsa.join(" and ")}; instruction presence is not hardware execution.`,
    },
    {
      kind: "host",
      label: "Build and test",
      language: "bash",
      code: buildAndTest,
      explanatory: true,
      notice: "Use --compile-only without a visible gfx950 agent. The script refuses to turn the current gfx1036 device into a gfx950 runtime result.",
    },
    {
      kind: "result",
      label: "Evidence record",
      language: "text",
      code: resultText(
        "source-example",
        [
          `Kernel symbol: ${symbol}`,
          `Source: ${sourcePath}`,
          "Target: gfx950",
          `Required ISA: ${requiredIsa.join(", ")}`,
          "Compile/ISA result: attach the saved command, tool versions, HSACO SHA-256, and scoped disassembly.",
          "Runtime device: pending (current host exposes gfx1036, not gfx950).",
          "GPU oracle result: pending.",
          "Performance result: pending.",
          "",
          "Do not promote this record to compiler-checked or GPU-observed without exact retained evidence.",
        ].join("\n"),
      ),
      explanatory: true,
      notice: "Bounded evidence template. Pending fields are intentionally not inferred from source or ISA inspection.",
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
    "Inspect the exact gfx950 MFMA mnemonic without claiming execution.",
  ],
  claims: [
    {
      kind: "source-example",
      label: "Runnable HIP source published",
      detail:
        "The tutorial includes the exact combined HIP source, CPU oracle, compile-only path, and symbol-scoped ISA checks. The current host cannot supply gfx950 runtime evidence.",
    },
  ],
  sections: [
    narrativeSection("gfx950-fp4-gemm/prerequisites"),
    narrativeSection("gfx950-fp4-gemm/tile-accumulator"),
  ],
  tabs: tutorialTabs("gfx950_fp4_gemm", "extern \"C\" __global__ __launch_bounds__(64) void gfx950_fp8_gemm", [
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
      label: "Runnable HIP source published",
      detail:
        "The exact source contains an E4M3 CPU decode/reference and refuses execution on non-gfx950 devices. No gfx950 run is claimed by this site build.",
    },
  ],
  sections: [
    narrativeSection("gfx950-fp8-gemm/format-layout"),
    narrativeSection("gfx950-fp8-gemm/tile-accumulator"),
  ],
  tabs: tutorialTabs("gfx950_fp8_gemm", "extern \"C\" __global__ __launch_bounds__(64) void gfx950_fp4_flash_attention", [
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
      label: "Fused HIP attention source published",
      detail:
        "The source keeps the QK score tile in registers, uses a format-specific LDS transpose-read builtin, and includes an independent CPU attention reference. Hardware execution remains pending.",
    },
  ],
  sections: [
    narrativeSection("gfx950-fp4-attention/transpose-pipeline"),
    narrativeSection("gfx950-fp4-attention/online-softmax"),
  ],
  tabs: tutorialTabs("gfx950_fp4_flash_attention", "extern \"C\" __global__ __launch_bounds__(64) void gfx950_fp8_flash_attention", [
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
      label: "Fused HIP attention source published",
      detail:
        "The exact source, compile-only command, symbol-scoped B8/MFMA checks, device guard, and CPU oracle are present. No MI350 runtime or performance result is asserted.",
    },
  ],
  sections: [
    narrativeSection("gfx950-fp8-attention/transpose-pipeline"),
    narrativeSection("gfx950-fp8-attention/evidence-boundary"),
  ],
  tabs: tutorialTabs("gfx950_fp8_flash_attention", "int main()", [
    "ds_read_b64_tr_b8",
    "v_mfma_f32_16x16x128_f8f6f4",
  ]),
  diagram: "attention",
  exercises: [
    {
      prompt: "Produce a reviewable compile-only evidence bundle.",
      hint: "Retain source and HSACO digests, compiler versions, the full command, symbol-scoped disassembly, and the non-gfx950 device observation separately.",
      acceptance:
        "The bundle proves which object was inspected and leaves runtime/oracle/performance fields pending.",
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
