export interface ThemeColors {
  primary: string;
  secondary: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  accentBorder: string;
  background: string;
  surface: string;
  surfaceLight: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  cardBg: string;
  tagBg: string;
  tagText: string;
  success: string;
  error: string;
}

export const DarkColors: ThemeColors = {
  primary: '#2563EB',
  secondary: '#3B82F6',
  primaryDark: '#1D4ED8',
  accent: '#F97316',
  accentLight: 'rgba(249, 115, 22, 0.15)',
  accentDark: '#EA580C',
  accentBorder: 'rgba(249, 115, 22, 0.35)',
  background: '#060912',
  surface: '#0F172A',
  surfaceLight: '#1E293B',
  border: '#1E293B',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  cardBg: '#0F172A',
  tagBg: 'rgba(249, 115, 22, 0.15)',
  tagText: '#F97316',
  success: '#10B981',
  error: '#EF4444',
};

export const LightColors: ThemeColors = {
  primary: '#2563EB',
  secondary: '#3B82F6',
  primaryDark: '#1D4ED8',
  accent: '#F97316',
  accentLight: 'rgba(249, 115, 22, 0.12)',
  accentDark: '#EA580C',
  accentBorder: 'rgba(249, 115, 22, 0.30)',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceLight: '#F1F5F9',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  cardBg: '#FFFFFF',
  tagBg: 'rgba(249, 115, 22, 0.12)',
  tagText: '#EA580C',
  success: '#10B981',
  error: '#EF4444',
};

export const Colors = DarkColors;
