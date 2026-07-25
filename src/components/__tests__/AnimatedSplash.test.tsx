import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';

import { resetSystemColorScheme, setSystemColorScheme } from '@/test/appearance';

import { AnimatedSplash } from '../AnimatedSplash';

// expo-splash-screen drives the native launch screen, which does not exist under
// Jest. Its exports are non-configurable, so they cannot be spied on in place.
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(true),
  hideAsync: jest.fn().mockResolvedValue(true),
}));

/** Long enough to clear the 1400 ms hold plus the 350 ms fade. */
const PAST_THE_FADE = 3000;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
  resetSystemColorScheme();
});

describe('AnimatedSplash', () => {
  it('hides the native splash once it has laid out', () => {
    render(<AnimatedSplash onFinish={() => {}} />);

    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();

    fireEvent(screen.getByTestId('animated-splash', { includeHiddenElements: true }), 'layout');

    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it('calls onFinish after the hold and the fade have elapsed', () => {
    const onFinish = jest.fn();
    render(<AnimatedSplash onFinish={onFinish} />);

    expect(onFinish).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(PAST_THE_FADE);
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('does not call onFinish when the fade is interrupted by an unmount', () => {
    const onFinish = jest.fn();
    const { unmount } = render(<AnimatedSplash onFinish={onFinish} />);

    // Exactly on the 1400 ms hold: the fade has been started but has not yet
    // run a frame, so unmounting here interrupts it mid-animation.
    act(() => {
      jest.advanceTimersByTime(1400);
    });
    expect(onFinish).not.toHaveBeenCalled();

    unmount();
    act(() => {
      jest.advanceTimersByTime(PAST_THE_FADE);
    });

    expect(onFinish).not.toHaveBeenCalled();
  });

  it('carries on when the native splash refuses to hide', () => {
    jest.mocked(SplashScreen.hideAsync).mockRejectedValueOnce(new Error('no splash'));

    render(<AnimatedSplash onFinish={() => {}} />);

    expect(() =>
      fireEvent(screen.getByTestId('animated-splash', { includeHiddenElements: true }), 'layout'),
    ).not.toThrow();
  });

  it('does not call onFinish if it unmounts while still spinning', () => {
    const onFinish = jest.fn();
    const { unmount } = render(<AnimatedSplash onFinish={onFinish} />);

    unmount();
    act(() => {
      jest.advanceTimersByTime(PAST_THE_FADE);
    });

    expect(onFinish).not.toHaveBeenCalled();
  });

  it('uses the dark background when the system is in dark mode', () => {
    setSystemColorScheme('dark');

    render(<AnimatedSplash onFinish={() => {}} />);

    expect(screen.getByTestId('animated-splash', { includeHiddenElements: true }).props.style).toEqual(
      expect.objectContaining({ backgroundColor: '#0E1118' }),
    );
  });

  it('uses the light background by default', () => {
    setSystemColorScheme('light');

    render(<AnimatedSplash onFinish={() => {}} />);

    expect(screen.getByTestId('animated-splash', { includeHiddenElements: true }).props.style).toEqual(
      expect.objectContaining({ backgroundColor: '#F6F7FC' }),
    );
  });
});
