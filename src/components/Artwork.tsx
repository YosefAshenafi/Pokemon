import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

import type { Pokemon } from '@/api/types';
import { artworkUrl, spriteUrl } from '@/utils/format';

import { Pokeball } from './Pokeball';

interface ArtworkProps {
  id: number;
  alt: string;
  className?: string;
  /**
   * Dimensions the caller needs to be exact, e.g. a card whose row height is
   * promised to a FlatList. Deliberately narrower than a full style prop: both
   * the image and its pokéball fallback must honour it, and only box metrics
   * are meaningful to both.
   */
  style?: { width?: number; height?: number; marginTop?: number };
  /** When the detail is already loaded, its sprite URLs are authoritative. */
  pokemon?: Pokemon;
  placeholderSize?: number;
}

const PLACEHOLDER_COLOR = 'rgba(154, 160, 181, 0.4)';

/**
 * Pokémon artwork, falling back to the default sprite and then a pokéball -
 * mega/gmax forms (ids above 10000) have no official artwork.
 */
export function Artwork({
  id,
  alt,
  className,
  style,
  pokemon,
  placeholderSize = 56,
}: ArtworkProps) {
  const [failures, setFailures] = useState(0);

  const candidates = (
    pokemon
      ? [pokemon.sprites.other?.['official-artwork']?.front_default, pokemon.sprites.front_default]
      : [artworkUrl(id), spriteUrl(id)]
  ).filter((url): url is string => Boolean(url));

  const source = candidates[failures];

  if (!source) {
    return (
      <View
        className={className}
        style={[{ alignItems: 'center', justifyContent: 'center' }, style]}
        accessibilityLabel={`${alt}, no artwork available`}
      >
        <Pokeball size={placeholderSize} color={PLACEHOLDER_COLOR} />
      </View>
    );
  }

  return (
    <Image
      testID="pokemon-artwork"
      source={source}
      alt={alt}
      contentFit="contain"
      transition={200}
      className={className}
      style={style}
      onError={() => setFailures((count) => count + 1)}
    />
  );
}
