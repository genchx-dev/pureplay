export interface Tournament {
  id: string;
  name: string;
  gameType: string;
  entryFee: number;
  prizePool: number;
  startTime: string;
  participants: number;
  maxParticipants: number;
  status: 'upcoming' | 'live' | 'completed';
}

export interface PrizeDistribution {
  rank: string;
  prize: number;
  color: string;
  bg: string;
}
