import { memo, useState } from 'react';
import { PixelRatio, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { CARD_MAX_FONT_SCALE, CARD_METRICS } from '@/constants/ui';
import { darkColors, lightColors } from '@/theme/paperTheme';
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

/**
 * Grid card for the list screen; dimensions come from CARD_METRICS.
 *
 * Styled with StyleSheet rather than Tailwind classes: cards render inside
 * FlatList's speculative windowing, where NativeWind's render-time colour
 * scheme subscription leaks and raises React's "update on a component that
 * hasn't mounted yet" warning whenever the theme flips.
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
  const [pressed, setPressed] = useState(false);
  const colors = useColorScheme() === 'dark' ? darkColors : lightColors;

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
      style={[
        styles.card,
        {
          borderColor: colors.line,
          backgroundColor: colors.surface,
          padding: CARD_METRICS.padding,
          marginBottom: CARD_METRICS.rowGap,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.titleRow, { height: titleHeight }]}>
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={CARD_MAX_FONT_SCALE}
          style={[styles.name, { color: colors.ink, lineHeight: titleHeight }]}
        >
          {formatName(name)}
        </Text>
        <Text
          maxFontSizeMultiplier={CARD_MAX_FONT_SCALE}
          style={[styles.number, { color: colors.inkSubtle, lineHeight: titleHeight }]}
        >
          {formatPokemonId(id)}
        </Text>
      </View>

      <Artwork
        id={id}
        alt={formatName(name)}
        style={{ width: '100%', height: CARD_METRICS.artwork, marginTop: CARD_METRICS.gap }}
        placeholderSize={56}
        thumbWidth={PixelRatio.getPixelSizeForLayoutSize(CARD_METRICS.artwork)}
      />

      <View style={[styles.chips, { height: chipsHeight, marginTop: CARD_METRICS.gap }]}>
        {types
          ? types.map((type) => <TypeChip key={type} type={type} />)
          : [0, 1].map((i) => (
              <View
                key={i}
                testID="type-chip-placeholder"
                style={[styles.chipPlaceholder, { height: chipsHeight, backgroundColor: colors.track }]}
              />
            ))}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: { width: '48%', borderRadius: 16, borderWidth: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  name: { flex: 1, fontSize: 13, fontWeight: '600' },
  number: { fontSize: 11, fontVariant: ['tabular-nums'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipPlaceholder: { width: 56, borderRadius: 999 },
});
