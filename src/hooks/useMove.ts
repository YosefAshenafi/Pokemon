import { useQuery } from '@tanstack/react-query';

import { getMove } from '@/api/pokeapi';

/** Detail for one move, opened from a Pokémon's move list. */
export function useMove(name: string) {
  return useQuery({
    queryKey: ['move', 'detail', name.toLowerCase()],
    queryFn: () => getMove(name),
    staleTime: Infinity, // move data never changes mid-session
    enabled: name.length > 0,
  });
}
