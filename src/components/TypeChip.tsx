import { Text, View } from 'react-native';

import { textColorOn, typeColor } from '@/theme/typeColors';
import { formatName } from '@/utils/format';

interface TypeChipProps {
  type: string;
  size?: 'sm' | 'md';
}

/** Pill badge tinted with the canonical color of a Pokémon type. */
export function TypeChip({ type, size = 'sm' }: TypeChipProps) {
  const background = typeColor(type);
  return (
    <View
      className={size === 'sm' ? 'rounded-full px-2.5 py-1' : 'rounded-full px-3.5 py-1.5'}
      style={{ backgroundColor: background }}
    >
      <Text
        className={size === 'sm' ? 'text-[11px] font-semibold' : 'text-xs font-semibold'}
        style={{ color: textColorOn(background) }}
      >
        {formatName(type)}
      </Text>
    </View>
  );
}
