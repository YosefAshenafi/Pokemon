import { statColor, textColorOn, typeColor } from '../typeColors';

describe('typeColor', () => {
  it('returns the canonical color for a known type, case-insensitively', () => {
    expect(typeColor('fire')).toBe('#EE8130');
    expect(typeColor('Grass')).toBe('#7AC74C');
  });

  it('falls back to a neutral color for unknown types', () => {
    expect(typeColor('mystery')).toBe('#8A8FA3');
  });
});

describe('textColorOn', () => {
  it('uses dark text on light backgrounds (electric yellow)', () => {
    expect(textColorOn('#F7D02C')).toBe('#1B2137');
  });

  it('uses white text on dark backgrounds (fighting red)', () => {
    expect(textColorOn('#C22E28')).toBe('#FFFFFF');
  });
});

describe('statColor', () => {
  it('gives every stat its own color', () => {
    const stats = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
    const colors = stats.map(statColor);

    expect(new Set(colors).size).toBe(stats.length);
  });

  it('keys off the stat rather than the value', () => {
    expect(statColor('hp')).toBe('#5FBD58');
    expect(statColor('Special-Attack')).toBe('#5B9DEF');
  });

  it('falls back to a neutral color for unknown stats', () => {
    expect(statColor('accuracy')).toBe('#8A8FA3');
  });
});
