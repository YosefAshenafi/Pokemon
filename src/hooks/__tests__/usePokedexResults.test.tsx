import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { queryClient } from '@/api/queryClient';
import { queryKeys } from '@/api/queryKeys';
import type { PokemonSummary } from '@/api/types';
import { SEARCH_RESULT_LIMIT } from '@/constants/api';
import { installFakePokeApi, type FakePokeApi } from '@/test/fakePokeApi';

import type { PokedexFilters } from '../usePokedexFilters';
import { usePokedexResults } from '../usePokedexResults';

let api: FakePokeApi;

beforeEach(async () => {
  api = installFakePokeApi();
  queryClient.clear();
  await AsyncStorage.clear();
  const defaults = queryClient.getDefaultOptions();
  queryClient.setDefaultOptions({ ...defaults, queries: { ...defaults.queries, retry: false } });

  queryClient.setQueryData(queryKeys.typeIndex, {});
  queryClient.setQueryData(queryKeys.list, {
    pages: [{ pokemon: [{ id: 1, name: 'bulbasaur' }], count: 1, nextOffset: null }],
    pageParams: [0],
  });
});

afterEach(async () => {
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  api.restore();
  queryClient.clear();
});

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function filters(overrides: Partial<PokedexFilters> = {}): PokedexFilters {
  return {
    query: '',
    setQuery: () => {},
    searchTerm: '',
    activeTypes: [],
    toggleType: () => {},
    clearTypes: () => {},
    isSearching: false,
    isFiltering: false,
    ...overrides,
  };
}

function seedLargeNameIndex(matching: number): PokemonSummary[] {
  const names: PokemonSummary[] = Array.from({ length: matching }, (_, i) => ({
    id: i + 1,
    name: `testmon-a-${i}`,
  }));
  queryClient.setQueryData(queryKeys.names, names);
  return names;
}

describe('usePokedexResults', () => {
  it('caps what it renders once a search matches more than the screen holds', async () => {
    seedLargeNameIndex(SEARCH_RESULT_LIMIT + 40);

    const { result } = renderHook(
      () => usePokedexResults(filters({ searchTerm: 'a', isSearching: true })),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data.length).toBe(SEARCH_RESULT_LIMIT));
    expect(result.current.isTruncated).toBe(true);
  });

  it('does not claim to have truncated when the matches exactly fill the cap', async () => {
    seedLargeNameIndex(SEARCH_RESULT_LIMIT);

    const { result } = renderHook(
      () => usePokedexResults(filters({ searchTerm: 'a', isSearching: true })),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data.length).toBe(SEARCH_RESULT_LIMIT));
    expect(result.current.isTruncated).toBe(false);
  });

  it('leaves the paginated Pokédex uncapped', async () => {
    const page = Array.from({ length: SEARCH_RESULT_LIMIT + 20 }, (_, i) => ({
      id: i + 1,
      name: `dexmon-${i}`,
    }));
    queryClient.setQueryData(queryKeys.list, {
      pages: [{ pokemon: page, count: page.length, nextOffset: null }],
      pageParams: [0],
    });

    const { result } = renderHook(() => usePokedexResults(filters()), { wrapper });

    await waitFor(() => expect(result.current.data.length).toBe(page.length));
    expect(result.current.isTruncated).toBe(false);
  });
});
