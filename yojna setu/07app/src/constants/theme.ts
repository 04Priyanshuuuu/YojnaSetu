export const colors = {
  background: '#FEF9F3',
  surface: '#FFFFFF',

  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',

  primary: '#2563EB',
  muted: '#64748B',
  textSoft: '#64748B',

  border: '#E2E8F0',

  saffron: '#D7832D',
  saffronDark: '#B96516',
  saffronLight: '#FFF7ED',

  maroon: '#861823',
  maroonDark: '#4F0E16',

  blue: '#2563EB',
  blueDark: '#1E3A8A',
  blueLight: '#EFF6FF',

  sky: '#0284C7',
  skyLight: '#F0F9FF',

  emerald: '#059669',
  emeraldLight: '#ECFDF5',

  amber: '#D97706',
  amberLight: '#FFFBEB',

  indigo: '#4F46E5',
  indigoLight: '#EEF2FF',

  rose: '#E11D48',
  roseLight: '#FFF1F2',

  teal: '#0D9488',
  tealLight: '#F0FDFA',

  white: '#FFFFFF',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
};

export const typography = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  xxxl: 32,

  // Existing auth screens use this.
  title: 24,
  subtitle: 14,
  body: 14,
  caption: 12,
};

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  elevated: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
};

/*
 * Backward-compatible default theme.
 *
 * Existing mobile screens such as login.tsx and register.tsx
 * use:
 *
 *   theme.colors.text
 *   theme.typography.title
 *
 * Keep this default export so those screens continue to work.
 */
const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
};

export default theme;