import { Text, View } from 'react-native';
import { Button } from 'react-native-paper';

import { useIsOffline } from '@/hooks/useIsOffline';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Friendly full-area error fallback with a retry action.
 *
 * Reads the connection itself rather than taking it as a prop: being offline is
 * a device-wide condition like the colour scheme, and threading it through
 * every screen that can fail would put the same boolean in four signatures.
 */
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
      {/*
        No retry while offline: the request cannot succeed, so the button would
        spend REQUEST_TIMEOUT_MS failing and teach the user it does nothing. The
        banner disappears the moment the connection returns, and the retry with
        it.
      */}
      {onRetry && !offline ? (
        <Button mode="contained" onPress={onRetry} style={{ marginTop: 8 }}>
          Try again
        </Button>
      ) : null}
    </View>
  );
}
