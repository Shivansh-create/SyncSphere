import { create } from 'zustand';
import axios from 'axios';

// Configure Axios defaults
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
axios.defaults.baseURL = API_URL;

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('syncsphere_auth_token') || null,
  isAuthenticated: !!localStorage.getItem('syncsphere_auth_token'),
  isLoading: true,
  error: null,
  theme: 'auto',

  setTheme: (newTheme) => {
    set({ theme: newTheme });
  },



  // Initialize Auth State (check token)
  initAuth: async () => {
    const token = get().token;
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await axios.get('/auth/me');
      set({ 
        user: res.data.user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('syncsphere_auth_token');
      delete axios.defaults.headers.common['Authorization'];
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    }
  },

  // Login
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const res = await axios.post('/auth/login', { email, password });
      
      const { token, user } = res.data;
      localStorage.setItem('syncsphere_auth_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.error || 'Login failed';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },



  // Register
  register: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const res = await axios.post('/auth/register', { email, password });
      
      const { token, user } = res.data;
      localStorage.setItem('syncsphere_auth_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.error || 'Registration failed';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('syncsphere_auth_token');
    delete axios.defaults.headers.common['Authorization'];
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  // Clear Error
  clearError: () => set({ error: null })
}));
