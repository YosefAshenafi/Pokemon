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
  /** When the detail is already loaded, its sprite URLs are authoritative. */
  pokemon?: Pokemon;
  placeholderSize?: number;
}

const PLACEHOLDER_COLOR = 'rgba(154, 160, 181, 0.4)';

/**
 * Pokémon artwork with graceful degradation. Some forms (mega/gmax variants
 * with ids above 10000) have no official artwork, so this tries the official
 * artwork first, then the small default sprite, then a pokéball placeholder.
 */
export function Artwork({ id, alt, className, pokemon, placeholderSize = 56 }: ArtworkProps) {
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
        style={{ alignItems: 'center', justifyContent: 'center' }}
        accessibilityLabel={`${alt}, no artwork available`}
      >
        <Pokeball size={placeholderSize} color={PLACEHOLDER_COLOR} />
      </View>
    );
  }

  return (
    <Image
      source={source}
      alt={alt}
      contentFit="contain"
      transition={200}
      className={className}
      onError={() => setFailures((count) => count + 1)}
    />
  );
}
