/** Local selection of already validated, bounded retained rows. This creates no
 * snapshot, backend query, source association, or memory-at-access observation. */
import { resourceAccessScopeLabel, type ResourceAccessProjection, type ResourceAccessRow } from "./resource-access-view";
import type { ResourceScope } from "./resource-memory-view";

export type ReadyResourceAccessPage = Extract<ResourceAccessProjection, { status: "ready"; kind: "memory_accesses" }>;
export interface ResourceAccessSelection {
  readonly pageKey: string;
  readonly waveKey: string | null;
  readonly scopeKey: string | null;
  readonly eventSequence: number | null;
}
interface Option { readonly key: string; readonly label: string }

export function resourceAccessPageKey(projection: Extract<ResourceAccessProjection, { status: "ready" }>): string {
  // Exact bounded page contents also reset local state if a caller replaces a
  // response while reusing its request ID. This is not an authenticated digest.
  return JSON.stringify([projection.anchorKey, projection.contextKey, projection.requestId, projection.kind,
    projection.sourceCount, projection.scanned, projection.completeness, projection.hasMorePages, projection.rows]);
}

function waveKey(scope: ResourceScope): string | null {
  return scope.level === "lane" || scope.level === "wave"
    ? JSON.stringify([scope.workgroup, scope.wave_width, scope.wave]) : null;
}
function scopeKey(scope: ResourceScope): string {
  if (scope.level === "dispatch") return JSON.stringify([scope.level]);
  if (scope.level === "workgroup") return JSON.stringify([scope.level, scope.workgroup]);
  return JSON.stringify([scope.level, scope.workgroup, scope.wave_width, scope.wave, scope.lane ?? null]);
}

export function resourceAccessNavigation(projection: ReadyResourceAccessPage, selection: ResourceAccessSelection | null) {
  const pageKey = resourceAccessPageKey(projection);
  const current = selection?.pageKey === pageKey ? selection : null;
  const waves = new Map<string, Option>();
  for (const row of projection.rows) {
    const scope = row.occurrence.scope, key = waveKey(scope);
    if (key !== null && (scope.level === "wave" || scope.level === "lane")) {
      waves.set(key, { key, label: `Workgroup [${scope.workgroup.join(", ")}], logical wave ${scope.wave} (width ${scope.wave_width})` });
    }
  }
  const selectedWave = current?.waveKey ?? null;
  const waveRows = projection.rows.filter((row) => selectedWave === null || waveKey(row.occurrence.scope) === selectedWave);
  const scopes = new Map<string, Option>();
  for (const row of waveRows) {
    const key = scopeKey(row.occurrence.scope);
    scopes.set(key, { key, label: resourceAccessScopeLabel(row.occurrence.scope) });
  }
  const selectedScope = current?.scopeKey ?? null;
  const rows = waveRows.filter((row) => selectedScope === null || scopeKey(row.occurrence.scope) === selectedScope);
  // A missing requested event is not replaced by a nearest/earlier row. Null is
  // the explicit initial selection; arbitrary stale IDs remain unavailable.
  const selectedIndex = current?.eventSequence == null ? (rows.length ? 0 : -1)
    : rows.findIndex((row) => row.occurrence.event_sequence === current.eventSequence);
  const selected: ResourceAccessRow | null = selectedIndex < 0 ? null : rows[selectedIndex];
  return { pageKey, waveOptions: [...waves.values()], scopeOptions: [...scopes.values()], rows, selected, selectedIndex,
    selection: { pageKey, waveKey: selectedWave, scopeKey: selectedScope, eventSequence: selected?.occurrence.event_sequence ?? null } };
}
