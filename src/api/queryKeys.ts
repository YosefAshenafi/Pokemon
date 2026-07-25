/**
 * Every React Query key in one place, so the hooks, the prefetches and the
 * persistence allowlist below can't drift apart.
 */
export const queryKeys = {
  list: ['pokemon', 'list'] as const,
  names: ['pokemon', 'names'] as const,
  typeIndex: ['pokemon', 'type-index'] as const,
  type: (type: string) => ['pokemon', 'type', type] as const,
  detail: (nameOrId: string | number) =>
    ['pokemon', 'detail', String(nameOrId).trim().toLowerCase()] as const,
  move: (name: string) => ['move', 'detail', name.trim().toLowerCase()] as const,
};

/**
 * Key prefixes small enough to survive a restart. An allowlist, not a denylist:
 * a new query isn't persisted until it is listed here, so an unbounded response
 * can never silently fill up storage.
 */
const PERSISTED_KEY_PREFIXES: readonly (readonly unknown[])[] = [
  queryKeys.list,
  queryKeys.names,
  queryKeys.typeIndex,
  ['pokemon', 'type'],
];

/** Whether a query's result may be written to AsyncStorage. */
export function isPersistedQueryKey(queryKey: readonly unknown[]): boolean {
  return PERSISTED_KEY_PREFIXES.some((prefix) =>
    prefix.every((part, i) => queryKey[i] === part),
  );
}
