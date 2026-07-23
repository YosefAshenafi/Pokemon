import { useQuery, useQueryClient } from '@tanstack/react-query';

import { buildPokemonTypeIndex, getPokemonByType } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';

/**
 * A `name -> types` map for the whole Pokédex, read by the list cards instead
 * of each fetching a full Pokémon detail. Types load through `ensureQueryData`
 * under the same keys the type filter uses, so the two share one request per
 * type, and batches are published as they land so chips appear progressively.
 */
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
            staleTime: Infinity,
          }),
        (partial) => queryClient.setQueryData(queryKeys.typeIndex, partial),
      ),
    staleTime: Infinity, // a Pokémon's types never change
  });
}
