import axios from 'axios';
import { tokenStorage } from '../utils/storage';

const DEFAULT_BASE_URL = 'https://expense-tracker-tw5r.onrender.com';

// We can define the API url from environment variables or default to the Render URL
export const API_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_BASE_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Async interceptor to inject the JWT token into all outgoing requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await tokenStorage.getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching secure token for API request:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
