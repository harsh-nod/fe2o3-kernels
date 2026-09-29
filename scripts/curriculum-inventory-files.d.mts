import type { Buffer } from "node:buffer";

export function authenticateTrackedTree(root: string, treeListing: Buffer): { files: number; bytes: number };
export function publishInventoryExclusive(output: string, bytes: Buffer): void;
