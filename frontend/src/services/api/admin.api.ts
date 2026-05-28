// services/api/admin.api.ts

import api from './client';

export const adminApi = {
  // Dashboard overview stats
  getDashboard: () => api.get('/admin/dashboard/'),

  // Analytics timeseries
  getAnalytics: (days = 30) => api.get(`/admin/analytics/?days=${days}`),

  // User management
  getUsers: (params: { page?: number; page_size?: number; search?: string }) =>
    api.get('/admin/users/', { params }),

  // Tournament management
  getTournaments: (params: { page?: number; page_size?: number; status?: string }) =>
    api.get('/admin/tournaments/', { params }),

  createTournament: (data: {
    name: string;
    game_type: string;
    entry_fee: number;
    max_players: number;
    bracket_type?: string;
    tournament_type?: string;
    prize_distribution?: Record<string, number>;
    scheduled_start_time?: string;
    registration_deadline?: string;
  }) => api.post('/admin/tournaments/create/', data),

  startTournament: (id: string) => api.post(`/admin/tournaments/${id}/start/`),

  cancelTournament: (id: string) => api.post(`/admin/tournaments/${id}/cancel/`),

  // Financial audit log
  getTransactions: (params: {
    page?: number;
    page_size?: number;
    type?: string;
    status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  }) => api.get('/admin/transactions/', { params }),

  // Match history
  getMatches: (params: {
    page?: number;
    page_size?: number;
    status?: string;
    game_type?: string;
    is_tournament?: string;
    search?: string;
  }) => api.get('/admin/matches/', { params }),

  // Games stats
  getGames: () => api.get('/admin/games/'),
};
