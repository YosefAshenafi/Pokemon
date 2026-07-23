import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { getAllPokemonNames } from "@/api/pokeapi";
import type { PokemonSummary } from "@/api/types";

const MAX_RESULTS = 60;

/**
 * Filters the full Pokémon index for a query. A numeric query (optionally
 * prefixed with '#', leading zeros ignored) matches Pokédex numbers by id,
 * ordered by id. Otherwise it matches names, with prefix matches ranked before
 * substring matches. Pure and synchronous, so it is unit-testable on its own.
 */
export function searchPokemonIndex(
  names: PokemonSummary[],
  query: string,
): PokemonSummary[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const idQuery = trimmed.replace(/^#/, "");
  if (/^\d+$/.test(idQuery)) {
    const prefix = String(Number(idQuery)); // "025" -> "25", so "#025" finds #25
    return names
      .filter((entry) => String(entry.id).startsWith(prefix))
      .sort((a, b) => a.id - b.id)
      .slice(0, MAX_RESULTS);
  }

  const prefixMatches: PokemonSummary[] = [];
  const substringMatches: PokemonSummary[] = [];
  for (const entry of names) {
    if (entry.name.startsWith(trimmed)) prefixMatches.push(entry);
    else if (entry.name.includes(trimmed)) substringMatches.push(entry);
  }
  return [...prefixMatches, ...substringMatches].slice(0, MAX_RESULTS);
}

/**
 * Client-side search over the full Pokémon name index (PokeAPI has no
 * substring-search endpoint). The index is fetched once and cached for the
 * session, then filtered locally by name or Pokédex number.
 */
export function usePokemonSearch(query: string) {
  const namesQuery = useQuery({
    queryKey: ["pokemon", "names"],
    queryFn: getAllPokemonNames,
    staleTime: Infinity,
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
