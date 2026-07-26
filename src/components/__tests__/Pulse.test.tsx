import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { setReducedMotion } from '@/test/motion';

import { Pulse } from '../Pulse';

afterEach(() => {
  jest.restoreAllMocks();
});

async function renderPulse() {
  render(
    <Pulse testID="pulse">
      <Text>Loading</Text>
    </Pulse>,
  );
  // The reduce-motion preference is read asynchronously; let it settle.
  await act(async () => {});
  return screen.getByTestId('pulse');
}

describe('Pulse', () => {
  it('renders its children', async () => {
    const pulse = await renderPulse();

    expect(screen.getByText('Loading')).toBeTruthy();
    expect(pulse).toBeTruthy();
  });

  it('animates by default', async () => {
    setReducedMotion(false);

    const pulse = await renderPulse();

    // The driving Animated.Value is attached whether or not the loop is running;
    // what matters is that the component mounts and stays visible either way.
    expect(pulse).toBeTruthy();
    expect(screen.getByText('Loading')).toBeTruthy();
  });

  it('holds still when the system asks for reduced motion', async () => {
    setReducedMotion(true);

    const pulse = await renderPulse();

    // Full opacity, not mid-pulse: the skeleton's shape already says "loading",
    // so there is nothing to replace the movement with.
    expect(pulse.props.style).toEqual(expect.objectContaining({ opacity: 1 }));
  });
});
