import { render, screen } from '@testing-library/react-native';
import { Dimensions, FlatList } from 'react-native';

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
      requestKey=""
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

  describe('scroll position across request changes', () => {
    it('returns to the top when the request behind the rows changes', () => {
      const scrollToOffset = jest
        .spyOn(FlatList.prototype, 'scrollToOffset')
        .mockImplementation(() => {});
      const { rerender } = renderGrid();
      scrollToOffset.mockClear();

      rerender(
        <PokemonGrid
          data={[{ id: 25, name: 'pikachu' }]}
          typesByName={{}}
          typesPending={false}
          onSelect={jest.fn()}
          onPrefetch={jest.fn()}
          onEndReached={jest.fn()}
          loadingMore={false}
          truncated={false}
          refreshing={false}
          empty={null}
          requestKey="pika"
        />,
      );

      expect(scrollToOffset).toHaveBeenCalledWith({ offset: 0, animated: false });
      scrollToOffset.mockRestore();
    });

    it('holds its place while pagination appends under the same request', () => {
      const scrollToOffset = jest
        .spyOn(FlatList.prototype, 'scrollToOffset')
        .mockImplementation(() => {});
      const { rerender } = renderGrid();
      scrollToOffset.mockClear();

      rerender(
        <PokemonGrid
          data={[...ROWS, { id: 7, name: 'squirtle' }, { id: 8, name: 'wartortle' }]}
          typesByName={{}}
          typesPending={false}
          onSelect={jest.fn()}
          onPrefetch={jest.fn()}
          onEndReached={jest.fn()}
          loadingMore={false}
          truncated={false}
          refreshing={false}
          empty={null}
          requestKey=""
        />,
      );

      expect(scrollToOffset).not.toHaveBeenCalled();
      scrollToOffset.mockRestore();
    });
  });

  describe('getItemLayout', () => {
    const layoutOf = (index: number) => {
      renderGrid();
      const getItemLayout = screen.getByTestId('pokemon-grid').props.getItemLayout;
      return getItemLayout(null, index) as { length: number; offset: number; index: number };
    };

    it('stacks consecutive rows without a gap or an overlap', () => {
      const first = layoutOf(0);
      const second = layoutOf(1);

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

      expect(length).toBe(gridRowHeight(Dimensions.get('window').fontScale));
    });

    it('grows the row when the system font size does', () => {
      expect(gridRowHeight(1.3)).toBeGreaterThan(gridRowHeight(1));
      expect(gridRowHeight(3)).toBe(gridRowHeight(CARD_MAX_FONT_SCALE));
    });
  });
});
