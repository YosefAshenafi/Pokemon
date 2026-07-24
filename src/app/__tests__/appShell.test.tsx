import AsyncStorage from '@react-native-async-storage/async-storage';
import { screen, waitFor } from 'expo-router/testing-library';

import { CACHE_MIGRATION_KEY } from '@/api/queryClient';
import { resetSystemColorScheme, setSystemColorScheme } from '@/test/appearance';
import { renderApp, setupFakeApi } from '@/test/renderApp';

setupFakeApi();

const SETTLE = { timeout: 15000 };
const TIMEOUT = 30000;

afterEach(() => {
  resetSystemColorScheme();
});

const splash = () =>
  screen.queryByTestId('animated-splash', { includeHiddenElements: true });

describe('App shell', () => {
  it('shows the animated splash and then reveals the app', async () => {
    renderApp();

    // The tree stays behind a blank gate until the cache migration resolves.
    await waitFor(() => expect(splash()).toBeTruthy(), SETTLE);

    // The splash holds for 1400 ms and fades for 350 ms before handing over.
    await waitFor(() => expect(splash()).toBeNull(), { timeout: 8000 });
    expect(screen.getByText(/Who are you/)).toBeTruthy();
  }, TIMEOUT);

  it('purges a legacy cache blob on first launch and records that it did', async () => {
    await AsyncStorage.setItem('pokedex-query-cache', '{"legacy":true}');

    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    expect(await AsyncStorage.getItem('pokedex-query-cache')).toBeNull();
    expect(await AsyncStorage.getItem(CACHE_MIGRATION_KEY)).toBe('1');
  }, TIMEOUT);

  it('does not purge again once the migration has already run', async () => {
    await AsyncStorage.setItem(CACHE_MIGRATION_KEY, '1');
    await AsyncStorage.setItem('pokedex-query-cache', '{"legacy":true}');

    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    // Untouched, because the migration is gated on its own marker.
    expect(await AsyncStorage.getItem('pokedex-query-cache')).toBe('{"legacy":true}');
  }, TIMEOUT);

  it('renders the whole app in dark mode when the system asks for it', async () => {
    setSystemColorScheme('dark');

    renderApp();

    expect(await screen.findByText('Bulbasaur', {}, SETTLE)).toBeTruthy();
    // The dark background token reaches the splash overlay and the screens alike.
    expect(splash()?.props.style).toEqual(
      expect.objectContaining({ backgroundColor: '#0E1118' }),
    );
  }, TIMEOUT);

  it('keeps the Pokédex usable in dark mode', async () => {
    setSystemColorScheme('dark');

    renderApp('/pokemon/bulbasaur');

    expect(await screen.findByText('Base Stats', {}, SETTLE)).toBeTruthy();
    expect(screen.getByText('Grass')).toBeTruthy();
  }, TIMEOUT);
});
