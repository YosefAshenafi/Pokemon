import { usePokedexFilters, type PokedexFilters } from './usePokedexFilters';
import { usePokedexPagination, type PokedexPagination } from './usePokedexPagination';
import { usePokedexPrefetch, type PokedexPrefetch } from './usePokedexPrefetch';
import { usePokedexResults, type PokedexResults } from './usePokedexResults';

export type PokedexBrowser = PokedexFilters & PokedexResults & PokedexPagination & PokedexPrefetch;

/**
 * Everything the list screen needs, composed from four hooks that each answer
 * one question: what was asked for (`usePokedexFilters`), how it is answered
 * (`usePokedexResults`), how to move through the answer
 * (`usePokedexPagination`), and what is worth starting early
 * (`usePokedexPrefetch`).
 *
 * This file stays a composition on purpose. The screen gets one object, so it
 * remains markup; each part stays small enough to read and test on its own, and
 * a new filter, page control or prefetch has an obvious home that is not "here".
 */
export function usePokedexBrowser(): PokedexBrowser {
  const filters = usePokedexFilters();
  const results = usePokedexResults(filters);
  const pagination = usePokedexPagination(filters);
  const prefetch = usePokedexPrefetch();

  return { ...filters, ...results, ...pagination, ...prefetch };
}
