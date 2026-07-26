import AsyncStorage from '@react-native-async-storage/async-storage';

import { ApiError } from '../pokeapi';
import { purgeLegacyCacheKeys, queryClient } from '../queryClient';
import { queryKeys } from '../queryKeys';
import { setErrorReporter } from '../reportError';

beforeEach(async () => {
  await AsyncStorage.clear();
  queryClient.clear();
});

describe('purgeLegacyCacheKeys', () => {
  it('removes the single-blob cache written by earlier builds', async () => {
    await AsyncStorage.setItem('pokedex-query-cache', '{"queries":[]}');

    await purgeLegacyCacheKeys();

    expect(await AsyncStorage.getItem('pokedex-query-cache')).toBeNull();
  });

  it('removes every per-query row from the previous persister', async () => {
    await AsyncStorage.setItem('tanstack-query-pokemon-list', '{}');
    await AsyncStorage.setItem('tanstack-query-pokemon-names', '{}');

    await purgeLegacyCacheKeys();

    expect(await AsyncStorage.getAllKeys()).toEqual([]);
  });

  it('leaves unrelated keys alone', async () => {
    await AsyncStorage.setItem('some-other-feature', 'keep me');

    await purgeLegacyCacheKeys();

    expect(await AsyncStorage.getItem('some-other-feature')).toBe('keep me');
  });

  it('does nothing when there is no legacy cache to remove', async () => {
    await expect(purgeLegacyCacheKeys()).resolves.toBeUndefined();
    expect(await AsyncStorage.getAllKeys()).toEqual([]);
  });
});

describe('queryClient defaults', () => {
  it('keeps data for a day so a relaunch can open from cache', () => {
    const { queries } = queryClient.getDefaultOptions();

    expect(queries?.gcTime).toBe(24 * 60 * 60 * 1000);
    expect(queries?.staleTime).toBe(5 * 60 * 1000);
  });

  it('routes every query through the persistence allowlist', () => {
    const { queries } = queryClient.getDefaultOptions();

    expect(queries?.persister).toBeDefined();
  });

  it('only persists the small, bounded queries', () => {
    expect(queryKeys.detail('bulbasaur')).toEqual(['pokemon', 'detail', 'bulbasaur']);
    expect(queryKeys.move('tackle')).toEqual(['move', 'detail', 'tackle']);
  });
});

describe('query failure reporting', () => {
  afterEach(() => {
    setErrorReporter(null);
  });

  async function failWith(error: unknown) {
    const reporter = jest.fn();
    setErrorReporter(reporter);
    await queryClient
      .fetchQuery({
        queryKey: ['reporting-probe'],
        queryFn: () => Promise.reject(error),
        retry: false,
      })
      .catch(() => {});
    return reporter;
  }

  it('reports a contract mismatch, which no status code would tell us about', async () => {
    const reporter = await failWith(
      new ApiError('The server sent data in an unexpected format.', { kind: 'contract' }),
    );

    expect(reporter).toHaveBeenCalledWith(
      expect.any(ApiError),
      expect.objectContaining({ queryKey: ['reporting-probe'] }),
    );
  });

  it('stays quiet about a dropped connection', async () => {
    const reporter = await failWith(
      new ApiError('Network request failed.', { kind: 'network' }),
    );

    expect(reporter).not.toHaveBeenCalled();
  });

  it('reports an error that did not come from the API client at all', async () => {
    const reporter = await failWith(new TypeError('undefined is not a function'));

    expect(reporter).toHaveBeenCalled();
  });
});
