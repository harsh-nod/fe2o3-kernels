import gptScalarAttentionKernel from "../../examples/gfx950_gpt_oss_decode/src/kernel_scalar_attention_current.rs?raw";
import gemmKernel from "../../examples/tiled_gemm_general_v1/src/kernel_current.rs?raw";
import moeKernel from "../../examples/moe_top2_v1/src/kernel_current.rs?raw";
import waveKernel from "../../examples/wave64_collectives_v1/src/kernel_current.rs?raw";
import scalarGemmKernel from "../../examples/scalar_gemm_v1/src/kernel.rs?raw";
import vecaddKernel from "../../examples/vecadd/src/lib_current.rs?raw";
import workgroupKernel from "../../examples/workgroup_sync_v1/src/kernel_current.rs?raw";
import type { CodeTab, SourceAssociationId } from "./model";
import { deepFreeze, hasOwn } from "./registry";

const notice =
  "Source association only; this exact whole-file snapshot qualifies no SIMT/tile pair. " +
  "Historical source-model and GPU evidence belongs to its original source, not this tab. " +
  "Current source export, simulation, native execution and paired correctness remain pending.";

export const currentGptScalarAttentionKernelTab: CodeTab = {
  kind: "kernel",
  label: "Scalar attention [COMPILER-REJECTED]",
  evidenceId: "gpt-scalar-attention-current-source-v1",
  language: "rust",
  code: gptScalarAttentionKernel,
  sourcePath: "examples/gfx950_gpt_oss_decode/src/kernel_scalar_attention.rs",
  sourceCommit: "1d4e714492b5df9dce236c8ed80c50db117c08fb",
  sourceSha256: "7acece0280e117d64cfe28b673413535fb35ad5f94afd092208173cc051ff0f9",
  sourceDigestScope: "file",
  explanatory: false,
  notice: notice +
    " The COMPILER-REJECTED label preserves the historical compiler-rejected WG256/grid4 scalar-attention result at " +
    "3d10825df93a86644cc5a5b006cadd45f71afb91: a call terminator was reached before exact " +
    "callable memory-effect summaries were available; that source had no HSACO, numerical " +
    "result, or latency result. This historical rejection does not establish acceptance " +
    "or rejection of the current source snapshot.",
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
  sourceCommit: "302aabc3ed80fe39d5655fbb39fca7cb5859bd9c",
  sourceSha256: "60ea857d0aaba57e05fc30691b15908c188e449c789c39abd27abf4c35b017e2",
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
