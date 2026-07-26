import { useQuery } from '@tanstack/react-query';

import { getMove } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';
import { STATIC_STALE_TIME } from '@/constants/cache';

/** Full detail for one move. */
export function useMove(name: string) {
  return useQuery({
    queryKey: queryKeys.move(name),
    queryFn: () => getMove(name),
    staleTime: STATIC_STALE_TIME,
    enabled: name.length > 0,
  });
}
