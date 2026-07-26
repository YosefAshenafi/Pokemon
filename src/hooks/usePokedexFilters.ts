import { useCallback, useDeferredValue, useState } from 'react';

import type { PokemonType } from '@/api/types';
import { MAX_TYPE_FILTERS } from '@/constants/ui';

export interface PokedexFilters {
  /** The live field value. Render this, so typing is never delayed. */
  query: string;
  setQuery: (query: string) => void;
  /** The deferred value results are computed from. */
  searchTerm: string;
  activeTypes: PokemonType[];
  toggleType: (type: PokemonType) => void;
  clearTypes: () => void;
  isSearching: boolean;
  isFiltering: boolean;
}

/**
 * What the user has asked for - nothing about how it is answered.
 *
 * Separated from the queries so it can be reasoned about, and tested, without a
 * network or a QueryClient: given these keystrokes and these taps, this is the
 * request. Adding a sort order or a generation filter lands here alone.
 */
export function usePokedexFilters(): PokedexFilters {
  const [query, setQuery] = useState('');
  const [activeTypes, setActiveTypes] = useState<PokemonType[]>([]);

  // The field renders `query` so a keystroke is never delayed; the grid follows
  // `searchTerm` at low priority. There is no request per keystroke to suppress
  // - the name index is fetched once and filtered locally - so what needs
  // deprioritising is rendering, and a debounce would only add latency to it.
  const searchTerm = useDeferredValue(query);

  const toggleType = useCallback((type: PokemonType) => {
    setActiveTypes((prev) => {
      if (prev.includes(type)) return prev.filter((t) => t !== type);
      // The sheet disables the controls that would exceed this; the guard is
      // here too so the rule holds however the selection is reached.
      return prev.length >= MAX_TYPE_FILTERS ? prev : [...prev, type];
    });
  }, []);

  const clearTypes = useCallback(() => setActiveTypes([]), []);

  return {
    query,
    setQuery,
    searchTerm,
    activeTypes,
    toggleType,
    clearTypes,
    isSearching: searchTerm.trim().length > 0,
    isFiltering: activeTypes.length > 0,
  };
}
