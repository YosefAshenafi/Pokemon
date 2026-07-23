import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { formatName, formatPokemonId } from '@/utils/format';

import { Artwork } from './Artwork';
import { TypeChip } from './TypeChip';

interface PokemonCardProps {
  id: number;
  name: string;
  /** `undefined` while the type index is still building, `[]` once it settled. */
  types?: string[];
  onPress: (name: string) => void;
  onPressIn?: (name: string) => void;
}

/**
 * Grid card for the list screen. Purely presentational — artwork comes from the
 * id and types are passed in — so it stays cheap to render during fast scroll.
 */
export const PokemonCard = memo(function PokemonCard({
  id,
  name,
  types,
  onPress,
  onPressIn,
}: PokemonCardProps) {
  return (
    <Pressable
      onPress={() => onPress(name)}
      onPressIn={() => onPressIn?.(name)}
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

      <Artwork id={id} alt={formatName(name)} className="mt-2 h-24 w-full" placeholderSize={56} />

      <View className="mt-2 min-h-[22px] flex-row flex-wrap gap-1.5">
        {types
          ? types.map((type) => <TypeChip key={type} type={type} />)
          : [0, 1].map((i) => (
              <View
                key={i}
                testID="type-chip-placeholder"
                className="h-[22px] w-14 rounded-full bg-track"
              />
            ))}
      </View>
    </Pressable>
  );
});
