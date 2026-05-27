import api from './client';
import type { LoginCredentials, RegisterCredentials, AuthResponse, User } from '../../types/auth.types';

export const authApi = {
  login: (credentials: LoginCredentials) => 
    api.post<AuthResponse>('/auth/login/', credentials),
    
  register: (credentials: RegisterCredentials) => 
    api.post<AuthResponse>('/auth/register/', credentials),
    
  getProfile: () => 
    api.get<User>('/auth/profile/'),
    
  updateProfile: (data: Partial<User>) =>
    api.patch<AuthResponse>('/users/profile/update/', data),
    
  logout: () => 
    api.post('/auth/logout/'),
};
