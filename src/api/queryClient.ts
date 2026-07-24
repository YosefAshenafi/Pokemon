import AsyncStorage from '@react-native-async-storage/async-storage';
import { experimental_createQueryPersister } from '@tanstack/query-persist-client-core';
import { QueryClient } from '@tanstack/react-query';

import { isPersistedQueryKey } from './queryKeys';

export const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

/** Bump the suffix if the persisted-cache shape changes and old rows must be purged. */
export const CACHE_MIGRATION_KEY = 'cache-migrated-v2';

/**
 * One AsyncStorage key per query rather than one giant blob, which would hit
 * Android's ~2 MB SQLite CursorWindow per-row limit. Only the small queries in
 * `isPersistedQueryKey` are written: Pokémon detail (~200 KB) and move detail
 * (700+ learners on a popular TM) would fill Android's ~6 MB total budget while
 * browsing. Both still open from the in-memory cache within a session.
 */
export const persister = experimental_createQueryPersister({
  storage: AsyncStorage,
  maxAge: CACHE_MAX_AGE,
  buster: 'v1',
  filters: { predicate: (query) => isPersistedQueryKey(query.queryKey) },
});

/**
 * The app's single QueryClient. Lives here rather than in the root route so the
 * route file stays about routing, and so tests can reset the cache between runs
 * without reaching into a screen module.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: CACHE_MAX_AGE,
      retry: 2,
      persister: persister.persisterFn,
    },
  },
});

/**
 * Drops every cached and persisted entry. Used by the one-time migration below
 * and by the test suite to isolate runs.
 */
export async function purgeLegacyCacheKeys(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const stale = keys.filter((k) => k === 'pokedex-query-cache' || k.startsWith('tanstack-query'));
  if (stale.length) await AsyncStorage.multiRemove(stale);
}
