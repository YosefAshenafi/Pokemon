import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { PokemonPage } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';

import type { PokedexFilters } from './usePokedexFilters';
import { usePokemonList } from './usePokemonList';
import { usePokemonTypeIndex } from './usePokemonTypeIndex';

export type PokedexPageState = Pick<PokedexFilters, 'isSearching' | 'isFiltering'>;

export interface PokedexPagination {
  isPaginated: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

/** Paging through the Pokédex, and pull-to-refresh back to the top. */
export function usePokedexPagination({
  isSearching,
  isFiltering,
}: PokedexPageState): PokedexPagination {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const list = usePokemonList();
  const typeIndex = usePokemonTypeIndex();

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
      queryClient.setQueryData<InfiniteData<PokemonPage, number>>(queryKeys.list, (cached) =>
        cached
          ? { pages: cached.pages.slice(0, 1), pageParams: cached.pageParams.slice(0, 1) }
          : cached,
      );
      await Promise.all([list.refetch(), typeIndex.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, list, typeIndex]);

  return { isPaginated, isLoadingMore, loadMore, refreshing, refresh };
}
