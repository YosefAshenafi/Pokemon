import '../global.css';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { cssInterop } from 'nativewind';
import { PaperProvider } from 'react-native-paper';

import { colors, paperTheme } from '@/theme/paperTheme';

// NativeWind only auto-maps className on core RN components; third-party
// components must be registered explicitly.
cssInterop(Image, { className: 'style' });

// Paper resolves icons from react-native-vector-icons, which isn't installed.
// Point it at Expo's bundled MaterialCommunityIcons instead.
const paperSettings = {
  icon: (props: React.ComponentProps<typeof MaterialCommunityIcons>) => (
    <MaterialCommunityIcons {...props} />
  ),
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={paperTheme} settings={paperSettings}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
      </PaperProvider>
    </QueryClientProvider>
  );
}
