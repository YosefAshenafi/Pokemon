import { useQueries, type UseQueryResult } from '@tanstack/react-query';

import { getPokemonByType } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';
import type { PokemonSummary, PokemonType, TypeMember } from '@/api/types';
import { STATIC_STALE_TIME } from '@/constants/cache';

export interface TypeFilterResult {
  data: PokemonSummary[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

function combineTypeResults(results: UseQueryResult<TypeMember[], Error>[]): TypeFilterResult {
  let data: PokemonSummary[] = [];
  const lists = results.map((r) => r.data).filter((l): l is TypeMember[] => l !== undefined);
  if (results.length > 0 && lists.length === results.length) {
    const [first, ...rest] = lists;
    const otherIdSets = rest.map((list) => new Set(list.map((p) => p.id)));
    data = first.filter((p) => otherIdSets.every((ids) => ids.has(p.id)));
  }
  return {
    data,
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
    refetch: () => results.forEach((r) => r.refetch()),
  };
}

/** Pokémon belonging to ALL of the given types, backing the type filter. */
export function usePokemonByTypes(types: PokemonType[]): TypeFilterResult {
  return useQueries({
    queries: types.map((type) => ({
      queryKey: queryKeys.type(type),
      queryFn: () => getPokemonByType(type),
      staleTime: STATIC_STALE_TIME,
    })),
    combine: combineTypeResults,
  });
}
