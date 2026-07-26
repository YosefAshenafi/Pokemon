import { memo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CARD_MAX_FONT_SCALE, CARD_METRICS } from '@/constants/ui';
import { formatName, formatPokemonId } from '@/utils/format';

import { Artwork } from './Artwork';
import { TypeChip } from './TypeChip';

interface PokemonCardProps {
  id: number;
  name: string;
  types?: readonly string[];
  onPress: (name: string) => void;
  onPressIn?: (name: string) => void;
  fontScale: number;
}

/** Grid card for the list screen; dimensions come from CARD_METRICS. */
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
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={() => onPress(name)}
      onPressIn={() => {
        setPressed(true);
        onPressIn?.(name);
      }}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={`${formatName(name)}, ${formatPokemonId(id)}`}
      accessibilityHint="Opens details"
      className="w-[48%] rounded-2xl border border-line bg-surface"
      // A plain object, never a function: NativeWind rewrites `style` to inject
      // the className rules, and a function nested in that array is dropped.
      style={{
        padding: CARD_METRICS.padding,
        marginBottom: CARD_METRICS.rowGap,
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      }}
    >
      <View
        className="flex-row items-center justify-between gap-1"
        style={{ height: titleHeight }}
      >
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
