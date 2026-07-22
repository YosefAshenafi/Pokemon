import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getAllPokemonNames } from '@/api/pokeapi';
import type { PokemonSummary } from '@/api/types';

const MAX_RESULTS = 60;

/**
 * Client-side search over the full Pokémon name index (PokeAPI has no
 * substring search). The index is fetched once and cached for the session;
 * prefix matches rank before substring matches.
 */
export function usePokemonSearch(query: string) {
  const trimmed = query.trim().toLowerCase();

  const namesQuery = useQuery({
    queryKey: ['pokemon', 'names'],
    queryFn: getAllPokemonNames,
    staleTime: Infinity,
    enabled: trimmed.length > 0,
  });

  const results = useMemo<PokemonSummary[]>(() => {
    const names = namesQuery.data;
    if (!trimmed || !names) return [];
    const prefix: PokemonSummary[] = [];
    const substring: PokemonSummary[] = [];
    for (const entry of names) {
      if (entry.name.startsWith(trimmed)) prefix.push(entry);
      else if (entry.name.includes(trimmed)) substring.push(entry);
    }
    return [...prefix, ...substring].slice(0, MAX_RESULTS);
  }, [namesQuery.data, trimmed]);

  return {
    results,
    isLoading: namesQuery.isLoading,
    isError: namesQuery.isError,
    refetch: namesQuery.refetch,
  };
}
