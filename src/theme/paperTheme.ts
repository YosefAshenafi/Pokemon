import { MD3LightTheme, type MD3Theme } from 'react-native-paper';

/**
 * Central design tokens. Keep in sync with the color palette in
 * `tailwind.config.js` — Paper components read from this theme, everything
 * else is styled with NativeWind classes.
 */
export const colors = {
  brand: '#2D50C8',
  brandDark: '#22409F',
  brandLight: '#4A6AE0',
  bg: '#F6F7FC',
  surface: '#FFFFFF',
  ink: '#1B2137',
  inkMuted: '#6A7190',
  inkSubtle: '#9AA0B5',
  track: '#EEF0F7',
  danger: '#D9484A',
} as const;

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.brand,
    onPrimary: '#FFFFFF',
    primaryContainer: '#DDE4FB',
    onPrimaryContainer: colors.brandDark,
    background: colors.bg,
    surface: colors.surface,
    onSurface: colors.ink,
    surfaceVariant: colors.track,
    onSurfaceVariant: colors.inkMuted,
    outline: '#D8DCEA',
    error: colors.danger,
  },
};
