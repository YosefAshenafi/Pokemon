import { fireEvent, screen, waitFor } from 'expo-router/testing-library';

import { renderApp, setupFakeApi } from '@/test/renderApp';

const getApi = setupFakeApi();

const SETTLE = { timeout: 15000 };
const TIMEOUT = 30000;

describe('Move screen', () => {
  it('shows the move name, type and damage class', async () => {
    renderApp('/move/tackle');

    expect(await screen.findByText('Tackle', {}, SETTLE)).toBeTruthy();
    expect(screen.getByText('Move')).toBeTruthy();
    expect(screen.getByText('Normal')).toBeTruthy();
    expect(screen.getByText('Physical')).toBeTruthy();
  }, TIMEOUT);

  it('shows power, accuracy and PP', async () => {
    renderApp('/move/tackle');

    await screen.findByText('Tackle', {}, SETTLE);
    expect(screen.getByText('Power')).toBeTruthy();
    expect(screen.getByText('40')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.getByText('35')).toBeTruthy();
  }, TIMEOUT);

  it('shows an em dash for a status move with no power', async () => {
    renderApp('/move/growl');

    expect(await screen.findByText('Growl', {}, SETTLE)).toBeTruthy();
    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.getByText('Status')).toBeTruthy();
  }, TIMEOUT);

  it('shows em dashes and no damage class for a move that never misses', async () => {
    renderApp('/move/swift');

    expect(await screen.findByText('Swift', {}, SETTLE)).toBeTruthy();
    // Accuracy is null on a never-miss move, so only that box shows a dash.
    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.queryByText('Physical')).toBeNull();
    expect(screen.queryByText('Status')).toBeNull();
  }, TIMEOUT);

  it('interpolates the effect chance into the effect text', async () => {
    renderApp('/move/ember');

    expect(await screen.findByText('Ember', {}, SETTLE)).toBeTruthy();
    expect(screen.getByText('Has a 10% chance to burn the target.')).toBeTruthy();
    expect(screen.queryByText(/\$effect_chance/)).toBeNull();
  }, TIMEOUT);

  it('shows a dash in every fact box for a move with no power, accuracy or PP', async () => {
    renderApp('/move/struggle');

    expect(await screen.findByText('Struggle', {}, SETTLE)).toBeTruthy();
    expect(screen.getAllByText('—')).toHaveLength(3);
  }, TIMEOUT);

  it('falls back to the first effect entry when there is no English one', async () => {
    renderApp('/move/karate-chop');

    expect(await screen.findByText('Karate Chop', {}, SETTLE)).toBeTruthy();
    expect(screen.getByText('Effect')).toBeTruthy();
    expect(screen.getByText('急所に当たりやすい。')).toBeTruthy();
  }, TIMEOUT);

  it('omits the effect card for a move with no effect text', async () => {
    renderApp('/move/mystery-move');

    expect(await screen.findByText('Mystery Move', {}, SETTLE)).toBeTruthy();
    expect(screen.getByText('Power')).toBeTruthy();
    expect(screen.queryByText('Effect')).toBeNull();
  }, TIMEOUT);

  it('shows an error with a working retry when the move cannot be loaded', async () => {
    getApi().offline = true;
    renderApp('/move/tackle');

    expect(await screen.findByText('Something went wrong', {}, SETTLE)).toBeTruthy();
    expect(screen.getByText(/Details for “Tackle” could not be loaded/)).toBeTruthy();

    getApi().offline = false;
    fireEvent.press(screen.getByText('Try again'));

    await waitFor(() => expect(screen.getByText('Power')).toBeTruthy(), SETTLE);
  }, TIMEOUT);
});
