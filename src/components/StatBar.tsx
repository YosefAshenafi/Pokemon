import { Text, View } from 'react-native';

import { statColor } from '@/theme/typeColors';

interface StatBarProps {
  label: string;
  value: number;
  /** Scale ceiling for the bar; 160 covers all but a handful of legendaries. */
  max?: number;
}

const DEFAULT_MAX = 160;

/** Horizontal base-stat bar, colored by how strong the stat is. */
export function StatBar({ label, value, max = DEFAULT_MAX }: StatBarProps) {
  const percent = Math.min(value / max, 1) * 100;

  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} className="flex-row items-center gap-3 py-1.5">
      <Text className="w-14 text-xs text-ink-muted">{label}</Text>
      <Text
        className="w-8 text-right text-xs font-semibold text-ink"
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
      <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-track">
        <View
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: statColor(value) }}
        />
      </View>
    </View>
  );
}
