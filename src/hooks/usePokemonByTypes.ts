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
 * Intersects the per-type query results: keeps only the Pokémon present in
 * EVERY selected type's list (National Dex order preserved from the first).
 * Defined at module scope so its reference is stable — React Query then only
 * re-runs it when the underlying query results change and structurally shares
 * the output, keeping `data` referentially stable across renders so the list
 * does not re-render needlessly.
 */
function combineTypeResults(results: UseQueryResult<TypeMember[], Error>[]): TypeFilterResult {
  let data: PokemonSummary[] = [];
  const lists = results.map((r) => r.data).filter((l): l is TypeMember[] => l !== undefined);
  // Only intersect once every selected type has loaded, so partial results
  // never leak through as matches.
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
 * Pokémon that belong to ALL of the given types (their intersection), backing
 * the multi-select type filter. Each type is fetched and cached independently,
 * then intersected — so two types return the dual-type Pokémon that have both.
 * An empty selection yields an empty, non-loading result.
 *
 * These are the same cache entries the type index builds from, so a type is
 * only ever downloaded once per session no matter which feature asks first.
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
