import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ViewStyle,
  TextStyle,
  useColorScheme,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface AppTextFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address';
  leftIcon?: keyof typeof MaterialIcons.glyphMap | string;
  prefixText?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
}

export const AppTextField: React.FC<AppTextFieldProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  leftIcon,
  prefixText,
  style,
  inputStyle,
}) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: themeColors.text }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: themeColors.surface,
            borderColor: error
              ? Colors.error
              : isFocused
              ? Colors.primary
              : themeColors.border,
          },
        ]}
      >
        {leftIcon && !prefixText && (
          <MaterialIcons
            name={leftIcon as any}
            size={20}
            color={isFocused ? Colors.primary : themeColors.textMuted}
            style={styles.leftIcon}
          />
        )}
        {prefixText && (
          <Text
            style={[
              styles.prefixText,
              {
                color: isFocused ? Colors.primary : themeColors.textMuted,
              },
            ]}
          >
            {prefixText}
          </Text>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={themeColors.textMuted}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            { color: themeColors.text },
            inputStyle,
          ]}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIcon}
          >
            <MaterialIcons
              name={showPassword ? 'visibility-off' : 'visibility'}
              size={20}
              color={themeColors.textMuted}
            />
          </Pressable>
        )}
      </View>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  label: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
    marginBottom: 6,
  },
  inputContainer: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.medium,
  },
  leftIcon: {
    marginRight: 10,
  },
  prefixText: {
    marginRight: 8,
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  rightIcon: {
    padding: 4,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSizes.xs,
    marginTop: 4,
    marginLeft: 4,
  },
});
