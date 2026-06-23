import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { UserNavigator } from './UserNavigator';
import { AdminNavigator } from './AdminNavigator';
import { Colors } from '../constants/colors';

export const AppNavigator = () => {
  const { status, user, checkAuth } = useAuthStore();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  useEffect(() => {
    checkAuth();
  }, []);

  if (status === 'initial' || status === 'loading') {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderNavigator = () => {
    if (status === 'authenticated' && user) {
      if (user.role === 'admin') {
        return <AdminNavigator />;
      }
      return <UserNavigator />;
    }
    return <AuthNavigator />;
  };

  return (
    <NavigationContainer>
      {renderNavigator()}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
