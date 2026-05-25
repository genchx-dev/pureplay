import { create } from 'zustand';
import { rankingApi } from '../services/api/ranking.api';
import type { LeaderboardPlayer, MatchHistoryRecord } from '../types/ranking.types';
import { useAuthStore } from './auth.store';
import { getTierByXp } from '../utils/tier';
import { useWalletStore } from './wallet.store';

const MOCK_LEADERBOARD: LeaderboardPlayer[] = [
  { rank: 1, username: 'QuantumKing', tier: 'Ruby', xp: 1245000, wins: 245, losses: 35, draws: 15, earnings: 45200 },
  { rank: 2, username: 'ShadowMaster', tier: 'Titanium', xp: 832000, wins: 232, losses: 40, draws: 10, earnings: 41800 },
  { rank: 3, username: 'ProGamerX', tier: 'Platinum', xp: 418000, wins: 218, losses: 42, draws: 12, earnings: 38500 },
  { rank: 4, username: 'NightOwl', tier: 'Platinum', xp: 395000, wins: 195, losses: 55, draws: 8, earnings: 31200 },
  { rank: 5, username: 'CryptoChamp', tier: 'Diamond', xp: 287000, wins: 187, losses: 63, draws: 20, earnings: 28900 },
  { rank: 6, username: 'BlitzKing', tier: 'Gold', xp: 162000, wins: 162, losses: 72, draws: 11, earnings: 22400 },
  { rank: 7, username: 'TacticsGod', tier: 'Gold', xp: 148000, wins: 148, losses: 80, draws: 9, earnings: 19700 },
  { rank: 8, username: 'Dominator99', tier: 'Silver', xp: 81200, wins: 121, losses: 95, draws: 14, earnings: 14100 },
  { rank: 9, username: 'FlashPoint', tier: 'Iron', xp: 29000, wins: 109, losses: 101, draws: 10, earnings: 11600 },
  { rank: 10, username: 'XcelPlayer', tier: 'Bronze', xp: 12500, wins: 98, losses: 110, draws: 5, earnings: 9800 },
];

const DEFAULT_MATCH_HISTORY: MatchHistoryRecord[] = [
  { id: 'mock_match_1', game: 'Tic Tac Toe', opponent: 'ShadowMaster', result: 'WIN', earnings: 950, date: 'May 13, 2026', time: '03:25 PM', createdAt: new Date('2026-05-13T15:25:00Z').toISOString() },
  { id: 'mock_match_2', game: 'Tic Tac Toe', opponent: 'QuantumKing', result: 'LOSS', earnings: -500, date: 'May 13, 2026', time: '03:20 PM', createdAt: new Date('2026-05-13T15:20:00Z').toISOString() },
  { id: 'mock_match_3', game: 'Tic Tac Toe', opponent: 'ProGamerX', result: 'DRAW', earnings: 0, date: 'May 12, 2026', time: '11:10 AM', createdAt: new Date('2026-05-12T11:10:00Z').toISOString() },
];

interface RankingState {
  leaderboard: LeaderboardPlayer[];
  matchHistory: MatchHistoryRecord[];
  loading: boolean;
  error: string | null;
  fetchLeaderboard: () => Promise<void>;
  fetchMatchHistory: (username: string) => Promise<void>;
  addMatchResult: (username: string, game: string, opponent: string, result: 'WIN' | 'LOSS' | 'DRAW', stake: number) => void;
  addSimulationXp: (username: string, amount: number) => void;
  resetStats: (username: string) => void;
}

export const useRankingStore = create<RankingState>((set, get) => ({
  leaderboard: [],
  matchHistory: [],
  loading: false,
  error: null,

  fetchLeaderboard: async () => {
    set({ loading: true });
    try {
      const { data } = await rankingApi.getLeaderboard();
      let finalLeaderboard = data;
      if (!data || data.length === 0) {
        finalLeaderboard = MOCK_LEADERBOARD;
      }
      
      // Inject current logged-in user into leaderboard for testing realism
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        const userMatches = get().matchHistory.length > 0 ? get().matchHistory : (() => {
          const stored = localStorage.getItem(`matches_${currentUser.username}`);
          return stored ? JSON.parse(stored) : DEFAULT_MATCH_HISTORY;
        })();

        const wins = userMatches.filter((m: MatchHistoryRecord) => m.result === 'WIN').length;
        const losses = userMatches.filter((m: MatchHistoryRecord) => m.result === 'LOSS').length;
        const draws = userMatches.filter((m: MatchHistoryRecord) => m.result === 'DRAW').length;
        const earnings = userMatches.reduce((acc: number, m: MatchHistoryRecord) => acc + m.earnings, 0);
        const xp = currentUser.xp || 5000;

        // Check if user is already in the list
        const existsIdx = finalLeaderboard.findIndex(p => p.username === currentUser.username);
        let updatedList = [...finalLeaderboard];
        
        const userEntry: LeaderboardPlayer = {
          rank: 0,
          username: currentUser.username,
          tier: currentUser.tier || 'Bronze',
          xp,
          wins,
          losses,
          draws,
          earnings
        };

        if (existsIdx !== -1) {
          updatedList[existsIdx] = userEntry;
        } else {
          updatedList.push(userEntry);
        }

        // Sort by XP descending and re-assign ranks
        updatedList.sort((a, b) => b.xp - a.xp);
        updatedList = updatedList.map((p, idx) => ({ ...p, rank: idx + 1 }));
        
        // Sync rank back to auth user profile if changed
        const newRank = updatedList.find(p => p.username === currentUser.username)?.rank || 1000;
        if (currentUser.rank !== newRank) {
          useAuthStore.setState({
            user: { ...currentUser, rank: newRank }
          });
        }

        set({ leaderboard: updatedList, loading: false, error: null });
      } else {
        set({ leaderboard: finalLeaderboard.map((p, idx) => ({ ...p, rank: idx + 1 })), loading: false, error: null });
      }
    } catch (err) {
      console.warn('Leaderboard API failed, falling back to mock listings', err);
      // Fallback with user injection
      const finalLeaderboard = MOCK_LEADERBOARD;
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        const userMatches = (() => {
          const stored = localStorage.getItem(`matches_${currentUser.username}`);
          return stored ? JSON.parse(stored) : DEFAULT_MATCH_HISTORY;
        })();

        const wins = userMatches.filter((m: MatchHistoryRecord) => m.result === 'WIN').length;
        const losses = userMatches.filter((m: MatchHistoryRecord) => m.result === 'LOSS').length;
        const draws = userMatches.filter((m: MatchHistoryRecord) => m.result === 'DRAW').length;
        const earnings = userMatches.reduce((acc: number, m: MatchHistoryRecord) => acc + m.earnings, 0);
        const xp = currentUser.xp || 5000;

        let updatedList = [...finalLeaderboard];
        const userEntry: LeaderboardPlayer = {
          rank: 0,
          username: currentUser.username,
          tier: currentUser.tier || 'Bronze',
          xp,
          wins,
          losses,
          draws,
          earnings
        };

        const existsIdx = updatedList.findIndex(p => p.username === currentUser.username);
        if (existsIdx !== -1) {
          updatedList[existsIdx] = userEntry;
        } else {
          updatedList.push(userEntry);
        }

        updatedList.sort((a, b) => b.xp - a.xp);
        updatedList = updatedList.map((p, idx) => ({ ...p, rank: idx + 1 }));

        const newRank = updatedList.find(p => p.username === currentUser.username)?.rank || 1000;
        if (currentUser.rank !== newRank) {
          useAuthStore.setState({
            user: { ...currentUser, rank: newRank }
          });
        }

        set({ leaderboard: updatedList, loading: false, error: null });
      } else {
        set({ leaderboard: finalLeaderboard, loading: false, error: null });
      }
    }
  },

  fetchMatchHistory: async (username) => {
    set({ loading: true });
    try {
      const { data } = await rankingApi.getMatchHistory();
      if (!data || data.length === 0) {
        throw new Error('Empty match history');
      }
      set({ matchHistory: data, loading: false, error: null });
    } catch (err) {
      // Graceful fallback to localStorage
      const stored = localStorage.getItem(`matches_${username}`);
      const history = stored ? JSON.parse(stored) : DEFAULT_MATCH_HISTORY;
      if (!stored) {
        localStorage.setItem(`matches_${username}`, JSON.stringify(DEFAULT_MATCH_HISTORY));
      }
      set({ matchHistory: history, loading: false, error: null });
    }
  },

  addMatchResult: (username, game, opponent, result, stake) => {
    // 1. Calculate XP reward
    let gainedXp = 0;
    if (result === 'WIN') gainedXp = 50;
    else if (result === 'DRAW') gainedXp = 25;
    else gainedXp = 15;

    // 2. Fetch matches list
    const stored = localStorage.getItem(`matches_${username}`);
    const matches: MatchHistoryRecord[] = stored ? JSON.parse(stored) : [...DEFAULT_MATCH_HISTORY];

    // 3. Create new record
    const dateObj = new Date();
    const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const formattedTime = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    
    // Earnings calculation
    let earnings = 0;
    if (result === 'WIN') earnings = Math.round(stake * 0.95);
    else if (result === 'LOSS') earnings = -stake;

    const newRecord: MatchHistoryRecord = {
      id: `match_${Date.now()}`,
      game,
      opponent,
      result,
      earnings,
      date: formattedDate,
      time: formattedTime,
      createdAt: dateObj.toISOString(),
    };

    const updatedMatches = [newRecord, ...matches];

    // 4. Calculate win streaks consecutive wins from the latest
    let consecutiveWins = 0;
    for (const match of updatedMatches) {
      if (match.result === 'WIN') {
        consecutiveWins++;
      } else if (match.result === 'DRAW') {
        // Draw doesn't break a streak, or does it? In general, only Loss breaks a streak. Let's make Draw break it, or keep it. Let's keep wins consecutive.
        break;
      } else {
        break;
      }
    }

    // Streak bonus XP
    let streakBonus = 0;
    if (consecutiveWins === 3) streakBonus = 20;
    else if (consecutiveWins === 5) streakBonus = 50;
    else if (consecutiveWins === 10) streakBonus = 120;

    const totalAwarded = gainedXp + streakBonus;

    // 5. Update user's XP in local storage
    const storedXp = localStorage.getItem(`xp_${username}`);
    const currentXp = storedXp ? Number(storedXp) : 5000;
    const newXp = currentXp + totalAwarded;
    localStorage.setItem(`xp_${username}`, String(newXp));

    // Save updated matches list
    localStorage.setItem(`matches_${username}`, JSON.stringify(updatedMatches));

    // 6. Sync user in Auth Store
    const authUser = useAuthStore.getState().user;
    if (authUser && authUser.username === username) {
      const tierConfig = getTierByXp(newXp);
      useAuthStore.setState({
        user: {
          ...authUser,
          xp: newXp,
          tier: tierConfig.name,
        }
      });
    }

    // Set state
    set({ matchHistory: updatedMatches });

    // Re-fetch leaderboard to update ranks
    get().fetchLeaderboard();
  },

  addSimulationXp: (username, amount) => {
    const storedXp = localStorage.getItem(`xp_${username}`);
    const currentXp = storedXp ? Number(storedXp) : 5000;
    const newXp = Math.max(0, currentXp + amount);
    localStorage.setItem(`xp_${username}`, String(newXp));

    const authUser = useAuthStore.getState().user;
    if (authUser && authUser.username === username) {
      const tierConfig = getTierByXp(newXp);
      useAuthStore.setState({
        user: {
          ...authUser,
          xp: newXp,
          tier: tierConfig.name,
        }
      });
    }

    // Re-fetch leaderboard and history
    get().fetchLeaderboard();
  },

  resetStats: (username) => {
    localStorage.removeItem(`matches_${username}`);
    localStorage.setItem(`xp_${username}`, '5000'); // Reset to Bronze entry

    const isDemo = username.toLowerCase() === 'demo' || username.toLowerCase() === 'demoplayer';
    if (isDemo) {
      localStorage.setItem('demo_balance', '1000');
      localStorage.setItem('demo_transactions', '[]');
      useWalletStore.setState({ balance: 1000, transactions: [] });
    }

    const authUser = useAuthStore.getState().user;
    if (authUser && authUser.username === username) {
      const tierConfig = getTierByXp(5000);
      useAuthStore.setState({
        user: {
          ...authUser,
          xp: 5000,
          tier: tierConfig.name,
          rank: 10,
        }
      });
    }

    set({ matchHistory: DEFAULT_MATCH_HISTORY });
    localStorage.setItem(`matches_${username}`, JSON.stringify(DEFAULT_MATCH_HISTORY));
    get().fetchLeaderboard();
  },
}));
