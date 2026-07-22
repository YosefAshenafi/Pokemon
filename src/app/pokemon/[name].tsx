import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ActivityIndicator, Button, IconButton } from 'react-native-paper';

import { Artwork } from '@/components/Artwork';
import { ErrorState } from '@/components/ErrorState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatBar } from '@/components/StatBar';
import { TypeChip } from '@/components/TypeChip';
import { usePokemon } from '@/hooks/usePokemon';
import {
  formatHeightFeetInches,
  formatHeightMeters,
  formatName,
  formatPokemonId,
  formatStatName,
  formatWeightKg,
  formatWeightLbs,
} from '@/utils/format';

const MOVES_PREVIEW_COUNT = 8;

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-4 rounded-2xl border border-line bg-surface p-4">
      <Text className="mb-2 text-sm font-bold text-ink">{title}</Text>
      {children}
    </View>
  );
}

export default function DetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = usePokemon(name ?? '');
  const [showAllMoves, setShowAllMoves] = useState(false);

  const moves = data?.moves ?? [];
  const visibleMoves = showAllMoves ? moves : moves.slice(0, MOVES_PREVIEW_COUNT);

  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader>
        <IconButton
          icon="arrow-left"
          iconColor="#FFFFFF"
          size={26}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          style={{ marginLeft: -8, marginBottom: -4 }}
        />
      </ScreenHeader>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" accessibilityLabel="Loading Pokémon details" />
        </View>
      ) : isError || !data ? (
        <ErrorState
          message={`Details for “${formatName(name ?? '')}” could not be loaded.`}
          onRetry={() => refetch()}
        />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        >
          <View className="mt-5 flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text
                className="text-xs font-semibold text-ink-subtle"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatPokemonId(data.id)}
              </Text>
              <Text className="mt-0.5 text-[28px] font-bold leading-9 text-ink">
                {formatName(data.name)}
              </Text>
            </View>
            <View className="mt-1 flex-row gap-2">
              {data.types.map(({ type }) => (
                <TypeChip key={type.name} type={type.name} size="md" />
              ))}
            </View>
          </View>

          <Artwork
            id={data.id}
            pokemon={data}
            alt={formatName(data.name)}
            className="mt-2 h-56 w-full"
            placeholderSize={120}
          />

          <SectionCard title="Base Stats">
            {data.stats.map(({ stat, base_stat }) => (
              <StatBar key={stat.name} label={formatStatName(stat.name)} value={base_stat} />
            ))}
          </SectionCard>

          <SectionCard title="Breeding">
            <View className="flex-row gap-3">
              <View className="flex-1 rounded-xl bg-bg px-4 py-3">
                <Text className="text-xs text-ink-muted">Height</Text>
                <Text className="mt-1 text-sm font-semibold text-ink">
                  {formatHeightMeters(data.height)} · {formatHeightFeetInches(data.height)}
                </Text>
              </View>
              <View className="flex-1 rounded-xl bg-bg px-4 py-3">
                <Text className="text-xs text-ink-muted">Weight</Text>
                <Text className="mt-1 text-sm font-semibold text-ink">
                  {formatWeightKg(data.weight)} · {formatWeightLbs(data.weight)}
                </Text>
              </View>
            </View>
          </SectionCard>

          <SectionCard title={`Moves (${moves.length})`}>
            <View className="flex-row flex-wrap gap-1.5">
              {visibleMoves.map(({ move }) => (
                <Pressable
                  key={move.name}
                  onPress={() =>
                    router.push({ pathname: '/move/[name]', params: { name: move.name } })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${formatName(move.name)} move`}
                  accessibilityHint="Opens move details"
                  className="flex-row items-center rounded-full bg-accent-soft py-1 pl-3 pr-1.5"
                  style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
                >
                  <Text className="text-xs font-semibold text-accent">
                    {formatName(move.name)}
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={14} className="text-accent" />
                </Pressable>
              ))}
            </View>
            {moves.length > MOVES_PREVIEW_COUNT ? (
              <Button
                mode="text"
                compact
                icon={showAllMoves ? 'chevron-up' : 'chevron-down'}
                onPress={() => setShowAllMoves((current) => !current)}
                style={{ alignSelf: 'flex-start', marginTop: 8 }}
              >
                {showAllMoves ? 'Show less' : 'See all'}
              </Button>
            ) : null}
          </SectionCard>
        </ScrollView>
      )}
    </View>
  );
}
