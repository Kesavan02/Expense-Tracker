import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';
import { Category, useTransactionStore } from './transactionStore';

export interface Budget {
  id: string;
  category: Category;
  amount: number; // in USD base
  startDate: string;
  endDate: string;
}

interface BudgetState {
  budgets: Budget[];
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage: string | null;

  loadBudgets: () => Promise<void>;
  addBudget: (budgetData: { categoryId: string; amount: number; startDate: string; endDate: string }) => Promise<void>;
}

const BUDGETS_CACHE_KEY = '@expense_tracker:budgets';

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  status: 'idle',
  errorMessage: null,

  loadBudgets: async () => {
    set({ status: 'loading', errorMessage: null });

    // 1. Load from AsyncStorage first
    try {
      const cachedData = await AsyncStorage.getItem(BUDGETS_CACHE_KEY);
      if (cachedData) {
        set({ budgets: JSON.parse(cachedData) });
      }
    } catch (e) {
      console.error('Failed to load budgets cache:', e);
    }

    // 2. Fetch from API to update
    try {
      const response = await apiClient.get('/api/budgets');
      const payload = response.data.data;

      const remoteBudgets: Budget[] = payload.map((b: any) => ({
        id: b._id,
        category: {
          id: b.category._id,
          name: b.category.name,
          type: b.category.type,
          icon: b.category.icon,
          color: b.category.color,
        },
        amount: b.amount,
        startDate: b.startDate,
        endDate: b.endDate,
      }));

      await AsyncStorage.setItem(BUDGETS_CACHE_KEY, JSON.stringify(remoteBudgets));
      set({ budgets: remoteBudgets, status: 'success' });
    } catch (error: any) {
      set({ status: 'success' }); // yield cache fallback
    }
  },

  addBudget: async (bData) => {
    set({ status: 'loading', errorMessage: null });
    try {
      const categories = useTransactionStore.getState().categories;
      const selectedCategory = categories.find((c) => c.id === bData.categoryId);

      if (!selectedCategory) {
        throw new Error('Category not found');
      }

      const response = await apiClient.post('/api/budgets', {
        categoryId: bData.categoryId,
        amount: bData.amount,
        startDate: bData.startDate,
        endDate: bData.endDate,
      });

      const payload = response.data.data;

      const serverBudget: Budget = {
        id: payload._id,
        category: selectedCategory,
        amount: payload.amount,
        startDate: payload.startDate,
        endDate: payload.endDate,
      };

      const updated = [...get().budgets, serverBudget];
      set({ budgets: updated, status: 'success' });
      await AsyncStorage.setItem(BUDGETS_CACHE_KEY, JSON.stringify(updated));
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to add budget.';
      set({ status: 'error', errorMessage: msg });
      throw new Error(msg);
    }
  },
}));
