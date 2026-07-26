import { useQuery, useQueryClient } from '@tanstack/react-query';

import { buildPokemonTypeIndex, getPokemonByType } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';
import { STATIC_STALE_TIME } from '@/constants/cache';

/** A `name -> types` map for the whole Pokédex, read by the list cards. */
export function usePokemonTypeIndex() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.typeIndex,
    queryFn: () =>
      buildPokemonTypeIndex(
        (type) =>
          queryClient.ensureQueryData({
            queryKey: queryKeys.type(type),
            queryFn: () => getPokemonByType(type),
            staleTime: STATIC_STALE_TIME,
          }),
        (partial) => queryClient.setQueryData(queryKeys.typeIndex, partial),
      ),
    staleTime: STATIC_STALE_TIME,
  });
}
