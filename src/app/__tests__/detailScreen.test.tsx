import { fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { StyleSheet } from 'react-native';

import { holdDown } from '@/test/press';
import { renderApp, setupFakeApi } from '@/test/renderApp';

const getApi = setupFakeApi();

const SETTLE = { timeout: 15000 };
const TIMEOUT = 30000;

describe('Detail screen', () => {
  it('opens from a card on the list and shows that Pokémon', async () => {
    const router = renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    fireEvent.press(screen.getByLabelText('Bulbasaur, #001'));

    await waitFor(() => expect(router.getPathname()).toBe('/pokemon/bulbasaur'), SETTLE);
    expect(await screen.findByText('Base Stats', {}, SETTLE)).toBeTruthy();
  }, TIMEOUT);

  it('starts loading the detail on press-in, before navigation begins', async () => {
    renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    expect(getApi().requests.some((url) => url.endsWith('/pokemon/bulbasaur'))).toBe(false);

    fireEvent(screen.getByLabelText('Bulbasaur, #001'), 'pressIn');

    await waitFor(
      () => expect(getApi().requests.some((url) => url.endsWith('/pokemon/bulbasaur'))).toBe(true),
      SETTLE,
    );
  }, TIMEOUT);

  it('shows the base stats with their values', async () => {
    renderApp('/pokemon/bulbasaur');

    expect(await screen.findByText('Base Stats', {}, SETTLE)).toBeTruthy();
    expect(screen.getByLabelText('HP: 45')).toBeTruthy();
    expect(screen.getByLabelText('Attack: 49')).toBeTruthy();
    expect(screen.getByLabelText('Sp. Atk: 65')).toBeTruthy();
    expect(screen.getByLabelText('Speed: 45')).toBeTruthy();
  }, TIMEOUT);

  it('shows height and weight in both metric and imperial', async () => {
    renderApp('/pokemon/bulbasaur');

    expect(await screen.findByText('Breeding', {}, SETTLE)).toBeTruthy();
    expect(screen.getByText('0.7 m · 2\'04"')).toBeTruthy();
    expect(screen.getByText('6.9 kg · 15.2 lbs')).toBeTruthy();
  }, TIMEOUT);

  it('shows the type chips for the Pokémon', async () => {
    renderApp('/pokemon/bulbasaur');

    await screen.findByText('Base Stats', {}, SETTLE);
    expect(screen.getByText('Grass')).toBeTruthy();
    expect(screen.getByText('Poison')).toBeTruthy();
  }, TIMEOUT);

  it('previews eight moves and reveals the rest behind See all', async () => {
    renderApp('/pokemon/bulbasaur');

    expect(await screen.findByText('Moves (12)', {}, SETTLE)).toBeTruthy();
    expect(screen.getByText('Body Slam')).toBeTruthy();
    expect(screen.queryByText('Strength')).toBeNull();

    fireEvent.press(screen.getByText('See all'));

    await waitFor(() => expect(screen.getByText('Strength')).toBeTruthy(), SETTLE);
    expect(screen.getByText('Growl')).toBeTruthy();

    fireEvent.press(screen.getByText('Show less'));

    await waitFor(() => expect(screen.queryByText('Strength')).toBeNull(), SETTLE);
  }, TIMEOUT);

  it('hides the See all toggle when there are eight moves or fewer', async () => {
    renderApp('/pokemon/charmander');

    expect(await screen.findByText('Moves (4)', {}, SETTLE)).toBeTruthy();
    expect(screen.queryByText('See all')).toBeNull();
  }, TIMEOUT);

  it('navigates to a move and back again', async () => {
    const router = renderApp('/pokemon/bulbasaur');
    await screen.findByText('Base Stats', {}, SETTLE);

    fireEvent.press(screen.getByLabelText('Tackle move'));

    await waitFor(() => expect(router.getPathname()).toBe('/move/tackle'), SETTLE);
    expect(await screen.findByText('Power', {}, SETTLE)).toBeTruthy();

    fireEvent.press(screen.getAllByLabelText('Go back')[0]);

    await waitFor(() => expect(router.getPathname()).toBe('/pokemon/bulbasaur'), SETTLE);
  }, TIMEOUT);

  it('goes back to the Pokédex from the detail screen', async () => {
    const router = renderApp();
    await screen.findByText('Bulbasaur', {}, SETTLE);

    fireEvent.press(screen.getByLabelText('Bulbasaur, #001'));
    await waitFor(() => expect(router.getPathname()).toBe('/pokemon/bulbasaur'), SETTLE);

    fireEvent.press(screen.getByLabelText('Go back'));

    await waitFor(() => expect(router.getPathname()).toBe('/'), SETTLE);
  }, TIMEOUT);

  it('falls back to the pokéball when a form has neither artwork nor sprite', async () => {
    renderApp('/pokemon/charizard-mega-x');

    expect(await screen.findByText('Base Stats', {}, SETTLE)).toBeTruthy();
    expect(screen.getByLabelText('Charizard Mega X, no artwork available')).toBeTruthy();
  }, TIMEOUT);

  it('shows an error with a working retry when the detail cannot be loaded', async () => {
    getApi().offline = true;
    renderApp('/pokemon/bulbasaur');

    expect(await screen.findByText('Something went wrong', {}, SETTLE)).toBeTruthy();
    expect(screen.getByText(/Details for “Bulbasaur” could not be loaded/)).toBeTruthy();

    getApi().offline = false;
    fireEvent.press(screen.getByText('Try again'));

    await waitFor(() => expect(screen.getByText('Base Stats')).toBeTruthy(), SETTLE);
  }, TIMEOUT);

  it('dims a move pill while it is held down', async () => {
    renderApp('/pokemon/bulbasaur');
    await screen.findByText('Base Stats', {}, SETTLE);

    const pill = screen.getByLabelText('Tackle move');
    expect(StyleSheet.flatten(pill.props.style)?.opacity).toBeUndefined();

    holdDown(pill);

    expect(StyleSheet.flatten(screen.getByLabelText('Tackle move').props.style).opacity).toBe(0.6);
  }, TIMEOUT);

  it('shows the error state for a Pokémon that does not exist', async () => {
    renderApp('/pokemon/missingno');

    expect(await screen.findByText('Something went wrong', {}, SETTLE)).toBeTruthy();
    expect(screen.getByText(/Details for “Missingno” could not be loaded/)).toBeTruthy();
  }, TIMEOUT);
});
