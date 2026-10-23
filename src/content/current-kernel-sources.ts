import rowSoftmaxKernel from "../../examples/row_softmax_general_v1/src/kernel_current.rs?raw";
import groupedExpertMoeKernel from "../../examples/moe_grouped_expert_general_v1/src/kernel_current.rs?raw";
import flashAttentionKernel from "../../examples/flash_attention_general_v1/src/kernel_current.rs?raw";
import gptScalarAttentionKernel from "../../examples/gfx950_gpt_oss_decode/src/kernel_scalar_attention_current.rs?raw";
import gemmKernel from "../../examples/tiled_gemm_general_v1/src/kernel_current.rs?raw";
import moeKernel from "../../examples/moe_top2_v1/src/kernel_current.rs?raw";
import waveKernel from "../../examples/wave64_collectives_v1/src/kernel_current.rs?raw";
import scalarGemmKernel from "../../examples/scalar_gemm_v1/src/kernel.rs?raw";
import vecaddKernel from "../../examples/vecadd/src/lib_gfx950_current.rs?raw";
import workgroupKernel from "../../examples/workgroup_sync_v1/src/kernel_current.rs?raw";
import type { CodeTab, SourceAssociationId } from "./model";
import { deepFreeze, hasOwn } from "./registry";

const notice =
  "Source association only; this exact whole-file snapshot qualifies no SIMT/tile pair. " +
  "Historical source-model and GPU evidence belongs to its original source, not this tab. " +
  "Current source export, simulation, native execution and paired correctness remain pending.";

export const currentRowSoftmaxKernelTab: CodeTab = {
  kind: "kernel",
  label: "Kernel",
  evidenceId: "row-softmax-current-source-v1",
  language: "rust",
  code: rowSoftmaxKernel,
  sourcePath: "examples/row_softmax_general_v1/src/kernel.rs",
  sourceCommit: "044b85871308076c7a15d1c20c7794069fd73bb2",
  sourceSha256: "06896717d72deee6e52f957979c796a19ebb22146e9512abf7fdd3c5de366ba8",
  sourceDigestScope: "file",
  explanatory: false,
  notice,
};

export const currentGroupedExpertMoeKernelTab: CodeTab = {
  kind: "kernel",
  label: "Kernel",
  evidenceId: "grouped-expert-moe-current-source-v1",
  language: "rust",
  code: groupedExpertMoeKernel,
  sourcePath: "examples/moe_grouped_expert_general_v1/src/kernel.rs",
  sourceCommit: "d558aa97758cf553c956c5ce92178eac96bd2461",
  sourceSha256: "9e31980d48320d2978823af76465f882a99263137ba828261f605e74afc110a7",
  sourceDigestScope: "file",
  explanatory: false,
  notice,
};

export const currentGptSourceCommit = "d670b3cfc3a04f39dcf37bd9e6b3d3bf1a9bbfba";

export const currentFlashAttentionKernelTab: CodeTab = {
  kind: "kernel",
  label: "Kernel",
  evidenceId: "flash-attention-current-source-v1",
  language: "rust",
  code: flashAttentionKernel,
  sourcePath: "examples/flash_attention_general_v1/src/kernel.rs",
  sourceCommit: "055ffa8dccc70fccc7675721f98f2b096abd68e7",
  sourceSha256: "72fd0148eb5a29c0747ec6b96616eeb4aed15939b365890846c49e1c1d0fbc50",
  sourceDigestScope: "file",
  explanatory: false,
  notice,
};

export const currentGptScalarAttentionKernelTab: CodeTab = {
  kind: "kernel",
  label: "Scalar attention",
  evidenceId: "gpt-scalar-attention-current-source-v1",
  language: "rust",
  code: gptScalarAttentionKernel,
  sourcePath: "examples/gfx950_gpt_oss_decode/src/kernel_scalar_attention.rs",
  sourceCommit: currentGptSourceCommit,
  sourceSha256: "5531e12d47e1d3c39c6b56a01335f97fd669fa4d0b8b709633a53cccab4d5a9d",
  sourceDigestScope: "file",
  explanatory: false,
  notice:
    "Current source association only. The scalar-attention SIMT and tile runners passed " +
    "gfx950 compilation, ISA checks and the full HSA numerical oracle on 2026-10-23 " +
    "with compiler d9c709d86b099ec45377a6c979c3d355c4ddd1c9. " +
    "The tested code blobs match this source anchor. The paired source is public in PR #341; " +
    "normal CI and curriculum integration remain separate. No formal qualification or performance result is claimed. " +
    "Historical compiler-rejected evidence remains at " +
    "3d10825df93a86644cc5a5b006cadd45f71afb91: a call terminator was reached before exact " +
    "callable memory-effect summaries were available; that historical source had no HSACO, " +
    "numerical result, or latency result. Its rejection and timing records do not transfer " +
    "to this current source.",
};

export const currentGemmKernelTab: CodeTab = {
  kind: "kernel",
  label: "Kernel",
  evidenceId: "tiled-gemm-current-source-v1",
  language: "rust",
  code: gemmKernel,
  sourcePath: "examples/tiled_gemm_general_v1/src/kernel.rs",
  sourceCommit: "0e0963df4f230bf728a7b4605677c0ff09624adf",
  sourceSha256: "ef3bbea31da5311bfb5bfb9edb9f43569e602501c079bebb16eb5f0c6b5973b4",
  sourceDigestScope: "file",
  explanatory: false,
  notice,
};

export const currentMoeKernelTab: CodeTab = {
  kind: "kernel",
  label: "Kernel",
  evidenceId: "moe-top2-current-source-v1",
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
  label: "Kernel",
  language: "rust",
  code: waveKernel,
  sourcePath: "examples/wave64_collectives_v1/src/kernel.rs",
  sourceCommit: "5e35bd967e3e038cc6399c46ed8cb89db82405cd",
  sourceSha256: "3f7064730fdb52aa815cace2bcfd9a666628302506b14771c05487c95922eb4d",
  evidenceId: "wave64-collectives-current-source-v1",
  sourceDigestScope: "file",
  explanatory: false,
  notice,
};

export const currentVecaddKernelTab: CodeTab = {
  kind: "kernel",
  label: "Current source [SOURCE-ONLY]",
  language: "rust",
  code: vecaddKernel,
  sourcePath: "examples/vecadd/src/lib.rs",
  sourceCommit: "7404720885b13ee77bef4c48364993b463f25a6a",
  sourceSha256: "96a6d5774c0d36661540829025194c918100abcce53fed91cae3c909aea67345",
  sourceDigestScope: "file",
  explanatory: false,
  notice,
};

export const currentWorkgroupKernelTab: CodeTab = {
  kind: "kernel",
  label: "Kernel",
  evidenceId: "workgroup-sync-current-source-v1",
  language: "rust",
  code: workgroupKernel,
  sourcePath: "examples/workgroup_sync_v1/src/kernel.rs",
  sourceCommit: "302aabc3ed80fe39d5655fbb39fca7cb5859bd9c",
  sourceSha256: "b0074b426ef8ad0b9eea91e933e76dd03240852ce4ce976ccc89c1f2c7f1b515",
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

// These links authenticate source bytes only. The existing tab owns the identity;
// no execution claim or second curriculum/source inventory is created here.
const sourceAssociationRecords = deepFreeze({
  "flash-attention-current-source-v1": {
    lessonId: "flash-attention",
    tabOrdinal: 0,
    authority: "source-association-only",
    source: currentFlashAttentionKernelTab,
  },
  "row-softmax-current-source-v1": {
    lessonId: "softmax-invariant",
    tabOrdinal: 0,
    authority: "source-association-only",
    source: currentRowSoftmaxKernelTab,
  },
  "grouped-expert-moe-current-source-v1": {
    lessonId: "moe-expert-compute",
    tabOrdinal: 0,
    authority: "source-association-only",
    source: currentGroupedExpertMoeKernelTab,
  },
  "gpt-scalar-attention-current-source-v1": {
    lessonId: "gfx950-gpt-oss-120b-megakernel",
    tabOrdinal: 6,
    authority: "source-association-only",
    source: currentGptScalarAttentionKernelTab,
  },
  "tiled-gemm-current-source-v1": {
    lessonId: "gemm-tiling",
    tabOrdinal: 0,
    authority: "source-association-only",
    source: currentGemmKernelTab,
  },
  "wave64-collectives-current-source-v1": {
    lessonId: "reductions-scans",
    tabOrdinal: 0,
    authority: "source-association-only",
    source: currentWaveKernelTab,
  },
  "workgroup-sync-current-source-v1": {
    lessonId: "lds-barriers-atomics",
    tabOrdinal: 0,
    authority: "source-association-only",
    source: currentWorkgroupKernelTab,
  },
  "moe-top2-current-source-v1": {
    lessonId: "moe-routing",
    tabOrdinal: 0,
    authority: "source-association-only",
    source: currentMoeKernelTab,
  },
} satisfies Record<SourceAssociationId, {
  lessonId: string;
  tabOrdinal: number;
  authority: "source-association-only";
  source: CodeTab;
}>);

export const primarySourceAssociationLessonIds = Object.freeze(
  Object.values(sourceAssociationRecords)
    .filter((record) => record.tabOrdinal === 0)
    .map((record) => record.lessonId),
);

export const sourceAssociationLessonIds = Object.freeze(
  Object.values(sourceAssociationRecords).map((record) => record.lessonId),
);

export function isSourceAssociationId(value: unknown): value is SourceAssociationId {
  return typeof value === "string" && hasOwn(sourceAssociationRecords, value);
}

export function sourceAssociationRecord(id: SourceAssociationId) {
  return sourceAssociationRecords[id];
}
