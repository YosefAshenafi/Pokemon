import type { ReactElement } from 'react';
import { useCallback } from 'react';
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

/**
 * Stable identity for "this card has no types". A fresh `[]` per render would
 * fail `PokemonCard`'s memo comparison and re-render every typeless card.
 */
const NO_TYPES: readonly string[] = [];

/** Two columns, so a card's index maps to its row. */
const COLUMNS = 2;

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
  /** Whether matches were left off the end because the render cap was reached. */
  truncated: boolean;
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
  truncated,
  onRefresh,
  refreshing,
  empty,
}: PokemonGridProps) {
  // Rows grow with the system font size, so the height promised below has to be
  // measured at the current scale rather than assumed at 1x.
  const { fontScale } = useWindowDimensions();
  const rowHeight = gridRowHeight(fontScale);

  const renderItem = useCallback(
    ({ item }: { item: PokemonSummary }) => (
      <PokemonCard
        id={item.id}
        name={item.name}
        // The index arrives in batches, so a missing name means "not loaded yet"
        // only while it is fetching; after that it means "no chips to show",
        // otherwise a failed index would leave placeholders forever.
        types={typesByName?.[item.name] ?? (typesPending ? undefined : NO_TYPES)}
        onPress={onSelect}
        onPressIn={onPrefetch}
        fontScale={fontScale}
      />
    ),
    [onSelect, onPrefetch, typesByName, typesPending, fontScale],
  );

  // Cards are a fixed size at a given font scale, so the list never has to
  // measure a row: this is what keeps a fast fling from leaving blank cells.
  // It is only sound because the card renders from the same `CARD_METRICS`.
  //
  // `index` is a ROW index, not an item index. With `numColumns` above 1,
  // FlatList reports `ceil(items / numColumns)` to VirtualizedList and hands it
  // an array per row, but passes `getItemLayout` straight through - so dividing
  // by the column count here would report half the real offset and overlap
  // every row.
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
      // iOS does not resize the window for the keyboard the way Android's
      // adjustResize does, so without this the last rows sit under it.
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      // Detaching off-screen rows from the native view tree is a clear win on
      // Android's view system and has a history of clipping bugs on iOS, where
      // the gain is smaller anyway.
      removeClippedSubviews={Platform.OS === 'android'}
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
          // Without this the last row reads as the last match, which it isn't.
          <Text className="px-6 pt-2 text-center text-xs text-ink-muted">
            {`Showing the first ${SEARCH_RESULT_LIMIT} matches. Refine your search to narrow them down.`}
          </Text>
        ) : null
      }
      ListEmptyComponent={empty}
    />
  );
}
