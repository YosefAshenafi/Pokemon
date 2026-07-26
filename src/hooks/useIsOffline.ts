import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/** Whether the device currently has no usable connection. */
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
