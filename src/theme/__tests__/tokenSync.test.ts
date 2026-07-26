import { readFileSync } from 'fs';
import { join } from 'path';

import { darkColors, lightColors } from '../paperTheme';

/**
 * The palette exists twice: as CSS variables the Tailwind classes resolve
 * through, and as the TypeScript objects Paper and the inline styles read. Two
 * sources are unavoidable - NativeWind classes cannot be read from JS, and
 * Paper's theme cannot be expressed as a class - but a comment asking the next
 * person to keep them in sync is not a mechanism. This is.
 */
const css = readFileSync(join(__dirname, '../../global.css'), 'utf8');

/** CSS custom property -> the key holding the same colour in the TS palettes. */
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

/**
 * The variables declared in one scheme's block. The light values sit in the
 * first `:root`; the dark ones in the `:root` inside the media query.
 */
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
    // Guards the mapping itself: a renamed variable would otherwise make every
    // comparison above compare `undefined` to `undefined` and quietly pass.
    for (const scheme of ['light', 'dark'] as const) {
      const variables = declaredVariables(scheme);
      for (const cssName of Object.keys(TOKEN_MAP)) {
        expect(variables[cssName]).toBeDefined();
      }
    }
  });
});
