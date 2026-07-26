import { Text, View } from 'react-native';
import { Button } from 'react-native-paper';

import { useIsOffline } from '@/hooks/useIsOffline';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/** Full-area error fallback with a retry action. */
export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  const offline = useIsOffline();

  return (
    <View className="flex-1 items-center justify-center gap-2 px-10 py-16">
      <Text className="text-base font-semibold text-ink">
        {offline ? 'No connection' : 'Something went wrong'}
      </Text>
      <Text className="text-center text-sm leading-5 text-ink-muted">
        {offline ? 'Reconnect to load this. Anything already saved still works.' : message}
      </Text>
      {onRetry && !offline ? (
        <Button mode="contained" onPress={onRetry} style={{ marginTop: 8 }}>
          Try again
        </Button>
      ) : null}
    </View>
  );
}
