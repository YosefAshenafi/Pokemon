import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

/** A titled panel for the detail screens: header, hairline rule, then content. */
export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mt-4 rounded-2xl border border-line bg-surface p-4">
      <Text accessibilityRole="header" className="text-sm font-bold text-ink">
        {title}
      </Text>
      <View className="mb-3 mt-2.5 h-px bg-line" />
      {children}
    </View>
  );
}
