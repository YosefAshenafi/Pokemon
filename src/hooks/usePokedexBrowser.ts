import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';

import { getAllPokemonNames, getPokemon, type PokemonPage } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';
import type { PokemonSummary, PokemonType } from '@/api/types';
import { SEARCH_RESULT_LIMIT } from '@/constants/api';
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
  const [activeTypes, setActiveTypes] = useState<PokemonType[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // The field renders `query` so a keystroke is never delayed; the grid follows
  // `searchTerm` at low priority. There is no request per keystroke to suppress
  // - the name index is fetched once and filtered locally - so what needs
  // deprioritising is rendering, and a debounce would only add latency to it.
  const searchTerm = useDeferredValue(query);

  const isSearching = searchTerm.trim().length > 0;
  const isFiltering = activeTypes.length > 0;

  const list = usePokemonList();
  const search = usePokemonSearch(searchTerm);
  const typeList = usePokemonByTypes(activeTypes);
  const typeIndex = usePokemonTypeIndex();

  // The visible list composes search and type: with both active, keep the name
  // matches that also belong to one of the selected types; otherwise fall back
  // to whichever single filter is on, then the paginated Pokédex.
  //
  // SEARCH_RESULT_LIMIT is applied here, after composing, because it caps what
  // gets *rendered*. Capping the matches first would run the type intersection
  // against a truncated set and report "nothing found" for a term whose matches
  // sit further down the ranking.
  const data = useMemo<PokemonSummary[]>(() => {
    if (isSearching && isFiltering) {
      const inTypes = new Set(typeList.data.map((p) => p.name));
      return search.results.filter((p) => inTypes.has(p.name)).slice(0, SEARCH_RESULT_LIMIT);
    }
    if (isSearching) return search.results.slice(0, SEARCH_RESULT_LIMIT);
    if (isFiltering) return typeList.data;
    return list.data ?? [];
  }, [isSearching, isFiltering, search.results, typeList.data, list.data]);

  // Whether the cap hid matches, so the grid can say so rather than let its last
  // row imply there is nothing further.
  const isTruncated = isSearching && data.length === SEARCH_RESULT_LIMIT;

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

  const toggleType = useCallback((type: PokemonType) => {
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

  // The name index is ~1300 entries fetched in one request. Starting it when the
  // field takes focus moves that download into the moment the user is reaching
  // for the keyboard, instead of onto the first keystroke.
  const prefetchSearchIndex = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.names,
      queryFn: getAllPokemonNames,
      staleTime: STATIC_STALE_TIME,
    });
  }, [queryClient]);

  return {
    /** The live field value. Render this, so typing is never delayed. */
    query,
    setQuery,
    /** The deferred value the results below were actually computed from. */
    searchTerm,
    prefetchSearchIndex,
    activeTypes,
    toggleType,
    clearTypes,
    isSearching,
    isFiltering,
    /** The rows to render, already composed from whichever queries apply. */
    data,
    /** Whether more matched than `SEARCH_RESULT_LIMIT` leaves room to show. */
    isTruncated,
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
