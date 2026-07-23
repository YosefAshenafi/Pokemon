/**
 * Every React Query key used by the app, in one place. Keys are shared across
 * hooks, prefetches and the persistence allowlist, so defining them here keeps
 * those in agreement — a card's prefetch writes the key the detail screen reads,
 * and the type index reuses the same per-type entries the type filter fetches.
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
 * Key prefixes whose data is small and bounded enough to survive a restart.
 * Deliberately an allowlist: a newly added query is not persisted until it is
 * listed here, so an unbounded response can never silently fill up storage.
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
