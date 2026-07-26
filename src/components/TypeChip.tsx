import { StyleSheet, Text, View } from 'react-native';

import { textColorOn, typeColor } from '@/theme/typeColors';
import { formatName } from '@/utils/format';

interface TypeChipProps {
  type: string;
  size?: 'sm' | 'md';
}

/** StyleSheet-styled for the same reason as PokemonCard: it renders in FlatList cells. */
export function TypeChip({ type, size = 'sm' }: TypeChipProps) {
  const background = typeColor(type);
  const sm = size === 'sm';
  return (
    <View style={[sm ? styles.chipSm : styles.chipMd, { backgroundColor: background }]}>
      <Text style={[sm ? styles.labelSm : styles.labelMd, { color: textColorOn(background) }]}>
        {formatName(type)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chipSm: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipMd: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  labelSm: { fontSize: 11, fontWeight: '600' },
  labelMd: { fontSize: 12, fontWeight: '600' },
});
