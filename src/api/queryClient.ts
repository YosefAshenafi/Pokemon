import AsyncStorage from '@react-native-async-storage/async-storage';
import { experimental_createQueryPersister } from '@tanstack/query-persist-client-core';
import { QueryClient } from '@tanstack/react-query';

import {
  CACHE_BUSTER,
  CACHE_MAX_AGE,
  DEFAULT_STALE_TIME,
  LEGACY_CACHE_KEY,
  LEGACY_CACHE_KEY_PREFIX,
  QUERY_RETRY_COUNT,
} from '@/constants/cache';

import { isPersistedQueryKey } from './queryKeys';

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
  buster: CACHE_BUSTER,
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
      staleTime: DEFAULT_STALE_TIME,
      gcTime: CACHE_MAX_AGE,
      retry: QUERY_RETRY_COUNT,
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
  const stale = keys.filter(
    (k) => k === LEGACY_CACHE_KEY || k.startsWith(LEGACY_CACHE_KEY_PREFIX),
  );
  if (stale.length) await AsyncStorage.multiRemove(stale);
}
