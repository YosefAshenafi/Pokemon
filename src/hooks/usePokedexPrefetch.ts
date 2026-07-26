import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { getAllPokemonNames, getPokemon } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';
import { STATIC_STALE_TIME } from '@/constants/cache';

export interface PokedexPrefetch {
  prefetchDetail: (name: string) => void;
  prefetchSearchIndex: () => void;
}

/**
 * Work started early because of something the user did, before they ask for the
 * result. Kept apart from the queries that answer the current screen: these are
 * bets on the next one, and nothing rendered depends on whether they land.
 */
export function usePokedexPrefetch(): PokedexPrefetch {
  const queryClient = useQueryClient();

  // Press-in gives the detail request a head start on the navigation animation,
  // without the N+1 that prefetching every visible card would bring back.
  const prefetchDetail = useCallback(
    (name: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.detail(name),
        queryFn: () => getPokemon(name),
        staleTime: STATIC_STALE_TIME,
      });
    },
    [queryClient],
  );

  // The name index is ~1300 entries fetched in one request. Starting it when the
  // field takes focus moves that download into the moment the user is reaching
  // for the keyboard, instead of onto the first keystroke.
  const prefetchSearchIndex = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.names,
      queryFn: getAllPokemonNames,
      staleTime: STATIC_STALE_TIME,
    });
  }, [queryClient]);

  return { prefetchDetail, prefetchSearchIndex };
}
