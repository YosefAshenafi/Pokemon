import { useCallback, useDeferredValue, useState } from 'react';

import type { PokemonType } from '@/api/types';
import { MAX_TYPE_FILTERS } from '@/constants/ui';

export interface PokedexFilters {
  query: string;
  setQuery: (query: string) => void;
  searchTerm: string;
  activeTypes: PokemonType[];
  toggleType: (type: PokemonType) => void;
  clearTypes: () => void;
  isSearching: boolean;
  isFiltering: boolean;
}

/** What the user has asked for: search text and selected types. */
export function usePokedexFilters(): PokedexFilters {
  const [query, setQuery] = useState('');
  const [activeTypes, setActiveTypes] = useState<PokemonType[]>([]);

  const searchTerm = useDeferredValue(query);

  const toggleType = useCallback((type: PokemonType) => {
    setActiveTypes((prev) => {
      if (prev.includes(type)) return prev.filter((t) => t !== type);
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
