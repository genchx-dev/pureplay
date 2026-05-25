import { create } from 'zustand';
import { tournamentApi } from '../services/api/tournament.api';
import type { Tournament } from '../types/tournament.types';

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

interface TournamentState {
  tournaments: Tournament[];
  loading: boolean;
  error: string | null;
  fetchTournaments: () => Promise<void>;
  joinTournament: (id: string) => Promise<void>;
}

export const useTournamentStore = create<TournamentState>((set) => ({
  tournaments: [],
  loading: false,
  error: null,
  fetchTournaments: async () => {
    set({ loading: true });
    try {
      const { data } = await tournamentApi.getTournaments();
      set({ tournaments: data.map((tournament) => normalizeTournament(tournament as TournamentApiResponse)), loading: false, error: null });
    } catch (error) {
      console.error('Failed to fetch tournaments', error);
      set({ loading: false, error: 'Could not load tournaments' });
    }
  },
  joinTournament: async (id) => {
    set({ loading: true });
    try {
      await tournamentApi.joinTournament(id);
      set({ loading: false, error: null });
      await useTournamentStore.getState().fetchTournaments();
    } catch (error) {
      console.error('Failed to join tournament', error);
      set({ loading: false, error: 'Could not join tournament' });
    }
  },
}));
