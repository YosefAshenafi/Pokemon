interface NetInfoLikeState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

type NetworkGlobal = {
  __netInfoListeners?: Set<(state: NetInfoLikeState) => void>;
  __netInfoState?: NetInfoLikeState;
};

const ONLINE: NetInfoLikeState = { isConnected: true, isInternetReachable: true };

export function netInfoListeners(): Set<(state: NetInfoLikeState) => void> {
  const scope = globalThis as NetworkGlobal;
  scope.__netInfoListeners ??= new Set();
  return scope.__netInfoListeners;
}

export function netInfoState(): NetInfoLikeState {
  return (globalThis as NetworkGlobal).__netInfoState ?? ONLINE;
}

/** Puts the device on or off the network for a test. */
export function setNetworkOffline(offline: boolean): void {
  const state: NetInfoLikeState = offline
    ? { isConnected: false, isInternetReachable: false }
    : ONLINE;
  (globalThis as NetworkGlobal).__netInfoState = state;
  netInfoListeners().forEach((listener) => listener(state));
}

export function resetNetwork(): void {
  const scope = globalThis as NetworkGlobal;
  delete scope.__netInfoState;
  scope.__netInfoListeners?.clear();
}
