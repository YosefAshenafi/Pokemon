import { useQuery } from '@tanstack/react-query';

import { getPokemon } from '@/api/pokeapi';

/**
 * Detail for one Pokémon. Shared by the detail screen and the list cards
 * (which need types), so by the time a card has been seen the detail screen
 * opens from cache instantly.
 */
export function usePokemon(nameOrId: string | number) {
  return useQuery({
    queryKey: ['pokemon', 'detail', String(nameOrId).toLowerCase()],
    queryFn: () => getPokemon(nameOrId),
    staleTime: Infinity, // base data for a Pokémon never changes mid-session
    enabled: String(nameOrId).length > 0,
  });
}
