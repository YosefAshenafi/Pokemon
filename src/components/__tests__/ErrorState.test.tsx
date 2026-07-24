import { fireEvent, render, screen } from '@testing-library/react-native';

import { ErrorState } from '../ErrorState';

describe('ErrorState', () => {
  it('falls back to a generic message when none is given', () => {
    render(<ErrorState />);

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Something went wrong.')).toBeTruthy();
  });

  it('shows the supplied message', () => {
    render(<ErrorState message="The Pokédex could not be loaded." />);

    expect(screen.getByText('The Pokédex could not be loaded.')).toBeTruthy();
  });

  it('omits the retry button when there is nothing to retry', () => {
    render(<ErrorState message="No retry here." />);

    expect(screen.queryByText('Try again')).toBeNull();
  });

  it('calls onRetry when the retry button is pressed', () => {
    const onRetry = jest.fn();
    render(<ErrorState message="Boom." onRetry={onRetry} />);

    fireEvent.press(screen.getByText('Try again'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
