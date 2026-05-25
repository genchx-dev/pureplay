import { create } from 'zustand';
import { tournamentApi } from '../services/api/tournament.api';
import type { Tournament } from '../types/tournament.types';
import { useWalletStore } from './wallet.store';

type TournamentApiResponse = Tournament & {
  registration_deadline?: string;
  is_joined?: boolean;
};

const normalizeTournament = (tournament: TournamentApiResponse): Tournament => ({
  ...tournament,
  entryFee: Number(tournament.entryFee),
  prizePool: Number(tournament.prizePool),
  participants: Number(tournament.participants),
  maxParticipants: Number(tournament.maxParticipants),
  registrationDeadline: tournament.registrationDeadline || tournament.registration_deadline,
  isJoined: tournament.isJoined ?? tournament.is_joined ?? false,
});

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

interface TournamentState {
  tournaments: Tournament[];
  loading: boolean;
  error: string | null;
  fetchTournaments: () => Promise<void>;
  joinTournament: (id: string) => Promise<void>;
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  tournaments: [],
  loading: false,
  error: null,
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
}));
