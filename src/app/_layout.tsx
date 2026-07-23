import '../global.css';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { experimental_createQueryPersister } from '@tanstack/query-persist-client-core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { cssInterop } from 'nativewind';
import { useEffect, useState } from 'react';
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

// Bump the suffix if the persisted-cache shape changes and old rows must be purged.
const CACHE_MIGRATION_KEY = 'cache-migrated-v2';

// Per-query persistence: each query is stored under its own AsyncStorage key
// (`tanstack-query-<hash>`) instead of one giant blob, which avoids Android's ~2 MB
// SQLite CursorWindow per-row limit.
//
// `filters` restricts persistence to the small, bounded queries — the list and type
// results hold only `{ id, name }` summaries and the search index is a few KB, so the
// whole persisted footprint stays tiny. Full Pokémon detail (`['pokemon','detail',*]`)
// is deliberately NOT persisted: the list fetches one ~200 KB detail per card for its
// type chips, so persisting them would write megabytes to disk while scrolling and blow
// past Android's ~6 MB total AsyncStorage limit (SQLITE_FULL). Detail screens still open
// from the in-memory cache within a session and simply refetch after a cold start.
const persister = experimental_createQueryPersister({
  storage: AsyncStorage,
  maxAge: CACHE_MAX_AGE,
  buster: 'v1',
  filters: {
    predicate: (query) =>
      !(query.queryKey[0] === 'pokemon' && query.queryKey[1] === 'detail'),
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: CACHE_MAX_AGE,
      retry: 2,
      persister: persister.persisterFn,
    },
  },
});

export default function RootLayout() {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const [splashVisible, setSplashVisible] = useState(true);

  // One-time migration: earlier builds persisted the whole cache (and, briefly, every
  // Pokémon detail), which could leave the AsyncStorage DB full on Android. Clear the
  // legacy blob and any previously persisted query rows once so the new bounded cache
  // starts from a clean slate. Reads/getAllKeys don't write, and multiRemove frees space
  // even when the DB is full, so this is safe to run against a SQLITE_FULL database.
  useEffect(() => {
    (async () => {
      try {
        if (await AsyncStorage.getItem(CACHE_MIGRATION_KEY)) return;
        const keys = await AsyncStorage.getAllKeys();
        const stale = keys.filter(
          (k) => k === 'pokedex-query-cache' || k.startsWith('tanstack-query'),
        );
        if (stale.length) await AsyncStorage.multiRemove(stale);
        await AsyncStorage.setItem(CACHE_MIGRATION_KEY, '1');
      } catch {
        // Best-effort cleanup; the app works without it.
      }
    })();
  }, []);

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
