import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { ActivityIndicator, IconButton } from 'react-native-paper';

import { SCREEN_BOTTOM_PADDING, SCREEN_PADDING } from '@/constants/ui';

import { ErrorState } from './ErrorState';
import { ScreenHeader } from './ScreenHeader';

interface DetailScaffoldProps {
  isLoading: boolean;
  isError: boolean;
  /** Announced while the spinner is up; names what is being loaded. */
  loadingLabel: string;
  errorMessage: string;
  onRetry: () => void;
  children: ReactNode;
}

/**
 * The frame every detail screen shares: brand header with a back control, then
 * one of a spinner, an error with a retry, or the screen's own content in a
 * scroll view.
 *
 * Extracted because the Pokémon and move screens had the same twenty lines,
 * and a third detail screen would have made it three copies. Each screen now
 * contributes only what makes it different.
 */
export function DetailScaffold({
  isLoading,
  isError,
  loadingLabel,
  errorMessage,
  onRetry,
  children,
}: DetailScaffoldProps) {
  const router = useRouter();

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
          <ActivityIndicator size="large" accessibilityLabel={loadingLabel} />
        </View>
      ) : isError ? (
        <ErrorState message={errorMessage} onRetry={onRetry} />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: SCREEN_PADDING,
            paddingBottom: SCREEN_BOTTOM_PADDING,
          }}
        >
          {children}
        </ScrollView>
      )}
    </View>
  );
}
