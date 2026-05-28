import api from './client';
import type { Tournament } from '../../types/tournament.types';

export const tournamentApi = {
  getTournaments: () => 
    api.get<Tournament[]>('/tournaments/'),
    
  getTournament: (id: string) => 
    api.get<Tournament>(`/tournaments/${id}/`),
    
  joinTournament: (id: string) => 
    api.post(`/tournaments/${id}/join/`),

  getTournamentBracket: (id: string) =>
    api.get<any>(`/tournaments/${id}/bracket/`),

  startTournamentMatch: (matchId: number) =>
    api.post<{ match_id: string }>(`/tournaments/match/${matchId}/start/`),
};
