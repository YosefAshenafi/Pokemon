import { screen } from 'expo-router/testing-library';

import { renderApp, setupFakeApi } from '@/test/renderApp';

/**
 * The root layout calls `SplashScreen.preventAutoHideAsync()` at module scope
 * and swallows any rejection, so a splash-screen failure can never stop the app
 * booting. This file mocks the native module to reject, in its own module
 * registry so the module-scope call runs against the rejecting version.
 */
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockRejectedValue(new Error('no native splash')),
  hideAsync: jest.fn().mockRejectedValue(new Error('no native splash')),
}));

setupFakeApi();

describe('App boot when the native splash screen is unavailable', () => {
  it('still renders the Pokédex', async () => {
    renderApp();

    expect(await screen.findByText(/Who are you/, {}, { timeout: 15000 })).toBeTruthy();
    expect(await screen.findByText('Bulbasaur', {}, { timeout: 15000 })).toBeTruthy();
  }, 30000);
});
