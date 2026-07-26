import { render, screen } from '@testing-library/react-native';
import { Dimensions } from 'react-native';

import type { PokemonSummary } from '@/api/types';
import { SEARCH_RESULT_LIMIT } from '@/constants/api';
import { CARD_MAX_FONT_SCALE, CARD_METRICS, gridRowHeight } from '@/constants/ui';

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

  /**
   * `getItemLayout` is a promise about geometry, and the test renderer measures
   * everything as zero - so nothing else in this suite can tell whether the
   * promise is true. These assertions pin the two things that make it correct.
   */
  describe('getItemLayout', () => {
    const layoutOf = (index: number) => {
      renderGrid();
      const getItemLayout = screen.getByTestId('pokemon-grid').props.getItemLayout;
      return getItemLayout(null, index) as { length: number; offset: number; index: number };
    };

    it('stacks consecutive rows without a gap or an overlap', () => {
      const first = layoutOf(0);
      const second = layoutOf(1);

      // The argument is a ROW index: FlatList reports row counts to
      // VirtualizedList for a multi-column list but passes this callback
      // straight through. Treating it as an item index and dividing by the
      // column count would put rows 0 and 1 at the same offset.
      expect(first.offset).toBe(0);
      expect(second.offset).toBe(first.length);
      expect(second.length).toBe(first.length);
    });

    it('adds up to the box a card actually occupies', () => {
      const { border, padding, title, gap, artwork, chips, rowGap } = CARD_METRICS;

      expect(gridRowHeight(1)).toBe(
        border * 2 + padding * 2 + title + gap + artwork + gap + chips + rowGap,
      );
    });

    it('reserves the height for the scale the device is actually running at', () => {
      const { length } = layoutOf(0);

      // Not `gridRowHeight(1)`: the promise has to track the live font scale,
      // or a user with larger text gets rows that overlap.
      expect(length).toBe(gridRowHeight(Dimensions.get('window').fontScale));
    });

    it('grows the row when the system font size does', () => {
      // Reserved space and rendered text scale together, so a fixed row height
      // and dynamic type do not have to be in conflict.
      expect(gridRowHeight(1.3)).toBeGreaterThan(gridRowHeight(1));
      // ...but only up to the ceiling the card itself caps text at.
      expect(gridRowHeight(3)).toBe(gridRowHeight(CARD_MAX_FONT_SCALE));
    });
  });
});
