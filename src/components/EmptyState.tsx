import { Text, View } from 'react-native';

interface EmptyStateProps {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <View className="items-center px-8 pt-16">
      <Text className="text-base font-semibold text-ink">{title}</Text>
      <Text className="mt-1 text-center text-sm text-ink-muted">{message}</Text>
    </View>
  );
}
