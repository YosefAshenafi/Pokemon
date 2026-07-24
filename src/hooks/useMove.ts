import { useQuery } from '@tanstack/react-query';

import { getMove } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';
import { STATIC_STALE_TIME } from '@/constants/cache';

/** Detail for one move, opened from a Pokémon's move list. */
export function useMove(name: string) {
  return useQuery({
    queryKey: queryKeys.move(name),
    queryFn: () => getMove(name),
    staleTime: STATIC_STALE_TIME, // move data never changes mid-session
    enabled: name.length > 0,
  });
}
