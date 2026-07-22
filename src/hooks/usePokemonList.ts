import { useInfiniteQuery } from '@tanstack/react-query';

import { getPokemonPage } from '@/api/pokeapi';

/** Paginated Pokédex list for the home screen's infinite scroll. */
export function usePokemonList() {
  return useInfiniteQuery({
    queryKey: ['pokemon', 'list'],
    queryFn: ({ pageParam }) => getPokemonPage(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    select: (data) => data.pages.flatMap((page) => page.pokemon),
  });
}
