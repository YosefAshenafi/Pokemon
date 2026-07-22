import { render, screen } from '@testing-library/react-native';

import { StatBar } from '../StatBar';

describe('StatBar', () => {
  it('renders the label and value', () => {
    render(<StatBar label="HP" value={45} />);

    expect(screen.getByText('HP')).toBeTruthy();
    expect(screen.getByText('45')).toBeTruthy();
  });

  it('exposes the stat to assistive technology', () => {
    render(<StatBar label="Attack" value={49} />);

    expect(screen.getByLabelText('Attack: 49')).toBeTruthy();
  });
});
