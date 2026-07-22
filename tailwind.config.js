/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand blue is shared by both color schemes (header, splash).
        brand: {
          DEFAULT: '#2D50C8',
          dark: '#22409F',
          light: '#4A6AE0',
        },
        // Scheme-dependent tokens live in src/global.css as CSS variables.
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        ink: {
          DEFAULT: 'var(--color-ink)',
          muted: 'var(--color-ink-muted)',
          subtle: 'var(--color-ink-subtle)',
        },
        track: 'var(--color-track)',
        line: 'var(--color-line)',
        accent: {
          DEFAULT: 'var(--color-accent)',
          soft: 'var(--color-accent-soft)',
        },
      },
    },
  },
};
