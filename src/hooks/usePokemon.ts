import { useQuery } from '@tanstack/react-query';

import { getPokemon } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';

/**
 * Detail for one Pokémon. The list screen prefetches this same key on press-in,
 * so the screen usually renders from cache by the time it animates in.
 */
export function usePokemon(nameOrId: string | number) {
  return useQuery({
    queryKey: queryKeys.detail(nameOrId),
    queryFn: () => getPokemon(nameOrId),
    staleTime: Infinity, // base data for a Pokémon never changes mid-session
    enabled: String(nameOrId).length > 0,
  });
}
