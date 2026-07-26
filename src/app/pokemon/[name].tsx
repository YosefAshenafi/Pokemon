import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button } from 'react-native-paper';

import { Artwork } from '@/components/Artwork';
import { DetailScaffold } from '@/components/DetailScaffold';
import { StatBar } from '@/components/StatBar';
import { TypeChip } from '@/components/TypeChip';
import { MOVES_PREVIEW_COUNT } from '@/constants/ui';
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

function MoveChip({ name, onPress }: { name: string; onPress: () => void }) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={`${formatName(name)} move`}
      accessibilityHint="Opens move details"
      className="flex-row items-center rounded-full bg-accent-soft py-1 pl-3 pr-1.5"
      style={{ opacity: pressed ? 0.6 : 1 }}
    >
      <Text className="text-xs font-semibold text-accent">{formatName(name)}</Text>
      <MaterialCommunityIcons name="chevron-right" size={14} className="text-accent" />
    </Pressable>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-4 rounded-2xl border border-line bg-surface p-4">
      <Text accessibilityRole="header" className="mb-2 text-sm font-bold text-ink">
        {title}
      </Text>
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
    <DetailScaffold
      isLoading={isLoading}
      isError={isError || !data}
      loadingLabel="Loading Pokémon details"
      errorMessage={`Details for “${formatName(name ?? '')}” could not be loaded.`}
      onRetry={() => refetch()}
    >
      {data ? (
        <>
          <View className="mt-5 flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text
                className="text-xs font-semibold text-ink-subtle"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatPokemonId(data.id)}
              </Text>
              <Text
                accessibilityRole="header"
                className="mt-0.5 text-[28px] font-bold leading-9 text-ink"
              >
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
            style={{ marginTop: 8, height: 224, width: '100%' }}
            placeholderSize={120}
          />

          <SectionCard title="Base Stats">
            {data.stats.map(({ stat, base_stat }) => (
              <StatBar
                key={stat.name}
                stat={stat.name}
                label={formatStatName(stat.name)}
                value={base_stat}
              />
            ))}
          </SectionCard>

          <SectionCard title="Breeding">
            <View className="flex-row gap-3">
              <View className="flex-1 rounded-xl bg-bg px-4 py-3">
                <Text className="text-xs text-ink-muted">Height</Text>
                <Text className="mt-1 text-sm font-semibold text-ink">
                  {formatHeightFeetInches(data.height)} · {formatHeightMeters(data.height)}
                </Text>
              </View>
              <View className="flex-1 rounded-xl bg-bg px-4 py-3">
                <Text className="text-xs text-ink-muted">Weight</Text>
                <Text className="mt-1 text-sm font-semibold text-ink">
                  {formatWeightLbs(data.weight)} · {formatWeightKg(data.weight)}
                </Text>
              </View>
            </View>
          </SectionCard>

          <SectionCard title={`Moves (${moves.length})`}>
            <View className="flex-row flex-wrap gap-1.5">
              {visibleMoves.map(({ move }) => (
                <MoveChip
                  key={move.name}
                  name={move.name}
                  onPress={() =>
                    router.push({ pathname: '/move/[name]', params: { name: move.name } })
                  }
                />
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
        </>
      ) : null}
    </DetailScaffold>
  );
}
