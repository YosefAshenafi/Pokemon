import { act, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { resetNetwork, setNetworkOffline } from '@/test/network';

import { OfflineBanner } from '../OfflineBanner';

/** A notched phone, so the banner's bottom inset is exercised rather than zero. */
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/** The banner reads the safe area, which the router supplies on a real screen. */
function renderBanner() {
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <OfflineBanner />
    </SafeAreaProvider>,
  );
}

/**
 * The banner's icon loads its font asynchronously and sets state when it lands,
 * so every connection change is awaited - otherwise that update arrives after
 * the test body has finished.
 */
async function setConnection(offline: boolean) {
  await act(async () => {
    setNetworkOffline(offline);
  });
}

afterEach(() => {
  resetNetwork();
});

const BANNER = /You’re offline/;

describe('OfflineBanner', () => {
  it('stays out of the way while the connection is fine', () => {
    renderBanner();

    expect(screen.queryByText(BANNER)).toBeNull();
  });

  it('appears when the connection drops', async () => {
    renderBanner();

    await setConnection(true);

    expect(screen.getByText(BANNER)).toBeTruthy();
    // Announced rather than left for a sighted user to notice.
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('disappears again once the connection returns', async () => {
    renderBanner();

    await setConnection(true);
    expect(screen.getByText(BANNER)).toBeTruthy();

    await setConnection(false);

    // It describes a condition, so it ends with the condition - there is no
    // dismiss control to leave stale.
    expect(screen.queryByText(BANNER)).toBeNull();
  });

  it('treats a connection whose reachability is still unknown as usable', async () => {
    // NetInfo reports `isInternetReachable: null` until it has established it.
    // Claiming the user is offline on a working connection is the worse error.
    renderBanner();

    await setConnection(false);

    expect(screen.queryByText(BANNER)).toBeNull();
  });
});
