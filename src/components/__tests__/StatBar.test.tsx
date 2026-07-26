import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { StatBar } from '../StatBar';

const fill = () => StyleSheet.flatten(screen.getByTestId('stat-bar-fill').props.style);

describe('StatBar', () => {
  it('renders the label and value', () => {
    render(<StatBar stat="hp" label="HP" value={45} />);

    expect(screen.getByText('HP')).toBeTruthy();
    expect(screen.getByText('45')).toBeTruthy();
  });

  it('exposes the stat to assistive technology', () => {
    render(<StatBar stat="attack" label="Attack" value={49} />);

    expect(screen.getByLabelText('Attack: 49')).toBeTruthy();
  });

  it('colours the fill by stat, not by how large the value is', () => {
    const { unmount } = render(<StatBar stat="hp" label="HP" value={45} />);
    const weak = fill().backgroundColor;
    unmount();

    render(<StatBar stat="hp" label="HP" value={150} />);

    expect(fill().backgroundColor).toBe(weak);
  });

  it('gives two stats sharing a value different colours', () => {
    const { unmount } = render(<StatBar stat="special-attack" label="Sp. Atk" value={65} />);
    const specialAttack = fill().backgroundColor;
    unmount();

    render(<StatBar stat="special-defense" label="Sp. Def" value={65} />);

    expect(fill().backgroundColor).not.toBe(specialAttack);
  });

  it('scales the fill width against the stat ceiling', () => {
    render(<StatBar stat="attack" label="Attack" value={80} max={160} />);

    expect(fill().width).toBe('50%');
  });

  it('clamps a value above the ceiling to a full bar', () => {
    render(<StatBar stat="hp" label="HP" value={255} max={160} />);

    expect(fill().width).toBe('100%');
  });
});
