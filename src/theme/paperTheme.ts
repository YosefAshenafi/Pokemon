import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

/**
 * The design tokens read from JavaScript: the Paper themes below and the few
 * inline styles that can't use a class. NativeWind's copy of the same palette
 * lives in `src/global.css` — keep the two in sync.
 */
export const lightColors = {
  brand: '#2D50C8',
  brandDark: '#22409F',
  bg: '#F6F7FC',
  surface: '#FFFFFF',
  ink: '#1B2137',
  inkMuted: '#6A7190',
  inkSubtle: '#9AA0B5',
  track: '#EEF0F7',
  line: '#ECEEF6',
  accent: '#2D50C8',
  danger: '#D9484A',
} as const;

export const darkColors = {
  brand: '#2D50C8',
  brandDark: '#22409F',
  bg: '#0E1118',
  surface: '#171B26',
  ink: '#E7EAF3',
  inkMuted: '#9AA2BC',
  inkSubtle: '#8791AF',
  track: '#232939',
  line: '#252B3B',
  accent: '#9FB2F5',
  danger: '#F2706F',
} as const;

export const paperLightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: lightColors.brand,
    onPrimary: '#FFFFFF',
    primaryContainer: '#DDE4FB',
    onPrimaryContainer: lightColors.brandDark,
    background: lightColors.bg,
    surface: lightColors.surface,
    onSurface: lightColors.ink,
    surfaceVariant: lightColors.track,
    onSurfaceVariant: lightColors.inkMuted,
    outline: '#D8DCEA',
    error: lightColors.danger,
  },
};

export const paperDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Brand blue is too dark for text on dark surfaces; use a lighter tint.
    primary: '#9FB2F5',
    onPrimary: '#101736',
    primaryContainer: darkColors.brandDark,
    onPrimaryContainer: '#DDE4FB',
    background: darkColors.bg,
    surface: darkColors.surface,
    onSurface: darkColors.ink,
    surfaceVariant: darkColors.track,
    onSurfaceVariant: darkColors.inkMuted,
    outline: '#3A4158',
    error: darkColors.danger,
  },
};
