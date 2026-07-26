import { Text, View } from 'react-native';

import { STAT_BAR_MAX } from '@/constants/ui';
import { statColor } from '@/theme/typeColors';

interface StatBarProps {
  stat: string;
  label: string;
  value: number;
  max?: number;
}

export function StatBar({ stat, label, value, max = STAT_BAR_MAX }: StatBarProps) {
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
          testID="stat-bar-fill"
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: statColor(stat) }}
        />
      </View>
    </View>
  );
}
