import { Platform } from 'react-native';

const lightColors = {
  primary: '#2B5AA7',
  primaryDeep: '#21467F',
  primaryWash: '#EEF3FA',
  ink: '#1C2430',
  inkMuted: '#57616F',
  line: '#DDE3EA',
  success: '#2E9E6B',
  warning: '#D99A0B',
  danger: '#D0453F',
  white: '#FFFFFF',
  background: '#F7F9FC',
  card: '#FFFFFF',
} as const;

const darkColors = {
  primary: '#6BA3FF',
  primaryDeep: '#5B8FE5',
  primaryWash: '#1E2A3F',
  ink: '#F0F3F6',
  inkMuted: '#B8C1CC',
  line: '#374151',
  success: '#4ADE80',
  warning: '#FCD34D',
  danger: '#F87171',
  white: '#1F2937',
  background: '#111827',
  card: '#1F2937',
} as const;

export function getColors(theme: 'light' | 'dark') {
  return theme === 'dark' ? darkColors : lightColors;
}

// Default export for backward compatibility
export const colors = lightColors;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  8: 48,
} as const;

export const typography = {
  display: { fontSize: 32, fontWeight: '650' as const, lineHeight: 38 },
  h1: { fontSize: 24, fontWeight: '600' as const, lineHeight: 29 },
  h2: { fontSize: 19, fontWeight: '600' as const, lineHeight: 23 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  small: { fontSize: 14, fontWeight: '400' as const, lineHeight: 21 },
  label: { fontSize: 11, fontWeight: '600' as const, lineHeight: 14 },
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const minTapTarget = 44;

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export type ColorKey = keyof typeof colors;
export type SpacingKey = keyof typeof spacing;
export type TypographyKey = keyof typeof typography;
