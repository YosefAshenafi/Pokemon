import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getAllPokemonNames } from '@/api/pokeapi';
import { queryKeys } from '@/api/queryKeys';
import type { PokemonSummary } from '@/api/types';
import { STATIC_STALE_TIME } from '@/constants/cache';

/**
 * Filters the name index. A numeric query (optionally '#'-prefixed) matches
 * Pokédex ids; otherwise names match, prefixes ranked before substrings.
 *
 * Returns every match, ranked. Capping is deliberately left to the caller: the
 * list screen intersects these results with the type filter, and truncating
 * here would hide matches that the intersection needed to see.
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
