import moeKernel from "../../examples/moe_top2_v1/src/kernel_current.rs?raw";
import waveKernel from "../../examples/wave64_collectives_v1/src/kernel_current.rs?raw";
import scalarGemmKernel from "../../examples/scalar_gemm_v1/src/kernel.rs?raw";
import type { CodeTab } from "./model";

const notice =
  "Source association only; this exact whole-file snapshot qualifies no SIMT/tile pair. " +
  "Historical source-model and GPU evidence belongs to its original source, not this tab. " +
  "Current source export, simulation, native execution and paired correctness remain pending.";

export const currentMoeKernelTab: CodeTab = {
  kind: "kernel",
  label: "Current source [SOURCE-ONLY]",
  language: "rust",
  code: moeKernel,
  sourcePath: "examples/moe_top2_v1/src/kernel.rs",
  sourceCommit: "5e35bd967e3e038cc6399c46ed8cb89db82405cd",
  sourceSha256: "8b8b3477b7d9670b7a0356b05ff2aaab2aaec9f0b919bf26c4c46215d1a81eb4",
  sourceDigestScope: "file",
  explanatory: false,
  notice,
};

export const currentWaveKernelTab: CodeTab = {
  kind: "kernel",
  label: "Current source [SOURCE-ONLY]",
  language: "rust",
  code: waveKernel,
  sourcePath: "examples/wave64_collectives_v1/src/kernel.rs",
  sourceCommit: "5e35bd967e3e038cc6399c46ed8cb89db82405cd",
  sourceSha256: "3f7064730fdb52aa815cace2bcfd9a666628302506b14771c05487c95922eb4d",
  sourceDigestScope: "file",
  explanatory: false,
  notice,
};

export const scalarGemmKernelTab: CodeTab = {
  kind: "kernel",
  label: "Scalar source [SOURCE-ONLY]",
  language: "rust",
  code: scalarGemmKernel,
  sourcePath: "examples/scalar_gemm_v1/src/kernel.rs",
  sourceCommit: "6399ee2cf8456c6237a89d5507f50c1872602269",
  sourceSha256: "b3a21a1fdd7f6fbede2437551500cabddb4500d4a07371f821a2c9a8ab620b21",
  sourceDigestScope: "file",
  explanatory: false,
  notice,
};
