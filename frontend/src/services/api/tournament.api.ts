import api from './client';
import type { Tournament } from '../../types/tournament.types';

export const tournamentApi = {
  getTournaments: () => 
    api.get<Tournament[]>('/tournaments/'),
    
  getTournament: (id: string) => 
    api.get<Tournament>(`/tournaments/${id}/`),
    
  joinTournament: (id: string) => 
    api.post(`/tournaments/${id}/join/`),
};
