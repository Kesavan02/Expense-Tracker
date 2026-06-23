import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'jwt_token';

export const tokenStorage = {
  getToken: async (): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(TOKEN_KEY);
      }
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn('tokenStorage.getToken failed, falling back to null:', e);
      // Fallback to AsyncStorage on mobile if SecureStore fails
      try {
        return await AsyncStorage.getItem(TOKEN_KEY);
      } catch {
        return null;
      }
    }
  },

  setToken: async (token: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch (e) {
      console.warn('tokenStorage.setToken failed, falling back to AsyncStorage:', e);
      try {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      } catch (err) {
        console.error('AsyncStorage set fallback failed:', err);
      }
    }
  },

  removeToken: async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (e) {
      console.warn('tokenStorage.removeToken failed, falling back to AsyncStorage:', e);
      try {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } catch (err) {
        console.error('AsyncStorage remove fallback failed:', err);
      }
    }
  },
};
