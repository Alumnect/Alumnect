import { useColorScheme } from 'react-native'

export const palette = {
  primary: '#F27124',
  primaryDark: '#EA580C',
  primarySoft: '#FB923C',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',
  info: '#2563EB',
}

const light = {
  ...palette,
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  inputBg: '#F1F5F9',
  primaryTint: '#FFF1E6',
  isDark: false,
}

const dark: typeof light = {
  ...palette,
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  inputBg: '#273449',
  primaryTint: '#3A2414',
  isDark: true,
}

export type Theme = typeof light

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light
}

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 }
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 }
