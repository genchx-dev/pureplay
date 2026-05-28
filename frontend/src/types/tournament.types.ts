export interface Tournament {
  id: string;
  name: string;
  description?: string;
  gameType: string;
  entryFee: number;
  prizePool: number;
  startTime: string;
  registrationDeadline?: string;
  participants: number;
  maxParticipants: number;
  status: 'upcoming' | 'registration_open' | 'active' | 'live' | 'completed' | 'cancelled';
  isJoined?: boolean;
  winners?: { rank: number; username: string }[];
}

export interface PrizeDistribution {
  rank: string;
  prize: number;
  color: string;
  bg: string;
}
