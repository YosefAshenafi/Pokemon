import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { usePokemon } from '@/hooks/usePokemon';
import { formatName, formatPokemonId } from '@/utils/format';

import { Artwork } from './Artwork';
import { TypeChip } from './TypeChip';

interface PokemonCardProps {
  id: number;
  name: string;
  onPress: () => void;
}

/**
 * Grid card for the list screen. Fetches the Pokémon's detail for its type
 * chips through the same cached query the detail screen uses, so tapping a
 * card that has finished loading opens the detail screen instantly.
 */
export const PokemonCard = memo(function PokemonCard({ id, name, onPress }: PokemonCardProps) {
  const { data } = usePokemon(name);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${formatName(name)}, ${formatPokemonId(id)}`}
      accessibilityHint="Opens details"
      className="mb-3 w-[48%] rounded-2xl border border-line bg-surface p-3"
      style={({ pressed }) => (pressed ? { opacity: 0.85, transform: [{ scale: 0.98 }] } : undefined)}
    >
      <View className="flex-row items-center justify-between gap-1">
        <Text className="flex-1 text-[13px] font-semibold text-ink" numberOfLines={1}>
          {formatName(name)}
        </Text>
        <Text className="text-[11px] text-ink-subtle" style={{ fontVariant: ['tabular-nums'] }}>
          {formatPokemonId(id)}
        </Text>
      </View>

      <Artwork
        id={id}
        pokemon={data}
        alt={formatName(name)}
        className="mt-2 h-24 w-full"
        placeholderSize={56}
      />

      <View className="mt-2 min-h-[22px] flex-row flex-wrap gap-1.5">
        {data
          ? data.types.map(({ type }) => <TypeChip key={type.name} type={type.name} />)
          : [0, 1].map((i) => <View key={i} className="h-[22px] w-14 rounded-full bg-track" />)}
      </View>
    </Pressable>
  );
});
