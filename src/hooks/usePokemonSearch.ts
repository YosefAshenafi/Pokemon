import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getAllPokemonNames } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';
import type { PokemonSummary } from '@/api/types';
import { STATIC_STALE_TIME } from '@/constants/cache';

/** Filters the name index by name or Pokédex number, prefix matches ranked first. */
export function searchPokemonIndex(
  names: PokemonSummary[],
  query: string,
): PokemonSummary[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const idQuery = trimmed.replace(/^#/, '');
  if (/^\d+$/.test(idQuery)) {
    const prefix = String(Number(idQuery));
    return names.filter((entry) => String(entry.id).startsWith(prefix)).sort((a, b) => a.id - b.id);
  }

  const prefixMatches: PokemonSummary[] = [];
  const substringMatches: PokemonSummary[] = [];
  for (const entry of names) {
    if (entry.name.startsWith(trimmed)) prefixMatches.push(entry);
    else if (entry.name.includes(trimmed)) substringMatches.push(entry);
  }
  return [...prefixMatches, ...substringMatches];
}

/** Client-side search over the full name index. */
export function usePokemonSearch(query: string) {
  const namesQuery = useQuery({
    queryKey: queryKeys.names,
    queryFn: getAllPokemonNames,
    staleTime: STATIC_STALE_TIME,
    enabled: query.trim().length > 0,
  });

  const results = useMemo<PokemonSummary[]>(
    () => (namesQuery.data ? searchPokemonIndex(namesQuery.data, query) : []),
    [namesQuery.data, query],
  );

  return {
    results,
    isLoading: namesQuery.isLoading,
    isError: namesQuery.isError,
    refetch: namesQuery.refetch,
  };
}
