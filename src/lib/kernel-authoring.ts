import type { CodeTab } from "../content/model";

const legacyNamespaceAssignment =
  /\bnamespace[\t ]*=[\t ]*"[0-9a-f]{64}"/u;
const legacyNamespaceLine =
  /^[\t ]*namespace[\t ]*=[\t ]*"[0-9a-f]{64}",?[\t ]*(?:\r?\n|$)/gmu;

export interface KernelAuthoringProjection {
  code: string;
  removedNamespaceCount: number;
}

export function projectKernelAuthoringSource(
  source: string,
): KernelAuthoringProjection {
  if (!legacyNamespaceAssignment.test(source)) {
    return { code: source, removedNamespaceCount: 0 };
  }

  if (!source.includes("kernel(")) {
    throw new Error("legacy kernel namespace found outside a kernel attribute");
  }

  const matches = source.match(legacyNamespaceLine) ?? [];
  const code = source.replace(legacyNamespaceLine, "");
  if (matches.length === 0 || legacyNamespaceAssignment.test(code)) {
    throw new Error("unsupported legacy kernel namespace syntax");
  }

  return { code, removedNamespaceCount: matches.length };
}

export function authorFacingCode(tab: CodeTab): KernelAuthoringProjection {
  if (tab.kind !== "kernel" || tab.language !== "rust") {
    return { code: tab.code, removedNamespaceCount: 0 };
  }
  return projectKernelAuthoringSource(tab.code);
}
