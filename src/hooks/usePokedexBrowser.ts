import { usePokedexFilters, type PokedexFilters } from './usePokedexFilters';
import { usePokedexPagination, type PokedexPagination } from './usePokedexPagination';
import { usePokedexPrefetch, type PokedexPrefetch } from './usePokedexPrefetch';
import { usePokedexResults, type PokedexResults } from './usePokedexResults';

export type PokedexBrowser = PokedexFilters & PokedexResults & PokedexPagination & PokedexPrefetch;

/** Everything the list screen needs: filters, results, pagination, prefetch. */
export function usePokedexBrowser(): PokedexBrowser {
  const filters = usePokedexFilters();
  const results = usePokedexResults(filters);
  const pagination = usePokedexPagination(filters);
  const prefetch = usePokedexPrefetch();

  return { ...filters, ...results, ...pagination, ...prefetch };
}
