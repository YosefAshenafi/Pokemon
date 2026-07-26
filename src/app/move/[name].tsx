import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { DetailScaffold } from '@/components/DetailScaffold';
import { TypeChip } from '@/components/TypeChip';
import { useMove } from '@/hooks/useMove';
import { formatEffectText, formatName } from '@/utils/format';

function FactBox({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-xl bg-bg px-4 py-3">
      <Text className="text-xs text-ink-muted">{label}</Text>
      <Text
        className="mt-1 text-sm font-semibold text-ink"
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function MoveScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { data, isLoading, isError, refetch } = useMove(name ?? '');

  const effectEntry =
    data?.effect_entries.find((entry) => entry.language.name === 'en') ??
    data?.effect_entries[0];

  return (
    <DetailScaffold
      isLoading={isLoading}
      isError={isError || !data}
      loadingLabel="Loading move details"
      errorMessage={`Details for “${formatName(name ?? '')}” could not be loaded.`}
      onRetry={() => refetch()}
    >
      {data ? (
        <>
          <View className="mt-5 flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-xs font-semibold text-ink-subtle">Move</Text>
              <Text
                accessibilityRole="header"
                className="mt-0.5 text-[28px] font-bold leading-9 text-ink"
              >
                {formatName(data.name)}
              </Text>
            </View>
            <View className="mt-1 items-end gap-2">
              <TypeChip type={data.type.name} size="md" />
              {data.damage_class ? (
                <View className="rounded-full bg-track px-3.5 py-1.5">
                  <Text className="text-xs font-semibold text-ink-muted">
                    {formatName(data.damage_class.name)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View className="mt-5 flex-row gap-3">
            <FactBox label="Power" value={data.power !== null ? String(data.power) : '—'} />
            <FactBox
              label="Accuracy"
              value={data.accuracy !== null ? `${data.accuracy}%` : '—'}
            />
            <FactBox label="PP" value={data.pp !== null ? String(data.pp) : '—'} />
          </View>

          {effectEntry ? (
            <View className="mt-4 rounded-2xl border border-line bg-surface p-4">
              <Text accessibilityRole="header" className="mb-2 text-sm font-bold text-ink">
                Effect
              </Text>
              <Text className="text-sm leading-5 text-ink-muted">
                {formatEffectText(effectEntry.short_effect, data.effect_chance)}
              </Text>
            </View>
          ) : null}
        </>
      ) : null}
    </DetailScaffold>
  );
}
