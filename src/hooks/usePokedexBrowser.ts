import { usePokedexFilters, type PokedexFilters } from './usePokedexFilters';
import { usePokedexPrefetch, type PokedexPrefetch } from './usePokedexPrefetch';
import { usePokedexResults, type PokedexResults } from './usePokedexResults';

export type PokedexBrowser = PokedexFilters & PokedexResults & PokedexPrefetch;

/**
 * Everything the list screen needs, composed from three hooks that each answer
 * one question: what was asked for (`usePokedexFilters`), how it is answered
 * (`usePokedexResults`), and what is worth starting early
 * (`usePokedexPrefetch`).
 *
 * This file stays a composition on purpose. The screen gets one object, so it
 * remains markup; each part stays small enough to read and test on its own, and
 * a new filter or a new prefetch has an obvious home that is not "here".
 */
export function usePokedexBrowser(): PokedexBrowser {
  const filters = usePokedexFilters();
  const results = usePokedexResults(filters);
  const prefetch = usePokedexPrefetch();

  return { ...filters, ...results, ...prefetch };
}
