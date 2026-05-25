export interface LeaderboardPlayer {
  rank: number;
  username: string;
  tier: string;
  xp: number;
  wins: number;
  losses: number;
  draws: number;
  earnings: number;
}

export interface MatchHistoryRecord {
  id: string | number;
  game: string;
  opponent: string;
  result: 'WIN' | 'LOSS' | 'DRAW';
  earnings: number;
  date: string;
  time?: string;
  createdAt?: string;
}
