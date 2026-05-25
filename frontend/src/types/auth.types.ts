export interface User {
  id: string;
  username: string;
  email: string;
  tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  rank?: number;
  avatar?: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refresh?: string;
}

export interface LoginCredentials {
  username: string;
  password?: string;
}

export interface RegisterCredentials extends LoginCredentials {
  email: string;
  phone?: string;
}
