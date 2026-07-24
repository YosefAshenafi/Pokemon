import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getAllPokemonNames } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';
import type { PokemonSummary } from '@/api/types';
import { SEARCH_RESULT_LIMIT } from '@/constants/api';
import { STATIC_STALE_TIME } from '@/constants/cache';

/**
 * Filters the name index. A numeric query (optionally '#'-prefixed) matches
 * Pokédex ids; otherwise names match, prefixes ranked before substrings.
 */
export function searchPokemonIndex(
  names: PokemonSummary[],
  query: string,
): PokemonSummary[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const idQuery = trimmed.replace(/^#/, '');
  if (/^\d+$/.test(idQuery)) {
    const prefix = String(Number(idQuery)); // "025" -> "25", so "#025" finds #25
    return names
      .filter((entry) => String(entry.id).startsWith(prefix))
      .sort((a, b) => a.id - b.id)
      .slice(0, SEARCH_RESULT_LIMIT);
  }

  const prefixMatches: PokemonSummary[] = [];
  const substringMatches: PokemonSummary[] = [];
  for (const entry of names) {
    if (entry.name.startsWith(trimmed)) prefixMatches.push(entry);
    else if (entry.name.includes(trimmed)) substringMatches.push(entry);
  }
  return [...prefixMatches, ...substringMatches].slice(0, SEARCH_RESULT_LIMIT);
}

/**
 * Client-side search, since PokeAPI has no substring-search endpoint: the whole
 * name index is fetched once per session and filtered locally.
 */
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
