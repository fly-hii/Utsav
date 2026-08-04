export type ThemeColors = typeof darkColors;

export const darkColors = {
  background: '#0F172A',
  primaryOrange: '#F59E0B',
  primaryCrimson: '#E11D48',
  saffron: '#D97706',
  gold: '#FBBF24',
  cream: '#F8FAFC',
  glassCard: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassCardActive: 'rgba(255, 255, 255, 0.1)',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

export const lightColors: ThemeColors = {
  background: '#F8FAFC',
  primaryOrange: '#F59E0B',
  primaryCrimson: '#E11D48',
  saffron: '#D97706',
  gold: '#FBBF24',
  cream: '#0F172A', // inverted for contrast
  glassCard: 'rgba(0, 0, 0, 0.05)',
  glassBorder: 'rgba(0, 0, 0, 0.1)',
  glassCardActive: 'rgba(0, 0, 0, 0.1)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

// Export COLORS as a fallback for backwards compatibility where it hasn't been refactored yet
export const COLORS = darkColors;

export const GRADIENTS = {
  festival: ['#0F172A', '#1E1B4B'] as const,
  gold: ['#F59E0B', '#D97706'] as const,
  dark: ['#1E293B', '#0F172A'] as const,
  lightFestival: ['#F8FAFC', '#E2E8F0'] as const,
  lightDark: ['#F8FAFC', '#F1F5F9'] as const,
};
