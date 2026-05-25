export type MatchmakingMode = 'bot' | 'quick_match' | 'challenge';

export interface JoinQueueRequest {
  gameType: 'tictactoe';
  stake: number;
  mode: 'quick_match';
}

export interface JoinQueueResponse {
  status: 'waiting' | 'matched';
  matchId?: string;
}

export interface OpenMatch {
  id: string;
  gameType: 'tictactoe';
  stake: number;
  player: {
    id: string;
    username: string;
    tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    rank?: number;
  };
}

export interface AcceptOpenMatchRequest {
  queueId: string;
}

export interface AvailablePlayer {
  id: string;
  username: string;
  tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  rank?: number;
  preferredStake?: number;
  status?: 'online' | 'in_match' | 'away';
}

export interface ChallengePlayerRequest {
  gameType: 'tictactoe';
  stake: number;
  opponentId: string;
}

export interface ChallengePlayerResponse {
  status: 'pending' | 'matched';
  challengeId?: string;
  matchId?: string;
}

export interface IncomingChallenge {
  id: string;
  gameType: 'tictactoe';
  stake: number;
  challenger: {
    id: string;
    username: string;
    tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    rank?: number;
  };
}
