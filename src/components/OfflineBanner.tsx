import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsOffline } from '@/hooks/useIsOffline';

/**
 * A standing notice that the device has no connection.
 *
 * Rendered in the normal flow at the bottom of the root layout rather than
 * floating over it, so it shortens the screen instead of covering the last row
 * of whatever is behind it. Not dismissable: it describes a condition, not an
 * event, and it disappears by itself when the condition does.
 */
export function OfflineBanner() {
  const offline = useIsOffline();
  const insets = useSafeAreaInsets();

  if (!offline) return null;

  return (
    <View
      // One accessibility node, announced when it appears: a screen-reader user
      // gets told the connection dropped rather than having to find the bar.
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
