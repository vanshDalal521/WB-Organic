import { colors } from './colors';
import { spacing, borderRadius } from './spacing';
import { typography } from './typography';

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
  },
} as const;

export type Theme = typeof theme;

export { colors } from './colors';
export { spacing, borderRadius } from './spacing';
export { typography } from './typography';
