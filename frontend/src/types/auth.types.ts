export interface ChessCustomizations {
  pieceSet: string;
  gradStart: string;
  gradEnd: string;
  stroke: string;
  shadow: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  tier?: string;
  rank?: number;
  avatar?: string;
  phone?: string;
  xp?: number;
  mmr?: number;
  chess_customizations?: ChessCustomizations;
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
