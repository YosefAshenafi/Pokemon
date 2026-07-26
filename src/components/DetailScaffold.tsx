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
  loadingLabel: string;
  errorMessage: string;
  onRetry: () => void;
  children: ReactNode;
}

/** The frame every detail screen shares: header, then loading, error or content. */
export function DetailScaffold({
  isLoading,
  isError,
  loadingLabel,
  errorMessage,
  onRetry,
  children,
}: DetailScaffoldProps) {
  const router = useRouter();

  // A deep link (or a reload while on this screen) makes the detail the whole
  // stack; with nothing to pop, back falls through to the Pokédex.
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader>
        <IconButton
          icon="arrow-left"
          iconColor="#FFFFFF"
          size={26}
          onPress={goBack}
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
