import { Platform } from 'react-native';

// Brand Palette
export const Colors = {
  burgundy: '#861823',
  burgundyDark: '#6b1219',
  burgundyLight: '#a61e2b',
  burgundySubtle: '#fdf0f1',
  saffron: '#c85310',
  saffronDark: '#a34210',
  saffronLight: '#fff0e4',
  emerald: '#059669',
  emeraldLight: '#ecfdf5',
  amber: '#d7832d',
  amberLight: '#fff6e9',
  rose: '#e11d48',
  roseLight: '#ffe4e6',
  darkSlate: '#0f172a',
  slate800: '#1e293b',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',
  cream: '#fef9f3',
  white: '#ffffff',
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  textDisabled: '#94a3b8',
  textInverse: '#ffffff',
  textLink: '#861823',
  border: '#e2e8f0',
  borderFocus: '#861823',
  borderMuted: '#f1f5f9',
  success: '#059669',
  successBg: '#ecfdf5',
  warning: '#d7832d',
  warningBg: '#fff6e9',
  error: '#e11d48',
  errorBg: '#ffe4e6',
  info: '#0ea5e9',
  infoBg: '#f0f9ff',
  dark: {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceElevated: '#334155',
    border: '#334155',
    borderMuted: '#475569',
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    card: '#1e293b',
  },
} as const;

export const Fonts = {
  sizes: { xs: 11, sm: 13, base: 15, md: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 28, '4xl': 32, '5xl': 38 },
  weights: { regular: '400' as const, medium: '500' as const, semibold: '600' as const, bold: '700' as const, extrabold: '800' as const },
  lineHeights: { tight: 1.2, snug: 1.375, normal: 1.5, relaxed: 1.625 },
} as const;

export const Spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, '2xl': 32, '3xl': 40, '4xl': 48, '5xl': 64,
  screenPadding: 16, cardPadding: 16,
} as const;

export const Radius = {
  xs: 4, sm: 6, md: 8, lg: 12, xl: 16, '2xl': 20, '3xl': 24, full: 999,
} as const;

export const Shadows = {
  sm: Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }, android: { elevation: 2 }, default: {} }),
  md: Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 }, android: { elevation: 4 }, default: {} }),
  lg: Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 }, android: { elevation: 8 }, default: {} }),
  card: Platform.select({ ios: { shadowColor: '#861823', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 3 }, default: {} }),
} as const;

export const BottomTabInset = 80;
export const MaxContentWidth = 500;
export const Theme = { Colors, Fonts, Spacing, Radius, Shadows } as const;
export default Theme;
