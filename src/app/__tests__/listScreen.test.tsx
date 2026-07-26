import { fireEvent, screen, waitFor } from 'expo-router/testing-library';

import { POKEMON_TYPES } from '@/api/types';
import {
  openTypeFilter,
  pullToRefresh,
  renderApp,
  scrollToEnd,
  search,
  setupFakeApi,
} from '@/test/renderApp';

const getApi = setupFakeApi();

const SETTLE = { timeout: 15000 };
const TIMEOUT = 30000;

describe('List screen', () => {
  it('renders the first page of the Pokédex as cards with name and number', async () => {
    renderApp();

    expect(await screen.findByText(/Who are you/, {}, SETTLE)).toBeTruthy();
    expect(await screen.findByText('Bulbasaur', {}, SETTLE)).toBeTruthy();
    expect(screen.getByText('#001')).toBeTruthy();
    expect(screen.getByText('Charmander')).toBeTruthy();
    expect(screen.getByText('#004')).toBeTruthy();
  }, TIMEOUT);

  it('fills in type chips from the type index once it has been built', async () => {
    renderApp();

    await screen.findByText('Bulbasaur', {}, SETTLE);

    await waitFor(() => expect(screen.getAllByText('Fire').length).toBeGreaterThan(0), SETTLE);
    await waitFor(() => expect(screen.getAllByText('Grass').length).toBeGreaterThan(0), SETTLE);
    await waitFor(() => expect(screen.getAllByText('Poison').length).toBeGreaterThan(0), SETTLE);
  }, TIMEOUT);

  it('reads each type only once, sharing requests between the index and the filter', async () => {
    renderApp();

    await screen.findByText('Bulbasaur', {}, SETTLE);
    await waitFor(() => expect(screen.getAllByText('Grass').length).toBeGreaterThan(0), SETTLE);

    const grassRequests = getApi().requests.filter((url) => url.endsWith('/type/grass'));
    expect(grassRequests).toHaveLength(1);
  }, TIMEOUT);

  it('loads the next page when the grid reaches its end', async () => {
    renderApp();

    await screen.findByText('Bulbasaur', {}, SETTLE);
    expect(getApi().requests.some((url) => url.includes('offset=24&limit=24'))).toBe(false);

    scrollToEnd();

    await waitFor(
      () => expect(getApi().requests.some((url) => url.includes('offset=24&limit=24'))).toBe(true),
      SETTLE,
    );
  }, TIMEOUT);

  it('stops paginating once the Pokédex has no further pages', async () => {
    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    scrollToEnd();
    await waitFor(
      () => expect(getApi().requests.some((url) => url.includes('offset=24&limit=24'))).toBe(true),
      SETTLE,
    );

    scrollToEnd();
    scrollToEnd();

    await waitFor(() => expect(screen.getByText('Bulbasaur')).toBeTruthy(), SETTLE);
    expect(getApi().requests.some((url) => url.includes('offset=48'))).toBe(false);
  }, TIMEOUT);

  it('does not paginate while a search or type filter is narrowing the grid', async () => {
    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    search('a');
    await waitFor(() => expect(screen.getByText('Charizard')).toBeTruthy(), SETTLE);

    scrollToEnd();

    await waitFor(() => expect(screen.getByText('Charizard')).toBeTruthy(), SETTLE);
    expect(getApi().requests.some((url) => url.includes('offset=24&limit=24'))).toBe(false);
  }, TIMEOUT);

  it('refetches only the first page on pull-to-refresh, however deep the list is', async () => {
    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    scrollToEnd();
    await waitFor(
      () => expect(getApi().requests.some((url) => url.includes('offset=24&limit=24'))).toBe(true),
      SETTLE,
    );

    await pullToRefresh();

    await waitFor(
      () =>
        expect(
          getApi().requests.filter((url) => url.includes('offset=0&limit=24')).length,
        ).toBeGreaterThan(1),
      SETTLE,
    );
    expect(getApi().requests.filter((url) => url.includes('offset=24&limit=24'))).toHaveLength(1);
  }, TIMEOUT);

  it('starts loading the search index when the field takes focus', async () => {
    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    const NAME_INDEX = 'limit=100000';
    expect(getApi().requests.some((url) => url.includes(NAME_INDEX))).toBe(false);

    fireEvent(screen.getByLabelText('Search Pokémon by name or number'), 'focus');

    await waitFor(
      () => expect(getApi().requests.some((url) => url.includes(NAME_INDEX))).toBe(true),
      SETTLE,
    );
  }, TIMEOUT);

  it('refetches the Pokédex on pull-to-refresh', async () => {
    renderApp();

    await screen.findByText('Bulbasaur', {}, SETTLE);
    const before = getApi().requests.filter((url) => url.includes('offset=0&limit=24')).length;

    await pullToRefresh();

    await waitFor(
      () =>
        expect(
          getApi().requests.filter((url) => url.includes('offset=0&limit=24')).length,
        ).toBeGreaterThan(before),
      SETTLE,
    );
    expect(screen.getByText('Bulbasaur')).toBeTruthy();
  }, TIMEOUT);
});

describe('List screen - work in progress', () => {
  it('shows placeholder chips on the cards while the type index is still loading', async () => {
    getApi().hold.add('/type/');
    renderApp();

    expect(await screen.findByText('Bulbasaur', {}, SETTLE)).toBeTruthy();
    expect(screen.getAllByTestId('type-chip-placeholder').length).toBeGreaterThan(0);

    getApi().hold.clear();
    getApi().release();

    await waitFor(() => expect(screen.getAllByText('Grass').length).toBeGreaterThan(0), SETTLE);
  }, TIMEOUT);

  it('shows a footer spinner while the next page is loading', async () => {
    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    getApi().hold.add('offset=24');
    scrollToEnd();

    expect(await screen.findByLabelText('Loading more Pokémon', {}, SETTLE)).toBeTruthy();

    getApi().hold.clear();
    getApi().release();

    await waitFor(() => expect(screen.queryByLabelText('Loading more Pokémon')).toBeNull(), SETTLE);
  }, TIMEOUT);
});

describe('List screen - failure handling', () => {
  it('explains a type filter that could not be loaded', async () => {
    getApi().failingTypes.add('fire');
    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    openTypeFilter();
    fireEvent.press(await screen.findByLabelText('Fire type', {}, SETTLE));
    fireEvent.press(screen.getByLabelText('Close filters'));

    expect(await screen.findByText(/These types could not be loaded/, {}, SETTLE)).toBeTruthy();

    getApi().failingTypes.clear();
    fireEvent.press(screen.getByText('Try again'));

    await waitFor(() => expect(screen.getByText('Charmander')).toBeTruthy(), SETTLE);
    expect(screen.queryByText('Bulbasaur')).toBeNull();
  }, TIMEOUT);

  it('rebuilds a failed type index when the error state is retried', async () => {
    POKEMON_TYPES.forEach((type) => getApi().failingTypes.add(type));
    getApi().offline = true;
    renderApp();

    expect(await screen.findByText('Something went wrong', {}, SETTLE)).toBeTruthy();

    getApi().offline = false;
    getApi().failingTypes.clear();
    fireEvent.press(screen.getByText('Try again'));

    await waitFor(() => expect(screen.getByText('Bulbasaur')).toBeTruthy(), SETTLE);
    await waitFor(() => expect(screen.getAllByText('Grass').length).toBeGreaterThan(0), SETTLE);
  }, TIMEOUT);

  it('shows an error with a working retry when the Pokédex cannot be loaded', async () => {
    getApi().offline = true;
    renderApp();

    expect(await screen.findByText('Something went wrong', {}, SETTLE)).toBeTruthy();
    expect(screen.getByText(/The Pokédex could not be loaded/)).toBeTruthy();

    getApi().offline = false;
    fireEvent.press(screen.getByText('Try again'));

    await waitFor(() => expect(screen.getByText('Bulbasaur')).toBeTruthy(), SETTLE);
  }, TIMEOUT);

  it('still lists Pokémon when the type index fails entirely', async () => {
    POKEMON_TYPES.forEach((type) => getApi().failingTypes.add(type));
    renderApp();

    expect(await screen.findByText('Bulbasaur', {}, SETTLE)).toBeTruthy();

    await waitFor(
      () => expect(screen.queryAllByTestId('type-chip-placeholder')).toHaveLength(0),
      SETTLE,
    );
    expect(screen.queryByText('Grass')).toBeNull();
    expect(screen.getByText('Charmander')).toBeTruthy();
  }, TIMEOUT);

  it('reports a failing search index and recovers on retry', async () => {
    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    getApi().offline = true;
    search('pika');

    expect(await screen.findByText(/Pokémon index could not be loaded/, {}, SETTLE)).toBeTruthy();

    getApi().offline = false;
    fireEvent.press(screen.getByText('Try again'));

    await waitFor(() => expect(screen.getByText('Pikachu')).toBeTruthy(), SETTLE);
  }, TIMEOUT);
});
