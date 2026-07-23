import { useQuery } from '@tanstack/react-query';

import { getPokemon } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';

/**
 * Detail for one Pokémon, backing the detail screen. The list screen prefetches
 * the same key when a card is pressed down, so by the time the navigation
 * animation finishes the screen usually renders straight from cache.
 */
export function usePokemon(nameOrId: string | number) {
  return useQuery({
    queryKey: queryKeys.detail(nameOrId),
    queryFn: () => getPokemon(nameOrId),
    staleTime: Infinity, // base data for a Pokémon never changes mid-session
    enabled: String(nameOrId).length > 0,
  });
}
