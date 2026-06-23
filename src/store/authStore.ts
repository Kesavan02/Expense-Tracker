import { create } from 'zustand';
import { tokenStorage } from '../utils/storage';
import apiClient from '../api/apiClient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar: string;
  currency: string;
  dateFormat: string;
}

interface AuthState {
  user: User | null;
  status: 'initial' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  errorMessage: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (profile: Partial<Omit<User, 'id' | 'email' | 'role'>>) => Promise<void>;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: 'initial',
  errorMessage: null,

  clearError: () => set({ errorMessage: null }),

  login: async (email, password) => {
    set({ status: 'loading', errorMessage: null });
    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
      const payload = response.data.data;
      
      const user: User = {
        id: payload._id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        avatar: payload.avatar,
        currency: payload.currency,
        dateFormat: payload.dateFormat,
      };

      await tokenStorage.setToken(payload.token);
      set({ user, status: 'authenticated' });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed. Please try again.';
      set({ status: 'error', errorMessage: msg });
      throw new Error(msg);
    }
  },

  register: async (name, email, password) => {
    set({ status: 'loading', errorMessage: null });
    try {
      const response = await apiClient.post('/api/auth/register', { name, email, password });
      const payload = response.data.data;

      const user: User = {
        id: payload._id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        avatar: payload.avatar,
        currency: payload.currency,
        dateFormat: payload.dateFormat,
      };

      await tokenStorage.setToken(payload.token);
      set({ user, status: 'authenticated' });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed. Please try again.';
      set({ status: 'error', errorMessage: msg });
      throw new Error(msg);
    }
  },

  updateProfile: async (profile) => {
    set({ status: 'loading', errorMessage: null });
    try {
      const response = await apiClient.put('/api/auth/profile', profile);
      const payload = response.data.data;

      const user: User = {
        id: payload._id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        avatar: payload.avatar,
        currency: payload.currency,
        dateFormat: payload.dateFormat,
      };

      if (payload.token) {
        await tokenStorage.setToken(payload.token);
      }
      set({ user, status: 'authenticated' });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to update profile.';
      set({ status: 'error', errorMessage: msg, user: get().user });
      throw new Error(msg);
    }
  },

  checkAuth: async () => {
    try {
      const token = await tokenStorage.getToken();
      if (!token) {
        set({ status: 'unauthenticated', user: null });
        return;
      }

      set({ status: 'loading' });
      const response = await apiClient.get('/api/auth/me');
      const payload = response.data.data;

      const user: User = {
        id: payload._id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        avatar: payload.avatar,
        currency: payload.currency,
        dateFormat: payload.dateFormat,
      };

      set({ user, status: 'authenticated' });
    } catch (error) {
      // If token is invalid or request fails, clear session
      await tokenStorage.removeToken();
      set({ status: 'unauthenticated', user: null });
    }
  },

  logout: async () => {
    await tokenStorage.removeToken();
    set({ user: null, status: 'unauthenticated', errorMessage: null });
  },
}));
