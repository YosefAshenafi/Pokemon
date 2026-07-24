import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { holdDown } from '@/test/press';

import { PokemonCard } from '../PokemonCard';

describe('PokemonCard', () => {
  it('shows the formatted name and Pokédex number', () => {
    render(<PokemonCard id={1} name="bulbasaur" types={['grass', 'poison']} onPress={jest.fn()} />);

    expect(screen.getByText('Bulbasaur')).toBeTruthy();
    expect(screen.getByText('#001')).toBeTruthy();
  });

  it('renders a chip for each of its types', () => {
    render(<PokemonCard id={1} name="bulbasaur" types={['grass', 'poison']} onPress={jest.fn()} />);

    expect(screen.getByText('Grass')).toBeTruthy();
    expect(screen.getByText('Poison')).toBeTruthy();
  });

  it('shows placeholder chips while the type index is still loading', () => {
    render(<PokemonCard id={1} name="bulbasaur" onPress={jest.fn()} />);

    expect(screen.getAllByTestId('type-chip-placeholder')).toHaveLength(2);
  });

  it('shows no chips at all once the type index settles without types for it', () => {
    render(<PokemonCard id={1} name="bulbasaur" types={[]} onPress={jest.fn()} />);

    expect(screen.queryAllByTestId('type-chip-placeholder')).toHaveLength(0);
    expect(screen.queryByText('Grass')).toBeNull();
  });

  it('invokes onPress with the Pokémon name when tapped', () => {
    const onPress = jest.fn();
    render(<PokemonCard id={1} name="bulbasaur" types={['grass', 'poison']} onPress={onPress} />);

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledWith('bulbasaur');
  });

  it('dims and shrinks while held down', () => {
    render(<PokemonCard id={1} name="bulbasaur" types={['grass']} onPress={jest.fn()} />);
    const card = screen.getByRole('button');

    expect(StyleSheet.flatten(card.props.style)?.opacity).toBeUndefined();

    holdDown(card);

    const pressed = StyleSheet.flatten(screen.getByRole('button').props.style);
    expect(pressed.opacity).toBe(0.85);
    expect(pressed.transform).toEqual([{ scale: 0.98 }]);
  });

  it('invokes onPressIn on press-in so the detail can be prefetched', () => {
    const onPressIn = jest.fn();
    render(
      <PokemonCard id={1} name="bulbasaur" types={['grass']} onPress={jest.fn()} onPressIn={onPressIn} />,
    );

    fireEvent(screen.getByRole('button'), 'pressIn');

    expect(onPressIn).toHaveBeenCalledWith('bulbasaur');
  });
});
