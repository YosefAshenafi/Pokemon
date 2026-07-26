import { act, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { resetNetwork, setNetworkOffline } from '@/test/network';

import { OfflineBanner } from '../OfflineBanner';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderBanner() {
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <OfflineBanner />
    </SafeAreaProvider>,
  );
}

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
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('disappears again once the connection returns', async () => {
    renderBanner();

    await setConnection(true);
    expect(screen.getByText(BANNER)).toBeTruthy();

    await setConnection(false);

    expect(screen.queryByText(BANNER)).toBeNull();
  });

  it('treats a connection whose reachability is still unknown as usable', async () => {
    renderBanner();

    await setConnection(false);

    expect(screen.queryByText(BANNER)).toBeNull();
  });
});
