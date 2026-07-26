import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CARD_MAX_FONT_SCALE, CARD_METRICS } from '@/constants/ui';
import { formatName, formatPokemonId } from '@/utils/format';

import { Artwork } from './Artwork';
import { TypeChip } from './TypeChip';

interface PokemonCardProps {
  id: number;
  name: string;
  /** `undefined` while the type index is still building, `[]` once it settled. */
  types?: readonly string[];
  onPress: (name: string) => void;
  onPressIn?: (name: string) => void;
  /** System font scale, so the card matches the row height the list reserved. */
  fontScale: number;
}

/**
 * Grid card for the list screen. Purely presentational - artwork comes from the
 * id and types are passed in - so it stays cheap to render during fast scroll.
 *
 * The load-bearing dimensions come from `CARD_METRICS` rather than utility
 * classes, because `PokemonGrid` computes `getItemLayout` from those same
 * numbers: what is rendered and what is promised to FlatList have to share one
 * source, or the promise breaks silently the next time a padding changes.
 */
export const PokemonCard = memo(function PokemonCard({
  id,
  name,
  types,
  onPress,
  onPressIn,
  fontScale,
}: PokemonCardProps) {
  const scale = Math.min(fontScale, CARD_MAX_FONT_SCALE);
  const titleHeight = Math.round(CARD_METRICS.title * scale);
  const chipsHeight = Math.round(CARD_METRICS.chips * scale);

  return (
    <Pressable
      onPress={() => onPress(name)}
      onPressIn={() => onPressIn?.(name)}
      accessibilityRole="button"
      accessibilityLabel={`${formatName(name)}, ${formatPokemonId(id)}`}
      accessibilityHint="Opens details"
      className="w-[48%] rounded-2xl border border-line bg-surface"
      style={({ pressed }) => [
        { padding: CARD_METRICS.padding, marginBottom: CARD_METRICS.rowGap },
        pressed ? { opacity: 0.85, transform: [{ scale: 0.98 }] } : null,
      ]}
    >
      <View
        className="flex-row items-center justify-between gap-1"
        style={{ height: titleHeight }}
      >
        {/*
          `lineHeight` is set, not inherited from the font: it is the same
          number the row height is computed from, so the text cannot render
          taller than the space reserved for it on a device whose default font
          differs from the one this was designed against.
        */}
        <Text
          className="flex-1 text-[13px] font-semibold text-ink"
          numberOfLines={1}
          maxFontSizeMultiplier={CARD_MAX_FONT_SCALE}
          style={{ lineHeight: titleHeight }}
        >
          {formatName(name)}
        </Text>
        <Text
          className="text-[11px] text-ink-subtle"
          maxFontSizeMultiplier={CARD_MAX_FONT_SCALE}
          style={{ lineHeight: titleHeight, fontVariant: ['tabular-nums'] }}
        >
          {formatPokemonId(id)}
        </Text>
      </View>

      <Artwork
        id={id}
        alt={formatName(name)}
        className="w-full"
        style={{ height: CARD_METRICS.artwork, marginTop: CARD_METRICS.gap }}
        placeholderSize={56}
      />

      <View
        className="flex-row flex-wrap gap-1.5"
        style={{ height: chipsHeight, marginTop: CARD_METRICS.gap }}
      >
        {types
          ? types.map((type) => <TypeChip key={type} type={type} />)
          : [0, 1].map((i) => (
              <View
                key={i}
                testID="type-chip-placeholder"
                className="w-14 rounded-full bg-track"
                style={{ height: chipsHeight }}
              />
            ))}
      </View>
    </Pressable>
  );
});
