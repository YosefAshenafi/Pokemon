import { Text, useColorScheme } from 'react-native';
import { Searchbar } from 'react-native-paper';

import type { PokemonType } from '@/api/types';
import { darkColors, lightColors } from '@/theme/paperTheme';
import { typeColor } from '@/theme/typeColors';

import { ActiveTypeFilters } from './ActiveTypeFilters';
import { ScreenHeader } from './ScreenHeader';

interface SearchHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
  onQueryFocus: () => void;
  activeTypes: PokemonType[];
  onRemoveType: (type: PokemonType) => void;
  onOpenFilters: () => void;
}

export function SearchHeader({
  query,
  onQueryChange,
  onQueryFocus,
  activeTypes,
  onRemoveType,
  onOpenFilters,
}: SearchHeaderProps) {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const filterIconColor = activeTypes[0] ? typeColor(activeTypes[0]) : undefined;

  return (
    <ScreenHeader>
      <Text
        accessibilityRole="header"
        className="w-64 text-[26px] font-bold leading-9 text-white"
      >
        Who are you{'\n'}looking for?
      </Text>
      <Searchbar
        value={query}
        onChangeText={onQueryChange}
        onFocus={onQueryFocus}
        placeholder="e.g. Pikachu or 25"
        accessibilityLabel="Search Pokémon by name or number"
        mode="bar"
        elevation={0}
        traileringIcon="tune-variant"
        onTraileringIconPress={onOpenFilters}
        traileringIconColor={filterIconColor}
        traileringIconAccessibilityLabel="Filter Pokémon by type"
        style={{ marginTop: 16, borderRadius: 28, backgroundColor: colors.surface }}
        inputStyle={{ fontSize: 14 }}
      />
      <ActiveTypeFilters types={activeTypes} onRemove={onRemoveType} />
    </ScreenHeader>
  );
}
