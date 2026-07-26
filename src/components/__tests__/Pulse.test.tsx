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

    expect(pulse).toBeTruthy();
    expect(screen.getByText('Loading')).toBeTruthy();
  });

  it('holds still when the system asks for reduced motion', async () => {
    setReducedMotion(true);

    const pulse = await renderPulse();

    expect(pulse.props.style).toEqual(expect.objectContaining({ opacity: 1 }));
  });
});
