import '../global.css';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { cssInterop } from 'nativewind';
import { useState } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import { darkColors, lightColors, paperDarkTheme, paperLightTheme } from '@/theme/paperTheme';

import { AnimatedSplash } from '@/components/AnimatedSplash';

SplashScreen.preventAutoHideAsync().catch(() => {});

cssInterop(Image, { className: 'style' });
cssInterop(MaterialCommunityIcons, { className: 'style' });

const paperSettings = {
  icon: (props: React.ComponentProps<typeof MaterialCommunityIcons>) => (
    <MaterialCommunityIcons {...props} />
  ),
};

const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: CACHE_MAX_AGE,
      retry: 2,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'pokedex-query-cache',
  throttleTime: 2000,
});

export default function RootLayout() {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const [splashVisible, setSplashVisible] = useState(true);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: CACHE_MAX_AGE, buster: 'v1' }}
    >
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
    </PersistQueryClientProvider>
  );
}
