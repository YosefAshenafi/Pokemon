import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { getAllPokemonNames, getPokemon } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';
import { STATIC_STALE_TIME } from '@/constants/cache';

export interface PokedexPrefetch {
  prefetchDetail: (name: string) => void;
  prefetchSearchIndex: () => void;
}

/** Prefetches: the detail on card press-in, the name index on search focus. */
export function usePokedexPrefetch(): PokedexPrefetch {
  const queryClient = useQueryClient();

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

  const prefetchSearchIndex = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.names,
      queryFn: getAllPokemonNames,
      staleTime: STATIC_STALE_TIME,
    });
  }, [queryClient]);

  return { prefetchDetail, prefetchSearchIndex };
}
