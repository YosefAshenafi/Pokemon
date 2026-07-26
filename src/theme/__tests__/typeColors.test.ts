import { darkColors, lightColors } from '../paperTheme';
import { statColor, textColorOn, typeColor } from '../typeColors';

function luminance(hex: string): number {
  const channels = [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

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

  it('still answers for a background it has not seen before', () => {
    expect(textColorOn('#FFFFFF')).toBe('#1B2137');
    expect(textColorOn('#000000')).toBe('#FFFFFF');
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

describe('theme token contrast', () => {
  const AA_NORMAL_TEXT = 4.5;

  it.each([
    ['light', lightColors],
    ['dark', darkColors],
  ])('keeps every %s text token readable on both backgrounds', (_scheme, colors) => {
    for (const token of ['ink', 'inkMuted', 'inkSubtle', 'accent'] as const) {
      for (const background of ['bg', 'surface'] as const) {
        expect(contrastRatio(colors[token], colors[background])).toBeGreaterThanOrEqual(
          AA_NORMAL_TEXT,
        );
      }
    }
  });

  it('keeps the two secondary greys distinguishable from one another', () => {
    expect(contrastRatio(lightColors.inkMuted, lightColors.inkSubtle)).toBeGreaterThan(1.2);
    expect(contrastRatio(darkColors.inkMuted, darkColors.inkSubtle)).toBeGreaterThan(1.1);
  });
});
