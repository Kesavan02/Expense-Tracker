import { TextStyle } from 'react-native';

export const Typography = {
  fontSizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    display: 32,
    displayLarge: 40,
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const TextStyles = {
  displayLarge: {
    fontSize: Typography.fontSizes.displayLarge,
    fontWeight: Typography.fontWeights.bold,
  } as TextStyle,
  displayMedium: {
    fontSize: Typography.fontSizes.display,
    fontWeight: Typography.fontWeights.bold,
  } as TextStyle,
  titleLarge: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: Typography.fontWeights.bold,
  } as TextStyle,
  titleMedium: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.semibold,
  } as TextStyle,
  titleSmall: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.medium,
  } as TextStyle,
  bodyLarge: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.regular,
  } as TextStyle,
  bodyMedium: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.regular,
  } as TextStyle,
  bodySmall: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.regular,
  } as TextStyle,
  labelMedium: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
  } as TextStyle,
  labelSmall: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.regular,
  } as TextStyle,
};
