import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import type { PokemonPage, PokemonTypeIndex } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';
import type { PokemonSummary } from '@/api/types';
import { SEARCH_RESULT_LIMIT } from '@/constants/api';

import type { PokedexFilters } from './usePokedexFilters';
import { usePokemonByTypes } from './usePokemonByTypes';
import { usePokemonList } from './usePokemonList';
import { usePokemonSearch } from './usePokemonSearch';
import { usePokemonTypeIndex } from './usePokemonTypeIndex';

/**
 * The part of the filter state that decides *what* to fetch. Narrowed from
 * `PokedexFilters` so this hook cannot reach the setters: it answers a request,
 * it does not change one.
 */
export type PokedexQuery = Pick<
  PokedexFilters,
  'searchTerm' | 'activeTypes' | 'isSearching' | 'isFiltering'
>;

export interface PokedexResults {
  /** The rows to render, already composed from whichever queries apply. */
  data: PokemonSummary[];
  /** Whether more matched than `SEARCH_RESULT_LIMIT` leaves room to show. */
  isTruncated: boolean;
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
  /** `name -> types`, or `undefined` for a name the index hasn't reached yet. */
  typesByName: PokemonTypeIndex | undefined;
  typesPending: boolean;
  isPaginated: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

/**
 * How a request for Pokémon is answered.
 *
 * Four independent queries back one grid - the paginated Pokédex, the name
 * index behind search, a roster per selected type, and the `name -> types` map
 * the cards read their chips from - and which is authoritative depends on
 * whether a search, a type filter, both or neither is active. Resolving that
 * here, against filters passed in rather than state owned here, keeps the rules
 * readable in one place and testable without a screen.
 */
export function usePokedexResults({
  searchTerm,
  activeTypes,
  isSearching,
  isFiltering,
}: PokedexQuery): PokedexResults {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const list = usePokemonList();
  const search = usePokemonSearch(searchTerm);
  const typeList = usePokemonByTypes(activeTypes);
  const typeIndex = usePokemonTypeIndex();

  // With both filters active, keep the name matches that also belong to every
  // selected type; otherwise fall back to whichever single filter is on, then
  // the paginated Pokédex.
  const matches = useMemo<PokemonSummary[]>(() => {
    if (isSearching && isFiltering) {
      const inTypes = new Set(typeList.data.map((p) => p.name));
      return search.results.filter((p) => inTypes.has(p.name));
    }
    if (isSearching) return search.results;
    if (isFiltering) return typeList.data;
    return list.data ?? [];
  }, [isSearching, isFiltering, search.results, typeList.data, list.data]);

  // The cap is on what gets *rendered*, so it is applied after composing, and
  // measured against the full match set. Capping the matches before the type
  // intersection would report "nothing found" for a term whose matches sit
  // further down the ranking; comparing after slicing would claim a search that
  // returned exactly the cap had hidden something.
  const isTruncated = isSearching && matches.length > SEARCH_RESULT_LIMIT;
  const data = useMemo(
    () => (isTruncated ? matches.slice(0, SEARCH_RESULT_LIMIT) : matches),
    [isTruncated, matches],
  );

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

  const retry = useCallback(() => {
    if (isSearching) search.refetch();
    if (isFiltering) typeList.refetch();
    if (!isSearching && !isFiltering) list.refetch();
    if (typeIndex.isError) typeIndex.refetch();
  }, [isSearching, isFiltering, search, typeList, list, typeIndex]);

  return {
    data,
    isTruncated,
    isLoading,
    isError,
    retry,
    typesByName: typeIndex.data,
    typesPending: typeIndex.isFetching,
    isPaginated,
    isLoadingMore,
    loadMore,
    refreshing,
    refresh,
  };
}
