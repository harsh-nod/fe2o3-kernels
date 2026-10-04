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

export const currentVecaddKernelSource: Omit<CodeTab, "kind" | "label"> = {
  language: "rust",
  code: vecaddKernel,
  sourcePath: "examples/vecadd/src/lib.rs",
  sourceCommit: "302aabc3ed80fe39d5655fbb39fca7cb5859bd9c",
  sourceSha256: "60ea857d0aaba57e05fc30691b15908c188e449c789c39abd27abf4c35b017e2",
  sourceDigestScope: "file",
  explanatory: false,
  notice,
};

export const currentVecaddKernelTab: CodeTab = {
  kind: "kernel",
  label: "Current source [SOURCE-ONLY]",
  ...currentVecaddKernelSource,
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
  "wave64-collectives-current-source-v1": {
    lessonId: "reductions-scans",
    authority: "source-association-only",
    source: currentWaveKernelTab,
  },
  "workgroup-sync-current-source-v1": {
    lessonId: "lds-barriers-atomics",
    authority: "source-association-only",
    source: currentWorkgroupKernelTab,
  },
  "moe-top2-current-source-v1": {
    lessonId: "moe-routing",
    authority: "source-association-only",
    source: currentMoeKernelTab,
  },
} satisfies Record<SourceAssociationId, {
  lessonId: string;
  authority: "source-association-only";
  source: CodeTab;
}>);

export const sourceAssociationLessonIds = Object.freeze(
  Object.values(sourceAssociationRecords).map((record) => record.lessonId),
);

export function isSourceAssociationId(value: unknown): value is SourceAssociationId {
  return typeof value === "string" && hasOwn(sourceAssociationRecords, value);
}

export function sourceAssociationRecord(id: SourceAssociationId) {
  return sourceAssociationRecords[id];
}
