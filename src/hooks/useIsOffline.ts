import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * Whether the device currently has no usable connection.
 *
 * The API client already distinguishes a dropped connection from a server
 * problem - `ApiError.kind` - but that only says why *one request* failed. This
 * is the standing condition, which is what lets the UI say "you are offline"
 * instead of "something went wrong", and stop offering a retry that can only
 * spend fifteen seconds timing out.
 *
 * `isInternetReachable` is `null` until NetInfo has established it. Unknown is
 * treated as online: a spurious "you are offline" on a working connection is
 * worse than a late one on a broken one.
 *
 * Subscribes per component, unlike `useReducedMotion`, which shares one store
 * across its readers. The asymmetry is deliberate: NetInfo already keeps a
 * single native listener and fans out to its JavaScript subscribers, so adding
 * a second layer of the same thing would buy nothing.
 * `AccessibilityInfo.addEventListener` does not - each call reaches the native
 * side - and a skeleton screen mounts eight readers at once.
 */
export function useIsOffline(): boolean {
  const [offline, setOffline] = useState(false);

  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        setOffline(state.isConnected === false || state.isInternetReachable === false);
      }),
    [],
  );

  return offline;
}
