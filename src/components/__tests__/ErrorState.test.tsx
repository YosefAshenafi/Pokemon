import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { resetNetwork, setNetworkOffline } from '@/test/network';

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

describe('ErrorState - offline', () => {
  afterEach(() => {
    resetNetwork();
  });

  it('names the connection rather than blaming the request', () => {
    render(<ErrorState message="The Pokédex could not be loaded." onRetry={jest.fn()} />);

    act(() => setNetworkOffline(true));

    expect(screen.getByText('No connection')).toBeTruthy();
    // The per-request wording would be a red herring: nothing is wrong with the
    // Pokédex, and the user cannot act on that sentence.
    expect(screen.queryByText('The Pokédex could not be loaded.')).toBeNull();
  });

  it('withdraws the retry that could only time out', () => {
    render(<ErrorState message="Boom." onRetry={jest.fn()} />);
    expect(screen.getByText('Try again')).toBeTruthy();

    act(() => setNetworkOffline(true));

    expect(screen.queryByText('Try again')).toBeNull();
  });

  it('offers the retry again the moment the connection returns', () => {
    const onRetry = jest.fn();
    render(<ErrorState message="Boom." onRetry={onRetry} />);

    act(() => setNetworkOffline(true));
    act(() => setNetworkOffline(false));

    fireEvent.press(screen.getByText('Try again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
