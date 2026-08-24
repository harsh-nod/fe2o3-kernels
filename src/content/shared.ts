import type { CodeTab, EvidenceKind } from "./model";

export const noKernel = `// This lesson has no additional runnable GPU kernel.\n// Read the evidence label before treating any snippet as executable.`;

export const noProof = `// No Verus theorem is claimed for this lesson.\n// The proof tab records the obligation that remains.`;

export const noHost = `# No host launch is available for this design lesson.\n# Follow the listed CPU/model checks instead.`;

export function resultText(kind: EvidenceKind, detail: string): string {
  return `${kind}\n\n${detail}`;
}

export function completeTabs(
  kernel: Omit<CodeTab, "kind" | "label">,
  verus: Omit<CodeTab, "kind" | "label">,
  host: Omit<CodeTab, "kind" | "label">,
  result: Omit<CodeTab, "kind" | "label">,
): CodeTab[] {
  return [
    { kind: "kernel", label: "Kernel", ...kernel },
    { kind: "verus", label: "Verus proof", ...verus },
    { kind: "host", label: "Host", ...host },
    { kind: "result", label: "Expected result", ...result },
  ];
}

export function completeReferenceTabs(
  kernel: Omit<CodeTab, "kind" | "label">,
  reference: Omit<CodeTab, "kind" | "label">,
  verus: Omit<CodeTab, "kind" | "label">,
  host: Omit<CodeTab, "kind" | "label">,
  result: Omit<CodeTab, "kind" | "label">,
): CodeTab[] {
  return [
    { kind: "kernel", label: "Kernel", ...kernel },
    { kind: "reference", label: "Safe CPU reference", ...reference },
    { kind: "verus", label: "Verus proof", ...verus },
    { kind: "host", label: "Host", ...host },
    { kind: "result", label: "Expected result", ...result },
  ];
}
