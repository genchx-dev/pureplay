import api from './client';
import type { LeaderboardPlayer, MatchHistoryRecord } from '../../types/ranking.types';

export const rankingApi = {
  getLeaderboard: () => 
    api.get<LeaderboardPlayer[]>('/rankings/leaderboard/'),
    
  getMatchHistory: () => 
    api.get<MatchHistoryRecord[]>('/matches/history/'),
};
