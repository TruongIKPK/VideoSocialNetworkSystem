/**
 * Theme constants for Looply Mobile App
 * Includes colors, spacing, typography, and other design tokens
 */

import { Platform } from 'react-native';

// Color Palette
export const Colors = {
  // Primary Colors
  primary: '#007AFF',
  primaryDark: '#0051CC',
  primaryLight: '#5AC8FA',
  
  // Accent Colors
  accent: '#00D4FF',
  accentDark: '#00A8CC',
  
  // Status Colors
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#007AFF',
  
  // Neutral Colors
  black: '#000000',
  white: '#FFFFFF',
  gray: {
    50: '#F5F5F5',
    100: '#E8E8E8',
    200: '#D1D1D1',
    300: '#B5B5B5',
    400: '#999999',
    500: '#666666',
    600: '#4A4A4A',
    700: '#333333',
    800: '#1A1A1A',
    900: '#0D0D0D',
  },
  
  // Background Colors
  background: {
    light: '#FFFFFF',
    dark: '#000000',
    gray: '#F5F5F5',
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.8)',
  },
  
  // Text Colors
  text: {
    primary: '#000000',
    secondary: '#666666',
    tertiary: '#999999',
    inverse: '#FFFFFF',
    light: '#B5B5B5',
  },
  
  // Border Colors
  border: {
    light: '#E8E8E8',
    medium: '#D1D1D1',
    dark: '#B5B5B5',
  },
  
  // Social Colors
  social: {
    google: '#DB4437',
    facebook: '#4267B2',
    apple: '#000000',
  },
};

// Spacing Scale (8px base)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  
  // Common spacing values
  screenPadding: 16,
  cardPadding: 20,
  sectionSpacing: 24,
};

// Border Radius
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  round: 9999,
  
  // Common radius values
  button: 25,
  card: 12,
  input: 25,
  avatar: 9999,
};

// Typography
export const Typography = {
  // Font Families
  fontFamily: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'sans-serif',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'sans-serif-medium',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
      default: 'sans-serif-bold',
    }),
  },
  
  // Font Sizes
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    display: 28,
    hero: 32,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

// Shadows
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Legacy support (for backward compatibility)
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
