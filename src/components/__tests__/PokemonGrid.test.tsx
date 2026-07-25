import { render, screen } from '@testing-library/react-native';

import type { PokemonSummary } from '@/api/types';
import { SEARCH_RESULT_LIMIT } from '@/constants/api';

import { PokemonGrid } from '../PokemonGrid';

const ROWS: PokemonSummary[] = [
  { id: 1, name: 'bulbasaur' },
  { id: 4, name: 'charmander' },
];

function renderGrid(overrides: Partial<React.ComponentProps<typeof PokemonGrid>> = {}) {
  return render(
    <PokemonGrid
      data={ROWS}
      typesByName={{ bulbasaur: ['grass', 'poison'], charmander: ['fire'] }}
      typesPending={false}
      onSelect={jest.fn()}
      onPrefetch={jest.fn()}
      onEndReached={jest.fn()}
      loadingMore={false}
      truncated={false}
      refreshing={false}
      empty={null}
      {...overrides}
    />,
  );
}

describe('PokemonGrid', () => {
  it('renders a card per row with the types it was handed', () => {
    renderGrid();

    expect(screen.getByText('Bulbasaur')).toBeTruthy();
    expect(screen.getByText('Grass')).toBeTruthy();
    expect(screen.getByText('Fire')).toBeTruthy();
  });

  it('says so when the render cap hid further matches', () => {
    // Otherwise the last visible row reads as the last match, which it is not.
    renderGrid({ truncated: true });

    expect(screen.getByText(new RegExp(`first ${SEARCH_RESULT_LIMIT} matches`))).toBeTruthy();
  });

  it('stays quiet when every match is on screen', () => {
    renderGrid();

    expect(screen.queryByText(/matches/)).toBeNull();
  });

  it('prefers the loading spinner over the cap notice while a page is arriving', () => {
    renderGrid({ loadingMore: true, truncated: true });

    expect(screen.getByLabelText('Loading more Pokémon')).toBeTruthy();
    expect(screen.queryByText(/matches/)).toBeNull();
  });
});
