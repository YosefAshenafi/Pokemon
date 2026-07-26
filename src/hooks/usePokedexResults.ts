import { useCallback, useMemo } from 'react';

import type { PokemonTypeIndex } from '@/api/pokeapi';
import type { PokemonSummary } from '@/api/types';
import { SEARCH_RESULT_LIMIT } from '@/constants/api';

import type { PokedexFilters } from './usePokedexFilters';
import { usePokemonByTypes } from './usePokemonByTypes';
import { usePokemonList } from './usePokemonList';
import { usePokemonSearch } from './usePokemonSearch';
import { usePokemonTypeIndex } from './usePokemonTypeIndex';

export type PokedexQuery = Pick<
  PokedexFilters,
  'searchTerm' | 'activeTypes' | 'isSearching' | 'isFiltering'
>;

export interface PokedexResults {
  data: PokemonSummary[];
  isTruncated: boolean;
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
  typesByName: PokemonTypeIndex | undefined;
  typesPending: boolean;
}

/** Composes the grid's rows from whichever queries the active filters need. */
export function usePokedexResults({
  searchTerm,
  activeTypes,
  isSearching,
  isFiltering,
}: PokedexQuery): PokedexResults {
  const list = usePokemonList();
  const search = usePokemonSearch(searchTerm);
  const typeList = usePokemonByTypes(activeTypes);
  const typeIndex = usePokemonTypeIndex();

  const matches = useMemo<PokemonSummary[]>(() => {
    if (isSearching && isFiltering) {
      const inTypes = new Set(typeList.data.map((p) => p.name));
      return search.results.filter((p) => inTypes.has(p.name));
    }
    if (isSearching) return search.results;
    if (isFiltering) return typeList.data;
    return list.data ?? [];
  }, [isSearching, isFiltering, search.results, typeList.data, list.data]);

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
  };
}
