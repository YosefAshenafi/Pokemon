import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { queryClient } from '@/api/queryClient';

import { installFakePokeApi, type FakePokeApi } from './fakePokeApi';

/** Boots the real Expo Router stack over the real `src/app` route files. */
export function renderApp(initialUrl = '/') {
  return renderRouter('src/app', { initialUrl });
}

/** Installs the fake API and isolates cache state between tests. */
export function setupFakeApi(): () => FakePokeApi {
  let api: FakePokeApi;

  beforeEach(async () => {
    api = installFakePokeApi();
    queryClient.clear();
    await AsyncStorage.clear();

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

/** Drives the grid to its end so the next page loads. */
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

/** Opens the type filter bottom sheet. */
export function openTypeFilter() {
  fireEvent.press(screen.getByLabelText('Filter Pokémon by type'));
}
