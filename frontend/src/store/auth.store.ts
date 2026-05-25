import { create } from 'zustand';
import { authApi } from '../services/api/auth.api';
import type { User } from '../types/auth.types';
import { getTierByXp } from '../utils/tier';

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
    
    // Load local XP and override tier
    const storedXp = localStorage.getItem(`xp_${user.username}`);
    const xp = storedXp ? Number(storedXp) : 5000; // start with 5000 (Bronze)
    if (!storedXp) {
      localStorage.setItem(`xp_${user.username}`, '5000');
    }
    const tierConfig = getTierByXp(xp);
    
    set({ 
      user: {
        ...user,
        xp,
        tier: tierConfig.name,
      }, 
      token, 
      refreshToken: refreshToken || null, 
      isAuthenticated: true 
    });
  },
  setUser: (user) => {
    const storedXp = localStorage.getItem(`xp_${user.username}`);
    const xp = storedXp ? Number(storedXp) : 5000;
    const tierConfig = getTierByXp(xp);
    set({
      user: {
        ...user,
        xp,
        tier: tierConfig.name
      }
    });
  },
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
      
      const storedXp = localStorage.getItem(`xp_${data.username}`);
      const xp = storedXp ? Number(storedXp) : 5000; // start with 5000 (Bronze)
      if (!storedXp) {
        localStorage.setItem(`xp_${data.username}`, '5000');
      }
      const tierConfig = getTierByXp(xp);
      
      set({ 
        user: { 
          ...data, 
          xp, 
          tier: tierConfig.name,
          rank: data.rank || 10
        }, 
        isAuthenticated: true 
      });
    } catch (error) {
      console.error('Auth check failed', error);
      get().logout();
    }
  },
}));
