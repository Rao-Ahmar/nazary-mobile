export const colors = {
  // Primary
  primary: '#0058bc',
  primaryContainer: '#0070eb',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#fefcff',

  // Surface hierarchy (tonal layering - no borders!)
  background: '#f9f9fb',
  surface: '#f9f9fb',
  surfaceBright: '#f9f9fb',
  surfaceContainer: '#eeeef0',
  surfaceContainerHigh: '#e8e8ea',
  surfaceContainerHighest: '#e2e2e4',
  surfaceContainerLow: '#f3f3f5',
  surfaceContainerLowest: '#ffffff',
  surfaceDim: '#d9dadc',

  // Text
  onSurface: '#1a1c1d',
  onSurfaceVariant: '#414755',
  onBackground: '#1a1c1d',

  // Secondary
  secondary: '#5e5e5e',
  secondaryContainer: '#e2e2e2',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#646464',

  // Tertiary
  tertiary: '#9e3d00',
  tertiaryContainer: '#c64f00',
  onTertiary: '#ffffff',

  // Outline
  outline: '#717786',
  outlineVariant: '#c1c6d7',

  // Error
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',

  // Inverse
  inverseSurface: '#2f3132',
  inverseOnSurface: '#f0f0f2',
  inversePrimary: '#adc6ff',

  // Semantic
  success: '#1a7a3a',
  successLight: '#e8f5e9',
  warning: '#f59e0b',
  warningLight: '#fffbeb',

  // Glassmorphism
  glass: 'rgba(249, 249, 251, 0.80)',
  glassDark: 'rgba(26, 28, 29, 0.04)',
};

export const typography = {
  // Display - Manrope (editorial voices)
  displayLg: {
    fontFamily: 'Manrope_300Light',
    fontSize: 52,
    lineHeight: 52 * 1.1,
    letterSpacing: -0.02 * 52,
  },
  displayMd: {
    fontFamily: 'Manrope_300Light',
    fontSize: 44,
    lineHeight: 44 * 1.15,
    letterSpacing: -0.01 * 44,
  },
  displaySm: {
    fontFamily: 'Manrope_300Light',
    fontSize: 36,
    lineHeight: 36 * 1.2,
    letterSpacing: -0.01 * 36,
  },

  // Headline - Manrope
  headlineLg: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 32,
    lineHeight: 32 * 1.25,
    letterSpacing: 0,
  },
  headlineMd: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 28,
    lineHeight: 28 * 1.3,
    letterSpacing: 0,
  },
  headlineSm: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 24,
    lineHeight: 24 * 1.33,
    letterSpacing: 0,
  },

  // Title - Manrope
  titleLg: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 22,
    lineHeight: 22 * 1.27,
    letterSpacing: 0,
  },
  titleMd: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
    lineHeight: 16 * 1.5,
    letterSpacing: 0.15,
  },
  titleSm: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    lineHeight: 14 * 1.43,
    letterSpacing: 0.1,
  },

  // Body - Inter (transactional)
  bodyLg: {
    fontFamily: 'Inter_300Light',
    fontSize: 16,
    lineHeight: 16 * 1.6,
    letterSpacing: 0.5,
  },
  bodyMd: {
    fontFamily: 'Inter_300Light',
    fontSize: 14,
    lineHeight: 14 * 1.6,
    letterSpacing: 0.25,
  },
  bodySm: {
    fontFamily: 'Inter_300Light',
    fontSize: 12,
    lineHeight: 12 * 1.6,
    letterSpacing: 0.4,
  },

  // Label - Inter
  labelLg: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 14 * 1.43,
    letterSpacing: 0.1,
  },
  labelMd: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 12 * 1.33,
    letterSpacing: 0.5,
  },
  labelSm: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 11 * 1.45,
    letterSpacing: 0.5,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const shadows = {
  ambient: {
    shadowColor: '#1a1c1d',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 32,
    elevation: 4,
  },
  soft: {
    shadowColor: '#1a1c1d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  card: {
    shadowColor: '#1a1c1d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.035,
    shadowRadius: 24,
    elevation: 3,
  },
};
