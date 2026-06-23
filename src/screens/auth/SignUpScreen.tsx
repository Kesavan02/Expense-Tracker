import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { AppTextField } from '../../components/AppTextField';
import { AppButton } from '../../components/AppButton';
import { Colors } from '../../constants/colors';
import { Typography, TextStyles } from '../../constants/typography';
type SignupScreenProps = NativeStackScreenProps<any, 'Signup'>;

export const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const { register, status } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = (): boolean => {
    let isValid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');

    if (!name.trim()) {
      setNameError('Please enter your name');
      isValid = false;
    }

    if (!email) {
      setEmailError('Please enter your email');
      isValid = false;
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email.trim())) {
        setEmailError('Please enter a valid email address');
        isValid = false;
      }
    }

    if (!password) {
      setPasswordError('Please enter your password');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await register(name.trim(), email.trim(), password);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Registration failed');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <MaterialIcons
            name="account-balance-wallet"
            size={80}
            color={Colors.primary}
            style={styles.logo}
          />
          <Text style={[TextStyles.displayMedium, styles.title, { color: themeColors.text }]}>
            Create Account
          </Text>
          <Text style={[TextStyles.bodyMedium, styles.subtitle, { color: themeColors.textMuted }]}>
            Sign up to start tracking your finances
          </Text>

          <View style={styles.form}>
            <AppTextField
              label="Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              leftIcon="person"
              error={nameError}
            />

            <AppTextField
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              leftIcon="email"
              error={emailError}
            />

            <AppTextField
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon="lock"
              error={passwordError}
            />

            <AppButton
              title="Sign Up"
              onPress={handleRegister}
              loading={status === 'loading'}
              style={styles.signupBtn}
            />

            <View style={styles.footer}>
              <Text style={[TextStyles.bodyMedium, { color: themeColors.textMuted }]}>
                Already have an account?{' '}
              </Text>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.loginText, { color: Colors.primary }]}>
                  Sign In
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  signupBtn: {
    marginTop: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semibold,
  },
});
