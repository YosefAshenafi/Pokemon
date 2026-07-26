import '../global.css';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClientProvider } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { cssInterop } from 'nativewind';
import { useEffect, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import { darkColors, lightColors, paperDarkTheme, paperLightTheme } from '@/theme/paperTheme';

import { purgeLegacyCacheKeys, queryClient } from '@/api/queryClient';
import { reportError } from '@/api/reportError';
import { AnimatedSplash } from '@/components/AnimatedSplash';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { CACHE_MIGRATION_KEY } from '@/constants/cache';

SplashScreen.preventAutoHideAsync().catch(() => {});

cssInterop(Image, { className: 'style' });
cssInterop(MaterialCommunityIcons, { className: 'style' });

const paperSettings = {
  icon: (props: React.ComponentProps<typeof MaterialCommunityIcons>) => (
    <MaterialCommunityIcons {...props} />
  ),
};

/** Mounted by Expo Router in place of the tree when a render throws. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;

  useEffect(() => {
    reportError(error, { boundary: 'root' });
  }, [error]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ErrorState
        message="This screen could not be shown. Please try again."
        onRetry={() => {
          retry();
        }}
      />
    </View>
  );
}

export default function RootLayout() {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const [splashVisible, setSplashVisible] = useState(true);
  const [cacheReady, setCacheReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!(await AsyncStorage.getItem(CACHE_MIGRATION_KEY))) {
          await purgeLegacyCacheKeys();
          await AsyncStorage.setItem(CACHE_MIGRATION_KEY, '1');
        }
      } catch {
      } finally {
        setCacheReady(true);
      }
    })();
  }, []);

  if (!cacheReady) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={isDark ? paperDarkTheme : paperLightTheme} settings={paperSettings}>
        <StatusBar style={splashVisible && !isDark ? 'dark' : 'light'} />
        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          />
          <OfflineBanner />
        </View>
        {splashVisible ? <AnimatedSplash onFinish={() => setSplashVisible(false)} /> : null}
      </PaperProvider>
    </QueryClientProvider>
  );
}
