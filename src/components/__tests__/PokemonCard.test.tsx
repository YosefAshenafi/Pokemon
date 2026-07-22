import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { PokemonCard } from '../PokemonCard';

jest.mock('@/api/pokeapi', () => ({
  getPokemon: jest.fn().mockResolvedValue({
    id: 1,
    name: 'bulbasaur',
    height: 7,
    weight: 69,
    types: [
      { slot: 1, type: { name: 'grass', url: '' } },
      { slot: 2, type: { name: 'poison', url: '' } },
    ],
    stats: [],
    moves: [],
    sprites: { front_default: null },
  }),
}));

function renderCard(onPress: jest.Mock = jest.fn()) {
  // gcTime: Infinity keeps the cache from scheduling timers that outlive the test
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  render(
    <QueryClientProvider client={client}>
      <PokemonCard id={1} name="bulbasaur" onPress={onPress} />
    </QueryClientProvider>,
  );
  return onPress;
}

describe('PokemonCard', () => {
  it('shows the formatted name and Pokédex number', () => {
    renderCard();

    expect(screen.getByText('Bulbasaur')).toBeTruthy();
    expect(screen.getByText('#001')).toBeTruthy();
  });

  it('renders type chips once the detail query resolves', async () => {
    renderCard();

    expect(await screen.findByText('Grass')).toBeTruthy();
    expect(screen.getByText('Poison')).toBeTruthy();
  });

  it('invokes onPress when tapped', () => {
    const onPress = renderCard();

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
