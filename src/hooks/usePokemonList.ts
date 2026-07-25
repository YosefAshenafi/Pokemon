import { useInfiniteQuery } from '@tanstack/react-query';

import { getPokemonPage } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';

/** Paginated Pokédex list for the home screen's infinite scroll. */
export function usePokemonList() {
  return useInfiniteQuery({
    queryKey: queryKeys.list,
    queryFn: ({ pageParam }) => getPokemonPage(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    select: (data) => data.pages.flatMap((page) => page.pokemon),
  });
}
