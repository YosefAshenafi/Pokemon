import '../global.css';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClientProvider } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { cssInterop } from 'nativewind';
import { useEffect, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import { darkColors, lightColors, paperDarkTheme, paperLightTheme } from '@/theme/paperTheme';

import { CACHE_MIGRATION_KEY, purgeLegacyCacheKeys, queryClient } from '@/api/queryClient';
import { AnimatedSplash } from '@/components/AnimatedSplash';

SplashScreen.preventAutoHideAsync().catch(() => {});

cssInterop(Image, { className: 'style' });
cssInterop(MaterialCommunityIcons, { className: 'style' });

const paperSettings = {
  icon: (props: React.ComponentProps<typeof MaterialCommunityIcons>) => (
    <MaterialCommunityIcons {...props} />
  ),
};

export default function RootLayout() {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const [splashVisible, setSplashVisible] = useState(true);
  const [cacheReady, setCacheReady] = useState(false);

  // One-time migration: earlier builds persisted the whole cache, which could leave
  // the AsyncStorage DB full on Android. multiRemove frees space even when the DB is
  // full, so this is safe to run against a SQLITE_FULL database. The tree below waits
  // for it — a query persisting between the getAllKeys snapshot and the removal would
  // be deleted too, leaving this launch with no cache at all.
  useEffect(() => {
    (async () => {
      try {
        if (!(await AsyncStorage.getItem(CACHE_MIGRATION_KEY))) {
          await purgeLegacyCacheKeys();
          await AsyncStorage.setItem(CACHE_MIGRATION_KEY, '1');
        }
      } catch {
        // Best-effort cleanup; the app works without it.
      } finally {
        setCacheReady(true);
      }
    })();
  }, []);

  // A couple of AsyncStorage round trips, still behind the native splash.
  if (!cacheReady) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={isDark ? paperDarkTheme : paperLightTheme} settings={paperSettings}>
        <StatusBar style={splashVisible && !isDark ? 'dark' : 'light'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
        {splashVisible ? <AnimatedSplash onFinish={() => setSplashVisible(false)} /> : null}
      </PaperProvider>
    </QueryClientProvider>
  );
}
