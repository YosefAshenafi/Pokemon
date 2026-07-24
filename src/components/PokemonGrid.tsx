import type { ReactElement } from 'react';
import { useCallback } from 'react';
import { FlatList } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import type { PokemonTypeIndex } from '@/api/pokeapi';
import type { PokemonSummary } from '@/api/types';
import {
  GRID_BOTTOM_PADDING,
  LIST_BATCH_SIZE,
  LIST_END_REACHED_THRESHOLD,
  LIST_INITIAL_RENDER,
  LIST_WINDOW_SIZE,
  SCREEN_PADDING,
} from '@/constants/ui';

import { PokemonCard } from './PokemonCard';

interface PokemonGridProps {
  data: PokemonSummary[];
  /** `name -> types`; entries arrive in batches as the index builds. */
  typesByName: PokemonTypeIndex | undefined;
  /** Whether more of the type index is still on its way. */
  typesPending: boolean;
  onSelect: (name: string) => void;
  onPrefetch: (name: string) => void;
  onEndReached: () => void;
  loadingMore: boolean;
  /** Omit to disable pull-to-refresh, as search and filter results do. */
  onRefresh?: () => void;
  refreshing: boolean;
  /** Rendered when `data` is empty; `null` while simply browsing. */
  empty: ReactElement | null;
}

/**
 * The two-column Pokédex grid, including its paging, pull-to-refresh and
 * windowing behaviour. Owning the list config here keeps the scroll-performance
 * decisions in one place instead of inline on the screen.
 */
export function PokemonGrid({
  data,
  typesByName,
  typesPending,
  onSelect,
  onPrefetch,
  onEndReached,
  loadingMore,
  onRefresh,
  refreshing,
  empty,
}: PokemonGridProps) {
  const renderItem = useCallback(
    ({ item }: { item: PokemonSummary }) => (
      <PokemonCard
        id={item.id}
        name={item.name}
        // The index arrives in batches, so a missing name means "not loaded yet"
        // only while it is fetching; after that it means "no chips to show",
        // otherwise a failed index would leave placeholders forever.
        types={typesByName?.[item.name] ?? (typesPending ? undefined : [])}
        onPress={onSelect}
        onPressIn={onPrefetch}
      />
    ),
    [onSelect, onPrefetch, typesByName, typesPending],
  );

  return (
    <FlatList
      testID="pokemon-grid"
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.name}
      numColumns={2}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
      contentContainerStyle={{
        paddingHorizontal: SCREEN_PADDING,
        paddingTop: SCREEN_PADDING,
        paddingBottom: GRID_BOTTOM_PADDING,
      }}
      onEndReached={onEndReached}
      onEndReachedThreshold={LIST_END_REACHED_THRESHOLD}
      refreshing={refreshing}
      onRefresh={onRefresh}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      initialNumToRender={LIST_INITIAL_RENDER}
      maxToRenderPerBatch={LIST_BATCH_SIZE}
      windowSize={LIST_WINDOW_SIZE}
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator
            style={{ paddingVertical: SCREEN_PADDING }}
            accessibilityLabel="Loading more Pokémon"
          />
        ) : null
      }
      ListEmptyComponent={empty}
    />
  );
}
