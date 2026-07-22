/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2D50C8',
          dark: '#22409F',
          light: '#4A6AE0',
        },
        bg: '#F6F7FC',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#1B2137',
          muted: '#6A7190',
          subtle: '#9AA0B5',
        },
        track: '#EEF0F7',
      },
    },
  },
  plugins: [],
};
