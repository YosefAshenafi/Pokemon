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
  it('buckets values into low / mid / high colors', () => {
    expect(statColor(30)).toBe('#EC6A5E');
    expect(statColor(65)).toBe('#F2B450');
    expect(statColor(120)).toBe('#5FBD58');
  });
});
