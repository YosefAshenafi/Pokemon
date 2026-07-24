import { act, screen, waitFor } from 'expo-router/testing-library';

import { renderApp, setupFakeApi } from '@/test/renderApp';

/**
 * The splash deliberately holds for 1400 ms and fades for 350 ms. Waiting that
 * out for real was the slowest thing in the suite, so the clock is advanced
 * instead - which tests the same hand-off deterministically and in a fraction
 * of the time.
 *
 * Timer mode is per-file in Jest, so this lives on its own: switching back to
 * real timers mid-file leaves React Query's and AsyncStorage's already-scheduled
 * callbacks orphaned, which strands whichever test runs next.
 */

setupFakeApi();

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

const splash = () => screen.queryByTestId('animated-splash', { includeHiddenElements: true });

it('hands over from the splash to the Pokédex once its animation finishes', async () => {
  renderApp();

  await waitFor(() => expect(splash()).toBeTruthy(), { timeout: 15000 });

  await act(async () => {
    jest.advanceTimersByTime(2000);
  });

  expect(splash()).toBeNull();
  expect(screen.getByText(/Who are you/)).toBeTruthy();
}, 30000);
