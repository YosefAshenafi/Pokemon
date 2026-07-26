import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { PokemonPage } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';

import type { PokedexFilters } from './usePokedexFilters';
import { usePokemonList } from './usePokemonList';
import { usePokemonTypeIndex } from './usePokemonTypeIndex';

/**
 * The part of the filter state that decides whether paging applies at all.
 * Narrowed with `Pick` for the same reason `PokedexQuery` is: this hook reacts
 * to a request, it must not be able to change one.
 */
export type PokedexPageState = Pick<PokedexFilters, 'isSearching' | 'isFiltering'>;

export interface PokedexPagination {
  /** Whether the grid is showing the paginated Pokédex rather than a filtered set. */
  isPaginated: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

/**
 * Moving through the Pokédex: the next page, and starting over from the top.
 *
 * Separate from `usePokedexResults` because paging is not part of deciding
 * *which* query is authoritative - it only ever applies to one of them. Both
 * hooks call `usePokemonList`, which costs nothing: React Query keys the query,
 * so two observers share one cache entry and one request.
 */
export function usePokedexPagination({
  isSearching,
  isFiltering,
}: PokedexPageState): PokedexPagination {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const list = usePokemonList();
  const typeIndex = usePokemonTypeIndex();

  // Paging applies to the Pokédex only; search and filter resolve client-side
  // from lists that are already whole.
  const isPaginated = !isSearching && !isFiltering;
  const isLoadingMore = isPaginated && list.isFetchingNextPage;

  const loadMore = useCallback(() => {
    if (isPaginated && list.hasNextPage && !list.isFetchingNextPage) {
      list.fetchNextPage();
    }
  }, [isPaginated, list]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Collapse to page one first. `refetch()` on an infinite query refetches
      // every page currently loaded, so pulling after a deep scroll would fire
      // one request per page. The gesture means "give me the top of the list
      // again", which is exactly one request.
      queryClient.setQueryData<InfiniteData<PokemonPage, number>>(queryKeys.list, (cached) =>
        cached
          ? { pages: cached.pages.slice(0, 1), pageParams: cached.pageParams.slice(0, 1) }
          : cached,
      );
      // staleTime: Infinity means the index never refetches on its own, so this
      // is how a failed or partially failed one recovers. Cached types don't
      // refetch.
      await Promise.all([list.refetch(), typeIndex.refetch()]);
    } finally {
      // In a `finally` so the spinner cannot outlive the request, whatever the
      // queries' `throwOnError` is later configured to do.
      setRefreshing(false);
    }
  }, [queryClient, list, typeIndex]);

  return { isPaginated, isLoadingMore, loadMore, refreshing, refresh };
}
