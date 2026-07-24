import { fireEvent, screen, waitFor } from 'expo-router/testing-library';

import { openTypeFilter, renderApp, search, setupFakeApi } from '@/test/renderApp';

setupFakeApi();

const SETTLE = { timeout: 15000 };
const TIMEOUT = 30000;

describe('List screen — search', () => {
  it('finds a Pokémon by name and hides the rest', async () => {
    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    search('pika');

    await waitFor(() => expect(screen.getByText('Pikachu')).toBeTruthy(), SETTLE);
    expect(screen.queryByText('Bulbasaur')).toBeNull();
  }, TIMEOUT);

  it('finds a Pokémon by Pokédex number', async () => {
    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    search('25');

    await waitFor(() => expect(screen.getByText('Pikachu')).toBeTruthy(), SETTLE);
    expect(screen.getByText('#025')).toBeTruthy();
  }, TIMEOUT);

  it('returns every Pokémon whose name matches, not just the first', async () => {
    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    search('char');

    await waitFor(() => expect(screen.getByText('Charmander')).toBeTruthy(), SETTLE);
    expect(screen.getByText('Charmeleon')).toBeTruthy();
    expect(screen.getByText('Charizard')).toBeTruthy();
  }, TIMEOUT);

  it('matches names by substring, not only by prefix', async () => {
    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    // No Pokémon starts with "saur", so every hit here is a substring match.
    search('saur');

    await waitFor(() => expect(screen.getByText('Bulbasaur')).toBeTruthy(), SETTLE);
    expect(screen.getByText('Ivysaur')).toBeTruthy();
    expect(screen.queryByText('Charmander')).toBeNull();
  }, TIMEOUT);

  it('names what was searched for when nothing matches', async () => {
    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    search('zzzznotapokemon');

    await waitFor(() => expect(screen.getByText('No Pokémon found')).toBeTruthy(), SETTLE);
    expect(screen.getByText(/zzzznotapokemon/)).toBeTruthy();
  }, TIMEOUT);

  it('returns to the full Pokédex when the search is cleared', async () => {
    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    search('pika');
    await waitFor(() => expect(screen.getByText('Pikachu')).toBeTruthy(), SETTLE);

    search('');

    await waitFor(() => expect(screen.getByText('Bulbasaur')).toBeTruthy(), SETTLE);
  }, TIMEOUT);
});

describe('List screen — type filter', () => {
  it('narrows the grid to a single selected type', async () => {
    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    openTypeFilter();
    fireEvent.press(await screen.findByLabelText('Fire type', {}, SETTLE));

    await waitFor(() => expect(screen.getByText('Charmander')).toBeTruthy(), SETTLE);
    expect(screen.queryByText('Bulbasaur')).toBeNull();
  }, TIMEOUT);

  it('keeps only the Pokémon that have every selected type', async () => {
    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    openTypeFilter();
    fireEvent.press(await screen.findByLabelText('Grass type', {}, SETTLE));
    fireEvent.press(screen.getByLabelText('Poison type'));

    // Bulbasaur is Grass AND Poison; Ekans is Poison only; Charmander is neither.
    await waitFor(() => expect(screen.getByText('Bulbasaur')).toBeTruthy(), SETTLE);
    expect(screen.queryByText('Ekans')).toBeNull();
    expect(screen.queryByText('Charmander')).toBeNull();
  }, TIMEOUT);

  it('removes a type when its chip under the search bar is tapped', async () => {
    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    openTypeFilter();
    fireEvent.press(await screen.findByLabelText('Fire type', {}, SETTLE));
    await waitFor(() => expect(screen.getByText('Charmander')).toBeTruthy(), SETTLE);

    fireEvent.press(screen.getByLabelText('Remove Fire filter'));

    await waitFor(() => expect(screen.getByText('Bulbasaur')).toBeTruthy(), SETTLE);
  }, TIMEOUT);

  it('clears every selected type from the sheet', async () => {
    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    openTypeFilter();
    fireEvent.press(await screen.findByLabelText('Fire type', {}, SETTLE));
    fireEvent.press(screen.getByLabelText('Clear type filter'));

    await waitFor(() => expect(screen.getByText('Bulbasaur')).toBeTruthy(), SETTLE);
  }, TIMEOUT);

  it('composes search with the type filter', async () => {
    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    openTypeFilter();
    fireEvent.press(await screen.findByLabelText('Grass type', {}, SETTLE));
    fireEvent.press(screen.getByLabelText('Close filters'));

    search('bulba');

    await waitFor(() => expect(screen.getByText('Bulbasaur')).toBeTruthy(), SETTLE);
    expect(screen.queryByText('Ivysaur')).toBeNull();
  }, TIMEOUT);

  it('explains an empty result that comes from search and filter together', async () => {
    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    openTypeFilter();
    fireEvent.press(await screen.findByLabelText('Fire type', {}, SETTLE));
    fireEvent.press(screen.getByLabelText('Close filters'));

    search('bulba');

    await waitFor(() => expect(screen.getByText('No Pokémon found')).toBeTruthy(), SETTLE);
    expect(screen.getByText(/No Fire Pokémon match/)).toBeTruthy();
  }, TIMEOUT);
});
