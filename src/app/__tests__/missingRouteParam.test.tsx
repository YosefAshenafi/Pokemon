import { renderRouter, screen } from 'expo-router/testing-library';

import { queryClient } from '@/api/queryClient';
import { installFakePokeApi, type FakePokeApi } from '@/test/fakePokeApi';

import RootLayout from '../_layout';
import MoveScreen from '../move/[name]';
import DetailScreen from '../pokemon/[name]';

/**
 * Both detail screens guard against a missing `name` param. The router supplies
 * one whenever `/pokemon/[name]` or `/move/[name]` matches, so the guard is only
 * reachable by mounting the same screen at a route that has no such segment —
 * which is exactly what these tests do, through the real router and the real
 * root layout.
 */

let api: FakePokeApi;

beforeEach(() => {
  api = installFakePokeApi();
  queryClient.clear();
});

afterEach(() => {
  api.restore();
  queryClient.clear();
});

const SETTLE = { timeout: 15000 };
const TIMEOUT = 30000;

describe('Detail screens without a route param', () => {
  it('shows the error state rather than requesting an empty Pokémon', async () => {
    renderRouter(
      { _layout: RootLayout, index: DetailScreen },
      { initialUrl: '/' },
    );

    expect(await screen.findByText('Something went wrong', {}, SETTLE)).toBeTruthy();
    expect(screen.getByText(/could not be loaded/)).toBeTruthy();
    expect(api.requests.some((url) => url.includes('/pokemon/'))).toBe(false);
  }, TIMEOUT);

  it('shows the error state rather than requesting an empty move', async () => {
    renderRouter(
      { _layout: RootLayout, index: MoveScreen },
      { initialUrl: '/' },
    );

    expect(await screen.findByText('Something went wrong', {}, SETTLE)).toBeTruthy();
    expect(screen.getByText(/could not be loaded/)).toBeTruthy();
    expect(api.requests.some((url) => url.includes('/move/'))).toBe(false);
  }, TIMEOUT);
});
