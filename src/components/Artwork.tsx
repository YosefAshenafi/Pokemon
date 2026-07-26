import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

import type { Pokemon } from '@/api/types';
import { artworkThumbUrl, artworkUrl, spriteUrl } from '@/utils/format';

import { Pokeball } from './Pokeball';

interface ArtworkProps {
  id: number;
  alt: string;
  className?: string;
  style?: { width?: number; height?: number; marginTop?: number };
  pokemon?: Pokemon;
  placeholderSize?: number;
  thumbWidth?: number;
}

const PLACEHOLDER_COLOR = 'rgba(154, 160, 181, 0.4)';

/** Pokémon artwork, falling back to the sprite and then a drawn pokéball. */
export function Artwork({
  id,
  alt,
  className,
  style,
  pokemon,
  placeholderSize = 56,
  thumbWidth,
}: ArtworkProps) {
  const [failures, setFailures] = useState(0);

  const candidates = (
    pokemon
      ? [pokemon.sprites.other?.['official-artwork']?.front_default, pokemon.sprites.front_default]
      : thumbWidth
        ? [artworkThumbUrl(id, thumbWidth), artworkUrl(id), spriteUrl(id)]
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
