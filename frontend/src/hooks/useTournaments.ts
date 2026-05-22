import { useEffect } from 'react';
import { useTournamentStore } from '../store/tournament.store';

export const useTournaments = (autoFetch = false) => {
  const { tournaments, loading, error, fetchTournaments, joinTournament } = useTournamentStore();

  useEffect(() => {
    if (autoFetch) {
      fetchTournaments();
    }
  }, [autoFetch, fetchTournaments]);

  return {
    tournaments,
    loading,
    error,
    fetchTournaments,
    joinTournament,
  };
};
