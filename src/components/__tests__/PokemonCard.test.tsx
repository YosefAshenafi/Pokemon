import { fireEvent, render, screen } from '@testing-library/react-native';

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

  it('invokes onPress with the Pokémon name when tapped', () => {
    const onPress = jest.fn();
    render(<PokemonCard id={1} name="bulbasaur" types={['grass', 'poison']} onPress={onPress} />);

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledWith('bulbasaur');
  });
});
