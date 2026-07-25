import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { queryClient } from '@/api/queryClient';
import { installFakePokeApi, type FakePokeApi } from '@/test/fakePokeApi';

import { usePokedexBrowser } from '../usePokedexBrowser';

let api: FakePokeApi;

beforeEach(async () => {
  api = installFakePokeApi();
  queryClient.clear();
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

describe('usePokedexBrowser', () => {
  /**
   * Refresh collapses the infinite query to its first page before refetching.
   * With nothing cached there is no page list to slice, and the refresh has to
   * be a no-op rather than write an empty result over the query.
   */
  it('survives a refresh requested before any page has been cached', async () => {
    api.offline = true;
    const { result } = renderHook(() => usePokedexBrowser(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    api.offline = false;
    await act(async () => {
      await result.current.refresh();
    });

    // The spinner is released in a `finally`, and the retry recovered the list.
    expect(result.current.refreshing).toBe(false);
    await waitFor(() => expect(result.current.data.length).toBeGreaterThan(0));
  });
});
