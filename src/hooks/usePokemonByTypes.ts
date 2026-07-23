import { useQueries, type UseQueryResult } from '@tanstack/react-query';

import { getPokemonByType } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';
import type { PokemonSummary, TypeMember } from '@/api/types';

export interface TypeFilterResult {
  data: PokemonSummary[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * Keeps only the Pokémon present in EVERY selected type's list, in the first
 * one's National Dex order. At module scope so its reference is stable, which
 * is what lets React Query structurally share `data` across renders.
 */
function combineTypeResults(results: UseQueryResult<TypeMember[], Error>[]): TypeFilterResult {
  let data: PokemonSummary[] = [];
  const lists = results.map((r) => r.data).filter((l): l is TypeMember[] => l !== undefined);
  // Wait for every type, so partial results never leak through as matches.
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

/**
 * Pokémon belonging to ALL of the given types, backing the multi-select filter.
 * An empty selection yields an empty, non-loading result. These are the same
 * cache entries the type index builds from, so a type is downloaded once.
 */
export function usePokemonByTypes(types: string[]): TypeFilterResult {
  return useQueries({
    queries: types.map((type) => ({
      queryKey: queryKeys.type(type),
      queryFn: () => getPokemonByType(type),
      staleTime: Infinity,
    })),
    combine: combineTypeResults,
  });
}
