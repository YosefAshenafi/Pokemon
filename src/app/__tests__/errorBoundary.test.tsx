import { fireEvent, render, screen } from '@testing-library/react-native';

import { setErrorReporter } from '@/api/reportError';
import { resetSystemColorScheme, setSystemColorScheme } from '@/test/appearance';

import { ErrorBoundary } from '../_layout';

afterEach(() => {
  resetSystemColorScheme();
});

describe('ErrorBoundary', () => {
  it('explains the failure instead of leaving a blank screen', () => {
    render(<ErrorBoundary error={new Error('stats is undefined')} retry={jest.fn()} />);

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText(/This screen could not be shown/)).toBeTruthy();
  });

  it('keeps the exception text off the screen and in the report instead', () => {
    const reporter = jest.fn();
    setErrorReporter(reporter);
    const error = new Error('stats is undefined');

    render(<ErrorBoundary error={error} retry={jest.fn()} />);

    expect(screen.queryByText(/stats is undefined/)).toBeNull();
    expect(reporter).toHaveBeenCalledWith(error, expect.objectContaining({ boundary: 'root' }));
    setErrorReporter(null);
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
