import { useQuery, useQueryClient } from '@tanstack/react-query';

import { buildPokemonTypeIndex, getPokemonByType } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';

/**
 * A `name -> types` map for the whole Pokédex, built once from the 18 type
 * endpoints. List cards read their type chips from this instead of each fetching
 * a full Pokémon detail, so scrolling stays fast no matter how deep it goes.
 *
 * Each type is loaded through `ensureQueryData` under the same key the type
 * filter uses, so the two features share one request per type rather than
 * downloading every roster twice. Partial results are published as batches land
 * so chips appear progressively; if every type fails the query errors (and so
 * caches nothing) and the list screen's pull-to-refresh retries it.
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
