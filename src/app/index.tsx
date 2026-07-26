import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import type { PokemonType } from '@/api/types';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PokemonGrid } from '@/components/PokemonGrid';
import { SearchHeader } from '@/components/SearchHeader';
import { SkeletonGrid } from '@/components/SkeletonGrid';
import { TypeFilterSheet } from '@/components/TypeFilterSheet';
import { usePokedexBrowser } from '@/hooks/usePokedexBrowser';
import { formatName } from '@/utils/format';

export default function ListScreen() {
  const router = useRouter();
  const dex = usePokedexBrowser();
  const [filterOpen, setFilterOpen] = useState(false);

  const openDetail = useCallback(
    (name: string) => router.push({ pathname: '/pokemon/[name]', params: { name } }),
    [router],
  );

  return (
    <View className="flex-1 bg-bg">
      <SearchHeader
        query={dex.query}
        onQueryChange={dex.setQuery}
        onQueryFocus={dex.prefetchSearchIndex}
        activeTypes={dex.activeTypes}
        onRemoveType={dex.toggleType}
        onOpenFilters={() => setFilterOpen(true)}
      />

      {dex.isError ? (
        <ErrorState message={errorMessage(dex.isSearching, dex.isFiltering)} onRetry={dex.retry} />
      ) : dex.isLoading ? (
        <SkeletonGrid />
      ) : (
        <PokemonGrid
          data={dex.data}
          typesByName={dex.typesByName}
          typesPending={dex.typesPending}
          onSelect={openDetail}
          onPrefetch={dex.prefetchDetail}
          onEndReached={dex.loadMore}
          loadingMore={dex.isLoadingMore}
          truncated={dex.isTruncated}
          refreshing={dex.refreshing}
          onRefresh={dex.isPaginated ? dex.refresh : undefined}
          requestKey={`${dex.searchTerm}\u0000${dex.activeTypes.join(',')}`}
          empty={
            dex.isPaginated ? null : (
              <EmptyState
                title="No Pokémon found"
                message={emptyMessage(dex.searchTerm, dex.activeTypes)}
              />
            )
          }
        />
      )}

      <TypeFilterSheet
        visible={filterOpen}
        activeTypes={dex.activeTypes}
        onToggle={dex.toggleType}
        onClear={dex.clearTypes}
        onDismiss={() => setFilterOpen(false)}
      />
    </View>
  );
}

/** Names the thing that failed, so a retry is an informed choice. */
function errorMessage(isSearching: boolean, isFiltering: boolean): string {
  if (isSearching) return 'The Pokémon index could not be loaded.';
  if (isFiltering) return 'These types could not be loaded. Check your connection and try again.';
  return 'The Pokédex could not be loaded. Check your connection and try again.';
}

/** Echoes what was actually searched or filtered for, rather than "no results". */
function emptyMessage(query: string, activeTypes: PokemonType[]): string {
  const term = query.trim();
  const typesLabel = activeTypes.map(formatName).join(' & ');

  if (term && typesLabel) return `No ${typesLabel} Pokémon match “${term}”.`;
  if (term) return `Nothing matches “${term}”. Try a different name or number.`;
  return 'No Pokémon have all of the selected types.';
}
