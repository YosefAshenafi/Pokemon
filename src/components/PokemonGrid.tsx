import type { ReactElement } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { FlatList, Platform, Text, useWindowDimensions } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import type { PokemonTypeIndex } from '@/api/pokeapi';
import type { PokemonSummary } from '@/api/types';
import { SEARCH_RESULT_LIMIT } from '@/constants/api';
import {
  GRID_BOTTOM_PADDING,
  LIST_BATCH_SIZE,
  LIST_END_REACHED_THRESHOLD,
  LIST_INITIAL_RENDER,
  LIST_WINDOW_SIZE,
  SCREEN_PADDING,
  gridRowHeight,
} from '@/constants/ui';

import { PokemonCard } from './PokemonCard';

const NO_TYPES: readonly string[] = [];

const COLUMNS = 2;

interface PokemonGridProps {
  data: PokemonSummary[];
  typesByName: PokemonTypeIndex | undefined;
  typesPending: boolean;
  onSelect: (name: string) => void;
  onPrefetch: (name: string) => void;
  onEndReached: () => void;
  loadingMore: boolean;
  truncated: boolean;
  onRefresh?: () => void;
  refreshing: boolean;
  empty: ReactElement | null;
  requestKey: string;
}

/** The two-column Pokédex grid: paging, pull-to-refresh and windowing. */
export function PokemonGrid({
  data,
  typesByName,
  typesPending,
  onSelect,
  onPrefetch,
  onEndReached,
  loadingMore,
  truncated,
  onRefresh,
  refreshing,
  empty,
  requestKey,
}: PokemonGridProps) {
  const { fontScale } = useWindowDimensions();
  const rowHeight = gridRowHeight(fontScale);

  const listRef = useRef<FlatList<PokemonSummary>>(null);
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [requestKey]);

  const renderItem = useCallback(
    ({ item }: { item: PokemonSummary }) => (
      <PokemonCard
        id={item.id}
        name={item.name}
        types={typesByName?.[item.name] ?? (typesPending ? undefined : NO_TYPES)}
        onPress={onSelect}
        onPressIn={onPrefetch}
        fontScale={fontScale}
      />
    ),
    [onSelect, onPrefetch, typesByName, typesPending, fontScale],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<PokemonSummary> | null | undefined, index: number) => ({
      length: rowHeight,
      offset: index * rowHeight,
      index,
    }),
    [rowHeight],
  );

  return (
    <FlatList
      ref={listRef}
      testID="pokemon-grid"
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.name}
      numColumns={COLUMNS}
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
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      initialNumToRender={LIST_INITIAL_RENDER}
      maxToRenderPerBatch={LIST_BATCH_SIZE}
      windowSize={LIST_WINDOW_SIZE}
      getItemLayout={getItemLayout}
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator
            style={{ paddingVertical: SCREEN_PADDING }}
            accessibilityLabel="Loading more Pokémon"
          />
        ) : truncated ? (
          <Text className="px-6 pt-2 text-center text-xs text-ink-muted">
            {`Showing the first ${SEARCH_RESULT_LIMIT} matches. Refine your search to narrow them down.`}
          </Text>
        ) : null
      }
      ListEmptyComponent={empty}
    />
  );
}
