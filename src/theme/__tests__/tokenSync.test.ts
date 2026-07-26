import { readFileSync } from 'fs';
import { join } from 'path';

import { darkColors, lightColors } from '../paperTheme';

const css = readFileSync(join(__dirname, '../../global.css'), 'utf8');

const TOKEN_MAP = {
  '--color-bg': 'bg',
  '--color-surface': 'surface',
  '--color-ink': 'ink',
  '--color-ink-muted': 'inkMuted',
  '--color-ink-subtle': 'inkSubtle',
  '--color-track': 'track',
  '--color-line': 'line',
  '--color-accent': 'accent',
} as const satisfies Record<string, keyof typeof lightColors>;

function declaredVariables(scheme: 'light' | 'dark'): Record<string, string> {
  const [light, dark] = css.split('@media');
  const block = scheme === 'light' ? light : dark;
  const declarations = [...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)];
  return Object.fromEntries(declarations.map(([, name, value]) => [name, value.trim()]));
}

describe('design token sync', () => {
  it.each([
    ['light', lightColors] as const,
    ['dark', darkColors] as const,
  ])('keeps the %s CSS variables equal to the TypeScript palette', (scheme, palette) => {
    const variables = declaredVariables(scheme);

    for (const [cssName, tsKey] of Object.entries(TOKEN_MAP)) {
      expect(variables[cssName]?.toLowerCase()).toBe(palette[tsKey].toLowerCase());
    }
  });

  it('declares every mapped variable in both schemes', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const variables = declaredVariables(scheme);
      for (const cssName of Object.keys(TOKEN_MAP)) {
        expect(variables[cssName]).toBeDefined();
      }
    }
  });
});
