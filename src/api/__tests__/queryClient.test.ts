import AsyncStorage from '@react-native-async-storage/async-storage';

import { purgeLegacyCacheKeys, queryClient } from '../queryClient';
import { queryKeys } from '../queryKeys';

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
    // Guards the pairing between the client's persister and the allowlist: a
    // Pokémon detail is ~200 KB and must never reach AsyncStorage.
    expect(queryKeys.detail('bulbasaur')).toEqual(['pokemon', 'detail', 'bulbasaur']);
    expect(queryKeys.move('tackle')).toEqual(['move', 'detail', 'tackle']);
  });
});
