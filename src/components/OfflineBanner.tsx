import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsOffline } from '@/hooks/useIsOffline';

/** A standing notice that the device has no connection. */
export function OfflineBanner() {
  const offline = useIsOffline();
  const insets = useSafeAreaInsets();

  if (!offline) return null;

  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className="flex-row items-center justify-center gap-2 bg-ink px-4 pt-2.5"
      style={{ paddingBottom: insets.bottom + 10 }}
    >
      <MaterialCommunityIcons name="wifi-off" size={15} color="#FFFFFF" />
      <Text className="text-xs font-semibold text-white">
        You’re offline. Showing what was saved.
      </Text>
    </View>
  );
}
