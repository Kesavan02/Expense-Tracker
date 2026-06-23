import React from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface AppButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'filled' | 'outline' | 'text';
  color?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const AppButton: React.FC<AppButtonProps> = ({
  onPress,
  title,
  variant = 'filled',
  color = Colors.primary,
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getButtonStyle = (): ViewStyle => {
    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: color,
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
        };
      case 'filled':
      default:
        return {
          backgroundColor: color,
        };
    }
  };

  const getTextColor = (): string => {
    if (disabled) return '#94A3B8';
    switch (variant) {
      case 'outline':
      case 'text':
        return color;
      case 'filled':
      default:
        return '#FFFFFF';
    }
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, styles.container, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.button,
          getButtonStyle(),
          disabled && styles.disabledButton,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={getTextColor()} size="small" />
        ) : (
          <Text
            style={[
              styles.text,
              { color: getTextColor() },
              textStyle,
            ]}
          >
            {title}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  button: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  disabledButton: {
    backgroundColor: '#E2E8F0',
    borderColor: '#E2E8F0',
    opacity: 0.7,
  },
  text: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semibold,
  },
});
