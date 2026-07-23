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
import { useColorScheme, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import { darkColors, lightColors, paperDarkTheme, paperLightTheme } from '@/theme/paperTheme';

import { isPersistedQueryKey } from '@/api/queryKeys';
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
// `filters` applies the allowlist in `isPersistedQueryKey`: only the paginated list,
// the name index, the per-type rosters and the type index are written, all of which
// hold small `{ id, name }`-shaped data. Everything else stays in memory — Pokémon
// detail is ~200 KB apiece and a single popular move lists 700+ learners, so browsing
// enough of either would blow past Android's ~6 MB total AsyncStorage budget
// (SQLITE_FULL). Those screens still open from the in-memory cache within a session
// and simply refetch after a cold start.
const persister = experimental_createQueryPersister({
  storage: AsyncStorage,
  maxAge: CACHE_MAX_AGE,
  buster: 'v1',
  filters: { predicate: (query) => isPersistedQueryKey(query.queryKey) },
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
  const [cacheReady, setCacheReady] = useState(false);

  // One-time migration: earlier builds persisted the whole cache (and, briefly, every
  // Pokémon detail), which could leave the AsyncStorage DB full on Android. Clear the
  // legacy blob and any previously persisted query rows once so the new bounded cache
  // starts from a clean slate. Reads/getAllKeys don't write, and multiRemove frees space
  // even when the DB is full, so this is safe to run against a SQLITE_FULL database.
  //
  // The tree below is held back until this finishes: the removal is keyed off a
  // getAllKeys snapshot, so a query persisting in between would be deleted along with
  // the legacy rows and this launch would start with no cache at all.
  useEffect(() => {
    (async () => {
      try {
        if (!(await AsyncStorage.getItem(CACHE_MIGRATION_KEY))) {
          const keys = await AsyncStorage.getAllKeys();
          const stale = keys.filter(
            (k) => k === 'pokedex-query-cache' || k.startsWith('tanstack-query'),
          );
          if (stale.length) await AsyncStorage.multiRemove(stale);
          await AsyncStorage.setItem(CACHE_MIGRATION_KEY, '1');
        }
      } catch {
        // Best-effort cleanup; the app works without it.
      } finally {
        setCacheReady(true);
      }
    })();
  }, []);

  // A couple of AsyncStorage round trips, still behind the native splash screen.
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
