// store/admin.store.ts

import { create } from 'zustand';
import { adminApi } from '../services/api/admin.api';

// ── Types ──────────────────────────────────

interface DashboardStats {
  users: { total: number; today: number; this_week: number };
  matches: { active: number; total_completed: number };
  tournaments: { registering: number; active: number; completed: number };
  financial: {
    total_deposited: number;
    total_withdrawn: number;
    total_staked: number;
    total_won: number;
    total_prize_distributed: number;
    platform_wallet_total: number;
    platform_locked_total: number;
  };
  revenue: {
    tournament_revenue: number;
    quick_match_revenue: number;
    total_platform_revenue: number;
  };
}

interface AnalyticsData {
  period: { start: string; end: string };
  daily_signups: Record<string, number>;
  daily_matches: Record<string, number>;
  daily_deposits: Record<string, number>;
  daily_withdrawals: Record<string, number>;
  daily_stakes: Record<string, number>;
  daily_revenue: Record<string, number>;
}

export interface GameStats {
  id: string;
  label: string;
  active_matches: number;
  quick_matches_played: number;
  revenue_made: number;
  online_users: number;
  queue_users: number;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  date_joined: string;
  last_login: string | null;
  is_staff: boolean;
  is_active: boolean;
  wallet_balance: number;
  stats: {
    wins: number;
    losses: number;
    draws: number;
    total_matches: number;
    win_rate: number;
    mmr: number;
    xp: number;
  };
}

interface AdminTournament {
  id: string;
  name: string;
  game_type: string;
  bracket_type: string;
  tournament_type: string;
  status: string;
  entry_fee: number;
  prize_pool: number;
  max_players: number;
  current_players: number;
  winner: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  scheduled_start_time: string | null;
  registration_deadline: string | null;
}

interface AdminTransaction {
  id: string;
  username: string;
  type: string;
  amount: number;
  status: string;
  reference_id: string | null;
  description: string;
  created_at: string;
}

interface AdminMatch {
  id: string;
  player1: string | null;
  player2: string | null;
  winner: string | null;
  status: string;
  game_type: string;
  stake: number;
  is_tournament: boolean;
  created_at: string;
}

interface PaginatedResult<T> {
  total: number;
  page: number;
  page_size: number;
  results: T[];
}

// ── Store ──────────────────────────────────

interface AdminState {
  // Data
  dashboard: DashboardStats | null;
  analytics: AnalyticsData | null;
  users: PaginatedResult<AdminUser> | null;
  tournaments: PaginatedResult<AdminTournament> | null;
  transactions: PaginatedResult<AdminTransaction> | null;
  matches: PaginatedResult<AdminMatch> | null;
  games: GameStats[] | null;

  // Loading states
  loading: {
    dashboard: boolean;
    analytics: boolean;
    users: boolean;
    tournaments: boolean;
    transactions: boolean;
    matches: boolean;
    games: boolean;
  };

  // Error states
  error: {
    dashboard: string | null;
    analytics: string | null;
    users: string | null;
    tournaments: string | null;
    transactions: string | null;
    matches: string | null;
    games: string | null;
  };

  // Actions
  fetchDashboard: () => Promise<void>;
  fetchAnalytics: (days?: number) => Promise<void>;
  fetchUsers: (params?: { page?: number; search?: string }) => Promise<void>;
  fetchTournaments: (params?: { page?: number; status?: string }) => Promise<void>;
  createTournament: (data: Parameters<typeof adminApi.createTournament>[0]) => Promise<boolean>;
  startTournament: (id: string) => Promise<boolean>;
  cancelTournament: (id: string) => Promise<boolean>;
  fetchTransactions: (params?: {
    page?: number;
    type?: string;
    status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  }) => Promise<void>;
  fetchMatches: (params?: {
    page?: number;
    status?: string;
    game_type?: string;
    is_tournament?: string;
    search?: string;
  }) => Promise<void>;
  fetchGames: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  dashboard: null,
  analytics: null,
  users: null,
  tournaments: null,
  transactions: null,
  matches: null,
  games: null,

  loading: {
    dashboard: false,
    analytics: false,
    users: false,
    tournaments: false,
    transactions: false,
    matches: false,
    games: false,
  },

  error: {
    dashboard: null,
    analytics: null,
    users: null,
    tournaments: null,
    transactions: null,
    matches: null,
    games: null,
  },

  fetchDashboard: async () => {
    set((s) => ({ loading: { ...s.loading, dashboard: true }, error: { ...s.error, dashboard: null } }));
    try {
      const { data } = await adminApi.getDashboard();
      set((s) => ({ dashboard: data, loading: { ...s.loading, dashboard: false } }));
    } catch (e: any) {
      set((s) => ({
        loading: { ...s.loading, dashboard: false },
        error: { ...s.error, dashboard: e?.response?.data?.detail || 'Failed to fetch dashboard' },
      }));
    }
  },

  fetchAnalytics: async (days = 30) => {
    set((s) => ({ loading: { ...s.loading, analytics: true }, error: { ...s.error, analytics: null } }));
    try {
      const { data } = await adminApi.getAnalytics(days);
      set((s) => ({ analytics: data, loading: { ...s.loading, analytics: false } }));
    } catch (e: any) {
      set((s) => ({
        loading: { ...s.loading, analytics: false },
        error: { ...s.error, analytics: e?.response?.data?.detail || 'Failed to fetch analytics' },
      }));
    }
  },

  fetchUsers: async (params) => {
    set((s) => ({ loading: { ...s.loading, users: true }, error: { ...s.error, users: null } }));
    try {
      const { data } = await adminApi.getUsers(params || {});
      set((s) => ({ users: data, loading: { ...s.loading, users: false } }));
    } catch (e: any) {
      set((s) => ({
        loading: { ...s.loading, users: false },
        error: { ...s.error, users: e?.response?.data?.detail || 'Failed to fetch users' },
      }));
    }
  },

  fetchTournaments: async (params) => {
    set((s) => ({ loading: { ...s.loading, tournaments: true }, error: { ...s.error, tournaments: null } }));
    try {
      const { data } = await adminApi.getTournaments(params || {});
      set((s) => ({ tournaments: data, loading: { ...s.loading, tournaments: false } }));
    } catch (e: any) {
      set((s) => ({
        loading: { ...s.loading, tournaments: false },
        error: { ...s.error, tournaments: e?.response?.data?.detail || 'Failed to fetch tournaments' },
      }));
    }
  },

  createTournament: async (formData) => {
    try {
      await adminApi.createTournament(formData);
      return true;
    } catch {
      return false;
    }
  },

  startTournament: async (id) => {
    try {
      await adminApi.startTournament(id);
      return true;
    } catch {
      return false;
    }
  },

  cancelTournament: async (id) => {
    try {
      await adminApi.cancelTournament(id);
      return true;
    } catch {
      return false;
    }
  },

  fetchTransactions: async (params) => {
    set((s) => ({ loading: { ...s.loading, transactions: true }, error: { ...s.error, transactions: null } }));
    try {
      const { data } = await adminApi.getTransactions(params || {});
      set((s) => ({ transactions: data, loading: { ...s.loading, transactions: false } }));
    } catch (e: any) {
      set((s) => ({
        loading: { ...s.loading, transactions: false },
        error: { ...s.error, transactions: e?.response?.data?.detail || 'Failed to fetch transactions' },
      }));
    }
  },

  fetchMatches: async (params) => {
    set((s) => ({ loading: { ...s.loading, matches: true }, error: { ...s.error, matches: null } }));
    try {
      const { data } = await adminApi.getMatches(params || {});
      set((s) => ({ matches: data, loading: { ...s.loading, matches: false } }));
    } catch (e: any) {
      set((s) => ({
        loading: { ...s.loading, matches: false },
        error: { ...s.error, matches: e?.response?.data?.detail || 'Failed to fetch matches' },
      }));
    }
  },

  fetchGames: async () => {
    set((s) => ({ loading: { ...s.loading, games: true }, error: { ...s.error, games: null } }));
    try {
      const { data } = await adminApi.getGames();
      set((s) => ({ games: data, loading: { ...s.loading, games: false } }));
    } catch (e: any) {
      set((s) => ({
        loading: { ...s.loading, games: false },
        error: { ...s.error, games: e?.response?.data?.detail || 'Failed to fetch games' },
      }));
    }
  },
}));
