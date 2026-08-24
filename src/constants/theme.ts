export interface ThemeColors {
  primary: string;
  secondary: string;
  primaryDark: string;
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
  primary: '#0066FF',
  secondary: '#00A3FF',
  primaryDark: '#0052CC',
  background: '#121212',
  surface: '#1C1C1E',
  surfaceLight: '#2C2C2E',
  border: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#A1A1A6',
  textMuted: '#6E6E73',
  cardBg: '#1C1C1E',
  tagBg: 'rgba(0, 102, 255, 0.2)',
  tagText: '#00A3FF',
  success: '#30D158',
  error: '#FF453A',
};

export const LightColors: ThemeColors = {
  primary: '#0066FF',
  secondary: '#00A3FF',
  primaryDark: '#0052CC',
  background: '#F8F9FC',
  surface: '#FFFFFF',
  surfaceLight: '#F1F3F9',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  cardBg: '#FFFFFF',
  tagBg: 'rgba(0, 102, 255, 0.1)',
  tagText: '#0066FF',
  success: '#10B981',
  error: '#EF4444',
};

export const Colors = DarkColors;
