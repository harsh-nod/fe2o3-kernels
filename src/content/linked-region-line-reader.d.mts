export class LinkedLineBytes extends Uint8Array {
  subarray(begin?: number, end?: number): LinkedLineBytes;
  readUInt16LE(at: number): number;
  readUInt32LE(at: number): number;
  readBigUInt64LE(at: number): bigint;
  toString(encoding?: string): string;
}
export function createLinkedLineReader(digestFor: (bytes: LinkedLineBytes) => string): unknown;
