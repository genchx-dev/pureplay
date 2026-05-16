import { useAuthStore } from '../store/auth.store';
import { authApi } from '../services/api/auth.api';
import type { LoginCredentials, RegisterCredentials } from '../types/auth.types';

export const useAuth = () => {
  const { user, token, isAuthenticated, setAuth, logout, checkAuth } = useAuthStore();

  const login = async (credentials: LoginCredentials) => {
    const { data } = await authApi.login(credentials);
    setAuth(data.user, data.token, data.refresh);
    return data;
  };

  const register = async (credentials: RegisterCredentials) => {
    const { data } = await authApi.register(credentials);
    setAuth(data.user, data.token, data.refresh);
    return data;
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
  };
};
