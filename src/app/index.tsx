import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, useColorScheme, View } from 'react-native';
import { ActivityIndicator, Searchbar } from 'react-native-paper';

import { darkColors, lightColors } from '@/theme/paperTheme';
import { textColorOn, typeColor } from '@/theme/typeColors';
import { formatName } from '@/utils/format';

import type { PokemonSummary } from '@/api/types';
import { ErrorState } from '@/components/ErrorState';
import { PokemonCard } from '@/components/PokemonCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SkeletonCard } from '@/components/SkeletonCard';
import { TypeFilterSheet } from '@/components/TypeFilterSheet';
import { usePokemonByTypes } from '@/hooks/usePokemonByTypes';
import { usePokemonList } from '@/hooks/usePokemonList';
import { usePokemonSearch } from '@/hooks/usePokemonSearch';
import { usePokemonTypeIndex } from '@/hooks/usePokemonTypeIndex';

const SKELETON_COUNT = 8;

export default function ListScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const isSearching = query.trim().length > 0;
  const isFiltering = activeTypes.length > 0;

  const list = usePokemonList();
  const search = usePokemonSearch(query);
  const typeList = usePokemonByTypes(activeTypes);
  const typeIndex = usePokemonTypeIndex();

  const openDetail = useCallback(
    (name: string) => router.push({ pathname: '/pokemon/[name]', params: { name } }),
    [router],
  );

  const typeMap = typeIndex.data;
  const renderItem = useCallback(
    ({ item }: { item: PokemonSummary }) => (
      <PokemonCard id={item.id} name={item.name} types={typeMap?.[item.name]} onPress={openDetail} />
    ),
    [openDetail, typeMap],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await list.refetch();
    setRefreshing(false);
  }, [list]);

  const handleRetry = useCallback(() => {
    if (isSearching) search.refetch();
    if (isFiltering) typeList.refetch();
    if (!isSearching && !isFiltering) list.refetch();
  }, [isSearching, isFiltering, search, typeList, list]);

  const toggleType = useCallback((type: string) => {
    setActiveTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }, []);

  // The visible list composes search and type: with both active, keep the name
  // matches that also belong to one of the selected types; otherwise fall back
  // to whichever single filter is on, then the paginated Pokédex.
  const data = useMemo<PokemonSummary[]>(() => {
    if (isSearching && isFiltering) {
      const inTypes = new Set(typeList.data.map((p) => p.name));
      return search.results.filter((p) => inTypes.has(p.name));
    }
    if (isSearching) return search.results;
    if (isFiltering) return typeList.data;
    return list.data ?? [];
  }, [isSearching, isFiltering, search.results, typeList.data, list.data]);

  const isError =
    (isSearching && search.isError) ||
    (isFiltering && typeList.isError) ||
    (!isSearching && !isFiltering && list.isError);

  const isLoading =
    (isSearching && search.isLoading) ||
    (isFiltering && typeList.isLoading) ||
    (!isSearching && !isFiltering && list.isLoading);
  const showSkeletons = !isError && isLoading;

  const typesLabel = activeTypes.map(formatName).join(' & ');
  const filterIconColor = activeTypes[0] ? typeColor(activeTypes[0]) : undefined;
  const emptyMessage =
    isSearching && isFiltering
      ? `No ${typesLabel} Pokémon match “${query.trim()}”.`
      : isSearching
        ? `Nothing matches “${query.trim()}”. Try a different name or number.`
        : 'No Pokémon have all of the selected types.';

  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader>
        <Text className="w-64 text-[26px] font-bold leading-9 text-white">
          Who are you{'\n'}looking for?
        </Text>
        <Searchbar
          value={query}
          onChangeText={setQuery}
          placeholder="e.g. Pikachu or 25"
          accessibilityLabel="Search Pokémon by name or number"
          mode="bar"
          elevation={0}
          traileringIcon="tune-variant"
          onTraileringIconPress={() => setFilterOpen(true)}
          traileringIconColor={filterIconColor}
          traileringIconAccessibilityLabel="Filter Pokémon by type"
          style={{
            marginTop: 16,
            borderRadius: 28,
            backgroundColor: colors.surface,
          }}
          inputStyle={{ fontSize: 14 }}
        />

        {isFiltering ? (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {activeTypes.map((type) => (
              <Pressable
                key={type}
                onPress={() => toggleType(type)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${formatName(type)} filter`}
                className="flex-row items-center gap-1 rounded-full py-1 pl-3 pr-2"
                style={{ backgroundColor: typeColor(type) }}
              >
                <Text
                  className="text-[12px] font-semibold"
                  style={{ color: textColorOn(typeColor(type)) }}
                >
                  {formatName(type)}
                </Text>
                <MaterialCommunityIcons
                  name="close"
                  size={15}
                  color={textColorOn(typeColor(type))}
                />
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScreenHeader>

      {isError ? (
        <ErrorState
          message={
            isSearching
              ? 'The Pokémon index could not be loaded.'
              : isFiltering
                ? 'These types could not be loaded. Check your connection and try again.'
                : 'The Pokédex could not be loaded. Check your connection and try again.'
          }
          onRetry={handleRetry}
        />
      ) : showSkeletons ? (
        <View className="flex-row flex-wrap justify-between px-4 pt-4">
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.name}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
          onEndReached={() => {
            if (!isSearching && !isFiltering && list.hasNextPage && !list.isFetchingNextPage) {
              list.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          refreshing={refreshing}
          onRefresh={isSearching || isFiltering ? undefined : onRefresh}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          ListFooterComponent={
            !isSearching && !isFiltering && list.isFetchingNextPage ? (
              <ActivityIndicator style={{ paddingVertical: 16 }} accessibilityLabel="Loading more Pokémon" />
            ) : null
          }
          ListEmptyComponent={
            isSearching || isFiltering ? (
              <View className="items-center px-8 pt-16">
                <Text className="text-base font-semibold text-ink">No Pokémon found</Text>
                <Text className="mt-1 text-center text-sm text-ink-muted">{emptyMessage}</Text>
              </View>
            ) : null
          }
        />
      )}

      <TypeFilterSheet
        visible={filterOpen}
        activeTypes={activeTypes}
        onToggle={toggleType}
        onClear={() => setActiveTypes([])}
        onDismiss={() => setFilterOpen(false)}
      />
    </View>
  );
}
