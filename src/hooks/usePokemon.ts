import { useQuery } from '@tanstack/react-query';

import { getPokemon } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';
import { STATIC_STALE_TIME } from '@/constants/cache';

/** Full detail for one Pokémon. */
export function usePokemon(nameOrId: string | number) {
  return useQuery({
    queryKey: queryKeys.detail(nameOrId),
    queryFn: () => getPokemon(nameOrId),
    staleTime: STATIC_STALE_TIME,
    enabled: String(nameOrId).length > 0,
  });
}
