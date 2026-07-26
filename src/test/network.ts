interface NetInfoLikeState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

type NetworkGlobal = {
  __netInfoListeners?: Set<(state: NetInfoLikeState) => void>;
  __netInfoState?: NetInfoLikeState;
};

const ONLINE: NetInfoLikeState = { isConnected: true, isInternetReachable: true };

/** The listeners the NetInfo stub in `jest.setup.ts` fans events out to. */
export function netInfoListeners(): Set<(state: NetInfoLikeState) => void> {
  const scope = globalThis as NetworkGlobal;
  scope.__netInfoListeners ??= new Set();
  return scope.__netInfoListeners;
}

/** The state a newly attached listener is handed, as real NetInfo does. */
export function netInfoState(): NetInfoLikeState {
  return (globalThis as NetworkGlobal).__netInfoState ?? ONLINE;
}

/**
 * Puts the device on or off the network for a test.
 *
 * Connectivity is a native capability with no implementation under Jest, so
 * `jest.setup.ts` swaps the NetInfo module for a stub this drives. Only the
 * radio is faked - `useIsOffline`, the banner and every error state run their
 * real implementations.
 */
export function setNetworkOffline(offline: boolean): void {
  const state: NetInfoLikeState = offline
    ? { isConnected: false, isInternetReachable: false }
    : ONLINE;
  (globalThis as NetworkGlobal).__netInfoState = state;
  netInfoListeners().forEach((listener) => listener(state));
}

/** Restores the connection. Call from `afterEach`. */
export function resetNetwork(): void {
  const scope = globalThis as NetworkGlobal;
  delete scope.__netInfoState;
  scope.__netInfoListeners?.clear();
}
