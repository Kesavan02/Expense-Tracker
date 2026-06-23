import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category;
  description: string;
  date: string;
}

interface TransactionState {
  transactions: Transaction[];
  categories: Category[];
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage: string | null;

  loadTransactions: () => Promise<void>;
  loadCategories: () => Promise<void>;
  addTransaction: (transactionData: Omit<Transaction, 'id' | 'category'> & { categoryId: string }) => Promise<void>;
  deleteTransactions: (ids: string[]) => Promise<void>;
}

const TRANSACTIONS_CACHE_KEY = '@expense_tracker:transactions';
const CATEGORIES_CACHE_KEY = '@expense_tracker:categories';

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  categories: [],
  status: 'idle',
  errorMessage: null,

  loadTransactions: async () => {
    set({ status: 'loading', errorMessage: null });
    
    // 1. Load from AsyncStorage first
    try {
      const cachedData = await AsyncStorage.getItem(TRANSACTIONS_CACHE_KEY);
      if (cachedData) {
        set({ transactions: JSON.parse(cachedData) });
      }
    } catch (e) {
      console.error('Failed to load transactions cache:', e);
    }

    // 2. Fetch from API to update
    try {
      const response = await apiClient.get('/api/transactions');
      const payload = response.data.data;
      
      const remoteTransactions: Transaction[] = payload.map((tx: any) => ({
        id: tx._id,
        amount: tx.amount,
        type: tx.type,
        category: {
          id: tx.category._id,
          name: tx.category.name,
          type: tx.category.type,
          icon: tx.category.icon,
          color: tx.category.color,
        },
        description: tx.description || '',
        date: tx.date,
      }));

      await AsyncStorage.setItem(TRANSACTIONS_CACHE_KEY, JSON.stringify(remoteTransactions));
      set({ transactions: remoteTransactions, status: 'success' });
    } catch (error: any) {
      // API failed, fallback is already in state
      set({ status: 'success' }); // we successfully render cache at least
    }
  },

  loadCategories: async () => {
    set({ status: 'loading', errorMessage: null });

    // 1. Load from AsyncStorage first
    try {
      const cachedData = await AsyncStorage.getItem(CATEGORIES_CACHE_KEY);
      if (cachedData) {
        set({ categories: JSON.parse(cachedData) });
      }
    } catch (e) {
      console.error('Failed to load categories cache:', e);
    }

    // 2. Fetch from API to update
    try {
      const response = await apiClient.get('/api/categories');
      const payload = response.data.data;
      
      const remoteCategories: Category[] = payload.map((cat: any) => ({
        id: cat._id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
      }));

      await AsyncStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(remoteCategories));
      set({ categories: remoteCategories, status: 'success' });
    } catch (error: any) {
      set({ status: 'success' });
    }
  },

  addTransaction: async (txData) => {
    const tempId = `temp_${Date.now()}`;
    const selectedCategory = get().categories.find((c) => c.id === txData.categoryId);
    
    if (!selectedCategory) {
      set({ status: 'error', errorMessage: 'Category not found.' });
      throw new Error('Category not found');
    }

    const localTx: Transaction = {
      id: tempId,
      amount: txData.amount,
      type: txData.type,
      category: selectedCategory,
      description: txData.description,
      date: txData.date,
    };

    // Optimistic Save
    const updatedLocal = [localTx, ...get().transactions];
    set({ transactions: updatedLocal });
    await AsyncStorage.setItem(TRANSACTIONS_CACHE_KEY, JSON.stringify(updatedLocal));

    try {
      // POST API call (removing temp _id)
      const postData = {
        amount: txData.amount,
        type: txData.type,
        categoryId: txData.categoryId,
        description: txData.description,
        date: txData.date,
      };

      const response = await apiClient.post('/api/transactions', postData);
      const payload = response.data.data;

      const serverTx: Transaction = {
        id: payload._id,
        amount: payload.amount,
        type: payload.type,
        category: {
          id: payload.category._id,
          name: payload.category.name,
          type: payload.category.type,
          icon: payload.category.icon,
          color: payload.category.color,
        },
        description: payload.description || '',
        date: payload.date,
      };

      // Swap temp ID with real server ID in local cache & state
      const cleaned = get().transactions.map((tx) => (tx.id === tempId ? serverTx : tx));
      set({ transactions: cleaned });
      await AsyncStorage.setItem(TRANSACTIONS_CACHE_KEY, JSON.stringify(cleaned));
    } catch (error) {
      // Keep optimistic item in local cache for offline capabilities
      console.warn('Network transaction sync delayed; kept in offline cache.');
    }
  },

  deleteTransactions: async (ids) => {
    // Optimistic Delete
    const originalTx = get().transactions;
    const remaining = originalTx.filter((tx) => !ids.includes(tx.id));
    set({ transactions: remaining });
    await AsyncStorage.setItem(TRANSACTIONS_CACHE_KEY, JSON.stringify(remaining));

    try {
      const deletePromises = ids.map((id) => {
        if (!id.startsWith('temp_')) {
          return apiClient.delete(`/api/transactions/${id}`);
        }
        return Promise.resolve();
      });

      await Promise.all(deletePromises);
    } catch (error) {
      // Fail silently (optimistic delete persists locally)
      console.error('Failed to sync deletions to server:', error);
    }
  },
}));
