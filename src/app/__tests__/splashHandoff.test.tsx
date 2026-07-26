import { act, screen, waitFor } from 'expo-router/testing-library';

import { renderApp, setupFakeApi } from '@/test/renderApp';

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
