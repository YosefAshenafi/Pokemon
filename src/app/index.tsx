import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { ActivityIndicator, Searchbar } from 'react-native-paper';

import type { PokemonSummary } from '@/api/types';
import { ErrorState } from '@/components/ErrorState';
import { PokemonCard } from '@/components/PokemonCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SkeletonCard } from '@/components/SkeletonCard';
import { usePokemonList } from '@/hooks/usePokemonList';
import { usePokemonSearch } from '@/hooks/usePokemonSearch';

const SKELETON_COUNT = 8;

export default function ListScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const isSearching = query.trim().length > 0;

  const list = usePokemonList();
  const search = usePokemonSearch(query);

  const openDetail = useCallback(
    (name: string) => router.push({ pathname: '/pokemon/[name]', params: { name } }),
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: PokemonSummary }) => (
      <PokemonCard id={item.id} name={item.name} onPress={() => openDetail(item.name)} />
    ),
    [openDetail],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await list.refetch();
    setRefreshing(false);
  }, [list]);

  const data = isSearching ? search.results : (list.data ?? []);
  const isError = isSearching ? search.isError : list.isError;
  const retry = isSearching ? search.refetch : list.refetch;
  const showSkeletons = !isError && (isSearching ? search.isLoading : list.isLoading);

  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader>
        <Text className="w-64 text-[26px] font-bold leading-9 text-white">
          Who are you{'\n'}looking for?
        </Text>
        <Searchbar
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, e.g. Pikachu"
          accessibilityLabel="Search Pokémon by name"
          mode="bar"
          elevation={0}
          style={{ marginTop: 16, borderRadius: 28, backgroundColor: '#FFFFFF' }}
          inputStyle={{ fontSize: 14 }}
        />
      </ScreenHeader>

      {isError ? (
        <ErrorState
          message={
            isSearching
              ? 'The Pokémon index could not be loaded.'
              : 'The Pokédex could not be loaded. Check your connection and try again.'
          }
          onRetry={() => retry()}
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
            if (!isSearching && list.hasNextPage && !list.isFetchingNextPage) {
              list.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          refreshing={refreshing}
          onRefresh={isSearching ? undefined : onRefresh}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          ListFooterComponent={
            !isSearching && list.isFetchingNextPage ? (
              <ActivityIndicator style={{ paddingVertical: 16 }} accessibilityLabel="Loading more Pokémon" />
            ) : null
          }
          ListEmptyComponent={
            isSearching ? (
              <View className="items-center px-8 pt-16">
                <Text className="text-base font-semibold text-ink">No Pokémon found</Text>
                <Text className="mt-1 text-center text-sm text-ink-muted">
                  Nothing matches “{query.trim()}”. Try a different name.
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
