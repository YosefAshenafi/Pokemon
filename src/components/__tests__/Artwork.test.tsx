import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Pokemon } from '@/api/types';

import { Artwork } from '../Artwork';

/** The minimum of a detail response that `Artwork` reads. */
function pokemonWith(officialArtwork: string | null, frontDefault: string | null): Pokemon {
  return {
    id: 10033,
    name: 'venusaur-mega',
    height: 24,
    weight: 1555,
    types: [],
    stats: [],
    moves: [],
    sprites: {
      front_default: frontDefault,
      other: { 'official-artwork': { front_default: officialArtwork } },
    },
  } as unknown as Pokemon;
}

/** expo-image normalises a string source into `[{ uri }]`, so match on the JSON. */
const source = () => JSON.stringify(screen.getByTestId('pokemon-artwork').props.source);

describe('Artwork', () => {
  it('shows the high-res official artwork for the id first', () => {
    render(<Artwork id={1} alt="Bulbasaur" />);

    expect(source()).toContain('official-artwork/1.png');
  });

  it('falls back to the default sprite when the official artwork fails', () => {
    render(<Artwork id={1} alt="Bulbasaur" />);

    fireEvent(screen.getByTestId('pokemon-artwork'), 'error', { nativeEvent: { error: 'load failed' } });

    expect(source()).toContain('/pokemon/1.png');
    expect(source()).not.toContain('official-artwork');
  });

  it('falls back to the pokéball placeholder when every candidate fails', () => {
    render(<Artwork id={1} alt="Bulbasaur" />);

    fireEvent(screen.getByTestId('pokemon-artwork'), 'error', { nativeEvent: { error: 'load failed' } });
    fireEvent(screen.getByTestId('pokemon-artwork'), 'error', { nativeEvent: { error: 'load failed' } });

    expect(screen.queryByTestId('pokemon-artwork')).toBeNull();
    expect(screen.getByLabelText('Bulbasaur, no artwork available')).toBeTruthy();
  });

  it('prefers the sprite URLs on a loaded detail over ones built from the id', () => {
    render(
      <Artwork
        id={10033}
        alt="Venusaur Mega"
        pokemon={pokemonWith('https://example.test/art.png', 'https://example.test/sprite.png')}
      />,
    );

    expect(source()).toContain('https://example.test/art.png');
  });

  it('skips straight to the sprite for a form with no official artwork', () => {
    render(
      <Artwork id={10033} alt="Venusaur Mega" pokemon={pokemonWith(null, 'https://example.test/sprite.png')} />,
    );

    expect(source()).toContain('https://example.test/sprite.png');
  });

  it('shows the placeholder immediately for a form with no images at all', () => {
    render(<Artwork id={10034} alt="Charizard Mega X" pokemon={pokemonWith(null, null)} />);

    expect(screen.queryByTestId('pokemon-artwork')).toBeNull();
    expect(screen.getByLabelText('Charizard Mega X, no artwork available')).toBeTruthy();
  });
});
