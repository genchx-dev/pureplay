import { create } from 'zustand';
import { tournamentApi } from '../services/api/tournament.api';
import type { Tournament } from '../types/tournament.types';
import { useWalletStore } from './wallet.store';
import { useAuthStore } from './auth.store';

type TournamentApiResponse = any;

const normalizeTournament = (tournament: any): Tournament => {
  let status: Tournament['status'] = 'upcoming';
  const rawStatus = tournament.status;
  if (rawStatus === 'registering' || rawStatus === 'registration_open') {
    status = 'registration_open';
  } else if (rawStatus === 'in_progress' || rawStatus === 'active' || rawStatus === 'live') {
    status = 'active';
  } else if (rawStatus === 'completed') {
    status = 'completed';
  } else if (rawStatus === 'cancelled') {
    status = 'cancelled';
  } else if (rawStatus === 'upcoming') {
    status = 'upcoming';
  }

  return {
    id: tournament.id,
    name: tournament.name,
    description: tournament.description || '',
    gameType: tournament.gameType || tournament.game_type || 'tictactoe',
    entryFee: Number(tournament.entryFee !== undefined ? tournament.entryFee : (tournament.entry_fee !== undefined ? tournament.entry_fee : 0)),
    prizePool: Number(tournament.prizePool !== undefined ? tournament.prizePool : (tournament.prize_pool !== undefined ? tournament.prize_pool : 0)),
    participants: Number(tournament.participants !== undefined ? tournament.participants : (tournament.current_players !== undefined ? tournament.current_players : 0)),
    maxParticipants: Number(tournament.maxParticipants !== undefined ? tournament.maxParticipants : (tournament.max_players !== undefined ? tournament.max_players : 0)),
    startTime: tournament.startTime || tournament.started_at || tournament.created_at || new Date().toISOString(),
    registrationDeadline: tournament.registrationDeadline || tournament.registration_deadline || undefined,
    status,
    isJoined: !!(tournament.isJoined ?? tournament.is_joined),
    winners: tournament.winners || [],
  };
};

const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: 'mock_tournament_1',
    name: 'Ultimate Tic Tac Toe Cup',
    description: 'Enter the headline weekend bracket, climb the table, and fight for a live top-5 prize pool.',
    gameType: 'tictactoe',
    entryFee: 500,
    prizePool: 50000,
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    registrationDeadline: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString(),
    participants: 128,
    maxParticipants: 256,
    status: 'registration_open',
    isJoined: false,
  },
  {
    id: 'mock_tournament_2',
    name: 'Vortex Grand Arena',
    description: 'A premium high-stakes tournament for advanced tacticians. Show your skills in live board matches.',
    gameType: 'tictactoe',
    entryFee: 1000,
    prizePool: 150000,
    startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago (Live)
    registrationDeadline: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    participants: 64,
    maxParticipants: 64,
    status: 'active',
    isJoined: true, // Pre-joined so we can view the live brackets instantly!
  },
  {
    id: 'mock_tournament_3',
    name: 'Bronze Practice League',
    description: 'Perfect for beginners looking to climb from Wood tier. Low entry stakes, friendly matches.',
    gameType: 'tictactoe',
    entryFee: 100,
    prizePool: 10000,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    registrationDeadline: new Date(Date.now() + 23.5 * 60 * 60 * 1000).toISOString(),
    participants: 12,
    maxParticipants: 128,
    status: 'upcoming',
    isJoined: false,
  }
];

const getStoredTournaments = (): Tournament[] => {
  const stored = localStorage.getItem('mockTournaments');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored mock tournaments', e);
    }
  }
  return MOCK_TOURNAMENTS;
};

const saveStoredTournaments = (tournaments: Tournament[]) => {
  localStorage.setItem('mockTournaments', JSON.stringify(tournaments));
};

const generateMockBracket = (tournamentId: string, isJoined: boolean, username: string) => {
  const isCompleted = tournamentId === 'mock_tournament_1';
  const isLive = tournamentId === 'mock_tournament_2';
  
  const p1 = isJoined ? username : 'AlphaGamer';
  const p2 = 'ShadowMaster';
  const p3 = 'QuantumKing';
  const p4 = 'ProGamerX';
  const p5 = 'NightOwl';
  const p6 = 'CryptoChamp';
  const p7 = 'BlitzKing';
  const p8 = 'TacticsGod';

  return {
    tournament_id: tournamentId,
    name: tournamentId === 'mock_tournament_1' ? 'Ultimate Tic Tac Toe Cup' : tournamentId === 'mock_tournament_2' ? 'Vortex Grand Arena' : 'Bronze Practice League',
    status: isLive ? 'active' : isCompleted ? 'completed' : 'registering',
    tournament_type: 'knockout',
    max_players: 8,
    current_players: isLive || isCompleted ? 8 : (isJoined ? 13 : 12),
    entry_fee: tournamentId === 'mock_tournament_1' ? 500 : tournamentId === 'mock_tournament_2' ? 1000 : 100,
    prize_pool: tournamentId === 'mock_tournament_1' ? 50000 : tournamentId === 'mock_tournament_2' ? 150000 : 10000,
    prize_distribution: {"1": 40, "2": 25, "3": 15, "4": 12, "5": 8},
    rounds: [
      {
        name: "knockout_1",
        matches: [
          {
            id: 'mock_m1',
            round_type: 'knockout',
            round_number: 1,
            player1: p1,
            player1_id: isJoined ? 'user_id' : 'mock_u1',
            player2: p2,
            player2_id: 'mock_u2',
            winner: isCompleted ? p2 : isLive ? p1 : null,
            status: isLive || isCompleted ? 'completed' : 'pending',
            match_id: isLive ? 'mock_m1_match' : null,
            player1_score: isCompleted ? 1 : isLive ? 2 : 0,
            player2_score: isCompleted ? 2 : isLive ? 1 : 0,
          },
          {
            id: 'mock_m2',
            round_type: 'knockout',
            round_number: 1,
            player1: p3,
            player1_id: 'mock_u3',
            player2: p4,
            player2_id: 'mock_u4',
            winner: isCompleted ? p3 : isLive ? p3 : null,
            status: isLive || isCompleted ? 'completed' : 'pending',
            match_id: isLive ? 'mock_m2_match' : null,
            player1_score: isCompleted ? 2 : isLive ? 2 : 0,
            player2_score: isCompleted ? 0 : isLive ? 0 : 0,
          },
          {
            id: 'mock_m3',
            round_type: 'knockout',
            round_number: 1,
            player1: p5,
            player1_id: 'mock_u5',
            player2: p6,
            player2_id: 'mock_u6',
            winner: isCompleted ? p6 : isLive ? p6 : null,
            status: isLive || isCompleted ? 'completed' : 'pending',
            match_id: isLive ? 'mock_m3_match' : null,
            player1_score: isCompleted ? 0 : isLive ? 1 : 0,
            player2_score: isCompleted ? 2 : isLive ? 2 : 0,
          },
          {
            id: 'mock_m4',
            round_type: 'knockout',
            round_number: 1,
            player1: p7,
            player1_id: 'mock_u7',
            player2: p8,
            player2_id: 'mock_u8',
            winner: isCompleted ? p8 : isLive ? p8 : null,
            status: isLive || isCompleted ? 'completed' : 'pending',
            match_id: isLive ? 'mock_m4_match' : null,
            player1_score: isCompleted ? 1 : isLive ? 0 : 0,
            player2_score: isCompleted ? 2 : isLive ? 2 : 0,
          }
        ]
      },
      {
        name: "knockout_2",
        matches: [
          {
            id: 'mock_m5',
            round_type: 'knockout',
            round_number: 2,
            player1: isCompleted ? p2 : isLive ? p1 : 'TBD',
            player1_id: isCompleted ? 'mock_u2' : isLive ? (isJoined ? 'user_id' : 'mock_u1') : null,
            player2: isCompleted ? p3 : isLive ? p3 : 'TBD',
            player2_id: isCompleted || isLive ? 'mock_u3' : null,
            winner: isCompleted ? p2 : null,
            status: isCompleted ? 'completed' : isLive ? 'active' : 'pending',
            match_id: isLive ? 'mock_m5_match' : null,
            player1_score: isCompleted ? 2 : 0,
            player2_score: isCompleted ? 1 : 0,
          },
          {
            id: 'mock_m6',
            round_type: 'knockout',
            round_number: 2,
            player1: isCompleted ? p6 : isLive ? p6 : 'TBD',
            player1_id: isCompleted || isLive ? 'mock_u6' : null,
            player2: isCompleted ? p8 : isLive ? p8 : 'TBD',
            player2_id: isCompleted || isLive ? 'mock_u8' : null,
            winner: isCompleted ? p8 : null,
            status: isCompleted ? 'completed' : isLive ? 'active' : 'pending',
            match_id: isLive ? 'mock_m6_match' : null,
            player1_score: isCompleted ? 0 : 0,
            player2_score: isCompleted ? 2 : 0,
          }
        ]
      },
      {
        name: "knockout_3",
        matches: [
          {
            id: 'mock_m7',
            round_type: 'knockout',
            round_number: 3,
            player1: isCompleted ? p2 : 'TBD',
            player1_id: isCompleted ? 'mock_u2' : null,
            player2: isCompleted ? p8 : 'TBD',
            player2_id: isCompleted ? 'mock_u8' : null,
            winner: isCompleted ? p2 : null,
            status: isCompleted ? 'completed' : 'pending',
            match_id: null,
            player1_score: isCompleted ? 3 : 0,
            player2_score: isCompleted ? 2 : 0,
          }
        ]
      }
    ]
  };
};

interface TournamentState {
  tournaments: Tournament[];
  loading: boolean;
  error: string | null;
  activeBracket: any | null;
  bracketLoading: boolean;
  bracketError: string | null;
  fetchTournaments: () => Promise<void>;
  joinTournament: (id: string) => Promise<void>;
  fetchBracket: (id: string) => Promise<void>;
  startMatch: (matchId: number) => Promise<string>;
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  tournaments: [],
  loading: false,
  error: null,
  activeBracket: null,
  bracketLoading: false,
  bracketError: null,
  fetchTournaments: async () => {
    set({ loading: true });
    try {
      const { data } = await tournamentApi.getTournaments();
      
      if (!data || data.length === 0) {
        // Fallback to mock data if backend has no active tournaments
        set({ tournaments: getStoredTournaments(), loading: false, error: null });
        return;
      }

      set({ tournaments: data.map((tournament) => normalizeTournament(tournament as TournamentApiResponse)), loading: false, error: null });
    } catch (error) {
      console.warn('Backend tournaments endpoint failed, falling back to mock listings:', error);
      // Gracefully fall back to local simulated mock tournaments
      set({ tournaments: getStoredTournaments(), loading: false, error: null });
    }
  },
  joinTournament: async (id) => {
    set({ loading: true });
    
    // Check if it is a mock tournament ID
    if (id.startsWith('mock_')) {
      const tournamentsList = get().tournaments;
      const target = tournamentsList.find((t) => t.id === id);
      
      if (!target) {
        set({ loading: false, error: 'Tournament not found' });
        return;
      }

      const walletStore = useWalletStore.getState();
      if (walletStore.balance < target.entryFee) {
        set({ loading: false, error: 'Insufficient wallet balance' });
        return;
      }

      // Deduct funds and log mock transaction on Me screen
      useWalletStore.setState((s) => ({
        balance: s.balance - target.entryFee,
        transactions: [
          {
            id: `mock_tx_${Date.now()}`,
            type: 'stake',
            amount: -target.entryFee,
            date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            createdAt: new Date().toISOString(),
            status: 'completed',
            description: `Entry Fee: ${target.name}`,
          },
          ...s.transactions,
        ]
      }));

      // Update local storage state
      const updatedList = tournamentsList.map((t) => {
        if (t.id === id) {
          return { ...t, isJoined: true, participants: t.participants + 1 };
        }
        return t;
      });
      saveStoredTournaments(updatedList);
      
      set({ tournaments: updatedList, loading: false, error: null });
      return;
    }

    try {
      await tournamentApi.joinTournament(id);
      set({ loading: false, error: null });
      await useTournamentStore.getState().fetchTournaments();
    } catch (error) {
      console.error('Failed to join tournament', error);
      const errorMsg = error instanceof Error ? error.message : 'Could not join tournament';
      set({ loading: false, error: errorMsg });
    }
  },
  fetchBracket: async (id) => {
    set({ bracketLoading: true, bracketError: null });
    if (id.startsWith('mock_')) {
      const target = get().tournaments.find((t) => t.id === id);
      const isJoined = target?.isJoined ?? false;
      const username = useAuthStore.getState().user?.username || 'You';
      const mockBracket = generateMockBracket(id, isJoined, username);
      set({ activeBracket: mockBracket, bracketLoading: false });
      return;
    }
    try {
      const { data } = await tournamentApi.getTournamentBracket(id);
      set({ activeBracket: data, bracketLoading: false });
    } catch (error) {
      console.error('Failed to fetch bracket', error);
      const errorMsg = error instanceof Error ? error.message : 'Could not fetch bracket';
      set({ bracketError: errorMsg, bracketLoading: false });
    }
  },
  startMatch: async (matchId) => {
    if (matchId.toString().startsWith('mock_')) {
      return 'mock_live_match_id';
    }
    try {
      const { data } = await tournamentApi.startTournamentMatch(matchId);
      return data.match_id;
    } catch (error) {
      console.error('Failed to start tournament match', error);
      throw error;
    }
  },
}));
