import { useQuery } from '@tanstack/react-query';

import { getPokemonTypeIndex } from '@/api/pokeapi';

/**
 * A `name -> types` map for the whole Pokédex, built once from the 18 type
 * endpoints. List cards read their type chips from this instead of each fetching
 * a full Pokémon detail, so scrolling stays fast no matter how deep it goes.
 * Types never change, so it is cached for the session and persisted (it is small).
 */
export function usePokemonTypeIndex() {
  return useQuery({
    queryKey: ['pokemon', 'type-index'],
    queryFn: getPokemonTypeIndex,
    staleTime: Infinity,
  });
}
