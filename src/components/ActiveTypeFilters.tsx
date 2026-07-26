import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, Text, View } from 'react-native';

import type { PokemonType } from '@/api/types';
import { textColorOn, typeColor } from '@/theme/typeColors';
import { formatName } from '@/utils/format';

interface ActiveTypeFiltersProps {
  types: PokemonType[];
  onRemove: (type: PokemonType) => void;
}

export function ActiveTypeFilters({ types, onRemove }: ActiveTypeFiltersProps) {
  if (types.length === 0) return null;

  return (
    <View className="mt-3 flex-row flex-wrap gap-2">
      {types.map((type) => {
        const background = typeColor(type);
        const foreground = textColorOn(background);
        return (
          <Pressable
            key={type}
            onPress={() => onRemove(type)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${formatName(type)} filter`}
            className="flex-row items-center gap-1 rounded-full py-1 pl-3 pr-2"
            style={{ backgroundColor: background }}
          >
            <Text className="text-[12px] font-semibold" style={{ color: foreground }}>
              {formatName(type)}
            </Text>
            <MaterialCommunityIcons name="close" size={15} color={foreground} />
          </Pressable>
        );
      })}
    </View>
  );
}
