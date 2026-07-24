import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { queryClient } from '@/api/queryClient';
import { installFakePokeApi, type FakePokeApi } from '@/test/fakePokeApi';

import { usePokemonByTypes } from '../usePokemonByTypes';

let api: FakePokeApi;

beforeEach(async () => {
  api = installFakePokeApi();
  queryClient.clear();
  // Type rosters are on the persistence allowlist, so clearing only the
  // in-memory cache would let the persister restore a previous test's data.
  await AsyncStorage.clear();
  const defaults = queryClient.getDefaultOptions();
  queryClient.setDefaultOptions({ ...defaults, queries: { ...defaults.queries, retry: false } });
});

afterEach(() => {
  api.restore();
  queryClient.clear();
});

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('usePokemonByTypes', () => {
  it('returns an empty, settled result when no type is selected', () => {
    const { result } = renderHook(() => usePokemonByTypes([]), { wrapper });

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(api.requests).toHaveLength(0);
  });

  it('returns a single type roster in National Dex order', async () => {
    const { result } = renderHook(() => usePokemonByTypes(['electric']), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.map((p) => p.name)).toEqual(['pikachu', 'raichu']);
  });

  it('keeps only the Pokémon that belong to every selected type', async () => {
    const { result } = renderHook(() => usePokemonByTypes(['grass', 'poison']), { wrapper });

    await waitFor(() => expect(result.current.data.length).toBeGreaterThan(0));

    // Grass ∩ Poison — Ekans is Poison alone, Charmander is neither.
    expect(result.current.data.map((p) => p.name)).toEqual([
      'bulbasaur',
      'ivysaur',
      'venusaur',
      'venusaur-mega',
    ]);
  });

  it('yields nothing when the selected types have no Pokémon in common', async () => {
    const { result } = renderHook(() => usePokemonByTypes(['grass', 'electric']), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual([]);
  });

  it('reports an error when one of the types fails to load', async () => {
    api.failingTypes.add('poison');

    const { result } = renderHook(() => usePokemonByTypes(['grass', 'poison']), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    // No partial results leak through while one roster is missing.
    expect(result.current.data).toEqual([]);
  });

  it('refetches every selected type on request', async () => {
    const { result } = renderHook(() => usePokemonByTypes(['grass', 'poison']), { wrapper });
    await waitFor(() => expect(result.current.data.length).toBeGreaterThan(0));

    const before = api.requests.length;
    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(api.requests.length).toBeGreaterThan(before));
    expect(api.requests.filter((url) => url.endsWith('/type/grass')).length).toBe(2);
    expect(api.requests.filter((url) => url.endsWith('/type/poison')).length).toBe(2);
  });
});
