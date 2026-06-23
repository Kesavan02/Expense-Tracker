import { create } from 'zustand';
import apiClient from '../api/apiClient';
import { Category } from './transactionStore';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  currency: string;
  createdAt: string;
}

export interface ChartPoint {
  year: number;
  month?: number;
  week?: number;
  count: number;
}

export interface AdminStats {
  total: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  chartPoints: ChartPoint[];
}

interface AdminState {
  users: AdminUser[];
  stats: AdminStats | null;
  categories: Category[];
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage: string | null;

  loadUsers: () => Promise<void>;
  loadStats: (range: 'weekly' | 'monthly' | 'yearly') => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  loadCategories: () => Promise<void>;
  addCategory: (catData: { name: string; type: 'income' | 'expense'; icon: string; color: string }) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  stats: null,
  categories: [],
  status: 'idle',
  errorMessage: null,

  loadUsers: async () => {
    set({ status: 'loading', errorMessage: null });
    try {
      const response = await apiClient.get('/api/admin/users');
      const payload = response.data.data;

      const users: AdminUser[] = payload.map((u: any) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar || '',
        currency: u.currency || 'USD',
        createdAt: u.createdAt,
      }));

      set({ users, status: 'success' });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to load users.';
      set({ status: 'error', errorMessage: msg });
    }
  },

  loadStats: async (range) => {
    set({ status: 'loading', errorMessage: null });
    try {
      const response = await apiClient.get('/api/admin/stats', { params: { range } });
      const payload = response.data.data;
      const summary = payload.summary || {};
      const rawChart = payload.chart || [];

      const stats: AdminStats = {
        total: summary.total || 0,
        thisWeek: summary.thisWeek || 0,
        thisMonth: summary.thisMonth || 0,
        thisYear: summary.thisYear || 0,
        chartPoints: rawChart.map((c: any) => ({
          year: c._id?.year || 0,
          month: c._id?.month,
          week: c._id?.week,
          count: c.count || 0,
        })),
      };

      set({ stats, status: 'success' });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to load stats.';
      set({ status: 'error', errorMessage: msg });
    }
  },

  deleteUser: async (userId) => {
    set({ status: 'loading', errorMessage: null });
    try {
      await apiClient.delete(`/api/admin/users/${userId}`);
      set({
        users: get().users.filter((u) => u.id !== userId),
        status: 'success',
      });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to delete user.';
      set({ status: 'error', errorMessage: msg });
      throw new Error(msg);
    }
  },

  loadCategories: async () => {
    set({ status: 'loading', errorMessage: null });
    try {
      const response = await apiClient.get('/api/admin/categories');
      const payload = response.data.data;

      const categories: Category[] = payload.map((cat: any) => ({
        id: cat._id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
      }));

      set({ categories, status: 'success' });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to load categories.';
      set({ status: 'error', errorMessage: msg });
    }
  },

  addCategory: async (catData) => {
    set({ status: 'loading', errorMessage: null });
    try {
      const response = await apiClient.post('/api/admin/categories', catData);
      const payload = response.data.data;

      const newCategory: Category = {
        id: payload._id,
        name: payload.name,
        type: payload.type,
        icon: payload.icon,
        color: payload.color,
      };

      set({
        categories: [...get().categories, newCategory],
        status: 'success',
      });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to add category.';
      set({ status: 'error', errorMessage: msg });
      throw new Error(msg);
    }
  },

  deleteCategory: async (categoryId) => {
    set({ status: 'loading', errorMessage: null });
    try {
      await apiClient.delete(`/api/admin/categories/${categoryId}`);
      set({
        categories: get().categories.filter((cat) => cat.id !== categoryId),
        status: 'success',
      });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to delete category.';
      set({ status: 'error', errorMessage: msg });
      throw new Error(msg);
    }
  },
}));
