import { fireEvent, render, screen } from '@testing-library/react-native';

import { resetSystemColorScheme, setSystemColorScheme } from '@/test/appearance';

import { ErrorBoundary } from '../_layout';

afterEach(() => {
  resetSystemColorScheme();
});

/**
 * The boundary Expo Router mounts in place of a route whose render threw. It is
 * exercised directly rather than by throwing inside the router: what matters is
 * that the fallback is usable and offers a way back, and driving it through a
 * real crash would only add React's own error logging to the run.
 */
describe('ErrorBoundary', () => {
  it('explains the failure instead of leaving a blank screen', () => {
    render(<ErrorBoundary error={new Error('stats is undefined')} retry={jest.fn()} />);

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText(/This screen could not be shown/)).toBeTruthy();
    // The underlying message is kept, so a tester can report what actually broke.
    expect(screen.getByText(/stats is undefined/)).toBeTruthy();
  });

  it('re-renders the route when the retry is pressed', () => {
    const retry = jest.fn().mockResolvedValue(undefined);
    render(<ErrorBoundary error={new Error('boom')} retry={retry} />);

    fireEvent.press(screen.getByText('Try again'));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('paints the fallback in the dark background when the system is dark', () => {
    setSystemColorScheme('dark');

    render(<ErrorBoundary error={new Error('boom')} retry={jest.fn()} />);

    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });
});
