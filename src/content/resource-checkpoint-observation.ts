/** Neutral retained DTO input for read-only checkpoint projections.
 * This type does not assert imported JSONL bytes, wire custody or producer trust.
 * Runtime source/SSA projector guards remain the authority for presentation. */
import type { ResourceSnapshotAnchor } from "./resource-memory-view";

export interface ResourceCheckpointObservation {
  readonly anchor: ResourceSnapshotAnchor;
  readonly anchorKey: string;
  readonly control: {
    readonly kind: string;
    readonly requestId: number;
    readonly request: unknown;
    readonly response: unknown;
  };
}
