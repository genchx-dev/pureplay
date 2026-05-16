import { create } from 'zustand';
import { authApi } from '../services/api/auth.api';
import { User } from '../types/auth.types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('token'),
  setAuth: (user, token, refreshToken) => {
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    set({ user, token, refreshToken: refreshToken || null, isAuthenticated: true });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  },
  checkAuth: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const { data } = await authApi.getProfile();
      set({ user: data, isAuthenticated: true });
    } catch (error) {
      console.error('Auth check failed', error);
      get().logout();
    }
  },
}));
