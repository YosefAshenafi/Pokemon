import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { getPokemon } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';
import type { PokemonSummary } from '@/api/types';
import { STATIC_STALE_TIME } from '@/constants/cache';

import { usePokemonByTypes } from './usePokemonByTypes';
import { usePokemonList } from './usePokemonList';
import { usePokemonSearch } from './usePokemonSearch';
import { usePokemonTypeIndex } from './usePokemonTypeIndex';

/**
 * Everything the list screen needs to decide *what* to show, with none of the
 * markup that decides how.
 *
 * Four independent queries back one grid - the paginated Pokédex, the name
 * index behind search, a roster per selected type, and the `name -> types` map
 * the cards read their chips from - and which of them is authoritative depends
 * on whether a search, a type filter, both or neither is active. Resolving that
 * here keeps the screen a composition of components rather than a state machine
 * with JSX wrapped around it, and lets the rules be read in one place.
 */
export function usePokedexBrowser() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const isSearching = query.trim().length > 0;
  const isFiltering = activeTypes.length > 0;

  const list = usePokemonList();
  const search = usePokemonSearch(query);
  const typeList = usePokemonByTypes(activeTypes);
  const typeIndex = usePokemonTypeIndex();

  // The visible list composes search and type: with both active, keep the name
  // matches that also belong to one of the selected types; otherwise fall back
  // to whichever single filter is on, then the paginated Pokédex.
  const data = useMemo<PokemonSummary[]>(() => {
    if (isSearching && isFiltering) {
      const inTypes = new Set(typeList.data.map((p) => p.name));
      return search.results.filter((p) => inTypes.has(p.name));
    }
    if (isSearching) return search.results;
    if (isFiltering) return typeList.data;
    return list.data ?? [];
  }, [isSearching, isFiltering, search.results, typeList.data, list.data]);

  const isError =
    (isSearching && search.isError) ||
    (isFiltering && typeList.isError) ||
    (!isSearching && !isFiltering && list.isError);

  const isLoading =
    (isSearching && search.isLoading) ||
    (isFiltering && typeList.isLoading) ||
    (!isSearching && !isFiltering && list.isLoading);

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
    // staleTime: Infinity means the index never refetches on its own, so this is
    // how a failed or partially failed one recovers. Cached types don't refetch.
    await Promise.all([list.refetch(), typeIndex.refetch()]);
    setRefreshing(false);
  }, [list, typeIndex]);

  const retry = useCallback(() => {
    if (isSearching) search.refetch();
    if (isFiltering) typeList.refetch();
    if (!isSearching && !isFiltering) list.refetch();
    if (typeIndex.isError) typeIndex.refetch();
  }, [isSearching, isFiltering, search, typeList, list, typeIndex]);

  const toggleType = useCallback((type: string) => {
    setActiveTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }, []);

  const clearTypes = useCallback(() => setActiveTypes([]), []);

  // Press-in gives the detail request a head start on the navigation animation,
  // without the N+1 that prefetching every visible card would bring back.
  const prefetchDetail = useCallback(
    (name: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.detail(name),
        queryFn: () => getPokemon(name),
        staleTime: STATIC_STALE_TIME,
      });
    },
    [queryClient],
  );

  return {
    query,
    setQuery,
    activeTypes,
    toggleType,
    clearTypes,
    isSearching,
    isFiltering,
    /** The rows to render, already composed from whichever queries apply. */
    data,
    isLoading,
    isError,
    retry,
    /** `name -> types`, or `undefined` for a name the index hasn't reached yet. */
    typesByName: typeIndex.data,
    typesPending: typeIndex.isFetching,
    isPaginated,
    isLoadingMore,
    loadMore,
    refreshing,
    refresh,
    prefetchDetail,
  };
}
