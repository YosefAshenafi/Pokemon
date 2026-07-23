import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { Modal, Portal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getPokemonByType } from '@/api/pokeapi';
import { darkColors, lightColors } from '@/theme/paperTheme';
import { TYPE_COLORS, textColorOn, typeColor } from '@/theme/typeColors';
import { formatName } from '@/utils/format';

const TYPES = Object.keys(TYPE_COLORS);

interface TypeFilterSheetProps {
  visible: boolean;
  activeTypes: string[];
  /** Toggles a single type in or out of the selection. */
  onToggle: (type: string) => void;
  onClear: () => void;
  onDismiss: () => void;
}

/** Bottom sheet that filters the Pokédex to any combination of types. */
export function TypeFilterSheet({
  visible,
  activeTypes,
  onToggle,
  onClear,
  onDismiss,
}: TypeFilterSheetProps) {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const hasSelection = activeTypes.length > 0;
  const queryClient = useQueryClient();

  // Warm the cache for every type as soon as the sheet opens, so tapping a type
  // filters instantly instead of waiting on its first network fetch. Cached
  // types (staleTime: Infinity) are skipped, so this only fetches once.
  useEffect(() => {
    if (!visible) return;
    for (const type of TYPES) {
      queryClient.prefetchQuery({
        queryKey: ['pokemon', 'type', type],
        queryFn: () => getPokemonByType(type),
        staleTime: Infinity,
      });
    }
  }, [visible, queryClient]);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        // Override Paper's safe-area marginBottom so the sheet sits flush to the
        // bottom edge; the inset is handled by paddingBottom instead.
        style={{ justifyContent: 'flex-end', marginBottom: 0 }}
        contentContainerStyle={{
          backgroundColor: colors.surface,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 24,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: 14 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.track }} />
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink }}>Filter by type</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Pressable
              onPress={onClear}
              disabled={!hasSelection}
              accessibilityRole="button"
              accessibilityLabel="Clear type filter"
              accessibilityState={{ disabled: !hasSelection }}
              hitSlop={8}
              style={{ paddingHorizontal: 8, paddingVertical: 4 }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: hasSelection ? colors.accent : colors.inkSubtle,
                }}
              >
                Clear
              </Text>
            </Pressable>
            <Pressable
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel="Close filters"
              hitSlop={8}
              style={{ padding: 4 }}
            >
              <MaterialCommunityIcons name="close" size={22} color={colors.inkMuted} />
            </Pressable>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: colors.line, marginBottom: 16 }} />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {TYPES.map((type) => {
            const background = typeColor(type);
            const selected = activeTypes.includes(type);
            return (
              <Pressable
                key={type}
                onPress={() => onToggle(type)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${formatName(type)} type`}
                accessibilityHint={
                  selected ? 'Removes this type from the filter' : 'Adds this type to the filter'
                }
                style={{
                  backgroundColor: background,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  borderRadius: 999,
                  borderWidth: 2,
                  borderColor: selected ? colors.ink : 'transparent',
                  // Dim the unselected types once a selection exists.
                  opacity: !hasSelection || selected ? 1 : 0.6,
                }}
              >
                {selected ? (
                  <MaterialCommunityIcons name="check" size={15} color={textColorOn(background)} />
                ) : null}
                <Text style={{ color: textColorOn(background), fontSize: 13, fontWeight: '700' }}>
                  {formatName(type)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </Portal>
  );
}
