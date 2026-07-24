import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { queryClient } from '@/api/queryClient';

import { installFakePokeApi, type FakePokeApi } from './fakePokeApi';

/**
 * Boots the real Expo Router stack over the real `src/app` route files — the
 * same `_layout.tsx`, screens, providers and QueryClient the device runs. Only
 * the network is faked, via `installFakePokeApi`.
 */
export function renderApp(initialUrl = '/') {
  return renderRouter('src/app', { initialUrl });
}

/**
 * Installs the fake API and isolates cache state between tests. Returns a getter
 * because the handle is recreated for each test.
 */
export function setupFakeApi(): () => FakePokeApi {
  let api: FakePokeApi;

  beforeEach(async () => {
    api = installFakePokeApi();
    queryClient.clear();
    await AsyncStorage.clear();

    // Configure the real client rather than replacing it: React Query's default
    // exponential backoff would add seconds of dead wait to every failure test,
    // and retry counts are the library's behaviour, not this app's. Every other
    // default — staleTime, gcTime, the AsyncStorage persister — is preserved.
    const defaults = queryClient.getDefaultOptions();
    queryClient.setDefaultOptions({
      ...defaults,
      queries: { ...defaults.queries, retry: false },
    });
  });

  afterEach(() => {
    api.restore();
    queryClient.clear();
  });

  return () => api;
}

const GRID = 'pokemon-grid';

/**
 * Drives the grid to its end so the next page loads.
 *
 * The scroll event is dispatched first so the real ScrollView path runs, then
 * `endReached` is fired directly: VirtualizedList decides that threshold from
 * measured layout, and the test renderer measures every element as zero-sized,
 * so a scroll offset alone never crosses it. This fires the screen's own
 * `onEndReached` handler — guards and all — the way `press` fires `onPress`.
 */
export function scrollToEnd(testID = GRID) {
  const grid = screen.getByTestId(testID);

  fireEvent.scroll(grid, {
    nativeEvent: {
      contentOffset: { x: 0, y: 3600 },
      contentSize: { height: 4400, width: 400 },
      layoutMeasurement: { height: 800, width: 400 },
    },
  });
  fireEvent(grid, 'endReached', { distanceFromEnd: 0 });
}

/** Triggers the grid's pull-to-refresh gesture. */
export async function pullToRefresh(testID = GRID) {
  const grid = screen.getByTestId(testID);
  const onRefresh = grid.props.refreshControl?.props?.onRefresh ?? grid.props.onRefresh;
  await act(async () => {
    await onRefresh?.();
  });
}

/** Types into the screen's search field. */
export function search(text: string) {
  fireEvent.changeText(screen.getByLabelText('Search Pokémon by name or number'), text);
}

/** Opens the type filter bottom sheet from the search bar's trailing icon. */
export function openTypeFilter() {
  fireEvent.press(screen.getByLabelText('Filter Pokémon by type'));
}
