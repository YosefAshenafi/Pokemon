import AsyncStorage from '@react-native-async-storage/async-storage';
import { experimental_createQueryPersister } from '@tanstack/query-persist-client-core';
import { QueryCache, QueryClient } from '@tanstack/react-query';

import {
  CACHE_BUSTER,
  CACHE_MAX_AGE,
  DEFAULT_STALE_TIME,
  LEGACY_CACHE_KEY,
  LEGACY_CACHE_KEY_PREFIX,
  QUERY_RETRY_COUNT,
} from '@/constants/cache';

import { isReportableError } from './pokeapi';
import { isPersistedQueryKey } from './queryKeys';
import { reportError } from './reportError';

/** Persists allowlisted small queries to AsyncStorage, one key per query. */
export const persister = experimental_createQueryPersister({
  storage: AsyncStorage,
  maxAge: CACHE_MAX_AGE,
  buster: CACHE_BUSTER,
  filters: { predicate: (query) => isPersistedQueryKey(query.queryKey) },
});

/** The app's single QueryClient. */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (isReportableError(error)) reportError(error, { queryKey: query.queryKey });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME,
      gcTime: CACHE_MAX_AGE,
      retry: QUERY_RETRY_COUNT,
      persister: persister.persisterFn,
    },
  },
});

/** Removes cache entries written by earlier builds. */
export async function purgeLegacyCacheKeys(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const stale = keys.filter(
    (k) => k === LEGACY_CACHE_KEY || k.startsWith(LEGACY_CACHE_KEY_PREFIX),
  );
  if (stale.length) await AsyncStorage.multiRemove(stale);
}
